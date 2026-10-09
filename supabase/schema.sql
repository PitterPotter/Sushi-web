-- Kaiseki Sushi — reservation system schema
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query).

-- ---------------------------------------------------------------------------
-- Settings
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  key   text primary key,
  value jsonb not null
);

insert into public.settings (key, value) values
  ('capacity', '12'),
  ('seatings', '["17:30", "20:30"]'),
  ('closed_weekdays', '[0, 1]')               -- 0 = Sunday, 1 = Monday
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Reservations
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.reservation_status as enum ('pending', 'confirmed', 'declined', 'cancelled', 'seated', 'no_show');
exception when duplicate_object then null; end $$;

create table if not exists public.reservations (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  email       text not null,
  phone       text not null,
  guests      int  not null check (guests between 1 and 6),
  date        date not null,
  seating     time not null,
  preference  text,
  menu        text,
  notes       text,
  status      public.reservation_status not null default 'pending',
  admin_notes text
);

create index if not exists reservations_date_idx on public.reservations (date, seating);
create index if not exists reservations_status_idx on public.reservations (status);

-- ---------------------------------------------------------------------------
-- Contact messages
-- ---------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name       text not null,
  email      text not null,
  subject    text not null,
  message    text not null,
  read       boolean not null default false
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Public (anon) users cannot read or write tables directly; they go through
-- the RPC functions below. Authenticated users (admins) have full access.
-- ---------------------------------------------------------------------------
alter table public.settings         enable row level security;
alter table public.reservations     enable row level security;
alter table public.contact_messages enable row level security;

create policy "admins full access to settings"
  on public.settings for all to authenticated using (true) with check (true);

create policy "admins full access to reservations"
  on public.reservations for all to authenticated using (true) with check (true);

create policy "admins full access to contact messages"
  on public.contact_messages for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Public RPC: availability for a given date
-- Returns each seating with seats remaining. Blocked statuses don't count.
-- ---------------------------------------------------------------------------
create or replace function public.get_availability(p_date date)
returns table (seating time, capacity int, booked int, remaining int, closed boolean)
language sql
security definer
set search_path = public
stable
as $$
  with cfg as (
    select
      (select (value)::int from settings where key = 'capacity') as capacity,
      (select value from settings where key = 'seatings') as seatings,
      (select value from settings where key = 'closed_weekdays') as closed_weekdays
  ),
  seats as (
    select (s)::time as seating from cfg, jsonb_array_elements_text(cfg.seatings) as s
  ),
  booked as (
    select r.seating, coalesce(sum(r.guests), 0)::int as booked
    from reservations r
    where r.date = p_date and r.status in ('pending', 'confirmed', 'seated')
    group by r.seating
  )
  select
    seats.seating,
    cfg.capacity,
    coalesce(booked.booked, 0) as booked,
    greatest(cfg.capacity - coalesce(booked.booked, 0), 0) as remaining,
    (cfg.closed_weekdays @> to_jsonb(extract(dow from p_date)::int)) or p_date < current_date as closed
  from seats cross join cfg
  left join booked on booked.seating = seats.seating
  order by seats.seating;
$$;

grant execute on function public.get_availability(date) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Public RPC: create a reservation (capacity enforced atomically)
-- ---------------------------------------------------------------------------
create or replace function public.create_reservation(
  p_name text, p_email text, p_phone text, p_guests int,
  p_date date, p_seating time, p_preference text default null,
  p_menu text default null, p_notes text default null
)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_avail record;
  v_row   public.reservations;
begin
  if p_guests < 1 or p_guests > 6 then
    raise exception 'Parties must be between 1 and 6 guests.' using errcode = 'P0001';
  end if;

  -- Serialise bookings for the same date/seating so two people can't take the last seats at once.
  perform pg_advisory_xact_lock(hashtext(p_date::text || p_seating::text));

  select * into v_avail from public.get_availability(p_date) a where a.seating = p_seating;

  if not found then
    raise exception 'That seating does not exist.' using errcode = 'P0001';
  end if;
  if v_avail.closed then
    raise exception 'We are closed on that date.' using errcode = 'P0001';
  end if;
  if v_avail.remaining < p_guests then
    raise exception 'Only % seat(s) remain for this seating.', v_avail.remaining using errcode = 'P0001';
  end if;

  insert into public.reservations (name, email, phone, guests, date, seating, preference, menu, notes)
  values (trim(p_name), lower(trim(p_email)), trim(p_phone), p_guests, p_date, p_seating,
          nullif(p_preference, ''), nullif(p_menu, ''), nullif(p_notes, ''))
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.create_reservation(text, text, text, int, date, time, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Public RPC: submit a contact message
-- ---------------------------------------------------------------------------
create or replace function public.submit_contact(
  p_name text, p_email text, p_subject text, p_message text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  if length(trim(p_message)) < 2 then
    raise exception 'Message is too short.' using errcode = 'P0001';
  end if;
  insert into public.contact_messages (name, email, subject, message)
  values (trim(p_name), lower(trim(p_email)), trim(p_subject), trim(p_message))
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.submit_contact(text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admin RPC: dashboard stats
-- ---------------------------------------------------------------------------
create or replace function public.admin_stats()
returns jsonb
language sql
security invoker
set search_path = public
stable
as $$
  select jsonb_build_object(
    'tonight_covers', (select coalesce(sum(guests), 0) from reservations where date = current_date and status in ('pending', 'confirmed', 'seated')),
    'tonight_parties', (select count(*) from reservations where date = current_date and status in ('pending', 'confirmed', 'seated')),
    'week_covers', (select coalesce(sum(guests), 0) from reservations where date between current_date and current_date + 6 and status in ('pending', 'confirmed', 'seated')),
    'pending', (select count(*) from reservations where status = 'pending' and date >= current_date),
    'unread_messages', (select count(*) from contact_messages where read = false)
  );
$$;

grant execute on function public.admin_stats() to authenticated;
