# SnapSell – Cloudflare ile Kullanım

Cloudflare kullanırken giriş, dashboard ve API’nin düzgün çalışması için aşağıdaki ayarları yapın.

---

## 1. DNS ve proxy

- **DNS** kaydında domain’iniz Cloudflare’e yönlendirilmeli (nameserver’lar Cloudflare’e işaret etmeli).
- **Proxy durumu:** Turuncu bulut (Proxied) kullanıyorsanız trafik önce Cloudflare’e, oradan origin sunucunuza gider. Origin’iniz Node (örn. `https://sunucu-ip:3006` veya Railway/Render URL’i) olmalı.

---

## 2. SSL/TLS

- **Dashboard → SSL/TLS → Overview:** “Full” veya “Full (strict)” seçin (origin’e HTTPS ile bağlanıyorsanız Full strict).
- **SSL/TLS → Edge Certificates:** “Always Use HTTPS” açık olsun.

---

## 3. API isteklerinin origin’e ulaşması (404 önleme)

`/api/*` istekleri **mutlaka origin sunucunuza** (Node uygulamanıza) iletilmeli. Cloudflare sadece DNS/HTTPS aracı; asıl uygulama sizin sunucunuzda (VPS, Railway, Render vb.) çalışıyor olmalı.

- **VPS kullanıyorsanız:** Cloudflare DNS’te A/CNAME kaydı sunucu IP’nize veya domain’e işaret etmeli. Sunucuda Nginx/Caddy ile `https://domain.com` → `http://localhost:3006` proxy yapılıyor olmalı; Nginx’te `location /api/` için proxy ayarı yapın (örnek aşağıda).
- **Railway/Render vb. kullanıyorsanız:** DNS’te CNAME ile `platforma-uygulama.railway.app` gibi origin URL’e işaret edin. Bu durumda `/api/*` doğrudan platforma gider; ekstra ayar gerekmez.

**Nginx örneği (VPS’te Node 3006’da çalışıyorsa):**

```nginx
server {
  listen 80;
  server_name siteniz.com;
  location / {
    proxy_pass http://127.0.0.1:3006;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
  location /api/ {
    proxy_pass http://127.0.0.1:3006;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;
  }
}
```

Böylece `https://siteniz.com/api/config` isteği Node’a gider ve 404 olmaz.

---

## 4. Cache – API’yi cache’leme

API yanıtları cache’lenmemeli.

- **Dashboard → Caching → Configuration → Caching Level:** “Standard”.
- **Dashboard → Caching → Cache Rules** (veya Page Rules):  
  Bir kural ekleyin: **URL** `*siteniz.com/api/*` → **Cache eligibility** = “Bypass cache” (veya “Eligible for cache” = Off).

Alternatif (Page Rules varsa):  
`*siteniz.com/api/*` için “Cache Level” = **Bypass**.

---

## 5. Güvenlik başlıkları (COOP – giriş/popup hatası)

“Cross-Origin-Opener-Policy would block window.closed” hatası, Cloudflare’in veya tarayıcının eklediği **Cross-Origin-Opener-Policy** başlığından kaynaklanabilir. Uygulama zaten login ve dashboard sayfalarında `Cross-Origin-Opener-Policy: unsafe-none` gönderiyor; Cloudflare bunu ezmemeli.

- **Dashboard → Rules → Transform Rules → Modify Response Header** (veya benzeri):  
  Eğer Cloudflare tüm yanıtlara COOP ekliyorsa, **siteniz.com** için COOP header’ını **kaldıran** veya **`unsafe-none`** yapan bir kural ekleyin.  
  Örnek: “If” Host equals `siteniz.com` → “Then” Set header `Cross-Origin-Opener-Policy` = `unsafe-none` (veya Remove header).

- **Scrape Shield / Security** içinde “Add security headers” gibi bir seçenek varsa ve COOP ekliyorsa, bunu kapatın veya sadece belirli path’lerde uygulayın (ör. `/api/*` için eklemeyin, HTML sayfaları için `unsafe-none` kullanın).

Böylece Google ile giriş (redirect veya popup) engellenmez.

---

## 6. Kontrol listesi

| Kontrol | Beklenen |
|--------|----------|
| `https://siteniz.com/api/snapserver` | `{ "ok": true, ... }` |
| `https://siteniz.com/api/config` | `{ "appDomain": ..., "allowedOrigins": ... }` (404 olmamalı) |
| `https://siteniz.com/login` | Giriş sayfası açılır |
| Google ile giriş | Yönlendirme tamamlanır, dashboard açılır |
| Console’da COOP uyarısı | Olmamalı (Cloudflare/header ayarı sonrası) |

---

## 7. Özet

1. DNS’te domain Cloudflare’e, origin’e (Node/Railway/Render) doğru yönlensin.
2. `/api/*` istekleri mutlaka Node uygulamanıza ulaşsın (Nginx proxy veya platform URL’i).
3. API için cache bypass kuralı ekleyin.
4. COOP hatası varsa Cloudflare’de COOP’u kaldırın veya `unsafe-none` yapın.

Bu ayarlarla Cloudflare arkasında giriş ve dashboard sorunsuz çalışmalıdır.
