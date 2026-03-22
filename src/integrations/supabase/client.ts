import { createClient } from '@supabase/supabase-js';

// Récupération des clés avec une sécurité (fallback vide pour éviter le crash)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Vérification dans la console (visible uniquement en développement)
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.warn("⚠️ Attention : Les clés Supabase sont manquantes dans le fichier .env");
}

// Création du client simplifiée pour éviter l'erreur "f is not defined"
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Fonction utilitaire si tu as besoin de ton token Nexora ailleurs
export const getNexoraToken = () => {
  try {
    return localStorage.getItem("nexora_session_token") || "";
  } catch {
    return "";
  }
};
