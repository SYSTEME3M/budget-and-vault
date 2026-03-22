import { supabase } from "@/integrations/supabase/client";

export const NEXORA_SESSION_KEY = "nexora_session_token";
export const NEXORA_USER_KEY = "nexora_current_user";
export const NEXORA_SESSION_EXPIRY_KEY = "nexora_session_expiry";
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export interface NexoraUser {
  id: string;
  nom_prenom: string;
  username: string;
  email: string;
  avatar_url?: string | null;
  is_admin: boolean;
  plan: "gratuit" | "premium" | "admin";
  badge_premium: boolean;
  is_active?: boolean;
  status?: string | null;
}

interface NexoraSessionRow {
  user_id: string;
  expires_at: string;
}

function getStorage(remember = true): Storage {
  return remember ? localStorage : sessionStorage;
}

function getStoredToken(): string | null {
  return (
    localStorage.getItem(NEXORA_SESSION_KEY) ||
    sessionStorage.getItem(NEXORA_SESSION_KEY)
  );
}

function getStoredExpiry(): string | null {
  return (
    localStorage.getItem(NEXORA_SESSION_EXPIRY_KEY) ||
    sessionStorage.getItem(NEXORA_SESSION_EXPIRY_KEY)
  );
}

function clearStorage(storage: Storage) {
  storage.removeItem(NEXORA_SESSION_KEY);
  storage.removeItem(NEXORA_USER_KEY);
  storage.removeItem(NEXORA_SESSION_EXPIRY_KEY);
}

function saveSession(
  token: string,
  user: NexoraUser,
  expiresAt: string,
  remember = true,
) {
  const storage = getStorage(remember);
  const otherStorage = remember ? sessionStorage : localStorage;

  clearStorage(otherStorage);

  storage.setItem(NEXORA_SESSION_KEY, token);
  storage.setItem(NEXORA_USER_KEY, JSON.stringify(user));
  storage.setItem(NEXORA_SESSION_EXPIRY_KEY, expiresAt);
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true;
  const expiryTime = new Date(expiresAt).getTime();
  return Number.isNaN(expiryTime) || Date.now() > expiryTime;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${password}_nexora_salt_v2`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return toHex(hashBuffer);
}

export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function validatePassword(
  password: string,
): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return {
      valid: false,
      error: "Le mot de passe doit contenir au moins 8 caractères.",
    };
  }

  if (!/[a-zA-Z]/.test(password)) {
    return {
      valid: false,
      error: "Le mot de passe doit contenir au moins une lettre.",
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      error: "Le mot de passe doit contenir au moins un chiffre.",
    };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) {
    return {
      valid: false,
      error: "Le mot de passe doit contenir au moins un caractère spécial.",
    };
  }

  return { valid: true };
}

export async function registerUser(data: {
  nom_prenom: string;
  username: string;
  email: string;
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  const normalizedUsername = data.username.trim().toLowerCase();
  const normalizedEmail = data.email.trim().toLowerCase();
  const passwordValidation = validatePassword(data.password);

  if (!passwordValidation.valid) {
    return { success: false, error: passwordValidation.error };
  }

  const { data: existingUser, error: usernameError } = await supabase
    .from("nexora_users")
    .select("id")
    .ilike("username", normalizedUsername)
    .maybeSingle();

  if (usernameError) {
    return { success: false, error: "Erreur lors de la vérification du username." };
  }

  if (existingUser) {
    return { success: false, error: "Nom d'utilisateur déjà pris." };
  }

  const { data: existingEmail, error: emailError } = await supabase
    .from("nexora_users")
    .select("id")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (emailError) {
    return { success: false, error: "Erreur lors de la vérification de l'email." };
  }

  if (existingEmail) {
    return { success: false, error: "Email déjà utilisé." };
  }

  const password_hash = await hashPassword(data.password);

  const { error } = await supabase.from("nexora_users").insert({
    nom_prenom: data.nom_prenom.trim(),
    username: normalizedUsername,
    email: normalizedEmail,
    password_hash,
    is_admin: false,
    plan: "gratuit",
    badge_premium: false,
    is_active: true,
  });

  if (error) {
    return { success: false, error: error.message || "Erreur lors de la création du compte." };
  }

  return { success: true };
}

export async function loginUser(data: {
  identifier: string;
  password: string;
  remember?: boolean;
}): Promise<{ success: boolean; user?: NexoraUser; error?: string }> {
  const identifier = data.identifier.trim().toLowerCase();
  const passwordHash = await hashPassword(data.password);

  const { data: user, error } = await supabase
    .from("nexora_users")
    .select("*")
    .or(`username.ilike.${identifier},email.ilike.${identifier}`)
    .eq("password_hash", passwordHash)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message || "Erreur de connexion." };
  }

  if (!user) {
    return {
      success: false,
      error: "Identifiant ou mot de passe incorrect.",
    };
  }

  if (user.status === "suspendu" || user.status === "bloque") {
    return {
      success: false,
      error: "Votre compte est suspendu ou bloqué.",
    };
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  const { error: sessionError } = await supabase.from("nexora_sessions").insert({
    user_id: user.id,
    session_token: token,
    expires_at: expiresAt,
    is_admin_session: user.is_admin,
  });

  if (sessionError) {
    return {
      success: false,
      error: sessionError.message || "Impossible de créer la session.",
    };
  }

  saveSession(token, user as NexoraUser, expiresAt, Boolean(data.remember));

  return { success: true, user: user as NexoraUser };
}

export async function logoutUser(): Promise<void> {
  const token = getStoredToken();

  if (token) {
    await supabase.from("nexora_sessions").delete().eq("session_token", token);
  }

  clearStorage(localStorage);
  clearStorage(sessionStorage);
}

export function getNexoraUser(): NexoraUser | null {
  const raw =
    localStorage.getItem(NEXORA_USER_KEY) ||
    sessionStorage.getItem(NEXORA_USER_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as NexoraUser;
  } catch {
    clearStorage(localStorage);
    clearStorage(sessionStorage);
    return null;
  }
}

export function isNexoraAuthenticated(): boolean {
  const token = getStoredToken();
  const expiresAt = getStoredExpiry();

  if (!token || isExpired(expiresAt)) {
    clearStorage(localStorage);
    clearStorage(sessionStorage);
    return false;
  }

  return true;
}

export function isNexoraAdmin(): boolean {
  const user = getNexoraUser();
  return user?.is_admin === true;
}

export function hasNexoraPremium(): boolean {
  const user = getNexoraUser();
  return user?.plan === "premium" || user?.plan === "admin";
}

export async function refreshNexoraSession(): Promise<void> {
  try {
    const token = getStoredToken();
    const expiresAt = getStoredExpiry();

    if (!token || isExpired(expiresAt)) {
      await logoutUser();
      return;
    }

    const { data: session, error: sessionError } = await supabase
      .from("nexora_sessions")
      .select("user_id, expires_at")
      .eq("session_token", token)
      .maybeSingle<NexoraSessionRow>();

    if (sessionError || !session) {
      await logoutUser();
      return;
    }

    if (isExpired(session.expires_at)) {
      await logoutUser();
      return;
    }

    const { data: user, error: userError } = await supabase
      .from("nexora_users")
      .select("*")
      .eq("id", session.user_id)
      .maybeSingle<NexoraUser>();

    if (userError || !user) {
      await logoutUser();
      return;
    }

    if (user.status === "suspendu" || user.status === "bloque" || user.is_active === false) {
      await logoutUser();
      return;
    }

    const shouldRemember = Boolean(localStorage.getItem(NEXORA_SESSION_KEY));
    saveSession(token, user, session.expires_at, shouldRemember);
  } catch {
    await logoutUser();
  }
}

/**
 * Important:
 * Ancien code supprimé volontairement :
 * - plus de mot de passe admin codé en dur
 * - plus de création automatique de compte admin côté client
 */
export async function initAdminUser(): Promise<void> {
  return;
}
