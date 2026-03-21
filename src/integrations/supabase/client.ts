import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const NEXORA_SESSION_KEY = "nexora_session_token";

function getNexoraToken(): string {
  try {
    return localStorage.getItem(NEXORA_SESSION_KEY)
      || sessionStorage.getItem(NEXORA_SESSION_KEY)
      || "";
  } catch {
    return "";
  }
}

function createSupabaseClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      fetch: (url, options = {}) => {
        const token = getNexoraToken();
        const headers = new Headers((options as any).headers || {});
        if (token) headers.set("x-nexora-token", token);
        return fetch(url, { ...options, headers });
      }
    }
  });
}

export const supabase = createSupabaseClient();
