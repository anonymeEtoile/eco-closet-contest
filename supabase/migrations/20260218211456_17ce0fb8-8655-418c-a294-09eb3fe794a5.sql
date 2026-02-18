
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- App roles enum
CREATE TYPE public.app_role AS ENUM ('eleve', 'moderateur', 'super_admin');

-- Listing status enum
CREATE TYPE public.listing_status AS ENUM ('brouillon', 'en_attente', 'en_ligne', 'reserve', 'termine');

-- Photo status enum
CREATE TYPE public.photo_status AS ENUM ('en_attente', 'validee', 'refusee');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  classe TEXT NOT NULL,
  email TEXT NOT NULL,
  suspended BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'eleve',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User roles are viewable by authenticated users" ON public.user_roles
  FOR SELECT TO authenticated USING (true);

-- Security definer function to check roles (created BEFORE policies that use it)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Only super_admin can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Event settings table (singleton)
CREATE TABLE public.event_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_text TEXT NOT NULL DEFAULT 'Les éco-délégués du lycée Marie Madeleine Fourcade organisent une vente et don de vêtements solidaire.',
  semaine_collecte_start DATE,
  semaine_collecte_end DATE,
  point_collecte_date DATE,
  lieux_depot TEXT[] NOT NULL DEFAULT ARRAY['Salle A101', 'Hall principal'],
  instructions_remise TEXT NOT NULL DEFAULT 'Rendez-vous dans la salle indiquée lors de votre réservation aux horaires de dépôt.',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event settings readable by all" ON public.event_settings
  FOR SELECT USING (true);

CREATE POLICY "Only super_admin can update event settings" ON public.event_settings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'::app_role));

INSERT INTO public.event_settings (presentation_text)
VALUES ('Les éco-délégués du lycée Marie Madeleine Fourcade organisent une vente et don de vêtements solidaire. Participez à notre démarche écologique en donnant une seconde vie à vos vêtements !');

-- Listings table
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('vente', 'don')),
  price DECIMAL(10, 2),
  taille TEXT,
  marque TEXT,
  categorie TEXT,
  etat TEXT,
  photos TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status listing_status NOT NULL DEFAULT 'en_attente',
  refus_motif TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "En ligne listings viewable" ON public.listings
  FOR SELECT USING (
    status = 'en_ligne' OR
    auth.uid() = seller_id OR
    public.has_role(auth.uid(), 'moderateur'::app_role) OR
    public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Authenticated users can insert listings" ON public.listings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers and mods can update listings" ON public.listings
  FOR UPDATE TO authenticated USING (
    auth.uid() = seller_id OR
    public.has_role(auth.uid(), 'moderateur'::app_role) OR
    public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Sellers and admins can delete listings" ON public.listings
  FOR DELETE TO authenticated USING (
    auth.uid() = seller_id OR
    public.has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Favorites table
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites" ON public.favorites
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites" ON public.favorites
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Reservations table
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (listing_id)
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reservations visible to involved parties" ON public.reservations
  FOR SELECT TO authenticated USING (
    auth.uid() = buyer_id OR
    EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND seller_id = auth.uid()) OR
    public.has_role(auth.uid(), 'moderateur'::app_role) OR
    public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Authenticated users can reserve" ON public.reservations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);

-- Contest settings table
CREATE TABLE public.contest_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL DEFAULT 'Concours Photo Nature',
  description TEXT NOT NULL DEFAULT 'Exprimez votre sensibilité à la nature à travers votre objectif.',
  theme TEXT NOT NULL DEFAULT 'La nature en ville',
  date_limite TIMESTAMP WITH TIME ZONE,
  recompenses TEXT,
  votes_actifs BOOLEAN NOT NULL DEFAULT FALSE,
  classement_public BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contest_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contest settings readable by all" ON public.contest_settings
  FOR SELECT USING (true);

CREATE POLICY "Only super_admin can update contest settings" ON public.contest_settings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'::app_role));

INSERT INTO public.contest_settings (titre, description, theme, recompenses)
VALUES (
  'Concours Photo Nature 🌿',
  'Exprimez votre sensibilité à la nature à travers votre objectif. Ce concours est ouvert à tous les élèves du lycée Marie Madeleine Fourcade.',
  'La nature en ville',
  '1er prix : Bon d''achat 50€ | 2e prix : Bon d''achat 30€ | 3e prix : Bon d''achat 20€'
);

-- Contest photos table
CREATE TABLE public.contest_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  description TEXT,
  photo_url TEXT NOT NULL,
  status photo_status NOT NULL DEFAULT 'en_attente',
  refus_motif TEXT,
  banned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.contest_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Validated photos viewable by authenticated" ON public.contest_photos
  FOR SELECT TO authenticated USING (
    status = 'validee' OR
    auth.uid() = user_id OR
    public.has_role(auth.uid(), 'moderateur'::app_role) OR
    public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Authenticated users can insert their photo" ON public.contest_photos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and mods can update photos" ON public.contest_photos
  FOR UPDATE TO authenticated USING (
    auth.uid() = user_id OR
    public.has_role(auth.uid(), 'moderateur'::app_role) OR
    public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Mods and admins can delete photos" ON public.contest_photos
  FOR DELETE TO authenticated USING (
    auth.uid() = user_id OR
    public.has_role(auth.uid(), 'moderateur'::app_role) OR
    public.has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Contest votes table
CREATE TABLE public.contest_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES public.contest_photos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (voter_id)
);

ALTER TABLE public.contest_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes visible to authenticated users" ON public.contest_votes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage their own vote" ON public.contest_votes
  FOR ALL TO authenticated USING (auth.uid() = voter_id) WITH CHECK (auth.uid() = voter_id);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings-photos', 'listings-photos', true)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('contest-photos', 'contest-photos', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Anyone can view listing photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'listings-photos');

CREATE POLICY "Authenticated users can upload listing photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'listings-photos');

CREATE POLICY "Anyone can view contest photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'contest-photos');

CREATE POLICY "Authenticated users can upload contest photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'contest-photos');

-- Function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, prenom, nom, classe, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'prenom', 'Inconnu'),
    COALESCE(NEW.raw_user_meta_data->>'nom', 'INCONNU'),
    COALESCE(NEW.raw_user_meta_data->>'classe', ''),
    NEW.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'eleve'::app_role));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
