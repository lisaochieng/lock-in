/* ===========================================================
   AmbientBackground — clean cinematic backdrop per vibe.
   Just the selected space image with a dark vibe tint.
   No particles, orbs, glow, grain or other decorations.
   =========================================================== */
import React from 'react';

export default function AmbientBackground({ theme, image }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: image ? `url(${image})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: image ? 1 : 0,
          transition: 'opacity 1200ms ease',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: theme.bg,
          opacity: image ? 0.42 : 1,
          transition: 'background 1200ms ease, opacity 1200ms ease',
        }}
      />
    </div>
  );
}
