
-- Profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  nom text NOT NULL DEFAULT 'Eric Kpakpo',
  email text NOT NULL DEFAULT 'erickpakpo786@gmail.com',
  avatar_url text DEFAULT 'https://i.ibb.co/pvMbk9MY/1771882604239.jpg',
  access_code_hash text NOT NULL DEFAULT 'DEFAULT_HASH',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles lisibles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles modifiables" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "Profiles insertables" ON public.profiles FOR INSERT WITH CHECK (true);

-- Dépenses table
CREATE TABLE IF NOT EXISTS public.depenses (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  titre text NOT NULL,
  montant numeric NOT NULL DEFAULT 0,
  devise text NOT NULL DEFAULT 'XOF',
  categorie text NOT NULL DEFAULT 'Autre',
  note text,
  date_depense date NOT NULL DEFAULT CURRENT_DATE,
  semaine_num integer GENERATED ALWAYS AS (EXTRACT(week FROM date_depense)::integer) STORED,
  mois_num integer GENERATED ALWAYS AS (EXTRACT(month FROM date_depense)::integer) STORED,
  annee_num integer GENERATED ALWAYS AS (EXTRACT(year FROM date_depense)::integer) STORED,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Depenses accessibles" ON public.depenses FOR ALL USING (true) WITH CHECK (true);

-- Coffre-fort identifiants
CREATE TABLE IF NOT EXISTS public.coffre_fort (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  type_entree text NOT NULL DEFAULT 'compte',
  nom text NOT NULL,
  site_url text,
  email_identifiant text,
  mot_de_passe_visible text,
  telephone text,
  note text,
  ordre integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.coffre_fort ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coffre fort accessible" ON public.coffre_fort FOR ALL USING (true) WITH CHECK (true);

-- Médias
CREATE TABLE IF NOT EXISTS public.medias (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  nom text NOT NULL,
  type_media text NOT NULL DEFAULT 'photo',
  url text NOT NULL,
  taille_bytes bigint,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.medias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Medias accessibles" ON public.medias FOR ALL USING (true) WITH CHECK (true);

-- Liens et contacts
CREATE TABLE IF NOT EXISTS public.liens_contacts (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  type_entree text NOT NULL DEFAULT 'lien',
  nom text NOT NULL,
  valeur text NOT NULL,
  description text,
  ordre integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.liens_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Liens contacts accessibles" ON public.liens_contacts FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('mes-secrets-media', 'mes-secrets-media', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Media upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'mes-secrets-media');
CREATE POLICY "Media select" ON storage.objects FOR SELECT USING (bucket_id = 'mes-secrets-media');
CREATE POLICY "Media delete" ON storage.objects FOR DELETE USING (bucket_id = 'mes-secrets-media');

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_coffre_fort_updated_at BEFORE UPDATE ON public.coffre_fort FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
