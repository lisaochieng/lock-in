/* ===========================================================
   Supabase client
   ---------------------------------------------------------
   Initializes a single shared Supabase client for the app.
   Configure the URL and anon key via Vite env variables:

     VITE_SUPABASE_URL
     VITE_SUPABASE_ANON_KEY

   Copy `.env.example` to `.env` and fill in your project's
   values (found in the Supabase dashboard under
   Project Settings -> API).
   =========================================================== */
import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Normalize VITE_SUPABASE_URL into the project's API endpoint
 * (https://<ref>.supabase.co).
 *
 * A very common mistake is pasting the browser dashboard link
 * (https://supabase.com/dashboard/project/<ref>) or just the project
 * ref. Those point at the dashboard, not the API, so every auth/db
 * request fails with "Failed to fetch" / a CORS error. We detect and
 * repair those cases here instead of failing cryptically.
 */
function normalizeSupabaseUrl(value) {
  if (!value) return value;
  const trimmed = String(value).trim().replace(/\/+$/, '');

  // Dashboard link: https://supabase.com/dashboard/project/<ref>(/...)
  const dashboard = trimmed.match(/supabase\.com\/dashboard\/project\/([a-z0-9]+)/i);
  if (dashboard) {
    const fixed = `https://${dashboard[1]}.supabase.co`;
    console.warn(
      `[supabase] VITE_SUPABASE_URL looks like a dashboard link. ` +
        `Using "${fixed}" instead. Set VITE_SUPABASE_URL to your project's ` +
        `API URL (Project Settings -> API) to silence this.`
    );
    return fixed;
  }

  // Bare project ref (e.g. "cwkznghnpgzqbqzkahzq").
  if (/^[a-z0-9]{20}$/i.test(trimmed)) {
    return `https://${trimmed}.supabase.co`;
  }

  // Missing protocol (e.g. "myref.supabase.co").
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

const supabaseUrl = normalizeSupabaseUrl(rawUrl);

if (!supabaseUrl || !supabaseAnonKey) {
  // A loud warning during development beats silent, confusing failures
  // when the env vars are missing. We still create the client so imports
  // don't throw — calls will simply fail until the keys are provided.
  console.warn(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env and add your Supabase credentials.'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
