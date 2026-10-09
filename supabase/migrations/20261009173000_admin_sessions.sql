create table if not exists public.admin_sessions (
  session_hash text primary key,
  username     text not null,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null
);

create index if not exists admin_sessions_expires_idx on public.admin_sessions (expires_at);
alter table public.admin_sessions enable row level security;
grant all on public.admin_sessions to service_role;
revoke all on public.admin_sessions from anon, authenticated;
