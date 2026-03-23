# SnapSell – Vercel + Supabase Kurulum Kontrol Listesi

Tüm sistemin hatasız çalışması için aşağıdaki adımları sırayla tamamlayın. **API:** Vercel’de `/api/*` route’ları ile aynı origin’de çalışır.

---

## 1. Supabase (Veritabanı + Auth)

- [ ] [supabase.com](https://supabase.com) → Proje oluştur
- [ ] **Settings → API**: `Project URL`, `anon`, `service_role` key’leri kopyala
- [ ] **SQL Editor** → `supabase/migrations/` dosyalarını sırayla çalıştır (**SUPABASE_SETUP.md**)
- [ ] **Authentication** → Email provider açık; Site URL / Redirect URL doğru

---

## 2. Vercel (Frontend + API)

- [ ] **Build Command**: `npm run build`
- [ ] **Output Directory**: `saas-design-extracted/dist`
- [ ] **Environment Variables**:

| Değişken | Açıklama |
|----------|----------|
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_ANON_KEY` | anon public key (sunucuda gerekli) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (sunucu / webhook) |
| `VITE_SUPABASE_URL` | Frontend build için aynı URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend build için anon key |
| `PUBLIC_APP_URL` | Canlı site URL’si |
| `APP_DOMAIN` | Aynı |
| `ADMIN_PASSWORD` | Admin şifresi |
| `ADMIN_EMAIL` | Admin e-posta |
| `OPENAI_API_KEY` | (gerekirse) |

---

## 3. Son Kontroller

- [ ] Site ve `/fiyatlandirma` açılıyor
- [ ] `/login` ile kayıt / giriş çalışıyor
- [ ] Hesap ayarları ve kredi bilgisi geliyor

---

## Özet Mimari

| Bileşen | Servis | Rol |
|--------|--------|-----|
| Frontend + API | **Vercel** | React + `/api/*` |
| Veritabanı | **Supabase** | `users`, `plans`, `images` |
| Auth | **Supabase Auth** | E-posta + şifre |
