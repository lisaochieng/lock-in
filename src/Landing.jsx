/* ===========================================================
   lock in — hero background + auth card
   Hero stays mounted; auth is a CSS-toggled overlay in main.jsx.
   =========================================================== */
import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Mail, LockKeyhole, Sparkles, X } from 'lucide-react';
import { spaces } from './spaces';

const pick = (category) => spaces.find((s) => s.category === category);
const moodBg = (category) => {
  const space = pick(category);
  return space
    ? `linear-gradient(160deg, rgba(0,0,0,0) 42%, rgba(0,0,0,0.30)), url(${space.image}) center/cover`
    : 'rgba(0,0,0,0.08)';
};

const FEATURE_BG = 'radial-gradient(circle at 56% 38%, #c89b6a 0%, #7c5f3f 58%, #4f3d28 100%)';

const MOODS = [
  { category: 'rain', title: 'rainy village', note: 'deep reading, slow pages', tag: 'rain' },
  { category: 'snow', title: 'snow on the lake', note: 'calm recall, quiet mind', tag: 'snow' },
  { category: 'forest', title: 'woodland birdsong', note: 'morning pages, fresh start', tag: 'forest' },
  { category: 'fireplace', title: 'crackling fire', note: 'cozy reading, late nights', tag: 'fireplace' },
  { category: 'cafe', title: 'corner café', note: 'light grind, warm hum', tag: 'cafe' },
  { category: 'night city', title: 'midnight skyline', note: 'late grind, deep flow', tag: 'night city' },
];

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

export function AuthCard({ mode, setMode, onClose, onSignIn, onSignUp, onGoogle }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const nameRef = useRef(null);
  const emailRef = useRef(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (mode === 'signup') nameRef.current?.focus();
      else emailRef.current?.focus();
    }, 120);
    return () => window.clearTimeout(t);
  }, [mode]);

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
    }
  };

  return (
    <div className="auth-card" onClick={(e) => e.stopPropagation()}>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="close"
          className="auth-card__close"
        >
          <X size={18} />
        </button>
      )}

      <div className="auth-card__title">
        {mode === 'signup' ? 'create your account' : 'welcome back'}
      </div>
      <div className="auth-card__sub">
        {mode === 'signup' ? 'save your tasks, goals and streaks across devices.' : 'sign in to pick up where you left off.'}
      </div>

      <div className="auth-card__tabs">
        {[['signin', 'sign in'], ['signup', 'sign up']].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => { setMode(key); setMessage(null); }}
            className={mode === key ? 'auth-card__tab active' : 'auth-card__tab'}
          >
            {label}
          </button>
        ))}
      </div>

      <button type="button" onClick={() => onGoogle?.()} className="auth-card__google">
        <Sparkles size={16} /> continue with Google
      </button>

      <div className="auth-card__or">
        <span /> or <span />
      </div>

      <form onSubmit={submit} className="auth-card__form">
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
        <label className="auth-card__field">
          <span className="auth-card__icon"><Mail size={15} /></span>
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
        <label className="auth-card__field">
          <span className="auth-card__icon"><LockKeyhole size={15} /></span>
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
          <label className="auth-card__field">
            <span className="auth-card__icon"><LockKeyhole size={15} /></span>
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
        <button type="submit" disabled={busy} className="auth-card__submit">
          {busy ? 'one moment…' : (mode === 'signup' ? 'create account' : 'sign in')}
        </button>
      </form>

      {message && (
        <div className={`auth-card__message${message.type === 'error' ? ' error' : ''}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

export function HeroBackground({ featuredSpace, heroQuote, onEnter, onOpenAuth }) {
  const rootRef = useRef(null);
  const bgImage = featuredSpace?.image;

  useEffect(() => {
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
  }, []);

  const enter = (e) => {
    if (e) e.preventDefault();
    onEnter?.();
  };

  return (
    <div className="hero-bg-inner landing" ref={rootRef}>
      {bgImage && (
        <div
          className="hero-bg-image"
          style={{ backgroundImage: `url(${bgImage})` }}
          aria-hidden
        />
      )}
      <div className="hero-bg-veil" aria-hidden />
      <div className="hero-bg-brand" aria-hidden>
        <div className="wordmark hero-bg-wordmark">lock <em>in</em></div>
        {heroQuote && <p className="hero-bg-quote">{heroQuote}</p>}
      </div>

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
            <a href="#" onClick={(e) => { e.preventDefault(); onOpenAuth?.('signin'); }}>sign in</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onOpenAuth?.('signup'); }} className="pill">create account <ArrowRight size={14} /></a>
          </div>
        </nav>

        <header className="lhero">
          <div className="eyebrow">a calm place to <b>study</b></div>
          <div className="hero-media">
            <div
              className="hero-photo"
              style={bgImage ? { backgroundImage: `url(${bgImage})` } : undefined}
            />
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
    </div>
  );
}

export default HeroBackground;
