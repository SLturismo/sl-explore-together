-- Miniatura dos eventos: mesmo modelo de recorte 4:3 que gallery_images (percentagens na imagem original).
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS crop_x double precision,
  ADD COLUMN IF NOT EXISTS crop_y double precision,
  ADD COLUMN IF NOT EXISTS crop_w double precision,
  ADD COLUMN IF NOT EXISTS crop_h double precision;
