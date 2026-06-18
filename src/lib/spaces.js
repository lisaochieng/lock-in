/* ===========================================================
   Spaces catalog — Supabase queries for the spaces table.
   Debouncing belongs in the UI layer, not here.
   =========================================================== */
import { supabase } from './supabase';

const COLUMNS = 'id, name, tags, thumbnail_url, background_url, quote';

/** Fetch every space from the catalog, ordered by name. */
export async function fetchSpaces() {
  const { data, error } = await supabase
    .from('spaces')
    .select(COLUMNS)
    .order('name', { ascending: true });
  return { data, error };
}

/**
 * Case-insensitive search on name and tags (ilike).
 * Returns all spaces when query is empty.
 */
export async function searchSpaces(query) {
  const q = (query ?? '').trim();
  if (!q) return fetchSpaces();

  const pattern = `%${q}%`;
  const { data, error } = await supabase
    .from('spaces')
    .select(COLUMNS)
    .or(`name.ilike.${pattern},tags.ilike.${pattern}`)
    .order('name', { ascending: true });
  return { data, error };
}
