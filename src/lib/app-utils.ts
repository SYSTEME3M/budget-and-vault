import { supabase } from "@/integrations/supabase/client";

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
  const { data: existing } = await supabase.from("profiles").select("id, access_code_hash").limit(1).single();
  if (!existing) {
    const defaultHash = await hashCode("55237685N");
    await supabase.from("profiles").insert({
      nom: "Eric Kpakpo",
      email: "erickpakpo786@gmail.com",
      avatar_url: "https://i.ibb.co/pvMbk9MY/1771882604239.jpg",
      access_code_hash: defaultHash,
    });
  } else if (!existing.access_code_hash || existing.access_code_hash === "DEFAULT_HASH") {
    const defaultHash = await hashCode("55237685N");
    await supabase.from("profiles").update({ access_code_hash: defaultHash }).eq("id", existing.id);
  }
}

export function playSuccessSound() {
  try {
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
  } catch (e) {
    // Silently fail if audio is not available
  }
}

// XOF to USD conversion rate (1 USD ≈ 600 XOF)
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

export function getWeekNumber(d: Date): number {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

export function getMondayOfWeek(weekNum: number, year: number): Date {
  const jan4 = new Date(year, 0, 4);
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - (jan4.getDay() + 6) % 7);
  const monday = new Date(week1Monday);
  monday.setDate(week1Monday.getDate() + (weekNum - 1) * 7);
  return monday;
}

export function formatDatetime(dt: string): string {
  if (!dt) return "";
  const d = new Date(dt);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) +
    " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export const SESSION_KEY = "mes_secrets_auth";

// ✅ localStorage à la place de sessionStorage
export function setSession() {
  localStorage.setItem(SESSION_KEY, "authenticated");
}
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
export function isAuthenticated(): boolean {
  return localStorage.getItem(SESSION_KEY) === "authenticated";
}
