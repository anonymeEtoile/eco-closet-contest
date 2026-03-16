DROP POLICY IF EXISTS "Sellers and admins can delete listings" ON public.listings;

CREATE POLICY "Sellers, mods and admins can delete listings"
ON public.listings
FOR DELETE
TO authenticated
USING (
  auth.uid() = seller_id
  OR has_role(auth.uid(), 'moderateur'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);