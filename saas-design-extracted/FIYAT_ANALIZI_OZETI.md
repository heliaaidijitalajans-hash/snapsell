# Fiyat Analizi Sistemi – Özet

## Fiyat analizi: Vision + SerpAPI + Exa + GPT (güncel plan)

**ScraperAPI kaldırıldı.** Fiyat analizi artık şu dört bileşenle yapılıyor:

- **Vision (GPT-4o-mini):** Görsel yoksa veya ürün metni yoksa, görselden tek cümlelik ürün tanımı çıkarır.
- **SerpAPI (Google Shopping):** Ürün sorgusuyla Google Alışveriş sonuçlarını çeker (`engine=google_shopping`, `gl=tr`); `shopping_results` içindeki `extracted_price` / `price` ile fiyatları toplar.
- **Exa:** Semantik arama ile “ürün + fiyat” içeren sayfalardan metin alır; highlights’tan TL/USD/EUR/GBP fiyatları parse edilir.
- **GPT (gpt-4o-mini):** Toplanan platform fiyat tablosundan 2–3 cümlelik özet ve rekabetçi fiyat stratejisi yazar.

Gerekli env: `SERPAPI_API_KEY`, `EXA_API_KEY`. En az biri dolu olmalı; ikisi de varsa hem SerpAPI hem Exa sonuçları birleştirilir.

---

## 1. Frontend’de Nasıl Kullanılıyor?

### Görsel düzenleme sayfası (PhotoRoom)

- **Sayfa:** Görsel düzenleme (`/dashboard/gorsel-duzenleme`, `EditorReplicatePage.tsx`).
- **Alan:** Panelin en altında **“Fiyat analizi için ürünü tanıtın”** başlıklı metin kutusu (textarea).
- **Amaç:** Kullanıcı ürünü kısaca tanıtır (ürün adı, kategori, açıklama vb.). Bu metin fiyat analizi sistemine girdi olarak verilir.

### Backend’e gönderim

- Kullanıcı **“Dönüştür”** butonuna bastığında:
  - Görsel ve diğer PhotoRoom parametreleriyle birlikte **`productDescriptionForPriceAnalysis`** alanı da gönderilir.
- **İstek:** `POST /api/photoroom/pipeline`
- **Gövde örneği:**
  - `image`: base64 görsel
  - `prompt`: arka plan / stil metni
  - `photoQuality`: studio | professional | luxury
  - **`productDescriptionForPriceAnalysis`**: kullanıcının yazdığı “fiyat analizi için ürün tanımı” (metin kutusundan, boşsa gönderilmez).

Yani fiyat analizi, frontend tarafında **bu metne göre** yapılacak şekilde tasarlanmıştır; analizin nasıl yapıldığı ise backend’de tanımlıdır.

---

## 2. Backend’de kullanılan uygulamalar (server.js)

| Uygulama | Kullanım |
|----------|----------|
| **Vision (GPT-4o-mini)** | Görselden tek cümlelik ürün tanımı: `getProductDescriptionFromVision(imageUrl)`. |
| **SerpAPI** | `getPricesFromSerpAPI(q)`: Google Shopping (`engine=google_shopping`, `gl=tr`); `shopping_results[].extracted_price` / `price` → para birimine göre listeler. |
| **Exa** | `getPricesFromExa(q)`: POST `api.exa.ai/search`, highlights; metinden `extractPricesWithCurrency` ile TRY/USD/EUR/GBP çıkarılır. |
| **GPT (gpt-4o-mini)** | Min/ort/maks tablosundan 2–3 cümlelik özet + rekabetçi strateji: `getPriceAnalysisWithVisionSerpAPIExaGPT(productDescription, imageUrl)`. |

**Kullanıldığı endpoint’ler:**

- `POST /api/process`: Görsel + (opsiyonel) `productDescription` → Vision (gerekirse) + SerpAPI + Exa + GPT özet.
- `POST /price`: Görsel (+ opsiyonel `productDescription`) → aynı fiyat analizi; metin olarak `text` döner.
- `POST /api/photoroom/pipeline`: Görsel + `productDescriptionForPriceAnalysis` → PhotoRoom görsel + (metin doluysa) fiyat analizi; yanıtta `priceSummary` ve `priceAnalysis` (platform listesi) döner.

---

## 3. Kısa Akış Özeti (Frontend → Backend)

1. Kullanıcı görsel düzenleme sayfasında bir ürün görseli yükler.
2. **“Fiyat analizi için ürünü tanıtın”** kutusuna ürünü tanıtan metni yazar.
3. **“Dönüştür”** tıklanır.
4. Frontend `POST /api/photoroom/pipeline` ile görsel + prompt + **productDescriptionForPriceAnalysis** gönderir.
5. Backend:
   - PhotoRoom ile görsel işlemini yapar,
   - (Tasarıma göre) `productDescriptionForPriceAnalysis` metnini kullanarak fiyat analizi yapar veya bu metni ileride kullanacak şekilde saklar.

**Kullanılan uygulamalar** (PhotoRoom dışında) tam olarak backend kodunda görülebilir; bu özet yalnızca frontend tarafını ve tasarım niyetini açıklar.
