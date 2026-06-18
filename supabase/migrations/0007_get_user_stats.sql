-- Single-call analytics aggregates for progress analysis.
-- Uses idx_sessions_user_created / idx_sessions_user_date and idx_tasks_user.

create or replace function public.get_user_stats(p_user_id uuid, p_tz text default 'UTC')
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_today date;
  v_week_start date;
  v_last_week_start date;
  v_last_week_end date;
  v_month_start date;
  v_streak int := 0;
  v_cursor date;
  v_day_mins int;
  v_weekly_goal int := 600;
  v_daily_goal int := 120;
  v_result jsonb;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'not authorized';
  end if;

  v_today := (now() at time zone p_tz)::date;
  v_week_start := v_today - 6;
  v_last_week_end := v_today - 7;
  v_last_week_start := v_today - 13;
  v_month_start := v_today - 27;

  select
    coalesce(g.weekly_goal_minutes, 600),
    coalesce(g.daily_goal_minutes, 120)
  into v_weekly_goal, v_daily_goal
  from public.goals g
  where g.user_id = p_user_id;

  v_cursor := v_today;
  loop
    select coalesce(sum(s.duration_minutes), 0)::int
    into v_day_mins
    from public.sessions s
    where s.user_id = p_user_id
      and s.session_type = 'focus'
      and (s.created_at at time zone p_tz)::date = v_cursor;

    exit when v_day_mins = 0;
    v_streak := v_streak + 1;
    v_cursor := v_cursor - 1;
  end loop;

  with focus_recent as (
    select
      s.duration_minutes,
      (s.created_at at time zone p_tz)::date as local_date
    from public.sessions s
    where s.user_id = p_user_id
      and s.session_type = 'focus'
      and (s.created_at at time zone p_tz)::date >= v_month_start
  ),
  focus_all as (
    select
      s.duration_minutes,
      s.created_at,
      extract(dow from s.created_at at time zone p_tz)::int as dow,
      extract(hour from s.created_at at time zone p_tz)::int as hour
    from public.sessions s
    where s.user_id = p_user_id
      and s.session_type = 'focus'
  ),
  today_stats as (
    select coalesce(sum(duration_minutes), 0)::int as today_minutes
    from focus_recent
    where local_date = v_today
  ),
  week_stats as (
    select coalesce(sum(duration_minutes), 0)::int as weekly_minutes
    from focus_recent
    where local_date between v_week_start and v_today
  ),
  last_week_stats as (
    select coalesce(sum(duration_minutes), 0)::int as last_week_minutes
    from focus_recent
    where local_date between v_last_week_start and v_last_week_end
  ),
  lifetime as (
    select coalesce(sum(duration_minutes), 0)::int as total_minutes
    from focus_all
  ),
  best_session as (
    select duration_minutes, created_at
    from focus_all
    order by duration_minutes desc, created_at desc
    limit 1
  ),
  tasks as (
    select count(*)::int as tasks_completed
    from public.tasks t
    where t.user_id = p_user_id
      and t.completed = true
  ),
  dow_totals as (
    select dow, coalesce(sum(duration_minutes), 0)::int as minutes
    from focus_all
    group by dow
    order by minutes desc
    limit 1
  ),
  hour_totals as (
    select hour, coalesce(sum(duration_minutes), 0)::int as minutes
    from focus_all
    group by hour
    order by minutes desc
    limit 1
  ),
  weekly_breakdown as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'date', d.day::text,
          'minutes', coalesce(fm.minutes, 0)
        )
        order by d.day
      ),
      '[]'::jsonb
    ) as items
    from generate_series(v_week_start, v_today, interval '1 day') as d(day)
    left join (
      select local_date, sum(duration_minutes)::int as minutes
      from focus_recent
      where local_date between v_week_start and v_today
      group by local_date
    ) fm on fm.local_date = d.day::date
  ),
  monthly_breakdown as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'week', bucket.week_start::text,
          'minutes', bucket.minutes
        )
        order by bucket.week_start
      ),
      '[]'::jsonb
    ) as items
    from (
      select
        (v_today - (g * 7) - 6)::date as week_start,
        (
          select coalesce(sum(fr.duration_minutes), 0)::int
          from focus_recent fr
          where fr.local_date
            between (v_today - (g * 7) - 6)::date and (v_today - (g * 7))::date
        ) as minutes
      from generate_series(3, 0, -1) as g
    ) bucket
  )
  select jsonb_build_object(
    'today_minutes', (select today_minutes from today_stats),
    'weekly_minutes', (select weekly_minutes from week_stats),
    'last_week_minutes', (select last_week_minutes from last_week_stats),
    'weekly_goal', v_weekly_goal,
    'daily_goal', v_daily_goal,
    'streak', v_streak,
    'total_minutes', (select total_minutes from lifetime),
    'tasks_completed', (select tasks_completed from tasks),
    'best_session_minutes', (select duration_minutes from best_session),
    'best_session_date', (select created_at from best_session),
    'most_productive_dow', (select dow from dow_totals),
    'most_productive_hour', (select hour from hour_totals),
    'weekly_breakdown', (select items from weekly_breakdown),
    'monthly_breakdown', (select items from monthly_breakdown)
  )
  into v_result;

  return v_result;
end;
$$;

grant execute on function public.get_user_stats(uuid, text) to authenticated;
