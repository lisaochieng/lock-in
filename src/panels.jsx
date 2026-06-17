/* ===========================================================
   Flyout panel bodies: Spaces · Profile (auth) · Calendar
   Glass styling from claude.ai/design; keeps the app's auth and
   calendar deep-link features.
   =========================================================== */
import React, { useMemo } from 'react';
import {
  Search, ChevronRight, Mail, LockKeyhole, Sparkles, X,
  CalendarCheck, CalendarDays, Plus, Check, RotateCcw, Heart,
} from 'lucide-react';

const SERIF = "'Cormorant Garamond', Georgia, serif";

export function SpacesPanel({ theme, spaces, activeId, onSelect, query, setQuery, cat, setCat, categories, favorites = [], onToggleFavorite }) {
  const list = useMemo(() => spaces.filter((s) => (
    (cat === 'all' || s.category === cat)
    && `${s.name} ${s.mood} ${s.category}`.toLowerCase().includes(query.toLowerCase())
  )), [spaces, cat, query]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: theme.textFaint, display: 'flex' }}><Search size={15} /></span>
        <input
          value={query} placeholder="search spaces" onChange={(e) => setQuery(e.target.value)}
          style={{ width: '100%', background: theme.fieldBg, border: `1px solid ${theme.fieldBorder}`, color: theme.text, borderRadius: 12, padding: '10px 12px 10px 34px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
        />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
        {categories.map((c) => (
          <button
            key={c} onClick={() => setCat(c)} className="chip"
            style={{ color: cat === c ? theme.accentInk : theme.chipText, background: cat === c ? theme.accent : theme.chipBg, border: `1px solid ${cat === c ? 'transparent' : theme.chipBorder}` }}
          >{c}</button>
        ))}
      </div>
      <div className="scroll" style={{ display: 'flex', flexDirection: 'column', gap: 9, overflowY: 'auto', flex: 1, margin: '0 -4px', padding: '0 4px 4px' }}>
        {list.length === 0
          ? <div style={{ fontSize: 12.5, color: theme.textFaint, padding: '10px 2px' }}>no spaces match that.</div>
          : list.map((s) => {
            const active = s.id === activeId;
            const fav = favorites.includes(s.id);
            return (
              <button
                key={s.id} onClick={() => onSelect(s)} className="spacecard"
                style={{ display: 'flex', alignItems: 'center', gap: 13, padding: 9, borderRadius: 15, textAlign: 'left', width: '100%', background: active ? theme.chipBg : 'transparent', border: `1px solid ${active ? theme.panelBorder : 'transparent'}`, cursor: 'pointer' }}
              >
                <span style={{ width: 62, height: 48, borderRadius: 11, flexShrink: 0, background: `linear-gradient(160deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.18)), url(${s.image}) center/cover`, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)' }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.1 }}>{s.name}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: theme.textFaint, marginTop: 2 }}>{s.mood} · {s.category}</span>
                </span>
                <span
                  role="button" tabIndex={0} aria-label={fav ? 'remove from favorites' : 'add to favorites'} aria-pressed={fav}
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(s.id); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onToggleFavorite?.(s.id); } }}
                  style={{ color: fav ? theme.accent : theme.textFaint, display: 'flex', cursor: 'pointer', padding: 2 }}
                >
                  <Heart size={15} fill={fav ? theme.accent : 'none'} />
                </span>
                <span style={{ color: active ? theme.accent : theme.textFaint, display: 'flex' }}><ChevronRight size={15} /></span>
              </button>
            );
          })}
      </div>
    </div>
  );
}

export function ProfilePanel({ theme, user, authMode, setAuthMode, authForm, setAuthForm, onSubmit, onGoogle, onSignOut }) {
  const fieldStyle = { width: '100%', background: theme.fieldBg, border: `1px solid ${theme.fieldBorder}`, color: theme.text, borderRadius: 10, padding: '10px 12px 10px 34px', fontSize: 13, fontFamily: 'inherit', outline: 'none' };

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {[['signin', 'sign in'], ['signup', 'create account']].map(([key, label]) => (
          <button
            key={key} onClick={() => setAuthMode(key)} className="segbtn"
            style={{ color: authMode === key ? theme.accentInk : theme.chipText, background: authMode === key ? theme.accent : theme.chipBg, border: `1px solid ${authMode === key ? 'transparent' : theme.chipBorder}` }}
          >{label}</button>
        ))}
      </div>
      <button onClick={onGoogle} className="calprov" style={{ color: theme.text, background: theme.chipBg, border: `1px solid ${theme.chipBorder}` }}>
        <Sparkles size={16} /> continue with Google
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: theme.textFaint, fontSize: 12 }}>
        <span style={{ flex: 1, height: 1, background: theme.chipBorder }} /> or <span style={{ flex: 1, height: 1, background: theme.chipBorder }} />
      </div>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {authMode === 'signup' && (
          <label style={{ position: 'relative', display: 'block' }}>
            <input value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} placeholder="name" style={{ ...fieldStyle, paddingLeft: 12 }} />
          </label>
        )}
        <label style={{ position: 'relative', display: 'block' }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: theme.textFaint, display: 'flex' }}><Mail size={15} /></span>
          <input value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} type="email" placeholder="email" style={fieldStyle} />
        </label>
        <label style={{ position: 'relative', display: 'block' }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: theme.textFaint, display: 'flex' }}><LockKeyhole size={15} /></span>
          <input value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} type="password" placeholder="password" style={fieldStyle} />
        </label>
        <button type="submit" className="bigbtn" style={{ background: theme.accent, color: theme.accentInk, border: 'none' }}>{authMode === 'signup' ? 'create account' : 'sign in'}</button>
      </form>
    </div>
  );
}

export function CalendarPanel({ theme, provider, setProvider, synced, setSynced, calendarUrl }) {
  const providers = ['google', 'yahoo', 'outlook', 'ics'];
  const sessions = [['today · 7:00pm', 'deep reading'], ['tomorrow · 9:30am', 'problem set'], ['fri · 4:00pm', 'flashcards']];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {providers.map((name) => (
          <button
            key={name} onClick={() => setProvider(name)} className="calprov"
            style={{ color: provider === name ? theme.accentInk : theme.text, background: provider === name ? theme.accent : theme.chipBg, border: `1px solid ${provider === name ? 'transparent' : theme.chipBorder}` }}
          ><CalendarCheck size={16} /> {name}</button>
        ))}
      </div>
      <button onClick={() => setSynced(true)} className="bigbtn" style={{ color: synced ? theme.accentInk : theme.text, background: synced ? theme.accent : theme.chipBg, border: `1px solid ${synced ? 'transparent' : theme.chipBorder}` }}>
        {synced ? <Check size={16} /> : <RotateCcw size={16} />} {synced ? 'calendar synced' : 'sync calendar'}
      </button>
      <div style={{ background: theme.chipBg, border: `1px solid ${theme.chipBorder}`, borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 11, color: theme.textFaint, marginBottom: 12, textTransform: 'lowercase', letterSpacing: '.04em' }}>next sessions</div>
        {sessions.map(([t, l], i) => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0', borderTop: i ? `1px solid ${theme.chipBorder}` : 'none' }}>
            <span style={{ width: 7, height: 7, borderRadius: 4, background: theme.accent }} />
            <span style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: 13, color: theme.text }}>{l}</span>
              <span style={{ display: 'block', fontSize: 11, color: theme.textFaint, marginTop: 1 }}>{t}</span>
            </span>
          </div>
        ))}
        <a href={calendarUrl} target="_blank" rel="noreferrer" className="ghostbtn" style={{ width: '100%', justifyContent: 'center', marginTop: 8, color: theme.textDim, background: 'transparent', border: `1px dashed ${theme.chipBorder}`, textDecoration: 'none' }}><Plus size={15} /> add next session</a>
      </div>
      <div style={{ fontSize: 11, color: theme.textFaint, lineHeight: 1.5 }}>full two-way sync needs a production OAuth app; this screen is ready for Google, Yahoo, Outlook and ICS flows.</div>
    </div>
  );
}
