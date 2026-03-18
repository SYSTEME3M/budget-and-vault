-- Activer l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Table des prêts
CREATE TABLE public.prets (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL, -- sécurité avec auth.uid()
  type text NOT NULL CHECK (type IN ('pret', 'dette')),
  nom_personne text NOT NULL,
  montant numeric NOT NULL DEFAULT 0,
  montant_rembourse numeric NOT NULL DEFAULT 0,
  devise text NOT NULL DEFAULT 'XOF',
  objectif text NOT NULL,
  date_pret timestamp with time zone NOT NULL DEFAULT now(),
  date_echeance date,
  statut text NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'partiel', 'rembourse')),
  signature_emprunteur text,
  signature_temoin text,
  signature_preteur text,
  nom_temoin text,
  note text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.prets ENABLE ROW LEVEL SECURITY;

-- Politique sécurisée avec auth.uid()
CREATE POLICY "Prets accessibles"
ON public.prets
FOR ALL
TO public
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Table des remboursements
CREATE TABLE public.remboursements (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL, -- sécurité avec auth.uid()
  pret_id uuid NOT NULL REFERENCES public.prets(id) ON DELETE CASCADE,
  montant numeric NOT NULL DEFAULT 0,
  devise text NOT NULL DEFAULT 'XOF',
  date_remboursement timestamp with time zone NOT NULL DEFAULT now(),
  note text,
  created_at timestamp with time zone DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.remboursements ENABLE ROW LEVEL SECURITY;

-- Politique sécurisée avec auth.uid()
CREATE POLICY "Remboursements accessibles"
ON public.remboursements
FOR ALL
TO public
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Trigger updated_at
CREATE TRIGGER update_prets_updated_at
BEFORE UPDATE ON public.prets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
