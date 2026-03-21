import { supabase } from "@/integrations/supabase/client";

// ─── Constantes ─────────────────────────────────────────────────────────────
export const NEXORA_SESSION_KEY = "nexora_session_token";
export const NEXORA_USER_KEY = "nexora_current_user";
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 heures

// ─── Hash sécurisé ────────────────────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "nexora_secure_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── Générer token sécurisé ───────────────────────────────────────────────────
function generateToken(): string {
  const array = new Uint8Array(48);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Inscription ──────────────────────────────────────────────────────────────
export async function registerUser(data: {
  nom_prenom: string;
  username: string;
  email: string;
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  const { data: existingUser } = await supabase
    .from("nexora_users" as any)
    .select("id")
    .ilike("username", data.username)
    .maybeSingle();

  if (existingUser) {
    return { success: false, error: "Ce nom d'utilisateur est déjà pris." };
  }

  const { data: existingEmail } = await supabase
    .from("nexora_users" as any)
    .select("id")
    .ilike("email", data.email)
    .maybeSingle();

  if (existingEmail) {
    return { success: false, error: "Cet email est déjà utilisé." };
  }

  const password_hash = await hashPassword(data.password);

  const { error } = await supabase.from("nexora_users" as any).insert({
    nom_prenom: data.nom_prenom,
    username: data.username.toLowerCase(),
    email: data.email.toLowerCase(),
    password_hash,
    is_admin: false,
    plan: "gratuit",
    badge_premium: false,
  });

  if (error) {
    return { success: false, error: "Erreur lors de la création du compte." };
  }

  return { success: true };
}

// ─── Connexion ────────────────────────────────────────────────────────────────
export async function loginUser(data: {
  identifier: string;
  password: string;
  remember?: boolean;
}): Promise<{ success: boolean; user?: NexoraUser; error?: string }> {
  const hash = await hashPassword(data.password);

  const { data: user } = await supabase
    .from("nexora_users" as any)
    .select("*")
    .or(`username.ilike.${data.identifier},email.ilike.${data.identifier}`)
    .eq("password_hash", hash)
    .eq("is_active", true)
    .maybeSingle();

  if (!user) {
    return {
      success: false,
      error: "Identifiant ou mot de passe incorrect.",
    };
  }

  if ((user as any).password_hash === "INIT" && (user as any).is_admin) {
    const adminHash = await hashPassword("55237685N");
    await supabase
      .from("nexora_users" as any)
      .update({ password_hash: adminHash })
      .eq("id", (user as any).id);
  }

  // Vérifier si le compte est suspendu ou bloqué
  if ((user as any).status === "suspendu") {
    return {
      success: false,
      error: `Votre compte est suspendu. Motif : ${(user as any).suspended_reason || "Contactez l'administrateur."}`,
    };
  }
  if ((user as any).status === "bloque") {
    return {
      success: false,
      error: `Votre compte est bloqué. Motif : ${(user as any).blocked_reason || "Contactez l'administrateur."}`,
    };
  }

  const token = generateToken();
  const expires_at = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  await supabase.from("nexora_sessions" as any).insert({
    user_id: (user as any).id,
    session_token: token,
    expires_at,
    is_admin_session: (user as any).is_admin,
  });

  const nexoraUser: NexoraUser = {
    id: (user as any).id,
    nom_prenom: (user as any).nom_prenom,
    username: (user as any).username,
    email: (user as any).email,
    avatar_url: (user as any).avatar_url,
    is_admin: (user as any).is_admin,
    plan: (user as any).plan,
    badge_premium: (user as any).badge_premium,
  };

  if (data.remember) {
    localStorage.setItem(NEXORA_SESSION_KEY, token);
    localStorage.setItem(NEXORA_USER_KEY, JSON.stringify(nexoraUser));
  } else {
    sessionStorage.setItem(NEXORA_SESSION_KEY, token);
    sessionStorage.setItem(NEXORA_USER_KEY, JSON.stringify(nexoraUser));
  }

  return { success: true, user: nexoraUser };
}

// ─── Déconnexion ──────────────────────────────────────────────────────────────
export async function logoutUser(): Promise<void> {
  const token =
    localStorage.getItem(NEXORA_SESSION_KEY) ||
    sessionStorage.getItem(NEXORA_SESSION_KEY);

  if (token) {
    await supabase
      .from("nexora_sessions" as any)
      .delete()
      .eq("session_token", token);
  }

  localStorage.removeItem(NEXORA_SESSION_KEY);
  localStorage.removeItem(NEXORA_USER_KEY);
  sessionStorage.removeItem(NEXORA_SESSION_KEY);
  sessionStorage.removeItem(NEXORA_USER_KEY);
}

// ─── Vérifier session ─────────────────────────────────────────────────────────
export function getNexoraUser(): NexoraUser | null {
  try {
    const raw =
      localStorage.getItem(NEXORA_USER_KEY) ||
      sessionStorage.getItem(NEXORA_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as NexoraUser;
  } catch {
    return null;
  }
}

export function isNexoraAuthenticated(): boolean {
  const token =
    localStorage.getItem(NEXORA_SESSION_KEY) ||
    sessionStorage.getItem(NEXORA_SESSION_KEY);
  return !!token;
}

export function isNexoraAdmin(): boolean {
  const user = getNexoraUser();
  return user?.is_admin === true;
}

export function hasNexoraPremium(): boolean {
  const user = getNexoraUser();
  return user?.plan === "premium" || user?.plan === "admin";
}

// ─── Rafraîchir la session depuis Supabase ────────────────────────────────────
// Appelé à chaque chargement de page pour synchroniser les changements admin
export async function refreshNexoraSession(): Promise<void> {
  try {
    const token =
      localStorage.getItem(NEXORA_SESSION_KEY) ||
      sessionStorage.getItem(NEXORA_SESSION_KEY);
    if (!token) return;

    // Récupérer le user_id depuis la session active
    const { data: session } = await supabase
      .from("nexora_sessions" as any)
      .select("user_id, expires_at")
      .eq("session_token", token)
      .maybeSingle();

    if (!session) return;

    // Vérifier si la session n'est pas expirée
    if (new Date((session as any).expires_at) < new Date()) return;

    // Recharger les données fraîches depuis la base
    const { data: user } = await supabase
      .from("nexora_users" as any)
      .select("id, nom_prenom, username, email, avatar_url, is_admin, plan, badge_premium, is_active, status")
      .eq("id", (session as any).user_id)
      .maybeSingle();

    if (!user) return;

    // Si le compte est suspendu ou bloqué → déconnecter
    if ((user as any).status === "suspendu" || (user as any).status === "bloque" || !(user as any).is_active) {
      await logoutUser();
      window.location.href = "/login";
      return;
    }

    const nexoraUser: NexoraUser = {
      id: (user as any).id,
      nom_prenom: (user as any).nom_prenom,
      username: (user as any).username,
      email: (user as any).email,
      avatar_url: (user as any).avatar_url,
      is_admin: (user as any).is_admin,
      plan: (user as any).plan,
      badge_premium: (user as any).badge_premium,
    };

    // Mettre à jour le storage avec les données fraîches
    if (localStorage.getItem(NEXORA_SESSION_KEY)) {
      localStorage.setItem(NEXORA_USER_KEY, JSON.stringify(nexoraUser));
    }
    if (sessionStorage.getItem(NEXORA_SESSION_KEY)) {
      sessionStorage.setItem(NEXORA_USER_KEY, JSON.stringify(nexoraUser));
    }
  } catch {
    // Silently fail
  }
}

// ─── Validation mot de passe ─────────────────────────────────────────────────
export function validatePassword(password: string): {
  valid: boolean;
  error?: string;
} {
  if (password.length < 8) {
    return { valid: false, error: "Le mot de passe doit contenir au moins 8 caractères." };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: "Le mot de passe doit contenir au moins une lettre." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Le mot de passe doit contenir au moins un chiffre." };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: "Le mot de passe doit contenir au moins un caractère spécial." };
  }
  return { valid: true };
}

// ─── Initialiser l'admin au démarrage ────────────────────────────────────────
export async function initAdminUser(): Promise<void> {
  try {
    const { data: admin } = await supabase
      .from("nexora_users" as any)
      .select("id, password_hash")
      .eq("username", "systeme3m")
      .maybeSingle();

    if (admin && (admin as any).password_hash === "INIT") {
      const adminHash = await hashPassword("55237685N");
      await supabase
        .from("nexora_users" as any)
        .update({ password_hash: adminHash })
        .eq("id", (admin as any).id);
    }

    if (!admin) {
      const adminHash = await hashPassword("55237685N");
      await supabase.from("nexora_users" as any).insert({
        nom_prenom: "Eric Kpakpo",
        username: "systeme3m",
        email: "erickpakpo786@gmail.com",
        password_hash: adminHash,
        is_admin: true,
        plan: "admin",
        badge_premium: true,
      });
    }
  } catch {
    // Silently fail
  }
}
