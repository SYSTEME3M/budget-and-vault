
-- ═══════════════════════════════════════════════════════════
-- NEXORA - Full Database Schema
-- ═══════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══ UPDATE TIMESTAMP FUNCTION ═══
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ═══════════════════════════════════════════════════════════
-- 1. NEXORA USERS (custom auth)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.nexora_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_prenom TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'actif',
  plan TEXT NOT NULL DEFAULT 'gratuit',
  badge_premium BOOLEAN NOT NULL DEFAULT false,
  suspended_reason TEXT,
  blocked_reason TEXT,
  remember_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.nexora_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nexora_users_public_read" ON public.nexora_users FOR SELECT USING (true);
CREATE POLICY "nexora_users_insert" ON public.nexora_users FOR INSERT WITH CHECK (true);
CREATE POLICY "nexora_users_update" ON public.nexora_users FOR UPDATE USING (true);
CREATE POLICY "nexora_users_delete" ON public.nexora_users FOR DELETE USING (true);

CREATE TRIGGER trigger_nexora_users_ts
  BEFORE UPDATE ON public.nexora_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admin par défaut
INSERT INTO public.nexora_users (nom_prenom, username, email, password_hash, is_admin, plan, badge_premium)
VALUES ('Eric Kpakpo', 'systeme3m', 'erickpakpo786@gmail.com', 'INIT', true, 'admin', true)
ON CONFLICT (username) DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- 2. NEXORA SESSIONS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.nexora_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.nexora_users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_admin_session BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.nexora_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_all" ON public.nexora_sessions FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 3. ABONNEMENTS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.abonnements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.nexora_users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'premium',
  statut TEXT NOT NULL DEFAULT 'actif',
  date_debut TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  date_fin TIMESTAMP WITH TIME ZONE,
  montant NUMERIC NOT NULL DEFAULT 0,
  devise TEXT NOT NULL DEFAULT 'USD',
  mode_paiement TEXT,
  reference_paiement TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.abonnements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "abonnements_all" ON public.abonnements FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 4. DEPENSES (with user_id for isolation)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.depenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.nexora_users(id) ON DELETE CASCADE NOT NULL,
  titre TEXT NOT NULL,
  montant NUMERIC NOT NULL DEFAULT 0,
  devise TEXT NOT NULL DEFAULT 'XOF',
  categorie TEXT NOT NULL DEFAULT 'Autre',
  note TEXT,
  date_depense DATE NOT NULL DEFAULT CURRENT_DATE,
  semaine_num INTEGER,
  mois_num INTEGER,
  annee_num INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "depenses_user_access" ON public.depenses FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_depenses_date ON public.depenses(date_depense);
CREATE INDEX idx_depenses_user ON public.depenses(user_id);

CREATE OR REPLACE FUNCTION public.fill_depense_date_parts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.mois_num := EXTRACT(MONTH FROM NEW.date_depense)::integer;
  NEW.annee_num := EXTRACT(YEAR FROM NEW.date_depense)::integer;
  NEW.semaine_num := EXTRACT(WEEK FROM NEW.date_depense)::integer;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER fill_depense_date_parts_trigger
BEFORE INSERT OR UPDATE ON public.depenses
FOR EACH ROW EXECUTE FUNCTION public.fill_depense_date_parts();

-- ═══════════════════════════════════════════════════════════
-- 5. ENTREES (with user_id for isolation)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.entrees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.nexora_users(id) ON DELETE CASCADE NOT NULL,
  titre TEXT NOT NULL,
  montant NUMERIC NOT NULL DEFAULT 0,
  devise TEXT NOT NULL DEFAULT 'XOF',
  categorie TEXT NOT NULL DEFAULT 'Autre',
  note TEXT,
  date_entree DATE NOT NULL DEFAULT CURRENT_DATE,
  semaine_num INTEGER,
  mois_num INTEGER,
  annee_num INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.entrees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entrees_user_access" ON public.entrees FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_entrees_date ON public.entrees(date_entree);
CREATE INDEX idx_entrees_user ON public.entrees(user_id);

CREATE OR REPLACE FUNCTION public.fill_entree_date_parts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.mois_num := EXTRACT(MONTH FROM NEW.date_entree)::integer;
  NEW.annee_num := EXTRACT(YEAR FROM NEW.date_entree)::integer;
  NEW.semaine_num := EXTRACT(WEEK FROM NEW.date_entree)::integer;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER fill_entree_date_parts_trigger
BEFORE INSERT OR UPDATE ON public.entrees
FOR EACH ROW EXECUTE FUNCTION public.fill_entree_date_parts();

-- ═══════════════════════════════════════════════════════════
-- 6. COFFRE FORT (with user_id)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.coffre_fort (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.nexora_users(id) ON DELETE CASCADE NOT NULL,
  type_entree TEXT NOT NULL DEFAULT 'compte',
  nom TEXT NOT NULL,
  site_url TEXT,
  email_identifiant TEXT,
  mot_de_passe_visible TEXT,
  telephone TEXT,
  note TEXT,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.coffre_fort ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coffre_fort_access" ON public.coffre_fort FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_coffre_fort_updated_at
BEFORE UPDATE ON public.coffre_fort
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════════════════
-- 7. LIENS CONTACTS (with user_id)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.liens_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.nexora_users(id) ON DELETE CASCADE NOT NULL,
  type_entree TEXT NOT NULL DEFAULT 'lien',
  nom TEXT NOT NULL,
  valeur TEXT NOT NULL,
  description TEXT,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.liens_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "liens_contacts_access" ON public.liens_contacts FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 8. PRETS & REMBOURSEMENTS (with user_id)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.prets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.nexora_users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'pret',
  nom_personne TEXT NOT NULL,
  montant NUMERIC NOT NULL DEFAULT 0,
  montant_rembourse NUMERIC NOT NULL DEFAULT 0,
  devise TEXT NOT NULL DEFAULT 'XOF',
  objectif TEXT NOT NULL DEFAULT '',
  date_pret DATE NOT NULL DEFAULT CURRENT_DATE,
  date_echeance DATE,
  statut TEXT NOT NULL DEFAULT 'en_attente',
  signature_emprunteur TEXT,
  signature_temoin TEXT,
  signature_preteur TEXT,
  nom_temoin TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.prets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prets_access" ON public.prets FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.remboursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pret_id UUID REFERENCES public.prets(id) ON DELETE CASCADE,
  montant NUMERIC NOT NULL DEFAULT 0,
  devise TEXT NOT NULL DEFAULT 'XOF',
  date_remboursement DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.remboursements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "remboursements_access" ON public.remboursements FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 9. INVESTISSEMENTS / ÉPARGNE (with user_id)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.investissements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.nexora_users(id) ON DELETE CASCADE NOT NULL,
  nom TEXT NOT NULL,
  description TEXT,
  montant_objectif NUMERIC NOT NULL DEFAULT 0,
  montant_actuel NUMERIC NOT NULL DEFAULT 0,
  devise TEXT NOT NULL DEFAULT 'XOF',
  type_investissement TEXT NOT NULL DEFAULT 'epargne',
  date_debut DATE NOT NULL DEFAULT CURRENT_DATE,
  date_objectif DATE,
  statut TEXT NOT NULL DEFAULT 'actif',
  contrat_accepte BOOLEAN NOT NULL DEFAULT false,
  date_contrat TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.investissements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "investissements_access" ON public.investissements FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.versements_investissement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investissement_id UUID REFERENCES public.investissements(id) ON DELETE CASCADE,
  montant NUMERIC NOT NULL DEFAULT 0,
  devise TEXT NOT NULL DEFAULT 'XOF',
  type_operation TEXT NOT NULL DEFAULT 'depot',
  date_versement DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.versements_investissement ENABLE ROW LEVEL SECURITY;
CREATE POLICY "versements_access" ON public.versements_investissement FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 10. FACTURES (with user_id)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.factures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.nexora_users(id) ON DELETE CASCADE NOT NULL,
  numero TEXT NOT NULL,
  date_facture DATE NOT NULL DEFAULT CURRENT_DATE,
  vendeur_nom TEXT NOT NULL,
  vendeur_ifu TEXT,
  vendeur_adresse TEXT NOT NULL,
  vendeur_contact TEXT NOT NULL,
  vendeur_email TEXT,
  vendeur_vmcf TEXT,
  client_nom TEXT NOT NULL,
  client_ifu TEXT,
  client_adresse TEXT,
  client_contact TEXT NOT NULL,
  total NUMERIC NOT NULL DEFAULT 0,
  devise TEXT NOT NULL DEFAULT 'XOF',
  mode_paiement TEXT NOT NULL DEFAULT 'ESPECES',
  statut TEXT NOT NULL DEFAULT 'payee',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "factures_access" ON public.factures FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.articles_facture (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id UUID NOT NULL REFERENCES public.factures(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prix_unitaire NUMERIC NOT NULL DEFAULT 0,
  quantite NUMERIC NOT NULL DEFAULT 1,
  montant NUMERIC NOT NULL DEFAULT 0,
  ordre INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.articles_facture ENABLE ROW LEVEL SECURITY;
CREATE POLICY "articles_access" ON public.articles_facture FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_factures_updated_at
BEFORE UPDATE ON public.factures
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════════════════
-- 11. BOUTIQUES (with user_id)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.boutiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.nexora_users(id) ON DELETE CASCADE NOT NULL,
  nom TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  telephone TEXT,
  email TEXT,
  adresse TEXT,
  type_boutique TEXT NOT NULL DEFAULT 'physique',
  devise TEXT NOT NULL DEFAULT 'XOF',
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.boutiques ENABLE ROW LEVEL SECURITY;
CREATE POLICY "boutiques_read" ON public.boutiques FOR SELECT USING (true);
CREATE POLICY "boutiques_write" ON public.boutiques FOR INSERT WITH CHECK (true);
CREATE POLICY "boutiques_update" ON public.boutiques FOR UPDATE USING (true);
CREATE POLICY "boutiques_delete" ON public.boutiques FOR DELETE USING (true);

CREATE TRIGGER update_boutiques_updated_at
BEFORE UPDATE ON public.boutiques
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════════════════
-- 12. PRODUITS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.produits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID REFERENCES public.boutiques(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.nexora_users(id) ON DELETE CASCADE NOT NULL,
  nom TEXT NOT NULL,
  description TEXT,
  prix NUMERIC NOT NULL DEFAULT 0,
  prix_promo NUMERIC,
  devise TEXT NOT NULL DEFAULT 'XOF',
  categorie TEXT NOT NULL DEFAULT 'Autre',
  type_produit TEXT NOT NULL DEFAULT 'physique',
  images TEXT[] DEFAULT '{}',
  stock INTEGER DEFAULT 0,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "produits_read" ON public.produits FOR SELECT USING (true);
CREATE POLICY "produits_write" ON public.produits FOR INSERT WITH CHECK (true);
CREATE POLICY "produits_update" ON public.produits FOR UPDATE USING (true);
CREATE POLICY "produits_delete" ON public.produits FOR DELETE USING (true);

CREATE TRIGGER update_produits_updated_at
BEFORE UPDATE ON public.produits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════════════════
-- 13. COMMANDES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.commandes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID REFERENCES public.boutiques(id) ON DELETE CASCADE,
  produit_id UUID REFERENCES public.produits(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.nexora_users(id) ON DELETE SET NULL,
  numero TEXT NOT NULL,
  client_nom TEXT NOT NULL,
  client_telephone TEXT,
  client_email TEXT,
  montant NUMERIC NOT NULL DEFAULT 0,
  devise TEXT NOT NULL DEFAULT 'XOF',
  statut TEXT NOT NULL DEFAULT 'en_attente',
  quantite INTEGER NOT NULL DEFAULT 1,
  acheteur_id TEXT,
  kkiapay_id TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.commandes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commandes_all" ON public.commandes FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 14. NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.nexora_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.nexora_users(id) ON DELETE CASCADE NOT NULL,
  titre TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  lu BOOLEAN NOT NULL DEFAULT false,
  lien TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.nexora_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_all" ON public.nexora_notifications FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 15. LOGS ADMIN
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.nexora_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.nexora_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.nexora_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs_all" ON public.nexora_logs FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 16. ANNONCES IMMOBILIER (with user_id)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.nexora_annonces_immo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.nexora_users(id) ON DELETE CASCADE NOT NULL,
  titre TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'vente',
  prix NUMERIC NOT NULL DEFAULT 0,
  devise TEXT NOT NULL DEFAULT 'XOF',
  ville TEXT NOT NULL,
  quartier TEXT,
  adresse TEXT,
  surface NUMERIC,
  chambres INTEGER,
  images TEXT[] DEFAULT '{}',
  statut TEXT NOT NULL DEFAULT 'disponible',
  contact_telephone TEXT,
  contact_whatsapp TEXT,
  favoris TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.nexora_annonces_immo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "annonces_immo_read" ON public.nexora_annonces_immo FOR SELECT USING (true);
CREATE POLICY "annonces_immo_write" ON public.nexora_annonces_immo FOR INSERT WITH CHECK (true);
CREATE POLICY "annonces_immo_update" ON public.nexora_annonces_immo FOR UPDATE USING (true);
CREATE POLICY "annonces_immo_delete" ON public.nexora_annonces_immo FOR DELETE USING (true);

-- ═══════════════════════════════════════════════════════════
-- 17. MEDIAS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.medias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.nexora_users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  type_media TEXT NOT NULL DEFAULT 'photo',
  url TEXT NOT NULL,
  taille_bytes BIGINT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.medias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "medias_all" ON public.medias FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 18. CATEGORIES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  icone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_all" ON public.categories FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 19. PROFILES (legacy)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL DEFAULT 'User',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  access_code_hash TEXT NOT NULL DEFAULT 'DEFAULT_HASH',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_all" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 20. APP_USERS (legacy)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  access_code_hash TEXT NOT NULL DEFAULT 'DEFAULT_HASH',
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  features JSONB NOT NULL DEFAULT '{"depenses": true}'::jsonb,
  theme_color TEXT NOT NULL DEFAULT '#1a56db',
  login_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_users_all" ON public.app_users FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- STORAGE BUCKET
-- ═══════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public) VALUES ('mes-secrets-media', 'mes-secrets-media', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('nexora-boutique', 'nexora-boutique', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('nexora-avatars', 'nexora-avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('nexora-immo', 'nexora-immo', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Storage public read" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "Storage public insert" ON storage.objects FOR INSERT WITH CHECK (true);
CREATE POLICY "Storage public update" ON storage.objects FOR UPDATE USING (true);
CREATE POLICY "Storage public delete" ON storage.objects FOR DELETE USING (true);
