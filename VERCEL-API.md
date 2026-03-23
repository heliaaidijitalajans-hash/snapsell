# Vercel’de API (Railway kullanılmıyor)

Tüm API çağrıları artık **aynı origin** üzerinden `/api/...` yapılıyor (örn. `fetch("/api/plans")`).

## Nasıl çalışıyor

- **Frontend:** `getApiBase()` boş döner → istekler `https://your-app.vercel.app/api/...` olur.
- **Backend (Hobby plan):** Vercel’de **her** `api/*.js` dosyası ayrı bir Serverless Function sayılır (limit **12**). Bu yüzden tek giriş noktası kullanılıyor:
  - **`api/index.js`** → `serverless-http` ile `server.js` içindeki Express `app`’e bağlanır.
  - **`vercel.json`** → `/api` ve `/api/:path*` istekleri `/api` hedefine yönlendirilir (yani aynı fonksiyon).
  - **`server.js`** → `process.env.VERCEL` varken `app.listen` çalışmaz; Vercel’de gelen istekte path bazen `/api` olarak gelir — Express route’ları için URL, uygun header’lardan geri yüklenir.

## Vercel proje ayarı

- **Root Directory:** Repo kökü (boş bırakın). `server.js`, `api/` ve `saas-design-extracted/` burada olmalı.
- **Build:** Mevcut `vercel.json` (buildCommand, outputDirectory) aynen kullanılır.
- **Env:** Supabase (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_*`) ve diğer `.env` değişkenlerini Vercel → Settings → Environment Variables’a ekleyin.

## Eski Railway URL’i

Eski Railway backend kaldırıldı. İsterseniz `config.json` veya `VITE_API_URL` ile farklı bir API adresi tanımlayabilirsiniz.
