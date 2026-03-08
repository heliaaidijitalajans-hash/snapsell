# 502 Bad Gateway – Railway Kontrol Listesi

**502 = Yanıt Express uygulamasından gelmiyor.** Railway proxy, backend cevap vermediği için 502 döndürüyor. CORS hatası da bu yüzden görünüyor (502 yanıtında CORS başlığı yok).

## 1. Logları kontrol et

- Railway Dashboard → Projeniz → **Deployments** → son deployment → **View Logs**.
- Şunları görmelisin:
  - `SnapSell API starting...`
  - `SnapSell API listening on port XXXX (Ready)`
- **Bunlar yoksa** uygulama başlarken çöküyor. Logdaki **kırmızı hata / stack trace**’e bakın.

## 2. Sık çökme nedenleri

| Neden | Çözüm |
|--------|--------|
| Eksik/yanlış env | Railway → **Variables**. En az: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` veya `SUPABASE_ANON_KEY`. [RAILWAY-VARIABLES.md](./RAILWAY-VARIABLES.md) ile karşılaştır. |
| PORT | Railway `PORT`’u kendisi verir. **Variables’da PORT tanımlamayın** (boş bırakın veya silin). Kod `process.env.PORT \|\| 3006` kullanıyor. |
| Root / start komutu | Root = repo kökü (server.js ve package.json burada). Start: `node server.js` veya `npm start`. Procfile varsa: `web: node server.js`. |
| Node sürümü | package.json `"engines": { "node": ">=18" }`. Railway buna uygun sürüm kullanır. |

## 3. Yerelde test

```bash
# Repo kökünde
npm install
node server.js
```

Tarayıcıda: `http://localhost:3006/ping` → "OK" görmelisin. Yerelde çalışıyorsa sorun büyük ihtimalle Railway ortamı/env’de.

## 4. Railway ayarları

- **Root Directory:** Boş (veya proje kökü).
- **Build Command:** Boş veya `npm install`.
- **Start Command:** Boş bırakırsanız Procfile kullanılır: `web: node server.js`. Veya açıkça: `node server.js`.

Deploy’dan sonra logda **"SnapSell API listening on port ... (Ready)"** görünene kadar 502 devam edebilir; bu satırı gördükten sonra `/api/plans` ve diğer istekler 200 dönmeli.
