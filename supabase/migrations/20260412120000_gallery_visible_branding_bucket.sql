-- Visibilidade por foto na galeria + bucket para logo da agência

ALTER TABLE public.gallery_images
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Branding files are publicly accessible" ON storage.objects;
CREATE POLICY "Branding files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'branding');

DROP POLICY IF EXISTS "Admins can upload branding files" ON storage.objects;
CREATE POLICY "Admins can upload branding files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete branding files" ON storage.objects;
CREATE POLICY "Admins can delete branding files"
ON storage.objects FOR DELETE
USING (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update branding files" ON storage.objects;
CREATE POLICY "Admins can update branding files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'));
