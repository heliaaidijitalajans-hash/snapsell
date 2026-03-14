# .env ve bağlantı ayarları

## Frontend (saas-design-extracted)

- **VITE_API_BASE_URL** = `https://snapsell-production.up.railway.app`  
  Tüm API istekleri bu adrese gider.

- **VITE_APP_URL** = `https://www.snapsell.website`  
  Uygulama ana URL (paylaşım, yönlendirme).

- **Supabase (isteğe bağlı):**  
  Frontend doğrudan Supabase kullanmıyorsa boş bırakılabilir.  
  Kullanacaksanız `.env` içine `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` ekleyin; Supabase Dashboard > Project Settings > API’den alın.

## Backend (Railway / root .env)

- **PUBLIC_APP_URL** = `https://www.snapsell.website`  
  Dönüşüm sonrası dönen görsel URL’leri bu domain ile üretilir. Geçerli SSL kullandığı için `net::ERR_CERT_DATE_INVALID` hatası önlenir.

- **VITE_API_BASE_URL** (root .env’de) backend’in kendisi için değil, referans içindir; asıl API adresi frontend’teki `VITE_API_BASE_URL` ile build’e gömülür.

## net::ERR_CERT_DATE_INVALID

Bu hata, tarayıcının açtığı bir URL’nin sertifikasının süresi dolduğunda veya geçersiz olduğunda çıkar. Önlemek için:

1. Backend’te **PUBLIC_APP_URL** mutlaka geçerli SSL’e sahip bir domain olmalı (örn. `https://www.snapsell.website`).
2. Dönüşüm sonrası dönen görsel linkleri bu domain üzerinden sunulmalı (backend bu URL’yi kullanarak üretir).
