/* ===========================================================
   Flyout panel bodies: Spaces · Profile (auth) · Calendar
   Glass styling from claude.ai/design; keeps the app's auth and
   calendar deep-link features.
   =========================================================== */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, ChevronRight, ChevronLeft, Sparkles, X, Check, Heart, Clock,
} from 'lucide-react';
import { fetchSessionsByMonth, fetchCompletedTasksByMonth } from './lib/sessions';

const SERIF = "'Cormorant Garamond', Georgia, serif";

export function SpacesPanel({ theme, spaces, activeId, onSelect, query, setQuery, cat, setCat, categories, favorites = [], onToggleFavorite }) {
  const [favOnly, setFavOnly] = useState(false);

  const q = query.trim().toLowerCase();
  const list = useMemo(() => spaces.filter((s) => {
    if (favOnly && !favorites.includes(s.id)) return false;
    if (cat !== 'all' && s.category !== cat) return false;
    const text = `${s.name} ${s.tags || ''} ${s.mood} ${s.category}`.toLowerCase();
    return text.includes(q);
  }), [spaces, favOnly, favorites, cat, q]);

  const tabBtn = (isFav, label, icon) => {
    const on = favOnly === isFav;
    return (
      <button
        onClick={() => setFavOnly(isFav)}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '8px 0', borderRadius: 11, fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
          color: on ? theme.accentInk : theme.chipText,
          background: on ? theme.accent : theme.chipBg,
          border: `1px solid ${on ? 'transparent' : theme.chipBorder}`,
        }}
      >{icon}{label}</button>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* all / favorites filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {tabBtn(false, 'all spaces')}
        {tabBtn(true, 'favorites', <Heart size={14} fill={favOnly ? theme.accentInk : 'none'} />)}
      </div>

      {/* search */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: theme.textFaint, display: 'flex' }}><Search size={15} /></span>
        <input
          value={query} placeholder="search spaces" onChange={(e) => setQuery(e.target.value)}
          style={{ width: '100%', background: theme.fieldBg, border: `1px solid ${theme.fieldBorder}`, color: theme.text, borderRadius: 12, padding: '10px 12px 10px 34px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
        />
      </div>

      {/* category chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
        {categories.map((c) => (
          <button
            key={c} onClick={() => setCat(c)} className="chip"
            style={{ color: cat === c ? theme.accentInk : theme.chipText, background: cat === c ? theme.accent : theme.chipBg, border: `1px solid ${cat === c ? 'transparent' : theme.chipBorder}` }}
          >{c}</button>
        ))}
      </div>

      {/* tiles */}
      <div className="scroll" style={{ flex: 1, overflowY: 'auto', margin: '0 -4px', padding: '0 4px 4px' }}>
        {list.length === 0 ? (
          <div style={{ fontSize: 12.5, color: theme.textFaint, padding: '10px 2px' }}>
            {favOnly ? 'no favorite spaces yet — tap a heart to add one.' : 'no spaces match that.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {list.map((s) => {
              const active = s.id === activeId;
              const fav = favorites.includes(s.id);
              return (
                <button
                  key={s.id} onClick={() => onSelect(s)} className="spacetile"
                  style={{
                    position: 'relative', display: 'flex', flexDirection: 'column', textAlign: 'left',
                    cursor: 'pointer', borderRadius: 14, overflow: 'hidden', background: theme.chipBg,
                    border: `1.5px solid ${active ? theme.accent : theme.chipBorder}`,
                  }}
                >
                  <span style={{ position: 'relative', width: '100%', paddingTop: '58%', background: `linear-gradient(160deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.34)), url(${s.image}) center/cover` }}>
                    <span
                      role="button" tabIndex={0} aria-label={fav ? 'remove from favorites' : 'add to favorites'} aria-pressed={fav}
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(s.id); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onToggleFavorite?.(s.id); } }}
                      style={{ position: 'absolute', top: 7, right: 7, width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,14,18,0.42)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', color: fav ? theme.accent : '#fff', cursor: 'pointer' }}
                    >
                      <Heart size={14} fill={fav ? theme.accent : 'none'} />
                    </span>
                    {active && (
                      <span style={{ position: 'absolute', left: 7, bottom: 7, fontSize: 9, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', padding: '3px 7px', borderRadius: 6, background: theme.accent, color: theme.accentInk }}>active</span>
                    )}
                  </span>
                  <span style={{ padding: '8px 9px 10px' }}>
                    <span style={{ display: 'block', fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.15 }}>{s.name}</span>
                    <span style={{ display: 'block', fontSize: 10.5, color: theme.textFaint, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.tags}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function ProfilePanel({ theme, user, onSignOut, onShowHero }) {
  if (user) {
    const sessionRows = [['focus today', '1h 50m'], ['current streak', '3 days'], ['member since', 'jan 2026']];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: theme.chipBg, border: `1px solid ${theme.chipBorder}`, borderRadius: 18, padding: 22 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: `linear-gradient(150deg, ${theme.accent}, rgba(255,255,255,0.25))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 600, color: theme.accentInk, marginBottom: 16 }}>{user.name[0].toUpperCase()}</div>
          <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, color: theme.text }}>{user.name}</div>
          <div style={{ fontSize: 13, color: theme.textDim, marginTop: 6 }}>{user.email}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 12, color: theme.textFaint }}>
            <Sparkles size={15} /> {user.provider === 'google' ? 'signed in with Google' : 'email account'}
          </div>
        </div>
        <div style={{ background: theme.chipBg, border: `1px solid ${theme.chipBorder}`, borderRadius: 18, padding: 16 }}>
          <div style={{ fontSize: 11, color: theme.textFaint, marginBottom: 12, textTransform: 'lowercase', letterSpacing: '.04em' }}>this session</div>
          {sessionRows.map(([k, v], i) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: i ? `1px solid ${theme.chipBorder}` : 'none' }}>
              <span style={{ fontSize: 13, color: theme.textDim }}>{k}</span>
              <span style={{ fontSize: 13, color: theme.text, fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
        <button onClick={onSignOut} className="ghostbtn" style={{ width: '100%', justifyContent: 'center', color: theme.text, background: theme.chipBg, border: `1px solid ${theme.chipBorder}` }}><X size={15} /> sign out</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: theme.chipBg, border: `1px solid ${theme.chipBorder}`, borderRadius: 18, padding: 22 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: theme.chipBg, border: `1px solid ${theme.chipBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.accent, marginBottom: 16 }}>
          <Sparkles size={22} />
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 23, fontWeight: 600, color: theme.text }}>sign in to sync your data</div>
        <div style={{ fontSize: 13, color: theme.textDim, lineHeight: 1.5, marginTop: 8 }}>
          save your tasks, goals, streaks and favourite spaces, and pick up on any device.
        </div>
      </div>
      <button onClick={onShowHero} className="bigbtn" style={{ width: '100%', justifyContent: 'center', background: theme.accent, color: theme.accentInk, border: 'none' }}>
        sign in or create account
      </button>
    </div>
  );
}

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];
const WEEKDAYS = ['s', 'm', 't', 'w', 't', 'f', 's'];

const sessionMinutes = (rows, type) =>
  (rows || []).reduce((sum, r) => (
    (!type || r.session_type === type) ? sum + (r.duration_minutes || 0) : sum
  ), 0);

/** Focus-minute → fill level (0 none · 1 light · 2 medium · 3 full). */
function dotLevel(minutes) {
  if (minutes <= 0) return 0;
  if (minutes < 60) return 1;
  if (minutes < 120) return 2;
  return 3;
}

const fmtClock = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();

const sessionLabel = { focus: 'focus', shortBreak: 'short break', longBreak: 'long break' };

export function CalendarPanel({ theme, userId }) {
  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [sessionsByDay, setSessionsByDay] = useState({});
  const [tasksByDay, setTasksByDay] = useState({});
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch on mount and whenever the user or the visible month changes.
  useEffect(() => {
    setSelected(null);
    if (!userId) { setSessionsByDay({}); setTasksByDay({}); return undefined; }
    let active = true;
    setLoading(true);
    Promise.all([
      fetchSessionsByMonth(userId, view.year, view.month + 1),
      fetchCompletedTasksByMonth(userId, view.year, view.month + 1),
    ])
      .then(([s, t]) => {
        if (!active) return;
        setSessionsByDay(s || {});
        setTasksByDay(t || {});
        setLoading(false);
      })
      .catch(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId, view.year, view.month]);

  const isTodayMonth = now.getFullYear() === view.year && now.getMonth() === view.month;
  const todayNum = now.getDate();
  const firstDow = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

  const cells = useMemo(() => {
    const out = [];
    for (let i = 0; i < firstDow; i += 1) out.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) out.push(d);
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [firstDow, daysInMonth]);

  const goMonth = (delta) => {
    setView((v) => {
      const m = v.month + delta;
      return { year: v.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });
  };

  const selDate = selected ? new Date(view.year, view.month, selected) : null;
  const selSessions = (selected && sessionsByDay[selected]) || [];
  const selTasks = (selected && tasksByDay[selected]) || [];
  const selFocus = sessionMinutes(selSessions, 'focus');

  const arrow = (dir, onClick) => (
    <button
      onClick={onClick} className="iconbtn" aria-label={dir < 0 ? 'previous month' : 'next month'}
      style={{ color: theme.textDim, width: 30, height: 30, borderRadius: 9, background: theme.chipBg, border: `1px solid ${theme.chipBorder}` }}
    >
      {dir < 0 ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0, overflowY: 'auto' }} className="scroll">
      {/* month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {arrow(-1, () => goMonth(-1))}
        <span style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 600, letterSpacing: '.01em', opacity: loading ? 0.6 : 1 }}>
          {MONTH_NAMES[view.month]} {view.year}
        </span>
        {arrow(1, () => goMonth(1))}
      </div>

      {/* weekday header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {WEEKDAYS.map((w, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 10, color: theme.textFaint, textTransform: 'uppercase', letterSpacing: '.06em' }}>{w}</div>
        ))}
      </div>

      {/* day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`b${i}`} />;
          const focus = sessionMinutes(sessionsByDay[day], 'focus');
          const level = dotLevel(focus);
          const isToday = isTodayMonth && day === todayNum;
          const isSel = day === selected;
          const full = level === 3;
          return (
            <button
              key={day}
              onClick={() => setSelected((s) => (s === day ? null : day))}
              title={focus > 0 ? `${focus} min focused` : undefined}
              style={{
                position: 'relative', aspectRatio: '1 / 1', borderRadius: 9, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontVariantNumeric: 'tabular-nums',
                color: full ? theme.accentInk : theme.text,
                background: full ? theme.accent : (isSel ? theme.chipBg : 'transparent'),
                border: isToday
                  ? `1.5px solid ${theme.accent}`
                  : `1px solid ${isSel ? theme.panelBorder : 'transparent'}`,
                transition: 'background .15s ease',
              }}
            >
              {day}
              {level > 0 && level < 3 && (
                <span style={{
                  position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
                  width: level === 2 ? 6 : 5, height: level === 2 ? 6 : 5, borderRadius: '50%',
                  background: theme.accent, opacity: level === 2 ? 1 : 0.5,
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 10, color: theme.textFaint }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: theme.accent, opacity: 0.5 }} /> &lt;1h</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.accent }} /> 1–2h</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: theme.accent }} /> 2h+</span>
      </div>

      {/* day popover */}
      {selected && (
        <div style={{ background: theme.chipBg, border: `1px solid ${theme.chipBorder}`, borderRadius: 16, padding: 16, animation: 'flyIn .2s ease' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: theme.text, fontWeight: 500 }}>
              {selDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }).toLowerCase()}
            </span>
            <span style={{ fontSize: 12.5, color: theme.accent, fontWeight: 600 }}>{selFocus} min focused</span>
          </div>

          <div style={{ fontSize: 10.5, color: theme.textFaint, marginBottom: 8, textTransform: 'lowercase', letterSpacing: '.04em' }}>sessions</div>
          {selSessions.length === 0 ? (
            <div style={{ fontSize: 12, color: theme.textFaint, marginBottom: 6 }}>no sessions this day.</div>
          ) : (
            selSessions.map((s, i) => (
              <div key={s.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: i ? `1px solid ${theme.chipBorder}` : 'none' }}>
                <span style={{ color: theme.textFaint, display: 'flex' }}><Clock size={13} /></span>
                <span style={{ flex: 1, fontSize: 12.5, color: theme.text }}>{fmtClock(s.created_at)}</span>
                <span style={{ fontSize: 11.5, color: theme.textDim }}>{sessionLabel[s.session_type] || s.session_type} · {s.duration_minutes}m</span>
              </div>
            ))
          )}

          <div style={{ fontSize: 10.5, color: theme.textFaint, margin: '14px 0 8px', textTransform: 'lowercase', letterSpacing: '.04em' }}>
            tasks completed{selTasks.length ? ` · ${selTasks.length}` : ''}
          </div>
          {selTasks.length === 0 ? (
            <div style={{ fontSize: 12, color: theme.textFaint }}>no tasks completed.</div>
          ) : (
            selTasks.map((t, i) => (
              <div key={t.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                <span style={{ width: 16, height: 16, borderRadius: 5, background: theme.accent, color: theme.accentInk, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={11} strokeWidth={2.6} /></span>
                <span style={{ flex: 1, fontSize: 12.5, color: theme.textDim }}>{t.title}</span>
              </div>
            ))
          )}
        </div>
      )}

      {!userId && (
        <div style={{ fontSize: 11, color: theme.textFaint, lineHeight: 1.5 }}>
          sign in to see your focus history on the calendar.
        </div>
      )}
    </div>
  );
}
