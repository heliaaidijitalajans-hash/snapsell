# SnapSell – Railway + Vercel + Firebase + Supabase Kurulum Kontrol Listesi

Tüm sistemin hatasız çalışması için aşağıdaki adımları sırayla tamamlayın.

---

## 1. Supabase (Veritabanı)

- [ ] [supabase.com](https://supabase.com) → Proje oluştur (veya mevcut proje)
- [ ] **Settings → API**: `Project URL` ve `service_role` (secret) key’i kopyala
- [ ] **SQL Editor** → `supabase/migrations/001_create_users.sql` içeriğini yapıştır → **Run**
- [ ] **SQL Editor** → `supabase/migrations/002_create_plans.sql` içeriğini yapıştır → **Run**
- [ ] `002_create_plans.sql` örnek plan satırları ekler (Ücretsiz, Aylık, Yıllık vb.)
- [ ] **Users tablosu için:** Supabase **Settings → API** → **service_role** (secret) key’i kopyalayıp `.env` ve Railway’e `SUPABASE_SERVICE_ROLE_KEY` olarak ekleyin. Detay: **SUPABASE-SERVICE-ROLE-ADIM.md**

---

## 2. Railway (Backend)

- [ ] [railway.app](https://railway.app) → GitHub ile giriş → Repo: `snapsell-app`
- [ ] **Settings**: Build Command boş veya `npm install`, Start Command: `npm start`
- [ ] **Variables** – proje kökündeki `.env` dosyasındaki tüm değişkenleri Railway’e tek tek kopyalayın (özellikle `FIREBASE_SERVICE_ACCOUNT_JSON` tek satır olmalı). Özet:

| Değişken | Örnek / Açıklama |
|----------|-------------------|
| `PORT` | Railway otomatik verir (ekleme) |
| `NODE_ENV` | `production` |
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key (veya `SUPABASE_ANON_KEY`) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase service account JSON (tek satır) |
| `ALLOWED_ORIGINS` | `https://snapsell-one.vercel.app` (Vercel domain’in) |
| `PUBLIC_APP_URL` | `https://snapsell-one.vercel.app` |
| `APP_DOMAIN` | `https://snapsell-one.vercel.app` |
| `ADMIN_PASSWORD` | Güçlü admin şifresi |
| `ADMIN_EMAIL` | Admin e-posta (Firebase’deki admin ile aynı) |
| `OPENAI_API_KEY` | `sk-...` (gerekirse) |

- [ ] **Deploy** tetikle → **Settings → Networking → Generate Domain** → URL’i kopyala (örn. `https://snapsell-production.up.railway.app`)

---

## 3. Vercel (Frontend)

- [ ] [vercel.com](https://vercel.com) → GitHub ile giriş → **Add New → Project** → `snapsell-app`
- [ ] **Root Directory**: `saas-design-extracted` seç (veya boş bırakıp build/output’u buna göre ayarla)
- [ ] **Build Command**: `npm run build`
- [ ] **Output Directory**: `dist`
- [ ] **Environment Variables**:
  - `VITE_API_URL` = Railway backend URL’i (örn. `https://snapsell-production.up.railway.app`) – **sonda `/` olmasın**
- [ ] Deploy → Vercel domain’ini not et (örn. `https://snapsell-one.vercel.app`)

**config.json (opsiyonel):** `saas-design-extracted/public/config.json` içinde `apiUrl` alanı Railway URL’ine ayarlı olabilir. Build’de `public` kopyalandığı için production’da bu URL kullanılır; böylece `VITE_API_URL` sadece build zamanı yedek olur.

---

## 4. Firebase (Sadece Auth)

- [ ] [Firebase Console](https://console.firebase.google.com) → Proje: `snapsellapp-6649a`
- [ ] **Authentication → Sign-in method**: Google etkin
- [ ] **Authentication → Settings → Authorized domains** → **Add domain**
  - `snapsell-one.vercel.app` (Vercel domain’in)
  - `snapsell-production.up.railway.app` (Railway domain’i, isteğe bağlı)
- [ ] **Project settings → Service accounts** → JSON indir → içeriği tek satır yapıp Railway’de `FIREBASE_SERVICE_ACCOUNT_JSON` olarak yapıştır

---

## 5. Son Kontroller

- [ ] Railway deploy log’unda hata yok, “SnapSell API: http://localhost:…” veya “Supabase hazir.” görünüyor
- [ ] Tarayıcıda `https://snapsell-production.up.railway.app/ping` → `OK` dönüyor
- [ ] Vercel’de `https://snapsell-one.vercel.app` açılıyor
- [ ] Fiyatlandırma sayfası (`/fiyatlandirma`) yükleniyor; konsolda CORS hatası yok
- [ ] Google ile giriş denendi; Firebase “domain not authorized” hatası yok

---

## Özet Mimari

| Bileşen | Servis | Rol |
|--------|--------|-----|
| Frontend | **Vercel** | React uygulaması; API istekleri Railway’e gider |
| Backend | **Railway** | Node (server.js); CORS, Supabase, Firebase Auth |
| Veritabanı | **Supabase** | `users`, `plans` tabloları |
| Auth | **Firebase** | Google ile giriş; token doğrulama backend’de |

API adresi: Frontend `getApiBase()` ile alır; önce `/config.json` (runtime), yoksa build’deki `VITE_API_URL` kullanılır.
