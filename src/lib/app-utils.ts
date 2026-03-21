import { supabase } from "@/integrations/supabase/client";

// ───────────────────────────────
// 🔐 HASH CODE
// ───────────────────────────────
export async function hashCode(code) {
  try {
    if (!crypto?.subtle) {
      console.error("Crypto API non supportée");
      return code;
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(code + "mes_secrets_salt_2024");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    console.error("hashCode error:", e);
    return code;
  }
}

// ───────────────────────────────
// 🔐 VERIFY ADMIN CODE
// ───────────────────────────────
export async function verifyAccessCode(code) {
  try {
    const hashed = await hashCode(code);

    const { data, error } = await supabase
      .from("profiles")
      .select("access_code_hash")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(error);
      return false;
    }

    if (!data) return false;

    return data.access_code_hash === hashed;

  } catch (e) {
    console.error("verifyAccessCode error:", e);
    return false;
  }
}

// ───────────────────────────────
// 🔐 VERIFY USER TOKEN
// ───────────────────────────────
export async function verifyUserToken(userId, code) {
  try {
    const hashed = await hashCode(code);

    const { data, error } = await supabase
      .from("app_users")
      .select("id, nom, access_code_hash, is_active")
      .eq("id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error(error);
      return null;
    }

    if (!data) return null;
    if (data.access_code_hash !== hashed) return null;

    return { nom: data.nom };

  } catch (e) {
    console.error("verifyUserToken error:", e);
    return null;
  }
}

// ───────────────────────────────
// 👤 GET PROFILE
// ───────────────────────────────
export async function getProfile() {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(error);
      return null;
    }

    return data;

  } catch (e) {
    console.error("getProfile error:", e);
    return null;
  }
}

// ───────────────────────────────
// 🛠 ENSURE PROFILE (ANTI CRASH)
// ───────────────────────────────
export async function ensureProfile() {
  try {
    const { data: existing, error } = await supabase
      .from("profiles")
      .select("id, access_code_hash")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Erreur Supabase:", error);
      return;
    }

    if (!existing) {
      const defaultHash = await hashCode("55237685N");

      await supabase.from("profiles").insert({
        nom: "Eric Kpakpo",
        email: "erickpakpo786@gmail.com",
        avatar_url: null,
        access_code_hash: defaultHash,
      });

    } else if (!existing.access_code_hash || existing.access_code_hash === "DEFAULT_HASH") {
      const defaultHash = await hashCode("55237685N");

      await supabase
        .from("profiles")
        .update({ access_code_hash: defaultHash })
        .eq("id", existing.id);
    }

  } catch (err) {
    console.error("ensureProfile crash:", err);
  }
}

// ───────────────────────────────
// 🔊 SOUND
// ───────────────────────────────
export function playSuccessSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);

  } catch (e) {
    console.error("Audio error:", e);
  }
}

// ───────────────────────────────
// 💰 CONVERSION
// ───────────────────────────────
export const XOF_TO_USD = 0.00167;
export const USD_TO_XOF = 600;

export function convertAmount(amount, from, to) {
  if (from === to) return amount;
  if (from === "XOF" && to === "USD") return amount * XOF_TO_USD;
  return amount * USD_TO_XOF;
}

export function formatAmount(amount, devise) {
  if (devise === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  }

  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return formatted + " FCFA";
}

// ───────────────────────────────
// 📅 DATE
// ───────────────────────────────
export function formatDatetime(dt) {
  if (!dt) return "";

  const d = new Date(dt);

  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }) + " à " +
  d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ───────────────────────────────
// 🔐 SESSION
// ───────────────────────────────
export const SESSION_KEY = "mes_secrets_auth";
export const USER_SESSION_KEY = "mes_secrets_user";
export const SESSION_EXPIRY_KEY = "mes_secrets_expiry";

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function setSession() {
  const token = generateToken();
  const expiry = Date.now() + SESSION_DURATION_MS;

  localStorage.setItem(SESSION_KEY, token);
  localStorage.setItem(SESSION_EXPIRY_KEY, expiry.toString());
  localStorage.removeItem(USER_SESSION_KEY);
}

export function setUserSession(userId, nom) {
  const token = generateToken();
  const expiry = Date.now() + SESSION_DURATION_MS;

  localStorage.setItem(SESSION_KEY, token);
  localStorage.setItem(SESSION_EXPIRY_KEY, expiry.toString());
  localStorage.setItem(USER_SESSION_KEY, JSON.stringify({ userId, nom }));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(USER_SESSION_KEY);
  localStorage.removeItem(SESSION_EXPIRY_KEY);
}

export function isAuthenticated() {
  const token = localStorage.getItem(SESSION_KEY);
  const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);

  if (!token || !expiry) return false;

  const expiryTime = parseInt(expiry, 10);

  if (Date.now() > expiryTime) {
    clearSession();
    return false;
  }

  return true;
}

export function renewSession() {
  if (!isAuthenticated()) return;

  const expiry = Date.now() + SESSION_DURATION_MS;
  localStorage.setItem(SESSION_EXPIRY_KEY, expiry.toString());
}

export function getCurrentUser() {
  const raw = localStorage.getItem(USER_SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAdminUser() {
  return isAuthenticated() && !getCurrentUser();
}
