-- Table des factures
CREATE TABLE public.factures (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  numero text NOT NULL UNIQUE,
  date_facture date NOT NULL DEFAULT CURRENT_DATE,

  -- Vendeur
  vendeur_nom text NOT NULL,
  vendeur_ifu text,
  vendeur_adresse text NOT NULL,
  vendeur_contact text NOT NULL,
  vendeur_email text,
  vendeur_vmcf text,

  -- Client
  client_nom text NOT NULL,
  client_ifu text,
  client_adresse text,
  client_contact text NOT NULL,

  -- Totaux
  total numeric NOT NULL DEFAULT 0,
  devise text NOT NULL DEFAULT 'XOF',
  mode_paiement text NOT NULL DEFAULT 'ESPECES',
  statut text NOT NULL DEFAULT 'payee' CHECK (statut IN ('payee', 'en_attente', 'annulee')),
  note text,

  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Factures accessibles" ON public.factures
  FOR ALL TO public USING (true) WITH CHECK (true);

CREATE INDEX idx_factures_date ON public.factures(date_facture);
CREATE INDEX idx_factures_numero ON public.factures(numero);

-- Table des articles de facture
CREATE TABLE public.articles_facture (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  facture_id uuid NOT NULL REFERENCES public.factures(id) ON DELETE CASCADE,
  nom text NOT NULL,
  prix_unitaire numeric NOT NULL DEFAULT 0,
  quantite numeric NOT NULL DEFAULT 1,
  montant numeric NOT NULL DEFAULT 0,
  ordre integer NOT NULL DEFAULT 0
);

ALTER TABLE public.articles_facture ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Articles accessibles" ON public.articles_facture
  FOR ALL TO public USING (true) WITH CHECK (true);

CREATE INDEX idx_articles_facture ON public.articles_facture(facture_id);

-- Trigger updated_at
CREATE TRIGGER update_factures_updated_at
BEFORE UPDATE ON public.factures
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
