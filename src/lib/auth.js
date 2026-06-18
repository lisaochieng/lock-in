/* ===========================================================
   Auth service
   ---------------------------------------------------------
   Thin wrappers around Supabase Auth. These are intentionally
   NOT wired into the UI yet — they just expose a clean API the
   app can adopt incrementally.

   Every function returns a plain object so callers don't have
   to know about Supabase's response shape:

     { user, session, error }   for sign in / sign up
     { error }                  for sign out
     { user, error }            for getCurrentUser

   `error` is null on success and an Error-like object on failure.
   =========================================================== */
import { supabase } from './supabase';

/**
 * Map a Supabase auth user + optional profile row into the UI shape.
 */
export function formatUser(user, profile = null) {
  if (!user) return null;
  const meta = user.user_metadata || {};
  const name = profile?.name || meta.full_name || meta.name || '';
  return {
    id: user.id,
    email: user.email,
    name: name || (user.email ? user.email.split('@')[0] : 'student'),
    avatar_url: profile?.avatar_url || meta.avatar_url || '',
    provider: user.app_metadata?.provider || (meta.avatar_url ? 'google' : 'email'),
    created_at: user.created_at,
    totalSessions: 0,
    memberSince: user.created_at,
  };
}

/**
 * Load profile row and merge onto the auth user.
 */
export async function hydrateUser(authUser) {
  if (!authUser) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();
  console.log('[auth] profile query:', profile, error);

  return formatUser(authUser, profile);
}

/**
 * Create a new account with email + password.
 * The display name is stored in user metadata so the DB trigger
 * (handle_new_user) can copy it into public.profiles.
 */
export async function signUpWithEmail(email, password, name) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, full_name: name },
    },
  });
  return { user: data?.user ?? null, session: data?.session ?? null, error };
}

/**
 * Sign in an existing user with email + password.
 */
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { user: data?.user ?? null, session: data?.session ?? null, error };
}

/**
 * Start the Google OAuth flow. This redirects the browser, so on
 * success the promise typically doesn't resolve with a session —
 * the session is picked up on redirect back (detectSessionInUrl).
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  });
  return { data, error };
}

/**
 * Sign the current user out and clear the local session.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get the currently authenticated user (or null if signed out),
 * merged with their profiles row when available.
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  const authUser = data?.user ?? null;
  if (!authUser) return { user: null, error };

  const user = await hydrateUser(authUser);
  return { user, error };
}

/**
 * Subscribe to auth state changes (sign in, sign out, token refresh).
 * `callback` is invoked with (event, session).
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return () => data?.subscription?.unsubscribe();
}
