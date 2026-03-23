# Vercel’de API (Railway kullanılmıyor)

Tüm API çağrıları artık **aynı origin** üzerinden `/api/...` yapılıyor (örn. `fetch("/api/plans")`).

## Nasıl çalışıyor

- **Frontend:** `getApiBase()` boş döner → istekler `https://your-app.vercel.app/api/...` olur.
- **Backend:** `api/[[...path]].js` tüm `/api/*` isteklerini `server.js` içindeki Express uygulamasına iletir.

## Vercel proje ayarı

- **Root Directory:** Repo kökü (boş bırakın). `server.js`, `api/` ve `saas-design-extracted/` burada olmalı.
- **Build:** Mevcut `vercel.json` (buildCommand, outputDirectory) aynen kullanılır.
- **Env:** Supabase (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_*`) ve diğer `.env` değişkenlerini Vercel → Settings → Environment Variables’a ekleyin.

## Eski Railway URL’i

Eski Railway backend kaldırıldı. İsterseniz `config.json` veya `VITE_API_URL` ile farklı bir API adresi tanımlayabilirsiniz.
