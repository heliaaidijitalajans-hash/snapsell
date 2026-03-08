# Supabase service_role key nasıl eklenir

Kullanıcı kaydı ve giriş (users tablosu) için **SUPABASE_SERVICE_ROLE_KEY** zorunludur.

## 1. Key’i alın

1. [Supabase Dashboard](https://supabase.com/dashboard) → Projenize girin (örn. `eabgyxssepusxceqwmta`).
2. Sol menü **Settings** (dişli) → **API**.
3. **Project API keys** bölümünde **service_role** satırını bulun.
4. **Reveal** / **Göster** ile key’i görün, **Copy** ile kopyalayın.  
   (Uyarı: Bu key’i sadece backend’de kullanın, asla frontend veya public yerde kullanmayın.)

## 2. Yerel .env dosyasına ekleyin

Proje kökündeki `.env` dosyasını açın. Şu satırı bulun:

```env
SUPABASE_SERVICE_ROLE_KEY=
```

Eşittir işaretinden sonra kopyaladığınız key’i yapıştırın (boşluk bırakmayın):

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Kaydedin.

## 3. Railway’e ekleyin

1. [Vercel](https://vercel.com) → Projeniz → **Settings → Environment Variables** (veya proje kökündeki `.env`).
2. **New Variable** → Name: `SUPABASE_SERVICE_ROLE_KEY`
3. Value: Az önce kopyaladığınız **service_role** key’in tamamını yapıştırın.
4. Kaydedin, gerekirse **Redeploy** yapın.

Bu adımlardan sonra `/api/register` ve Google giriş ile kullanıcı oluşturma çalışır.
