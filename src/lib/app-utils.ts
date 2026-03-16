import { supabase } from "@/integrations/supabase/client";

// The access code stored in DB is hashed. We compare by fetching profile and verifying.
// For simplicity with no auth, we store hashed code server-side and compare via a
// deterministic check (SHA-256 based comparison stored in profiles table).

export async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code + "mes_secrets_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyAccessCode(code: string): Promise<boolean> {
  const hashed = await hashCode(code);
  const { data } = await supabase.from("profiles").select("access_code_hash").limit(1).single();
  if (!data) return false;
  return data.access_code_hash === hashed;
}

export async function getProfile() {
  const { data } = await supabase.from("profiles").select("*").limit(1).single();
  return data;
}

export async function ensureProfile() {
  const { data: existing } = await supabase.from("profiles").select("id").limit(1).single();
  if (!existing) {
    const defaultHash = await hashCode("55237685N");
    await supabase.from("profiles").insert({
      nom: "Eric Kpakpo",
      email: "erickpakpo786@gmail.com",
      avatar_url: "https://i.ibb.co/pvMbk9MY/1771882604239.jpg",
      access_code_hash: defaultHash,
    });
  }
}

export function playSuccessSound() {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
}

// XOF to USD conversion rate (1 USD = ~600 XOF approx)
export const XOF_TO_USD = 0.00167;
export const USD_TO_XOF = 600;

export function convertAmount(amount: number, from: "XOF" | "USD", to: "XOF" | "USD"): number {
  if (from === to) return amount;
  if (from === "XOF" && to === "USD") return amount * XOF_TO_USD;
  return amount * USD_TO_XOF;
}

export function formatAmount(amount: number, devise: "XOF" | "USD"): string {
  if (devise === "USD") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(amount);
  }
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount) + " FCFA";
}

export const SESSION_KEY = "mes_secrets_auth";

export function setSession() {
  sessionStorage.setItem(SESSION_KEY, "authenticated");
}
export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
export function isAuthenticated(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === "authenticated";
}
