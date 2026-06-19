/* ===========================================================
   Floating glass widgets — draggable by header, closable.
   Timer · Tasks · Goals · Progress · Room
   Visual design ported from claude.ai/design; data wiring keeps
   the app's persisted timer, stats, tasks and room features.
   =========================================================== */
import React, { lazy, Suspense, useState } from 'react';
import {
  Timer, ListTodo, Target, BarChart3, Users, Play, Pause, RotateCcw, Square,
  Plus, Trash2, Check, GripVertical, X, Minus, Volume2, VolumeX,
} from 'lucide-react';

const ProgressPanel = lazy(() => import('./panels').then((m) => ({ default: m.ProgressPanel })));
const RoomPanel = lazy(() => import('./panels').then((m) => ({ default: m.RoomPanel })));

const SERIF = "'Cormorant Garamond', Georgia, serif";

function WidgetPanelSkeleton() {
  return (
    <div
      aria-hidden
      style={{
        borderRadius: 12,
        background: 'rgba(10,14,18,0.55)',
        minHeight: 120,
        width: '100%',
      }}
    />
  );
}

function panelStyle(theme) {
  return {
    background: theme.panelBg,
    border: `1px solid ${theme.panelBorder}`,
    borderRadius: 20,
    backdropFilter: 'blur(22px) saturate(1.2)',
    WebkitBackdropFilter: 'blur(22px) saturate(1.2)',
    boxShadow: '0 24px 60px -28px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.10)',
    color: theme.text,
  };
}

/* draggable shell */
const AMBIENCE_BAR_HEIGHT = 70;

function Widget({ theme, title, icon, onClose, init, pos: posProp, onPosChange, onDragStart, onDragEnd, width = 300, z = 100, children }) {
  const clampPos = (x, y) => {
    const maxY = window.innerHeight - AMBIENCE_BAR_HEIGHT - 50;
    const H = window.innerHeight;
    const W = window.innerWidth;
    return {
      x: Math.min(Math.max(80, x), W - 320),
      y: Math.min(Math.max(100, y), Math.min(H - 300, maxY)),
    };
  };

  const fallback = clampPos((init || { x: 120, y: 140 }).x, (init || { x: 120, y: 140 }).y);
  const [localPos, setLocalPos] = useState(fallback);
  const pos = posProp ?? localPos;

  const commitPos = (p) => {
    const c = clampPos(p.x, p.y);
    if (onPosChange) onPosChange(c);
    else setLocalPos(c);
  };

  const startDrag = (e) => {
    if (onDragStart) onDragStart();
    const sx = e.clientX;
    const sy = e.clientY;
    const ox = pos.x;
    const oy = pos.y;
    const move = (ev) => {
      commitPos({ x: ox + ev.clientX - sx, y: oy + ev.clientY - sy });
    };
    const up = () => {
      if (onDragEnd) onDragEnd();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div
      style={{ position: 'fixed', left: pos.x, top: pos.y, width, zIndex: z, animation: 'widgetIn .34s cubic-bezier(.2,.8,.2,1)', ...panelStyle(theme) }}
    >
      <div
        onPointerDown={startDrag}
        style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '13px 14px 11px', cursor: 'grab', userSelect: 'none' }}
      >
        <span style={{ color: theme.textFaint, display: 'flex' }}><GripVertical size={15} /></span>
        <span style={{ color: theme.textDim, display: 'flex' }}>{icon}</span>
        <span style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, letterSpacing: '.01em', flex: 1 }}>{title}</span>
        <button className="iconbtn" onClick={onClose} title="close" style={{ color: theme.textFaint }}><X size={15} /></button>
      </div>
      <div style={{ padding: '4px 16px 18px' }}>{children}</div>
    </div>
  );
}

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(Math.floor(seconds % 60)).padStart(2, '0');
  return `${m}:${s}`;
}

/* ------- Timer ------- */
const MODE_LABELS = { focus: 'focus', short: 'short break', long: 'long break' };

export function TimerWidget(props) {
  const {
    theme,
    mode,
    pomodoroCount = 0,
    selectMode,
    secondsLeft,
    settings,
    setSettings,
    isRunning,
    onToggleRunning,
    onStop,
    onResetPhase,
    sessionToast = false,
  } = props;

  const total = (mode === 'focus' ? settings.focus : mode === 'short' ? settings.shortBreak : settings.longBreak) * 60;
  const prog = total ? 1 - secondsLeft / total : 0;
  const R = 52;
  const C = 2 * Math.PI * R;
  const startLabel = isRunning ? 'pause' : (secondsLeft < total ? 'resume' : 'start');
  const sessionInCycle = pomodoroCount + 1;

  const setDuration = (key, value) => {
    const minutes = Math.max(1, Number(value) || 1);
    setSettings({ ...settings, [key]: minutes });
    const modeKey = key === 'focus' ? 'focus' : key === 'shortBreak' ? 'short' : 'long';
    if (modeKey === mode && !isRunning && onResetPhase) onResetPhase();
  };

  const tabs = [['focus', 'focus'], ['short', 'short break'], ['long', 'long break']];
  const tab = ([key, label]) => (
    <button
      key={key}
      type="button"
      onClick={() => selectMode(key)}
      className="segbtn"
      style={{
        color: mode === key ? theme.accentInk : theme.chipText,
        background: mode === key ? theme.accent : theme.chipBg,
        border: `1px solid ${mode === key ? 'transparent' : theme.chipBorder}`,
      }}
    >
      {label}
    </button>
  );

  const durKeys = [['focus', 'focus'], ['shortBreak', 'short'], ['longBreak', 'long']];
  const dur = ([key, label]) => (
    <label key={key} style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: theme.textFaint, marginBottom: 5, textTransform: 'lowercase' }}>{label}</div>
      <input
        type="number" min="1" max="180" value={settings[key]} aria-label={`${label} minutes`}
        onChange={(e) => setDuration(key, e.target.value)}
        style={{ width: '100%', textAlign: 'center', background: theme.fieldBg, border: `1px solid ${theme.fieldBorder}`, color: theme.text, borderRadius: 9, padding: '7px 0', fontSize: 13, fontFamily: 'inherit' }}
      />
    </label>
  );

  return (
    <Widget {...props} title="timer" icon={<Timer size={15} />} width={300}>
      {sessionToast && (
        <div
          aria-live="polite"
          style={{ position: 'absolute', top: -42, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', animation: 'widgetIn .26s ease' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 999, fontSize: 12, color: theme.accentInk, background: theme.accent, boxShadow: '0 12px 30px -12px rgba(0,0,0,0.5)' }}>
            <Check size={13} strokeWidth={2.6} /> focus session complete
          </span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>{tabs.map(tab)}</div>
      <div style={{ position: 'relative', width: 168, height: 168, margin: '2px auto 8px' }}>
        <svg width={168} height={168} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={84} cy={84} r={R} fill="none" stroke={theme.trackBg} strokeWidth={7} />
          <circle cx={84} cy={84} r={R} fill="none" stroke={theme.accent} strokeWidth={7} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * prog} style={{ transition: 'stroke-dashoffset .9s linear' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 500, fontFamily: SERIF, fontVariantNumeric: 'tabular-nums' }}>{formatTime(secondsLeft)}</div>
      </div>
      <div style={{ textAlign: 'center', fontSize: 12, color: theme.text, marginBottom: 4, letterSpacing: '.02em', textTransform: 'lowercase' }}>
        {MODE_LABELS[mode] || 'focus'}
      </div>
      <div style={{ textAlign: 'center', fontSize: 11, color: theme.textFaint, marginBottom: 13, letterSpacing: '.03em' }}>
        session {sessionInCycle} of 4
      </div>
      <div style={{ display: 'flex', gap: 9, marginBottom: 10 }}>
        <button type="button" onClick={onToggleRunning} className="primarybtn" style={{ flex: 1, background: theme.accent, color: theme.accentInk }}>
          {isRunning ? <Pause size={16} /> : <Play size={16} />}{startLabel}
        </button>
        <button type="button" onClick={onResetPhase} className="ghostbtn" style={{ color: theme.text, background: theme.chipBg, border: `1px solid ${theme.chipBorder}` }}>
          <RotateCcw size={16} /> reset
        </button>
      </div>
      <button
        type="button"
        onClick={onStop}
        className="ghostbtn"
        style={{ width: '100%', justifyContent: 'center', marginBottom: 15, color: theme.textDim, background: theme.chipBg, border: `1px solid ${theme.chipBorder}` }}
      >
        <Square size={14} /> stop
      </button>
      <div style={{ display: 'flex', gap: 8 }}>{durKeys.map(dur)}</div>
    </Widget>
  );
}

/* ------- Tasks ------- */
export function TasksWidget(props) {
  const { theme, tasks, setTasks } = props;
  const [text, setText] = useState('');
  const add = () => {
    const t = text.trim();
    if (!t) return;
    setTasks([{ id: crypto.randomUUID(), title: t.toLowerCase(), done: false }, ...tasks]);
    setText('');
  };
  const done = tasks.filter((t) => t.done).length;
  return (
    <Widget {...props} title="tasks" icon={<ListTodo size={15} />} width={320}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 12.5, color: theme.textDim }}>study tasks</span>
        <span style={{ fontSize: 11.5, color: theme.textFaint }}>{done}/{tasks.length}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={text} placeholder="add a study task"
          onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()}
          style={{ flex: 1, background: theme.fieldBg, border: `1px solid ${theme.fieldBorder}`, color: theme.text, borderRadius: 10, padding: '9px 12px', fontSize: 13, fontFamily: 'inherit' }}
        />
        <button onClick={add} className="iconbtn sq" style={{ color: theme.accentInk, background: theme.accent }}><Plus size={16} /></button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 188, overflowY: 'auto' }} className="scroll">
        {tasks.length === 0
          ? <div style={{ fontSize: 12, color: theme.textFaint, padding: '10px 2px' }}>nothing yet — add your first task.</div>
          : tasks.map((t) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 4px' }}>
              <button
                onClick={() => setTasks(tasks.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
                style={{ width: 18, height: 18, borderRadius: 6, border: `1.6px solid ${t.done ? theme.accent : theme.fieldBorder}`, background: t.done ? theme.accent : 'transparent', color: theme.accentInk, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
              >{t.done && <Check size={12} strokeWidth={2.6} />}</button>
              <input
                value={t.title}
                onChange={(e) => setTasks(tasks.map((x) => (x.id === t.id ? { ...x, title: e.target.value } : x)))}
                aria-label="task title"
                style={{ flex: 1, fontSize: 13, color: t.done ? theme.textFaint : theme.text, textDecoration: t.done ? 'line-through' : 'none', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit' }}
              />
              <button className="iconbtn" onClick={() => setTasks(tasks.filter((x) => x.id !== t.id))} style={{ color: theme.textFaint }}><Trash2 size={15} /></button>
            </div>
          ))}
      </div>
    </Widget>
  );
}

/* ------- Goals ------- */
export function GoalsWidget(props) {
  const { theme, settings, setSettings, todayMinutes, progressPercent } = props;
  const stepGoal = (delta) => {
    setSettings({ ...settings, dailyGoal: Math.max(5, (settings.dailyGoal || 5) + delta) });
  };
  const stepBtn = (delta) => (
    <button
      type="button"
      onClick={() => stepGoal(delta)}
      className="ghostbtn"
      aria-label={delta < 0 ? 'decrease daily goal' : 'increase daily goal'}
      style={{
        width: 40,
        height: 40,
        flexShrink: 0,
        justifyContent: 'center',
        color: theme.text,
        background: theme.chipBg,
        border: `1px solid ${theme.chipBorder}`,
        borderRadius: 10,
      }}
    >
      {delta < 0 ? <Minus size={16} /> : <Plus size={16} />}
    </button>
  );
  return (
    <Widget {...props} title="goals" icon={<Target size={15} />} width={290}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 12.5, color: theme.textDim }}>today</span>
        <span style={{ fontSize: 12.5, color: theme.accent, fontWeight: 600 }}>{progressPercent}%</span>
      </div>
      <div style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 500, margin: '6px 0 14px' }}>
        {todayMinutes}<span style={{ fontSize: 14, color: theme.textFaint }}> / {settings.dailyGoal} min</span>
      </div>
      <div style={{ height: 8, borderRadius: 6, background: theme.trackBg, overflow: 'hidden' }}>
        <div style={{ width: `${progressPercent}%`, height: '100%', background: theme.accent, borderRadius: 6, transition: 'width .5s ease' }} />
      </div>
      <div style={{ fontSize: 10.5, color: theme.textFaint, margin: '16px 0 6px', textTransform: 'lowercase', letterSpacing: '.04em' }}>daily goal (min)</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
        {stepBtn(-5)}
        <input
          type="number"
          min="5"
          value={settings.dailyGoal}
          onChange={(e) => setSettings({ ...settings, dailyGoal: Math.max(5, Number(e.target.value) || 5) })}
          className="nospin"
          aria-label="daily goal minutes"
          style={{ flex: 1, textAlign: 'center', background: theme.fieldBg, border: `1px solid ${theme.fieldBorder}`, color: theme.text, borderRadius: 10, padding: '10px 8px', fontSize: 14, fontFamily: 'inherit' }}
        />
        {stepBtn(5)}
      </div>
    </Widget>
  );
}

/* ------- Progress ------- */
export function ProgressWidget(props) {
  const { theme, user, settings, tasks, todayMinutes, stats } = props;
  return (
    <Widget {...props} title="progress" icon={<BarChart3 size={15} />} width={320}>
      <Suspense fallback={<WidgetPanelSkeleton />}>
        <ProgressPanel
          theme={theme}
          userId={user?.id}
          settings={settings}
          tasks={tasks}
          todayMinutes={todayMinutes}
          stats={stats}
        />
      </Suspense>
    </Widget>
  );
}

/* ------- Room ------- */
export function RoomWidget(props) {
  const { theme, user, room, onRoomChange, activeTaskTitle, activeSpaceId, onActiveSpaceChange } = props;
  return (
    <Widget {...props} title="room" icon={<Users size={15} />} width={300}>
      <Suspense fallback={<WidgetPanelSkeleton />}>
        <RoomPanel
          theme={theme}
          user={user}
          room={room}
          onRoomChange={onRoomChange}
          activeTaskTitle={activeTaskTitle}
          activeSpaceId={activeSpaceId}
          onActiveSpaceChange={onActiveSpaceChange}
        />
      </Suspense>
    </Widget>
  );
}

/* ------- Sound / volume ------- */
export function VolumeWidget(props) {
  const { theme, volume, onVolumeChange, muted, onToggleMute } = props;
  return (
    <Widget {...props} title="sound" icon={<Volume2 size={15} />} width={260}>
      <div style={{ '--accent': theme.accent }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 12.5, color: theme.textDim }}>volume</span>
          <span style={{ fontSize: 14, color: theme.text, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{volume}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          aria-label="ambience volume"
          className="volumeslider"
          onChange={(e) => onVolumeChange(Number(e.target.value))}
        />
        <button
          type="button"
          onClick={onToggleMute}
          className="ghostbtn"
          aria-label={muted ? 'unmute' : 'mute'}
          style={{
            width: '100%',
            justifyContent: 'center',
            marginTop: 14,
            color: theme.text,
            background: theme.chipBg,
            border: `1px solid ${theme.chipBorder}`,
          }}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          {muted ? 'unmute' : 'mute'}
        </button>
      </div>
    </Widget>
  );
}
