import { supabase } from "@/integrations/supabase/client";

export const NEXORA_SESSION_KEY = "nexora_session_token";
export const NEXORA_USER_KEY = "nexora_current_user";
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8h

// ─── Hash simplifié (base64)
export async function hashPassword(password: string): Promise<string> {
  return btoa(password + "_nexora_salt");
}

// ─── Générer token simple
export function generateToken(): string {
  return Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
}

// ─── Types
export interface NexoraUser {
  id: string;
  nom_prenom: string;
  username: string;
  email: string;
  avatar_url?: string | null;
  is_admin: boolean;
  plan: "gratuit" | "premium" | "admin";
  badge_premium: boolean;
}

// ─── Inscription
export async function registerUser(data: {
  nom_prenom: string;
  username: string;
  email: string;
  password: string;
}): Promise<{ success: boolean; error?: string }> {

  const { data: existingUser } = await supabase
    .from<NexoraUser>("nexora_users")
    .select("id")
    .ilike("username", data.username)
    .maybeSingle();

  if (existingUser) return { success: false, error: "Nom d'utilisateur déjà pris" };

  const { data: existingEmail } = await supabase
    .from<NexoraUser>("nexora_users")
    .select("id")
    .ilike("email", data.email)
    .maybeSingle();

  if (existingEmail) return { success: false, error: "Email déjà utilisé" };

  const password_hash = await hashPassword(data.password);

  const { error } = await supabase.from<NexoraUser>("nexora_users").insert({
    nom_prenom: data.nom_prenom,
    username: data.username.toLowerCase(),
    email: data.email.toLowerCase(),
    password_hash,
    is_admin: false,
    plan: "gratuit",
    badge_premium: false,
  });

  if (error) return { success: false, error: "Erreur lors de la création du compte" };
  return { success: true };
}

// ─── Connexion
export async function loginUser(data: {
  identifier: string;
  password: string;
  remember?: boolean;
}): Promise<{ success: boolean; user?: NexoraUser; error?: string }> {
  const hash = await hashPassword(data.password);

  const { data: user } = await supabase
    .from<NexoraUser>("nexora_users")
    .select("*")
    .or(`username.ilike.${data.identifier},email.ilike.${data.identifier}`)
    .eq("password_hash", hash)
    .eq("is_active", true)
    .maybeSingle();

  if (!user) return { success: false, error: "Identifiant ou mot de passe incorrect" };

  const token = generateToken();
  const expires_at = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  await supabase.from("nexora_sessions").insert({
    user_id: user.id,
    session_token: token,
    expires_at,
    is_admin_session: user.is_admin,
  });

  if (data.remember) {
    localStorage.setItem(NEXORA_SESSION_KEY, token);
    localStorage.setItem(NEXORA_USER_KEY, JSON.stringify(user));
  } else {
    sessionStorage.setItem(NEXORA_SESSION_KEY, token);
    sessionStorage.setItem(NEXORA_USER_KEY, JSON.stringify(user));
  }

  return { success: true, user };
}

// ─── Déconnexion
export async function logoutUser(): Promise<void> {
  const token =
    localStorage.getItem(NEXORA_SESSION_KEY) ||
    sessionStorage.getItem(NEXORA_SESSION_KEY);

  if (token) await supabase.from("nexora_sessions").delete().eq("session_token", token);

  localStorage.removeItem(NEXORA_SESSION_KEY);
  localStorage.removeItem(NEXORA_USER_KEY);
  sessionStorage.removeItem(NEXORA_SESSION_KEY);
  sessionStorage.removeItem(NEXORA_USER_KEY);
}

// ─── Vérifier session
export function getNexoraUser(): NexoraUser | null {
  const raw =
    localStorage.getItem(NEXORA_USER_KEY) ||
    sessionStorage.getItem(NEXORA_USER_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as NexoraUser;
}

export function isNexoraAuthenticated(): boolean {
  const token =
    localStorage.getItem(NEXORA_SESSION_KEY) ||
    sessionStorage.getItem(NEXORA_SESSION_KEY);
  return !!token;
}
