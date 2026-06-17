/* ===========================================================
   lock in — app shell + entry
   Dark glass study space with per-vibe theming, ported from
   claude.ai/design. Keeps persistence, YouTube ambience,
   calendar deep-links and auth.
   =========================================================== */
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import './styles.css';

const SERIF = "'Cormorant Garamond', Georgia, serif";

const starterTasks = [
  { id: crypto.randomUUID(), title: "review today's lecture notes", done: false },
  { id: crypto.randomUUID(), title: 'finish problem set questions 1-5', done: false },
  { id: crypto.randomUUID(), title: 'make flashcards for key terms', done: true },
];

const todayKey = () => new Date().toISOString().slice(0, 10);

const load = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

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

  const [user, setUser] = usePersistentState('lockin-user', null);
  const [authMode, setAuthMode] = useState('signin');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });

  const [calendarProvider, setCalendarProvider] = usePersistentState('lockin-calendar-provider', 'google');
  const [calendarSynced, setCalendarSynced] = usePersistentState('lockin-calendar-synced', false);

  const [tasks, setTasks] = usePersistentState('lockin-tasks', starterTasks);
  const [settings, setSettings] = usePersistentState('lockin-settings', { focus: 25, shortBreak: 5, longBreak: 15, dailyGoal: 120, weeklyGoal: 600 });
  const [stats, setStats] = usePersistentState('lockin-stats', { totalMinutes: 170, completedSessions: 6, streak: 3, days: { [todayKey()]: 50 } });

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
      setStats((current) => ({
        ...current,
        totalMinutes: current.totalMinutes + minutes,
        completedSessions: current.completedSessions + 1,
        streak: current.streak + (todayMinutes === 0 ? 1 : 0),
        days: { ...current.days, [todayKey()]: (current.days[todayKey()] || 0) + minutes },
      }));
      setMode('shortBreak');
      setSecondsLeft(settings.shortBreak * 60);
    } else {
      setMode('focus');
      setSecondsLeft(settings.focus * 60);
    }
  }, [mode, secondsLeft, settings.focus, settings.shortBreak, todayMinutes, setStats]);

  useEffect(() => { completionHandled.current = false; }, [secondsLeft]);

  const selectMode = (nextMode) => {
    const minutes = nextMode === 'focus' ? settings.focus : nextMode === 'shortBreak' ? settings.shortBreak : settings.longBreak;
    setMode(nextMode);
    setSecondsLeft(minutes * 60);
    setIsRunning(false);
  };

  const handleAuth = (event) => {
    event.preventDefault();
    const email = authForm.email.trim().toLowerCase();
    if (!email) return;
    setUser({ name: authMode === 'signup' ? authForm.name.trim() || email.split('@')[0] : email.split('@')[0], email, provider: 'email' });
  };
  const signInWithGoogle = () => setUser({ name: 'google student', email: 'student@gmail.com', provider: 'google' });

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
            <SpacesPanel theme={theme} spaces={spaces} categories={categories} activeId={space.id} onSelect={(s) => setActiveSpace(s.id)} query={spaceQuery} setQuery={setSpaceQuery} cat={category} setCat={setCategory} />
          )}
          {panel === 'profile' && (
            <ProfilePanel theme={theme} user={user} authMode={authMode} setAuthMode={setAuthMode} authForm={authForm} setAuthForm={setAuthForm} onSubmit={handleAuth} onGoogle={signInWithGoogle} onSignOut={() => setUser(null)} />
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

  if (!forceLanding && (entered || roomFromUrl)) return <App />;

  const enter = () => {
    setEntered(true);
    if (forceLanding) window.history.replaceState({}, '', window.location.pathname);
  };
  return <Landing onEnter={enter} />;
}

createRoot(document.getElementById('root')).render(<Root />);
