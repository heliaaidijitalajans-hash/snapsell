# SnapSell – Yayına Alma Rehberi

**Firebase Hosting + Railway kullanıyorsanız:** Adım adım kurulum için **[KURULUM.md](./KURULUM.md)** dosyasını takip edin.

---

## Backend’i en kolay deploy etmek (Railway)

1. **railway.app** → GitHub ile giriş.
2. **New Project** → **Deploy from GitHub repo** → `snapsell-app` reposunu seçin.
3. **Settings** (veya **Variables**):
   - **Build Command:** `npm install` (veya boş bırakın; Railway varsayılan olarak `npm install` çalıştırır).
   - **Start Command:** `npm start` (veya `node server.js`).
   - **Root Directory:** boş (kök dizin).
4. **Variables** sekmesinde `.env` değişkenlerinizi tek tek ekleyin:
   - `PORT` → Railway otomatik verir, eklemeniz gerekmez.
   - `NODE_ENV` = `production`
   - `PUBLIC_APP_URL` = `https://snapsell.website` (veya frontend’in çalıştığı adres)
   - `APP_DOMAIN` = `https://snapsell.website`
   - `ALLOWED_ORIGINS` = `https://snapsell.website,https://snapsellapp-xxx.web.app` (frontend adresleri, virgülle)
   - `FIREBASE_SERVICE_ACCOUNT_JSON` = service account JSON (tek satır)
   - `ADMIN_PASSWORD`, `ADMIN_EMAIL`, `OPENAI_API_KEY` vb. (`.env.example` ile aynı).
5. **Deploy** tetiklenir. Bittikten sonra **Settings → Networking → Generate Domain** ile `https://xxx.railway.app` alın.
6. Frontend’de (Firebase veya başka host) API adresi olarak bu URL’i kullanın: `saas-design-extracted/.env` → `VITE_API_URL=https://xxx.railway.app`.

**Alternatif: Render.com**  
[render.com](https://render.com) → **New → Web Service** → repo bağla → **Build:** `npm install`, **Start:** `npm start` → Environment’a `.env` değişkenlerini ekleyin. Mantık aynı.

---

## Frontend / Backend ayrımı

- **Backend (server.js)** sadece API sunar (`/api/*`, `/admin/*`). HTML veya statik dosya sunmaz.
- **Frontend** ayrı sunucuda çalışır (Vite, Firebase Hosting, Vercel vb.). API istekleri backend URL'ine gider. CORS için backend'de `ALLOWED_ORIGINS` ile frontend origin ekleyin.

**Firebase Hosting’e frontend deploy ediyorsanız:** Build sırasında backend adresini verin; yoksa istekler Firebase’e gider ve "JSON değil HTML" hatası alırsınız:
- `saas-design-extracted/.env` içine `VITE_API_URL=https://your-backend-url.com` yazın (sondaki `/` olmadan)
- veya build komutu: `VITE_API_URL=https://your-backend-url.com npm run build`
- Backend’i Railway/Render’da çalıştırıp bu URL’i kullanın.

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
4. **Variables** sekmesinde `.env` içeriğinizi ekleyin (OPENAI_API_KEY, FIREBASE_SERVICE_ACCOUNT_JSON veya GOOGLE_APPLICATION_CREDENTIALS, ALLOWED_ORIGINS, PUBLIC_APP_URL vb.).
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
- Firebase: `FIREBASE_SERVICE_ACCOUNT_JSON` (tek satır JSON) veya `GOOGLE_APPLICATION_CREDENTIALS`
- Diğer API anahtarları (OPENAI, vb.)

### 4. Firebase tarafı (değişiklik yok)

- **Firebase Console** → **Authentication** → **Authorized domains** içinde `snapsell.website` (ve `xxx.railway.app`) zaten ekli olmalı.
- Giriş, domain’i eklediğiniz için çalışır; hosting’i Firebase’de yapmadığınız için “API 404” sorunu kalkar.

### 5. Sonuç

- Backend API: `https://snapsell.website` → Railway’deki Node (server.js).
- Frontend ayrı deploy edilir; CORS için `ALLOWED_ORIGINS` gerekli.
- Firebase sadece Auth (ve gerekirse Firestore) için kullanılır; hosting Firebase’de değildir.

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

| Ne nerede çalışır?        | Açıklama |
|---------------------------|----------|
| Firebase Hosting          | Sadece statik dosya. `/api/*` burada **çalışmaz** → 404. |
| Firebase Auth             | Tarayıcı + sunucu; hosting nerede olursa olsun kullanılır. |
| server.js (API + sayfalar)| **Node’un çalıştığı yer** (Railway, Render, VPS) gerekir. |

**Pratik çözüm:** Uygulamayı **Firebase Hosting’e değil**, **Railway (veya Render)** üzerinde yayına alın; domain’i (snapsell.website) oraya verin. Firebase’i sadece **giriş (Auth)** ve gerekirse **Firestore** için kullanmaya devam edin. Böylece hem site hem API tek adreste çalışır.
