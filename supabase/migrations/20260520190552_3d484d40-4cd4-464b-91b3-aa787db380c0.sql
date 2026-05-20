-- Add visibility toggle for vote counts
ALTER TABLE public.contest_settings 
ADD COLUMN IF NOT EXISTS votes_visibles boolean NOT NULL DEFAULT true;

-- Add tag_id to votes for per-theme voting
ALTER TABLE public.contest_votes 
ADD COLUMN IF NOT EXISTS tag_id uuid;

-- Backfill tag_id from photos
UPDATE public.contest_votes v
SET tag_id = p.tag_id
FROM public.contest_photos p
WHERE v.photo_id = p.id AND v.tag_id IS NULL;

-- Trigger to auto-set tag_id from photo
CREATE OR REPLACE FUNCTION public.set_vote_tag_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT tag_id INTO NEW.tag_id FROM public.contest_photos WHERE id = NEW.photo_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_vote_tag_id_trigger ON public.contest_votes;
CREATE TRIGGER set_vote_tag_id_trigger
BEFORE INSERT OR UPDATE ON public.contest_votes
FOR EACH ROW EXECUTE FUNCTION public.set_vote_tag_id();

-- Drop old unique constraint on voter_id alone (if exists from initial schema)
DO $$ 
DECLARE r record;
BEGIN
  FOR r IN SELECT conname FROM pg_constraint 
    WHERE conrelid = 'public.contest_votes'::regclass 
    AND contype = 'u'
  LOOP
    EXECUTE 'ALTER TABLE public.contest_votes DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- Unique vote per (voter, tag)
CREATE UNIQUE INDEX IF NOT EXISTS contest_votes_voter_tag_unique 
ON public.contest_votes(voter_id, tag_id);

-- Update RLS: restrict vote visibility based on settings
DROP POLICY IF EXISTS "Votes visible to authenticated users" ON public.contest_votes;

CREATE POLICY "Votes visibility based on settings"
ON public.contest_votes
FOR SELECT
TO authenticated
USING (
  auth.uid() = voter_id
  OR has_role(auth.uid(), 'moderateur'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.contest_settings WHERE votes_visibles = true)
);