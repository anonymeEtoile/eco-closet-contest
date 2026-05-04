DROP POLICY IF EXISTS "Super admins can update profiles" ON public.profiles;
CREATE POLICY "Super admins can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

DROP POLICY IF EXISTS "En ligne listings viewable" ON public.listings;
CREATE POLICY "Listings viewable by availability and owner"
ON public.listings
FOR SELECT
TO public
USING (
  status IN ('en_ligne'::public.listing_status, 'reserve'::public.listing_status)
  OR auth.uid() = seller_id
  OR public.has_role(auth.uid(), 'moderateur'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);