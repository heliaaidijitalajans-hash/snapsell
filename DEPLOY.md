# SnapSell – Yayına Alma Rehberi

**Önerilen yapı:** Frontend **Vercel**, Backend **Railway**, Veritabanı **Supabase**, Giriş **Firebase (Google)**.  
Adım adım kurulum için **[KURULUM.md](./KURULUM.md)** dosyasını takip edin.

---

## Backend’i deploy etmek (Railway)

1. **railway.app** → GitHub ile giriş.
2. **New Project** → **Deploy from GitHub repo** → `snapsell-app` reposunu seçin.
3. **Settings**:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start` (veya `node server.js`)
   - **Root Directory:** boş (kök dizin).
4. **Variables** sekmesinde şunları ekleyin:
   - `PORT` → Railway otomatik verir, eklemeniz gerekmez.
   - `NODE_ENV` = `production`
   - `PUBLIC_APP_URL` = `https://snapsell-app.vercel.app` (veya frontend adresiniz)
   - `APP_DOMAIN` = `https://snapsell-app.vercel.app`
   - `ALLOWED_ORIGINS` = `https://snapsell-app.vercel.app` (Vercel/frontend adresleri, virgülle)
   - `FIREBASE_SERVICE_ACCOUNT_JSON` = Firebase service account JSON (tek satır; sadece Google token doğrulama)
   - `SUPABASE_URL` = Supabase proje URL
   - `SUPABASE_SERVICE_ROLE_KEY` = Supabase service_role key (veritabanı erişimi)
   - `ADMIN_PASSWORD`, `ADMIN_EMAIL`, `OPENAI_API_KEY` vb. (`.env.example` ile aynı).
5. **Deploy** tetiklenir. **Settings → Networking → Generate Domain** ile `https://xxx.railway.app` alın.
6. Frontend’de (Vercel) **Environment Variable** olarak `VITE_API_URL` = bu Railway URL’i (sonda `/` yok).

**Alternatif: Render.com**  
[render.com](https://render.com) → **New → Web Service** → repo bağla → **Build:** `npm install`, **Start:** `npm start` → Environment’a `.env` değişkenlerini ekleyin. Mantık aynı.

---

## Frontend / Backend ayrımı

- **Backend (server.js)** sadece API sunar (`/api/*`, `/admin/*`). HTML veya statik dosya sunmaz.
- **Frontend** ayrı sunucuda çalışır (Vite, Firebase Hosting, Vercel vb.). API istekleri backend URL'ine gider. CORS için backend'de `ALLOWED_ORIGINS` ile frontend origin ekleyin.

**Vercel’e frontend deploy:** Proje ayarlarında **Environment Variables** → `VITE_API_URL` = Railway backend URL’i (sonda `/` yok). Build sırasında kullanılır.

**Firebase Hosting kullanıyorsanız:** `saas-design-extracted/.env` veya build komutu ile `VITE_API_URL=https://your-backend.railway.app` verin.

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

## Yöntem 1: Railway ile yayına almak (önerilen)

Railway’de Node çalışır; hem API hem de `public/` ve dashboard build’i aynı sunucudan sunulur.

### 1. Railway’e deploy

1. [railway.app](https://railway.app) → GitHub ile giriş.
2. **New Project** → **Deploy from GitHub repo** → `snapsell-app` reposunu seçin.
3. Projeyi seçin → **Settings**:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Root Directory:** boş (kök)
4. **Variables** sekmesinde `.env` içeriğinizi ekleyin: OPENAI_API_KEY, FIREBASE_SERVICE_ACCOUNT_JSON, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ALLOWED_ORIGINS, PUBLIC_APP_URL vb. (`.env.example` referans).
5. **Deploy** çalıştırın. Railway size `https://xxx.railway.app` gibi bir URL verir.

### 2. Custom domain (snapsell.website)

1. Railway’de proje → **Settings** → **Domains** → **Custom Domain**.
2. `snapsell.website` ve isterseniz `www.snapsell.website` ekleyin.
3. Railway’in verdiği CNAME / A kayıt bilgisini **Cloudflare (veya domain sağlayıcınız)** DNS’e ekleyin:
   - Örnek: `snapsell.website` → CNAME → `xxx.railway.app` (Railway’in söylediği değer).
4. **Cloudflare’de** turuncu bulut (proxy) açık kalabilir; Railway SSL ile uyumludur.

### 3. Ortam değişkenleri (Railway Variables)

En az şunlar olmalı:

- `PUBLIC_APP_URL` = `https://snapsell.website`
- `ALLOWED_ORIGINS` = `https://snapsell.website` (ve varsa `https://www.snapsell.website`)
- `APP_DOMAIN` = `https://snapsell.website`
- Firebase: `FIREBASE_SERVICE_ACCOUNT_JSON` (tek satır JSON; sadece Google Auth)
- Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (veritabanı)
- Diğer API anahtarları (OPENAI, vb.)

### 4. Firebase tarafı (değişiklik yok)

- **Firebase Console** → **Authentication** → **Authorized domains** içinde `snapsell.website` (ve `xxx.railway.app`) zaten ekli olmalı.
- Giriş, domain’i eklediğiniz için çalışır; hosting’i Firebase’de yapmadığınız için “API 404” sorunu kalkar.

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

Sadece arayüzü Firebase’de, API’yi başka yerde tutmak isterseniz:

1. **Backend:** server.js’i Railway veya Render’da çalıştırın. Örn. API URL’i: `https://snapsell-api.railway.app`.
2. **Frontend:** Firebase Hosting’e sadece statik build’i deploy edin (örn. `public` + `saas-design-extracted/dist`).
3. **CORS:** Sunucuda `ALLOWED_ORIGINS` içine `https://snapsell.website` ekleyin.
4. **API adresi:** Tüm istemci kodunda (auth.html, login.html, dashboard) `API` değişkeni production’da `https://snapsell-api.railway.app` olacak şekilde ayarlanmalı (ortam veya build-time).

Bu yol daha fazla yapılandırma gerektirir; çoğu senaryo için **Yöntem 1 (Railway)** daha basittir.

---

## Kısa özet

| Bileşen           | Nerede / Ne |
|-------------------|--------------|
| Frontend          | **Vercel** (veya Firebase Hosting). Statik build; `/api/*` burada çalışmaz. |
| Backend (API)     | **Railway** (veya Render). Node (server.js) burada çalışır. |
| Veritabanı       | **Supabase** (PostgreSQL). Kullanıcılar, kredi, plan. |
| Giriş (Auth)      | **Firebase** (Google). Token doğrulama backend’de; hosting nerede olursa olsun kullanılır. |

**Önerilen:** Frontend → Vercel, Backend → Railway, Database → Supabase. Firebase sadece Google ile giriş için. Kurulum adımları için [KURULUM.md](./KURULUM.md).
