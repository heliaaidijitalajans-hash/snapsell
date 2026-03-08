# SnapSell – Yayına Alma Rehberi

**Önerilen yapı:** Frontend + API **Vercel** (aynı origin’de `/api/*`), Veritabanı **Supabase**, Giriş **Firebase (Google)**.  
Adım adım kurulum için **[KURULUM.md](./KURULUM.md)** ve **[VERCEL-API.md](./VERCEL-API.md)** dosyalarını takip edin.

---

## Backend artık Vercel’de (Railway kullanılmıyor)

- API istekleri **aynı origin** üzerinden `/api/...` yapılır (örn. `fetch("/api/plans")`).
- Vercel’de repo kökünde `api/[[...path]].js` tüm `/api/*` isteklerini `server.js` Express uygulamasına iletir.
- **Root Directory** repo kökü olmalı; **Environment Variables** (Supabase, Firebase, Admin vb.) Vercel’e ekleyin.

**Firebase Hosting kullanıyorsanız:** `dist/config.json` içinde `apiUrl` ile ayrı bir backend adresi belirtebilirsiniz (örn. Vercel API URL’i).

---

## Önemli: Firebase Hosting API çalıştırmaz

**Firebase Hosting** yalnızca **statik dosyaları** (HTML, JS, CSS, resim) sunar. **Node.js / Express çalıştıramaz.**

SnapSell’in çalışması için:

- **API** (`/api/config`, `/api/auth/google`, `/api/credits` vb.) → **Node (server.js)** gerekir.
- **Firebase Auth** (Google ile giriş) → Hem tarayıcıda hem de sunucuda çalışır; **hosting nerede olursa olsun** kullanılabilir.

Yani:

- **Firebase Hosting** = Sadece statik site (auth.html, login.html, dashboard build). Burada **/api/** istekleri 404 verir, çünkü sunucuda Node yok.
- **Backend (API)** = Mutlaka **Node’un çalıştığı bir yerde** (Railway, Render, VPS, Cloud Run vb.) olmalı.

**Önerilen yol:** Tüm uygulamayı (Node + statik dosyalar) **tek bir yerde** çalıştırın (örn. Railway). Domain’i oraya verin. Firebase’i sadece **Auth ve Admin SDK** için kullanmaya devam edin; **hosting’i Firebase’e yapmayın**.

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

### 3. Firebase tarafı

- **Firebase Console** → **Authentication** → **Authorized domains** → Vercel domain’inizi ekleyin.

### 5. Sonuç

- Backend API: `https://snapsell.website` → Railway’deki Node (server.js).
- Frontend ayrı deploy edilir; CORS için `ALLOWED_ORIGINS` gerekli.
- Firebase sadece Auth (Google giriş) için kullanılır; veritabanı Supabase’tedir; hosting Vercel’dedir.

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

## Yöntem 3: Firebase Hosting’i kullanmak istiyorsanız (API ayrı)

Sadece arayüzü Firebase Hosting’de, API’yi Vercel’de tutmak isterseniz: Frontend’i Firebase’e deploy edin; `config.json` veya `VITE_API_URL` ile API adresini Vercel URL’inize ayarlayın.

---

## Kısa özet

| Bileşen           | Nerede / Ne |
|-------------------|--------------|
| Frontend + API    | **Vercel**. Statik build + `/api/*` aynı origin’de. |
| Veritabanı        | **Supabase** (PostgreSQL). Kullanıcılar, kredi, plan. |
| Giriş (Auth)      | **Firebase** (Google). Token doğrulama backend’de. |

**Önerilen:** Frontend + API → Vercel, Database → Supabase. Kurulum: [KURULUM.md](./KURULUM.md), [VERCEL-API.md](./VERCEL-API.md).
