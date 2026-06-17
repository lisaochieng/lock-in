/* ===========================================================
   Goals
   ---------------------------------------------------------
   Read/write the per-user goals row. Pure data layer — no UI.

   Schema reference (public.goals):
     id, user_id, daily_goal_minutes, weekly_goal_minutes, updated_at

   The UI thinks in { dailyGoal, weeklyGoal }; this module maps
   to/from the DB column names.
   =========================================================== */
import { supabase } from './supabase';

export const DEFAULT_GOALS = { dailyGoal: 120, weeklyGoal: 600 };

/**
 * Fetch the user's goals as { dailyGoal, weeklyGoal }.
 * Returns DEFAULT_GOALS when no row exists (or on error).
 */
export async function fetchGoals(userId) {
  const { data, error } = await supabase
    .from('goals')
    .select('daily_goal_minutes, weekly_goal_minutes')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[goals] fetchGoals error:', error);
    return { ...DEFAULT_GOALS };
  }
  if (!data) return { ...DEFAULT_GOALS };

  return {
    dailyGoal: data.daily_goal_minutes ?? DEFAULT_GOALS.dailyGoal,
    weeklyGoal: data.weekly_goal_minutes ?? DEFAULT_GOALS.weeklyGoal,
  };
}

/**
 * Upsert the user's goals row (one row per user).
 * `goals` => { dailyGoal, weeklyGoal }
 * Returns { data, error }.
 */
export async function saveGoals(userId, { dailyGoal, weeklyGoal }) {
  const { data, error } = await supabase
    .from('goals')
    .upsert(
      {
        user_id: userId,
        daily_goal_minutes: dailyGoal,
        weekly_goal_minutes: weeklyGoal,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) console.error('[goals] saveGoals error:', error);
  return { data, error };
}
