/* ===========================================================
   lock in — landing page
   Warm beige / sage / mauve, Cormorant Garamond serif.
   Faithful port of the claude.ai/design "lock-tf-in" Landing.html.
   =========================================================== */
import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Mail, LockKeyhole, Sparkles, X } from 'lucide-react';
import { spaces } from './spaces';

// real ambience thumbnail per vibe for the spaces showcase
const pick = (category) => spaces.find((s) => s.category === category);
const moodBg = (category) => {
  const space = pick(category);
  return space
    ? `linear-gradient(160deg, rgba(0,0,0,0) 42%, rgba(0,0,0,0.30)), url(${space.image}) center/cover`
    : 'rgba(0,0,0,0.08)';
};

const HERO_BG = 'radial-gradient(circle at 50% 28%, #cdd3c0 0%, #8a9a86 52%, #55624f 100%)';
const FEATURE_BG = 'radial-gradient(circle at 56% 38%, #c89b6a 0%, #7c5f3f 58%, #4f3d28 100%)';

const MOODS = [
  { category: 'rain', title: 'rainy village', note: 'deep reading, slow pages', tag: 'rain' },
  { category: 'snow', title: 'snow on the lake', note: 'calm recall, quiet mind', tag: 'snow' },
  { category: 'forest', title: 'woodland birdsong', note: 'morning pages, fresh start', tag: 'forest' },
  { category: 'fireplace', title: 'crackling fire', note: 'cozy reading, late nights', tag: 'fireplace' },
  { category: 'cafe', title: 'corner café', note: 'light grind, warm hum', tag: 'cafe' },
  { category: 'night city', title: 'midnight skyline', note: 'late grind, deep flow', tag: 'night city' },
];

// Sage / cream auth palette so the overlay sits naturally on the hero.
const AUTH = {
  ink: '#3b4034',
  dim: 'rgba(59,64,52,0.66)',
  faint: 'rgba(59,64,52,0.45)',
  accent: '#55624f',
  accentInk: '#f6f3ec',
  card: '#f6f3ec',
  field: '#ffffff',
  border: 'rgba(85,98,79,0.22)',
};

function AuthCard({ mode, setMode, onClose, onSignIn, onSignUp, onGoogle, prominent = false }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const nameRef = useRef(null);
  const emailRef = useRef(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (mode === 'signup') nameRef.current?.focus();
      else emailRef.current?.focus();
    }, prominent ? 0 : 80);
    return () => window.clearTimeout(t);
  }, [mode, prominent]);

  const field = {
    width: '100%', background: AUTH.field, border: `1px solid ${AUTH.border}`, color: AUTH.ink,
    borderRadius: 10, padding: '11px 12px 11px 36px', fontSize: 14, fontFamily: 'inherit', outline: 'none',
  };

  const submit = async (e) => {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    const password = form.password;
    if (!email || !password) {
      setMessage({ type: 'error', text: 'enter your email and password' });
      return;
    }
    if (mode === 'signup' && password !== form.confirmPassword) {
      setMessage({ type: 'error', text: 'passwords do not match' });
      return;
    }
    setBusy(true);
    setMessage(null);
    const res = mode === 'signup'
      ? await onSignUp?.(email, password, form.name.trim() || email.split('@')[0])
      : await onSignIn?.(email, password);
    setBusy(false);
    if (res?.error) {
      setMessage({ type: 'error', text: res.error.message || 'something went wrong' });
      return;
    }
    if (res?.needsConfirmation) {
      setMessage({ type: 'info', text: 'check your email to confirm your account' });
      return;
    }
    // success: onAuthStateChange routes to the app.
  };

  const card = (
    <div
      className={prominent ? 'auth-card auth-card--prominent' : ''}
      onClick={(e) => e.stopPropagation()}
      style={{
        width: 'min(420px, 94vw)',
        background: AUTH.card,
        color: AUTH.ink,
        borderRadius: 22,
        padding: 28,
        boxShadow: '0 30px 80px -24px rgba(20,26,18,0.55)',
        position: 'relative',
      }}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="close"
          style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: AUTH.faint, cursor: 'pointer', display: 'flex', padding: 4 }}
        >
          <X size={18} />
        </button>
      )}

      <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, fontWeight: 600, marginBottom: 4 }}>
        {mode === 'signup' ? 'create your account' : 'welcome back'}
      </div>
      <div style={{ fontSize: 13, color: AUTH.dim, marginBottom: 18 }}>
        {mode === 'signup' ? 'save your tasks, goals and streaks across devices.' : 'sign in to pick up where you left off.'}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[['signin', 'sign in'], ['signup', 'sign up']].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => { setMode(key); setMessage(null); }}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
              color: mode === key ? AUTH.accentInk : AUTH.ink,
              background: mode === key ? AUTH.accent : 'transparent',
              border: `1px solid ${mode === key ? 'transparent' : AUTH.border}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onGoogle?.()}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '11px 0', borderRadius: 10, fontSize: 13.5, fontFamily: 'inherit', cursor: 'pointer',
          color: AUTH.ink, background: AUTH.field, border: `1px solid ${AUTH.border}`,
        }}
      >
        <Sparkles size={16} /> continue with Google
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: AUTH.faint, fontSize: 12, margin: '14px 0' }}>
        <span style={{ flex: 1, height: 1, background: AUTH.border }} /> or <span style={{ flex: 1, height: 1, background: AUTH.border }} />
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {mode === 'signup' && (
          <input
            ref={nameRef}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="name"
            aria-label="name"
            style={{ ...field, paddingLeft: 12 }}
          />
        )}
        <label style={{ position: 'relative', display: 'block' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: AUTH.faint, display: 'flex' }}><Mail size={15} /></span>
          <input
            ref={emailRef}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            type="email"
            placeholder="email"
            aria-label="email"
            style={field}
          />
        </label>
        <label style={{ position: 'relative', display: 'block' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: AUTH.faint, display: 'flex' }}><LockKeyhole size={15} /></span>
          <input
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            type="password"
            placeholder="password"
            aria-label="password"
            style={field}
          />
        </label>
        {mode === 'signup' && (
          <label style={{ position: 'relative', display: 'block' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: AUTH.faint, display: 'flex' }}><LockKeyhole size={15} /></span>
            <input
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              type="password"
              placeholder="confirm password"
              aria-label="confirm password"
              style={field}
            />
          </label>
        )}
        <button
          type="submit"
          disabled={busy}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 10, fontSize: 14, fontWeight: 500,
            fontFamily: 'inherit', cursor: busy ? 'default' : 'pointer', color: AUTH.accentInk,
            background: AUTH.accent, border: 'none', opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? 'one moment…' : (mode === 'signup' ? 'create account' : 'sign in')}
        </button>
      </form>

      {message && (
        <div style={{ marginTop: 14, fontSize: 12.5, lineHeight: 1.5, color: message.type === 'error' ? '#9b4a3f' : AUTH.accent }}>
          {message.text}
        </div>
      )}
    </div>
  );

  if (prominent) return card;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, background: 'rgba(40,46,38,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      {card}
    </div>
  );
}

export default function Landing({
  showAuth = null,
  onAuthChange,
  onAuthClose,
  onEnter,
  onSignIn,
  onSignUp,
  onGoogle,
}) {
  const rootRef = useRef(null);
  const [overlayAuth, setOverlayAuth] = useState(null);

  const openAuth = (mode) => {
    if (onAuthChange) onAuthChange(mode);
    else setOverlayAuth(mode);
  };

  const closeAuth = () => {
    if (onAuthChange) onAuthChange(null);
    else setOverlayAuth(null);
    onAuthClose?.();
  };

  const activeAuth = showAuth || overlayAuth;

  useEffect(() => {
    if (!showAuth) return undefined;
    const els = rootRef.current?.querySelectorAll('.reveal') || [];
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 3) * 0.09}s`;
      io.observe(el);
    });
    return () => io.disconnect();
  }, [showAuth]);

  const enter = (e) => {
    if (e) e.preventDefault();
    onEnter();
  };

  if (showAuth) {
    return (
      <div className="landing landing-auth-focus" ref={rootRef}>
        <div className="flow" aria-hidden="true">
          <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
        </div>
        <div className="grain landing-grain" aria-hidden="true" />
        <div className="landing-auth-focus__inner">
          <div className="wordmark landing-auth-wordmark">lock <em>in</em></div>
          <AuthCard
            prominent
            mode={showAuth}
            setMode={(m) => onAuthChange?.(m)}
            onClose={closeAuth}
            onSignIn={onSignIn}
            onSignUp={onSignUp}
            onGoogle={onGoogle}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="landing" ref={rootRef}>
      <div className="flow" aria-hidden="true">
        <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
        <div className="blob b4" /><div className="blob b5" />
      </div>
      <div className="grain landing-grain" aria-hidden="true" />

      <div className="wrap">
        <nav className="lnav">
          <div className="nav-left">
            <a href="#why">about</a>
            <a href="#moods">spaces</a>
            <a href="#" onClick={enter}>the app</a>
          </div>
          <div className="wordmark">lock <em>in</em></div>
          <div className="nav-right">
            <a href="#" onClick={(e) => { e.preventDefault(); openAuth('signin'); }}>sign in</a>
            <a href="#" onClick={(e) => { e.preventDefault(); openAuth('signup'); }} className="pill">create account <ArrowRight size={14} /></a>
          </div>
        </nav>

        <header className="lhero">
          <div className="eyebrow">a calm place to <b>study</b></div>
          <div className="hero-media">
            <div className="hero-photo" style={{ background: HERO_BG }} />
            <div className="veil" />
            <h1 className="hero-title">find your <em>quiet</em> hour</h1>
            <p className="hero-cap">an unhurried study space wrapped in ambient scenes, gentle sound, and just enough structure to keep you moving.</p>
          </div>
          <a href="#" onClick={enter} className="hero-cta">enter your study space <ArrowRight size={16} /></a>
          <div className="hero-sub">slow is smooth, and smooth is far.</div>
        </header>

        <section id="why">
          <div className="sec-head reveal">
            <h2>why lock in isn&rsquo;t <em>just another</em> timer</h2>
            <p>most study tools shout at you. this one quiets the room first — then the focus follows on its own.</p>
          </div>
          <div className="tabs reveal">
            <button className="tab active">ambience</button>
            <button className="tab">focus</button>
            <button className="tab">together</button>
          </div>
          <div className="feature reveal">
            <div className="copy">
              <h3>a space that <em>matches your mind</em></h3>
              <p>choose a scene — rain on a village, snow on a lake, a crackling fire — and the entire space softens to its mood. ambient video, gentle sound, and a living palette do the settling so you can simply begin.</p>
              <div className="stats">
                <div><div className="n">26</div><div className="l">ambient scenes</div></div>
                <div><div className="n">∞</div><div className="l">youtube ambiences</div></div>
                <div><div className="n">0</div><div className="l">notifications</div></div>
              </div>
            </div>
            <div className="feature-photo" style={{ background: FEATURE_BG }} />
          </div>
        </section>

        <section id="moods">
          <div className="sec-head reveal">
            <h2>a space for <em>every</em> mood</h2>
            <p>dozens of scenes, each with its own light, sound and colour. pick what your hour needs.</p>
          </div>
          <div className="mood-grid">
            {MOODS.map((m) => (
              <button key={m.title} className="mood reveal" onClick={enter}>
                <span className="mood-photo" style={{ background: moodBg(m.category) }} />
                <h4>{m.title}</h4>
                <div className="row"><p>{m.note}</p><span className="mtag">{m.tag}</span></div>
              </button>
            ))}
          </div>
        </section>

        <div className="closing reveal">
          <h2>your quiet hour is <em>waiting</em>.</h2>
          <p>step in, choose a scene, and let the room hold the focus for you.</p>
          <a href="#" onClick={enter} className="hero-cta">enter your study space <ArrowRight size={16} /></a>
        </div>

        <footer className="lfooter">
          <span className="fbrand">lock <em>in</em></span>
          <span>made for deep, quiet hours</span>
        </footer>
      </div>

      {overlayAuth && (
        <AuthCard
          mode={overlayAuth}
          setMode={setOverlayAuth}
          onClose={closeAuth}
          onSignIn={onSignIn}
          onSignUp={onSignUp}
          onGoogle={onGoogle}
        />
      )}
    </div>
  );
}
