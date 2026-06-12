import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BarChart3,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Copy,
  Flame,
  Goal,
  Home,
  LayoutGrid,
  Link as LinkIcon,
  ListTodo,
  LockKeyhole,
  Mail,
  Menu,
  MoreHorizontal,
  Move,
  PanelLeftClose,
  PanelLeftOpen,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Target,
  Timer,
  Trash2,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import './styles.css';
import HeroLanding from './HeroLanding';

const thumb = (id) => `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;

const spaces = [
  // rain — cool slate greys
  { id: 'rainy-library', name: 'rainy village', category: 'rain', mood: 'deep reading', video: '6ntUefWpN40', tint: 'rgba(26, 36, 44, 0.5)', accent: '#9fb6c4', accent2: '#c3d2da' },
  { id: 'rain-on-window', name: 'rain on window', category: 'rain', mood: 'slow notes', video: 'JzlYA5iYkEE', tint: 'rgba(24, 34, 42, 0.52)', accent: '#9fb6c4', accent2: '#c3d2da' },
  { id: 'quiet-rainstorm', name: 'quiet study rain', category: 'rain', mood: 'quiet focus', video: 'LmFXjuuIDOE', tint: 'rgba(22, 30, 38, 0.54)', accent: '#9fb6c4', accent2: '#c3d2da' },

  // forest — earthy greens
  { id: 'forest-cabin', name: 'woodland birdsong', category: 'forest', mood: 'calm recall', video: 'XxP8kxUn5bc', tint: 'rgba(20, 46, 32, 0.48)', accent: '#8fc99f', accent2: '#6fae8e' },
  { id: 'forest-stream', name: 'forest stream', category: 'forest', mood: 'gentle review', video: 'JsyMl9uz4rQ', tint: 'rgba(22, 50, 34, 0.46)', accent: '#8fc99f', accent2: '#6fae8e' },
  { id: 'ancient-woods', name: 'ancient woods', category: 'forest', mood: 'light tasks', video: 'Qm846KdZN_c', tint: 'rgba(18, 44, 30, 0.5)', accent: '#8fc99f', accent2: '#6fae8e' },

  // beach — soft teals
  { id: 'ocean-window', name: 'ocean shore', category: 'beach', mood: 'slow planning', video: 'dxNg3q1n2HI', tint: 'rgba(16, 52, 56, 0.44)', accent: '#5fd0c2', accent2: '#8fe0d0' },
  { id: 'rolling-waves', name: 'rolling waves', category: 'beach', mood: 'easy reading', video: 'Q9a86gbpbjU', tint: 'rgba(18, 54, 58, 0.42)', accent: '#5fd0c2', accent2: '#8fe0d0' },
  { id: 'greek-cove', name: 'greek cove', category: 'beach', mood: 'bright focus', video: '_iPgznUNWbU', tint: 'rgba(14, 50, 54, 0.46)', accent: '#5fd0c2', accent2: '#8fe0d0' },

  // cafe — warm amber / brown
  { id: 'cozy-cafe', name: 'cozy cafe', category: 'cafe', mood: 'essay flow', video: 'MYPVQccHhAQ', tint: 'rgba(48, 32, 20, 0.46)', accent: '#d8a86a', accent2: '#e7c79a' },
  { id: 'winter-cafe', name: 'winter cafe', category: 'cafe', mood: 'warm grind', video: 'jh4C7w-dvho', tint: 'rgba(50, 34, 22, 0.48)', accent: '#d8a86a', accent2: '#e7c79a' },
  { id: 'new-york-cafe', name: 'new york cafe', category: 'cafe', mood: 'light writing', video: 'PRAGLqfNK1o', tint: 'rgba(46, 30, 20, 0.46)', accent: '#d8a86a', accent2: '#e7c79a' },

  // library — parchment gold
  { id: 'sunlit-archive', name: 'study library', category: 'library', mood: 'research mode', video: 'eXGwSlxeG0k', tint: 'rgba(44, 34, 22, 0.46)', accent: '#d9bd85', accent2: '#c6a578' },
  { id: 'gothic-manor', name: 'gothic manor', category: 'library', mood: 'deep study', video: '6orVoBwfGSA', tint: 'rgba(42, 32, 20, 0.48)', accent: '#d9bd85', accent2: '#c6a578' },
  { id: 'rainy-library-jazz', name: 'rainy library', category: 'library', mood: 'exam prep', video: 'FbrJJxntUws', tint: 'rgba(40, 30, 20, 0.5)', accent: '#d9bd85', accent2: '#c6a578' },

  // fireplace — warm ambers
  { id: 'fireside-cabin', name: 'fireside cabin', category: 'fireplace', mood: 'cozy recall', video: 'IJf4QMPEbOI', tint: 'rgba(46, 24, 16, 0.48)', accent: '#f0a060', accent2: '#e87a55' },
  { id: 'crackling-hearth', name: 'crackling hearth', category: 'fireplace', mood: 'warm reading', video: 'cuPPcx9KRVw', tint: 'rgba(44, 22, 16, 0.5)', accent: '#f0a060', accent2: '#e87a55' },
  { id: 'ember-glow', name: 'ember glow', category: 'fireplace', mood: 'slow focus', video: 'GDEWcq1us48', tint: 'rgba(42, 22, 14, 0.5)', accent: '#f0a060', accent2: '#e87a55' },

  // night city — deep purples
  { id: 'night-focus', name: 'neon city rain', category: 'night city', mood: 'quiet grind', video: 'DKOFLh6fNas', tint: 'rgba(22, 20, 40, 0.54)', accent: '#b48fe6', accent2: '#8f9ce8' },
  { id: 'neon-walk', name: 'neon walk', category: 'night city', mood: 'midnight flow', video: 'AJOepyLmMBU', tint: 'rgba(20, 18, 38, 0.56)', accent: '#b48fe6', accent2: '#8f9ce8' },
  { id: 'city-drive', name: 'city drive', category: 'night city', mood: 'late session', video: '0GZUoICMpuU', tint: 'rgba(24, 20, 42, 0.54)', accent: '#b48fe6', accent2: '#8f9ce8' },

  // snow — icy blues
  { id: 'snowy-evening', name: 'snowy forest', category: 'snow', mood: 'exam prep', video: 'JFajK-Nn49w', tint: 'rgba(30, 40, 50, 0.46)', accent: '#bcd6e8', accent2: '#dcecf4' },
  { id: 'snow-lake', name: 'snow on the lake', category: 'snow', mood: 'calm recall', video: 'jh_KFTYJnDo', tint: 'rgba(28, 38, 48, 0.48)', accent: '#bcd6e8', accent2: '#dcecf4' },
  { id: 'forest-blizzard', name: 'forest blizzard', category: 'snow', mood: 'slow notes', video: 'MEnbuMfbM9c', tint: 'rgba(30, 40, 52, 0.46)', accent: '#bcd6e8', accent2: '#dcecf4' },

  // japanese garden — sakura pink / green
  { id: 'zen-garden', name: 'zen garden', category: 'japanese garden', mood: 'mindful study', video: 'nKjeWnUn7sc', tint: 'rgba(40, 28, 36, 0.44)', accent: '#e8a8c2', accent2: '#9bc99e' },
  { id: 'bamboo-fountain', name: 'bamboo fountain', category: 'japanese garden', mood: 'gentle review', video: '4WQ1lsikdQE', tint: 'rgba(42, 30, 38, 0.44)', accent: '#e8a8c2', accent2: '#9bc99e' },
  { id: 'koi-garden', name: 'koi garden', category: 'japanese garden', mood: 'calm recall', video: 'aJaZc4E8Y4U', tint: 'rgba(38, 28, 36, 0.46)', accent: '#e8a8c2', accent2: '#9bc99e' },

  // underwater — aqua / blue
  { id: 'coral-reef', name: 'coral reef', category: 'underwater', mood: 'slow planning', video: 'eHxbMa2RVTQ', tint: 'rgba(12, 40, 56, 0.52)', accent: '#5fc6d8', accent2: '#6fa8e0' },
  { id: 'reef-aquarium', name: 'reef aquarium', category: 'underwater', mood: 'easy reading', video: 'NE2-H5Br-C8', tint: 'rgba(12, 42, 58, 0.5)', accent: '#5fc6d8', accent2: '#6fa8e0' },
  { id: 'deep-reef', name: 'deep reef', category: 'underwater', mood: 'calm focus', video: 'hZ8YuF82QAQ', tint: 'rgba(10, 38, 54, 0.52)', accent: '#5fc6d8', accent2: '#6fa8e0' },

  // rooftop — dusky rose / sunset
  { id: 'rooftop-sunset', name: 'rooftop sunset', category: 'rooftop', mood: 'soft focus', video: 'YuYSDNcwVgg', tint: 'rgba(44, 28, 38, 0.48)', accent: '#e0a0b8', accent2: '#e6b07a' },
  { id: 'open-window-night', name: 'open window night', category: 'rooftop', mood: 'late session', video: 'Vg1mpD1BICI', tint: 'rgba(40, 26, 40, 0.5)', accent: '#e0a0b8', accent2: '#e6b07a' },

  // thunderstorm — stormy blue-grey
  { id: 'rolling-thunder', name: 'rolling thunder', category: 'thunderstorm', mood: 'deep focus', video: 'aLcTO3tnnKo', tint: 'rgba(20, 24, 34, 0.56)', accent: '#8f9cc4', accent2: '#b0b8d0' },
  { id: 'night-storm', name: 'night storm', category: 'thunderstorm', mood: 'quiet grind', video: 'o2VbPkxrBa4', tint: 'rgba(18, 22, 32, 0.58)', accent: '#8f9cc4', accent2: '#b0b8d0' },
  { id: 'cabin-storm', name: 'cabin storm', category: 'thunderstorm', mood: 'cozy recall', video: 'rturNpd-D6s', tint: 'rgba(22, 24, 32, 0.54)', accent: '#8f9cc4', accent2: '#b0b8d0' },

  // waterfall — fresh teal-green
  { id: 'forest-waterfall', name: 'forest waterfall', category: 'waterfall', mood: 'fresh focus', video: 'wGXRyO0zhqE', tint: 'rgba(16, 44, 40, 0.48)', accent: '#6fd0b0', accent2: '#9fd8c0' },
  { id: 'cascading-falls', name: 'cascading falls', category: 'waterfall', mood: 'easy flow', video: 'eG3RL02umkk', tint: 'rgba(14, 42, 38, 0.5)', accent: '#6fd0b0', accent2: '#9fd8c0' },
].map((space) => ({ ...space, image: thumb(space.video) }));

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
  const [widgetsOpen, setWidgetsOpen] = usePersistentState('lockin-widgets-open', {
    timer: true,
    tasks: true,
    goals: true,
    progress: true,
    room: true,
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

  const widgetIds = ['timer', 'tasks', 'goals', 'progress', 'room'];
  const allWidgetsOpen = widgetIds.every((id) => widgetsOpen[id]);

  const openView = (view) => {
    if (isMenuOpen && activeView === view) {
      setIsMenuOpen(false);
    } else {
      setActiveView(view);
      setIsMenuOpen(true);
    }
  };

  const toggleWidget = (id) => {
    setWidgetsOpen((current) => ({ ...current, [id]: !current[id] }));
  };

  const toggleAllWidgets = () => {
    const next = !allWidgetsOpen;
    setWidgetsOpen(Object.fromEntries(widgetIds.map((id) => [id, next])));
  };

  const viewTitles = { space: 'spaces', profile: 'profile', calendar: 'calendar' };

  return (
    <main className={isMenuOpen ? 'app panel-open' : 'app'} style={{ '--space-image': `url(${space.image})`, '--space-tint': space.tint, '--accent': space.accent, '--accent-2': space.accent2 }}>
      <Backdrop activeVideo={activeVideo} videoStarted={videoStarted} space={space} />

      <aside className="rail" aria-label="lock in navigation">
        <div className="rail-logo" title="lock in" aria-label="lock in">
          <LockKeyhole size={20} />
        </div>

        <nav className="rail-section rail-top" aria-label="pages">
          <RailButton icon={<LayoutGrid size={19} />} label="spaces" active={isMenuOpen && activeView === 'space'} onClick={() => openView('space')} />
          <RailButton icon={<UserCircle size={19} />} label="profile" active={isMenuOpen && activeView === 'profile'} onClick={() => openView('profile')} />
          <RailButton icon={<CalendarDays size={19} />} label="calendar" active={isMenuOpen && activeView === 'calendar'} onClick={() => openView('calendar')} />
        </nav>

        <div className="rail-spacer" />
        <div className="rail-divider" aria-hidden="true" />

        <nav className="rail-section rail-bottom" aria-label="widgets">
          <RailButton icon={<Timer size={19} />} label="timer" active={widgetsOpen.timer} onClick={() => toggleWidget('timer')} />
          <RailButton icon={<ListTodo size={19} />} label="tasks" active={widgetsOpen.tasks} onClick={() => toggleWidget('tasks')} />
          <RailButton icon={<Target size={19} />} label="goals" active={widgetsOpen.goals} onClick={() => toggleWidget('goals')} />
          <RailButton icon={<BarChart3 size={19} />} label="progress" active={widgetsOpen.progress} onClick={() => toggleWidget('progress')} />
          <RailButton icon={<Users size={19} />} label="room" active={widgetsOpen.room} onClick={() => toggleWidget('room')} />
          <RailButton icon={<MoreHorizontal size={19} />} label={allWidgetsOpen ? 'hide all widgets' : 'show all widgets'} active={allWidgetsOpen} onClick={toggleAllWidgets} />
        </nav>
      </aside>

      <div className={isMenuOpen ? 'side-flyout open' : 'side-flyout'} aria-hidden={!isMenuOpen}>
        <div className="flyout-head">
          <strong>{viewTitles[activeView]}</strong>
          <button className="flyout-collapse" onClick={() => setIsMenuOpen(false)} aria-label="collapse panel">
            <ChevronLeft size={18} />
          </button>
        </div>
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
      </div>

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

        {widgetsOpen.timer && (
          <DraggableWidget id="timer" title="timer" positions={widgetPositions} onMove={moveWidget} stageRef={stageRef}>
            <TimerWidget mode={mode} selectMode={selectMode} secondsLeft={secondsLeft} settings={settings} setSettings={setSettings} setSecondsLeft={setSecondsLeft} isRunning={isRunning} setIsRunning={setIsRunning} />
          </DraggableWidget>
        )}

        {widgetsOpen.tasks && (
          <DraggableWidget id="tasks" title="tasks" positions={widgetPositions} onMove={moveWidget} stageRef={stageRef}>
            <TasksWidget tasks={tasks} setTasks={setTasks} newTask={newTask} setNewTask={setNewTask} addTask={addTask} completedTasks={completedTasks} />
          </DraggableWidget>
        )}

        {widgetsOpen.goals && (
          <DraggableWidget id="goals" title="goals" positions={widgetPositions} onMove={moveWidget} stageRef={stageRef}>
            <MiniGoalWidget settings={settings} setSettings={setSettings} todayMinutes={todayMinutes} progressPercent={progressPercent} />
          </DraggableWidget>
        )}

        {widgetsOpen.progress && (
          <DraggableWidget id="progress" title="progress" positions={widgetPositions} onMove={moveWidget} stageRef={stageRef}>
            <ProgressWidget stats={stats} weekMinutes={weekMinutes} tasks={tasks} completedTasks={completedTasks} settings={settings} />
          </DraggableWidget>
        )}

        {widgetsOpen.room && (
          <DraggableWidget id="room" title="room" positions={widgetPositions} onMove={moveWidget} stageRef={stageRef}>
            <RoomWidget roomName={roomName} setRoomName={setRoomName} roomLink={roomLink} user={user} />
          </DraggableWidget>
        )}

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
    <button className={active ? 'nav-button active' : 'nav-button'} onClick={onClick} aria-label={label}>
      <span className="nav-icon">{icon}</span>
      <span className="nav-label" aria-hidden={!open}>{label}</span>
      <span className="nav-tooltip" role="tooltip">{label}</span>
    </button>
  );
}

function RailButton({ icon, label, active, onClick }) {
  return (
    <button className={active ? 'rail-button active' : 'rail-button'} onClick={onClick} aria-pressed={active}>
      <span className="rail-icon">{icon}</span>
      <span className="rail-label">{label}</span>
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

function TimerWidget({ mode, selectMode, secondsLeft, settings, setSettings, setSecondsLeft, isRunning, setIsRunning }) {
  const total = (mode === 'focus' ? settings.focus : mode === 'shortBreak' ? settings.shortBreak : settings.longBreak) * 60;
  const setDuration = (key, value) => {
    const minutes = Math.max(1, Number(value) || 1);
    setSettings({ ...settings, [key]: minutes });
    if (key === mode && !isRunning) {
      setSecondsLeft(minutes * 60);
    }
  };
  return (
    <>
      <div className="timer-tabs">
        {[['focus', 'focus'], ['shortBreak', 'short break'], ['longBreak', 'long break']].map(([value, label]) => (
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
      <div className="timer-durations">
        <label><span>focus</span><input type="number" min="1" value={settings.focus} onChange={(event) => setDuration('focus', event.target.value)} aria-label="focus minutes" /></label>
        <label><span>short break</span><input type="number" min="1" value={settings.shortBreak} onChange={(event) => setDuration('shortBreak', event.target.value)} aria-label="short break minutes" /></label>
        <label><span>long break</span><input type="number" min="1" value={settings.longBreak} onChange={(event) => setDuration('longBreak', event.target.value)} aria-label="long break minutes" /></label>
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
