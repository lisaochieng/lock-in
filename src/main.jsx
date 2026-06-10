import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BarChart3,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronRight,
  Clipboard,
  Copy,
  Flame,
  Goal,
  Home,
  Link as LinkIcon,
  ListTodo,
  LockKeyhole,
  Mail,
  Menu,
  Move,
  PanelLeftClose,
  PanelLeftOpen,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Timer,
  Trash2,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import './styles.css';
import HeroLanding from './HeroLanding';

const spaces = [
  {
    id: 'rainy-library',
    name: 'rainy library',
    category: 'rain',
    mood: 'deep reading',
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1800&q=80',
    tint: 'rgba(16, 28, 30, 0.48)',
    video: 'zbWL2QXlpxA',
  },
  {
    id: 'dawn-desk',
    name: 'dawn desk',
    category: 'morning',
    mood: 'gentle review',
    image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1800&q=80',
    tint: 'rgba(43, 54, 43, 0.42)',
    video: 'BCxTQq0UiFs',
  },
  {
    id: 'botanical-room',
    name: 'botanical room',
    category: 'nature',
    mood: 'light tasks',
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1800&q=80',
    tint: 'rgba(18, 62, 48, 0.42)',
    video: 'Xs-gaC3HORU',
  },
  {
    id: 'night-focus',
    name: 'night focus',
    category: 'night',
    mood: 'quiet grind',
    image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1800&q=80',
    tint: 'rgba(14, 18, 36, 0.56)',
    video: 'obBIjcFwyts',
  },
  {
    id: 'cozy-cafe',
    name: 'cozy cafe',
    category: 'cafe',
    mood: 'essay flow',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1800&q=80',
    tint: 'rgba(57, 37, 23, 0.44)',
    video: 'lTRiuFIWV54',
  },
  {
    id: 'forest-cabin',
    name: 'forest cabin',
    category: 'nature',
    mood: 'calm recall',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80',
    tint: 'rgba(24, 54, 34, 0.48)',
    video: 'jfKfPfyJRdk',
  },
  {
    id: 'ocean-window',
    name: 'ocean window',
    category: 'water',
    mood: 'slow planning',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=80',
    tint: 'rgba(19, 56, 65, 0.46)',
    video: '5qap5aO4i9A',
  },
  {
    id: 'soft-studio',
    name: 'soft studio',
    category: 'minimal',
    mood: 'clean start',
    image: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1800&q=80',
    tint: 'rgba(59, 53, 46, 0.36)',
    video: 'DWcJFNfaw9c',
  },
  {
    id: 'snowy-evening',
    name: 'snowy evening',
    category: 'winter',
    mood: 'exam prep',
    image: 'https://images.unsplash.com/photo-1483664852095-d6cc6870702d?auto=format&fit=crop&w=1800&q=80',
    tint: 'rgba(28, 38, 49, 0.5)',
    video: 'BCxTQq0UiFs',
  },
  {
    id: 'sunlit-archive',
    name: 'sunlit archive',
    category: 'library',
    mood: 'research mode',
    image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1800&q=80',
    tint: 'rgba(68, 53, 30, 0.42)',
    video: 'zbWL2QXlpxA',
  },
  {
    id: 'greenhouse',
    name: 'greenhouse',
    category: 'nature',
    mood: 'biology notes',
    image: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1800&q=80',
    tint: 'rgba(28, 65, 39, 0.44)',
    video: 'Xs-gaC3HORU',
  },
  {
    id: 'moon-dorm',
    name: 'moon dorm',
    category: 'night',
    mood: 'late session',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1800&q=80',
    tint: 'rgba(22, 21, 44, 0.54)',
    video: 'obBIjcFwyts',
  },
];

const starterTasks = [
  { id: crypto.randomUUID(), title: 'review today\'s lecture notes', done: false },
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

function App() {
  const roomFromUrl = new URLSearchParams(window.location.search).get('room');
  const [activeView, setActiveView] = useState('space');
  const [isMenuOpen, setIsMenuOpen] = usePersistentState('lockin-menu-open', true);
  const [activeSpace, setActiveSpace] = usePersistentState('lockin-space', 'rainy-library');
  const [spaceQuery, setSpaceQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [user, setUser] = usePersistentState('lockin-user', null);
  const [authMode, setAuthMode] = useState('signin');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [calendarProvider, setCalendarProvider] = usePersistentState('lockin-calendar-provider', 'google');
  const [calendarSynced, setCalendarSynced] = usePersistentState('lockin-calendar-synced', false);
  const [tasks, setTasks] = usePersistentState('lockin-tasks', starterTasks);
  const [settings, setSettings] = usePersistentState('lockin-settings', {
    focus: 25,
    shortBreak: 5,
    longBreak: 15,
    dailyGoal: 120,
    weeklyGoal: 600,
  });
  const [stats, setStats] = usePersistentState('lockin-stats', {
    totalMinutes: 170,
    completedSessions: 6,
    streak: 3,
    days: { [todayKey()]: 50 },
  });
  const [widgetPositions, setWidgetPositions] = usePersistentState('lockin-widget-positions-v2', {
    timer: { x: 30, y: 34 },
    tasks: { x: 66, y: 14 },
    goals: { x: 68, y: 58 },
    progress: { x: 36, y: 70 },
    room: { x: 4, y: 62 },
  });
  const [mode, setMode] = useState('focus');
  const [secondsLeft, setSecondsLeft] = useState(settings.focus * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [roomName, setRoomName] = usePersistentState('lockin-room', roomFromUrl || 'exam-week');
  const [activeVideo, setActiveVideo] = useState(spaces.find((space) => space.id === activeSpace)?.video);
  const [customVideoUrl, setCustomVideoUrl] = useState('');
  const [videoStarted, setVideoStarted] = useState(false);
  const stageRef = useRef(null);
  const completionHandled = useRef(false);

  const space = spaces.find((item) => item.id === activeSpace) || spaces[0];
  const completedTasks = tasks.filter((task) => task.done).length;
  const todayMinutes = stats.days[todayKey()] || 0;
  const progressPercent = Math.min(100, Math.round((todayMinutes / settings.dailyGoal) * 100));
  const categories = ['all', ...new Set(spaces.map((item) => item.category))];
  const visibleSpaces = spaces.filter((item) => {
    const matchesCategory = category === 'all' || item.category === category;
    const text = `${item.name} ${item.category} ${item.mood}`.toLowerCase();
    return matchesCategory && text.includes(spaceQuery.toLowerCase());
  });
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

  useEffect(() => {
    document.title = 'lock in';
  }, []);

  useEffect(() => {
    const nextSpace = spaces.find((item) => item.id === activeSpace) || spaces[0];
    setActiveVideo(nextSpace.video);
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

  useEffect(() => {
    completionHandled.current = false;
  }, [secondsLeft]);

  const selectMode = (nextMode) => {
    const minutes = nextMode === 'focus' ? settings.focus : nextMode === 'shortBreak' ? settings.shortBreak : settings.longBreak;
    setMode(nextMode);
    setSecondsLeft(minutes * 60);
    setIsRunning(false);
  };

  const addTask = (event) => {
    event.preventDefault();
    if (!newTask.trim()) return;
    setTasks((current) => [{ id: crypto.randomUUID(), title: newTask.trim().toLowerCase(), done: false }, ...current]);
    setNewTask('');
  };

  const handleAuth = (event) => {
    event.preventDefault();
    const email = authForm.email.trim().toLowerCase();
    if (!email) return;
    setUser({
      name: authMode === 'signup' ? authForm.name.trim() || email.split('@')[0] : email.split('@')[0],
      email,
      provider: 'email',
    });
  };

  const signInWithGoogle = () => {
    setUser({ name: 'google student', email: 'student@gmail.com', provider: 'google' });
  };

  const moveWidget = (id, next) => {
    setWidgetPositions((current) => ({ ...current, [id]: next }));
  };

  return (
    <main className={isMenuOpen ? 'app' : 'app menu-collapsed'} style={{ '--space-image': `url(${space.image})`, '--space-tint': space.tint }}>
      <Backdrop activeVideo={activeVideo} videoStarted={videoStarted} space={space} />

      <aside className="sidebar" aria-label="lock in menu">
        <div className="brand">
          <button className="brand-mark" onClick={() => setIsMenuOpen((value) => !value)} aria-label="toggle menu">
            {isMenuOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
          {isMenuOpen && (
            <div>
              <strong>lock in</strong>
              <span>study softly, together</span>
            </div>
          )}
        </div>

        <nav className="main-nav">
          <NavButton icon={<Home size={18} />} label="study space" active={activeView === 'space'} open={isMenuOpen} onClick={() => setActiveView('space')} />
          <NavButton icon={<UserCircle size={18} />} label="profile" active={activeView === 'profile'} open={isMenuOpen} onClick={() => setActiveView('profile')} />
          <NavButton icon={<Goal size={18} />} label="goal tracking" active={activeView === 'goals'} open={isMenuOpen} onClick={() => setActiveView('goals')} />
          <NavButton icon={<CalendarDays size={18} />} label="calendar" active={activeView === 'calendar'} open={isMenuOpen} onClick={() => setActiveView('calendar')} />
        </nav>

        {isMenuOpen && (
          <div className="menu-content">
            {activeView === 'space' && (
              <>
                <div className="search-box">
                  <Search size={16} />
                  <input value={spaceQuery} onChange={(event) => setSpaceQuery(event.target.value)} placeholder="search spaces" />
                </div>
                <div className="category-list">
                  {categories.map((item) => (
                    <button key={item} className={item === category ? 'active' : ''} onClick={() => setCategory(item)}>
                      {item}
                    </button>
                  ))}
                </div>
                <div className="space-list">
                  {visibleSpaces.map((item) => (
                    <button
                      className={item.id === activeSpace ? 'space-button active' : 'space-button'}
                      key={item.id}
                      onClick={() => {
                        setActiveSpace(item.id);
                        setVideoStarted(false);
                      }}
                    >
                      <img src={item.image} alt="" />
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item.mood} · {item.category}</small>
                      </span>
                      <ChevronRight size={16} />
                    </button>
                  ))}
                </div>
              </>
            )}

            {activeView === 'profile' && (
              <AuthPanel
                user={user}
                authMode={authMode}
                setAuthMode={setAuthMode}
                authForm={authForm}
                setAuthForm={setAuthForm}
                onSubmit={handleAuth}
                onGoogle={signInWithGoogle}
                onSignOut={() => setUser(null)}
              />
            )}

            {activeView === 'goals' && (
              <GoalPanel settings={settings} setSettings={setSettings} stats={stats} todayMinutes={todayMinutes} weekMinutes={weekMinutes} />
            )}

            {activeView === 'calendar' && (
              <CalendarPanel
                provider={calendarProvider}
                setProvider={setCalendarProvider}
                synced={calendarSynced}
                setSynced={setCalendarSynced}
                calendarUrl={calendarUrl}
              />
            )}
          </div>
        )}
      </aside>

      <section className="stage" ref={stageRef} aria-label="study space">
        <header className="topbar">
          <button className="floating-menu" onClick={() => setIsMenuOpen((value) => !value)} aria-label="toggle menu">
            <Menu size={20} />
          </button>
          <div>
            <span className="eyebrow"><Sparkles size={14} /> {space.mood}</span>
            <h1>{space.name}</h1>
          </div>
          <div className="top-actions">
            <button className="icon-link" onClick={() => setVideoStarted((value) => !value)} title="play ambience">
              {videoStarted ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <a className="icon-link" href={calendarUrl} target="_blank" rel="noreferrer" title="add to calendar">
              <CalendarDays size={18} />
            </a>
            <button className="icon-link" title="copy room URL" onClick={() => navigator.clipboard?.writeText(roomLink)}>
              <LinkIcon size={18} />
            </button>
          </div>
        </header>

        {!videoStarted && (
          <button className="play-scene" onClick={() => setVideoStarted(true)}>
            <Play size={22} /> play ambience
          </button>
        )}

        <DraggableWidget id="timer" title="timer" positions={widgetPositions} onMove={moveWidget} stageRef={stageRef}>
          <TimerWidget mode={mode} selectMode={selectMode} secondsLeft={secondsLeft} settings={settings} isRunning={isRunning} setIsRunning={setIsRunning} />
        </DraggableWidget>

        <DraggableWidget id="tasks" title="tasks" positions={widgetPositions} onMove={moveWidget} stageRef={stageRef}>
          <TasksWidget tasks={tasks} setTasks={setTasks} newTask={newTask} setNewTask={setNewTask} addTask={addTask} completedTasks={completedTasks} />
        </DraggableWidget>

        <DraggableWidget id="goals" title="goals" positions={widgetPositions} onMove={moveWidget} stageRef={stageRef}>
          <MiniGoalWidget settings={settings} setSettings={setSettings} todayMinutes={todayMinutes} progressPercent={progressPercent} />
        </DraggableWidget>

        <DraggableWidget id="progress" title="progress" positions={widgetPositions} onMove={moveWidget} stageRef={stageRef}>
          <ProgressWidget stats={stats} weekMinutes={weekMinutes} tasks={tasks} completedTasks={completedTasks} settings={settings} />
        </DraggableWidget>

        <DraggableWidget id="room" title="room" positions={widgetPositions} onMove={moveWidget} stageRef={stageRef}>
          <RoomWidget roomName={roomName} setRoomName={setRoomName} roomLink={roomLink} user={user} />
        </DraggableWidget>

        <div className="video-dock">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const nextId = extractYouTubeId(customVideoUrl);
              if (nextId) {
                setActiveVideo(nextId);
                setVideoStarted(true);
              }
            }}
          >
            <input value={customVideoUrl} onChange={(event) => setCustomVideoUrl(event.target.value)} placeholder="paste a YouTube ambience link" aria-label="YouTube ambience link" />
            <button>play</button>
          </form>
        </div>
      </section>
    </main>
  );
}

function Backdrop({ activeVideo, videoStarted, space }) {
  if (videoStarted) {
    return (
      <div className="video-background">
        <iframe
          title="peaceful study ambience"
          src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1&mute=0&controls=1&rel=0&playsinline=1&origin=${encodeURIComponent(window.location.origin)}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <div className="video-veil" />
      </div>
    );
  }
  return <div className="background" style={{ '--space-image': `url(${space.image})`, '--space-tint': space.tint }} aria-hidden="true" />;
}

function NavButton({ icon, label, active, open, onClick }) {
  return (
    <button className={active ? 'nav-button active' : 'nav-button'} onClick={onClick} title={label}>
      {icon}
      {open && <span>{label}</span>}
    </button>
  );
}

function AuthPanel({ user, authMode, setAuthMode, authForm, setAuthForm, onSubmit, onGoogle, onSignOut }) {
  if (user) {
    return (
      <section className="side-panel">
        <div className="profile-card">
          <div className="avatar">{user.name.slice(0, 1)}</div>
          <strong>{user.name}</strong>
          <span>{user.email}</span>
          <small>{user.provider === 'google' ? 'signed in with Google' : 'email account'}</small>
        </div>
        <button className="action" onClick={onSignOut}><X size={16} /> sign out</button>
      </section>
    );
  }
  return (
    <section className="side-panel">
      <div className="auth-tabs">
        <button className={authMode === 'signin' ? 'active' : ''} onClick={() => setAuthMode('signin')}>sign in</button>
        <button className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>create account</button>
      </div>
      <button className="google-button" onClick={onGoogle}><Sparkles size={16} /> continue with Google</button>
      <form onSubmit={onSubmit} className="auth-form">
        {authMode === 'signup' && (
          <label><span>name</span><input value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} /></label>
        )}
        <label><span>email</span><Mail size={15} /><input value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} type="email" /></label>
        <label><span>password</span><LockKeyhole size={15} /><input value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} type="password" /></label>
        <button className="action">{authMode === 'signup' ? 'create account' : 'sign in'}</button>
      </form>
    </section>
  );
}

function GoalPanel({ settings, setSettings, stats, todayMinutes, weekMinutes }) {
  return (
    <section className="side-panel">
      <NumberField label="focus minutes" value={settings.focus} onChange={(value) => setSettings({ ...settings, focus: value })} />
      <NumberField label="short break" value={settings.shortBreak} onChange={(value) => setSettings({ ...settings, shortBreak: value })} />
      <NumberField label="daily goal" value={settings.dailyGoal} onChange={(value) => setSettings({ ...settings, dailyGoal: value })} />
      <NumberField label="weekly goal" value={settings.weeklyGoal} onChange={(value) => setSettings({ ...settings, weeklyGoal: value })} />
      <div className="goal-summary">
        <span>{todayMinutes} minutes today</span>
        <span>{weekMinutes} minutes this week</span>
        <span>{stats.completedSessions} completed sessions</span>
      </div>
    </section>
  );
}

function CalendarPanel({ provider, setProvider, synced, setSynced, calendarUrl }) {
  const providers = ['google', 'yahoo', 'outlook', 'ics'];
  return (
    <section className="side-panel">
      <div className="provider-grid">
        {providers.map((item) => (
          <button key={item} className={provider === item ? 'active' : ''} onClick={() => setProvider(item)}>
            <CalendarCheck size={15} /> {item}
          </button>
        ))}
      </div>
      <button className="action" onClick={() => setSynced(true)}><CalendarDays size={16} /> {synced ? 'calendar synced' : 'sync calendar'}</button>
      <a className="action link-action" href={calendarUrl} target="_blank" rel="noreferrer">add next session</a>
      <p className="quiet-note">full two-way sync needs a production OAuth app; this screen is ready for Google, Yahoo, Outlook, and ICS connection flows.</p>
    </section>
  );
}

function DraggableWidget({ id, title, positions, onMove, stageRef, children }) {
  const pointer = useRef(null);
  const position = positions[id] || { x: 20, y: 20 };

  const onPointerDown = (event) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    pointer.current = {
      rect,
      startX: event.clientX,
      startY: event.clientY,
      x: position.x,
      y: position.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!pointer.current) return;
    const { rect, startX, startY, x, y } = pointer.current;
    const nextX = Math.max(0, Math.min(78, x + ((event.clientX - startX) / rect.width) * 100));
    const nextY = Math.max(10, Math.min(78, y + ((event.clientY - startY) / rect.height) * 100));
    onMove(id, { x: Math.round(nextX * 10) / 10, y: Math.round(nextY * 10) / 10 });
  };

  return (
    <section className={`widget ${id}-widget`} style={{ left: `${position.x}%`, top: `${position.y}%` }}>
      <button className="widget-handle" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => { pointer.current = null; }}>
        <Move size={14} /> {title}
      </button>
      {children}
    </section>
  );
}

function TimerWidget({ mode, selectMode, secondsLeft, settings, isRunning, setIsRunning }) {
  const total = (mode === 'focus' ? settings.focus : mode === 'shortBreak' ? settings.shortBreak : settings.longBreak) * 60;
  return (
    <>
      <div className="timer-tabs">
        {[['focus', 'focus'], ['shortBreak', 'break'], ['longBreak', 'long']].map(([value, label]) => (
          <button key={value} className={mode === value ? 'active' : ''} onClick={() => selectMode(value)}>{label}</button>
        ))}
      </div>
      <div className="timer-ring" style={{ '--timer-progress': `${Math.max(4, (secondsLeft / total) * 100)}%` }}>
        <span>{formatTime(secondsLeft)}</span>
      </div>
      <div className="timer-controls">
        <button onClick={() => setIsRunning((value) => !value)} className="primary">{isRunning ? <Pause size={18} /> : <Play size={18} />}{isRunning ? 'pause' : 'start'}</button>
        <button onClick={() => selectMode(mode)}><RotateCcw size={17} /> reset</button>
      </div>
    </>
  );
}

function TasksWidget({ tasks, setTasks, newTask, setNewTask, addTask, completedTasks }) {
  return (
    <>
      <div className="panel-title"><ListTodo size={17} /><h2>tasks</h2><span>{completedTasks}/{tasks.length}</span></div>
      <form onSubmit={addTask} className="task-form">
        <input value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder="add a study task" />
        <button aria-label="add task"><Plus size={18} /></button>
      </form>
      <div className="task-list">
        {tasks.map((task) => (
          <label className={task.done ? 'task done' : 'task'} key={task.id}>
            <input type="checkbox" checked={task.done} onChange={() => setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, done: !item.done } : item)))} />
            <span><Check size={13} /></span>
            <input value={task.title} onChange={(event) => setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, title: event.target.value } : item)))} aria-label="task title" />
            <button aria-label="delete task" onClick={(event) => { event.preventDefault(); setTasks((current) => current.filter((item) => item.id !== task.id)); }}><Trash2 size={15} /></button>
          </label>
        ))}
      </div>
    </>
  );
}

function MiniGoalWidget({ settings, setSettings, todayMinutes, progressPercent }) {
  return (
    <>
      <div className="panel-title"><Goal size={16} /><h2>today</h2><span>{progressPercent}%</span></div>
      <strong className="large-stat">{todayMinutes} / {settings.dailyGoal} min</strong>
      <div className="progress-track"><span style={{ width: `${progressPercent}%` }} /></div>
      <NumberField label="daily goal" value={settings.dailyGoal} onChange={(value) => setSettings({ ...settings, dailyGoal: value })} />
    </>
  );
}

function ProgressWidget({ stats, weekMinutes, tasks, completedTasks, settings }) {
  return (
    <>
      <div className="panel-title"><BarChart3 size={17} /><h2>progress</h2></div>
      <div className="stat-grid">
        <Stat icon={<Timer size={16} />} label="focused" value={`${stats.totalMinutes}m`} />
        <Stat icon={<Flame size={16} />} label="streak" value={`${stats.streak}`} />
        <Stat icon={<Clipboard size={16} />} label="tasks" value={`${Math.round((completedTasks / Math.max(1, tasks.length)) * 100)}%`} />
      </div>
      <div className="week-chart">
        {Array.from({ length: 7 }).map((_, index) => {
          const day = new Date();
          day.setDate(day.getDate() - (6 - index));
          const key = day.toISOString().slice(0, 10);
          const minutes = stats.days[key] || 0;
          return <div key={key}><span style={{ height: `${Math.max(8, Math.min(100, (minutes / settings.dailyGoal) * 100))}%` }} /><small>{day.toLocaleDateString(undefined, { weekday: 'narrow' })}</small></div>;
        })}
      </div>
      <small className="quiet-note">{weekMinutes} minutes this week</small>
    </>
  );
}

function RoomWidget({ roomName, setRoomName, roomLink, user }) {
  return (
    <>
      <div className="panel-title"><Users size={16} /><h2>room</h2><span>{user ? user.name : 'guest'}</span></div>
      <input value={roomName} onChange={(event) => setRoomName(event.target.value.toLowerCase())} aria-label="room name" />
      <button className="action" onClick={() => navigator.clipboard?.writeText(roomLink)}><Copy size={16} /> copy invite</button>
    </>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <label className="number-field">
      <span>{label}</span>
      <input min="1" type="number" value={value} onChange={(event) => onChange(Math.max(1, Number(event.target.value)))} />
    </label>
  );
}

function Stat({ icon, label, value }) {
  return <div className="stat">{icon}<span>{label}</span><strong>{value}</strong></div>;
}

function calendarEventUrl(provider, roomName, roomLink, minutes) {
  const title = `lock in study session: ${roomName || 'solo focus'}`;
  const details = `join the focus room: ${roomLink}`;
  const { start, end } = calendarDateRange(minutes);
  if (provider === 'yahoo') {
    return `https://calendar.yahoo.com/?v=60&title=${encodeURIComponent(title)}&desc=${encodeURIComponent(details)}&st=${start}&dur=${calendarDuration(minutes)}`;
  }
  if (provider === 'outlook') {
    return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(details)}&startdt=${encodeURIComponent(toIso(start))}&enddt=${encodeURIComponent(toIso(end))}`;
  }
  if (provider === 'ics') {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${details}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n');
    return `data:text/calendar;charset=utf8,${encodeURIComponent(ics)}`;
  }
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(details)}&dates=${start}/${end}`;
}

function calendarDateRange(minutes) {
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + minutes * 60 * 1000);
  const format = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  return { start: format(startDate), end: format(endDate) };
}

function toIso(value) {
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(9, 11)}:${value.slice(11, 13)}:00Z`;
}

function calendarDuration(minutes) {
  const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
  const mins = (minutes % 60).toString().padStart(2, '0');
  return `${hours}${mins}`;
}

function extractYouTubeId(value) {
  const trimmed = value.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('youtu.be')) return url.pathname.slice(1, 12);
    if (url.searchParams.get('v')) return url.searchParams.get('v').slice(0, 11);
    return url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/)?.[1] || '';
  } catch {
    return '';
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${secs}`;
}

function Root() {
  const roomFromUrl = new URLSearchParams(window.location.search).get('room');
  const [entered, setEntered] = usePersistentState('lockin-entered', false);

  if (entered || roomFromUrl) {
    return <App />;
  }

  const authenticate = (user) => {
    // Persist synchronously so App picks up the mocked user when it mounts.
    localStorage.setItem('lockin-user', JSON.stringify(user));
    setEntered(true);
  };

  return <HeroLanding onAuthenticate={authenticate} />;
}

createRoot(document.getElementById('root')).render(<Root />);
