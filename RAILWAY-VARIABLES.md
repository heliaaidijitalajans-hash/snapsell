# Railway’e eklenecek değişkenler

Proje kökündeki `.env` dosyasındaki **her satırı** Railway → Variables’a tek tek ekleyin. `FIREBASE_SERVICE_ACCOUNT_JSON` tek satır olmalı (tüm JSON tek satırda).

**SUPABASE_SERVICE_ROLE_KEY** yoksa: [SUPABASE-SERVICE-ROLE-ADIM.md](./SUPABASE-SERVICE-ROLE-ADIM.md) dosyasındaki adımlarla Supabase’ten alıp önce `.env`’e, sonra Railway’e ekleyin.

## Değişken listesi (isimler)

- NODE_ENV
- PORT
- OPENAI_API_KEY
- ADMIN_EMAIL
- ADMIN_PASSWORD
- PUBLIC_APP_URL
- APP_DOMAIN
- ALLOWED_ORIGINS
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- FIREBASE_SERVICE_ACCOUNT_JSON
- PHOTOROOM_API_KEY
- SERPAPI_API_KEY
- EXA_API_KEY

`GOOGLE_APPLICATION_CREDENTIALS` Railway’de kullanmayın; `FIREBASE_SERVICE_ACCOUNT_JSON` yeterli.
