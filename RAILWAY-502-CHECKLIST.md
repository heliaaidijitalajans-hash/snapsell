# 502 Bad Gateway – Railway Kontrol Listesi

**502 = Uygulama yanıt vermiyor.** Railway proxy cevap alamadığı için 502 döndürüyor.

## 1. Logları mutlaka kontrol et

- Railway Dashboard → Projeniz → **Deployments** → son deployment → **View Logs**.
- Görmek istediğin satırlar:
  - `SnapSell start.js running, PORT=...`
  - `SnapSell API listening on port XXXX (Ready)`
- **Hiç log yoksa** process hiç başlamıyor (yanlış root, yanlış start komutu).
- **"Startup failed" / "server.js load error"** varsa yanındaki hata mesajına bak; çoğu zaman eksik env (SUPABASE_*) veya require hatası.

## 2. Railway ayarları

| Ayar | Olması gereken |
|------|-----------------|
| **Root Directory** | Boş (repo kökü). start.js ve server.js burada olmalı. |
| **Build** | `npm install` veya railway.toml/build kullanıyorsan değiştirme. **Build Command** içinde `npm run build` olmasın (frontend build’i backend’de gerekmez). |
| **Start Command** | `node start.js` veya `npm start`. Procfile: `web: node start.js`. |
| **Dockerfile** | İstersen projedeki Dockerfile ile deploy et: Railway → Service → Settings → “Use Dockerfile” / build’i Dockerfile’a al. |

## 3. Env (Variables)

- **SUPABASE_URL**, **SUPABASE_SERVICE_ROLE_KEY** (veya SUPABASE_ANON_KEY) mutlaka dolu.
- **PORT** ekleme; Railway kendi verir.
- Detay: [RAILWAY-VARIABLES.md](./RAILWAY-VARIABLES.md)

## 4. Hâlâ 502 ise

1. **Dockerfile ile dene:** Projede `Dockerfile` var. Railway’de bu servisi “Build from Dockerfile” yapıp yeniden deploy et.
2. **Yerelde çalıştır:** Repo kökünde `npm install` → `node start.js` → tarayıcıda `http://localhost:3006/ping` → "OK" gelmeli. Geliyorsa sorun Railway ortamı/ayarı.
3. **Yeni servis aç:** Railway’de aynı repodan yeni bir service oluştur; Root = boş, Start = `node start.js`, Variables’ı kopyala. Bazen eski servis cache’i 502’ye sebep olur.

Deploy sonrası logda **"SnapSell API listening on port ... (Ready)"** görünene kadar 502 devam edebilir. Bu satır görünüyorsa `/ping` ve `/api/plans` 200 dönmeli.
