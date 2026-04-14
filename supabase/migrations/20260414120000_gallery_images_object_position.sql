-- Ponto de foco opcional por foto (null = usar definição global em site_content.gallery)
ALTER TABLE public.gallery_images
  ADD COLUMN IF NOT EXISTS object_position text NULL;

COMMENT ON COLUMN public.gallery_images.object_position IS
  'CSS object-position na grelha em modo cover; NULL herda site_content.gallery.object_position';

NOTIFY pgrst, 'reload schema';
