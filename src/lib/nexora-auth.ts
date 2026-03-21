import { supabase } from "@/integrations/supabase/client";

export const NEXORA_SESSION_KEY = "nexora_session_token";
export const NEXORA_USER_KEY    = "nexora_current_user";
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data    = encoder.encode(password + "nexora_secure_salt_2024");
  const buf     = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}

function generateToken(): string {
  const array = new Uint8Array(48);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2,"0")).join("");
}

export type PlanType = "gratuit" | "boss" | "roi" | "admin";

export interface NexoraUser {
  id: string;
  nom_prenom: string;
  username: string;
  email: string;
  avatar_url?: string | null;
  is_admin: boolean;
  plan: PlanType;
  badge_premium: boolean;
  status?: string;
}

export function getPlanLabel(plan: PlanType): string {
  switch (plan) {
    case "boss":  return "BOSS";
    case "roi":   return "ROI";
    case "admin": return "Admin";
    default:      return "Gratuit";
  }
}

export function hasNexoraPremium(): boolean {
  const user = getNexoraUser();
  return user?.plan === "boss" || user?.plan === "roi" || user?.plan === "admin";
}

export function hasNexoraRoi(): boolean {
  const user = getNexoraUser();
  return user?.plan === "roi" || user?.plan === "admin";
}

export function hasNexoraBoss(): boolean {
  const user = getNexoraUser();
  return user?.plan === "boss" || user?.plan === "roi" || user?.plan === "admin";
}

export const PLAN_LIMITS = {
  gratuit: { factures: 5,        produits: 5,        prets: 5,        epargnes: 2,        boutique: false, immobilier: false, coffre_fort: 10     },
  boss:    { factures: 50,       produits: 20,       prets: 20,       epargnes: 10,       boutique: true,  immobilier: false, coffre_fort: 100    },
  roi:     { factures: Infinity, produits: Infinity, prets: Infinity, epargnes: Infinity, boutique: true,  immobilier: true,  coffre_fort: Infinity },
  admin:   { factures: Infinity, produits: Infinity, prets: Infinity, epargnes: Infinity, boutique: true,  immobilier: true,  coffre_fort: Infinity },
} as const;

export function getPlanLimits(plan: PlanType) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.gratuit;
}

export async function registerUser(data: { nom_prenom: string; username: string; email: string; password: string }): Promise<{ success: boolean; error?: string }> {
  const { data: existingUser } = await supabase.from("nexora_users" as any).select("id").ilike("username", data.username).maybeSingle();
  if (existingUser) return { success: false, error: "Ce nom d'utilisateur est déjà pris." };

  const { data: existingEmail } = await supabase.from("nexora_users" as any).select("id").ilike("email", data.email).maybeSingle();
  if (existingEmail) return { success: false, error: "Cet email est déjà utilisé." };

  const password_hash = await hashPassword(data.password);
  const { error } = await supabase.from("nexora_users" as any).insert({
    nom_prenom: data.nom_prenom, username: data.username.toLowerCase(), email: data.email.toLowerCase(),
    password_hash, is_admin: false, plan: "gratuit", badge_premium: false, status: "actif",
  });
  if (error) return { success: false, error: "Erreur lors de la création du compte." };
  return { success: true };
}

export async function loginUser(data: { identifier: string; password: string; remember?: boolean }): Promise<{ success: boolean; user?: NexoraUser; error?: string }> {
  const hash = await hashPassword(data.password);
  const { data: user } = await supabase.from("nexora_users" as any).select("*")
    .or(`username.ilike.${data.identifier},email.ilike.${data.identifier}`)
    .eq("password_hash", hash).eq("is_active", true).maybeSingle();

  if (!user) return { success: false, error: "Identifiant ou mot de passe incorrect." };

  const status = (user as any).status;
  if (status === "suspendu") return { success: false, error: `Compte suspendu. Motif : ${(user as any).suspended_reason || "Contactez l'administrateur."}` };
  if (status === "bloque")   return { success: false, error: `Compte bloqué. Motif : ${(user as any).blocked_reason || "Contactez l'administrateur."}` };

  let plan = (user as any).plan as PlanType;
  if ((plan as any) === "premium") plan = "roi";

  const token      = generateToken();
  const expires_at = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  await supabase.from("nexora_sessions" as any).insert({ user_id: (user as any).id, session_token: token, expires_at, is_admin_session: (user as any).is_admin });
  await supabase.from("nexora_users" as any).update({ last_login: new Date().toISOString() }).eq("id", (user as any).id);

  const nexoraUser: NexoraUser = {
    id: (user as any).id, nom_prenom: (user as any).nom_prenom, username: (user as any).username,
    email: (user as any).email, avatar_url: (user as any).avatar_url, is_admin: (user as any).is_admin,
    plan, badge_premium: (user as any).badge_premium, status: (user as any).status,
  };

  const storage = data.remember ? localStorage : sessionStorage;
  storage.setItem(NEXORA_SESSION_KEY, token);
  storage.setItem(NEXORA_USER_KEY, JSON.stringify(nexoraUser));
  return { success: true, user: nexoraUser };
}

export async function logoutUser(): Promise<void> {
  const token = localStorage.getItem(NEXORA_SESSION_KEY) || sessionStorage.getItem(NEXORA_SESSION_KEY);
  if (token) { await supabase.from("nexora_sessions" as any).delete().eq("session_token", token); }
  localStorage.removeItem(NEXORA_SESSION_KEY); localStorage.removeItem(NEXORA_USER_KEY);
  sessionStorage.removeItem(NEXORA_SESSION_KEY); sessionStorage.removeItem(NEXORA_USER_KEY);
}

export function getNexoraUser(): NexoraUser | null {
  try {
    const raw = localStorage.getItem(NEXORA_USER_KEY) || sessionStorage.getItem(NEXORA_USER_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as NexoraUser;
    if ((user.plan as any) === "premium") user.plan = "roi";
    return user;
  } catch { return null; }
}

export function isNexoraAuthenticated(): boolean {
  return !!(localStorage.getItem(NEXORA_SESSION_KEY) || sessionStorage.getItem(NEXORA_SESSION_KEY));
}

export function isNexoraAdmin(): boolean { return getNexoraUser()?.is_admin === true; }

export async function refreshNexoraSession(): Promise<void> {
  try {
    const token = localStorage.getItem(NEXORA_SESSION_KEY) || sessionStorage.getItem(NEXORA_SESSION_KEY);
    if (!token) return;
    const { data: session } = await supabase.from("nexora_sessions" as any).select("user_id, expires_at").eq("session_token", token).maybeSingle();
    if (!session || new Date((session as any).expires_at) < new Date()) return;
    const { data: user } = await supabase.from("nexora_users" as any)
      .select("id, nom_prenom, username, email, avatar_url, is_admin, plan, badge_premium, is_active, status")
      .eq("id", (session as any).user_id).maybeSingle();
    if (!user) return;
    if (!(user as any).is_active || (user as any).status === "suspendu" || (user as any).status === "bloque") {
      await logoutUser(); window.location.href = "/login"; return;
    }
    let plan = (user as any).plan as PlanType;
    if ((plan as any) === "premium") plan = "roi";
    const nexoraUser: NexoraUser = {
      id: (user as any).id, nom_prenom: (user as any).nom_prenom, username: (user as any).username,
      email: (user as any).email, avatar_url: (user as any).avatar_url, is_admin: (user as any).is_admin,
      plan, badge_premium: (user as any).badge_premium, status: (user as any).status,
    };
    if (localStorage.getItem(NEXORA_SESSION_KEY)) localStorage.setItem(NEXORA_USER_KEY, JSON.stringify(nexoraUser));
    else sessionStorage.setItem(NEXORA_USER_KEY, JSON.stringify(nexoraUser));
  } catch { /* silently */ }
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8)        return { valid: false, error: "Au moins 8 caractères." };
  if (!/[a-zA-Z]/.test(password)) return { valid: false, error: "Au moins une lettre." };
  if (!/[0-9]/.test(password))    return { valid: false, error: "Au moins un chiffre." };
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return { valid: false, error: "Au moins un caractère spécial." };
  return { valid: true };
}

export async function initAdminUser(): Promise<void> {
  try {
    const { data: admin } = await supabase.from("nexora_users" as any).select("id, password_hash").eq("username", "systeme3m").maybeSingle();
    if (admin && (admin as any).password_hash === "INIT") {
      const adminHash = await hashPassword("55237685N");
      await supabase.from("nexora_users" as any).update({ password_hash: adminHash }).eq("id", (admin as any).id);
    }
    if (!admin) {
      const adminHash = await hashPassword("55237685N");
      await supabase.from("nexora_users" as any).insert({ nom_prenom: "Eric Kpakpo", username: "systeme3m", email: "erickpakpo786@gmail.com", password_hash: adminHash, is_admin: true, plan: "admin", badge_premium: true, status: "actif" });
    }
  } catch { /* silently */ }
}
