/* ===========================================================
   Study spaces — each backed by a calm YouTube ambience.
   The scene thumbnail doubles as the cinematic backdrop.
   =========================================================== */

const thumb = (id) => `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;

export const spaces = [
  // rain
  { id: 'rainy-library', name: 'rainy village', category: 'rain', mood: 'deep reading', video: '6ntUefWpN40' },
  { id: 'rain-on-window', name: 'rain on window', category: 'rain', mood: 'slow notes', video: 'JzlYA5iYkEE' },
  { id: 'quiet-rainstorm', name: 'quiet study rain', category: 'rain', mood: 'quiet focus', video: 'LmFXjuuIDOE' },

  // forest
  { id: 'forest-cabin', name: 'woodland birdsong', category: 'forest', mood: 'calm recall', video: 'XxP8kxUn5bc' },
  { id: 'forest-stream', name: 'forest stream', category: 'forest', mood: 'gentle review', video: 'JsyMl9uz4rQ' },
  { id: 'ancient-woods', name: 'ancient woods', category: 'forest', mood: 'light tasks', video: 'Qm846KdZN_c' },

  // beach
  { id: 'ocean-window', name: 'ocean shore', category: 'beach', mood: 'slow planning', video: 'dxNg3q1n2HI' },
  { id: 'rolling-waves', name: 'rolling waves', category: 'beach', mood: 'easy reading', video: 'Q9a86gbpbjU' },
  { id: 'greek-cove', name: 'greek cove', category: 'beach', mood: 'bright focus', video: '_iPgznUNWbU' },

  // cafe
  { id: 'cozy-cafe', name: 'cozy cafe', category: 'cafe', mood: 'essay flow', video: 'MYPVQccHhAQ' },
  { id: 'winter-cafe', name: 'winter cafe', category: 'cafe', mood: 'warm grind', video: 'jh4C7w-dvho' },
  { id: 'new-york-cafe', name: 'new york cafe', category: 'cafe', mood: 'light writing', video: 'PRAGLqfNK1o' },

  // library
  { id: 'sunlit-archive', name: 'study library', category: 'library', mood: 'research mode', video: 'eXGwSlxeG0k' },
  { id: 'gothic-manor', name: 'gothic manor', category: 'library', mood: 'deep study', video: '6orVoBwfGSA' },
  { id: 'rainy-library-jazz', name: 'rainy library', category: 'library', mood: 'exam prep', video: 'FbrJJxntUws' },

  // fireplace
  { id: 'fireside-cabin', name: 'fireside cabin', category: 'fireplace', mood: 'cozy recall', video: 'IJf4QMPEbOI' },
  { id: 'crackling-hearth', name: 'crackling hearth', category: 'fireplace', mood: 'warm reading', video: 'cuPPcx9KRVw' },
  { id: 'ember-glow', name: 'ember glow', category: 'fireplace', mood: 'slow focus', video: 'GDEWcq1us48' },

  // night city
  { id: 'night-focus', name: 'neon city rain', category: 'night city', mood: 'quiet grind', video: 'DKOFLh6fNas' },
  { id: 'neon-walk', name: 'neon walk', category: 'night city', mood: 'midnight flow', video: 'AJOepyLmMBU' },
  { id: 'city-drive', name: 'city drive', category: 'night city', mood: 'late session', video: '0GZUoICMpuU' },

  // snow
  { id: 'snowy-evening', name: 'snowy forest', category: 'snow', mood: 'exam prep', video: 'JFajK-Nn49w' },
  { id: 'snow-lake', name: 'snow on the lake', category: 'snow', mood: 'calm recall', video: 'jh_KFTYJnDo' },
  { id: 'forest-blizzard', name: 'forest blizzard', category: 'snow', mood: 'slow notes', video: 'MEnbuMfbM9c' },

  // japanese garden
  { id: 'zen-garden', name: 'zen garden', category: 'japanese garden', mood: 'mindful study', video: 'nKjeWnUn7sc' },
  { id: 'bamboo-fountain', name: 'bamboo fountain', category: 'japanese garden', mood: 'gentle review', video: '4WQ1lsikdQE' },
  { id: 'koi-garden', name: 'koi garden', category: 'japanese garden', mood: 'calm recall', video: 'aJaZc4E8Y4U' },

  // underwater
  { id: 'coral-reef', name: 'coral reef', category: 'underwater', mood: 'slow planning', video: 'eHxbMa2RVTQ' },
  { id: 'reef-aquarium', name: 'reef aquarium', category: 'underwater', mood: 'easy reading', video: 'NE2-H5Br-C8' },
  { id: 'deep-reef', name: 'deep reef', category: 'underwater', mood: 'calm focus', video: 'hZ8YuF82QAQ' },

  // rooftop
  { id: 'rooftop-sunset', name: 'rooftop sunset', category: 'rooftop', mood: 'soft focus', video: 'YuYSDNcwVgg' },
  { id: 'open-window-night', name: 'open window night', category: 'rooftop', mood: 'late session', video: 'Vg1mpD1BICI' },

  // thunderstorm
  { id: 'rolling-thunder', name: 'rolling thunder', category: 'thunderstorm', mood: 'deep focus', video: 'aLcTO3tnnKo' },
  { id: 'night-storm', name: 'night storm', category: 'thunderstorm', mood: 'quiet grind', video: 'o2VbPkxrBa4' },
  { id: 'cabin-storm', name: 'cabin storm', category: 'thunderstorm', mood: 'cozy recall', video: 'rturNpd-D6s' },

  // waterfall
  { id: 'forest-waterfall', name: 'forest waterfall', category: 'waterfall', mood: 'fresh focus', video: 'wGXRyO0zhqE' },
  { id: 'cascading-falls', name: 'cascading falls', category: 'waterfall', mood: 'easy flow', video: 'eG3RL02umkk' },
].map((space) => ({ ...space, image: thumb(space.video) }));

export const categories = ['all', ...new Set(spaces.map((item) => item.category))];

export function extractYouTubeId(value) {
  const trimmed = value.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('youtu.be')) return url.pathname.slice(1, 12);
    if (url.searchParams.get('v')) return url.searchParams.get('v').slice(0, 11);
    return url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/)?.[1] || '';
  } catch {
    return '';
  }
}
