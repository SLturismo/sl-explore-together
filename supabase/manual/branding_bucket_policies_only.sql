-- Correr no SQL Editor se a migração falhar com:
-- ERROR 42710: policy "Admins can upload branding files" ... already exists
-- 1) Executa só este bloco (apaga e recria políticas do bucket branding).
-- 2) Depois, se ainda não tiveres is_visible na galeria, corre o ALTER da migração principal.

DROP POLICY IF EXISTS "Branding files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload branding files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete branding files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update branding files" ON storage.objects;

CREATE POLICY "Branding files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'branding');

CREATE POLICY "Admins can upload branding files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete branding files"
ON storage.objects FOR DELETE
USING (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update branding files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'));
