# SnapSell – Vercel + Firebase + Supabase Kurulum Kontrol Listesi

Tüm sistemin hatasız çalışması için aşağıdaki adımları sırayla tamamlayın. **Backend artık Railway’de değil; Vercel’de `/api/*` route’ları ile aynı origin’de çalışır.**

---

## 1. Supabase (Veritabanı)

- [ ] [supabase.com](https://supabase.com) → Proje oluştur (veya mevcut proje)
- [ ] **Settings → API**: `Project URL` ve `service_role` (secret) key’i kopyala
- [ ] **SQL Editor** → `supabase/migrations/001_create_users.sql` içeriğini yapıştır → **Run**
- [ ] **SQL Editor** → `supabase/migrations/002_create_plans.sql` içeriğini yapıştır → **Run**
- [ ] **Users tablosu için:** Supabase **Settings → API** → **service_role** key’i kopyalayıp `.env` ve Vercel Environment Variables’a `SUPABASE_SERVICE_ROLE_KEY` olarak ekleyin. Detay: **SUPABASE-SERVICE-ROLE-ADIM.md**

---

## 2. Vercel (Frontend + API)

- [ ] [vercel.com](https://vercel.com) → GitHub ile giriş → **Add New → Project** → `snapsell-app`
- [ ] **Root Directory**: boş (repo kökü; `server.js`, `api/`, `saas-design-extracted` burada olmalı)
- [ ] **Build Command**: `npm run build`
- [ ] **Output Directory**: `saas-design-extracted/dist`
- [ ] **Environment Variables** – proje kökündeki `.env` değişkenlerini ekleyin:

| Değişken | Açıklama |
|----------|----------|
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase service account JSON (tek satır) |
| `PUBLIC_APP_URL` | Vercel domain’iniz (örn. `https://snapsell-one.vercel.app`) |
| `APP_DOMAIN` | Aynı |
| `ADMIN_PASSWORD` | Güçlü admin şifresi |
| `ADMIN_EMAIL` | Admin e-posta |
| `OPENAI_API_KEY` | (gerekirse) |

- [ ] Deploy → Vercel domain’ini not et. API istekleri `/api/plans`, `/api/register` vb. aynı origin’de gider.

---

## 3. Firebase (Sadece Auth)

- [ ] [Firebase Console](https://console.firebase.google.com) → Projeniz
- [ ] **Authentication → Sign-in method**: Google etkin
- [ ] **Authentication → Settings → Authorized domains** → Vercel domain’inizi ekleyin
- [ ] **Project settings → Service accounts** → JSON indir → tek satır yapıp Vercel’de `FIREBASE_SERVICE_ACCOUNT_JSON` olarak yapıştırın

---

## 4. Son Kontroller

- [ ] Vercel’de site açılıyor
- [ ] Fiyatlandırma sayfası (`/fiyatlandirma`) yükleniyor; konsolda CORS hatası yok
- [ ] Google ile giriş çalışıyor; Firebase “domain not authorized” hatası yok

---

## Özet Mimari

| Bileşen | Servis | Rol |
|--------|--------|-----|
| Frontend + API | **Vercel** | React + `/api/*` (server.js); aynı origin |
| Veritabanı | **Supabase** | `users`, `plans` tabloları |
| Auth | **Firebase** | Google ile giriş; token doğrulama backend’de |

API adresi varsayılan olarak aynı origin (`/api/...`). İsteğe bağlı: `config.json` veya `VITE_API_URL` ile override.
