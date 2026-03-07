# SaaS E-commerce Platform Design – Entegrasyon

Bu projeye **SaaS E-commerce Platform Design** zip içeriği entegre edilmiştir. **Tasarım uygulaması ana sisteme bağlıdır:** Editör, Kütüphane ve Hesap Ayarları sayfalarında gerçek SnapSell dashboard’u iframe içinde çalışır.

## Klasör yapısı

- **`saas-design-extracted/`** – Zip’ten çıkarılan React (Vite + Tailwind + shadcn/ui) tasarım uygulaması
- **`public/landing.html`** – Tasarım dilinde (marka rengi #FF5A5F) statik landing sayfası
- **`public/css/saas-theme.css`** – Tasarım tema değişkenleri (isteğe bağlı kullanım)

## Ana sisteme bağlantı

- **Editör** (`/design/editor`): Ana dashboard’un upload bölümü iframe ile açılır; yükleme ve AI işleme burada çalışır.
- **Kütüphane** (`/design/kutuphane`): Dashboard’daki görseller grid’i iframe ile açılır.
- **Hesap Ayarları** (`/design/hesap-ayarlari`): Dashboard’daki ayarlar bölümü iframe ile açılır.
- **Fiyatlandırma**: Ana sitedeki `/pricing` sayfasına gider.
- **Giriş / Kayıt**: Ana sitedeki `/login` ve `/register` sayfalarına gider. Giriş sonrası tekrar `/design` adresine dönebilirsiniz.

Aynı oturum (cookie / Firebase) kullanıldığı için iframe içindeki dashboard giriş yapmış kullanıcıyı tanır.

## Tasarım uygulamasını çalıştırma (React SPA)

1. Bağımlılıkları yükleyin ve build alın:
   ```bash
   cd saas-design-extracted
   npm install
   npm run build
   ```
2. Ana sunucuyu başlatın: `npm start` (proje kökünde)
3. Tarayıcıda **`/design`** adresine gidin. Build alındıysa React uygulaması buradan sunulur.

Geliştirme modunda (hot reload) çalıştırmak için:
```bash
cd saas-design-extracted
npm run dev
```
(Vite varsayılan olarak farklı bir port açar; production’da `/design` ana sunucudan servis edilir.)

## Landing sayfası

- **URL:** `/landing` veya `/landing/`
- **Dosya:** `public/landing.html`
- Tasarımla uyumlu hero, özellikler ve CTA; marka rengi #FF5A5F. Dashboard ve fiyatlandırma sayfalarına link içerir.

## Sunucu rotaları

| Rota        | Açıklama |
|------------|----------|
| `/design`  | Tasarım React uygulaması (build sonrası `saas-design-extracted/dist`) |
| `/landing` | Tasarım dilinde landing sayfası |

## Tema CSS

`public/css/saas-theme.css` dosyası tasarım sistemindeki renk ve radius değişkenlerini sağlar. İstediğiniz sayfada şu şekilde kullanabilirsiniz:

```html
<link href="/css/saas-theme.css" rel="stylesheet">
```

Koyu tema için sayfada `class="dark"` veya `data-theme="dark"` kullanın.
