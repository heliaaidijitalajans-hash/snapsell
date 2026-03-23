# SnapSell – Yayına Alma Rehberi

**Önerilen yapı:** Frontend + API **Vercel** (aynı origin’de `/api/*`), Veritabanı ve giriş **Supabase**.  
Adım adım kurulum için **[KURULUM.md](./KURULUM.md)**, **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** ve **[VERCEL-API.md](./VERCEL-API.md)** dosyalarını takip edin.

---

## Backend artık Vercel’de (Railway kullanılmıyor)

- API istekleri **aynı origin** üzerinden `/api/...` yapılır (örn. `fetch("/api/plans")`).
- Vercel’de repo kökünde `api/[[...path]].js` tüm `/api/*` isteklerini `server.js` Express uygulamasına iletir.
- **Root Directory** repo kökü olmalı; **Environment Variables** (Supabase, Admin vb.) Vercel’e ekleyin.

İsteğe bağlı: `dist/config.json` içinde `apiUrl` ile ayrı bir API adresi belirtebilirsiniz.

---

## Yöntem 1: Vercel ile yayına almak (önerilen)

Frontend ve API aynı Vercel projesinde; `/api/*` istekleri `api/[[...path]].js` ile `server.js`’e gider.

### 1. Vercel’e deploy

1. [vercel.com](https://vercel.com) → GitHub ile giriş → **Add New → Project** → `snapsell-app`.
2. **Root Directory:** boş (repo kökü).
3. **Build Command:** `npm run build`, **Output Directory:** `saas-design-extracted/dist`.
4. **Environment Variables:** `.env` içeriğini ekleyin (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FIREBASE_SERVICE_ACCOUNT_JSON, PUBLIC_APP_URL, ADMIN_PASSWORD vb.).
5. **Deploy** çalıştırın. Site ve API aynı domain’de çalışır.

### 2. Custom domain (snapsell.website)

1. Vercel’de proje → **Settings → Domains** → domain ekleyin.
2. DNS’te CNAME veya A kaydı ile Vercel’e yönlendirin (Vercel’in verdiği değer).

### 3. Supabase Auth

- **Supabase Dashboard** → **Authentication** → **URL Configuration** → Site URL ve redirect URL’lerde Vercel domain’iniz olsun.

### 5. Sonuç

- Önerilen: API + frontend aynı Vercel projesinde (`/api/*` + statik build).
- CORS için `ALLOWED_ORIGINS` gerekli.
- Giriş ve veritabanı **Supabase**; Firebase kullanılmaz.

---

## Yöntem 2: Render ile yayına almak

1. [render.com](https://render.com) → **New** → **Web Service**.
2. Repo’yu bağlayın.
3. **Build Command:** `npm install`
4. **Start Command:** `npm start` veya `node server.js`
5. **Environment** içine `.env` değişkenlerini ekleyin.
6. **Custom Domain** ile `snapsell.website` ekleyin ve DNS’te CNAME’i Render’ın verdiği adrese yönlendirin.

Mantık Railway ile aynı: Tüm trafik (API + sayfalar) Render’daki Node’a gider.

---

## Yöntem 3: Statik hosting + API ayrı

Frontend’i başka bir statik host’ta tutup API’yi Vercel’de bırakmak isterseniz: `config.json` veya `VITE_API_BASE` ile API base URL’ini Vercel adresinize ayarlayın.

---

## Kısa özet

| Bileşen           | Nerede / Ne |
|-------------------|--------------|
| Frontend + API    | **Vercel**. Statik build + `/api/*` aynı origin’de. |
| Veritabanı        | **Supabase** (PostgreSQL). Kullanıcılar, kredi, plan. |
| Giriş (Auth)      | **Supabase Auth** (e-posta + şifre). |

**Önerilen:** Frontend + API → Vercel, Database → Supabase. Kurulum: [KURULUM.md](./KURULUM.md), [VERCEL-API.md](./VERCEL-API.md).
