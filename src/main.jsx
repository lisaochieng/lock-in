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
  Target, BarChart3, Users, Play, Pause, Link as LinkIcon,
  ChevronRight, Volume2, Eye, EyeOff,
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
import {
  preloadSounds,
  playSessionComplete,
  playBreakStart,
  playBreakEnd,
  playLastFiveSeconds,
} from './lib/sounds';
import './styles.css';

const SERIF = "'Cormorant Garamond', Georgia, serif";

const parseHeroAuth = () => {
  const auth = new URLSearchParams(window.location.search).get('auth');
  return auth === 'signin' || auth === 'signup' ? auth : null;
};

const clearHeroAuthUrl = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete('auth');
  window.history.replaceState({}, '', url.pathname + url.search);
};
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

const WIDGET_KEYS = ['timer', 'tasks', 'goals', 'progress', 'sound'];

const defaultOpenWidgets = { timer: true, tasks: true, goals: false, progress: false, sound: false };

const hexToRgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
};

const defaultWidgetsOpen = { ...defaultOpenWidgets, room: false };

const WIDGET_LAYOUT_KEY = 'lockin_widget_layout';
const WIDGET_IDS = ['timer', 'tasks', 'goals', 'progress', 'room', 'sound'];
const AMBIENCE_BAR_HEIGHT = 70;
const WIDGET_Z_BASE = 100;
const WIDGET_Z_DRAG = 200;

const SIDEBAR_MIN_X = 100;
const DEFAULT_WIDGET_WIDTH = 300;
const DEFAULT_WIDGET_HEIGHT = 280;

const clampWidgetPos = (x, y, widgetWidth = DEFAULT_WIDGET_WIDTH, widgetHeight = DEFAULT_WIDGET_HEIGHT) => {
  const W = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const H = typeof window !== 'undefined' ? window.innerHeight : 800;
  const minX = SIDEBAR_MIN_X;
  const minY = 0;
  const maxX = W - widgetWidth;
  const maxY = H - widgetHeight - AMBIENCE_BAR_HEIGHT;
  return {
    x: Math.max(minX, Math.min(x, maxX)),
    y: Math.max(minY, Math.min(y, maxY)),
  };
};

const defaultWidgetLayout = () => {
  const W = typeof window !== 'undefined' ? window.innerWidth : 1280;
  return {
    timer: clampWidgetPos(W - 760, 120),
    tasks: clampWidgetPos(W - 380, 120),
    goals: clampWidgetPos(W - 760, 420),
    progress: clampWidgetPos(W - 380, 120),
    room: clampWidgetPos(W - 380, 120),
    sound: clampWidgetPos(SIDEBAR_MIN_X, 120),
    calendar: clampWidgetPos(SIDEBAR_MIN_X, 120),
  };
};

const isWidgetPosValid = (pos) => {
  if (!pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)) return false;
  const clamped = clampWidgetPos(pos.x, pos.y);
  return clamped.x === pos.x && clamped.y === pos.y;
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
        layout[id] = p && Number.isFinite(p.x) && Number.isFinite(p.y) && isWidgetPosValid(p)
          ? p
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

function RailBtn({ icon, label, active, onClick }) {
  const [hover, setHover] = useState(false);
  const iconColor = active
    ? 'var(--accent)'
    : (hover ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.4)');
  const iconBg = active
    ? 'rgba(var(--accent-rgb), 0.12)'
    : (hover ? 'rgba(255,255,255,0.07)' : 'transparent');

  return (
    <button
      onClick={onClick}
      className={`railbtn${active ? ' railbtn--active' : ''}`}
      title={label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span
        className="railicon"
        style={{ color: iconColor, background: iconBg, borderRadius: active ? 8 : 13 }}
      >
        {icon}
      </span>
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
  const [showHero, setShowHero] = useState(() => Boolean(parseHeroAuth()));
  const [heroAuth, setHeroAuth] = useState(parseHeroAuth); // 'signin' | 'signup' | null

  const [calendarProvider, setCalendarProvider] = usePersistentState('lockin-calendar-provider', 'google');
  const [calendarSynced, setCalendarSynced] = usePersistentState('lockin-calendar-synced', false);

  // Data lives in component state; localStorage is the offline / signed-out
  // fallback, and Supabase becomes the source of truth once authenticated.
  const [tasks, setTasksState] = useState(() => load('lockin-tasks', starterTasks));
  const [settings, setSettings] = useState(() => load('lockin-settings', defaultSettings));
  const [stats, setStats] = useState(() => load('lockin-stats', defaultStats()));
  const [favorites, setFavoritesState] = useState(() => load('lockin-favorites', []));

  const [widgetsOpen, setWidgetsOpen] = usePersistentState('lockin-widgets-open', defaultWidgetsOpen);
  const [openWidgets, setOpenWidgets] = useState(() => {
    const saved = load('lockin-widgets-open', defaultWidgetsOpen);
    return Object.fromEntries(WIDGET_KEYS.map((k) => [k, !!saved[k]]));
  });
  const [widgetsHidden, setWidgetsHidden] = useState(false);
  const savedStateRef = useRef(null);
  const [widgetLayout, setWidgetLayout] = useState(() => loadWidgetLayout());

  useEffect(() => {
    setWidgetsOpen((o) => ({ ...o, ...openWidgets }));
  }, [openWidgets, setWidgetsOpen]);

  useEffect(() => {
    WIDGET_IDS.forEach((id) => {
      if (widgetsOpen[id] && !isWidgetPosValid(widgetLayout[id])) {
        const defaults = defaultWidgetLayout();
        setWidgetLayout((prev) => {
          const next = { ...prev, [id]: defaults[id] };
          localStorage.setItem(WIDGET_LAYOUT_KEY, JSON.stringify(next));
          return next;
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount for persisted open widgets
  }, []);

  const [mode, setMode] = useState('focus'); // focus | short | long
  const [secondsLeft, setSecondsLeft] = useState(settings.focus * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0); // 0-3 within current cycle
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [timerToast, setTimerToast] = useState(false);
  const toastTimerRef = useRef(null);
  const pomodoroCountRef = useRef(0);
  const autoStartRef = useRef(null);
  const phaseHandledRef = useRef(false);

  useEffect(() => { pomodoroCountRef.current = pomodoroCount; }, [pomodoroCount]);

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

  // widget drag z-index (100 base, 200 while dragging)
  const [draggingWidget, setDraggingWidget] = useState(null);
  const [panelSlideIn, setPanelSlideIn] = useState(false);

  // rotating quote, themed to the active space's vibe
  const [qi, setQi] = useState(0);
  useEffect(() => { const t = setInterval(() => setQi((i) => i + 1), 11000); return () => clearInterval(t); }, []);

  const space = spaces.find((item) => item.id === activeSpace) || spaces[0];
  const theme = useMemo(() => themeFor(space.category), [space.category]);
  const quotePool = useMemo(() => quotesFor(space.category), [space.category]);
  const quote = quotePool[qi % quotePool.length];
  // Show a quote from the new vibe the moment a space is selected.
  useEffect(() => { setQi(0); }, [activeSpace]);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', theme.accent);
    document.documentElement.style.setProperty('--accent-rgb', hexToRgb(theme.accent));
  }, [theme.accent]);

  // ---- refs for stable access inside effects / timers ----
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  const activeSpaceRef = useRef(activeSpace);
  useEffect(() => { activeSpaceRef.current = activeSpace; }, [activeSpace]);
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
      setHeroAuth(null);
      clearHeroAuthUrl();
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
        setHeroAuth('signin');
      }
      return undefined;
    }

    const joinInviteRoom = async (roomId) => {
      if (!isValidRoomId(roomId)) return;
      const { error } = await joinRoom(roomId, user.id);
      if (error) return;
      const details = await getRoom(roomId);
      if (!details) return;
      setRoom({ id: details.id, name: details.name, host_id: details.host_id });
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
  const navigateToHero = useCallback((auth = null) => {
    const mode = auth === 'signin' || auth === 'signup' ? auth : null;
    setShowHero(true);
    setHeroAuth(mode);
    const url = new URL(window.location.href);
    if (mode) url.searchParams.set('auth', mode);
    else url.searchParams.delete('auth');
    window.history.replaceState({}, '', url.pathname + url.search);
  }, []);

  const handleIframeLoad = useCallback(() => {
    const apply = () => {
      if (!iframeRef.current) return;
      postYouTubeCommand(iframeRef.current, 'setVolume', [ytWidgetMuted ? 0 : volume]);
      postYouTubeCommand(iframeRef.current, 'setPlaybackQuality', ['hd1080']);
    };
    window.setTimeout(apply, 400);
    window.setTimeout(apply, 1200);
  }, [volume, ytWidgetMuted]);

  const applyVolumeToIframe = useCallback((val) => {
    const iframe = iframeRef.current ?? document.querySelector('#yt-background');
    if (!iframe?.contentWindow) return;
    postYouTubeCommand(iframe, 'unMute', []);
    postYouTubeCommand(iframe, 'setVolume', [val]);
  }, []);

  const handleVolumeInput = useCallback((value) => {
    setVolume(value);
    applyVolumeToIframe(value);
    if (value > 0) setYtWidgetMuted(false);
  }, [applyVolumeToIframe]);

  const handleVolumeChange = useCallback((value) => {
    saveVolume(value);
  }, []);

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
    preloadSounds();
  }, []);

  const switchTo = useCallback((nextMode) => {
    const minutes = nextMode === 'focus'
      ? settings.focus
      : nextMode === 'short'
        ? settings.shortBreak
        : settings.longBreak;
    setMode(nextMode);
    setSecondsLeft(minutes * 60);
    phaseHandledRef.current = false;
  }, [settings.focus, settings.shortBreak, settings.longBreak]);

  const stopPomodoro = useCallback(() => {
    if (autoStartRef.current) {
      window.clearTimeout(autoStartRef.current);
      autoStartRef.current = null;
    }
    setIsAutoRunning(false);
    setPomodoroCount(0);
    pomodoroCountRef.current = 0;
    setMode('focus');
    setSecondsLeft(settings.focus * 60);
    setIsRunning(false);
    phaseHandledRef.current = false;
  }, [settings.focus]);

  const resetPhase = useCallback(() => {
    if (autoStartRef.current) {
      window.clearTimeout(autoStartRef.current);
      autoStartRef.current = null;
    }
    const minutes = mode === 'focus'
      ? settings.focus
      : mode === 'short'
        ? settings.shortBreak
        : settings.longBreak;
    setSecondsLeft(minutes * 60);
    setIsRunning(false);
    phaseHandledRef.current = false;
  }, [mode, settings.focus, settings.shortBreak, settings.longBreak]);

  const toggleRunning = useCallback(() => {
    setIsRunning((running) => {
      if (!running) setIsAutoRunning(true);
      return !running;
    });
  }, []);

  const selectMode = useCallback((nextMode) => {
    if (autoStartRef.current) {
      window.clearTimeout(autoStartRef.current);
      autoStartRef.current = null;
    }
    switchTo(nextMode);
    setIsRunning(false);
  }, [switchTo]);

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
    timerIntervalRef.current = window.setInterval(() => {
      setSecondsLeft((value) => {
        const next = Math.max(0, value - 1);
        if (next > 0 && next <= 5) playLastFiveSeconds(next);
        return next;
      });
    }, 1000);
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
    if (autoStartRef.current) {
      window.clearTimeout(autoStartRef.current);
      autoStartRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (secondsLeft !== 0) {
      phaseHandledRef.current = false;
      return;
    }
    if (phaseHandledRef.current) return;
    phaseHandledRef.current = true;
    setIsRunning(false);

    if (!isAutoRunning) return;

    const scheduleAutoStart = () => {
      if (autoStartRef.current) window.clearTimeout(autoStartRef.current);
      autoStartRef.current = window.setTimeout(() => {
        autoStartRef.current = null;
        setIsRunning(true);
      }, 2000);
    };

    if (mode === 'focus') {
      playSessionComplete();
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

      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      setTimerToast(true);
      toastTimerRef.current = window.setTimeout(() => setTimerToast(false), 3000);

      const nextCount = pomodoroCountRef.current + 1;
      if (nextCount >= 4) {
        pomodoroCountRef.current = 0;
        setPomodoroCount(0);
        switchTo('long');
        playBreakStart();
      } else {
        pomodoroCountRef.current = nextCount;
        setPomodoroCount(nextCount);
        switchTo('short');
        playBreakStart();
      }
      scheduleAutoStart();
      return;
    }

    playBreakEnd();
    switchTo('focus');
    scheduleAutoStart();
  }, [
    secondsLeft,
    mode,
    isAutoRunning,
    settings.focus,
    switchTo,
    todayMinutes,
    refreshStats,
  ]);

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
    setHeroAuth(null);
    clearHeroAuthUrl();
    if (forceLanding) window.history.replaceState({}, '', window.location.pathname);
  };

  const ensureWidgetPos = useCallback((id) => {
    setWidgetLayout((prev) => {
      if (isWidgetPosValid(prev[id])) return prev;
      const defaults = defaultWidgetLayout();
      const next = { ...prev, [id]: defaults[id] };
      localStorage.setItem(WIDGET_LAYOUT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleWidget = (key) => {
    if (WIDGET_KEYS.includes(key)) {
      setOpenWidgets((prev) => {
        if (!prev[key]) ensureWidgetPos(key);
        return { ...prev, [key]: !prev[key] };
      });
      setWidgetsHidden(false);
      return;
    }
    setWidgetsOpen((prev) => {
      if (!prev[key]) ensureWidgetPos(key);
      return { ...prev, [key]: !prev[key] };
    });
    setWidgetsHidden(false);
  };

  const handleHideAll = () => {
    savedStateRef.current = { ...openWidgets };
    setOpenWidgets(Object.fromEntries(WIDGET_KEYS.map((k) => [k, false])));
    setWidgetsHidden(true);
  };

  const handleShowAll = () => {
    const hasSaved = savedStateRef.current
      && Object.values(savedStateRef.current).some((v) => v);
    const next = hasSaved
      ? { ...savedStateRef.current }
      : Object.fromEntries(WIDGET_KEYS.map((k) => [k, true]));
    setOpenWidgets(next);
    WIDGET_KEYS.forEach((id) => {
      if (next[id]) ensureWidgetPos(id);
    });
    setWidgetsHidden(false);
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
    if (!panel) {
      setPanelSlideIn(false);
      return undefined;
    }
    const id = requestAnimationFrame(() => setPanelSlideIn(true));
    return () => cancelAnimationFrame(id);
  }, [panel]);

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
    ? buildYouTubeEmbedUrl(activeVideo, { start: videoStart })
    : '';

  const wProps = (k) => ({
    theme,
    onClose: () => toggleWidget(k),
    pos: widgetLayout[k],
    onPosChange: (p) => setWidgetPos(k, p),
    z: draggingWidget === k ? WIDGET_Z_DRAG : WIDGET_Z_BASE,
    onDragStart: () => setDraggingWidget(k),
    onDragEnd: () => setDraggingWidget((w) => (w === k ? null : w)),
  });

  if (!authChecked) {
    return <div style={{ background: '#1a1a1a', width: '100vw', height: '100vh' }} />;
  }

  // ---- routing: signed-in users always get the app; guests see hero when requested ----
  const guestMode = entered && !showHero;
  const wantApp = Boolean(user) || (!forceLanding && (guestMode || roomFromUrl));
  if (!wantApp) {
    return (
      <Landing
        showAuth={heroAuth}
        onAuthChange={(mode) => {
          setHeroAuth(mode);
          const url = new URL(window.location.href);
          if (mode === 'signin' || mode === 'signup') url.searchParams.set('auth', mode);
          else url.searchParams.delete('auth');
          window.history.replaceState({}, '', url.pathname + url.search);
        }}
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
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
        >
          <div style={{
            position: 'absolute',
            top: '-15%',
            left: '-15%',
            width: '130%',
            height: '130%',
            minWidth: 1920,
            minHeight: 1080,
            pointerEvents: 'none',
          }}
          >
            <iframe
              ref={iframeRef}
              id="yt-background"
              key={`${activeVideo}-${videoStart}-${ytReady ? 'sound' : 'muted'}`}
              title="peaceful study ambience"
              src={ambienceEmbedUrl}
              style={{
                width: '100%',
                height: '100%',
                minWidth: 1920,
                minHeight: 1080,
                border: 'none',
                pointerEvents: 'none',
                display: 'block',
              }}
              allow="autoplay; encrypted-media"
              allowFullScreen={false}
              tabIndex={-1}
              sandbox="allow-scripts allow-same-origin"
              onLoad={handleIframeLoad}
            />
          </div>
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              pointerEvents: 'all',
              background: 'transparent',
              cursor: 'default',
            }}
          />
        </div>
      )}

      {/* left rail */}
      <div className="rail" style={{ background: theme.railBg, borderRight: `1px solid ${theme.panelBorder}` }}>
        {user ? (
          <div className="raillogo">lock in</div>
        ) : (
          <button type="button" className="raillogo raillogo--clickable" onClick={() => navigateToHero(null)}>
            lock in
          </button>
        )}
        <div className="railgroup">
          <RailBtn icon={<LayoutGrid size={20} />} label="spaces" active={panel === 'spaces'} onClick={() => openPanel('spaces')} />
          <RailBtn icon={<UserCircle size={20} />} label="profile" active={panel === 'profile'} onClick={() => openPanel('profile')} />
          <hr className="raildivider" />
          <RailBtn icon={<Timer size={20} />} label="timer" active={openWidgets.timer} onClick={() => toggleWidget('timer')} />
          <RailBtn icon={<ListTodo size={20} />} label="tasks" active={openWidgets.tasks} onClick={() => toggleWidget('tasks')} />
          <RailBtn icon={<Target size={20} />} label="goals" active={openWidgets.goals} onClick={() => toggleWidget('goals')} />
          <RailBtn icon={<BarChart3 size={20} />} label="progress" active={openWidgets.progress} onClick={() => toggleWidget('progress')} />
          <RailBtn icon={<Volume2 size={20} />} label="sound" active={openWidgets.sound} onClick={() => toggleWidget('sound')} />
        </div>
        <div style={{ marginTop: 'auto', width: '100%' }}>
          <hr className="raildivider" />
          <RailBtn
            icon={widgetsHidden ? <Eye size={20} /> : <EyeOff size={20} />}
            label={widgetsHidden ? 'show widgets' : 'hide widgets'}
            active={false}
            onClick={() => (widgetsHidden ? handleShowAll() : handleHideAll())}
          />
        </div>
      </div>

      {/* flyout panel */}
      {panel && (
        <div className={`flyout side-panel${panelSlideIn ? ' open' : ''}`} style={{ background: theme.panelBg, border: `1px solid ${theme.panelBorder}`, color: theme.text }}>
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
                  onShowHero={navigateToHero}
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
        <button className={`glassbtn${panel === 'calendar' ? ' glassbtn--active' : ''}`} onClick={() => openPanel('calendar')} title="calendar" style={{ color: theme.text, background: theme.panelBg, border: `1px solid ${theme.panelBorder}` }}>
          <CalendarDays size={18} />
        </button>
        <button className={`glassbtn${widgetsOpen.room ? ' glassbtn--active' : ''}`} onClick={() => toggleWidget('room')} title="room" style={{ color: widgetsOpen.room ? theme.accent : theme.text, background: theme.panelBg, border: `1px solid ${theme.panelBorder}` }}>
          <Users size={18} />
        </button>
        <button className="glassbtn" title="copy room link" onClick={() => roomLink && navigator.clipboard?.writeText(roomLink)} style={{ color: theme.text, background: theme.panelBg, border: `1px solid ${theme.panelBorder}`, opacity: roomLink ? 1 : 0.45 }} disabled={!roomLink}>
          <LinkIcon size={18} />
        </button>
      </div>

      {/* title + quote */}
      <div className={`main-content${panel ? ' panel-open' : ''}`}>
        <div key={`${activeSpace}-${qi}`} className="quote">{`“${quote}”`}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
          <span style={{ color: theme.accent, display: 'flex' }}><LayoutGrid size={14} /></span>
          <span className="space-meta" style={{ fontSize: 13, letterSpacing: '.06em' }}>{space.mood} · {space.category}</span>
        </div>
        <h1 className="bigtitle">{space.name}</h1>
      </div>

      {/* center play */}
      {!videoStarted && (
        <button className="playambience" onClick={() => setVideoStarted(true)} style={{ color: theme.text, background: theme.panelBg, border: `1px solid ${theme.panelBorder}` }}>
          <span style={{ width: 34, height: 34, borderRadius: '50%', background: theme.accent, color: theme.accentInk, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Play size={16} /></span>
          play ambience
        </button>
      )}

      {/* youtube input */}
      <div className="ytbar">
        <input
          value={customVideoUrl} placeholder="paste a YouTube ambience link" aria-label="YouTube ambience link"
          onChange={(e) => setCustomVideoUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadCustomVideo()}
          style={{ background: 'transparent', border: 'none', outline: 'none', color: theme.text, fontSize: 13, fontFamily: 'inherit', width: 240 }}
        />
        <button onClick={loadCustomVideo} className="primarybtn sm" style={{ background: theme.accent, color: theme.accentInk }}>play</button>
      </div>

      {/* widgets */}
      {openWidgets.timer && (
        <TimerWidget
          {...wProps('timer')}
          mode={mode}
          pomodoroCount={pomodoroCount}
          isAutoRunning={isAutoRunning}
          selectMode={selectMode}
          secondsLeft={secondsLeft}
          settings={settings}
          setSettings={setSettings}
          isRunning={isRunning}
          onToggleRunning={toggleRunning}
          onStop={stopPomodoro}
          onResetPhase={resetPhase}
          sessionToast={timerToast}
        />
      )}
      {openWidgets.tasks && <TasksWidget {...wProps('tasks')} tasks={tasks} setTasks={setTasks} />}
      {openWidgets.goals && <GoalsWidget {...wProps('goals')} settings={settings} setSettings={setSettings} todayMinutes={todayMinutes} progressPercent={progressPercent} />}
      {openWidgets.progress && (
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
          activeSpaceId={activeSpace}
          onActiveSpaceChange={setActiveSpace}
        />
      )}
      {openWidgets.sound && (
        <VolumeWidget
          {...wProps('sound')}
          volume={volume}
          onVolumeInput={handleVolumeInput}
          onVolumeChange={handleVolumeChange}
          muted={ytWidgetMuted || !ytReady}
          onToggleMute={toggleYtMute}
        />
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
