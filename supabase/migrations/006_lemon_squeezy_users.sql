-- Lemon Squeezy abonelik alanları (users)
-- Supabase SQL Editor veya: supabase db push

alter table public.users
  add column if not exists subscription_id text,
  add column if not exists subscription_status text;

comment on column public.users.subscription_id is 'Lemon Squeezy subscription id';
comment on column public.users.subscription_status is 'active | cancelled (Lemon abonelik durumu)';
