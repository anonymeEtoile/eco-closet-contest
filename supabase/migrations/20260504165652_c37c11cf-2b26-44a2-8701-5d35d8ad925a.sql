DROP FUNCTION IF EXISTS public.profile_has_auth_user(uuid);
DROP FUNCTION IF EXISTS public.cleanup_orphan_profiles();
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;