# SnapSell – Vercel + Supabase Kurulum (Adım Adım)

- **Frontend + API:** Vercel (aynı origin’de `/api/*` route’ları)
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

## 2. Frontend + API’yi Vercel’de deploy edin

1. [vercel.com](https://vercel.com) → GitHub ile giriş → **Add New** → **Project** → `snapsell-app` reposunu seçin.
2. **Root Directory:** boş (repo kökü; `server.js` ve `api/` burada olmalı).
3. **Build Command:** `npm run build` (varsayılan).
4. **Output Directory:** `saas-design-extracted/dist`.
5. **Environment Variables** ekleyin (Supabase, Firebase, Admin vb. – aynı proje kökündeki `.env` değişkenleri):
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `ADMIN_PASSWORD`, `PUBLIC_APP_URL`, `OPENAI_API_KEY` vb.
6. **Deploy** edin. API istekleri aynı origin’de `/api/*` olarak çalışır (CORS gerekmez).

---

## 3. config.json (opsiyonel)

API adresini runtime’da değiştirmek isterseniz `public/config.json` içinde `apiUrl` kullanılabilir. Varsayılan boş = aynı origin (`/api/...`).

---

## 4. Firebase Console’da domain’i yetkilendirin

- [Firebase Console](https://console.firebase.google.com) → Projeniz → **Authentication** → **Authorized domains**
- Vercel domain’inizi ekleyin (örn. `snapsell-app.vercel.app`).

---

## 5. Kontrol

- Tarayıcıda Vercel URL’inizi açın.
- Google ile giriş yapın; **Hesap Ayarları** sayfası açılıyorsa backend + Supabase’e bağlanıyorsunuz demektir.

---

## Özet

| Bileşen      | Nerede / Ne yapılır |
|-------------|----------------------|
| Veritabanı  | Supabase: `users` tablosu (migration SQL çalıştırın) |
| Backend API | Vercel’de `/api/*` (aynı origin) |
| Frontend    | Vercel’de deploy; API aynı origin’de |
| Auth        | Firebase (Google); Authorized domains’e Vercel domain ekleyin |

---

API adresini değiştirmek isterseniz **config.json** veya **VITE_API_URL** ile override edebilirsiniz.
