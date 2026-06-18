/* ===========================================================
   YouTube URL parsing — pure string helpers, no API calls.
   =========================================================== */

const VIDEO_ID_PATTERN = /[a-zA-Z0-9_-]{11}/;

/**
 * Extract an 11-char YouTube video id from a full URL, youtu.be link, or bare id.
 * Returns '' when no id can be parsed.
 */
export function extractVideoId(url) {
  const trimmed = (url ?? '').trim();
  if (!trimmed) return '';

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  const short = trimmed.match(/(?:youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (short) return short[1];

  const embed = trimmed.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embed) return embed[1];

  const vParam = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (vParam) return vParam[1];

  const pathV = trimmed.match(/\/v\/([a-zA-Z0-9_-]{11})/);
  if (pathV) return pathV[1];

  const fallback = trimmed.match(VIDEO_ID_PATTERN);
  return fallback ? fallback[0] : '';
}

/**
 * Build a clean YouTube embed URL with hidden controls and looping enabled.
 * Accepts full URL, shortened youtu.be link, or bare video id.
 * `options.start` — start offset in seconds (default 0).
 */
export function buildYouTubeEmbedUrl(rawInput, options = {}) {
  const videoId = extractVideoId(rawInput);
  if (!videoId) return '';

  const { start = 0 } = options;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    controls: '0',
    disablekb: '1',
    fs: '0',
    modestbranding: '1',
    playsinline: '1',
    rel: '0',
    showinfo: '0',
    iv_load_policy: '3',
    enablejsapi: '1',
    cc_load_policy: '0',
    color: 'white',
    origin,
    playlist: videoId,
    start: String(Math.max(0, Number(start) || 0)),
  });

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
}

/** Send a command to a YouTube iframe player (requires enablejsapi=1). */
export function postYouTubeCommand(iframeEl, func, args = []) {
  try {
    iframeEl?.contentWindow?.postMessage(JSON.stringify({
      event: 'command',
      func,
      args,
    }), '*');
  } catch {
    /* ignore cross-origin errors */
  }
}

/** Apply volume / mute state to the embedded player. */
export function applyYouTubeVolume(iframeEl, volume, muted) {
  if (!iframeEl) return;
  postYouTubeCommand(iframeEl, muted ? 'mute' : 'unMute', []);
  postYouTubeCommand(iframeEl, 'setVolume', [muted ? 0 : volume]);
}
