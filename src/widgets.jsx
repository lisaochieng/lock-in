/* ===========================================================
   Floating glass widgets — draggable by header, closable.
   Timer · Tasks · Goals · Progress · Room
   Visual design ported from claude.ai/design; data wiring keeps
   the app's persisted timer, stats, tasks and room features.
   =========================================================== */
import React, { useEffect, useRef, useState } from 'react';
import {
  Timer, ListTodo, Target, BarChart3, Users, Play, Pause, RotateCcw,
  Plus, Trash2, Check, GripVertical, X, Flame, Clock,
} from 'lucide-react';

const SERIF = "'Cormorant Garamond', Georgia, serif";

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
function Widget({ theme, title, icon, onClose, init, width = 300, z, onFocusZ, children }) {
  const [pos, setPos] = useState(init || { x: 120, y: 140 });

  const startDrag = (e) => {
    if (onFocusZ) onFocusZ();
    const sx = e.clientX;
    const sy = e.clientY;
    const ox = pos.x;
    const oy = pos.y;
    const move = (ev) => {
      const nx = Math.max(8, Math.min(window.innerWidth - width - 8, ox + ev.clientX - sx));
      const ny = Math.max(8, Math.min(window.innerHeight - 80, oy + ev.clientY - sy));
      setPos({ x: nx, y: ny });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div
      onPointerDown={onFocusZ}
      style={{ position: 'fixed', left: pos.x, top: pos.y, width, zIndex: z || 40, animation: 'widgetIn .34s cubic-bezier(.2,.8,.2,1)', ...panelStyle(theme) }}
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
export function TimerWidget(props) {
  const { theme, mode, selectMode, secondsLeft, settings, setSettings, setSecondsLeft, isRunning, setIsRunning, sessionCount = 0, sessionToast = false } = props;
  const total = (mode === 'focus' ? settings.focus : mode === 'shortBreak' ? settings.shortBreak : settings.longBreak) * 60;
  const prog = total ? 1 - secondsLeft / total : 0;
  const R = 52;
  const C = 2 * Math.PI * R;
  // start | resume (paused mid-round) | pause (running)
  const startLabel = isRunning ? 'pause' : (secondsLeft < total ? 'resume' : 'start');
  const sessionInCycle = (sessionCount % 4) + 1; // 1..4

  const setDuration = (key, value) => {
    const minutes = Math.max(1, Number(value) || 1);
    setSettings({ ...settings, [key]: minutes });
    if (key === mode && !isRunning) setSecondsLeft(minutes * 60);
  };

  const tabs = [['focus', 'focus'], ['shortBreak', 'short break'], ['longBreak', 'long break']];
  const tab = ([key, label]) => (
    <button
      key={key} onClick={() => selectMode(key)} className="segbtn"
      style={{ color: mode === key ? theme.accentInk : theme.chipText, background: mode === key ? theme.accent : theme.chipBg, border: `1px solid ${mode === key ? 'transparent' : theme.chipBorder}` }}
    >{label}</button>
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
      <div style={{ position: 'relative', width: 168, height: 168, margin: '2px auto 14px' }}>
        <svg width={168} height={168} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={84} cy={84} r={R} fill="none" stroke={theme.trackBg} strokeWidth={7} />
          <circle cx={84} cy={84} r={R} fill="none" stroke={theme.accent} strokeWidth={7} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * prog} style={{ transition: 'stroke-dashoffset .9s linear' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 500, fontFamily: SERIF, fontVariantNumeric: 'tabular-nums' }}>{formatTime(secondsLeft)}</div>
      </div>
      <div style={{ textAlign: 'center', fontSize: 11, color: theme.textFaint, marginBottom: 13, letterSpacing: '.03em' }}>
        session {sessionInCycle} of 4 until long break
      </div>
      <div style={{ display: 'flex', gap: 9, marginBottom: 15 }}>
        <button onClick={() => setIsRunning((r) => !r)} className="primarybtn" style={{ flex: 1, background: theme.accent, color: theme.accentInk }}>
          {isRunning ? <Pause size={16} /> : <Play size={16} />}{startLabel}
        </button>
        <button onClick={() => selectMode(mode)} className="ghostbtn" style={{ color: theme.text, background: theme.chipBg, border: `1px solid ${theme.chipBorder}` }}>
          <RotateCcw size={16} /> reset
        </button>
      </div>
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
      <input
        type="number" min="5" value={settings.dailyGoal}
        onChange={(e) => setSettings({ ...settings, dailyGoal: Math.max(5, Number(e.target.value) || 5) })}
        style={{ width: '100%', background: theme.fieldBg, border: `1px solid ${theme.fieldBorder}`, color: theme.text, borderRadius: 10, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit' }}
      />
    </Widget>
  );
}

/* ------- Progress ------- */
export function ProgressWidget(props) {
  const { theme, stats, weekMinutes, tasks, settings } = props;
  const done = tasks.filter((t) => t.done).length;
  const pctTasks = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const stat = (icon, label, value) => (
    <div key={label} style={{ flex: 1, textAlign: 'center', background: theme.chipBg, border: `1px solid ${theme.chipBorder}`, borderRadius: 13, padding: '13px 6px' }}>
      <div style={{ color: theme.textDim, display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{icon}</div>
      <div style={{ fontFamily: SERIF, fontSize: 23, fontWeight: 500 }}>{value}</div>
      <div style={{ fontSize: 10, color: theme.textFaint, marginTop: 2 }}>{label}</div>
    </div>
  );
  return (
    <Widget {...props} title="progress" icon={<BarChart3 size={15} />} width={320}>
      <div style={{ display: 'flex', gap: 9, marginBottom: 16 }}>
        {stat(<Clock size={15} />, 'focused', `${stats.totalMinutes}m`)}
        {stat(<Flame size={15} />, 'streak', stats.streak)}
        {stat(<Check size={15} />, 'tasks', `${pctTasks}%`)}
      </div>
      <div style={{ fontSize: 10.5, color: theme.textFaint, marginBottom: 9, textTransform: 'lowercase', letterSpacing: '.04em' }}>this week</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 56 }}>
        {Array.from({ length: 7 }).map((_, index) => {
          const day = new Date();
          day.setDate(day.getDate() - (6 - index));
          const key = day.toISOString().slice(0, 10);
          const minutes = stats.days[key] || 0;
          const h = Math.max(8, Math.min(100, (minutes / settings.dailyGoal) * 100));
          return <div key={key} style={{ flex: 1, height: `${h}%`, background: index === 6 ? theme.accent : theme.trackBg, borderRadius: 5 }} />;
        })}
      </div>
      <div style={{ fontSize: 11, color: theme.textFaint, marginTop: 10 }}>{weekMinutes} minutes this week</div>
    </Widget>
  );
}

/* ------- Room ------- */
import { RoomPanel } from './panels';

export function RoomWidget(props) {
  const { theme, user, room, onRoomChange, activeTaskTitle } = props;
  return (
    <Widget {...props} title="room" icon={<Users size={15} />} width={300}>
      <RoomPanel
        theme={theme}
        user={user}
        room={room}
        onRoomChange={onRoomChange}
        activeTaskTitle={activeTaskTitle}
      />
    </Widget>
  );
}
