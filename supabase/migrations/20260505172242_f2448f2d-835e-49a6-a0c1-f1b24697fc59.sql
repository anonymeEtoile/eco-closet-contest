ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false;

CREATE POLICY "Buyers and admins can cancel reservations"
ON public.reservations
FOR DELETE
TO authenticated
USING (
  auth.uid() = buyer_id
  OR public.has_role(auth.uid(), 'moderateur'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);