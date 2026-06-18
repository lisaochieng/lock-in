/* ===========================================================
   Study spaces — each backed by a calm YouTube ambience.
   Thumbnails are hand-picked Unsplash photos (clean, no logos).
   `startAt` skips past each video's intro / title cards.
   =========================================================== */

const unsplash = (id) => `https://images.unsplash.com/photo-${id}?w=800&h=450&fit=crop&q=90`;

// Short "vibe" tags per category, e.g. "lo-fi · cozy".
const VIBES = {
  rain: 'rainy · calm',
  forest: 'nature · fresh',
  beach: 'waves · breezy',
  cafe: 'lo-fi · cozy',
  library: 'quiet · focused',
  fireplace: 'warm · cozy',
  'night city': 'neon · moody',
  snow: 'icy · serene',
  'japanese garden': 'zen · gentle',
  underwater: 'aqua · dreamy',
  rooftop: 'sunset · chill',
  thunderstorm: 'stormy · deep',
  waterfall: 'fresh · flowing',
  desert: 'arid · vast',
  mountains: 'alpine · crisp',
  train: 'journey · rhythmic',
  'airplane window': 'skybound · hushed',
  'rice fields': 'verdant · still',
  'cherry blossom': 'sakura · soft',
  arctic: 'aurora · frozen',
  savanna: 'wild · golden',
  'lavender field': 'floral · mellow',
  'morning fog': 'misty · quiet',
  canal: 'old-world · gentle',
  treehouse: 'leafy · snug',
  'cozy bedroom': 'snug · sleepy',
};

export const spaces = [
  // rain — cool slate greys
  { id: 'rainy-library', name: 'rainy village', category: 'rain', mood: 'deep reading', video: '6ntUefWpN40', startAt: 30, image: unsplash('1493314894560-5c412a56c17c') },
  { id: 'rain-on-window', name: 'rain on window', category: 'rain', mood: 'slow notes', video: 'JzlYA5iYkEE', startAt: 20, image: unsplash('1428592953211-077101b2021b') },
  { id: 'quiet-rainstorm', name: 'quiet study rain', category: 'rain', mood: 'quiet focus', video: 'LmFXjuuIDOE', startAt: 15, image: unsplash('1519692933481-e162a57d6721') },

  // forest — sage greens
  { id: 'forest-cabin', name: 'woodland birdsong', category: 'forest', mood: 'calm recall', video: 'XxP8kxUn5bc', startAt: 20, image: unsplash('1441974231531-c6227db76b6e') },
  { id: 'forest-stream', name: 'forest stream', category: 'forest', mood: 'gentle review', video: 'JsyMl9uz4rQ', startAt: 30, image: unsplash('1448375240586-882707db888b') },
  { id: 'ancient-woods', name: 'ancient woods', category: 'forest', mood: 'light tasks', video: 'Qm846KdZN_c', startAt: 30, image: unsplash('1500530855697-b586d89ba3ee') },

  // beach — soft teals
  { id: 'ocean-window', name: 'ocean shore', category: 'beach', mood: 'slow planning', video: 'dxNg3q1n2HI', startAt: 30, image: unsplash('1507525428034-b723cf961d3e') },
  { id: 'rolling-waves', name: 'rolling waves', category: 'beach', mood: 'easy reading', video: 'Q9a86gbpbjU', startAt: 30, image: unsplash('1505228395891-9a51e7e86bf6') },
  { id: 'greek-cove', name: 'greek cove', category: 'beach', mood: 'bright focus', video: '_iPgznUNWbU', startAt: 30, image: unsplash('1473116763249-2faaef81ccda') },

  // cafe — warm amber
  { id: 'cozy-cafe', name: 'cozy cafe', category: 'cafe', mood: 'essay flow', video: 'MYPVQccHhAQ', startAt: 20, image: unsplash('1554118811-1e0d58224f24') },
  { id: 'winter-cafe', name: 'winter cafe', category: 'cafe', mood: 'warm grind', video: 'jh4C7w-dvho', startAt: 20, image: unsplash('1501339847302-ac426a4a7cbb') },
  { id: 'new-york-cafe', name: 'new york cafe', category: 'cafe', mood: 'light writing', video: 'PRAGLqfNK1o', startAt: 20, image: unsplash('1445116572660-236099ec97a0') },

  // library — parchment gold
  { id: 'sunlit-archive', name: 'study library', category: 'library', mood: 'research mode', video: 'eXGwSlxeG0k', startAt: 20, image: unsplash('1507842217343-583bb7270b66') },
  { id: 'gothic-manor', name: 'gothic manor', category: 'library', mood: 'deep study', video: 'O9ZmAGVWCNY', startAt: 30, image: unsplash('1521587760476-6c12a4b040da') },
  { id: 'rainy-library-jazz', name: 'rainy library', category: 'library', mood: 'exam prep', video: 'FbrJJxntUws', startAt: 30, image: unsplash('1481627834876-b7833e8f5570') },

  // fireplace — warm ember
  { id: 'fireside-cabin', name: 'fireside cabin', category: 'fireplace', mood: 'cozy recall', video: 'IJf4QMPEbOI', startAt: 20, image: unsplash('1543599538-a6c4f6cc5c05') },
  { id: 'crackling-hearth', name: 'crackling hearth', category: 'fireplace', mood: 'warm reading', video: 'cuPPcx9KRVw', startAt: 20, image: unsplash('1476611317561-60117649dd94') },
  { id: 'ember-glow', name: 'ember glow', category: 'fireplace', mood: 'slow focus', video: 'GDEWcq1us48', startAt: 20, image: unsplash('1513694203232-719a280e022f') },

  // night city — deep purples
  { id: 'night-focus', name: 'neon city rain', category: 'night city', mood: 'quiet grind', video: 'DKOFLh6fNas', startAt: 30, image: unsplash('1480714378408-67cf0d13bc1b') },
  { id: 'neon-walk', name: 'neon walk', category: 'night city', mood: 'midnight flow', video: 'AJOepyLmMBU', startAt: 45, image: unsplash('1493976040374-85c8e12f0c0e') },
  { id: 'city-drive', name: 'city drive', category: 'night city', mood: 'late session', video: '0GZUoICMpuU', startAt: 20, image: unsplash('1449824913935-59a10b8d2000') },

  // snow — icy blues
  { id: 'snowy-evening', name: 'snowy forest', category: 'snow', mood: 'exam prep', video: 'JFajK-Nn49w', startAt: 20, image: unsplash('1483664852095-d6cc6870702d') },
  { id: 'snow-lake', name: 'snow on the lake', category: 'snow', mood: 'calm recall', video: 'jh_KFTYJnDo', startAt: 20, image: unsplash('1517299321609-52687d1bc55a') },
  { id: 'forest-blizzard', name: 'forest blizzard', category: 'snow', mood: 'slow notes', video: 'MEnbuMfbM9c', startAt: 20, image: unsplash('1491002052546-bf38f186af56') },

  // japanese garden — sakura + green
  { id: 'zen-garden', name: 'zen garden', category: 'japanese garden', mood: 'mindful study', video: 'nKjeWnUn7sc', startAt: 30, image: unsplash('1503640538573-148065ba4904') },
  { id: 'bamboo-fountain', name: 'bamboo fountain', category: 'japanese garden', mood: 'gentle review', video: '4WQ1lsikdQE', startAt: 20, image: unsplash('1492571350019-22de08371fd3') },
  { id: 'koi-garden', name: 'koi garden', category: 'japanese garden', mood: 'calm recall', video: 'aJaZc4E8Y4U', startAt: 20, image: unsplash('1480796927426-f609979314bd') },

  // underwater — aqua
  { id: 'coral-reef', name: 'coral reef', category: 'underwater', mood: 'slow planning', video: 'eHxbMa2RVTQ', startAt: 20, image: unsplash('1518837695005-2083093ee35b') },
  { id: 'reef-aquarium', name: 'reef aquarium', category: 'underwater', mood: 'easy reading', video: 'NE2-H5Br-C8', startAt: 20, image: unsplash('1530053969600-caed2596d242') },
  { id: 'deep-reef', name: 'deep reef', category: 'underwater', mood: 'calm focus', video: 'hZ8YuF82QAQ', startAt: 30, image: unsplash('1559827260-dc66d52bef19') },

  // rooftop — dusky rose
  { id: 'rooftop-sunset', name: 'rooftop sunset', category: 'rooftop', mood: 'soft focus', video: 'YuYSDNcwVgg', startAt: 30, image: unsplash('1519501025264-65ba15a82390') },
  { id: 'open-window-night', name: 'open window night', category: 'rooftop', mood: 'late session', video: 'Vg1mpD1BICI', startAt: 30, image: unsplash('1470770841072-f978cf4d019e') },

  // thunderstorm — stormy slate
  { id: 'rolling-thunder', name: 'rolling thunder', category: 'thunderstorm', mood: 'deep focus', video: 'aLcTO3tnnKo', startAt: 30, image: unsplash('1605727216801-e27ce1d0cc28') },
  { id: 'night-storm', name: 'night storm', category: 'thunderstorm', mood: 'quiet grind', video: 'o2VbPkxrBa4', startAt: 60, image: unsplash('1500674425229-f692875b0ab7') },
  { id: 'cabin-storm', name: 'cabin storm', category: 'thunderstorm', mood: 'cozy recall', video: 'rturNpd-D6s', startAt: 30, image: unsplash('1429552077091-836152271555') },

  // waterfall — fresh teal-green
  { id: 'forest-waterfall', name: 'forest waterfall', category: 'waterfall', mood: 'fresh focus', video: 'wGXRyO0zhqE', startAt: 20, image: unsplash('1432405972618-c60b0225b8f9') },
  { id: 'cascading-falls', name: 'cascading falls', category: 'waterfall', mood: 'easy flow', video: 'eG3RL02umkk', startAt: 20, image: unsplash('1467890947394-8171244e5410') },

  // desert — warm sand
  { id: 'desert-dunes', name: 'desert dunes', category: 'desert', mood: 'deep stillness', video: '8l6gMrlp-Ss', startAt: 30, image: unsplash('1473580044384-7ba9967e16a0') },
  { id: 'sahara-wind', name: 'sahara wind', category: 'desert', mood: 'slow focus', video: 'myKHHlX2NAY', startAt: 30, image: unsplash('1509316785289-025f5b846b35') },

  // mountains — cool stone
  { id: 'alpine-peak', name: 'alpine peak', category: 'mountains', mood: 'clear mind', video: 'iT67jHkJVn8', startAt: 30, image: unsplash('1454496522488-7a8e488e8606') },
  { id: 'mountain-lake', name: 'mountain lake', category: 'mountains', mood: 'calm recall', video: '-nPprpooRnI', startAt: 30, image: unsplash('1506905925346-21bda4d32df4') },

  // train — cozy travel
  { id: 'night-train', name: 'night train', category: 'train', mood: 'slow notes', video: 'QrldKgvsCB4', startAt: 30, image: unsplash('1517524008697-84bbe3c3fd98') },
  { id: 'vintage-train', name: 'vintage train', category: 'train', mood: 'gentle review', video: 'iI8R8rrDRkk', startAt: 30, image: unsplash('1474487548417-781cb71495f3') },

  // airplane window — sky blue
  { id: 'window-seat', name: 'window seat', category: 'airplane window', mood: 'quiet focus', video: 'co7KgV2edvI', startAt: 30, image: unsplash('1436491865332-7a61a109cc05') },
  { id: 'night-flight', name: 'night flight', category: 'airplane window', mood: 'late session', video: 'LhxrqkShWs0', startAt: 45, image: unsplash('1474302770737-173ee21bab63') },

  // rice fields — green terraces
  { id: 'rice-terraces', name: 'rice terraces', category: 'rice fields', mood: 'morning pages', video: 'LzQbASHAwn4', startAt: 5, image: unsplash('1502086223501-7ea6ecd79368') },

  // cherry blossom — soft pink
  { id: 'cherry-blossom', name: 'cherry blossom', category: 'cherry blossom', mood: 'fresh start', video: '1zYkuUmLOL4', startAt: 30, image: unsplash('1522383225653-ed111181a951') },
  { id: 'rainy-sakura', name: 'rainy sakura', category: 'cherry blossom', mood: 'soft focus', video: 'zS0rSzRQyWE', startAt: 60, image: unsplash('1490806843957-31f4c9a91c65') },

  // arctic — aurora ice
  { id: 'aurora-night', name: 'aurora night', category: 'arctic', mood: 'dream focus', video: 'ncSljkJ7Y3M', startAt: 20, image: unsplash('1483347756197-71ef80e95f73') },
  { id: 'arctic-camp', name: 'arctic campfire', category: 'arctic', mood: 'cozy recall', video: 'WKpNukcZKD4', startAt: 30, image: unsplash('1531366936337-7c912a4589a7') },

  // savanna — golden plains
  { id: 'savanna-dawn', name: 'savanna dawn', category: 'savanna', mood: 'gentle review', video: 'mS11b7dSuxI', startAt: 30, image: unsplash('1516426122078-c23e76319801') },
  { id: 'savanna-waterhole', name: 'savanna waterhole', category: 'savanna', mood: 'light tasks', video: 'iGesdx8lDGY', startAt: 20, image: unsplash('1534177616072-ef7dc120449d') },

  // lavender field — soft purple
  { id: 'lavender-field', name: 'lavender field', category: 'lavender field', mood: 'easy reading', video: 'z8_ir_Dbegk', startAt: 30, image: unsplash('1499002238440-d264edd596ec') },

  // morning fog — misty light
  { id: 'misty-lake', name: 'misty lake', category: 'morning fog', mood: 'slow planning', video: 'PG2A0WhqGPQ', startAt: 20, image: unsplash('1470071459604-3b5ec3a7fe05') },
  { id: 'foggy-forest', name: 'foggy forest', category: 'morning fog', mood: 'quiet focus', video: 'pFjVC9dBDCA', startAt: 20, image: unsplash('1487621167305-5d248087c724') },

  // canal — venetian water
  { id: 'venice-canal', name: 'venice canal', category: 'canal', mood: 'easy reading', video: 'riZWEoGKyuU', startAt: 60, image: unsplash('1523906834658-6e24ef2386f9') },
  { id: 'canal-morning', name: 'canal morning', category: 'canal', mood: 'light writing', video: 'VW_eRA4H1Yc', startAt: 30, image: unsplash('1514890547357-a9ee288728e0') },

  // treehouse — jungle green
  { id: 'jungle-treehouse', name: 'jungle treehouse', category: 'treehouse', mood: 'calm focus', video: 'oWYoqDLLhy4', startAt: 30, image: unsplash('1469854523086-cc02fe5d8800') },
  { id: 'forest-treehouse', name: 'forest treehouse', category: 'treehouse', mood: 'cozy recall', video: 'i2XHIGfNP4w', startAt: 30, image: unsplash('1488462237308-ecaa28b729d7') },

  // cozy bedroom — warm amber
  { id: 'cozy-bedroom', name: 'cozy bedroom', category: 'cozy bedroom', mood: 'slow notes', video: '6z2NhKfpWFw', startAt: 30, image: unsplash('1586023492125-27b2c045efd7') },
  { id: 'rainy-bedroom', name: 'rainy bedroom', category: 'cozy bedroom', mood: 'late session', video: '0Y4lwRWDDGY', startAt: 30, image: unsplash('1522771739844-6a9f6d5f14af') },

  // nature — rain, storm, ocean, forest, stream, snow, fire
  { id: 'open-window-rain', name: 'open window rain', category: 'nature', mood: 'deep sleep', video: 'XhAhviQaxpQ', startAt: 20, image: 'https://img.youtube.com/vi/XhAhviQaxpQ/mqdefault.jpg' },
  { id: 'cabin-thunderstorm', name: 'cabin thunderstorm', category: 'nature', mood: 'cozy shelter', video: 'YEHTUZnIU7Q', startAt: 25, image: 'https://img.youtube.com/vi/YEHTUZnIU7Q/mqdefault.jpg' },
  { id: 'atlantic-shore', name: 'atlantic shore', category: 'nature', mood: 'slow waves', video: 'XO2uMgx4EyQ', startAt: 30, image: 'https://img.youtube.com/vi/XO2uMgx4EyQ/mqdefault.jpg' },
  { id: 'forest-rain-wind', name: 'forest rain', category: 'nature', mood: 'misty focus', video: 'bhWJF9FlBqM', startAt: 20, image: 'https://img.youtube.com/vi/bhWJF9FlBqM/mqdefault.jpg' },
  { id: 'gentle-creek', name: 'gentle creek', category: 'nature', mood: 'soft flow', video: 'ttrLXu2vWh4', startAt: 25, image: 'https://img.youtube.com/vi/ttrLXu2vWh4/mqdefault.jpg' },
  { id: 'mountain-snowfall', name: 'mountain snowfall', category: 'nature', mood: 'winter calm', video: 'nrf9q5_YPXg', startAt: 20, image: 'https://img.youtube.com/vi/nrf9q5_YPXg/mqdefault.jpg' },
  { id: 'campfire-rain-cabin', name: 'campfire rain', category: 'nature', mood: 'warm shelter', video: 'UsPQHfg_Xls', startAt: 20, image: 'https://img.youtube.com/vi/UsPQHfg_Xls/mqdefault.jpg' },

  // city — tokyo, nyc, paris, london, traffic, korean cafe, night rain
  { id: 'tokyo-rain-walk', name: 'tokyo rain walk', category: 'city', mood: 'neon stroll', video: 'Et7O5-CzJZg', startAt: 30, image: 'https://img.youtube.com/vi/Et7O5-CzJZg/mqdefault.jpg' },
  { id: 'nyc-rainy-night', name: 'nyc rainy night', category: 'city', mood: 'window gaze', video: '8yAswsEv6o4', startAt: 25, image: 'https://img.youtube.com/vi/8yAswsEv6o4/mqdefault.jpg' },
  { id: 'paris-cafe-rain', name: 'paris cafe rain', category: 'city', mood: 'evening glow', video: 'TSqa1iAckg0', startAt: 30, image: 'https://img.youtube.com/vi/TSqa1iAckg0/mqdefault.jpg' },
  { id: 'london-rain-library', name: 'london rain library', category: 'city', mood: 'secret stacks', video: 'PY0Mh0HwSlI', startAt: 20, image: 'https://img.youtube.com/vi/PY0Mh0HwSlI/mqdefault.jpg' },
  { id: 'city-traffic-rain', name: 'city traffic rain', category: 'city', mood: 'distant hum', video: 'WKbdTKaAJuk', startAt: 15, image: 'https://img.youtube.com/vi/WKbdTKaAJuk/mqdefault.jpg' },
  { id: 'korean-library-cafe', name: 'korean library cafe', category: 'city', mood: 'campus focus', video: 'kaX0P60-PYo', startAt: 20, image: 'https://img.youtube.com/vi/kaX0P60-PYo/mqdefault.jpg' },
  { id: 'shibuya-rain-night', name: 'shibuya rain night', category: 'city', mood: 'urban hush', video: 'sAkVnhthpMI', startAt: 30, image: 'https://img.youtube.com/vi/sAkVnhthpMI/mqdefault.jpg' },

  // cozy — cafe, bookshop, fireplace, library, vintage shop, rainy cafe, reading nook
  { id: 'coffee-shop-asmr', name: 'coffee shop hush', category: 'cozy', mood: 'gentle bustle', video: 'IqUCjwMMNOw', startAt: 20, image: 'https://img.youtube.com/vi/IqUCjwMMNOw/mqdefault.jpg' },
  { id: 'rainy-bookshop', name: 'rainy bookshop', category: 'cozy', mood: 'page turning', video: 'dr0ymaQQvs8', startAt: 25, image: 'https://img.youtube.com/vi/dr0ymaQQvs8/mqdefault.jpg' },
  { id: 'fireplace-lake-cabin', name: 'fireplace lake cabin', category: 'cozy', mood: 'warm glow', video: 'jRvxCyT-u94', startAt: 20, image: 'https://img.youtube.com/vi/jRvxCyT-u94/mqdefault.jpg' },
  { id: 'antique-bookstore', name: 'antique bookstore', category: 'cozy', mood: 'dusty pages', video: 'VE-leW3U5YU', startAt: 30, image: 'https://img.youtube.com/vi/VE-leW3U5YU/mqdefault.jpg' },
  { id: 'victorian-bookshop', name: 'victorian bookshop', category: 'cozy', mood: 'slow reading', video: 'Xujh1JrWt5U', startAt: 25, image: 'https://img.youtube.com/vi/Xujh1JrWt5U/mqdefault.jpg' },
  { id: 'rainy-cafe-street', name: 'rainy cafe street', category: 'cozy', mood: 'evening jazz', video: 'bEAiLDPIvhA', startAt: 30, image: 'https://img.youtube.com/vi/bEAiLDPIvhA/mqdefault.jpg' },
  { id: 'cabin-reading-nook', name: 'cabin reading nook', category: 'cozy', mood: 'fireside read', video: '1RcVIuZ8Wdk', startAt: 25, image: 'https://img.youtube.com/vi/1RcVIuZ8Wdk/mqdefault.jpg' },

  // study — library, hogwarts, medieval, lo-fi rain, cambridge, traditional hall, jazz cafe
  { id: 'quiet-library-hall', name: 'quiet library', category: 'study', mood: 'exam prep', video: '611MS3-TDH0', startAt: 20, image: 'https://img.youtube.com/vi/611MS3-TDH0/mqdefault.jpg' },
  { id: 'hogwarts-library', name: 'hogwarts library', category: 'study', mood: 'spell notes', video: 'pAHciSqi1-8', startAt: 30, image: 'https://img.youtube.com/vi/pAHciSqi1-8/mqdefault.jpg' },
  { id: 'ancient-library-fire', name: 'ancient library', category: 'study', mood: 'deep lore', video: 'jcGYKf3DsNw', startAt: 25, image: 'https://img.youtube.com/vi/jcGYKf3DsNw/mqdefault.jpg' },
  { id: 'midnight-library-rain', name: 'midnight library', category: 'study', mood: 'no music', video: '2Nz5lnSNEok', startAt: 20, image: 'https://img.youtube.com/vi/2Nz5lnSNEok/mqdefault.jpg' },
  { id: 'cambridge-library', name: 'cambridge library', category: 'study', mood: 'research mode', video: 'R4ihhZ6RO1k', startAt: 20, image: 'https://img.youtube.com/vi/R4ihhZ6RO1k/mqdefault.jpg' },
  { id: 'traditional-library', name: 'traditional library', category: 'study', mood: 'real sounds', video: '2kW8WRvjAnA', startAt: 15, image: 'https://img.youtube.com/vi/2kW8WRvjAnA/mqdefault.jpg' },
  { id: 'jazz-cafe-study', name: 'jazz cafe study', category: 'study', mood: 'smooth focus', video: 'c0_ejQQcrwI', startAt: 30, image: 'https://img.youtube.com/vi/c0_ejQQcrwI/mqdefault.jpg' },

  // nature extended — underwater, rainforest, mountain wind, aurora, desert, bamboo, waterfall
  { id: 'deep-underwater', name: 'deep underwater', category: 'nature extended', mood: 'aqua drift', video: '9xrYE-a_EHs', startAt: 25, image: 'https://img.youtube.com/vi/9xrYE-a_EHs/mqdefault.jpg' },
  { id: 'tropical-rainforest', name: 'tropical rainforest', category: 'nature extended', mood: 'lush canopy', video: 'c9pQYOGIWM8', startAt: 20, image: 'https://img.youtube.com/vi/c9pQYOGIWM8/mqdefault.jpg' },
  { id: 'mountain-wind', name: 'mountain wind', category: 'nature extended', mood: 'alpine air', video: '4jjYt6RWZwE', startAt: 30, image: 'https://img.youtube.com/vi/4jjYt6RWZwE/mqdefault.jpg' },
  { id: 'aurora-iceland', name: 'aurora iceland', category: 'nature extended', mood: 'polar night', video: 'v5RGH0SmKJY', startAt: 20, image: 'https://img.youtube.com/vi/v5RGH0SmKJY/mqdefault.jpg' },
  { id: 'desert-wind', name: 'desert wind', category: 'nature extended', mood: 'open dunes', video: '1XRkEDCNyUI', startAt: 25, image: 'https://img.youtube.com/vi/1XRkEDCNyUI/mqdefault.jpg' },
  { id: 'kyoto-bamboo-grove', name: 'kyoto bamboo grove', category: 'nature extended', mood: 'zen path', video: 'yIMDgPKgN1w', startAt: 30, image: 'https://img.youtube.com/vi/yIMDgPKgN1w/mqdefault.jpg' },
  { id: 'forest-waterfall-cascade', name: 'forest waterfall', category: 'nature extended', mood: 'cascading mist', video: 'cMqTWusPdVI', startAt: 20, image: 'https://img.youtube.com/vi/cMqTWusPdVI/mqdefault.jpg' },
].map((space) => ({ ...space, tags: VIBES[space.category] || space.category }));

export const categories = ['all', ...new Set(spaces.map((item) => item.category))];

export function getAllSpaces() {
  return spaces;
}

export function getSpaceById(id) {
  return spaces.find((item) => item.id === id) || spaces[0];
}

export { extractVideoId as extractYouTubeId } from './lib/search';
