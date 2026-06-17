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

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
