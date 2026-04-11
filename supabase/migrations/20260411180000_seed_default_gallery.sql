-- Default gallery rows pointing at /gallery-defaults/* (files in public/).
-- Each row is inserted only if that URL is not already present.

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
