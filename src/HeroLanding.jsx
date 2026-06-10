import React, { useEffect, useState } from 'react';
import { LockKeyhole, Mail, Sparkles, X } from 'lucide-react';

const emptyForm = { name: '', email: '', password: '' };

function buildUser(mode, form) {
  const email = form.email.trim().toLowerCase();
  if (!email) return null;
  return {
    name: mode === 'signup' ? form.name.trim() || email.split('@')[0] : email.split('@')[0],
    email,
    provider: 'email',
  };
}

function googleUser() {
  return { name: 'google student', email: 'student@gmail.com', provider: 'google' };
}

export default function HeroLanding({ onAuthenticate }) {
  const [authMode, setAuthMode] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const openModal = (mode) => {
    setForm(emptyForm);
    setAuthMode(mode);
  };
  const closeModal = () => setAuthMode(null);

  useEffect(() => {
    if (!authMode) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [authMode]);

  const submit = (event) => {
    event.preventDefault();
    const user = buildUser(authMode, form);
    if (!user) return;
    onAuthenticate(user);
  };

  const isSignup = authMode === 'signup';

  return (
    <div className="hero">
      <div className="hero-gradient" aria-hidden="true" />
      <div className="hero-orb hero-orb-a" aria-hidden="true" />
      <div className="hero-orb hero-orb-b" aria-hidden="true" />
      <div className="hero-orb hero-orb-c" aria-hidden="true" />

      <main className="hero-content">
        <span className="hero-mark"><LockKeyhole size={18} /> a calm study room</span>
        <h1 className="hero-title">lock in</h1>
        <p className="hero-tagline">find your focus and study softly, together.</p>
        <div className="hero-actions">
          <button className="hero-button" onClick={() => openModal('signin')}>log in</button>
          <button className="hero-button hero-button-primary" onClick={() => openModal('signup')}>sign up</button>
        </div>
      </main>

      {authMode && (
        <div className="hero-modal-overlay" role="dialog" aria-modal="true" onClick={closeModal}>
          <div className="hero-modal" onClick={(event) => event.stopPropagation()}>
            <button className="hero-modal-close" onClick={closeModal} aria-label="close">
              <X size={18} />
            </button>
            <h2 className="hero-modal-title">{isSignup ? 'create your account' : 'welcome back'}</h2>
            <p className="hero-modal-subtitle">
              {isSignup ? 'start studying softly in seconds.' : 'pick up right where you left off.'}
            </p>

            <button className="hero-google" onClick={() => onAuthenticate(googleUser())}>
              <Sparkles size={16} /> continue with Google
            </button>

            <div className="hero-divider"><span>or</span></div>

            <form onSubmit={submit} className="hero-form">
              {isSignup && (
                <label>
                  <span>name</span>
                  <input
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="your name"
                  />
                </label>
              )}
              <label>
                <span>email</span>
                <Mail size={15} />
                <input
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  type="email"
                  placeholder="you@email.com"
                  autoFocus
                />
              </label>
              <label>
                <span>password</span>
                <LockKeyhole size={15} />
                <input
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  type="password"
                  placeholder="••••••••"
                />
              </label>
              <button className="hero-submit" type="submit">
                {isSignup ? 'sign up' : 'log in'}
              </button>
            </form>

            <p className="hero-switch">
              {isSignup ? 'already have an account?' : 'new here?'}{' '}
              <button type="button" onClick={() => openModal(isSignup ? 'signin' : 'signup')}>
                {isSignup ? 'log in' : 'sign up'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
