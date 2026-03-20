import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ztwhbrkqyfvueiwjptfh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0d2hicmtxeWZ2dWVpd2pwdGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MjMyMTQsImV4cCI6MjA4ODk5OTIxNH0.xb7mo2wI7XZRoLSCt9LHf8CW1L2vYcUeYurW6g0K1bo";

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
