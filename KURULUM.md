# SnapSell – Vercel + Railway + Supabase Kurulum (Adım Adım)

- **Frontend:** Vercel (veya Firebase Hosting)
- **Backend:** Railway
- **Veritabanı:** Supabase (PostgreSQL)
- **Auth:** Firebase (Google ile giriş; sadece token doğrulama)

---

## 1. Supabase veritabanını hazırlayın

1. [supabase.com](https://supabase.com) → Giriş → **New Project** (organizasyon + proje adı, şifre).
2. Proje açıldıktan sonra **SQL Editor** → **New query**.
3. `supabase/migrations/001_create_users.sql` içeriğini yapıştırıp **Run** ile çalıştırın (veya Supabase CLI ile `supabase db push`).
4. **Settings → API** bölümünden kopyalayın:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** (anon değil!) → `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. Backend’i (server.js) Railway’de çalıştırın

1. [railway.app](https://railway.app) → Giriş → **New Project** → **Deploy from GitHub repo** → `snapsell-app` seçin.
2. **Settings**:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start` veya `node server.js`
   - **Root Directory:** boş
3. **Variables** sekmesine şunları ekleyin:
   - `ALLOWED_ORIGINS` = `https://snapsell-app.vercel.app` (Vercel adresiniz; virgülle birden fazla ekleyebilirsiniz)
   - `FIREBASE_SERVICE_ACCOUNT_JSON` = (Firebase Console → Project settings → Service accounts → JSON’u tek satır yapıştırın)
   - `SUPABASE_URL` = (Supabase Project URL)
   - `SUPABASE_SERVICE_ROLE_KEY` = (Supabase service_role key)
   - `ADMIN_PASSWORD` = (güçlü bir şifre)
   - `OPENAI_API_KEY` = (OpenAI’dan alın)
   - `PUBLIC_APP_URL` = `https://snapsell-app.vercel.app` (frontend adresi)
   - `APP_DOMAIN` = `https://snapsell-app.vercel.app`
4. **Deploy** edin. Railway size bir URL verir (örn. `https://snapsell-app-production-xxxx.up.railway.app`). Bu adresi kopyalayın; **sonda `/` olmasın.**

---

## 3. Frontend’i Vercel’de deploy edin

1. [vercel.com](https://vercel.com) → GitHub ile giriş → **Add New** → **Project** → `snapsell-app` reposunu seçin.
2. **Root Directory:** boş (kök dizin).
3. **Build Command:** `npm run build` (varsayılan kalabilir).
4. **Output Directory:** `dist`.
5. **Environment Variables** ekleyin:
   - `VITE_API_URL` = Railway backend URL’iniz (örn. `https://snapsell-app-production-xxxx.up.railway.app`) — sonda `/` yok.
6. **Deploy** edin. Vercel size bir URL verir (örn. `https://snapsell-app.vercel.app`).
7. Railway **Variables** içinde `ALLOWED_ORIGINS`’e bu Vercel URL’ini ekleyin (virgülle ayırarak).

---

## 4. config.json (opsiyonel – runtime API adresi)

Build sonrası API adresini değiştirmek isterseniz:

- `dist/config.json` içeriği: `{ "apiUrl": "https://your-backend.railway.app" }`
- Vercel’de bu dosyayı build çıktısında tutmak için proje kökünde `public/config.json` (veya build sonrası `dist/config.json`) kullanılabilir; frontend `config.json`’dan API URL’ini okuyabilir.

---

## 5. Firebase Console’da domain’i yetkilendirin

- [Firebase Console](https://console.firebase.google.com) → Projeniz → **Authentication** → **Authorized domains**
- Vercel domain’inizi ekleyin (örn. `snapsell-app.vercel.app`).
- İsterseniz Railway URL’inizi de ekleyin (örn. `xxxx.up.railway.app`).

---

## 6. Kontrol

- Tarayıcıda Vercel URL’inizi açın.
- Google ile giriş yapın; **Hesap Ayarları** sayfası açılıyorsa backend + Supabase’e bağlanıyorsunuz demektir.

---

## Özet

| Bileşen      | Nerede / Ne yapılır |
|-------------|----------------------|
| Veritabanı  | Supabase: `users` tablosu (migration SQL çalıştırın) |
| Backend API | Railway’de çalışır; URL’i kopyalayın |
| ALLOWED_ORIGINS | Vercel (ve varsa diğer) frontend adresleri (Railway Variables) |
| Frontend    | Vercel’de deploy; `VITE_API_URL` = Railway URL |
| Auth        | Firebase (Google); Authorized domains’e Vercel domain ekleyin |

---

Backend URL’i değişirse **Vercel Environment Variables** içinde `VITE_API_URL`’i güncelleyip **Redeploy** edin; veya `dist/config.json` ile runtime’da değiştirebilirsiniz.
