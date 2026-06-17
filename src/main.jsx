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
import { themeFor, QUOTES } from './theme';
import { spaces, categories, extractYouTubeId } from './spaces';
import { calendarEventUrl } from './calendar';
import AmbientBackground from './AmbientBackground';
import { TimerWidget, TasksWidget, GoalsWidget, ProgressWidget, RoomWidget } from './widgets';
import { SpacesPanel, ProfilePanel, CalendarPanel } from './panels';
import Landing from './Landing';
import * as auth from './lib/auth';
import * as db from './lib/db';
import './styles.css';

const SERIF = "'Cormorant Garamond', Georgia, serif";

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
const goalsToSettings = (g) => ({
  focus: g.focus_duration,
  shortBreak: g.short_break_duration,
  longBreak: g.long_break_duration,
  dailyGoal: g.daily_goal_minutes,
  weeklyGoal: g.weekly_goal_minutes,
});
const settingsToGoals = (s) => ({
  focus_duration: s.focus,
  short_break_duration: s.shortBreak,
  long_break_duration: s.longBreak,
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
  const roomFromUrl = new URLSearchParams(window.location.search).get('room');

  const [activeSpace, setActiveSpace] = usePersistentState('lockin-space', 'rainy-library');
  const [panel, setPanel] = useState('spaces'); // spaces | profile | calendar | null
  const [spaceQuery, setSpaceQuery] = useState('');
  const [category, setCategory] = useState('all');

  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('signin');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });

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

  const [roomName, setRoomName] = usePersistentState('lockin-room', roomFromUrl || 'exam-week');
  const [activeVideo, setActiveVideo] = useState(spaces.find((s) => s.id === activeSpace)?.video);
  const [videoStart, setVideoStart] = useState(spaces.find((s) => s.id === activeSpace)?.startAt ?? 10);
  const [customVideoUrl, setCustomVideoUrl] = useState('');
  const [videoStarted, setVideoStarted] = useState(false);

  const completionHandled = useRef(false);

  // widget z-stacking
  const [zMap, setZMap] = useState({});
  const zTop = useRef(50);
  const raise = (k) => { zTop.current += 1; setZMap((m) => ({ ...m, [k]: zTop.current })); };

  // rotating quote
  const [qi, setQi] = useState(0);
  useEffect(() => { const t = setInterval(() => setQi((i) => (i + 1) % QUOTES.length), 11000); return () => clearInterval(t); }, []);

  const space = spaces.find((item) => item.id === activeSpace) || spaces[0];
  const theme = useMemo(() => themeFor(space.category), [space.category]);

  // ---- refs for stable access inside effects / timers ----
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  const activeSpaceRef = useRef(activeSpace);
  useEffect(() => { activeSpaceRef.current = activeSpace; }, [activeSpace]);
  const goalsReadyRef = useRef(false);
  const taskUpdateTimers = useRef({});

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
    auth.getCurrentUser().then(({ user: u }) => { if (active) setUser(mapUser(u)); });
    const unsub = auth.onAuthStateChange((_event, session) => {
      setUser(mapUser(session?.user ?? null));
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
      setTasksState((taskRes.data || []).map((r) => ({ id: r.id, title: r.text, done: r.completed })));
      if (goalRes.data) setSettings(goalsToSettings(goalRes.data));
      else await db.saveGoals(user.id, settingsToGoals(settingsRef.current));
      goalsReadyRef.current = true;
      setFavoritesState((favRes.data || []).map((r) => r.space_id));
      await refreshStats(user.id);
    })();
    return () => { active = false; };
  }, [user?.id, refreshStats]);

  // ---- localStorage fallback writes (only while signed out) ----
  useEffect(() => { if (!user) localStorage.setItem('lockin-tasks', JSON.stringify(tasks)); }, [tasks, user]);
  useEffect(() => { if (!user) localStorage.setItem('lockin-settings', JSON.stringify(settings)); }, [settings, user]);
  useEffect(() => { if (!user) localStorage.setItem('lockin-stats', JSON.stringify(stats)); }, [stats, user]);
  useEffect(() => { if (!user) localStorage.setItem('lockin-favorites', JSON.stringify(favorites)); }, [favorites, user]);

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
      const { data, error } = await db.saveTask(uid, { text: t.title, completed: t.done });
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
        db.updateTask(uid, t.id, { text: t.title, completed: t.done });
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
  const roomLink = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomName || 'study-room')}`;
  const calendarUrl = calendarEventUrl(calendarProvider, roomName, roomLink, settings.focus);

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
        db.logSession(u.id, {
          duration_minutes: minutes,
          space_id: activeSpaceRef.current,
          session_type: 'focus',
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
      setMode('shortBreak');
      setSecondsLeft(settings.shortBreak * 60);
    } else {
      setMode('focus');
      setSecondsLeft(settings.focus * 60);
    }
  }, [mode, secondsLeft, settings.focus, settings.shortBreak, todayMinutes, refreshStats]);

  useEffect(() => { completionHandled.current = false; }, [secondsLeft]);

  const selectMode = (nextMode) => {
    const minutes = nextMode === 'focus' ? settings.focus : nextMode === 'shortBreak' ? settings.shortBreak : settings.longBreak;
    setMode(nextMode);
    setSecondsLeft(minutes * 60);
    setIsRunning(false);
  };

  const handleAuth = async (event) => {
    event.preventDefault();
    const email = authForm.email.trim().toLowerCase();
    const password = authForm.password;
    if (!email || !password) return;
    const res = authMode === 'signup'
      ? await auth.signUpWithEmail(email, password, authForm.name.trim() || email.split('@')[0])
      : await auth.signInWithEmail(email, password);
    if (res.error) { console.warn('[auth]', res.error.message); return; }
    // onAuthStateChange updates `user`; clear the form on success.
    setAuthForm({ name: '', email: '', password: '' });
  };
  const signInWithGoogle = () => { auth.signInWithGoogle(); };
  const handleSignOut = async () => { await auth.signOut(); setUser(null); };

  const widgetIds = ['timer', 'tasks', 'goals', 'progress', 'room'];
  const allWidgetsOpen = widgetIds.every((id) => widgetsOpen[id]);
  const toggleWidget = (k) => { setWidgetsOpen((o) => ({ ...o, [k]: !o[k] })); if (!widgetsOpen[k]) raise(k); };
  const toggleAllWidgets = () => { const next = !allWidgetsOpen; setWidgetsOpen(Object.fromEntries(widgetIds.map((id) => [id, next]))); };

  const openPanel = (k) => setPanel((p) => (p === k ? null : k));
  const panelTitle = { spaces: 'spaces', profile: 'profile', calendar: 'calendar' }[panel];

  const loadCustomVideo = () => {
    const id = extractYouTubeId(customVideoUrl);
    if (id) { setActiveVideo(id); setVideoStart(0); setVideoStarted(true); }
  };

  const W = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const widgetInit = {
    timer: { x: Math.min(470, W - 340), y: 132 },
    tasks: { x: Math.max(440, W - 360), y: 110 },
    goals: { x: Math.min(800, W - 320), y: 132 },
    progress: { x: Math.max(440, W - 360), y: 392 },
    room: { x: Math.min(800, W - 320), y: 470 },
  };
  const wProps = (k) => ({ theme, onClose: () => setWidgetsOpen((o) => ({ ...o, [k]: false })), init: widgetInit[k], z: zMap[k] || 40, onFocusZ: () => raise(k) });

  return (
    <div style={{ position: 'fixed', inset: 0, color: theme.text, fontFamily: "'Hanken Grotesk', sans-serif", overflow: 'hidden' }}>
      <AmbientBackground theme={theme} image={space.image} />

      {videoStarted && activeVideo && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}>
          <iframe
            title="peaceful study ambience"
            src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1&mute=0&controls=1&rel=0&playsinline=1&start=${videoStart}&origin=${encodeURIComponent(window.location.origin)}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            frameBorder={0}
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'max(100vw, 177.78vh)', height: 'max(100vh, 56.25vw)' }}
          />
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
            <SpacesPanel theme={theme} spaces={spaces} categories={categories} activeId={space.id} onSelect={(s) => setActiveSpace(s.id)} query={spaceQuery} setQuery={setSpaceQuery} cat={category} setCat={setCategory} favorites={favorites} onToggleFavorite={toggleFavorite} />
          )}
          {panel === 'profile' && (
            <ProfilePanel theme={theme} user={user} authMode={authMode} setAuthMode={setAuthMode} authForm={authForm} setAuthForm={setAuthForm} onSubmit={handleAuth} onGoogle={signInWithGoogle} onSignOut={handleSignOut} />
          )}
          {panel === 'calendar' && (
            <CalendarPanel theme={theme} provider={calendarProvider} setProvider={setCalendarProvider} synced={calendarSynced} setSynced={setCalendarSynced} calendarUrl={calendarUrl} />
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
        <button className="glassbtn" title="copy room link" onClick={() => navigator.clipboard?.writeText(roomLink)} style={{ color: theme.text, background: theme.panelBg, border: `1px solid ${theme.panelBorder}` }}>
          <LinkIcon size={18} />
        </button>
      </div>

      {/* title + quote */}
      <div className="titleblock" style={{ left: panel ? 392 : 104 }}>
        <div key={qi} className="quote" style={{ color: theme.textDim }}>{`“${QUOTES[qi]}”`}</div>
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
        <TimerWidget {...wProps('timer')} mode={mode} selectMode={selectMode} secondsLeft={secondsLeft} settings={settings} setSettings={setSettings} setSecondsLeft={setSecondsLeft} isRunning={isRunning} setIsRunning={setIsRunning} />
      )}
      {widgetsOpen.tasks && <TasksWidget {...wProps('tasks')} tasks={tasks} setTasks={setTasks} />}
      {widgetsOpen.goals && <GoalsWidget {...wProps('goals')} settings={settings} setSettings={setSettings} todayMinutes={todayMinutes} progressPercent={progressPercent} />}
      {widgetsOpen.progress && <ProgressWidget {...wProps('progress')} stats={stats} weekMinutes={weekMinutes} tasks={tasks} settings={settings} />}
      {widgetsOpen.room && <RoomWidget {...wProps('room')} roomName={roomName} setRoomName={setRoomName} roomLink={roomLink} user={user} />}
    </div>
  );
}

function Root() {
  const params = new URLSearchParams(window.location.search);
  const roomFromUrl = params.get('room');
  const forceLanding = params.has('landing'); // visit /?landing to always see the landing
  const [entered, setEntered] = usePersistentState('lockin-entered', false);
  const [sessionState, setSessionState] = useState('checking'); // checking | yes | no

  useEffect(() => {
    let active = true;
    auth.getCurrentUser()
      .then(({ user }) => { if (active) setSessionState(user ? 'yes' : 'no'); })
      .catch(() => { if (active) setSessionState('no'); });
    return () => { active = false; };
  }, []);

  const enter = () => {
    setEntered(true);
    if (forceLanding) window.history.replaceState({}, '', window.location.pathname);
  };

  if (!forceLanding && (entered || roomFromUrl)) return <App />;
  // A returning, signed-in user skips the hero entirely.
  if (!forceLanding && sessionState === 'yes') return <App />;
  // Avoid flashing the hero while we confirm whether a session exists.
  if (!forceLanding && sessionState === 'checking') return null;
  return <Landing onEnter={enter} />;
}

createRoot(document.getElementById('root')).render(<Root />);
