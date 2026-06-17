/* ===========================================================
   Session logging + analytics + calendar data
   ---------------------------------------------------------
   Focused helpers around the `sessions` table (and the `tasks`
   table for completed-task counts), built on the shared
   Supabase client. Pure data layer — no UI.

   Schema reference (public.sessions):
     id, user_id, duration_minutes, space_id, session_type, created_at

   Only `session_type = 'focus'` rows count toward study-time
   stats. Day boundaries use the viewer's LOCAL timezone.
   =========================================================== */
import { supabase } from './supabase';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// Local YYYY-MM-DD key (not UTC) so "today" matches the viewer's clock.
const dayKey = (value) => {
  const d = new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Build a {dayKey: minutes} map of focus minutes from session rows.
const minutesByDayFrom = (rows) => {
  const map = {};
  for (const row of rows) {
    const key = dayKey(row.created_at);
    map[key] = (map[key] || 0) + (row.duration_minutes || 0);
  }
  return map;
};

// Consecutive days (ending today) that have > 0 focus minutes.
const streakFrom = (minutesByDay) => {
  let streak = 0;
  const cursor = startOfToday();
  while ((minutesByDay[dayKey(cursor)] || 0) > 0) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

/**
 * Insert a completed session. Accepts either:
 *   logSession(userId, durationMinutes, spaceId)
 *   logSession({ userId, durationMinutes, spaceId, sessionType })
 * Returns { data, error } (the inserted row on success).
 */
export async function logSession(userIdOrOpts, durationMinutes, spaceId) {
  const opts =
    userIdOrOpts && typeof userIdOrOpts === 'object'
      ? userIdOrOpts
      : { userId: userIdOrOpts, durationMinutes, spaceId };

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: opts.userId,
      duration_minutes: opts.durationMinutes,
      space_id: opts.spaceId ?? null,
      session_type: opts.sessionType ?? 'focus',
    })
    .select()
    .single();
  if (error) console.error('[sessions] logSession error:', error);
  return { data, error };
}

/**
 * Today / this-week focus stats plus a 7-day breakdown.
 * Returns:
 *   {
 *     todayMinutes,
 *     weeklyMinutes,
 *     streak,
 *     weeklyBreakdown: [{ day, minutes }]   // last 7 days, oldest -> newest
 *   }                                       // `day` is a lowercase weekday name
 */
export async function fetchSessionStats(userId) {
  const empty = { todayMinutes: 0, weeklyMinutes: 0, streak: 0, weeklyBreakdown: [] };

  // 366 days of history gives the streak walk-back room to work.
  const since = new Date(startOfToday().getTime() - 366 * DAY_MS);
  const { data, error } = await supabase
    .from('sessions')
    .select('duration_minutes, created_at')
    .eq('user_id', userId)
    .eq('session_type', 'focus')
    .gte('created_at', since.toISOString());

  if (error) {
    console.error('[sessions] fetchSessionStats error:', error);
    return empty;
  }

  const rows = data ?? [];
  const minutesByDay = minutesByDayFrom(rows);
  const todayStart = startOfToday();

  const todayMinutes = minutesByDay[dayKey(todayStart)] || 0;

  let weeklyMinutes = 0;
  const weeklyBreakdown = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(todayStart.getTime() - i * DAY_MS);
    const minutes = minutesByDay[dayKey(d)] || 0;
    weeklyMinutes += minutes;
    weeklyBreakdown.push({ day: WEEKDAYS[d.getDay()], minutes });
  }

  return { todayMinutes, weeklyMinutes, streak: streakFrom(minutesByDay), weeklyBreakdown };
}

/**
 * Lifetime stats.
 * Returns:
 *   {
 *     totalHours,           // focus hours, 1 decimal
 *     streak,               // current daily streak
 *     tasksCompleted,       // count of completed tasks
 *     bestSessionMinutes,   // longest single focus session
 *     mostProductiveDay     // weekday name with the most total minutes (or null)
 *   }
 */
export async function fetchAllTimeStats(userId) {
  const empty = {
    totalHours: 0,
    streak: 0,
    tasksCompleted: 0,
    bestSessionMinutes: 0,
    mostProductiveDay: null,
  };

  const [sessionRes, taskRes] = await Promise.all([
    supabase
      .from('sessions')
      .select('duration_minutes, created_at')
      .eq('user_id', userId)
      .eq('session_type', 'focus'),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true),
  ]);

  if (sessionRes.error) {
    console.error('[sessions] fetchAllTimeStats error:', sessionRes.error);
    return empty;
  }
  if (taskRes.error) {
    console.error('[sessions] fetchAllTimeStats tasks error:', taskRes.error);
  }

  const rows = sessionRes.data ?? [];

  let totalMinutes = 0;
  let bestSessionMinutes = 0;
  const minutesByWeekday = [0, 0, 0, 0, 0, 0, 0];
  for (const row of rows) {
    const minutes = row.duration_minutes || 0;
    totalMinutes += minutes;
    if (minutes > bestSessionMinutes) bestSessionMinutes = minutes;
    minutesByWeekday[new Date(row.created_at).getDay()] += minutes;
  }

  let mostProductiveDay = null;
  if (rows.length > 0) {
    let bestIdx = 0;
    for (let i = 1; i < minutesByWeekday.length; i += 1) {
      if (minutesByWeekday[i] > minutesByWeekday[bestIdx]) bestIdx = i;
    }
    if (minutesByWeekday[bestIdx] > 0) mostProductiveDay = WEEKDAYS[bestIdx];
  }

  return {
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    streak: streakFrom(minutesByDayFrom(rows)),
    tasksCompleted: taskRes.count ?? 0,
    bestSessionMinutes,
    mostProductiveDay,
  };
}

/**
 * Sessions for a given calendar month, grouped by day-of-month.
 * `month` is 1-based (1 = January).
 * Returns: { [dayNumber]: [{ id, duration_minutes, session_type, created_at }] }
 */
export async function fetchSessionsByMonth(userId, year, month) {
  if (!userId) return {};

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const { data, error } = await supabase
    .from('sessions')
    .select('id, duration_minutes, session_type, created_at')
    .eq('user_id', userId)
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[sessions] fetchSessionsByMonth error:', error);
    return {};
  }

  const grouped = {};
  for (const row of data ?? []) {
    const dayNumber = new Date(row.created_at).getDate();
    if (!grouped[dayNumber]) grouped[dayNumber] = [];
    grouped[dayNumber].push({
      id: row.id,
      duration_minutes: row.duration_minutes,
      session_type: row.session_type,
      created_at: row.created_at,
    });
  }
  return grouped;
}

/**
 * Completed tasks for a given calendar month, grouped by day-of-month.
 * `month` is 1-based (1 = January).
 *
 * The schema has no `completed_at`, so completed tasks are bucketed by
 * their `created_at` day — the best available signal for "that day".
 * Returns: { [dayNumber]: [{ id, title, created_at }] }
 */
export async function fetchCompletedTasksByMonth(userId, year, month) {
  if (!userId) return {};

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, created_at')
    .eq('user_id', userId)
    .eq('completed', true)
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[sessions] fetchCompletedTasksByMonth error:', error);
    return {};
  }

  const grouped = {};
  for (const row of data ?? []) {
    const dayNumber = new Date(row.created_at).getDate();
    if (!grouped[dayNumber]) grouped[dayNumber] = [];
    grouped[dayNumber].push({ id: row.id, title: row.title, created_at: row.created_at });
  }
  return grouped;
}
