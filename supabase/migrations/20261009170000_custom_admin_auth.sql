drop policy if exists "admins full access to settings" on public.settings;
drop policy if exists "admins full access to reservations" on public.reservations;
drop policy if exists "admins full access to contact messages" on public.contact_messages;

grant all on public.settings, public.reservations, public.contact_messages to service_role;

create table if not exists public.admin_login_attempts (
  id         uuid primary key default gen_random_uuid(),
  ip_hash    text not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_login_attempts_ip_created_idx on public.admin_login_attempts (ip_hash, created_at);
alter table public.admin_login_attempts enable row level security;
grant all on public.admin_login_attempts to service_role;
revoke all on public.admin_login_attempts from anon, authenticated;

revoke execute on function public.admin_stats() from anon, authenticated;
grant execute on function public.admin_stats() to service_role;
