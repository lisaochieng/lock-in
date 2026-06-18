/* ===========================================================
   Progress stats — single RPC + insight generation.
   No UI; built on get_user_stats() in Supabase.
   (Named progress.js — not analytics.js — so ad blockers
   don't block the Vite module request.)
   =========================================================== */
import { supabase } from './supabase';
import { fetchSessionStats } from './sessions';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAYS_LOWER = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

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
  bestSession: { minutes: 0, date: null },
  mostProductiveDay: null,
  mostProductiveHour: null,
  weeklyBreakdown: [],
  monthlyBreakdown: [],
  trend: 'steady',
  insights: [],
});

const localTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

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
  if (tasksCompleted > 0 && weeklyMinutes > 0) {
    const avg = Math.round(weeklyMinutes / tasksCompleted);
    candidates.push({
      priority: 5,
      text: `averaging ${avg} min per task completed`,
    });
  }

  return candidates
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3)
    .map((item) => item.text);
}

const mapWeeklyBreakdown = (rows) => (rows ?? []).map((row) => {
  const [y, m, d] = (row.date ?? '').split('-').map(Number);
  const weekday = Number.isFinite(y)
    ? WEEKDAYS_LOWER[new Date(y, m - 1, d).getDay()]
    : 'sunday';
  return {
    day: weekday,
    minutes: row.minutes ?? 0,
    date: row.date,
  };
});

const mapMonthlyBreakdown = (rows) => (rows ?? []).map((row) => ({
  week: row.week,
  minutes: row.minutes ?? 0,
}));

const mapRpcToAnalysis = (raw) => {
  const totalMinutes = raw?.total_minutes ?? 0;
  const weeklyMinutes = raw?.weekly_minutes ?? 0;
  const lastWeekMinutes = raw?.last_week_minutes ?? 0;
  const dailyGoal = raw?.daily_goal ?? 120;
  const trend = computeTrend(weeklyMinutes, lastWeekMinutes);
  const bestDate = raw?.best_session_date
    ? dayKey(raw.best_session_date)
    : null;

  return {
    todayMinutes: raw?.today_minutes ?? 0,
    weeklyMinutes,
    weeklyGoal: raw?.weekly_goal ?? 600,
    streak: raw?.streak ?? 0,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    tasksCompleted: raw?.tasks_completed ?? 0,
    bestSession: {
      minutes: raw?.best_session_minutes ?? 0,
      date: bestDate,
    },
    mostProductiveDay: weekdayName(raw?.most_productive_dow),
    mostProductiveHour: raw?.most_productive_hour ?? null,
    weeklyBreakdown: mapWeeklyBreakdown(raw?.weekly_breakdown),
    monthlyBreakdown: mapMonthlyBreakdown(raw?.monthly_breakdown),
    trend,
    insights: generateInsights({
      streak: raw?.streak ?? 0,
      todayMinutes: raw?.today_minutes ?? 0,
      dailyGoal,
      trend,
      mostProductiveHour: raw?.most_productive_hour ?? null,
      tasksCompleted: raw?.tasks_completed ?? 0,
      weeklyMinutes,
    }),
  };
};

/** Client-side fallback when get_user_stats RPC is missing or errors. */
async function buildClientAnalysis(userId) {
  const [sessionStats, goalsRes, sessionsRes, tasksRes] = await Promise.all([
    fetchSessionStats(userId),
    supabase
      .from('goals')
      .select('daily_goal_minutes, weekly_goal_minutes')
      .eq('user_id', userId)
      .maybeSingle(),
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

  const rows = sessionsRes.data ?? [];
  const minutesByDay = {};
  for (const row of rows) {
    const key = dayKey(row.created_at);
    minutesByDay[key] = (minutesByDay[key] || 0) + (row.duration_minutes || 0);
  }

  const todayStart = startOfToday();
  let lastWeekMinutes = 0;
  for (let i = 7; i <= 13; i += 1) {
    const d = new Date(todayStart.getTime() - i * DAY_MS);
    lastWeekMinutes += minutesByDay[dayKey(d)] || 0;
  }

  let bestSession = { minutes: 0, date: null };
  const hourTotals = {};
  const dowTotals = [0, 0, 0, 0, 0, 0, 0];
  let totalMinutes = 0;

  for (const row of rows) {
    const minutes = row.duration_minutes || 0;
    totalMinutes += minutes;
    if (minutes > bestSession.minutes) {
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
      mostProductiveDow = WEEKDAYS_LOWER[idx];
    }
  });

  const dailyGoal = goalsRes.data?.daily_goal_minutes ?? 120;
  const weeklyGoal = goalsRes.data?.weekly_goal_minutes ?? 600;
  const weeklyMinutes = sessionStats.weeklyMinutes ?? 0;
  const trend = computeTrend(weeklyMinutes, lastWeekMinutes);

  return {
    todayMinutes: sessionStats.todayMinutes ?? 0,
    weeklyMinutes,
    weeklyGoal,
    streak: sessionStats.streak ?? 0,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    tasksCompleted: tasksRes.count ?? 0,
    bestSession,
    mostProductiveDay: mostProductiveDow,
    mostProductiveHour,
    weeklyBreakdown: sessionStats.weeklyBreakdown ?? [],
    monthlyBreakdown: [],
    trend,
    insights: generateInsights({
      streak: sessionStats.streak ?? 0,
      todayMinutes: sessionStats.todayMinutes ?? 0,
      dailyGoal,
      trend,
      mostProductiveHour,
      tasksCompleted: tasksRes.count ?? 0,
      weeklyMinutes,
    }),
  };
}

/**
 * Fetch full progress analysis for a user via get_user_stats RPC,
 * falling back to client-side queries if the RPC is unavailable.
 * Returns { data, error }.
 */
export async function fetchProgressAnalysis(userId) {
  if (!userId) return { data: emptyProgressAnalysis(), error: null };

  const { data: raw, error } = await supabase.rpc('get_user_stats', {
    p_user_id: userId,
    p_tz: localTimeZone(),
  });

  if (!error && raw) {
    return { data: mapRpcToAnalysis(raw), error: null };
  }

  if (error) {
    console.warn(
      '[progress] get_user_stats RPC failed — using client fallback.',
      error.message || error,
    );
  }

  try {
    const data = await buildClientAnalysis(userId);
    return { data, error: null };
  } catch (e) {
    console.error('[progress] client fallback failed:', e);
    return { data: emptyProgressAnalysis(), error: e };
  }
}
