# Değişikliklerin Görünmesi İçin Yapılacaklar

Kodda yaptığın değişiklikler **otomatik** yansımaz. Aşağıdaki adımları uygula.

---

## 1) Lokal test (bilgisayarında denemek)

Terminalde proje klasöründe (`snapsell-app`):

```bash
# Frontend'i derle (React/Vite değişiklikleri dist/ klasörüne yazılır)
npm run build
```

Backend’i yeniden başlat (server.js değişiklikleri için):

- Çalışan `node server.js` varsa **Ctrl+C** ile durdur, sonra tekrar:
```bash
node server.js
```
veya
```bash
npm start
```

Frontend’i tarayıcıda açmak için:
- `dist/index.html`’i doğrudan açabilirsin **veya**
- Bir static sunucu kullan (örn. `npx serve dist` — `http://localhost:3000` gibi bir adres verir).

---

## 2) Canlı sitede görünmesi (snapsell.website + Railway)

Sitede ve API’de güncellemelerin görünmesi için **hem frontend hem backend deploy** edilmeli.

### A) Backend (Railway)

1. Değişiklikleri Git’e gönder:
```bash
git add .
git commit -m "Planlar ve fiyatlar güncellendi"
git push
```
2. Railway projeyi otomatik deploy eder (Git’e bağlıysa). Bittikten sonra Admin’e girip **「Planları varsayılana sıfırla」** butonuna bas; böylece sunucudaki `data/` dosyaları güncel planlarla güncellenir.

### B) Frontend (Firebase Hosting)

1. Önce build al:
```bash
npm run build
```
2. `dist/config.json` içinde `apiUrl`’in backend adresine (örn. Railway URL) işaret ettiğinden emin ol.
3. Firebase’e deploy et:
```bash
firebase deploy
```
veya
```bash
npm run deploy:firebase
```
(Bu script build alır, sen sadece `dist/config.json`’ı kontrol edip `firebase deploy` yaparsın.)

---

## Özet

| Nerede test ediyorsun? | Ne yapmalısın? |
|------------------------|----------------|
| Sadece kendi bilgisayarında | `npm run build` + backend’i yeniden başlat (`node server.js`) |
| Canlı site (snapsell.website) | Backend: `git push` (Railway deploy) → Admin’de 「Planları varsayılana sıfırla」. Frontend: `npm run build` → `firebase deploy` |

**Hiçbir şey görünmüyorsa** büyük ihtimalle:
- Canlı sitede eski build / eski backend çalışıyordur → yukarıdaki deploy adımlarını uygula.
- Lokal test ediyorsan → `npm run build` ve backend’i yeniden başlatmayı unutma.
