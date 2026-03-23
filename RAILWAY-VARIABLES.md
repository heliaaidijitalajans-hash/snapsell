# Railway’e eklenecek değişkenler

Proje kökündeki `.env` dosyasındaki **her satırı** Railway → Variables’a tek tek ekleyin.

**SUPABASE_SERVICE_ROLE_KEY** yoksa sunucu `users` tablosuna yazamaz ve token doğrulama sorunlu olur. [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) dosyasına bakın.

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
- VITE_SUPABASE_URL (Railway’de frontend ayrı build ediliyorsa)
- VITE_SUPABASE_ANON_KEY
- PHOTOROOM_API_KEY
- SERPAPI_API_KEY (isteğe bağlı)
- EXA_API_KEY (isteğe bağlı)

`GOOGLE_APPLICATION_CREDENTIALS` veya Firebase anahtarları artık kullanılmıyor.
