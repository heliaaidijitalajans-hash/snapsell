# Değişikliklerin Görünmesi İçin Yapılacaklar

Kodda yaptığın değişiklikler **otomatik** yansımaz. Aşağıdaki adımları uygula.

---

## 1) Lokal test (bilgisayarında denemek)

Terminalde proje klasöründe (`snapsell-app`):

```bash
npm run build
```

Backend’i yeniden başlat (`server.js` değişiklikleri için):

```bash
node server.js
```

veya `npm start`

---

## 2) Canlı sitede görünmesi (Vercel)

1. Değişiklikleri Git’e gönder:
```bash
git add .
git commit -m "Guncelleme"
git push
```
2. Vercel projeyi otomatik deploy eder (Git’e bağlıysa).
3. Frontend için `VITE_*` değişkenleri değiştiyse mutlaka yeni **build** tetiklenmiş olmalı.

---

## Özet

| Nerede test ediyorsun? | Ne yapmalısın? |
|------------------------|----------------|
| Lokal | `npm run build` + `node server.js` |
| Canlı (Vercel) | `git push` → Vercel deploy |

**Hiçbir şey görünmüyorsa:** Eski deploy çalışıyor olabilir; Vercel’de son deployment’ı ve ortam değişkenlerini kontrol et.
