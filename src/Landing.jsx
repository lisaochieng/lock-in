/* ===========================================================
   lock in — landing page
   Warm beige / sage / mauve, Cormorant Garamond serif.
   Faithful port of the claude.ai/design "lock-tf-in" Landing.html.
   =========================================================== */
import React, { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
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

export default function Landing({ onEnter }) {
  const rootRef = useRef(null);

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
    onEnter();
  };

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
            <span className="nav-note">a calm focus space</span>
            <a href="#" onClick={enter} className="pill">open app <ArrowRight size={14} /></a>
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
                <div><div className="n">14</div><div className="l">ambient scenes</div></div>
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
            <p>thirteen scenes, each with its own light, sound and colour. pick what your hour needs.</p>
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
