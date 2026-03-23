-- Kutuphane: gorsel metadata + Storage bucket (Dashboard'da Storage'i da acin)

-- 1) Tablo
create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  image_url text not null,
  created_at timestamptz not null default now(),
  source text,
  prompt text
);

create index if not exists images_user_created_idx on public.images (user_id, created_at desc);

alter table public.images enable row level security;

drop policy if exists "images_select_own" on public.images;
create policy "images_select_own"
on public.images
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "images_insert_own" on public.images;
create policy "images_insert_own"
on public.images
for insert
to authenticated
with check (auth.uid() = user_id);

comment on table public.images is 'Uretilen gorseller (kutuphane).';

-- 2) Storage bucket (public okuma)
insert into storage.buckets (id, name, public)
values ('generated-images', 'generated-images', true)
on conflict (id) do update set public = excluded.public;

-- Herkes okuyabilsin (public bucket)
drop policy if exists "generated_images_public_read" on storage.objects;
create policy "generated_images_public_read"
on storage.objects
for select
to public
using (bucket_id = 'generated-images');

-- Oturum acmis kullanici kendi klasorune yuklesin: {uid}/...
drop policy if exists "generated_images_authenticated_upload_own" on storage.objects;
create policy "generated_images_authenticated_upload_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'generated-images'
  and split_part(name, '/', 1) = auth.uid()::text
);
