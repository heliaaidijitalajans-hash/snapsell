-- Library session restore: original image, SEO, AI config, cached price analysis.
-- Safe to run multiple times.

ALTER TABLE public.images ADD COLUMN IF NOT EXISTS original_image_url text;
ALTER TABLE public.images ADD COLUMN IF NOT EXISTS seo_description text;
ALTER TABLE public.images ADD COLUMN IF NOT EXISTS config jsonb;
ALTER TABLE public.images ADD COLUMN IF NOT EXISTS price_analysis jsonb;
ALTER TABLE public.images ADD COLUMN IF NOT EXISTS metadata jsonb;

COMMENT ON COLUMN public.images.original_image_url IS 'Uploaded source image URL for before/after restore.';
COMMENT ON COLUMN public.images.seo_description IS 'SEO text generated with the transformation.';
COMMENT ON COLUMN public.images.config IS 'AI configuration snapshot (marketplace, ratio, quality, style, …).';
COMMENT ON COLUMN public.images.price_analysis IS 'Cached Price Analysis view fields; never recalculate when restoring.';
COMMENT ON COLUMN public.images.metadata IS 'Optional extra session metadata.';

-- Allow owners to update own rows (e.g. attach price_analysis after first analysis).
DROP POLICY IF EXISTS "images_update_own" ON public.images;
CREATE POLICY "images_update_own"
ON public.images
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
