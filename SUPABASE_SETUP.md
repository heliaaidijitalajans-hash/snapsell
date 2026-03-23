# Supabase kurulumu (SnapSell)

Bu projeyi hatasiz calistirmak icin asagidaki adimlari uygulayin.

## 1. Ortam degiskenleri

Kok `.env` dosyanizi `.env.example` ile eslestirin:

| Degisken | Nerede |
|----------|--------|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Sunucu (`server.js`, Vercel API) |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Frontend build (Vite) — **degistiginde `npm run build` tekrar** |

**Onemli:** `SUPABASE_SERVICE_ROLE_KEY` sadece sunucuda tutulur; frontend bundle'a koymayin.

## 2. Veritabani migrasyonlari

Supabase Dashboard > SQL Editor veya `supabase db push` ile siralama:

1. `supabase/migrations/001_create_users.sql`
2. `002_create_plans.sql`
3. `003_create_login_logs.sql`
4. `004_create_images_and_storage.sql`
5. `005_auth_user_profile_trigger.sql`

Hata alirsaniz: onceki migrasyonlar zaten uygulanmissa, sadece eksik sutun/policy satirlarini tek tek calistirin.

## 3. Auth (Dashboard)

Authentication > Providers: **Email** acik olsun (email + sifre).

Authentication > URL Configuration: sitenizin URL'leri (or. `https://snapsell.website`) **Site URL** ve **Redirect URLs** listesinde olsun.

## 4. Storage

`004_create_images_and_storage.sql` bucket `generated-images` olusturur. Calismadiysa: Storage > New bucket > adi `generated-images`, public okuma istiyorsaniz public secin; ardindan SQL dosyasindaki policy satirlarini calistirin.

## 5. Dogrulama listesi

- [ ] `.env` dolu, frontend icin `VITE_*` ile build alindi
- [ ] Migrasyonlar uygulandi, `users` + `images` + trigger calisiyor
- [ ] Sunucu logunda `Supabase hazir.` gorunuyor (`SUPABASE_SERVICE_ROLE_KEY` eksikse Supabase devre disi kalir)
