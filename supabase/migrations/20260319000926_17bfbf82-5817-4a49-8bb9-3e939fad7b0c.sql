
-- Table des prêts et dettes
CREATE TABLE IF NOT EXISTS public.prets (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  type text NOT NULL DEFAULT 'pret',
  nom_personne text NOT NULL,
  montant numeric NOT NULL DEFAULT 0,
  montant_rembourse numeric NOT NULL DEFAULT 0,
  devise text NOT NULL DEFAULT 'XOF',
  objectif text NOT NULL DEFAULT '',
  date_pret date NOT NULL DEFAULT CURRENT_DATE,
  date_echeance date,
  statut text NOT NULL DEFAULT 'en_attente',
  signature_emprunteur text,
  signature_temoin text,
  signature_preteur text,
  nom_temoin text,
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.prets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prets accessibles" ON public.prets FOR ALL TO public USING (true) WITH CHECK (true);

-- Table des remboursements
CREATE TABLE IF NOT EXISTS public.remboursements (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  pret_id uuid REFERENCES public.prets(id) ON DELETE CASCADE,
  montant numeric NOT NULL DEFAULT 0,
  devise text NOT NULL DEFAULT 'XOF',
  date_remboursement date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.remboursements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Remboursements accessibles" ON public.remboursements FOR ALL TO public USING (true) WITH CHECK (true);

-- Table des investissements / épargnes
CREATE TABLE IF NOT EXISTS public.investissements (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  nom text NOT NULL,
  description text,
  montant_objectif numeric NOT NULL DEFAULT 0,
  montant_actuel numeric NOT NULL DEFAULT 0,
  devise text NOT NULL DEFAULT 'XOF',
  type_investissement text NOT NULL DEFAULT 'epargne',
  date_debut date NOT NULL DEFAULT CURRENT_DATE,
  date_objectif date,
  statut text NOT NULL DEFAULT 'actif',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.investissements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Investissements accessibles" ON public.investissements FOR ALL TO public USING (true) WITH CHECK (true);

-- Table des versements d'investissements
CREATE TABLE IF NOT EXISTS public.versements_investissement (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  investissement_id uuid REFERENCES public.investissements(id) ON DELETE CASCADE,
  montant numeric NOT NULL DEFAULT 0,
  devise text NOT NULL DEFAULT 'XOF',
  date_versement date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.versements_investissement ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Versements accessibles" ON public.versements_investissement FOR ALL TO public USING (true) WITH CHECK (true);
