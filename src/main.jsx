/* ===========================================================
   lock in — app shell + entry
   Dark glass study space with per-vibe theming, ported from
   claude.ai/design. Keeps persistence, YouTube ambience,
   calendar deep-links and auth.
   =========================================================== */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LockKeyhole, LayoutGrid, UserCircle, CalendarDays, Timer, ListTodo,
  Target, BarChart3, Users, MoreHorizontal, Play, Pause, Link as LinkIcon,
  ChevronRight,
} from 'lucide-react';
import { themeFor, quotesFor } from './theme';
import { spaces, categories } from './spaces';
import { buildYouTubeEmbedUrl, extractVideoId } from './lib/search';
import { calendarEventUrl } from './calendar';
import AmbientBackground from './AmbientBackground';
import { TimerWidget, TasksWidget, GoalsWidget, ProgressWidget, RoomWidget } from './widgets';
import { SpacesPanel, ProfilePanel, CalendarPanel } from './panels';
import Landing from './Landing';
import * as auth from './lib/auth';
import * as db from './lib/db';
import * as sessions from './lib/sessions';
import { joinRoom, getRoom, leaveRoom, roomInviteLink, isValidRoomId } from './lib/rooms';
import './styles.css';

const SERIF = "'Cormorant Garamond', Georgia, serif";
const PENDING_ROOM_KEY = 'lockin-pending-room';
const CURRENT_ROOM_KEY = 'lockin-current-room';

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

// Map a Supabase auth user into the shape the UI already expects.
const mapUser = (u) => {
  if (!u) return null;
  const meta = u.user_metadata || {};
  const provider = u.app_metadata?.provider || (meta.avatar_url ? 'google' : 'email');
  return {
    id: u.id,
    email: u.email,
    name: meta.name || meta.full_name || (u.email ? u.email.split('@')[0] : 'student'),
    avatar_url: meta.avatar_url || null,
    provider,
  };
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

  const [widgetsOpen, setWidgetsOpen] = usePersistentState('lockin-widgets-open', { timer: true, tasks: true, goals: true, progress: true, room: true });

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
        if (active) { setUser(mapUser(u)); setAuthChecked(true); }
      })
      .catch((e) => {
        console.error('[auth] getCurrentUser threw:', e);
        if (active) setAuthChecked(true);
      });
    const unsub = auth.onAuthStateChange((event, session) => {
      console.log('[auth] onAuthStateChange fired:', event, '— session user:', session?.user ?? null);
      setUser(mapUser(session?.user ?? null));
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
    const t = setTimeout(() => { db.saveGoals(user.id, settingsToGoals(settings)); }, 500);
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
      }, 500);
    });
  };

  const setTasks = (updater) => {
    setTasksState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      queueMicrotask(() => persistTaskChanges(prev, next));
      return next;
    });
  };

  // ---- favorites toggle (heart a space) ----
  const toggleFavorite = (spaceId) => {
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
  };

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
    setVideoStarted(false);
  }, [activeSpace]);

  useEffect(() => {
    if (!isRunning) return undefined;
    const id = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [isRunning]);

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
        }).then(() => refreshStats(u.id));
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

  const widgetIds = ['timer', 'tasks', 'goals', 'progress', 'room'];
  const allWidgetsOpen = widgetIds.every((id) => widgetsOpen[id]);
  const toggleWidget = (k) => { setWidgetsOpen((o) => ({ ...o, [k]: !o[k] })); if (!widgetsOpen[k]) raise(k); };
  const toggleAllWidgets = () => { const next = !allWidgetsOpen; setWidgetsOpen(Object.fromEntries(widgetIds.map((id) => [id, next]))); };

  const openPanel = (k) => setPanel((p) => (p === k ? null : k));
  const panelTitle = { spaces: 'spaces', profile: 'profile', calendar: 'calendar' }[panel];

  const loadCustomVideo = () => {
    const id = extractVideoId(customVideoUrl);
    if (id) { setActiveVideo(id); setVideoStart(0); setVideoStarted(true); }
  };

  const embedUrl = activeVideo ? buildYouTubeEmbedUrl(activeVideo, { start: videoStart }) : '';

  const W = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const widgetInit = {
    timer: { x: Math.min(470, W - 340), y: 132 },
    tasks: { x: Math.max(440, W - 360), y: 110 },
    goals: { x: Math.min(800, W - 320), y: 132 },
    progress: { x: Math.max(440, W - 360), y: 392 },
    room: { x: Math.min(800, W - 320), y: 470 },
  };
  const wProps = (k) => ({ theme, onClose: () => setWidgetsOpen((o) => ({ ...o, [k]: false })), init: widgetInit[k], z: zMap[k] || 40, onFocusZ: () => raise(k) });

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
    <div style={{ position: 'fixed', inset: 0, color: theme.text, fontFamily: "'Hanken Grotesk', sans-serif", overflow: 'hidden' }}>
      <AmbientBackground theme={theme} image={space.image} />

      {videoStarted && embedUrl && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}>
          <div style={{ position: 'relative', overflow: 'hidden', width: '100%', height: '100%' }}>
            <iframe
              title="peaceful study ambience"
              src={embedUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              frameBorder={0}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%,-50%)',
                width: 'max(100vw, 177.78vh)',
                height: 'max(100vh, 56.25vw)',
                pointerEvents: 'none',
              }}
            />
            <div
              aria-hidden
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}
            />
          </div>
          <div style={{ position: 'absolute', inset: 0, background: theme.tone === 'light' ? 'rgba(240,245,248,0.30)' : 'rgba(8,12,16,0.42)', pointerEvents: 'none' }} />
        </div>
      )}

      {/* left rail */}
      <div className="rail" style={{ background: theme.railBg, borderRight: `1px solid ${theme.panelBorder}` }}>
        <div className="raillogo" style={{ color: theme.accent }}><LockKeyhole size={22} /></div>
        <div className="railgroup">
          <RailBtn theme={theme} icon={<LayoutGrid size={20} />} label="spaces" active={panel === 'spaces'} onClick={() => openPanel('spaces')} />
          <RailBtn theme={theme} icon={<UserCircle size={20} />} label="profile" active={panel === 'profile'} onClick={() => openPanel('profile')} />
          <RailBtn theme={theme} icon={<CalendarDays size={20} />} label="calendar" active={panel === 'calendar'} onClick={() => openPanel('calendar')} />
        </div>
        <div className="raildiv" style={{ background: theme.panelBorder }} />
        <div className="railgroup">
          <RailBtn theme={theme} icon={<Timer size={20} />} label="timer" active={widgetsOpen.timer} onClick={() => toggleWidget('timer')} />
          <RailBtn theme={theme} icon={<ListTodo size={20} />} label="tasks" active={widgetsOpen.tasks} onClick={() => toggleWidget('tasks')} />
          <RailBtn theme={theme} icon={<Target size={20} />} label="goals" active={widgetsOpen.goals} onClick={() => toggleWidget('goals')} />
          <RailBtn theme={theme} icon={<BarChart3 size={20} />} label="progress" active={widgetsOpen.progress} onClick={() => toggleWidget('progress')} />
          <RailBtn theme={theme} icon={<Users size={20} />} label="room" active={widgetsOpen.room} onClick={() => toggleWidget('room')} />
        </div>
        <div style={{ marginTop: 'auto' }}>
          <RailBtn theme={theme} icon={<MoreHorizontal size={20} />} label={allWidgetsOpen ? 'hide all' : 'show all'} active={false} onClick={toggleAllWidgets} />
        </div>
      </div>

      {/* flyout panel */}
      {panel && (
        <div className="flyout" style={{ background: theme.panelBg, border: `1px solid ${theme.panelBorder}`, color: theme.text }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <span style={{ fontFamily: SERIF, fontSize: 23, fontWeight: 600, letterSpacing: '.01em' }}>{panelTitle}</span>
            <button className="iconbtn" onClick={() => setPanel(null)} style={{ color: theme.textDim, transform: 'scaleX(-1)' }}><ChevronRight size={18} /></button>
          </div>
          {panel === 'spaces' && (
            <SpacesPanel theme={theme} spaces={spaces} categories={categories} activeId={space.id} onSelect={(s) => setActiveSpace(s.id)} cat={category} setCat={setCategory} favorites={favorites} onToggleFavorite={toggleFavorite} />
          )}
          {panel === 'profile' && (
            <ProfilePanel theme={theme} user={user} onSignOut={handleSignOut} onShowHero={() => setShowHero(true)} />
          )}
          {panel === 'calendar' && (
            <CalendarPanel theme={theme} userId={user?.id} />
          )}
        </div>
      )}

      {/* top-right controls */}
      <div className="topctl">
        <button className="glassbtn" onClick={() => setVideoStarted((p) => !p)} title="play / pause ambience" style={{ color: theme.text, background: theme.panelBg, border: `1px solid ${theme.panelBorder}` }}>
          {videoStarted ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button className="glassbtn" onClick={() => setPanel('calendar')} title="calendar" style={{ color: theme.text, background: theme.panelBg, border: `1px solid ${theme.panelBorder}` }}>
          <CalendarDays size={18} />
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
      {widgetsOpen.progress && <ProgressWidget {...wProps('progress')} user={user} settings={settings} />}
      {widgetsOpen.room && (
        <RoomWidget
          {...wProps('room')}
          user={user}
          room={currentRoom}
          onRoomChange={setRoom}
          activeTaskTitle={activeTaskTitle}
        />
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
