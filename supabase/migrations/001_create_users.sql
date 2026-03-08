-- SnapSell: users tablosu (Firestore users koleksiyonunun karşılığı)
-- Supabase SQL Editor'da veya CLI ile çalıştırın: supabase db push

create table if not exists public.users (
  id text primary key,
  email text,
  display_name text,
  plan text not null default 'free',
  credits integer not null default 30,
  total_conversions integer not null default 0,
  created_at timestamptz not null default now()
);

-- RLS açık, politika yok: sadece service_role (backend) erişir. İstemci erişemez.
alter table public.users enable row level security;

comment on table public.users is 'SnapSell kullanıcı profilleri (kredi, plan, dönüşüm). Auth Firebase üzerinden.';
