/* ===========================================================
   Data service
   ---------------------------------------------------------
   CRUD + query helpers for the app's data, built on Supabase.
   These are NOT wired into the UI yet.

   Conventions
     * Every function takes `userId` as its first argument and
       relevant data after it.
     * Each returns `{ data, error }` so callers handle errors
       explicitly. `error` is null on success.
     * Row Level Security still enforces ownership server-side;
       passing `userId` keeps queries scoped and writes valid.
   =========================================================== */
import { supabase } from './supabase';

/* -----------------------------------------------------------
   Tasks
   ----------------------------------------------------------- */

/** Fetch all tasks for a user, newest first. */
export async function fetchTasks(userId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
}

/**
 * Insert a new task.
 * `task` => { text, completed? }
 */
export async function saveTask(userId, task) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      text: task.text,
      completed: task.completed ?? false,
      completed_at: task.completed ? new Date().toISOString() : null,
    })
    .select()
    .single();
  return { data, error };
}

/**
 * Update an existing task.
 * `updates` => any of { text, completed }
 * When `completed` flips, `completed_at` is set/cleared accordingly.
 */
export async function updateTask(userId, taskId, updates) {
  const patch = { ...updates };
  if (Object.prototype.hasOwnProperty.call(updates, 'completed')) {
    patch.completed_at = updates.completed ? new Date().toISOString() : null;
  }
  const { data, error } = await supabase
    .from('tasks')
    .update(patch)
    .eq('id', taskId)
    .eq('user_id', userId)
    .select()
    .single();
  return { data, error };
}

/** Delete a task. */
export async function deleteTask(userId, taskId) {
  const { data, error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId);
  return { data, error };
}

/* -----------------------------------------------------------
   Goals  (one row per user)
   ----------------------------------------------------------- */

/** Fetch the user's goals/preferences row (null if not set yet). */
export async function fetchGoals(userId) {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return { data, error };
}

/**
 * Create or update the user's goals row (upsert on user_id).
 * `goals` => any of {
 *   daily_goal_minutes, weekly_goal_minutes,
 *   focus_duration, short_break_duration, long_break_duration
 * }
 */
export async function saveGoals(userId, goals) {
  const { data, error } = await supabase
    .from('goals')
    .upsert({ user_id: userId, ...goals }, { onConflict: 'user_id' })
    .select()
    .single();
  return { data, error };
}

/* -----------------------------------------------------------
   Sessions
   ----------------------------------------------------------- */

/**
 * Log a completed session.
 * `session` => {
 *   duration_minutes, space_id?, session_type?, completed_at?
 * }
 */
export async function logSession(userId, session) {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      duration_minutes: session.duration_minutes,
      space_id: session.space_id ?? null,
      session_type: session.session_type ?? 'focus',
      completed_at: session.completed_at ?? new Date().toISOString(),
    })
    .select()
    .single();
  return { data, error };
}

/** Fetch raw session rows for a user, newest first. */
export async function fetchSessions(userId, { limit = 100 } = {}) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(limit);
  return { data, error };
}

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const dayKey = (date) => new Date(date).toISOString().slice(0, 10);

/**
 * Compute focus-session stats for a user:
 *   { totalToday, totalWeek, streak, byDay }
 *
 * - totalToday: focus minutes since local midnight
 * - totalWeek:  focus minutes over the last 7 days (incl. today)
 * - streak:     consecutive days (ending today) with >0 focus minutes
 * - byDay:      { 'YYYY-MM-DD': minutes } for the last 7 days
 *
 * Only `session_type = 'focus'` rows count toward the totals.
 */
export async function fetchSessionStats(userId) {
  // Pull a generous window so the streak calc has history to walk back through.
  const since = new Date();
  since.setDate(since.getDate() - 365);

  const { data, error } = await supabase
    .from('sessions')
    .select('duration_minutes, completed_at, session_type')
    .eq('user_id', userId)
    .eq('session_type', 'focus')
    .gte('completed_at', since.toISOString())
    .order('completed_at', { ascending: false });

  if (error) return { data: null, error };

  const rows = data ?? [];

  // Minutes per day key.
  const minutesByDay = {};
  for (const row of rows) {
    const key = dayKey(row.completed_at);
    minutesByDay[key] = (minutesByDay[key] || 0) + (row.duration_minutes || 0);
  }

  const todayStart = startOfToday().getTime();
  const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000;

  let totalToday = 0;
  let totalWeek = 0;
  const byDay = {};

  // Seed last 7 day buckets so missing days show as 0.
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(todayStart);
    d.setDate(d.getDate() - i);
    byDay[dayKey(d)] = 0;
  }

  for (const row of rows) {
    const ts = new Date(row.completed_at).getTime();
    const minutes = row.duration_minutes || 0;
    if (ts >= todayStart) totalToday += minutes;
    if (ts >= weekStart) {
      totalWeek += minutes;
      const key = dayKey(row.completed_at);
      if (key in byDay) byDay[key] += minutes;
    }
  }

  // Streak: walk back day-by-day from today while minutes > 0.
  let streak = 0;
  const cursor = startOfToday();
  // If there's nothing today, the streak may still be intact from yesterday
  // back, but a 0-minute today breaks it — matching the app's existing rule.
  while ((minutesByDay[dayKey(cursor)] || 0) > 0) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    data: { totalToday, totalWeek, streak, byDay },
    error: null,
  };
}

/* -----------------------------------------------------------
   Favorites
   ----------------------------------------------------------- */

/** Fetch the user's favorited space ids. */
export async function fetchFavorites(userId) {
  const { data, error } = await supabase
    .from('favorites')
    .select('space_id')
    .eq('user_id', userId);
  return { data, error };
}

/** Add a space to favorites (idempotent via upsert on the composite key). */
export async function addFavorite(userId, spaceId) {
  const { data, error } = await supabase
    .from('favorites')
    .upsert(
      { user_id: userId, space_id: spaceId },
      { onConflict: 'user_id,space_id' }
    )
    .select()
    .single();
  return { data, error };
}

/** Remove a space from favorites. */
export async function removeFavorite(userId, spaceId) {
  const { data, error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('space_id', spaceId);
  return { data, error };
}

/* -----------------------------------------------------------
   Rooms
   ----------------------------------------------------------- */

/**
 * Create a room hosted by the user, and add the host as the
 * first member.
 */
export async function createRoom(userId, name) {
  const { data: room, error } = await supabase
    .from('rooms')
    .insert({ name, host_user_id: userId, is_active: true })
    .select()
    .single();

  if (error) return { data: null, error };

  // Best-effort: add the host as a member. If this fails we still
  // return the room, but surface the membership error.
  const { error: memberError } = await supabase
    .from('room_members')
    .upsert(
      { room_id: room.id, user_id: userId },
      { onConflict: 'room_id,user_id' }
    );

  return { data: room, error: memberError ?? null };
}

/** Join an existing room as the given user. */
export async function joinRoom(userId, roomId) {
  const { data, error } = await supabase
    .from('room_members')
    .upsert(
      { room_id: roomId, user_id: userId },
      { onConflict: 'room_id,user_id' }
    )
    .select()
    .single();
  return { data, error };
}

/** Leave a room. */
export async function leaveRoom(userId, roomId) {
  const { data, error } = await supabase
    .from('room_members')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', userId);
  return { data, error };
}

/** Fetch rooms the user is a member of (with room details). */
export async function fetchUserRooms(userId) {
  const { data, error } = await supabase
    .from('room_members')
    .select('joined_at, rooms (*)')
    .eq('user_id', userId);
  return { data, error };
}

/** Fetch the members of a room. */
export async function fetchRoomMembers(roomId) {
  const { data, error } = await supabase
    .from('room_members')
    .select('user_id, joined_at, users (id, name, avatar_url)')
    .eq('room_id', roomId);
  return { data, error };
}
