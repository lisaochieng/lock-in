/* ===========================================================
   lock-tf-in — theme system
   Each "vibe" (category) re-tints the entire UI. snow = bright,
   rain = cool blue, forest = sage, fireplace = ember, etc.
   Ported from the claude.ai/design "lock-tf-in" study space.
   =========================================================== */

// glass tokens for dark vibes (light text on a dark scene)
const DARK = {
  tone: 'dark',
  text: '#f3ede2',
  textDim: 'rgba(243,237,226,0.64)',
  textFaint: 'rgba(243,237,226,0.42)',
  panelBg: 'rgba(30,25,20,0.46)',
  panelBorder: 'rgba(245,238,225,0.15)',
  chipBg: 'rgba(245,238,225,0.08)',
  chipBorder: 'rgba(245,238,225,0.13)',
  chipText: 'rgba(243,237,226,0.80)',
  fieldBg: 'rgba(245,238,225,0.07)',
  fieldBorder: 'rgba(245,238,225,0.15)',
  railBg: 'rgba(24,20,16,0.55)',
  trackBg: 'rgba(245,238,225,0.13)',
};

// glass tokens for bright vibes (dark text on a bright scene)
const LIGHT = {
  tone: 'light',
  text: '#3d382e',
  textDim: 'rgba(61,56,46,0.64)',
  textFaint: 'rgba(61,56,46,0.42)',
  panelBg: 'rgba(250,246,238,0.58)',
  panelBorder: 'rgba(255,255,255,0.78)',
  chipBg: 'rgba(61,56,46,0.06)',
  chipBorder: 'rgba(61,56,46,0.10)',
  chipText: 'rgba(61,56,46,0.74)',
  fieldBg: 'rgba(255,255,255,0.6)',
  fieldBorder: 'rgba(61,56,46,0.10)',
  railBg: 'rgba(250,246,238,0.6)',
  trackBg: 'rgba(61,56,46,0.12)',
};

const mk = (base, extra) => Object.assign({}, base, extra);

export const THEMES = {
  rain: mk(DARK, {
    accent: '#8fb1d6', accentInk: '#0e161e',
    bg: 'radial-gradient(130% 95% at 72% 8%, #2c3c4b 0%, #1a2530 46%, #0d151d 100%)',
    glow: 'rgba(143,177,214,0.22)', particle: 'rain', particleColor: 'rgba(176,200,224,0.55)',
  }),
  forest: mk(DARK, {
    accent: '#9cc0a4', accentInk: '#0d150f',
    bg: 'radial-gradient(130% 95% at 30% 8%, #29402f 0%, #1a2a1d 46%, #0d150f 100%)',
    glow: 'rgba(156,192,164,0.20)', particle: 'mote', particleColor: 'rgba(196,222,196,0.45)',
  }),
  beach: mk(DARK, {
    accent: '#cdbb9a', accentInk: '#231d14',
    bg: 'radial-gradient(130% 100% at 50% 4%, #5a5645 0%, #3a4244 46%, #20292e 100%)',
    glow: 'rgba(205,187,154,0.20)', particle: 'mote', particleColor: 'rgba(232,220,196,0.40)',
  }),
  cafe: mk(DARK, {
    accent: '#cda985', accentInk: '#1a120c',
    bg: 'radial-gradient(130% 95% at 32% 4%, #3c2e23 0%, #281d16 46%, #160f0a 100%)',
    glow: 'rgba(205,169,133,0.20)', particle: 'mote', particleColor: 'rgba(224,196,160,0.35)',
  }),
  library: mk(DARK, {
    accent: '#c6ad7e', accentInk: '#16100a',
    bg: 'radial-gradient(130% 95% at 42% 4%, #362b1e 0%, #241c13 46%, #140f09 100%)',
    glow: 'rgba(198,173,126,0.18)', particle: 'mote', particleColor: 'rgba(220,200,150,0.32)',
  }),
  fireplace: mk(DARK, {
    accent: '#dca079', accentInk: '#180b06',
    bg: 'radial-gradient(120% 100% at 62% 92%, #4d2c1d 0%, #2a1810 46%, #140a06 100%)',
    glow: 'rgba(220,160,121,0.28)', particle: 'spark', particleColor: 'rgba(240,168,110,0.70)',
  }),
  'night city': mk(DARK, {
    accent: '#a6a0d6', accentInk: '#0d0c16',
    bg: 'radial-gradient(130% 95% at 72% 8%, #2c2944 0%, #1a182b 46%, #0d0c16 100%)',
    glow: 'rgba(166,160,214,0.24)', particle: 'bokeh', particleColor: 'rgba(186,180,224,0.45)',
  }),
  snow: mk(LIGHT, {
    accent: '#6f93b2', accentInk: '#ffffff',
    bg: 'radial-gradient(130% 100% at 50% 0%, #f1f6fa 0%, #d9e4ec 46%, #c1d2dc 100%)',
    glow: 'rgba(111,147,178,0.18)', particle: 'snow', particleColor: 'rgba(255,255,255,0.92)',
  }),
  'japanese garden': mk(DARK, {
    accent: '#cda6b3', accentInk: '#1a1216',
    bg: 'radial-gradient(130% 95% at 35% 8%, #33392a 0%, #283021 46%, #161c12 100%)',
    glow: 'rgba(205,166,179,0.20)', particle: 'petal', particleColor: 'rgba(232,196,206,0.55)',
  }),
  underwater: mk(DARK, {
    accent: '#7fc1cb', accentInk: '#06171c',
    bg: 'radial-gradient(130% 100% at 50% 0%, #16454d 0%, #0e2f37 46%, #061920 100%)',
    glow: 'rgba(127,193,203,0.24)', particle: 'bubble', particleColor: 'rgba(180,224,228,0.45)',
  }),
  rooftop: mk(DARK, {
    accent: '#c9a6c0', accentInk: '#161024',
    bg: 'radial-gradient(130% 100% at 50% 2%, #4d3a55 0%, #2f2740 44%, #181426 100%)',
    glow: 'rgba(201,166,192,0.22)', particle: 'bokeh', particleColor: 'rgba(224,190,212,0.40)',
  }),
  thunderstorm: mk(DARK, {
    accent: '#9aabc0', accentInk: '#0b1016',
    bg: 'radial-gradient(130% 95% at 60% 8%, #2b3441 0%, #181f29 46%, #0a0f15 100%)',
    glow: 'rgba(154,171,192,0.20)', particle: 'rain', particleColor: 'rgba(190,205,224,0.50)',
    lightning: true,
  }),
  waterfall: mk(DARK, {
    accent: '#92c4b6', accentInk: '#0a1a17',
    bg: 'radial-gradient(130% 95% at 40% 8%, #214340 0%, #18302c 46%, #0c1a18 100%)',
    glow: 'rgba(146,196,182,0.22)', particle: 'mote', particleColor: 'rgba(196,228,218,0.45)',
  }),
  desert: mk(DARK, {
    accent: '#d8b27a', accentInk: '#1c1408',
    bg: 'radial-gradient(130% 100% at 50% 2%, #5a4a30 0%, #3a2c1b 48%, #1e1610 100%)',
    glow: 'rgba(216,178,122,0.22)', particle: 'mote', particleColor: 'rgba(228,200,150,0.40)',
  }),
  mountains: mk(DARK, {
    accent: '#9fb4c6', accentInk: '#0e151c',
    bg: 'radial-gradient(130% 95% at 50% 6%, #34404c 0%, #232d36 46%, #121922 100%)',
    glow: 'rgba(159,180,198,0.20)', particle: 'mote', particleColor: 'rgba(200,216,230,0.40)',
  }),
  train: mk(DARK, {
    accent: '#c8ab86', accentInk: '#18120b',
    bg: 'radial-gradient(130% 95% at 40% 8%, #3a2f24 0%, #271f17 46%, #14100b 100%)',
    glow: 'rgba(200,171,134,0.20)', particle: 'rain', particleColor: 'rgba(206,196,176,0.45)',
  }),
  'airplane window': mk(DARK, {
    accent: '#8fb6da', accentInk: '#0b141e',
    bg: 'radial-gradient(130% 100% at 56% 4%, #2a3b50 0%, #1a2638 46%, #0c131f 100%)',
    glow: 'rgba(143,182,218,0.22)', particle: 'bokeh', particleColor: 'rgba(186,208,232,0.42)',
  }),
  'rice fields': mk(DARK, {
    accent: '#a8c585', accentInk: '#121a0c',
    bg: 'radial-gradient(130% 95% at 36% 8%, #324024 0%, #25301b 46%, #131a0f 100%)',
    glow: 'rgba(168,197,133,0.20)', particle: 'mote', particleColor: 'rgba(206,224,170,0.42)',
  }),
  'cherry blossom': mk(DARK, {
    accent: '#e8aec4', accentInk: '#1c1216',
    bg: 'radial-gradient(130% 95% at 40% 6%, #4a2f3a 0%, #2f2128 46%, #181215 100%)',
    glow: 'rgba(232,174,196,0.22)', particle: 'petal', particleColor: 'rgba(244,194,212,0.60)',
  }),
  arctic: mk(DARK, {
    accent: '#8ed6c6', accentInk: '#06181a',
    bg: 'radial-gradient(130% 100% at 50% 2%, #163b40 0%, #122a30 46%, #08161c 100%)',
    glow: 'rgba(142,214,198,0.26)', particle: 'snow', particleColor: 'rgba(214,244,238,0.85)',
  }),
  savanna: mk(DARK, {
    accent: '#dab06a', accentInk: '#1a1206',
    bg: 'radial-gradient(130% 100% at 54% 4%, #574425 0%, #3a2d18 46%, #1d160d 100%)',
    glow: 'rgba(218,176,106,0.22)', particle: 'mote', particleColor: 'rgba(234,206,150,0.40)',
  }),
  'lavender field': mk(DARK, {
    accent: '#b9a8da', accentInk: '#161024',
    bg: 'radial-gradient(130% 95% at 40% 6%, #3e3559 0%, #2b2540 46%, #161226 100%)',
    glow: 'rgba(185,168,218,0.22)', particle: 'petal', particleColor: 'rgba(208,194,236,0.50)',
  }),
  'morning fog': mk(LIGHT, {
    accent: '#7d96a0', accentInk: '#ffffff',
    bg: 'radial-gradient(130% 100% at 50% 0%, #e8eef0 0%, #cdd8da 48%, #b3c1c4 100%)',
    glow: 'rgba(125,150,160,0.16)', particle: 'mote', particleColor: 'rgba(255,255,255,0.75)',
  }),
  canal: mk(DARK, {
    accent: '#cdb083', accentInk: '#18120a',
    bg: 'radial-gradient(130% 95% at 44% 6%, #463a28 0%, #2f281b 46%, #181410 100%)',
    glow: 'rgba(205,176,131,0.20)', particle: 'mote', particleColor: 'rgba(224,202,164,0.38)',
  }),
  treehouse: mk(DARK, {
    accent: '#9cc28f', accentInk: '#0d150f',
    bg: 'radial-gradient(130% 95% at 36% 8%, #2a3f29 0%, #1e2d1e 46%, #101a11 100%)',
    glow: 'rgba(156,194,143,0.22)', particle: 'rain', particleColor: 'rgba(196,224,190,0.45)',
  }),
  'cozy bedroom': mk(DARK, {
    accent: '#d8a98a', accentInk: '#1a100a',
    bg: 'radial-gradient(120% 100% at 60% 90%, #4a3023 0%, #2c1d15 46%, #150d09 100%)',
    glow: 'rgba(216,169,138,0.24)', particle: 'rain', particleColor: 'rgba(232,200,180,0.45)',
  }),
};

export const QUOTES = [
  'small steps, taken quietly, still carry you the whole way.',
  'the quiet hour is where it happens.',
  'breathe. begin. continue.',
  'you don’t have to rush to go far.',
  'one page, then another.',
  'stillness is also progress.',
  'let the rain think alongside you.',
  'slow is smooth, and smooth is far.',
];

export function themeFor(category) {
  return THEMES[category] || THEMES.rain;
}
