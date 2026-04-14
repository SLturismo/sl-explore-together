-- Ponto de foco por clique (percentagens 0–100); NULL = herdar object_position / Conteúdo
ALTER TABLE public.gallery_images
  ADD COLUMN IF NOT EXISTS focal_x smallint NULL,
  ADD COLUMN IF NOT EXISTS focal_y smallint NULL;

COMMENT ON COLUMN public.gallery_images.focal_x IS
  'object-position X em % (0–100) no modo cover; usar com focal_y';
COMMENT ON COLUMN public.gallery_images.focal_y IS
  'object-position Y em % (0–100) no modo cover; usar com focal_x';

NOTIFY pgrst, 'reload schema';
