-- Garante tabela + RLS da galeria (idempotente), depois insere fotos padrão.
-- Exige que existam public.has_role e o tipo app_role (migração inicial do projeto).
-- Se der erro em has_role, rode antes supabase/migrations/20260407024237_7ffe16d8-77ad-46cc-82ba-e483adbe3443.sql

CREATE TABLE IF NOT EXISTS public.gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT,
  description TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view gallery images" ON public.gallery_images;
CREATE POLICY "Anyone can view gallery images" ON public.gallery_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert gallery images" ON public.gallery_images;
CREATE POLICY "Admins can insert gallery images" ON public.gallery_images FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update gallery images" ON public.gallery_images;
CREATE POLICY "Admins can update gallery images" ON public.gallery_images FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete gallery images" ON public.gallery_images;
CREATE POLICY "Admins can delete gallery images" ON public.gallery_images FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Gallery images are publicly accessible" ON storage.objects;
CREATE POLICY "Gallery images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');

DROP POLICY IF EXISTS "Admins can upload gallery images" ON storage.objects;
CREATE POLICY "Admins can upload gallery images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete gallery images" ON storage.objects;
CREATE POLICY "Admins can delete gallery images" ON storage.objects FOR DELETE USING (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));

-- Fotos padrão (/gallery-defaults/* no site). Só insere se a URL ainda não existir.

INSERT INTO public.gallery_images (url, category, title, description, display_order)
SELECT '/gallery-defaults/gallery-beach.jpg', 'Praias', 'Pôr do sol na praia', 'Momentos mágicos à beira-mar', 0
WHERE NOT EXISTS (SELECT 1 FROM public.gallery_images WHERE url = '/gallery-defaults/gallery-beach.jpg');

INSERT INTO public.gallery_images (url, category, title, description, display_order)
SELECT '/gallery-defaults/gallery-international.jpg', 'Internacional', 'Paris, França', 'Descobrindo o mundo com elegância', 1
WHERE NOT EXISTS (SELECT 1 FROM public.gallery_images WHERE url = '/gallery-defaults/gallery-international.jpg');

INSERT INTO public.gallery_images (url, category, title, description, display_order)
SELECT '/gallery-defaults/gallery-solo.jpg', 'Solo', 'Aventura solo', 'Liberdade para ir além', 2
WHERE NOT EXISTS (SELECT 1 FROM public.gallery_images WHERE url = '/gallery-defaults/gallery-solo.jpg');

INSERT INTO public.gallery_images (url, category, title, description, display_order)
SELECT '/gallery-defaults/gallery-group.jpg', 'Grupos', 'Viagem em grupo', 'Conexões que transformam', 3
WHERE NOT EXISTS (SELECT 1 FROM public.gallery_images WHERE url = '/gallery-defaults/gallery-group.jpg');

INSERT INTO public.gallery_images (url, category, title, description, display_order)
SELECT '/gallery-defaults/gallery-resort.jpg', 'Praias', 'Resort paradisíaco', 'Relaxamento e bem-estar', 4
WHERE NOT EXISTS (SELECT 1 FROM public.gallery_images WHERE url = '/gallery-defaults/gallery-resort.jpg');
