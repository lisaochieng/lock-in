/* ===========================================================
   Progress stats — session/task aggregates + insight generation.
   No UI; built on direct Supabase queries.
   (Named progress.js — not analytics.js — so ad blockers
   don't block the Vite module request.)
   =========================================================== */
import { supabase } from './supabase';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const dayKey = (value) => {
  const d = new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const emptyProgressAnalysis = () => ({
  todayMinutes: 0,
  weeklyMinutes: 0,
  weeklyGoal: 600,
  streak: 0,
  totalHours: 0,
  tasksCompleted: 0,
  insights: [],
  weeklyBreakdown: [],
  monthlyBreakdown: [],
  trend: 'steady',
  bestSession: null,
  mostProductiveDay: null,
  mostProductiveHour: null,
});

const weekdayName = (dow) => (dow == null ? null : WEEKDAYS[dow] ?? null);

const computeTrend = (thisWeek, lastWeek) => {
  if (lastWeek <= 0) {
    return thisWeek > 0 ? 'improving' : 'steady';
  }
  const change = (thisWeek - lastWeek) / lastWeek;
  if (change >= 0.2) return 'improving';
  if (change <= -0.2) return 'declining';
  return 'steady';
};

/**
 * Build 2–3 human-readable insight strings from analysis stats.
 */
export function generateInsights(stats) {
  const candidates = [];
  const {
    streak = 0,
    todayMinutes = 0,
    dailyGoal = 120,
    trend = 'steady',
    mostProductiveHour,
    tasksCompleted = 0,
    weeklyMinutes = 0,
    tasksCompletedCount = 0,
  } = stats;

  if (streak >= 3) {
    candidates.push({ priority: 1, text: `you're on a ${streak} day streak, keep it up` });
  }
  if (todayMinutes >= dailyGoal) {
    candidates.push({ priority: 2, text: 'daily goal crushed 🎉' });
  }
  if (trend === 'improving') {
    candidates.push({ priority: 3, text: 'focus time up this week' });
  }
  if (mostProductiveHour != null) {
    candidates.push({
      priority: 4,
      text: `you focus best around ${mostProductiveHour}:00`,
    });
  }
  if (tasksCompletedCount > 0 && weeklyMinutes > 0) {
    const avg = Math.round(weeklyMinutes / tasksCompletedCount);
    candidates.push({
      priority: 5,
      text: `averaging ${avg} min per task completed`,
    });
  } else if (tasksCompleted > 0 && weeklyMinutes > 0) {
    candidates.push({
      priority: 5,
      text: `averaging ${Math.round(weeklyMinutes / Math.max(1, tasksCompleted))} min per task completed`,
    });
  }

  return candidates
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3)
    .map((item) => item.text);
}

export const formatMemberSince = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

/** Sum focus minutes logged today (local midnight boundary). */
export async function fetchTodayMinutes(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('sessions')
    .select('duration_minutes')
    .eq('user_id', userId)
    .eq('session_type', 'focus')
    .gte('created_at', today.toISOString());

  if (error) {
    console.error('[progress] fetchTodayMinutes error:', error);
    return 0;
  }

  return (data ?? []).reduce((sum, row) => sum + (row.duration_minutes || 0), 0);
}

/**
 * Count consecutive days backwards from today that have at least one session.
 */
export async function fetchStreak(userId) {
  const since = new Date(startOfToday().getTime() - 366 * DAY_MS);
  const { data, error } = await supabase
    .from('sessions')
    .select('created_at')
    .eq('user_id', userId)
    .eq('session_type', 'focus')
    .gte('created_at', since.toISOString());

  if (error) {
    console.error('[progress] fetchStreak error:', error);
    return 0;
  }

  const sessionDates = new Set((data ?? []).map((row) => dayKey(row.created_at)));
  let streak = 0;
  const cursor = startOfToday();
  while (sessionDates.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Completed tasks as a percentage of total tasks (0 when none exist). */
export async function fetchTasksCompletedPercent(userId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('completed')
    .eq('user_id', userId);

  if (error) {
    console.error('[progress] fetchTasksCompletedPercent error:', error);
    return 0;
  }

  const rows = data ?? [];
  if (rows.length === 0) return 0;
  const completed = rows.filter((row) => row.completed === true).length;
  return Math.round((completed / rows.length) * 100);
}

/** Last 7 days of focus minutes, oldest → newest. Missing days return 0. */
export async function fetchWeeklyBreakdown(userId) {
  const today = startOfToday();
  const weekStart = new Date(today.getTime() - 6 * DAY_MS);

  const { data, error } = await supabase
    .from('sessions')
    .select('duration_minutes, created_at')
    .eq('user_id', userId)
    .eq('session_type', 'focus')
    .gte('created_at', weekStart.toISOString());

  if (error) {
    console.error('[progress] fetchWeeklyBreakdown error:', error);
    return Array.from({ length: 7 }).map((_, index) => {
      const d = new Date(weekStart.getTime() + index * DAY_MS);
      return { day: DAY_ABBR[d.getDay()], minutes: 0, date: dayKey(d) };
    });
  }

  const minutesByDate = {};
  for (const row of data ?? []) {
    const key = dayKey(row.created_at);
    minutesByDate[key] = (minutesByDate[key] || 0) + (row.duration_minutes || 0);
  }

  return Array.from({ length: 7 }).map((_, index) => {
    const d = new Date(weekStart.getTime() + index * DAY_MS);
    const date = dayKey(d);
    return {
      day: DAY_ABBR[d.getDay()],
      minutes: minutesByDate[date] || 0,
      date,
    };
  });
}

/**
 * Sessions and completed tasks for a calendar month, grouped by day number.
 * `month` is 1-based (1 = January).
 */
export async function fetchCalendarData(userId, year, month) {
  if (!userId) return {};

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const [sessionsRes, tasksRes] = await Promise.all([
    supabase
      .from('sessions')
      .select('id, duration_minutes, created_at')
      .eq('user_id', userId)
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('tasks')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString()),
  ]);

  if (sessionsRes.error) {
    console.error('[progress] fetchCalendarData sessions error:', sessionsRes.error);
  }
  if (tasksRes.error) {
    console.error('[progress] fetchCalendarData tasks error:', tasksRes.error);
  }

  const byDay = {};

  for (const row of sessionsRes.data ?? []) {
    const dayNumber = new Date(row.created_at).getDate();
    if (!byDay[dayNumber]) {
      byDay[dayNumber] = { totalMinutes: 0, sessions: [], tasksCompleted: 0 };
    }
    byDay[dayNumber].totalMinutes += row.duration_minutes || 0;
    byDay[dayNumber].sessions.push({
      id: row.id,
      duration_minutes: row.duration_minutes,
      created_at: row.created_at,
    });
  }

  for (const row of tasksRes.data ?? []) {
    const dayNumber = new Date(row.created_at).getDate();
    if (!byDay[dayNumber]) {
      byDay[dayNumber] = { totalMinutes: 0, sessions: [], tasksCompleted: 0 };
    }
    byDay[dayNumber].tasksCompleted += 1;
  }

  return byDay;
}

const longestStreak = (sessionDates) => {
  const activeDays = [...sessionDates].sort();
  if (activeDays.length === 0) return 0;

  let max = 1;
  let run = 1;
  for (let i = 1; i < activeDays.length; i += 1) {
    const prev = new Date(`${activeDays[i - 1]}T12:00:00`);
    const curr = new Date(`${activeDays[i]}T12:00:00`);
    const gap = Math.round((curr - prev) / DAY_MS);
    if (gap === 1) {
      run += 1;
      max = Math.max(max, run);
    } else {
      run = 1;
    }
  }
  return max;
};

async function buildProgressAnalysis(userId) {
  const since = new Date(startOfToday().getTime() - 28 * DAY_MS);

  const [
    todayMinutes,
    streak,
    tasksCompleted,
    weeklyBreakdown,
    goalsRes,
    sessionsRes,
    tasksCountRes,
  ] = await Promise.all([
    fetchTodayMinutes(userId),
    fetchStreak(userId),
    fetchTasksCompletedPercent(userId),
    fetchWeeklyBreakdown(userId),
    supabase
      .from('goals')
      .select('daily_goal_minutes, weekly_goal_minutes')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('sessions')
      .select('duration_minutes, created_at')
      .eq('user_id', userId)
      .eq('session_type', 'focus')
      .gte('created_at', since.toISOString()),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true),
  ]);

  const rows = sessionsRes.data ?? [];
  const minutesByDay = {};
  const sessionDates = new Set();
  for (const row of rows) {
    const key = dayKey(row.created_at);
    minutesByDay[key] = (minutesByDay[key] || 0) + (row.duration_minutes || 0);
    sessionDates.add(key);
  }

  const todayStart = startOfToday();
  let lastWeekMinutes = 0;
  for (let i = 7; i <= 13; i += 1) {
    const d = new Date(todayStart.getTime() - i * DAY_MS);
    lastWeekMinutes += minutesByDay[dayKey(d)] || 0;
  }

  let bestSession = null;
  const hourTotals = {};
  const dowTotals = [0, 0, 0, 0, 0, 0, 0];
  let totalMinutes = 0;

  for (const row of rows) {
    const minutes = row.duration_minutes || 0;
    totalMinutes += minutes;
    if (!bestSession || minutes > bestSession.minutes) {
      bestSession = { minutes, date: dayKey(row.created_at) };
    }
    const created = new Date(row.created_at);
    const h = created.getHours();
    const dow = created.getDay();
    hourTotals[h] = (hourTotals[h] || 0) + minutes;
    dowTotals[dow] += minutes;
  }

  let mostProductiveHour = null;
  let bestHourTotal = 0;
  for (const [hour, mins] of Object.entries(hourTotals)) {
    if (mins > bestHourTotal) {
      bestHourTotal = mins;
      mostProductiveHour = Number(hour);
    }
  }

  let mostProductiveDow = null;
  let bestDowTotal = 0;
  dowTotals.forEach((mins, idx) => {
    if (mins > bestDowTotal) {
      bestDowTotal = mins;
      mostProductiveDow = WEEKDAYS[idx];
    }
  });

  const dailyGoal = goalsRes.data?.daily_goal_minutes ?? 120;
  const weeklyGoal = goalsRes.data?.weekly_goal_minutes ?? 600;
  const weeklyMinutes = weeklyBreakdown.reduce((sum, day) => sum + day.minutes, 0);
  const trend = computeTrend(weeklyMinutes, lastWeekMinutes);
  const tasksCompletedCount = tasksCountRes.count ?? 0;

  const monthlyBreakdown = [];
  for (let g = 3; g >= 0; g -= 1) {
    const weekEnd = new Date(todayStart.getTime() - g * 7 * DAY_MS);
    const weekStart = new Date(weekEnd.getTime() - 6 * DAY_MS);
    let minutes = 0;
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(weekStart.getTime() + i * DAY_MS);
      minutes += minutesByDay[dayKey(d)] || 0;
    }
    monthlyBreakdown.push({ week: dayKey(weekStart), minutes });
  }

  return {
    todayMinutes,
    weeklyMinutes,
    weeklyGoal,
    streak,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    tasksCompleted,
    bestSession,
    mostProductiveDay: mostProductiveDow,
    mostProductiveHour,
    weeklyBreakdown,
    monthlyBreakdown,
    trend,
    insights: generateInsights({
      streak,
      todayMinutes,
      dailyGoal,
      trend,
      mostProductiveHour,
      tasksCompleted,
      tasksCompletedCount,
      weeklyMinutes,
    }),
  };
}

/**
 * Fetch full progress analysis for a user.
 * Returns { data, error }.
 */
export async function fetchProgressAnalysis(userId) {
  if (!userId) return { data: emptyProgressAnalysis(), error: null };

  try {
    const data = await buildProgressAnalysis(userId);
    return { data: data ?? emptyProgressAnalysis(), error: null };
  } catch (e) {
    console.error('[progress] fetchProgressAnalysis failed:', e);
    return { data: emptyProgressAnalysis(), error: e };
  }
}

/**
 * Profile-oriented lifetime stats for the signed-in user.
 */
export async function fetchUserProfileStats(userId) {
  const empty = {
    memberSince: '—',
    totalFocusHours: 0,
    totalSessions: 0,
    totalTasksCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
  };
  if (!userId) return { data: empty, error: null };

  const [sessionsRes, tasksRes, authRes, streak] = await Promise.all([
    supabase
      .from('sessions')
      .select('duration_minutes, created_at, session_type')
      .eq('user_id', userId),
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true),
    supabase.auth.getUser(),
    fetchStreak(userId),
  ]);

  if (sessionsRes.error) {
    console.error('[progress] profile sessions error:', sessionsRes.error);
  }
  if (tasksRes.error) {
    console.error('[progress] profile tasks error:', tasksRes.error);
  }

  const focusRows = (sessionsRes.data ?? []).filter((row) => row.session_type === 'focus');
  const sessionDates = new Set(focusRows.map((row) => dayKey(row.created_at)));
  const totalMinutes = focusRows.reduce((sum, row) => sum + (row.duration_minutes || 0), 0);

  return {
    data: {
      memberSince: formatMemberSince(authRes.data?.user?.created_at),
      totalFocusHours: Math.round((totalMinutes / 60) * 10) / 10,
      totalSessions: focusRows.length,
      totalTasksCompleted: (tasksRes.data ?? []).length,
      currentStreak: streak,
      longestStreak: longestStreak(sessionDates),
    },
    error: sessionsRes.error ?? tasksRes.error ?? null,
  };
}
