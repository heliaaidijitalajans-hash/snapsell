# SnapSell – Firebase + Railway Kurulum (Adım Adım)

Frontend: **Firebase Hosting** (snapsellapp-6649a.web.app)  
Backend: **Railway** (veya Render)

---

## 1. Backend’i (server.js) Railway’de çalıştırın

1. [railway.app](https://railway.app) → Giriş → **New Project** → **Deploy from GitHub repo** → `snapsell-app` seçin.
2. **Settings**:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start` veya `node server.js`
   - **Root Directory:** boş
3. **Variables** sekmesine `.env` değişkenlerini ekleyin. **Mutlaka** şunlar olsun:
   - `ALLOWED_ORIGINS` = `https://snapsellapp-6649a.web.app` (Firebase adresiniz; virgülle birden fazla ekleyebilirsiniz)
   - `FIREBASE_SERVICE_ACCOUNT_JSON` = (Firebase Console → Project settings → Service accounts → JSON’u tek satır yapıştırın)
   - `ADMIN_PASSWORD` = (güçlü bir şifre)
   - `OPENAI_API_KEY` = (OpenAI’dan alın)
   - `PUBLIC_APP_URL` = `https://snapsellapp-6649a.web.app` (frontend adresi)
   - `APP_DOMAIN` = `https://snapsellapp-6649a.web.app`
4. **Deploy** edin. Railway size bir URL verir (örn. `https://snapsell-app-production-xxxx.up.railway.app`). Bu adresi kopyalayın; **sonda `/` olmasın.**

---

## 2. Frontend’te config.json’a backend adresini yazın

1. Projede **build** alın:
   ```bash
   npm run build
   ```
2. **`dist/config.json`** dosyasını açın (proje kökünde oluşur).
3. İçeriği şöyle yapın (Railway’den kopyaladığınız URL’i yapıştırın):
   ```json
   {
     "apiUrl": "https://snapsell-app-production-xxxx.up.railway.app"
   }
   ```
   Sonda **`/` olmasın.**

---

## 3. Firebase’e deploy edin

```bash
firebase deploy
```

---

## 4. Firebase Console’da domain’i yetkilendirin

- [Firebase Console](https://console.firebase.google.com) → Projeniz → **Authentication** → **Authorized domains**
- `snapsellapp-6649a.web.app` zaten listede olmalı. Railway URL’inizi de ekleyin (örn. `xxxx.up.railway.app`).

---

## 5. Kontrol

- Tarayıcıda `https://snapsellapp-6649a.web.app` açın.
- Giriş yapın; **Hesap Ayarları** sayfası açılıyorsa backend’e bağlanıyorsunuz demektir.

---

## Özet

| Ne              | Nerede / Ne yapılır |
|-----------------|---------------------|
| Backend API     | Railway’de çalışır; URL’i kopyalayın. |
| ALLOWED_ORIGINS | `https://snapsellapp-6649a.web.app` (Railway Variables) |
| config.json     | `dist/config.json` → `apiUrl`: Railway URL (sonda / yok) |
| Frontend deploy | `npm run build` → `dist/config.json` düzenle → `firebase deploy` |

---

Backend URL’i değişirse sadece **`dist/config.json`** içindeki `apiUrl`’i güncelleyip tekrar **`firebase deploy`** yapmanız yeterli; yeniden build gerekmez.
