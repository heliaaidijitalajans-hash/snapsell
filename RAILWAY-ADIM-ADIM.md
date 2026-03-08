# Railway 502 – Adim adim ne yapacaksin

## Adim 1: Minimal sunucuyu dene (sorun nerede anlamak icin)

1. **Bu projeyi push et** (minimal-ping.js dahil):
   ```bash
   git add .
   git commit -m "minimal-ping test"
   git push
   ```

2. **Railway Dashboard** ac: https://railway.app/dashboard

3. **Projeni sec** → **snapsell-production** (veya backend servisinin adi) servisine tikla.

4. **Settings** (sol menü veya servis ayarlari) → **Deploy** / **Build & Deploy** bolumune gir.

5. **Start Command** (veya "Custom Start Command") alanini bul.  
   Su an ne yaziyorsa sil ve **sadece su komutu yaz:**
   ```bash
   node minimal-ping.js
   ```
   Kaydet.

6. **Yeni deploy tetikle:** "Redeploy" / "Deploy" veya son commit icin "Trigger Deploy".

7. Deploy bitince tarayicida ac:  
   **https://snapsell-production.up.railway.app/ping**

   - **"OK" goruyorsan:** Railway ve port dogru calisiyor. Sorun `server.js` / `start.js` veya env’de. Sonraki adimda Start Command’i `node start.js` yapip tekrar dene; loglardaki hataya bak.
   - **Hala 502 ise:** Root Directory veya servis tipi yanlis. Adim 2’ye gec.

---

## Adim 2: Root ve Build’i kontrol et

1. **Settings** → **Build** / **General**:
   - **Root Directory:** Bos birak (veya `/`). Icinde `server.js`, `start.js`, `package.json` olan klasor repo kokunu gosteriyor olmali.
   - **Build Command:** Bos birak **veya** sadece `npm install` yaz. **`npm run build` OLMASIN** (frontend build backend icin gerekmez, bazen 502 sebebi olur).

2. **Start Command** yine: `node minimal-ping.js` (test icin) veya duzeltince `node start.js`.

3. **Variables** (env):
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (veya `SUPABASE_ANON_KEY`) dolu mu kontrol et.
   - **PORT** ekleme; Railway kendi verir.

4. Tekrar **Deploy** al ve yine **/ping** adresini dene.

---

## Adim 3: Normal uygulamaya don

- Minimal ping **OK** donuyorsa:
  1. **Start Command**’i su yap: `node start.js`
  2. **Redeploy** yap.
  3. **View Logs**’a bak. "SnapSell start.js running" veya "Startup failed" / "server.js load error" var mi, hata mesaji ne yaziyor not al.
  4. Hata mesaji cogunlukla eksik env (Supabase) veya bir `require(...)` hatasidir; o mesaja gore duzelt.

---

## Ozet

| Ne yapiyorsun        | Neden |
|----------------------|--------|
| `node minimal-ping.js` | Hicbir paket yok; calisiyorsa sorun bizim kod/env. |
| Root bos, Build bos   | Railway repo kokunde build alir, yanlis klasorde calismaz. |
| Build’da `npm run build` yok | Frontend build backend deploy’unu bozmasin. |
| Start = `node start.js` | Asil uygulama bu komutla aciliyor. |
