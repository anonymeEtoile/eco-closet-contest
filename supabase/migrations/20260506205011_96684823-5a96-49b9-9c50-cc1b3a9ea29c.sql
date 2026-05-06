
CREATE TABLE public.contest_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contest_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags readable by all" ON public.contest_tags FOR SELECT USING (true);
CREATE POLICY "Super admins manage tags" ON public.contest_tags FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

INSERT INTO public.contest_tags (label) VALUES
  ('La beauté de la nature'),
  ('L''impact néfaste de l''homme sur la biodiversité');

ALTER TABLE public.contest_photos ADD COLUMN tag_id uuid REFERENCES public.contest_tags(id) ON DELETE SET NULL;

ALTER TABLE public.contest_photos DROP CONSTRAINT IF EXISTS contest_photos_user_id_key;
CREATE UNIQUE INDEX contest_photos_user_tag_unique ON public.contest_photos (user_id, tag_id);
