# SnapSell – Vercel + Supabase Kurulum (Adım Adım)

- **Frontend + API:** Vercel (aynı origin’de `/api/*` route’ları)
- **Veritabanı:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (e-posta + şifre)

Detaylı kontrol listesi: **SUPABASE_SETUP.md**

---

## 1. Supabase veritabanını hazırlayın

1. [supabase.com](https://supabase.com) → Giriş → **New Project**.
2. **SQL Editor** → `supabase/migrations/` altındaki dosyaları sırayla çalıştırın (veya `supabase db push`).
3. **Settings → API**:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY` ve `VITE_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (sadece sunucu; gizli)

---

## 2. Frontend + API’yi Vercel’de deploy edin

1. [vercel.com](https://vercel.com) → Proje ekleyin.
2. **Build Command:** `npm run build`
3. **Output Directory:** `saas-design-extracted/dist`
4. **Environment Variables:** `.env.example` ile hizalayın (`SUPABASE_*`, `VITE_SUPABASE_*`, `ADMIN_*`, vb.)

---

## 3. config.json (opsiyonel)

API adresini runtime’da değiştirmek için `public/config.json` içinde `apiUrl` kullanılabilir. Varsayılan boş = aynı origin.

---

## 4. Supabase Auth

**Authentication → Providers:** Email açık olsun.  
**Authentication → URL Configuration:** Site URL ve redirect URL’leriniz (Vercel domain) tanımlı olsun.

---

## 5. Kontrol

- Site açılıyor, `/login` ile kayıt / giriş yapılabiliyor.
- **Hesap Ayarları** ve API çağrıları çalışıyorsa Supabase bağlantısı tamamdır.
