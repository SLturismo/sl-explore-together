-- Garante UPDATE com WITH CHECK (alguns casos em PG15+ / RLS com colunas novas).
DROP POLICY IF EXISTS "Admins can update gallery images" ON public.gallery_images;
CREATE POLICY "Admins can update gallery images"
ON public.gallery_images
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
