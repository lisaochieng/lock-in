/* ===========================================================
   Progress analytics — single RPC + insight generation.
   No UI; built on get_user_stats() in Supabase.
   =========================================================== */
import { supabase } from './supabase';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const emptyAnalysis = () => ({
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
 * `stats` may include `dailyGoal` for goal-crush detection (not returned to callers).
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
    ? WEEKDAYS[new Date(y, m - 1, d).getDay()].toLowerCase()
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

/**
 * Fetch full progress analysis for a user via a single get_user_stats RPC.
 * Returns { data, error }.
 */
export async function fetchProgressAnalysis(userId) {
  if (!userId) return { data: emptyAnalysis(), error: null };

  const { data: raw, error } = await supabase.rpc('get_user_stats', {
    p_user_id: userId,
    p_tz: localTimeZone(),
  });

  if (error) {
    console.error('[analytics] fetchProgressAnalysis error:', error);
    return { data: null, error };
  }

  const totalMinutes = raw?.total_minutes ?? 0;
  const weeklyMinutes = raw?.weekly_minutes ?? 0;
  const lastWeekMinutes = raw?.last_week_minutes ?? 0;
  const dailyGoal = raw?.daily_goal ?? 120;
  const trend = computeTrend(weeklyMinutes, lastWeekMinutes);

  const analysis = {
    todayMinutes: raw?.today_minutes ?? 0,
    weeklyMinutes,
    weeklyGoal: raw?.weekly_goal ?? 600,
    streak: raw?.streak ?? 0,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    tasksCompleted: raw?.tasks_completed ?? 0,
    bestSession: {
      minutes: raw?.best_session_minutes ?? 0,
      date: raw?.best_session_date ?? null,
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

  return { data: analysis, error: null };
}
