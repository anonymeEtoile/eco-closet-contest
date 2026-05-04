REVOKE ALL ON FUNCTION public.profile_has_auth_user(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cleanup_orphan_profiles() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.profile_has_auth_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_orphan_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;