/* ===========================================================
   Rooms — shared study rooms + realtime presence
   ---------------------------------------------------------
   Pure data layer (no UI). Built on the shared Supabase client.

   Schema reference:
     public.rooms        (id, name, created_by, created_at, is_active)
     public.room_members (id, room_id, user_id, joined_at, last_seen_at)
     public.profiles     (id, name, avatar_url)   -- see migration 0003

   Member display names/avatars come from `public.profiles`. If that
   table isn't present yet, getRoomMembers still returns membership
   rows with name/avatar_url = null instead of failing.

   Realtime requires the room_members table to be in the
   `supabase_realtime` publication (see migration 0003).
   =========================================================== */
import { supabase } from './supabase';

const nowIso = () => new Date().toISOString();

/**
 * Create a room and add the creator as the first member.
 * Returns the room object (or null on error).
 */
export async function createRoom(name, userId) {
  const { data: room, error } = await supabase
    .from('rooms')
    .insert({ name, created_by: userId, is_active: true })
    .select()
    .single();

  if (error) {
    console.error('[rooms] createRoom error:', error);
    return null;
  }

  const { error: memberError } = await supabase
    .from('room_members')
    .upsert(
      { room_id: room.id, user_id: userId, last_seen_at: nowIso() },
      { onConflict: 'room_id,user_id' }
    );
  if (memberError) console.error('[rooms] createRoom add-member error:', memberError);

  return room;
}

/**
 * Join a room (idempotent). Refreshes last_seen_at.
 * Returns { data, error }.
 */
export async function joinRoom(roomId, userId) {
  const { data, error } = await supabase
    .from('room_members')
    .upsert(
      { room_id: roomId, user_id: userId, last_seen_at: nowIso() },
      { onConflict: 'room_id,user_id' }
    )
    .select()
    .single();

  if (error) console.error('[rooms] joinRoom error:', error);
  return { data, error };
}

/**
 * Leave a room. Returns { data, error }.
 */
export async function leaveRoom(roomId, userId) {
  const { data, error } = await supabase
    .from('room_members')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', userId);

  if (error) console.error('[rooms] leaveRoom error:', error);
  return { data, error };
}

/**
 * Get the members of a room with their profile name/avatar and
 * last_seen_at. Shape: [{ user_id, name, avatar_url, last_seen_at, joined_at }].
 */
export async function getRoomMembers(roomId) {
  const { data: members, error } = await supabase
    .from('room_members')
    .select('user_id, joined_at, last_seen_at')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true });

  if (error) {
    console.error('[rooms] getRoomMembers error:', error);
    return [];
  }

  const rows = members ?? [];
  if (rows.length === 0) return [];

  // Resolve display info from profiles (degrade gracefully if absent).
  let profilesById = {};
  const ids = rows.map((m) => m.user_id);
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, avatar_url')
    .in('id', ids);

  if (profileError) {
    console.warn('[rooms] getRoomMembers profiles lookup failed (names will be null):', profileError.message);
  } else {
    profilesById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  }

  return rows.map((m) => ({
    user_id: m.user_id,
    name: profilesById[m.user_id]?.name ?? null,
    avatar_url: profilesById[m.user_id]?.avatar_url ?? null,
    last_seen_at: m.last_seen_at,
    joined_at: m.joined_at,
  }));
}

/**
 * Mark the user as currently present in the room (upsert last_seen_at = now).
 * Returns { data, error }.
 */
export async function updatePresence(roomId, userId) {
  const { data, error } = await supabase
    .from('room_members')
    .upsert(
      { room_id: roomId, user_id: userId, last_seen_at: nowIso() },
      { onConflict: 'room_id,user_id' }
    )
    .select()
    .single();

  if (error) console.error('[rooms] updatePresence error:', error);
  return { data, error };
}

/**
 * Subscribe to membership changes for a room via Supabase Realtime.
 * `callback` receives the raw postgres_changes payload on every
 * insert/update/delete to room_members for this room.
 * Returns the channel (pass it to unsubscribeFromRoom).
 */
export function subscribeToRoom(roomId, callback) {
  const channel = supabase
    .channel(`room-members-${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'room_members',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => callback(payload)
    )
    .subscribe();

  return channel;
}

/**
 * Remove a Realtime channel created by subscribeToRoom.
 */
export function unsubscribeFromRoom(channel) {
  if (!channel) return;
  supabase.removeChannel(channel);
}
