
-- Table des entrées (revenus)
CREATE TABLE public.entrees (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  titre text NOT NULL,
  montant numeric NOT NULL DEFAULT 0,
  devise text NOT NULL DEFAULT 'XOF',
  categorie text NOT NULL DEFAULT 'Autre',
  note text,
  date_entree date NOT NULL DEFAULT CURRENT_DATE,
  semaine_num integer,
  mois_num integer,
  annee_num integer,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.entrees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Entrees accessibles" ON public.entrees
  FOR ALL TO public USING (true) WITH CHECK (true);

CREATE INDEX idx_entrees_date ON public.entrees(date_entree);
CREATE INDEX idx_entrees_semaine ON public.entrees(annee_num, semaine_num);
CREATE INDEX idx_entrees_mois ON public.entrees(annee_num, mois_num);

-- Auto-fill date parts on insert/update
CREATE OR REPLACE FUNCTION public.fill_entree_date_parts()
RETURNS TRIGGER AS $$
DECLARE
  d date := NEW.date_entree;
BEGIN
  NEW.mois_num := EXTRACT(MONTH FROM d)::integer;
  NEW.annee_num := EXTRACT(YEAR FROM d)::integer;
  NEW.semaine_num := EXTRACT(WEEK FROM d)::integer;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER fill_entree_date_parts_trigger
BEFORE INSERT OR UPDATE ON public.entrees
FOR EACH ROW EXECUTE FUNCTION public.fill_entree_date_parts();

-- Same auto-fill for depenses
CREATE OR REPLACE FUNCTION public.fill_depense_date_parts()
RETURNS TRIGGER AS $$
DECLARE
  d date := NEW.date_depense;
BEGIN
  NEW.mois_num := EXTRACT(MONTH FROM d)::integer;
  NEW.annee_num := EXTRACT(YEAR FROM d)::integer;
  NEW.semaine_num := EXTRACT(WEEK FROM d)::integer;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS fill_depense_date_parts_trigger ON public.depenses;
CREATE TRIGGER fill_depense_date_parts_trigger
BEFORE INSERT OR UPDATE ON public.depenses
FOR EACH ROW EXECUTE FUNCTION public.fill_depense_date_parts();

-- App users table (admin manages sub-users)
CREATE TABLE public.app_users (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  nom text NOT NULL,
  email text NOT NULL UNIQUE,
  access_code_hash text NOT NULL DEFAULT 'DEFAULT_HASH',
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  features jsonb NOT NULL DEFAULT '{"depenses": true, "coffre_fort": false, "medias": false, "liens": false, "entrees": false}'::jsonb,
  theme_color text NOT NULL DEFAULT '#1a56db',
  login_token text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "App users admin access" ON public.app_users
  FOR ALL TO public USING (true) WITH CHECK (true);

CREATE TRIGGER update_app_users_updated_at
BEFORE UPDATE ON public.app_users
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
