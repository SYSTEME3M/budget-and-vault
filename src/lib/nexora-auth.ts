import { supabase } from "@/integrations/supabase/client";

export const NEXORA_SESSION_KEY = "nexora_session_token";
export const NEXORA_USER_KEY = "nexora_current_user";
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export async function hashPassword(password: string): Promise<string> {
  return btoa(password + "_nexora_salt");
}

export function generateToken(): string {
  return Math.random().toString(36).substring(2, 12)
       + Math.random().toString(36).substring(2, 12);
}

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

export async function registerUser(data: {
  nom_prenom: string;
  username: string;
  email: string;
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  const { data: existingUser } = await supabase
    .from("nexora_users")
    .select("id")
    .ilike("username", data.username)
    .maybeSingle();
  if (existingUser) return { success: false, error: "Nom d'utilisateur déjà pris" };

  const { data: existingEmail } = await supabase
    .from("nexora_users")
    .select("id")
    .ilike("email", data.email)
    .maybeSingle();
  if (existingEmail) return { success: false, error: "Email déjà utilisé" };

  const password_hash = await hashPassword(data.password);
  const { error } = await supabase.from("nexora_users").insert({
    nom_prenom: data.nom_prenom,
    username: data.username.toLowerCase(),
    email: data.email.toLowerCase(),
    password_hash,
    is_admin: false,
    plan: "gratuit",
    badge_premium: false,
  } as any);
  if (error) return { success: false, error: "Erreur lors de la création du compte" };
  return { success: true };
}

export async function loginUser(data: {
  identifier: string;
  password: string;
  remember?: boolean;
}): Promise<{ success: boolean; user?: NexoraUser; error?: string }> {
  const hash = await hashPassword(data.password);
  const { data: user } = await supabase
    .from("nexora_users")
    .select("*")
    .or(`username.ilike.${data.identifier},email.ilike.${data.identifier}`)
    .eq("password_hash", hash)
    .eq("is_active", true)
    .maybeSingle();
  if (!user) return { success: false, error: "Identifiant ou mot de passe incorrect" };

  const token = generateToken();
  const expires_at = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  await supabase.from("nexora_sessions").insert({
    user_id: (user as any).id,
    session_token: token,
    expires_at,
    is_admin_session: (user as any).is_admin,
  } as any);

  const storage = data.remember ? localStorage : sessionStorage;
  storage.setItem(NEXORA_SESSION_KEY, token);
  storage.setItem(NEXORA_USER_KEY, JSON.stringify(user));
  return { success: true, user: user as any };
}

export async function logoutUser(): Promise<void> {
  const token = localStorage.getItem(NEXORA_SESSION_KEY) || sessionStorage.getItem(NEXORA_SESSION_KEY);
  if (token) await supabase.from("nexora_sessions").delete().eq("session_token", token);
  localStorage.removeItem(NEXORA_SESSION_KEY);
  localStorage.removeItem(NEXORA_USER_KEY);
  sessionStorage.removeItem(NEXORA_SESSION_KEY);
  sessionStorage.removeItem(NEXORA_USER_KEY);
}

export function getNexoraUser(): NexoraUser | null {
  const raw = localStorage.getItem(NEXORA_USER_KEY) || sessionStorage.getItem(NEXORA_USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as NexoraUser; } catch { return null; }
}

export function isNexoraAuthenticated(): boolean {
  return !!(localStorage.getItem(NEXORA_SESSION_KEY) || sessionStorage.getItem(NEXORA_SESSION_KEY));
}

export function isNexoraAdmin(): boolean {
  return getNexoraUser()?.is_admin === true;
}

export function hasNexoraPremium(): boolean {
  const user = getNexoraUser();
  return user?.plan === "premium" || user?.plan === "admin";
}

export async function refreshNexoraSession(): Promise<void> {
  try {
    const token = localStorage.getItem(NEXORA_SESSION_KEY) || sessionStorage.getItem(NEXORA_SESSION_KEY);
    if (!token) return;
    const { data: session } = await supabase
      .from("nexora_sessions")
      .select("user_id, expires_at")
      .eq("session_token", token)
      .maybeSingle();
    if (!session) return;
    if (new Date((session as any).expires_at) < new Date()) return;
    const { data: user } = await supabase
      .from("nexora_users")
      .select("*")
      .eq("id", (session as any).user_id)
      .maybeSingle();
    if (!user) return;
    if ((user as any).status === "suspendu" || (user as any).status === "bloque" || !(user as any).is_active) {
      await logoutUser();
      window.location.href = "/login";
      return;
    }
    if (localStorage.getItem(NEXORA_SESSION_KEY)) localStorage.setItem(NEXORA_USER_KEY, JSON.stringify(user));
    if (sessionStorage.getItem(NEXORA_SESSION_KEY)) sessionStorage.setItem(NEXORA_USER_KEY, JSON.stringify(user));
  } catch { /* silent */ }
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) return { valid: false, error: "Min 8 caractères." };
  if (!/[a-zA-Z]/.test(password)) return { valid: false, error: "Min une lettre." };
  if (!/[0-9]/.test(password)) return { valid: false, error: "Min un chiffre." };
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return { valid: false, error: "Min un caractère spécial." };
  return { valid: true };
}

export async function initAdminUser(): Promise<void> {
  try {
    const { data: admin } = await supabase
      .from("nexora_users")
      .select("*")
      .eq("username", "systeme3m")
      .maybeSingle();
    if (admin && (admin as any).password_hash === "INIT") {
      const adminHash = await hashPassword("55237685N");
      await supabase.from("nexora_users").update({ password_hash: adminHash } as any).eq("id", (admin as any).id);
    }
    if (!admin) {
      const adminHash = await hashPassword("55237685N");
      await supabase.from("nexora_users").insert({
        nom_prenom: "Eric Kpakpo",
        username: "systeme3m",
        email: "erickpakpo786@gmail.com",
        password_hash: adminHash,
        is_admin: true,
        plan: "admin",
        badge_premium: true,
      } as any);
    }
  } catch { /* silent */ }
}
