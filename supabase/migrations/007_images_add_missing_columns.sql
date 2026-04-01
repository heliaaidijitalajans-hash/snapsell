-- images tablosu daha önce farklı şemayla oluşturulduysa (user_id yok) 004 hata verir.
-- Bu dosyayı 004'ten ÖNCE veya 004 başarısız olduktan SONRA çalıştırın.

-- Yaygın: userid (alt çizgisiz) → user_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'images' AND column_name = 'userid'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'images' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.images RENAME COLUMN userid TO user_id;
  END IF;
END $$;

-- Eksik sütunları ekle (tablo zaten varsa)
ALTER TABLE public.images ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.images ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.images ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.images ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public.images ADD COLUMN IF NOT EXISTS prompt text;

-- id yoksa (nadir): yeni tablo gerekir; el ile kontrol edin
-- image_url / user_id NOT NULL gerekiyorsa önce veriyi doldurun:
-- UPDATE public.images SET user_id = auth.uid() WHERE user_id IS NULL; -- uygun değil, örnek

CREATE INDEX IF NOT EXISTS images_user_created_idx ON public.images (user_id, created_at DESC);

ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "images_select_own" ON public.images;
CREATE POLICY "images_select_own"
ON public.images
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "images_insert_own" ON public.images;
CREATE POLICY "images_insert_own"
ON public.images
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.images IS 'Uretilen gorseller (kutuphane).';

-- Storage (004 ile aynı; yoksa ekler)
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO UPDATE SET public = excluded.public;

DROP POLICY IF EXISTS "generated_images_public_read" ON storage.objects;
CREATE POLICY "generated_images_public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'generated-images');

DROP POLICY IF EXISTS "generated_images_authenticated_upload_own" ON storage.objects;
CREATE POLICY "generated_images_authenticated_upload_own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'generated-images'
  AND split_part(name, '/', 1) = auth.uid()::text
);
