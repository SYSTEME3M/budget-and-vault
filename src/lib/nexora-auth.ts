import { supabase } from "@/integrations/supabase/client";

// ─── Constantes ─────────────────────────────────────────────
export const NEXORA_SESSION_KEY = "nexora_session_token";
export const NEXORA_USER_KEY = "nexora_current_user";
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8h

// ─── Hash sécurisé avec Web Crypto API (SHA-256 + sel) ──────
export async function hashPassword(password: string): Promise<string> {
  const salt = "nexora_secure_salt_2025";
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── Générer token sécurisé avec crypto.getRandomValues ─────
export function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Types ──────────────────────────────────────────────────
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

// ─── Inscription ────────────────────────────────────────────
export async function registerUser(data: {
  nom_prenom: string;
  username: string;
  email: string;
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  // Validation mot de passe côté client
  const validation = validatePassword(data.password);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

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
    username: data.username.toLowerCase().trim(),
    email: data.email.toLowerCase().trim(),
    password_hash,
    is_admin: false,
    plan: "gratuit",
    badge_premium: false,
  });

  if (error) {
    console.error("Erreur inscription:", error.message);
    return { success: false, error: "Erreur lors de la création du compte" };
  }
  return { success: true };
}

// ─── Connexion ──────────────────────────────────────────────
export async function loginUser(data: {
  identifier: string;
  password: string;
  remember?: boolean;
}): Promise<{ success: boolean; user?: NexoraUser; error?: string }> {
  const hash = await hashPassword(data.password);
  const identifier = data.identifier.toLowerCase().trim();

  const { data: user, error } = await supabase
    .from("nexora_users")
    .select("*")
    .or(`username.ilike.${identifier},email.ilike.${identifier}`)
    .eq("password_hash", hash)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Erreur login:", error.message);
    return { success: false, error: "Erreur serveur, réessayez plus tard" };
  }

  if (!user) return { success: false, error: "Identifiant ou mot de passe incorrect" };

  const token = generateToken();
  const expires_at = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  const { error: sessionError } = await supabase.from("nexora_sessions").insert({
    user_id: user.id,
    session_token: token,
    expires_at,
    is_admin_session: user.is_admin,
  });

  if (sessionError) {
    console.error("Erreur session:", sessionError.message);
    return { success: false, error: "Impossible de créer la session" };
  }

  // Stocker la session avec l'expiration
  const sessionData = {
    token,
    expires_at: Date.now() + SESSION_DURATION_MS,
  };

  const userToStore: NexoraUser = {
    id: user.id,
    nom_prenom: user.nom_prenom,
    username: user.username,
    email: user.email,
    avatar_url: user.avatar_url ?? null,
    is_admin: user.is_admin,
    plan: user.plan,
    badge_premium: user.badge_premium,
  };

  const storage = data.remember ? localStorage : sessionStorage;
  storage.setItem(NEXORA_SESSION_KEY, JSON.stringify(sessionData));
  storage.setItem(NEXORA_USER_KEY, JSON.stringify(userToStore));

  return { success: true, user: userToStore };
}

// ─── Déconnexion ────────────────────────────────────────────
export async function logoutUser(): Promise<void> {
  const token = getStoredToken();

  if (token) {
    await supabase
      .from("nexora_sessions")
      .delete()
      .eq("session_token", token);
  }

  localStorage.removeItem(NEXORA_SESSION_KEY);
  localStorage.removeItem(NEXORA_USER_KEY);
  sessionStorage.removeItem(NEXORA_SESSION_KEY);
  sessionStorage.removeItem(NEXORA_USER_KEY);
}

// ─── Récupérer le token stocké ──────────────────────────────
function getStoredToken(): string | null {
  try {
    const raw =
      localStorage.getItem(NEXORA_SESSION_KEY) ||
      sessionStorage.getItem(NEXORA_SESSION_KEY);
    if (!raw) return null;

    // Support ancien format (string direct) et nouveau format (JSON)
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.token) {
        // Vérifier expiration locale
        if (parsed.expires_at && Date.now() > parsed.expires_at) {
          localStorage.removeItem(NEXORA_SESSION_KEY);
          localStorage.removeItem(NEXORA_USER_KEY);
          sessionStorage.removeItem(NEXORA_SESSION_KEY);
          sessionStorage.removeItem(NEXORA_USER_KEY);
          return null;
        }
        return parsed.token;
      }
      return raw; // ancien format string
    } catch {
      return raw; // ancien format string
    }
  } catch {
    return null;
  }
}

// ─── Vérifier session ───────────────────────────────────────
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
  const token = getStoredToken();
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

// ─── Rafraîchir session depuis Supabase ─────────────────────
export async function refreshNexoraSession(): Promise<void> {
  try {
    const token = getStoredToken();
    if (!token) return;

    const { data: session } = await supabase
      .from("nexora_sessions")
      .select("user_id, expires_at")
      .eq("session_token", token)
      .maybeSingle();

    if (!session) {
      await logoutUser();
      return;
    }

    if (new Date(session.expires_at) < new Date()) {
      await logoutUser();
      return;
    }

    const { data: user } = await supabase
      .from("nexora_users")
      .select("*")
      .eq("id", session.user_id)
      .maybeSingle();

    if (!user) {
      await logoutUser();
      return;
    }

    if (user.status === "suspendu" || user.status === "bloque" || !user.is_active) {
      await logoutUser();
      window.location.href = "/login";
      return;
    }

    const userToStore: NexoraUser = {
      id: user.id,
      nom_prenom: user.nom_prenom,
      username: user.username,
      email: user.email,
      avatar_url: user.avatar_url ?? null,
      is_admin: user.is_admin,
      plan: user.plan,
      badge_premium: user.badge_premium,
    };

    if (localStorage.getItem(NEXORA_SESSION_KEY)) {
      localStorage.setItem(NEXORA_USER_KEY, JSON.stringify(userToStore));
    }
    if (sessionStorage.getItem(NEXORA_SESSION_KEY)) {
      sessionStorage.setItem(NEXORA_USER_KEY, JSON.stringify(userToStore));
    }
  } catch (err) {
    console.error("Erreur refreshNexoraSession:", err);
  }
}

// ─── Validation mot de passe ────────────────────────────────
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8)
    return { valid: false, error: "Le mot de passe doit contenir au moins 8 caractères." };
  if (!/[a-zA-Z]/.test(password))
    return { valid: false, error: "Le mot de passe doit contenir au moins une lettre." };
  if (!/[0-9]/.test(password))
    return { valid: false, error: "Le mot de passe doit contenir au moins un chiffre." };
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
    return { valid: false, error: "Le mot de passe doit contenir au moins un caractère spécial." };
  return { valid: true };
}

// ─── Initialiser l'admin (sans mot de passe en dur) ─────────
export async function initAdminUser(): Promise<void> {
  // Cette fonction vérifie seulement si l'admin existe.
  // Le mot de passe admin doit être défini via Supabase Dashboard
  // ou via une variable d'environnement, JAMAIS en dur dans le code.
  try {
    const { data: admin } = await supabase
      .from("nexora_users")
      .select("id")
      .eq("username", "systeme3m")
      .maybeSingle();

    if (!admin) {
      console.info("Aucun compte admin trouvé. Créez-le via Supabase Dashboard.");
    }
  } catch {
    // Silently fail
  }
}
