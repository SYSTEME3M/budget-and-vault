
-- Table des utilisateurs Nexora (auth complète)
CREATE TABLE IF NOT EXISTS public.nexora_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_prenom TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  plan TEXT NOT NULL DEFAULT 'gratuit',
  badge_premium BOOLEAN NOT NULL DEFAULT false,
  remember_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.nexora_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nexora_users_public_read" ON public.nexora_users FOR SELECT USING (true);
CREATE POLICY "nexora_users_insert" ON public.nexora_users FOR INSERT WITH CHECK (true);
CREATE POLICY "nexora_users_update" ON public.nexora_users FOR UPDATE USING (true);
CREATE POLICY "nexora_users_delete" ON public.nexora_users FOR DELETE USING (true);

-- Table sessions sécurisées
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

-- Table abonnements
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

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_nexora_users_ts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_nexora_users_ts
  BEFORE UPDATE ON public.nexora_users
  FOR EACH ROW EXECUTE FUNCTION public.update_nexora_users_ts();

-- Admin par défaut (password_hash sera mis à jour par l'app au 1er login)
INSERT INTO public.nexora_users (nom_prenom, username, email, password_hash, is_admin, plan, badge_premium)
VALUES ('Eric Kpakpo', 'systeme3m', 'erickpakpo786@gmail.com', 'INIT', true, 'admin', true)
ON CONFLICT (username) DO NOTHING;
