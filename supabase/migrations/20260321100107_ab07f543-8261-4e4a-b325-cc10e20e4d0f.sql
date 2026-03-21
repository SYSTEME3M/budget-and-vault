
-- Add missing columns to boutiques
ALTER TABLE public.boutiques
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS pays TEXT DEFAULT 'Bénin',
  ADD COLUMN IF NOT EXISTS ville TEXT,
  ADD COLUMN IF NOT EXISTS pixel_facebook_id TEXT,
  ADD COLUMN IF NOT EXISTS pixel_actif BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS api_conversion_token TEXT,
  ADD COLUMN IF NOT EXISTS api_conversion_actif BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS domaine_personnalise TEXT,
  ADD COLUMN IF NOT EXISTS domaine_actif BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notifications_actives BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS banniere_url TEXT;

-- Add missing columns to produits
ALTER TABLE public.produits
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'physique',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS vedette BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stock_illimite BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS paiement_reception BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS paiement_lien TEXT,
  ADD COLUMN IF NOT EXISTS moyens_paiement JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS politique_remboursement TEXT,
  ADD COLUMN IF NOT EXISTS politique_confidentialite TEXT,
  ADD COLUMN IF NOT EXISTS reseaux_sociaux JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS poids TEXT,
  ADD COLUMN IF NOT EXISTS dimensions TEXT,
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS seo_titre TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS type_digital TEXT,
  ADD COLUMN IF NOT EXISTS mode_tarification TEXT DEFAULT 'unique',
  ADD COLUMN IF NOT EXISTS fichier_url TEXT,
  ADD COLUMN IF NOT EXISTS fichier_nom TEXT,
  ADD COLUMN IF NOT EXISTS fichier_taille TEXT,
  ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS protection_antipiratage BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS livraison_automatique BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS nb_telechargements INTEGER;

-- Create variations_produit table
CREATE TABLE IF NOT EXISTS public.variations_produit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produit_id UUID REFERENCES public.produits(id) ON DELETE CASCADE NOT NULL,
  nom TEXT NOT NULL,
  valeurs TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.variations_produit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "variations_all" ON public.variations_produit FOR ALL USING (true) WITH CHECK (true);

-- Add missing columns to commandes
ALTER TABLE public.commandes
  ADD COLUMN IF NOT EXISTS client_adresse TEXT,
  ADD COLUMN IF NOT EXISTS client_ville TEXT,
  ADD COLUMN IF NOT EXISTS client_pays TEXT DEFAULT 'Bénin',
  ADD COLUMN IF NOT EXISTS sous_total NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS frais_livraison NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mode_paiement TEXT DEFAULT 'A confirmer',
  ADD COLUMN IF NOT EXISTS statut_paiement TEXT DEFAULT 'en_attente';

-- Create articles_commande table
CREATE TABLE IF NOT EXISTS public.articles_commande (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id UUID REFERENCES public.commandes(id) ON DELETE CASCADE NOT NULL,
  produit_id UUID REFERENCES public.produits(id) ON DELETE SET NULL,
  nom_produit TEXT NOT NULL,
  prix_unitaire NUMERIC NOT NULL DEFAULT 0,
  quantite INTEGER NOT NULL DEFAULT 1,
  montant NUMERIC NOT NULL DEFAULT 0,
  photo_url TEXT,
  variations_choisies JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.articles_commande ENABLE ROW LEVEL SECURITY;
CREATE POLICY "articles_commande_all" ON public.articles_commande FOR ALL USING (true) WITH CHECK (true);

-- Add missing columns to factures
ALTER TABLE public.factures
  ADD COLUMN IF NOT EXISTS heure_facture TEXT,
  ADD COLUMN IF NOT EXISTS vendeur_pays TEXT DEFAULT 'Bénin',
  ADD COLUMN IF NOT EXISTS client_pays TEXT DEFAULT 'Bénin';
