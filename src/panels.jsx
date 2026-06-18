/* ===========================================================
   Flyout panel bodies: Spaces · Profile (auth) · Calendar
   Glass styling from claude.ai/design; keeps the app's auth and
   calendar deep-link features.
   =========================================================== */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, ChevronRight, ChevronLeft, Sparkles, X, Check, Heart, Clock,
  Copy, LogOut, Users, Flame, BarChart3, Loader2,
} from 'lucide-react';
import { fetchSessionsByMonth, fetchCompletedTasksByMonth, fetchAllTimeStats, fetchSessionStats } from './lib/sessions';
import { searchSpaces } from './lib/spaces';
import { spaces } from './spaces';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoom,
  getRoomMembers,
  updatePresence,
  subscribeToRoom,
  unsubscribeFromRoom,
  parseRoomInvite,
  roomInviteLink,
  isValidRoomId,
} from './lib/rooms';

const SERIF = "'Cormorant Garamond', Georgia, serif";

export function SpacesPanel({ theme, spaces: allSpaces, activeId, onSelect, cat, setCat, categories, favorites = [], onToggleFavorite }) {
  const [favOnly, setFavOnly] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(searchInput), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) {
      setSearchResults(null);
      return undefined;
    }
    let active = true;
    (async () => {
      const { data, error } = await searchSpaces(q);
      if (!active) return;
      if (!error && data?.length) {
        const ids = new Set(data.map((row) => row.id));
        setSearchResults(allSpaces.filter((s) => ids.has(s.id)));
      } else {
        const lower = q.toLowerCase();
        setSearchResults(allSpaces.filter((s) => {
          const text = `${s.name} ${s.tags || ''} ${s.mood} ${s.category}`.toLowerCase();
          return text.includes(lower);
        }));
      }
    })();
    return () => { active = false; };
  }, [debouncedQuery, allSpaces]);

  const source = searchResults ?? allSpaces;
  const list = useMemo(() => source.filter((s) => {
    if (favOnly && !favorites.includes(s.id)) return false;
    if (cat !== 'all' && s.category !== cat) return false;
    return true;
  }), [source, favOnly, favorites, cat]);

  const hasSearch = searchInput.trim().length > 0;

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
          value={searchInput}
          placeholder="search spaces..."
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="search spaces"
          style={{ width: '100%', background: theme.fieldBg, border: `1px solid ${theme.fieldBorder}`, color: theme.text, borderRadius: 12, padding: `10px ${hasSearch ? 36 : 12}px 10px 34px`, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
        />
        {hasSearch && (
          <button
            type="button"
            onClick={() => setSearchInput('')}
            aria-label="clear search"
            className="iconbtn"
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: theme.textFaint, width: 24, height: 24 }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* category chips */}
      <div className="scroll" style={{ display: 'flex', flexWrap: 'nowrap', gap: 7, marginBottom: 14, overflowX: 'auto', paddingBottom: 2 }}>
        {categories.map((c) => (
          <button
            key={c} onClick={() => setCat(c)} className="chip"
            style={{ flexShrink: 0, color: cat === c ? theme.accentInk : theme.chipText, background: cat === c ? theme.accent : theme.chipBg, border: `1px solid ${cat === c ? 'transparent' : theme.chipBorder}` }}
          >{c}</button>
        ))}
      </div>

      {/* tiles */}
      <div className="scroll" style={{ flex: 1, overflowY: 'auto', margin: '0 -4px', padding: '0 4px 4px' }}>
        {list.length === 0 ? (
          <div style={{ fontSize: 12.5, color: theme.textFaint, padding: '10px 2px' }}>
            {favOnly && !hasSearch
              ? 'no favorite spaces yet — tap a heart to add one.'
              : 'no spaces found'}
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
                    <span className="scroll" style={{ display: 'block', fontSize: 10.5, color: theme.textFaint, marginTop: 2, whiteSpace: 'nowrap', overflowX: 'auto', overflowY: 'hidden' }}>{s.tags}</span>
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

const ACTIVE_MS = 2 * 60 * 1000;

const memberActive = (lastSeenAt) => {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ACTIVE_MS;
};

const displayName = (member, userId) => {
  if (member.name) return member.name;
  if (member.user_id === userId) return 'you';
  return 'member';
};

const memberInitials = (member, userId) => {
  const name = displayName(member, userId);
  return name[0]?.toUpperCase() || '?';
};

export function RoomPanel({ theme, user, room, onRoomChange, activeTaskTitle = null }) {
  const [members, setMembers] = useState([]);
  const [joinInput, setJoinInput] = useState('');
  const [view, setView] = useState('idle'); // idle | creating
  const [createName, setCreateName] = useState('');
  const [createPending, setCreatePending] = useState(false);
  const [joinBusy, setJoinBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const createInputRef = useRef(null);

  const onRoomChangeRef = useRef(onRoomChange);
  const roomRef = useRef(room);
  const userRef = useRef(user);
  useEffect(() => { onRoomChangeRef.current = onRoomChange; }, [onRoomChange]);
  useEffect(() => { roomRef.current = room; }, [room]);
  useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    if (view === 'creating') createInputRef.current?.focus();
  }, [view]);

  useEffect(() => {
    if (!room) {
      setView('idle');
      setCreateName('');
    }
  }, [room]);

  const inviteLink = room?.id ? roomInviteLink(room.id) : '';

  // Realtime membership + presence heartbeat while in a room.
  useEffect(() => {
    const roomId = room?.id;
    const userId = user?.id;
    if (!roomId || !userId) {
      setMembers([]);
      return undefined;
    }

    let active = true;
    let channel = null;

    const refresh = async () => {
      const list = await getRoomMembers(roomId);
      if (active) setMembers(list);
    };

    refresh();
    channel = subscribeToRoom(roomId, () => { refresh(); });

    updatePresence(roomId, userId, activeTaskTitle);
    const heartbeat = window.setInterval(() => {
      updatePresence(roomId, userId, activeTaskTitle);
    }, 60_000);

    return () => {
      active = false;
      window.clearInterval(heartbeat);
      unsubscribeFromRoom(channel);
      leaveRoom(roomId, userId);
    };
  }, [room?.id, user?.id]);

  // Leave + clear parent state when the panel unmounts (widget closed / sign-out).
  useEffect(() => () => {
    const r = roomRef.current;
    const u = userRef.current;
    if (r?.id && u?.id) {
      leaveRoom(r.id, u.id);
      onRoomChangeRef.current(null);
    }
  }, []);

  // Sync active task when it changes.
  useEffect(() => {
    if (!room?.id || !user?.id) return;
    updatePresence(room.id, user.id, activeTaskTitle);
  }, [room?.id, user?.id, activeTaskTitle]);

  const submitCreate = async () => {
    if (!user?.id || createPending) return;
    const name = createName.trim();
    if (!name) return;
    setCreatePending(true);
    setError('');
    const created = await createRoom(name, user.id);
    setCreatePending(false);
    if (!created) {
      setError('could not create room — try again.');
      return;
    }
    setCreateName('');
    setView('idle');
    onRoomChange({ id: created.id, name: created.name });
  };

  const cancelCreate = () => {
    if (createPending) return;
    setCreateName('');
    setError('');
    setView('idle');
  };

  const handleJoin = async () => {
    if (!user?.id) return;
    const roomId = parseRoomInvite(joinInput);
    if (!roomId) {
      setError('paste a room id or invite link.');
      return;
    }
    if (!isValidRoomId(roomId)) {
      setError('that does not look like a valid room id.');
      return;
    }
    setJoinBusy(true);
    setError('');
    const { error: joinError } = await joinRoom(roomId, user.id);
    if (joinError) {
      setJoinBusy(false);
      setError('could not join that room.');
      return;
    }
    const details = await getRoom(roomId);
    setJoinBusy(false);
    if (!details) {
      setError('joined, but could not load room details.');
      return;
    }
    setJoinInput('');
    onRoomChange({ id: details.id, name: details.name });
  };

  const handleLeave = () => {
    onRoomChange(null);
  };

  const copyInvite = () => {
    if (!inviteLink) return;
    navigator.clipboard?.writeText(inviteLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const sortedMembers = useMemo(() => {
    const uid = user?.id;
    return [...members].sort((a, b) => {
      if (a.user_id === uid) return -1;
      if (b.user_id === uid) return 1;
      return new Date(a.joined_at) - new Date(b.joined_at);
    });
  }, [members, user?.id]);

  if (!user) {
    return (
      <div style={{ fontSize: 12.5, color: theme.textDim, lineHeight: 1.55 }}>
        sign in to create or join a study room and see who is focusing with you.
      </div>
    );
  }

  if (!room) {
    if (view === 'creating') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 11, color: theme.textFaint, textTransform: 'lowercase', letterSpacing: '.04em' }}>
            room name
          </div>
          <input
            ref={createInputRef}
            value={createName}
            onChange={(e) => { setCreateName(e.target.value); setError(''); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitCreate();
              if (e.key === 'Escape') cancelCreate();
            }}
            placeholder="name your room"
            aria-label="room name"
            disabled={createPending}
            style={{ width: '100%', background: theme.fieldBg, border: `1px solid ${theme.fieldBorder}`, color: theme.text, borderRadius: 10, padding: '9px 12px', fontSize: 13, fontFamily: 'inherit' }}
          />
          <button
            type="button"
            onClick={submitCreate}
            disabled={createPending || !createName.trim()}
            className="primarybtn sm"
            style={{ width: '100%', justifyContent: 'center', background: theme.accent, color: theme.accentInk }}
          >
            {createPending ? <Loader2 size={16} className="spin" /> : null}
            create
          </button>
          <button
            type="button"
            onClick={cancelCreate}
            disabled={createPending}
            style={{ background: 'none', border: 'none', padding: 0, fontSize: 12.5, color: theme.textFaint, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}
          >
            cancel
          </button>
          {error && <div style={{ fontSize: 12, color: '#e88' }}>{error}</div>}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <button
          type="button"
          onClick={() => { setError(''); setView('creating'); }}
          disabled={joinBusy}
          className="bigbtn"
          style={{ width: '100%', justifyContent: 'center', background: theme.accent, color: theme.accentInk, border: 'none' }}
        >
          <Users size={16} /> create a room
        </button>

        <div>
          <div style={{ fontSize: 11, color: theme.textFaint, marginBottom: 8, textTransform: 'lowercase', letterSpacing: '.04em' }}>
            join a room
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={joinInput}
              onChange={(e) => { setJoinInput(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="room id or invite link"
              aria-label="room id or invite link"
              style={{ flex: 1, background: theme.fieldBg, border: `1px solid ${theme.fieldBorder}`, color: theme.text, borderRadius: 10, padding: '9px 12px', fontSize: 13, fontFamily: 'inherit' }}
            />
            <button
              type="button"
              onClick={handleJoin}
              disabled={joinBusy || !joinInput.trim()}
              className="primarybtn sm"
              style={{ background: theme.accent, color: theme.accentInk }}
            >
              join
            </button>
          </div>
        </div>

        {error && <div style={{ fontSize: 12, color: '#e88' }}>{error}</div>}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: theme.text, lineHeight: 1.2 }}>
        {room.name}
      </div>

      <div style={{ fontSize: 11, color: theme.textFaint, textTransform: 'lowercase', letterSpacing: '.04em' }}>
        members · {sortedMembers.length}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto' }} className="scroll">
        {sortedMembers.length === 0 ? (
          <div style={{ fontSize: 12, color: theme.textFaint }}>no members yet.</div>
        ) : sortedMembers.map((m) => {
          const isYou = m.user_id === user.id;
          const online = memberActive(m.last_seen_at);
          const name = isYou ? (user.name || displayName(m, user.id)) : displayName(m, user.id);
          return (
            <div key={m.user_id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ position: 'relative', flexShrink: 0 }}>
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(150deg, ${theme.accent}, rgba(255,255,255,0.25))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: theme.accentInk }}>
                    {memberInitials(m, user.id)}
                  </span>
                )}
                {online && (
                  <span style={{ position: 'absolute', right: -1, bottom: -1, width: 9, height: 9, borderRadius: '50%', background: '#4ade80', border: `2px solid ${theme.panelBg}` }} />
                )}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, color: theme.text, fontWeight: isYou ? 600 : 400 }}>{name}</span>
                  {isYou && <span style={{ fontSize: 10, color: theme.textFaint }}>you</span>}
                </span>
                <span style={{ display: 'block', fontSize: 11.5, color: theme.textFaint, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.active_task ? `focusing on ${m.active_task}` : 'not focusing on a task'}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={copyInvite}
        className="ghostbtn"
        style={{ width: '100%', justifyContent: 'center', color: theme.text, background: theme.chipBg, border: `1px solid ${theme.chipBorder}` }}
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
        {copied ? 'invite link copied' : 'copy invite link'}
      </button>

      <div style={{ fontSize: 10.5, color: theme.textFaint, wordBreak: 'break-all', lineHeight: 1.45 }}>
        {inviteLink}
      </div>

      <button
        type="button"
        onClick={handleLeave}
        className="ghostbtn"
        style={{ width: '100%', justifyContent: 'center', color: theme.text, background: theme.chipBg, border: `1px solid ${theme.chipBorder}` }}
      >
        <LogOut size={15} /> leave room
      </button>

      {error && <div style={{ fontSize: 12, color: '#e88' }}>{error}</div>}
    </div>
  );
}

const spaceById = Object.fromEntries(spaces.map((s) => [s.id, s]));

const fmtSessionDate = (iso) =>
  new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' }).toLowerCase();

function Skeleton({ theme, style }) {
  return (
    <div
      aria-hidden
      style={{
        background: theme.chipBg,
        border: `1px solid ${theme.chipBorder}`,
        borderRadius: 10,
        animation: 'pulse 1.4s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

function ProgressSkeleton({ theme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 9 }}>
        {[0, 1, 2].map((i) => <Skeleton key={i} theme={theme} style={{ flex: 1, height: 72, borderRadius: 13 }} />)}
      </div>
      <Skeleton theme={theme} style={{ height: 14, width: '40%' }} />
      <Skeleton theme={theme} style={{ height: 56, borderRadius: 8 }} />
      <Skeleton theme={theme} style={{ height: 12, width: '55%' }} />
      <Skeleton theme={theme} style={{ height: 44, borderRadius: 13 }} />
      <Skeleton theme={theme} style={{ height: 44, borderRadius: 13 }} />
      {[0, 1, 2].map((i) => <Skeleton key={`s${i}`} theme={theme} style={{ height: 36 }} />)}
    </div>
  );
}

export function ProgressPanel({ theme, userId, settings }) {
  const [allTime, setAllTime] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setAllTime(null);
      setWeekly(null);
      return undefined;
    }
    let active = true;
    setLoading(true);
    Promise.all([
      fetchAllTimeStats(userId),
      fetchSessionStats(userId),
    ])
      .then(([a, w]) => {
        if (!active) return;
        setAllTime(a);
        setWeekly(w);
        setLoading(false);
      })
      .catch(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId]);

  const statCard = (icon, label, value) => (
    <div style={{ flex: 1, textAlign: 'center', background: theme.chipBg, border: `1px solid ${theme.chipBorder}`, borderRadius: 13, padding: '13px 6px' }}>
      <div style={{ color: theme.textDim, display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{icon}</div>
      <div style={{ fontFamily: SERIF, fontSize: 23, fontWeight: 500, color: theme.text }}>{value}</div>
      <div style={{ fontSize: 10, color: theme.textFaint, marginTop: 2 }}>{label}</div>
    </div>
  );

  const insightRow = (label, value) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '10px 12px', background: theme.chipBg, border: `1px solid ${theme.chipBorder}`, borderRadius: 13 }}>
      <span style={{ fontSize: 12.5, color: theme.textDim }}>{label}</span>
      <span style={{ fontSize: 13, color: theme.text, fontWeight: 500 }}>{value}</span>
    </div>
  );

  if (!userId) {
    return (
      <div style={{ fontSize: 12.5, color: theme.textDim, lineHeight: 1.55 }}>
        sign in to see your all-time focus stats, streaks, and session history.
      </div>
    );
  }

  if (loading || !allTime || !weekly) {
    return <ProgressSkeleton theme={theme} />;
  }

  const dailyGoal = settings?.dailyGoal || 120;
  const breakdown = weekly.weeklyBreakdown || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 420, overflowY: 'auto' }} className="scroll">
      <div style={{ display: 'flex', gap: 9 }}>
        {statCard(<Clock size={15} />, 'focus time', `${allTime.totalHours}h`)}
        {statCard(<Flame size={15} />, 'streak', `${allTime.streak}d`)}
        {statCard(<Check size={15} />, 'tasks done', allTime.tasksCompleted)}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 9 }}>
          <span style={{ fontSize: 10.5, color: theme.textFaint, textTransform: 'lowercase', letterSpacing: '.04em' }}>this week</span>
          <span style={{ fontSize: 11.5, color: theme.textDim }}>{weekly.weeklyMinutes} min total</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 56 }}>
          {breakdown.map((day, index) => {
            const h = Math.max(8, Math.min(100, (day.minutes / dailyGoal) * 100));
            const isToday = index === breakdown.length - 1;
            return (
              <div
                key={day.day}
                title={`${day.day}: ${day.minutes} min`}
                style={{ flex: 1, height: `${h}%`, background: isToday ? theme.accent : theme.trackBg, borderRadius: 5, transition: 'height .4s ease' }}
              />
            );
          })}
        </div>
      </div>

      {insightRow('best session', allTime.bestSessionMinutes > 0 ? `${allTime.bestSessionMinutes} min` : '—')}
      {insightRow('most productive day', allTime.mostProductiveDay || '—')}

      <div>
        <div style={{ fontSize: 10.5, color: theme.textFaint, marginBottom: 8, textTransform: 'lowercase', letterSpacing: '.04em' }}>
          recent sessions
        </div>
        {allTime.recentSessions.length === 0 ? (
          <div style={{ fontSize: 12, color: theme.textFaint }}>no sessions logged yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {allTime.recentSessions.map((s, i) => {
              const space = s.space_id ? spaceById[s.space_id] : null;
              return (
                <div
                  key={s.id || i}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 4px', borderTop: i ? `1px solid ${theme.chipBorder}` : 'none' }}
                >
                  <span style={{ color: theme.textFaint, display: 'flex' }}><BarChart3 size={13} /></span>
                  <span style={{ flex: 1, fontSize: 12.5, color: theme.text }}>{fmtSessionDate(s.created_at)}</span>
                  <span style={{ fontSize: 11.5, color: theme.textDim }}>{s.duration_minutes}m</span>
                  <span style={{ fontSize: 11, color: theme.textFaint, maxWidth: 88, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>
                    {space?.name || 'no space'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
