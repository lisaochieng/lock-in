/* ===========================================================
   AmbientBackground — fixed cinematic backdrop per vibe +
   a canvas particle system (rain / snow / spark / mote / bubble /
   bokeh / petal) and an occasional lightning flash.
   =========================================================== */
import React, { useEffect, useRef } from 'react';

export default function AmbientBackground({ theme, image }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const flashRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const type = theme.particle || 'mote';
    const color = theme.particleColor || 'rgba(255,255,255,0.4)';
    const counts = { rain: 150, snow: 90, spark: 36, mote: 50, bubble: 34, bokeh: 26, petal: 26, none: 0 };
    const n = counts[type] ?? 40;
    const P = [];
    const rnd = (a, b) => a + Math.random() * (b - a);

    function spawn(initial) {
      const base = { x: rnd(0, w), y: initial ? rnd(0, h) : -10 };
      if (type === 'rain') return { ...base, len: rnd(10, 22), vy: rnd(620, 900), vx: rnd(-40, -10), wob: 0 };
      if (type === 'snow') return { ...base, r: rnd(1.2, 3.2), vy: rnd(28, 70), vx: rnd(-14, 14), wob: rnd(0, 6.28), wsp: rnd(0.6, 1.4) };
      if (type === 'spark') return { x: rnd(0, w), y: rnd(h * 0.5, h + 10), r: rnd(1, 2.6), vy: rnd(-70, -34), vx: rnd(-12, 12), wob: rnd(0, 6.28), wsp: rnd(0.8, 1.8), life: rnd(0, 1) };
      if (type === 'bubble') return { ...base, y: rnd(0, h), r: rnd(2, 6), vy: rnd(-26, -54), vx: rnd(-8, 8), wob: rnd(0, 6.28), wsp: rnd(0.7, 1.5) };
      if (type === 'bokeh') return { x: rnd(0, w), y: rnd(0, h), r: rnd(8, 26), vy: rnd(-8, 8), vx: rnd(-8, 8), a: rnd(0.05, 0.18) };
      if (type === 'petal') return { ...base, r: rnd(3, 6), vy: rnd(30, 64), vx: rnd(-30, 6), wob: rnd(0, 6.28), wsp: rnd(1, 2) };
      return { ...base, y: rnd(0, h), r: rnd(0.8, 2.4), vy: rnd(-10, 10), vx: rnd(-10, 10), a: rnd(0.15, 0.5) };
    }
    for (let i = 0; i < n; i += 1) P.push(spawn(true));

    let last = performance.now();
    let nextFlash = theme.lightning ? performance.now() + rnd(2200, 5200) : Infinity;

    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < P.length; i += 1) {
        const p = P[i];
        if (type === 'rain') {
          p.x += p.vx * dt; p.y += p.vy * dt;
          ctx.strokeStyle = color; ctx.lineWidth = 1.1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.vx * 0.02, p.y + p.len); ctx.stroke();
          if (p.y > h) Object.assign(p, spawn(false));
        } else if (type === 'snow' || type === 'petal') {
          p.wob += p.wsp * dt; p.x += (p.vx + Math.sin(p.wob) * 18) * dt; p.y += p.vy * dt;
          ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
          if (p.y > h + 8) Object.assign(p, spawn(false));
        } else if (type === 'spark') {
          p.wob += p.wsp * dt; p.x += (p.vx + Math.sin(p.wob) * 10) * dt; p.y += p.vy * dt; p.life += dt * 0.6;
          const a = Math.max(0, 0.9 - p.life * 0.5);
          ctx.fillStyle = color.replace(/[\d.]+\)$/g, `${a.toFixed(2)})`);
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
          if (p.y < -10 || a <= 0) Object.assign(p, spawn(false), { y: rnd(h * 0.6, h + 10) });
        } else if (type === 'bubble') {
          p.wob += p.wsp * dt; p.x += Math.sin(p.wob) * 10 * dt; p.y += p.vy * dt;
          ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.stroke();
          if (p.y < -10) Object.assign(p, spawn(false), { y: h + 10 });
        } else if (type === 'bokeh') {
          p.x += p.vx * dt; p.y += p.vy * dt;
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          g.addColorStop(0, color.replace(/[\d.]+\)$/g, `${p.a.toFixed(2)})`));
          g.addColorStop(1, color.replace(/[\d.]+\)$/g, '0)'));
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
          if (p.x < -30) p.x = w + 30; if (p.x > w + 30) p.x = -30;
          if (p.y < -30) p.y = h + 30; if (p.y > h + 30) p.y = -30;
        } else {
          p.x += p.vx * dt; p.y += p.vy * dt;
          ctx.fillStyle = color.replace(/[\d.]+\)$/g, `${p.a.toFixed(2)})`);
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
          if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
          if (p.y < -10) p.y = h + 10; if (p.y > h + 10) p.y = -10;
        }
      }

      if (now > nextFlash) {
        const el = flashRef.current;
        if (el) {
          el.style.transition = 'none';
          el.style.opacity = '0.55';
          requestAnimationFrame(() => {
            el.style.transition = 'opacity 900ms ease';
            el.style.opacity = '0';
          });
        }
        nextFlash = now + rnd(3200, 7000);
      }

      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [theme.particle, theme.particleColor, theme.lightning]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: image ? `url(${image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', opacity: image ? 1 : 0, transition: 'opacity 1200ms ease' }} />
      <div style={{ position: 'absolute', inset: 0, background: theme.bg, opacity: image ? 0.42 : 1, transition: 'background 1200ms ease, opacity 1200ms ease' }} />
      <div style={{ position: 'absolute', inset: '-20%', background: `radial-gradient(40% 40% at 30% 25%, ${theme.glow}, transparent 70%)`, animation: 'drift 26s ease-in-out infinite', transition: 'background 1200ms ease' }} />
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 120% at 50% 50%, transparent 55%, rgba(0,0,0,0.34) 100%)', pointerEvents: 'none' }} />
      <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      <div ref={flashRef} style={{ position: 'absolute', inset: 0, background: 'rgba(220,232,248,1)', opacity: 0, pointerEvents: 'none', mixBlendMode: 'screen' }} />
    </div>
  );
}
