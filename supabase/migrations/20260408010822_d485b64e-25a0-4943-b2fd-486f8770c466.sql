
-- Newsletter subscribers table
CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers FOR INSERT
TO public
WITH CHECK (true);

-- Only admins can view subscribers
CREATE POLICY "Admins can view newsletter subscribers"
ON public.newsletter_subscribers FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete subscribers
CREATE POLICY "Admins can delete newsletter subscribers"
ON public.newsletter_subscribers FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Cadastur storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('cadastur', 'cadastur', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for cadastur bucket
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
