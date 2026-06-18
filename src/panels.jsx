/* ===========================================================
   Flyout panel bodies: Spaces · Profile (auth) · Calendar
   Glass styling from claude.ai/design; keeps the app's auth and
   calendar deep-link features.
   =========================================================== */
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, ChevronRight, ChevronLeft, Sparkles, X, Check, Heart, Clock,
  Copy, LogOut, Users, Flame, BarChart3, Loader2, ArrowUp, ArrowDown,
  Volume2, VolumeX, Pencil,
} from 'lucide-react';
import { fetchSessionsByMonth, fetchCompletedTasksByMonth } from './lib/sessions';
import { fetchProgressAnalysis, emptyProgressAnalysis, fetchUserProfileStats } from './lib/progress';
import { supabase } from './lib/supabase';
import { searchSpaces } from './lib/spaces';
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

function SpacesPanelImpl({ theme, spaces: allSpaces, activeId, onSelect, cat, setCat, categories, favorites = [], onToggleFavorite }) {
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
                  <span style={{ position: 'relative', display: 'block', width: '100%', paddingTop: '58%', overflow: 'hidden' }}>
                    <img
                      src={s.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span
                      aria-hidden
                      style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.34))', pointerEvents: 'none' }}
                    />
                    <span
                      role="button" tabIndex={0} aria-label={fav ? 'remove from favorites' : 'add to favorites'} aria-pressed={fav}
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(s.id); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onToggleFavorite?.(s.id); } }}
                      style={{ position: 'absolute', top: 7, right: 7, width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,14,18,0.42)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', color: fav ? theme.accent : '#fff', cursor: 'pointer', zIndex: 1 }}
                    >
                      <Heart size={14} fill={fav ? theme.accent : 'none'} />
                    </span>
                    {active && (
                      <span style={{ position: 'absolute', left: 7, bottom: 7, fontSize: 9, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', padding: '3px 7px', borderRadius: 6, background: theme.accent, color: theme.accentInk, zIndex: 1 }}>active</span>
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

function nameInitials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  if (parts.length === 1) {
    const word = parts[0];
    return word.length >= 2 ? word.slice(0, 2).toUpperCase() : word[0]?.toUpperCase() || '?';
  }
  return '?';
}

function ProfileStatSkeleton({ theme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '4px 0' }}>
          <div style={{ height: 12, width: 96, borderRadius: 8, background: theme.chipBg, border: `1px solid ${theme.chipBorder}`, animation: 'pulse 1.4s ease-in-out infinite' }} />
          <div style={{ height: 12, width: 52, borderRadius: 8, background: theme.chipBg, border: `1px solid ${theme.chipBorder}`, animation: 'pulse 1.4s ease-in-out infinite' }} />
        </div>
      ))}
    </div>
  );
}

function ProfilePanelImpl({ theme, user, onSignOut, onShowHero, onNameChange }) {
  const [profileStats, setProfileStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const nameInputRef = useRef(null);

  useEffect(() => {
    setDisplayName(user?.name || '');
  }, [user?.name]);

  useEffect(() => {
    if (!user?.id) {
      setProfileStats(null);
      setStatsLoading(false);
      return undefined;
    }
    let active = true;
    setStatsLoading(true);
    fetchUserProfileStats(user.id)
      .then(({ data }) => {
        if (!active) return;
        setProfileStats(data);
        setStatsLoading(false);
      })
      .catch(() => {
        if (active) setStatsLoading(false);
      });
    return () => { active = false; };
  }, [user?.id]);

  const saveName = async () => {
    const trimmed = nameDraft.trim();
    setEditingName(false);
    if (!trimmed || !user?.id) {
      setNameDraft(displayName);
      return;
    }
    if (trimmed === displayName) return;

    const { error } = await supabase.from('profiles').update({ name: trimmed }).eq('id', user.id);
    if (!error) {
      setDisplayName(trimmed);
      onNameChange?.(trimmed);
    } else {
      setNameDraft(displayName);
    }
  };

  const startEditName = () => {
    setNameDraft(displayName);
    setEditingName(true);
    queueMicrotask(() => nameInputRef.current?.focus());
  };

  if (user) {
    const initials = nameInitials(displayName);
    const providerLabel = user.provider === 'google' ? 'google' : 'email';
    const hasActivity = profileStats && (
      profileStats.totalSessions > 0
      || profileStats.totalTasksCompleted > 0
      || profileStats.totalFocusHours > 0
    );

    const statRows = [];
    if (profileStats?.memberSince) statRows.push(['member since', profileStats.memberSince]);
    if (profileStats?.totalFocusHours > 0) statRows.push(['total focus', `${profileStats.totalFocusHours}h`]);
    if (profileStats?.totalSessions > 0) statRows.push(['sessions', profileStats.totalSessions]);
    if (profileStats?.totalTasksCompleted > 0) statRows.push(['tasks done', profileStats.totalTasksCompleted]);
    if (profileStats?.longestStreak > 0) statRows.push(['best streak', `${profileStats.longestStreak} days`]);
    if (profileStats?.currentStreak > 0) statRows.push(['current streak', `${profileStats.currentStreak} days`]);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: theme.chipBg, border: `1px solid ${theme.chipBorder}`, borderRadius: 18, padding: 22 }}>
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', marginBottom: 16 }}
            />
          ) : (
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 600, color: theme.accentInk, marginBottom: 16 }}>
              {initials}
            </div>
          )}
          <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, color: theme.text }}>{displayName}</div>
          <div style={{ fontSize: 13, color: theme.textDim, marginTop: 6 }}>{user.email}</div>
          <span
            style={{
              display: 'inline-flex',
              marginTop: 14,
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '.04em',
              textTransform: 'lowercase',
              color: theme.textFaint,
              background: theme.panelBg,
              border: `1px solid ${theme.chipBorder}`,
            }}
          >
            {providerLabel}
          </span>
        </div>

        <div style={{ background: theme.chipBg, border: `1px solid ${theme.chipBorder}`, borderRadius: 18, padding: 16 }}>
          <div style={{ fontSize: 11, color: theme.textFaint, marginBottom: 12, textTransform: 'lowercase', letterSpacing: '.04em' }}>your stats</div>
          {statsLoading ? (
            <ProfileStatSkeleton theme={theme} />
          ) : !hasActivity ? (
            <>
              {profileStats?.memberSince && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ fontSize: 13, color: theme.textDim }}>member since</span>
                  <span style={{ fontSize: 13, color: theme.text, fontWeight: 500 }}>{profileStats.memberSince}</span>
                </div>
              )}
              <div style={{ fontSize: 12.5, color: theme.textFaint, lineHeight: 1.5, marginTop: profileStats?.memberSince ? 8 : 0 }}>
                start your first session to see stats
              </div>
            </>
          ) : (
            statRows.map(([k, v], i) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: i ? `1px solid ${theme.chipBorder}` : 'none' }}>
                <span style={{ fontSize: 13, color: theme.textDim }}>{k}</span>
                <span style={{ fontSize: 13, color: theme.text, fontWeight: 500 }}>{v}</span>
              </div>
            ))
          )}
        </div>

        <div style={{ background: theme.chipBg, border: `1px solid ${theme.chipBorder}`, borderRadius: 18, padding: 16 }}>
          <div style={{ fontSize: 11, color: theme.textFaint, marginBottom: 12, textTransform: 'lowercase', letterSpacing: '.04em' }}>account</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 12.5, color: theme.textDim, flexShrink: 0 }}>edit name</span>
            {editingName ? (
              <input
                ref={nameInputRef}
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); nameInputRef.current?.blur(); }
                  if (e.key === 'Escape') { setNameDraft(displayName); setEditingName(false); }
                }}
                aria-label="edit name"
                style={{ flex: 1, minWidth: 0, background: theme.fieldBg, border: `1px solid ${theme.fieldBorder}`, color: theme.text, borderRadius: 10, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }}
              />
            ) : (
              <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</span>
            )}
            <button
              type="button"
              className="iconbtn"
              onClick={editingName ? saveName : startEditName}
              aria-label="edit name"
              style={{ color: theme.textFaint, flexShrink: 0 }}
            >
              <Pencil size={14} />
            </button>
          </div>
          <button onClick={onSignOut} className="ghostbtn" style={{ width: '100%', justifyContent: 'center', color: theme.text, background: theme.chipBg, border: `1px solid ${theme.chipBorder}` }}>
            <LogOut size={15} /> sign out
          </button>
        </div>
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

function CalendarPanelImpl({ theme, userId }) {
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

function RoomPanelImpl({ theme, user, room, onRoomChange, activeTaskTitle = null }) {
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
          create a room
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

      {error && <div style={{ fontSize: 12, color: '#e88' }}>{error}</div>}
    </div>
  );
}

export function RoomTopBar({ theme, room, onLeave }) {
  return (
    <div
      className="roomtopbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px 8px 14px',
        borderRadius: 15,
        background: theme.panelBg,
        border: `1px solid ${theme.panelBorder}`,
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        minWidth: 0,
        maxWidth: 280,
      }}
    >
      <span style={{ display: 'flex', color: theme.accent, flexShrink: 0 }}><Users size={18} /></span>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontFamily: SERIF,
          fontSize: 15,
          fontWeight: 600,
          color: theme.text,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {room.name}
      </span>
      <button
        type="button"
        onClick={onLeave}
        className="ghostbtn sm"
        style={{
          flexShrink: 0,
          color: theme.textDim,
          background: theme.chipBg,
          border: `1px solid ${theme.chipBorder}`,
          padding: '6px 10px',
          fontSize: 12,
        }}
      >
        <LogOut size={14} /> leave
      </button>
    </div>
  );
}

const sectionLabel = {
  fontSize: 10.5,
  textTransform: 'lowercase',
  letterSpacing: '.04em',
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const dayAbbr = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T12:00:00`);
  return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()];
};

const fmtBestSessionDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString([], { month: 'long', day: 'numeric' }).toLowerCase();
};

const fmtPeakHour = (hour) => {
  if (hour == null) return '—';
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();
};

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
      <Skeleton theme={theme} style={{ height: 12, width: '28%' }} />
      {[0, 1, 2].map((i) => (
        <Skeleton key={`ins${i}`} theme={theme} style={{ height: 14, width: `${72 - i * 8}%` }} />
      ))}
      <Skeleton theme={theme} style={{ height: 12, width: '32%' }} />
      <Skeleton theme={theme} style={{ height: 72, borderRadius: 8 }} />
      <Skeleton theme={theme} style={{ height: 12, width: '45%' }} />
      <Skeleton theme={theme} style={{ height: 14, width: '80%' }} />
      <Skeleton theme={theme} style={{ height: 14, width: '65%' }} />
    </div>
  );
}

function ProgressPanelImpl({ theme, userId, settings, tasks = [], todayMinutes = 0, stats = null }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartTip, setChartTip] = useState(null);

  const applyAnalysis = (data) => setAnalysis(data || emptyProgressAnalysis());

  useEffect(() => {
    if (!userId) {
      setAnalysis(null);
      return undefined;
    }
    let active = true;
    setLoading(true);
    fetchProgressAnalysis(userId)
      .then(({ data }) => {
        if (!active) return;
        applyAnalysis(data);
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          applyAnalysis(null);
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;
    const onSessionLogged = () => {
      fetchProgressAnalysis(userId).then(({ data }) => applyAnalysis(data));
    };
    window.addEventListener('session:logged', onSessionLogged);
    return () => window.removeEventListener('session:logged', onSessionLogged);
  }, [userId]);

  const tasksDone = tasks.filter((t) => t.done).length;
  const tasksPct = tasks.length ? Math.round((tasksDone / tasks.length) * 100) : 0;
  const dailyGoal = settings?.dailyGoal || 120;

  const statCard = (icon, label, value) => (
    <div style={{ flex: 1, textAlign: 'center', background: theme.chipBg, border: `1px solid ${theme.chipBorder}`, borderRadius: 13, padding: '13px 6px' }}>
      <div style={{ color: theme.textDim, display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{icon}</div>
      <div style={{ fontFamily: SERIF, fontSize: 23, fontWeight: 500, color: theme.text }}>{value}</div>
      <div style={{ fontSize: 10, color: theme.textFaint, marginTop: 2 }}>{label}</div>
    </div>
  );

  if (!userId) {
    const guestToday = todayMinutes || stats?.days?.[todayKey()] || 0;
    const guestStreak = stats?.streak ?? 0;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 9 }}>
          {statCard(<Clock size={15} />, 'focused', `${guestToday}m`)}
          {statCard(<Flame size={15} />, 'streak', guestStreak)}
          {statCard(<Check size={15} />, 'tasks', `${tasksPct}%`)}
        </div>
        <div style={{ fontSize: 12.5, color: theme.textDim, lineHeight: 1.55 }}>
          sign in to sync progress across devices and unlock weekly insights.
        </div>
      </div>
    );
  }

  if (loading || !analysis) {
    return <ProgressSkeleton theme={theme} />;
  }

  const breakdown = analysis.weeklyBreakdown || [];
  const weeklyGoal = analysis.weeklyGoal || settings?.weeklyGoal || 600;
  const dailyTarget = weeklyGoal / 7;
  const maxScale = Math.max(
    dailyGoal,
    dailyTarget,
    ...breakdown.map((d) => d.minutes),
    1,
  );
  const goalLinePct = Math.min(100, (dailyTarget / maxScale) * 100);
  const today = todayKey();

  const trendViews = {
    improving: { icon: <ArrowUp size={13} />, text: 'up from last week', color: '#4ade80' },
    declining: { icon: <ArrowDown size={13} />, text: 'down from last week', color: '#e88' },
    steady: { icon: <span style={{ fontSize: 13, lineHeight: 1 }}>—</span>, text: 'consistent', color: theme.textFaint },
  };
  const trendView = trendViews[analysis.trend] || trendViews.steady;

  const bestSessionLine = analysis.bestSession?.minutes > 0
    ? `best session  ${analysis.bestSession.minutes} min · ${fmtBestSessionDate(analysis.bestSession.date)}`
    : 'best session  —';

  const peakLine = `peak focus  ${fmtPeakHour(analysis.mostProductiveHour)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 420, overflowY: 'auto' }} className="scroll">
      <div style={{ display: 'flex', gap: 9 }}>
        {statCard(<Clock size={15} />, 'focused', `${analysis.todayMinutes}m`)}
        {statCard(<Flame size={15} />, 'streak', analysis.streak)}
        {statCard(<Check size={15} />, 'tasks', `${tasksPct}%`)}
      </div>

      <div>
        <div style={{ ...sectionLabel, color: theme.textFaint, marginBottom: 8 }}>insights</div>
        {analysis.insights?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {analysis.insights.slice(0, 3).map((line) => (
              <div key={line} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: theme.textDim, lineHeight: 1.45 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: theme.accent, flexShrink: 0, marginTop: 6 }} />
                <span>{line}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: theme.textFaint }}>complete a focus session to see insights.</div>
        )}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 9 }}>
          <span style={{ ...sectionLabel, color: theme.textFaint }}>this week</span>
          <span style={{ fontSize: 11.5, color: theme.textDim }}>{analysis.weeklyMinutes} min total</span>
        </div>
        <div style={{ position: 'relative', height: 56, marginBottom: 6 }}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: `${goalLinePct}%`,
              height: 1,
              background: theme.chipBorder,
              opacity: 0.55,
              pointerEvents: 'none',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: '100%' }}>
            {breakdown.map((day, index) => {
              const h = Math.max(8, Math.min(100, (day.minutes / maxScale) * 100));
              const isToday = day.date === today;
              const dayName = day.day || 'day';
              return (
                <button
                  key={day.date || `${day.day}-${index}`}
                  type="button"
                  aria-label={`${day.minutes} min on ${dayName}`}
                  onMouseEnter={() => setChartTip({ minutes: day.minutes, day: dayName })}
                  onMouseLeave={() => setChartTip(null)}
                  onFocus={() => setChartTip({ minutes: day.minutes, day: dayName })}
                  onBlur={() => setChartTip(null)}
                  style={{
                    flex: 1,
                    height: `${h}%`,
                    background: isToday ? theme.accent : theme.trackBg,
                    borderRadius: 5,
                    border: 'none',
                    padding: 0,
                    cursor: 'default',
                    transition: 'height .4s ease',
                  }}
                />
              );
            })}
          </div>
          {chartTip && (
            <div
              style={{
                position: 'absolute',
                top: -28,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 11,
                color: theme.text,
                background: theme.chipBg,
                border: `1px solid ${theme.chipBorder}`,
                borderRadius: 8,
                padding: '4px 8px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}
            >
              {chartTip.minutes} min on {chartTip.day}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {breakdown.map((day, index) => (
            <div
              key={`lbl-${day.date || index}`}
              style={{ flex: 1, textAlign: 'center', fontSize: 9.5, color: theme.textFaint, fontVariantNumeric: 'tabular-nums' }}
            >
              {dayAbbr(day.date) || day.day?.[0]?.toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: trendView.color }}>
        {trendView.icon}
        <span>{trendView.text}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: theme.textDim }}>
        <div>{bestSessionLine}</div>
        <div>{peakLine}</div>
      </div>
    </div>
  );
}

const YT_SOUND_KEY = 'yt_sound_enabled';

export function loadYtSoundEnabled() {
  return localStorage.getItem(YT_SOUND_KEY) === '1';
}

export function saveYtSoundEnabled() {
  localStorage.setItem(YT_SOUND_KEY, '1');
}

export function SoundEnablePill({ theme, onEnable }) {
  return (
    <button
      type="button"
      className="soundpill"
      onClick={onEnable}
      style={{
        position: 'fixed',
        left: 96,
        bottom: 28,
        zIndex: 20,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        borderRadius: 999,
        border: `1px solid ${theme.panelBorder}`,
        background: theme.panelBg,
        color: theme.text,
        fontSize: 12.5,
        fontFamily: 'inherit',
        fontWeight: 500,
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        boxShadow: '0 12px 32px -16px rgba(0,0,0,0.55)',
        cursor: 'pointer',
      }}
    >
      <Volume2 size={15} style={{ color: theme.accent }} />
      click to enable sound
    </button>
  );
}

export const SpacesPanel = memo(SpacesPanelImpl);
export const ProfilePanel = memo(ProfilePanelImpl);
export const CalendarPanel = memo(CalendarPanelImpl);
export const RoomPanel = memo(RoomPanelImpl);
export const ProgressPanel = memo(ProgressPanelImpl);
