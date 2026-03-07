# SnapSell

Ürün görseli ve liste metni oluşturma uygulaması.

## Geliştirme

```bash
npm install
npm run build          # Dashboard build (gerekli)
npm run dev            # Sunucuyu başlatır (http://localhost:3006)
```

Dashboard arayüzü: [http://localhost:3006/dashboard](http://localhost:3006/dashboard)

## Yayına alma

Tüm adımlar **[DEPLOY.md](DEPLOY.md)** dosyasında. Projede zaten **.env** dosyanız var; yayına alırken bu dosyayı sunucuya taşıyın veya ortam değişkenlerini panelden girin. Kısa özet:

1. Mevcut **.env** dosyanızı kullanın (sunucuya kopyalayın veya değerleri panelde girin). Gerekirse `PUBLIC_APP_URL` / `ALLOWED_ORIGINS` / `APP_DOMAIN` değerlerini canlı domain ile güncelleyin.
2. `npm install && npm run build && npm start`
3. VPS için PM2: `pm2 start ecosystem.config.cjs --env production`
4. Docker: `docker build -t snapsell . && docker run -p 3006:3006 --env-file .env -v snapsell-data:/app/data snapsell`

Detaylar ve kontrol listesi için [DEPLOY.md](DEPLOY.md) okuyun.
"# snapsell." 
"# snapsell." 
