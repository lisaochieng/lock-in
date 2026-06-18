/* ===========================================================
   Rooms — shared study rooms + realtime presence
   ---------------------------------------------------------
   Pure data layer (no UI). Built on the shared Supabase client.

   Schema reference:
     public.rooms        (id, name, created_by, host_id, created_at, is_active,
                          current_space_id, timer_state)
     public.room_members (id, room_id, user_id, joined_at, last_seen_at)
     public.profiles     (id, name, avatar_url)   -- see migration 0003

   Host controls (migration 0008): only host_id may update room state;
   members read via RLS. Realtime on rooms powers subscribeToRoomState().

   Member display names/avatars come from `public.profiles`. If that
   table isn't present yet, getRoomMembers still returns membership
   rows with name/avatar_url = null instead of failing.

   Realtime requires the room_members table to be in the
   `supabase_realtime` publication (see migration 0003).
   =========================================================== */
import { supabase } from './supabase';

const nowIso = () => new Date().toISOString();

const DEFAULT_TIMER_STATE = {
  isRunning: false,
  timeLeft: 1500,
  mode: 'focus',
  startedAt: null,
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Extract a room id from a pasted invite URL or raw id string. */
export function parseRoomInvite(input) {
  const trimmed = (input || '').trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    const fromQuery = url.searchParams.get('room');
    if (fromQuery) return fromQuery.trim();
  } catch {
    // not a URL — fall through to raw id
  }
  return trimmed;
}

/** Build the shareable invite URL for a room. */
export function roomInviteLink(roomId) {
  const base = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`
    : 'https://yourapp.com';
  return `${base}?room=${encodeURIComponent(roomId)}`;
}

/** Fetch a single room by id (or null). */
export async function getRoom(roomId) {
  const { data, error } = await supabase
    .from('rooms')
    .select('id, name, created_by, created_at, is_active')
    .eq('id', roomId)
    .single();

  if (error) {
    console.error('[rooms] getRoom error:', error);
    return null;
  }
  return data;
}

export function isValidRoomId(roomId) {
  return UUID_RE.test(roomId || '');
}

/**
 * Create a room and add the creator as the first member.
 * Returns the room object (or null on error).
 */
export async function createRoom(name, userId) {
  const { data: room, error } = await supabase
    .from('rooms')
    .insert({
      name,
      created_by: userId,
      host_id: userId,
      is_active: true,
      timer_state: DEFAULT_TIMER_STATE,
    })
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
    .select('user_id, joined_at, last_seen_at, active_task')
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
    active_task: m.active_task ?? null,
  }));
}

/**
 * Host-only: set the room's shared ambience space.
 * Verifies host_id on the update query. Returns { data, error }.
 */
export async function updateRoomSpace(roomId, hostId, spaceId) {
  const { data, error } = await supabase
    .from('rooms')
    .update({ current_space_id: spaceId })
    .eq('id', roomId)
    .eq('host_id', hostId)
    .select()
    .single();

  if (error) console.error('[rooms] updateRoomSpace error:', error);
  return { data, error };
}

/**
 * Host-only: push shared timer state to the room.
 * Verifies host_id on the update query. Returns { data, error }.
 */
export async function updateRoomTimer(roomId, hostId, timerState) {
  const { data, error } = await supabase
    .from('rooms')
    .update({ timer_state: timerState })
    .eq('id', roomId)
    .eq('host_id', hostId)
    .select()
    .single();

  if (error) console.error('[rooms] updateRoomTimer error:', error);
  return { data, error };
}

/**
 * Fetch shared room state plus member list.
 * Returns { current_space_id, timer_state, host_id, name, members }
 * or null when the room cannot be loaded.
 */
export async function getRoomState(roomId) {
  const { data: room, error } = await supabase
    .from('rooms')
    .select('current_space_id, timer_state, host_id, name')
    .eq('id', roomId)
    .single();

  if (error) {
    console.error('[rooms] getRoomState error:', error);
    return null;
  }

  const members = await getRoomMembers(roomId);
  return {
    current_space_id: room.current_space_id ?? null,
    timer_state: room.timer_state ?? DEFAULT_TIMER_STATE,
    host_id: room.host_id ?? null,
    name: room.name,
    members,
  };
}

/**
 * Subscribe to room row changes (space + timer state) via Supabase Realtime.
 * `callback` receives the full updated rooms row on insert/update/delete.
 * Returns the channel (pass it to unsubscribeFromRoom).
 */
export function subscribeToRoomState(roomId, callback) {
  const channel = supabase
    .channel(`room-state-${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`,
      },
      (payload) => callback(payload.new ?? payload.old)
    )
    .subscribe();

  return channel;
}

/**
 * Mark the user as currently present in the room (upsert last_seen_at = now).
 * Returns { data, error }.
 */
export async function updatePresence(roomId, userId, activeTask = null) {
  const row = {
    room_id: roomId,
    user_id: userId,
    last_seen_at: nowIso(),
    active_task: activeTask,
  };
  const { data, error } = await supabase
    .from('room_members')
    .upsert(row, { onConflict: 'room_id,user_id' })
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
