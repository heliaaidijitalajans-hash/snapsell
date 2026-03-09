# Tanımlanması Gereken Ortam Değişkenleri

## Vercel (Frontend + API Serverless)

Vercel Dashboard → Proje → Settings → Environment Variables bölümünde aşağıdakileri tanımlayın.

### Zorunlu (görsel düzenleme pipeline’ı için)

| Değişken | Açıklama | Nereden alınır |
|----------|----------|----------------|
| `PHOTOROOM_API_KEY` | PhotoRoom API anahtarı (arka plan silme + yeni arka plan). | [PhotoRoom API Dashboard](https://app.photoroom.com/api-dashboard) → API Key. **Image Editing (Plus)** planı gerekir. |

### Opsiyonel (pipeline: SEO + fiyat analizi)

| Değişken | Açıklama |
|----------|----------|
| `OPENAI_API_KEY` | SEO açıklaması (görsel analiz) ve fiyat özeti metni için. Tanımlanmazsa pipeline sadece görsel döndürür. |
| `SCRAPERAPI_API_KEY` veya `SCRAPER_API_KEY` | Gerçek pazaryeri fiyat analizi (Trendyol, Hepsiburada, Amazon TR/US/UK/DE, Etsy) için. Tanımlanmazsa fiyat kısmı sadece görselden GPT tahmini ile dolar. |

### Opsiyonel (frontend build)

| Değişken | Açıklama | Varsayılan |
|----------|----------|------------|
| `VITE_API_BASE` | API isteklerinin gideceği base URL. Boş bırakılırsa same-origin (`/api`) kullanılır. | `""` (snapsell.website üzerinden /api) |
| `VITE_API_BASE` | Eğer API’yi ayrı bir backend’e (server.js) yönlendirmek isterseniz: `https://api.snapsell.website` gibi. | — |

- `VITE_*` değişkenleri **build sırasında** kullanılır; Vercel’de Environment Variables’a ekleyip Production/Preview/Development’ta işaretleyin.

---

## server.js (Railway / Node backend)

Tam backend (Supabase, Firebase, admin, kredi takibi vb.) kullanıyorsanız `.env` veya Railway/env ortamında aşağıdakileri tanımlayın.

### Zorunlu

| Değişken | Açıklama |
|----------|----------|
| `PORT` | Sunucu portu (örn. 3006). |
| `PUBLIC_APP_URL` | Frontend adresi (örn. https://snapsell.website). |
| `ALLOWED_ORIGINS` | CORS için izin verilen origin’ler (virgülle ayrılmış). |
| `SUPABASE_URL` | Supabase proje URL. |
| `SUPABASE_SERVICE_ROLE_KEY` veya `SUPABASE_ANON_KEY` | Supabase API anahtarı. |
| `ADMIN_PASSWORD` | Admin panel giriş şifresi. |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase Admin SDK için service account JSON (Google giriş doğrulama). |
| `PHOTOROOM_API_KEY` | PhotoRoom API anahtarı (server üzerinden pipeline için). |

### Opsiyonel

| Değişken | Açıklama |
|----------|----------|
| `ADMIN_EMAIL` | Admin kabul edilecek e-posta. |
| `OPENAI_API_KEY` | SEO / fiyat analizi için. |
| `REPLICATE_API_TOKEN` | Replicate (alternatif akış) için. |
| `LEONARDO_API_KEY` | Leonardo AI için. |
| `PIXIAN_API_ID`, `PIXIAN_API_SECRET` | Pixian arka plan kaldırma için. |
| `SCRAPERAPI_API_KEY` | Fiyat analizi için. |

---

## Özet: Sadece Vercel ile çalıştırmak

1. **PHOTOROOM_API_KEY** → Vercel Environment Variables’a ekleyin (PhotoRoom’dan alın).
2. **VITE_API_BASE** → Boş bırakın veya eklemeyin (same-origin `/api` kullanılır).
3. Deploy sonrası görsel düzenleme sayfası (arka plan sil + yeni arka plan) çalışır.

Firebase (Google giriş) frontend tarafında zaten yapılandırılı; ek env gerekmez. Hesap/kredi takibi için server.js + Supabase kullanacaksanız o ortamda ilgili değişkenleri tanımlayın.
