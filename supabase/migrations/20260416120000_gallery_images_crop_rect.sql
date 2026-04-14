-- Recorte editorial para miniaturas (percentagens da imagem natural); NULL = não usar (foco / object_position)
ALTER TABLE public.gallery_images
  ADD COLUMN IF NOT EXISTS crop_x smallint NULL,
  ADD COLUMN IF NOT EXISTS crop_y smallint NULL,
  ADD COLUMN IF NOT EXISTS crop_w smallint NULL,
  ADD COLUMN IF NOT EXISTS crop_h smallint NULL;

COMMENT ON COLUMN public.gallery_images.crop_x IS 'Borda esquerda do recorte em % da largura natural (0–100)';
COMMENT ON COLUMN public.gallery_images.crop_y IS 'Borda superior do recorte em % da altura natural (0–100)';
COMMENT ON COLUMN public.gallery_images.crop_w IS 'Largura do recorte em % da largura natural (0–100)';
COMMENT ON COLUMN public.gallery_images.crop_h IS 'Altura do recorte em % da altura natural (0–100)';

NOTIFY pgrst, 'reload schema';
