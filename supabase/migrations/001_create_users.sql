-- SnapSell: users tablosu (Supabase Auth + anonim session satirlari)
-- Supabase SQL Editor veya: supabase db push

create table if not exists public.users (
  id uuid primary key,
  email text,
  display_name text,
  plan text not null default 'free',
  credits integer not null default 100,
  total_conversions integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists users_email_unique_idx on public.users (lower(email));

alter table public.users
  add column if not exists subscription_start timestamptz,
  add column if not exists subscription_end timestamptz,
  add column if not exists updated_at timestamptz,
  add column if not exists next_refill_at timestamptz,
  add column if not exists months_refilled integer not null default 0;

alter table public.users enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
on public.users
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

comment on table public.users is 'SnapSell kullanici profilleri (kredi, plan). Service role backend insert/update yapar.';
