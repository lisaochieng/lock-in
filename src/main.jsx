/* ===========================================================
   lock in — app shell + entry
   Dark glass study space with per-vibe theming, ported from
   claude.ai/design. Keeps persistence, YouTube ambience,
   calendar deep-links and auth.
   =========================================================== */
import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LayoutGrid, UserCircle, CalendarDays, Timer, ListTodo,
  Target, BarChart3, Users, MoreHorizontal, Play, Pause, Link as LinkIcon,
  ChevronRight, Volume2, EyeOff, PanelTop,
} from 'lucide-react';
import { themeFor, quotesFor } from './theme';
import { spaces, categories } from './spaces';
import { buildYouTubeEmbedUrl, extractVideoId, applyYouTubeVolume, postYouTubeCommand } from './lib/search';
import { calendarEventUrl } from './calendar';
import AmbientBackground from './AmbientBackground';
import { TimerWidget, TasksWidget, GoalsWidget, ProgressWidget, RoomWidget, VolumeWidget } from './widgets';
import { RoomTopBar } from './panels';
import Landing from './Landing';
import * as auth from './lib/auth';
import * as db from './lib/db';
import * as sessions from './lib/sessions';
import { joinRoom, getRoom, leaveRoom, roomInviteLink, isValidRoomId } from './lib/rooms';
import './styles.css';

const SERIF = "'Cormorant Garamond', Georgia, serif";
const PENDING_ROOM_KEY = 'lockin-pending-room';
const CURRENT_ROOM_KEY = 'lockin-current-room';
const SUPABASE_WRITE_DEBOUNCE_MS = 600;
const VOLUME_KEY = 'lockin_volume';

const loadVolume = () => {
  const stored = Number(localStorage.getItem(VOLUME_KEY));
  if (Number.isFinite(stored)) return Math.min(100, Math.max(0, stored));
  const legacy = Number(localStorage.getItem('yt_volume'));
  if (Number.isFinite(legacy)) return Math.min(100, Math.max(0, legacy));
  return 45;
};

const saveVolume = (value) => {
  localStorage.setItem(VOLUME_KEY, String(Math.min(100, Math.max(0, value))));
};

const defaultWidgetsOpen = { timer: true, tasks: true, goals: false, progress: false, room: false, sound: false };

const WIDGET_LAYOUT_KEY = 'lockin_widget_layout';
const WIDGET_IDS = ['timer', 'tasks', 'goals', 'progress', 'room', 'sound'];

const clampWidgetPos = (x, y) => {
  const W = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const H = typeof window !== 'undefined' ? window.innerHeight : 800;
  return {
    x: Math.min(Math.max(80, x), W - 320),
    y: Math.min(Math.max(100, y), H - 200),
  };
};

const defaultWidgetLayout = () => {
  const W = typeof window !== 'undefined' ? window.innerWidth : 1280;
  return {
    timer: clampWidgetPos(80, 120),
    tasks: clampWidgetPos(W - 380, 120),
    goals: clampWidgetPos(80, 420),
    progress: clampWidgetPos(W - 380, 380),
    room: clampWidgetPos(Math.floor(W / 2) - 160, 420),
    sound: clampWidgetPos(80, 680),
  };
};

const loadWidgetLayout = () => {
  try {
    const raw = localStorage.getItem(WIDGET_LAYOUT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const defaults = defaultWidgetLayout();
      const layout = {};
      for (const id of WIDGET_IDS) {
        const p = parsed[id];
        layout[id] = p && Number.isFinite(p.x) && Number.isFinite(p.y)
          ? clampWidgetPos(p.x, p.y)
          : defaults[id];
      }
      return layout;
    }
  } catch { /* use defaults */ }
  return defaultWidgetLayout();
};

const SpacesPanel = lazy(() => import('./panels').then((m) => ({ default: m.SpacesPanel })));
const ProfilePanel = lazy(() => import('./panels').then((m) => ({ default: m.ProfilePanel })));
const CalendarPanel = lazy(() => import('./panels').then((m) => ({ default: m.CalendarPanel })));

function PanelSkeleton() {
  return (
    <div
      aria-hidden
      style={{
        flex: 1,
        minHeight: 0,
        borderRadius: 14,
        background: 'rgba(10,14,18,0.55)',
      }}
    />
  );
}

const starterTasks = [
  { id: crypto.randomUUID(), title: "review today's lecture notes", done: false },
  { id: crypto.randomUUID(), title: 'finish problem set questions 1-5', done: false },
  { id: crypto.randomUUID(), title: 'make flashcards for key terms', done: true },
];

const defaultSettings = { focus: 25, shortBreak: 5, longBreak: 15, dailyGoal: 120, weeklyGoal: 600 };
const defaultStats = () => ({ totalMinutes: 170, completedSessions: 6, streak: 3, days: { [todayKey()]: 50 } });

const todayKey = () => new Date().toISOString().slice(0, 10);

const load = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

// Translate between the UI `settings` object and the DB `goals` row.
// The DB only stores the daily/weekly minute goals; the timer durations
// (focus / short break / long break) are device preferences kept in
// localStorage, so we merge the DB goals onto the existing settings.
const applyGoals = (settings, g) => ({
  ...settings,
  dailyGoal: g.daily_goal_minutes,
  weeklyGoal: g.weekly_goal_minutes,
});
const settingsToGoals = (s) => ({
  daily_goal_minutes: s.dailyGoal,
  weekly_goal_minutes: s.weeklyGoal,
});

function usePersistentState(key, fallback) {
  const [value, setValue] = useState(() => load(key, fallback));
  useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value]);
  return [value, setValue];
}

function RailBtn({ theme, icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className="railbtn" title={label} style={{ color: active ? theme.accent : theme.textDim }}>
      <span className="railicon" style={{ background: active ? theme.chipBg : 'transparent', boxShadow: active ? `inset 0 0 0 1px ${theme.panelBorder}` : 'none' }}>{icon}</span>
      <span className="raillabel">{label}</span>
    </button>
  );
}

function App() {
  const params = new URLSearchParams(window.location.search);
  const roomFromUrl = params.get('room');
  const forceLanding = params.has('landing'); // visit /?landing to preview the hero

  const [activeSpace, setActiveSpace] = usePersistentState('lockin-space', 'rainy-library');
  const [panel, setPanel] = useState('spaces'); // spaces | profile | calendar | null
  const [category, setCategory] = useState('all');

  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [entered, setEntered] = usePersistentState('lockin-entered', false); // guest mode
  const [showHero, setShowHero] = useState(false); // force the hero (e.g. from profile)

  const [calendarProvider, setCalendarProvider] = usePersistentState('lockin-calendar-provider', 'google');
  const [calendarSynced, setCalendarSynced] = usePersistentState('lockin-calendar-synced', false);

  // Data lives in component state; localStorage is the offline / signed-out
  // fallback, and Supabase becomes the source of truth once authenticated.
  const [tasks, setTasksState] = useState(() => load('lockin-tasks', starterTasks));
  const [settings, setSettings] = useState(() => load('lockin-settings', defaultSettings));
  const [stats, setStats] = useState(() => load('lockin-stats', defaultStats()));
  const [favorites, setFavoritesState] = useState(() => load('lockin-favorites', []));

  const [widgetsOpen, setWidgetsOpen] = usePersistentState('lockin-widgets-open', defaultWidgetsOpen);
  const [widgetLayout, setWidgetLayout] = useState(() => loadWidgetLayout());

  const [mode, setMode] = useState('focus');
  const [secondsLeft, setSecondsLeft] = useState(settings.focus * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0); // focus rounds completed today
  const [timerToast, setTimerToast] = useState(false); // "focus session complete" notice
  const toastTimerRef = useRef(null);

  const [currentRoom, setCurrentRoom] = useState(() => load(CURRENT_ROOM_KEY, null));
  const setRoom = useCallback((room) => {
    setCurrentRoom(room);
    if (room?.id) localStorage.setItem(CURRENT_ROOM_KEY, JSON.stringify(room));
    else localStorage.removeItem(CURRENT_ROOM_KEY);
  }, []);
  const [activeVideo, setActiveVideo] = useState(spaces.find((s) => s.id === activeSpace)?.video);
  const [videoStart, setVideoStart] = useState(spaces.find((s) => s.id === activeSpace)?.startAt ?? 10);
  const [customVideoUrl, setCustomVideoUrl] = useState('');
  const [videoStarted, setVideoStarted] = useState(false);
  const [ytReady, setYtReady] = useState(false);
  const [volume, setVolume] = useState(() => loadVolume());
  const [ytWidgetMuted, setYtWidgetMuted] = useState(false);
  const iframeRef = useRef(null);

  const completionHandled = useRef(false);

  // widget z-stacking
  const [zMap, setZMap] = useState({});
  const zTop = useRef(50);
  const raise = (k) => { zTop.current += 1; setZMap((m) => ({ ...m, [k]: zTop.current })); };

  // rotating quote, themed to the active space's vibe
  const [qi, setQi] = useState(0);
  useEffect(() => { const t = setInterval(() => setQi((i) => i + 1), 11000); return () => clearInterval(t); }, []);

  const space = spaces.find((item) => item.id === activeSpace) || spaces[0];
  const theme = useMemo(() => themeFor(space.category), [space.category]);
  const quotePool = useMemo(() => quotesFor(space.category), [space.category]);
  const quote = quotePool[qi % quotePool.length];
  // Show a quote from the new vibe the moment a space is selected.
  useEffect(() => { setQi(0); }, [activeSpace]);

  // ---- refs for stable access inside effects / timers ----
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  const activeSpaceRef = useRef(activeSpace);
  useEffect(() => { activeSpaceRef.current = activeSpace; }, [activeSpace]);
  const sessionCountRef = useRef(sessionCount);
  useEffect(() => { sessionCountRef.current = sessionCount; }, [sessionCount]);
  const goalsReadyRef = useRef(false);
  const taskUpdateTimers = useRef({});
  const roomAutoJoinRef = useRef(false);
  const timerIntervalRef = useRef(null);

  // ---- session stats from Supabase ----
  const refreshStats = useCallback(async (uid) => {
    const { data } = await db.fetchSessionStats(uid);
    if (data) {
      setStats((prev) => ({
        ...prev,
        totalMinutes: data.totalWeek,
        streak: data.streak,
        days: data.byDay,
      }));
    }
  }, []);

  // ---- auth: hydrate current user + keep it in sync ----
  useEffect(() => {
    let active = true;
    auth.getCurrentUser()
      .then(({ user: u, error }) => {
        if (error) console.error('[auth] getCurrentUser error:', error);
        if (active) { setUser(u); setAuthChecked(true); }
      })
      .catch((e) => {
        console.error('[auth] getCurrentUser threw:', e);
        if (active) setAuthChecked(true);
      });
    const unsub = auth.onAuthStateChange(async (event, session) => {
      console.log('[auth] onAuthStateChange fired:', event, '— session user:', session?.user ?? null);
      const hydrated = await auth.hydrateUser(session?.user ?? null);
      setUser(hydrated);
      setAuthChecked(true);
      setShowHero(false);
    });
    return () => { active = false; if (unsub) unsub(); };
  }, []);

  // ---- load data on auth change: Supabase when signed in, else localStorage ----
  useEffect(() => {
    if (!user) {
      goalsReadyRef.current = false;
      setTasksState(load('lockin-tasks', starterTasks));
      setSettings(load('lockin-settings', defaultSettings));
      setFavoritesState(load('lockin-favorites', []));
      setStats(load('lockin-stats', defaultStats()));
      setSessionCount(0);
      return undefined;
    }
    let active = true;
    goalsReadyRef.current = false;
    (async () => {
      const [taskRes, goalRes, favRes] = await Promise.all([
        db.fetchTasks(user.id),
        db.fetchGoals(user.id),
        db.fetchFavorites(user.id),
      ]);
      if (!active) return;
      setTasksState((taskRes.data || []).map((r) => ({ id: r.id, title: r.title, done: r.completed })));
      if (goalRes.data) setSettings((prev) => applyGoals(prev, goalRes.data));
      else await db.saveGoals(user.id, settingsToGoals(settingsRef.current));
      goalsReadyRef.current = true;
      setFavoritesState((favRes.data || []).map((r) => r.space_id));
      await refreshStats(user.id);

      // Today's completed focus rounds (only focus sessions are logged).
      const today = new Date();
      const byMonth = await sessions.fetchSessionsByMonth(user.id, today.getFullYear(), today.getMonth() + 1);
      if (active) setSessionCount((byMonth[today.getDate()] || []).length);
    })();
    return () => { active = false; };
  }, [user?.id, refreshStats]);

  useEffect(() => {
    if (!user) roomAutoJoinRef.current = false;
  }, [user]);

  // ---- room invite: save pending id when signed out, auto-join after auth ----
  useEffect(() => {
    if (!authChecked) return undefined;

    const pendingFromStorage = sessionStorage.getItem(PENDING_ROOM_KEY);
    const inviteRoomId = roomFromUrl || pendingFromStorage;

    if (!user?.id) {
      if (inviteRoomId) {
        sessionStorage.setItem(PENDING_ROOM_KEY, inviteRoomId);
        setShowHero(true);
      }
      return undefined;
    }

    const joinInviteRoom = async (roomId) => {
      if (!isValidRoomId(roomId)) return;
      const { error } = await joinRoom(roomId, user.id);
      if (error) return;
      const details = await getRoom(roomId);
      if (!details) return;
      setRoom({ id: details.id, name: details.name });
      sessionStorage.removeItem(PENDING_ROOM_KEY);
      if (roomFromUrl) window.history.replaceState({}, '', window.location.pathname);
    };

    if (inviteRoomId && !roomAutoJoinRef.current) {
      roomAutoJoinRef.current = true;
      joinInviteRoom(inviteRoomId);
      return undefined;
    }

    if (!inviteRoomId && currentRoom?.id && !roomAutoJoinRef.current) {
      roomAutoJoinRef.current = true;
      joinInviteRoom(currentRoom.id);
    }

    return undefined;
  }, [authChecked, user?.id, roomFromUrl, currentRoom?.id, setRoom]);

  // ---- localStorage fallback writes (only while signed out) ----
  useEffect(() => { if (!user) localStorage.setItem('lockin-tasks', JSON.stringify(tasks)); }, [tasks, user]);
  useEffect(() => { if (!user) localStorage.setItem('lockin-stats', JSON.stringify(stats)); }, [stats, user]);
  useEffect(() => { if (!user) localStorage.setItem('lockin-favorites', JSON.stringify(favorites)); }, [favorites, user]);
  // Timer durations (focus / short / long break) aren't stored in the DB, so
  // persist settings to localStorage for everyone to keep them across reloads.
  useEffect(() => { localStorage.setItem('lockin-settings', JSON.stringify(settings)); }, [settings]);

  // ---- goals / timer settings sync to Supabase (debounced) ----
  useEffect(() => {
    if (!user || !goalsReadyRef.current) return undefined;
    const t = setTimeout(() => { db.saveGoals(user.id, settingsToGoals(settings)); }, SUPABASE_WRITE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [settings, user?.id]);

  // ---- tasks: optimistic local state with DB persistence ----
  const persistTaskChanges = (prev, next) => {
    const u = userRef.current;
    if (!u) return; // signed out -> localStorage effect handles it
    const uid = u.id;
    const added = next.filter((n) => !prev.some((p) => p.id === n.id));
    const removed = prev.filter((p) => !next.some((n) => n.id === p.id));
    const updated = next.filter((n) => {
      const p = prev.find((x) => x.id === n.id);
      return p && (p.title !== n.title || p.done !== n.done);
    });
    added.forEach(async (t) => {
      const { data, error } = await db.saveTask(uid, { title: t.title, completed: t.done });
      if (!error && data) {
        setTasksState((cur) => cur.map((x) => (x.id === t.id ? { ...x, id: data.id } : x)));
      }
    });
    removed.forEach((t) => {
      if (taskUpdateTimers.current[t.id]) {
        clearTimeout(taskUpdateTimers.current[t.id]);
        delete taskUpdateTimers.current[t.id];
      }
      db.deleteTask(uid, t.id);
    });
    updated.forEach((t) => {
      if (taskUpdateTimers.current[t.id]) clearTimeout(taskUpdateTimers.current[t.id]);
      taskUpdateTimers.current[t.id] = setTimeout(() => {
        db.updateTask(uid, t.id, { title: t.title, completed: t.done });
        delete taskUpdateTimers.current[t.id];
      }, SUPABASE_WRITE_DEBOUNCE_MS);
    });
  };

  const setTasks = (updater) => {
    setTasksState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      queueMicrotask(() => persistTaskChanges(prev, next));
      return next;
    });
  };

  const toggleFavorite = useCallback((spaceId) => {
    setFavoritesState((prev) => {
      const has = prev.includes(spaceId);
      const next = has ? prev.filter((id) => id !== spaceId) : [...prev, spaceId];
      const u = userRef.current;
      if (u) {
        if (has) db.removeFavorite(u.id, spaceId);
        else db.addFavorite(u.id, spaceId);
      }
      return next;
    });
  }, []);

  const selectSpace = useCallback((s) => setActiveSpace(s.id), [setActiveSpace]);
  const handleShowHero = useCallback(() => setShowHero(true), []);

  const handleIframeLoad = useCallback(() => {
    const apply = () => {
      if (!iframeRef.current) return;
      postYouTubeCommand(iframeRef.current, 'setVolume', [ytWidgetMuted ? 0 : volume]);
    };
    window.setTimeout(apply, 400);
    window.setTimeout(apply, 1200);
  }, [volume, ytWidgetMuted]);

  const handleVolumeChange = useCallback((value) => {
    setVolume(value);
    saveVolume(value);
    if (!ytWidgetMuted) {
      postYouTubeCommand(iframeRef.current, 'setVolume', [value]);
    }
  }, [ytWidgetMuted]);

  const toggleYtMute = useCallback(() => {
    setYtWidgetMuted((prev) => {
      const next = !prev;
      applyYouTubeVolume(iframeRef.current, volume, next);
      return next;
    });
  }, [volume]);

  const handleLeaveRoom = useCallback(async () => {
    if (currentRoom?.id && user?.id) await leaveRoom(currentRoom.id, user.id);
    setRoom(null);
  }, [currentRoom?.id, user?.id, setRoom]);

  const completedTasks = tasks.filter((task) => task.done).length;
  const todayMinutes = stats.days[todayKey()] || 0;
  const progressPercent = Math.min(100, Math.round((todayMinutes / settings.dailyGoal) * 100));
  const weekMinutes = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }).reduce((sum, _, index) => {
      const day = new Date(now);
      day.setDate(now.getDate() - index);
      return sum + (stats.days[day.toISOString().slice(0, 10)] || 0);
    }, 0);
  }, [stats.days]);
  const roomLink = currentRoom?.id ? roomInviteLink(currentRoom.id) : '';
  const activeTaskTitle = useMemo(() => {
    const task = tasks.find((t) => !t.done);
    return task?.title ?? null;
  }, [tasks]);
  const calendarUrl = calendarEventUrl(calendarProvider, currentRoom?.name, roomLink, settings.focus);

  useEffect(() => { document.title = 'lock in'; }, []);

  useEffect(() => {
    const nextSpace = spaces.find((item) => item.id === activeSpace) || spaces[0];
    setActiveVideo(nextSpace.video);
    setVideoStart(nextSpace.startAt ?? 10);
    setVideoStarted(true);

    const unlockSound = () => setYtReady(true);
    document.addEventListener('click', unlockSound, { once: true });
    return () => document.removeEventListener('click', unlockSound);
  }, [activeSpace]);

  useEffect(() => {
    if (!isRunning) {
      if (timerIntervalRef.current !== null) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return undefined;
    }
    timerIntervalRef.current = window.setInterval(
      () => setSecondsLeft((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => {
      if (timerIntervalRef.current !== null) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isRunning]);

  useEffect(() => () => {
    if (timerIntervalRef.current !== null) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (secondsLeft > 0 || completionHandled.current) return;
    completionHandled.current = true;
    setIsRunning(false);
    if (mode === 'focus') {
      const minutes = settings.focus;
      const u = userRef.current;
      if (u) {
        sessions.logSession({
          userId: u.id,
          durationMinutes: minutes,
          spaceId: activeSpaceRef.current,
          sessionType: 'focus',
        }).then(() => {
          refreshStats(u.id);
          window.dispatchEvent(new CustomEvent('session:logged'));
        });
      } else {
        setStats((current) => ({
          ...current,
          totalMinutes: current.totalMinutes + minutes,
          completedSessions: current.completedSessions + 1,
          streak: current.streak + (todayMinutes === 0 ? 1 : 0),
          days: { ...current.days, [todayKey()]: (current.days[todayKey()] || 0) + minutes },
        }));
      }

      // Completion toast for ~3s.
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      setTimerToast(true);
      toastTimerRef.current = window.setTimeout(() => setTimerToast(false), 3000);

      // Every 4th focus round suggests a long break, otherwise a short one.
      const nextCount = sessionCountRef.current + 1;
      setSessionCount(nextCount);
      const longBreakDue = nextCount % 4 === 0;
      setMode(longBreakDue ? 'longBreak' : 'shortBreak');
      setSecondsLeft((longBreakDue ? settings.longBreak : settings.shortBreak) * 60);
    } else {
      setMode('focus');
      setSecondsLeft(settings.focus * 60);
    }
  }, [mode, secondsLeft, settings.focus, settings.shortBreak, settings.longBreak, todayMinutes, refreshStats]);

  useEffect(() => { completionHandled.current = false; }, [secondsLeft]);

  const selectMode = (nextMode) => {
    const minutes = nextMode === 'focus' ? settings.focus : nextMode === 'shortBreak' ? settings.shortBreak : settings.longBreak;
    setMode(nextMode);
    setSecondsLeft(minutes * 60);
    setIsRunning(false);
  };

  // Auth handlers return a result object so the hero can show messages.
  const handleSignIn = async (email, password) => {
    try {
      const { user: u, session, error } = await auth.signInWithEmail(email, password);
      if (error) { console.error('[auth] signInWithEmail error:', error); return { error }; }
      console.log('[auth] signInWithEmail session:', session, '— user:', u ?? session?.user ?? null);
      return { user: u, session };
    } catch (e) {
      console.error('[auth] signInWithEmail threw:', e);
      return { error: e };
    }
  };

  const handleSignUp = async (email, password, name) => {
    try {
      const { user: u, session, error } = await auth.signUpWithEmail(email, password, name);
      if (error) { console.error('[auth] signUpWithEmail error:', error); return { error }; }
      console.log('[auth] signUpWithEmail result — session:', session, '— user:', u);
      // No session means Supabase requires email confirmation before sign-in.
      if (!session) return { needsConfirmation: true, user: u };
      return { user: u, session };
    } catch (e) {
      console.error('[auth] signUpWithEmail threw:', e);
      return { error: e };
    }
  };

  const handleGoogle = async () => {
    try {
      const { error } = await auth.signInWithGoogle();
      if (error) console.error('[auth] signInWithGoogle error:', error);
    } catch (e) {
      console.error('[auth] signInWithGoogle threw:', e);
    }
  };

  const handleSignOut = async () => {
    try {
      if (currentRoom?.id && user?.id) await leaveRoom(currentRoom.id, user.id);
      const { error } = await auth.signOut();
      if (error) console.error('[auth] signOut error:', error);
    } catch (e) {
      console.error('[auth] signOut threw:', e);
    }
    setRoom(null);
    setUser(null);
  };

  const enterGuest = () => {
    setEntered(true);
    setShowHero(false);
    if (forceLanding) window.history.replaceState({}, '', window.location.pathname);
  };

  const navWidgetIds = ['timer', 'tasks', 'goals', 'progress', 'sound'];
  const toggleWidget = (k) => { setWidgetsOpen((o) => ({ ...o, [k]: !o[k] })); if (!widgetsOpen[k]) raise(k); };
  const showAllWidgets = () => {
    setWidgetsOpen((o) => ({ ...o, ...Object.fromEntries(navWidgetIds.map((id) => [id, true])) }));
    navWidgetIds.forEach((id) => raise(id));
  };
  const hideAllWidgets = () => {
    setWidgetsOpen((o) => ({ ...o, ...Object.fromEntries(navWidgetIds.map((id) => [id, false])) }));
  };

  const setWidgetPos = useCallback((id, pos) => {
    const clamped = clampWidgetPos(pos.x, pos.y);
    setWidgetLayout((prev) => {
      const next = { ...prev, [id]: clamped };
      localStorage.setItem(WIDGET_LAYOUT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const onResize = () => {
      setWidgetLayout((prev) => {
        const next = Object.fromEntries(
          WIDGET_IDS.map((id) => [id, clampWidgetPos(prev[id]?.x ?? 80, prev[id]?.y ?? 120)]),
        );
        localStorage.setItem(WIDGET_LAYOUT_KEY, JSON.stringify(next));
        return next;
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const openPanel = (k) => setPanel((p) => (p === k ? null : k));
  const panelTitle = { spaces: 'spaces', profile: 'profile', calendar: 'calendar' }[panel];

  useEffect(() => {
    if (!videoStarted || !iframeRef.current) return undefined;
    applyYouTubeVolume(iframeRef.current, volume, ytWidgetMuted);
    return undefined;
  }, [videoStarted, volume, ytWidgetMuted]);

  const loadCustomVideo = () => {
    const id = extractVideoId(customVideoUrl);
    if (id) { setActiveVideo(id); setVideoStart(0); setVideoStarted(true); }
  };

  const ambienceEmbedUrl = videoStarted && activeVideo
    ? buildYouTubeEmbedUrl(activeVideo, { start: videoStart, muted: false })
    : '';

  const wProps = (k) => ({
    theme,
    onClose: () => setWidgetsOpen((o) => ({ ...o, [k]: false })),
    pos: widgetLayout[k],
    onPosChange: (p) => setWidgetPos(k, p),
    z: zMap[k] || 40,
    onFocusZ: () => raise(k),
  });

  // ---- routing: signed-in (or guest / room link) -> app, otherwise the hero ----
  const guestMode = entered && !showHero;
  const wantApp = !forceLanding && (user || guestMode || roomFromUrl);
  if (!wantApp) {
    // Wait for the first auth check so a signed-in user never flashes the hero.
    if (!authChecked && !showHero) return null;
    return (
      <Landing
        onEnter={enterGuest}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onGoogle={handleGoogle}
      />
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, color: theme.text, fontFamily: "'Hanken Grotesk', sans-serif", overflow: 'hidden', '--accent': theme.accent }}>
      <AmbientBackground theme={theme} image={space.image} />

      {ambienceEmbedUrl && (
        <div className="yt-wrapper">
          <iframe
            ref={iframeRef}
            key={`${activeVideo}-${videoStart}-${ytReady ? 'sound' : 'muted'}`}
            title="peaceful study ambience"
            src={ambienceEmbedUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            frameBorder={0}
            onLoad={handleIframeLoad}
          />
          <div style={{ position: 'absolute', inset: 0, background: theme.tone === 'light' ? 'rgba(240,245,248,0.30)' : 'rgba(8,12,16,0.42)', pointerEvents: 'none' }} />
        </div>
      )}

      {/* left rail */}
      <div className="rail" style={{ background: theme.railBg, borderRight: `1px solid ${theme.panelBorder}` }}>
        <div className="raillogo" style={{ color: theme.text }}>lock in</div>
        <div className="railgroup">
          <RailBtn theme={theme} icon={<LayoutGrid size={20} />} label="spaces" active={panel === 'spaces'} onClick={() => openPanel('spaces')} />
          <RailBtn theme={theme} icon={<UserCircle size={20} />} label="profile" active={panel === 'profile'} onClick={() => openPanel('profile')} />
          <RailBtn theme={theme} icon={<Timer size={20} />} label="timer" active={widgetsOpen.timer} onClick={() => toggleWidget('timer')} />
          <RailBtn theme={theme} icon={<ListTodo size={20} />} label="tasks" active={widgetsOpen.tasks} onClick={() => toggleWidget('tasks')} />
          <RailBtn theme={theme} icon={<Target size={20} />} label="goals" active={widgetsOpen.goals} onClick={() => toggleWidget('goals')} />
          <RailBtn theme={theme} icon={<BarChart3 size={20} />} label="progress" active={widgetsOpen.progress} onClick={() => toggleWidget('progress')} />
          <RailBtn theme={theme} icon={<Volume2 size={20} />} label="sound" active={widgetsOpen.sound} onClick={() => toggleWidget('sound')} />
        </div>
        <div style={{ marginTop: 'auto', width: '100%' }}>
          <hr className="raildivider" />
          <RailBtn theme={theme} icon={<PanelTop size={20} />} label="show all" active={false} onClick={showAllWidgets} />
          <RailBtn theme={theme} icon={<EyeOff size={20} />} label="hide all" active={false} onClick={hideAllWidgets} />
          <RailBtn theme={theme} icon={<MoreHorizontal size={20} />} label="more" active={false} onClick={() => {}} />
        </div>
      </div>

      {/* flyout panel */}
      {panel && (
        <div className="flyout" style={{ background: theme.panelBg, border: `1px solid ${theme.panelBorder}`, color: theme.text }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <span style={{ fontFamily: SERIF, fontSize: 23, fontWeight: 600, letterSpacing: '.01em' }}>{panelTitle}</span>
            <button className="iconbtn" onClick={() => setPanel(null)} style={{ color: theme.textDim, transform: 'scaleX(-1)' }}><ChevronRight size={18} /></button>
          </div>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Suspense fallback={<PanelSkeleton />}>
              {panel === 'spaces' && (
                <SpacesPanel theme={theme} spaces={spaces} categories={categories} activeId={space.id} onSelect={selectSpace} cat={category} setCat={setCategory} favorites={favorites} onToggleFavorite={toggleFavorite} />
              )}
              {panel === 'profile' && (
                <ProfilePanel
                  theme={theme}
                  user={user}
                  onSignOut={handleSignOut}
                  onShowHero={handleShowHero}
                  onNameChange={(name) => setUser((u) => (u ? { ...u, name } : u))}
                />
              )}
              {panel === 'calendar' && (
                <CalendarPanel theme={theme} userId={user?.id} />
              )}
            </Suspense>
          </div>
        </div>
      )}

      {/* top-right controls */}
      <div className="topctl">
        {currentRoom && user && (
          <RoomTopBar theme={theme} room={currentRoom} onLeave={handleLeaveRoom} />
        )}
        <button className="glassbtn" onClick={() => setVideoStarted((p) => !p)} title="play / pause ambience" style={{ color: theme.text, background: theme.panelBg, border: `1px solid ${theme.panelBorder}` }}>
          {videoStarted ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button className="glassbtn" onClick={() => openPanel('calendar')} title="calendar" style={{ color: theme.text, background: theme.panelBg, border: `1px solid ${theme.panelBorder}`, boxShadow: panel === 'calendar' ? `inset 0 0 0 1px ${theme.panelBorder}` : 'none' }}>
          <CalendarDays size={18} />
        </button>
        <button className="glassbtn" onClick={() => toggleWidget('room')} title="room" style={{ color: widgetsOpen.room ? theme.accent : theme.text, background: theme.panelBg, border: `1px solid ${theme.panelBorder}`, boxShadow: widgetsOpen.room ? `inset 0 0 0 1px ${theme.panelBorder}` : 'none' }}>
          <Users size={18} />
        </button>
        <button className="glassbtn" title="copy room link" onClick={() => roomLink && navigator.clipboard?.writeText(roomLink)} style={{ color: theme.text, background: theme.panelBg, border: `1px solid ${theme.panelBorder}`, opacity: roomLink ? 1 : 0.45 }} disabled={!roomLink}>
          <LinkIcon size={18} />
        </button>
      </div>

      {/* title + quote */}
      <div className="titleblock" style={{ left: panel ? 392 : 104 }}>
        <div key={`${activeSpace}-${qi}`} className="quote" style={{ color: theme.textDim }}>{`“${quote}”`}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
          <span style={{ color: theme.accent, display: 'flex' }}><LayoutGrid size={14} /></span>
          <span style={{ fontSize: 13, color: theme.textDim, letterSpacing: '.06em' }}>{space.mood} · {space.category}</span>
        </div>
        <h1 className="bigtitle" style={{ color: theme.text }}>{space.name}</h1>
      </div>

      {/* center play */}
      {!videoStarted && (
        <button className="playambience" onClick={() => setVideoStarted(true)} style={{ color: theme.text, background: theme.panelBg, border: `1px solid ${theme.panelBorder}` }}>
          <span style={{ width: 34, height: 34, borderRadius: '50%', background: theme.accent, color: theme.accentInk, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Play size={16} /></span>
          play ambience
        </button>
      )}

      {/* youtube input */}
      <div className="ytbar" style={{ background: theme.panelBg, border: `1px solid ${theme.panelBorder}` }}>
        <input
          value={customVideoUrl} placeholder="paste a YouTube ambience link" aria-label="YouTube ambience link"
          onChange={(e) => setCustomVideoUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadCustomVideo()}
          style={{ background: 'transparent', border: 'none', outline: 'none', color: theme.text, fontSize: 13, fontFamily: 'inherit', width: 240 }}
        />
        <button onClick={loadCustomVideo} className="primarybtn sm" style={{ background: theme.accent, color: theme.accentInk }}>play</button>
      </div>

      {/* widgets */}
      {widgetsOpen.timer && (
        <TimerWidget {...wProps('timer')} mode={mode} selectMode={selectMode} secondsLeft={secondsLeft} settings={settings} setSettings={setSettings} setSecondsLeft={setSecondsLeft} isRunning={isRunning} setIsRunning={setIsRunning} sessionCount={sessionCount} sessionToast={timerToast} />
      )}
      {widgetsOpen.tasks && <TasksWidget {...wProps('tasks')} tasks={tasks} setTasks={setTasks} />}
      {widgetsOpen.goals && <GoalsWidget {...wProps('goals')} settings={settings} setSettings={setSettings} todayMinutes={todayMinutes} progressPercent={progressPercent} />}
      {widgetsOpen.progress && (
        <ProgressWidget
          {...wProps('progress')}
          user={user}
          settings={settings}
          tasks={tasks}
          todayMinutes={todayMinutes}
          stats={stats}
        />
      )}
      {widgetsOpen.room && (
        <RoomWidget
          {...wProps('room')}
          user={user}
          room={currentRoom}
          onRoomChange={setRoom}
          activeTaskTitle={activeTaskTitle}
        />
      )}
      {widgetsOpen.sound && (
        <VolumeWidget
          {...wProps('sound')}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          muted={ytWidgetMuted || !ytReady}
          onToggleMute={toggleYtMute}
        />
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
