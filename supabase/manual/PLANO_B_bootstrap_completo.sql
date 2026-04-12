-- =============================================================================
-- PLANO B — SL TURISMO | Bootstrap completo do Supabase (UM ÚNICO FICHEIRO)
-- =============================================================================
-- Para quem prefere NÃO abrir 3 migrações à parte: copie TUDO abaixo desta
-- linha e cole no Supabase → SQL Editor → New query → Run (uma vez só).
--
-- REGRAS:
-- • Use num projeto Supabase NOVO ou vazio. Não execute de novo no mesmo
--   projeto (vai dar erro de "já existe").
-- • Depois: Vercel com VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.
-- • Crie conta no /admin, depois rode o SQL do admin no fim deste ficheiro
--   (secção comentada) com o UUID do utilizador.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- BLOCO 1 — Schema base (roles, pedidos, galeria, eventos, conteúdo, storage)
-- (equivalente a 20260407024237_7ffe16d8-77ad-46cc-82ba-e483adbe3443.sql)
-- -----------------------------------------------------------------------------

CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE public.travel_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  destination TEXT NOT NULL,
  dates TEXT,
  budget TEXT,
  trip_type TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.travel_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a travel request" ON public.travel_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view travel requests" ON public.travel_requests FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update travel requests" ON public.travel_requests FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete travel requests" ON public.travel_requests FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT,
  description TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view gallery images" ON public.gallery_images FOR SELECT USING (true);
CREATE POLICY "Admins can insert gallery images" ON public.gallery_images FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update gallery images" ON public.gallery_images FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete gallery images" ON public.gallery_images FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  event_date TEXT,
  location TEXT,
  spots INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins can insert events" ON public.events FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update events" ON public.events FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete events" ON public.events FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view site content" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Admins can update site content" ON public.site_content FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert site content" ON public.site_content FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('events', 'events', true);

CREATE POLICY "Gallery images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Admins can upload gallery images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete gallery images" ON storage.objects FOR DELETE USING (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Event images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'events');
CREATE POLICY "Admins can upload event images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'events' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete event images" ON storage.objects FOR DELETE USING (bucket_id = 'events' AND public.has_role(auth.uid(), 'admin'));


-- -----------------------------------------------------------------------------
-- BLOCO 2 — Newsletter + bucket Cadastur
-- (equivalente a 20260408010822_d485b64e-25a0-4943-b2fd-486f8770c466.sql)
-- -----------------------------------------------------------------------------

CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Admins can view newsletter subscribers"
ON public.newsletter_subscribers FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete newsletter subscribers"
ON public.newsletter_subscribers FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO storage.buckets (id, name, public)
VALUES ('cadastur', 'cadastur', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view cadastur files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cadastur');

CREATE POLICY "Admins can upload cadastur files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cadastur' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete cadastur files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'cadastur' AND public.has_role(auth.uid(), 'admin'));


-- -----------------------------------------------------------------------------
-- BLOCO 3 — Reforço galeria + 5 fotos de exemplo no site
-- (equivalente a 20260411180000_seed_default_gallery.sql)
-- -----------------------------------------------------------------------------

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


-- =============================================================================
-- FIM DO SCRIPT AUTOMÁTICO
-- =============================================================================
--
-- PRÓXIMOS PASSOS (manual):
--
-- 1) No site, registe-se em /admin/login com email e password.
-- 2) No Supabase: Authentication → Users → copie o "User UID".
-- 3) Nova query SQL, descomente e edite:
--
--    INSERT INTO public.user_roles (user_id, role)
--    VALUES ('COLE-O-UUID-AQUI'::uuid, 'admin');
--
-- 4) Faça login de novo no painel.
-- =============================================================================
