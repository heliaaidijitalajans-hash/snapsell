-- SnapSell: Fiyatlandırma sayfası için plans tablosu
-- Supabase SQL Editor'da çalıştırın veya: supabase db push

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price text,
  credits integer,
  description text,
  created_at timestamptz default now()
);

alter table public.plans enable row level security;

-- Backend (anon veya service_role) plans tablosunu okuyabilsin
create policy "Plans public read" on public.plans for select using (true);

comment on table public.plans is 'SnapSell planlari (fiyatlandirma sayfasi).';

-- Örnek veri (tekrar çalıştırırsanız aynı isimle eklenmez)
insert into public.plans (name, price, credits, description) values
  ('Ücretsiz', '0', 30, '3 dönüşüm, temel özellikler'),
  ('Aylık', '40', 300, '30 dönüşüm'),
  ('Aylık Pro', '65', 800, '80 dönüşüm'),
  ('Yıllık', '440', 12000, '1200 dönüşüm')
on conflict (name) do nothing;
