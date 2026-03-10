-- SnapSell: Kullanıcı giriş kayıtları (dosya + veritabanı; admin panelde listelenir)
-- Supabase SQL Editor'da veya CLI ile çalıştırın: supabase db push

create table if not exists public.login_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  email text,
  display_name text,
  logged_at timestamptz not null default now()
);

create index if not exists idx_login_logs_logged_at on public.login_logs (logged_at desc);
create index if not exists idx_login_logs_user_id on public.login_logs (user_id);

alter table public.login_logs enable row level security;

comment on table public.login_logs is 'SnapSell kullanıcı giriş kayıtları (Google ile giriş).';
