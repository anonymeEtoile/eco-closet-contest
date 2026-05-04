ALTER TABLE public.event_settings
  ADD COLUMN IF NOT EXISTS reservation_salle text NOT NULL DEFAULT 'Salle A101',
  ADD COLUMN IF NOT EXISTS reservation_date date,
  ADD COLUMN IF NOT EXISTS reservation_heure time without time zone;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contest_votes_one_vote_per_user'
  ) THEN
    ALTER TABLE public.contest_votes
      ADD CONSTRAINT contest_votes_one_vote_per_user UNIQUE (voter_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.profile_has_auth_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.cleanup_orphan_profiles()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  deleted_count integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin'::public.app_role) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  WITH deleted AS (
    DELETE FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM auth.users u WHERE u.id = p.id
    )
    RETURNING 1
  )
  SELECT count(*) INTO deleted_count FROM deleted;

  DELETE FROM public.user_roles r
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = r.user_id
  );

  RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.profile_has_auth_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_orphan_profiles() TO authenticated;