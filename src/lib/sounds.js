/* ===========================================================
   Timer sounds — Web Audio API, no external files.
   Call preloadSounds() once on app init.
   =========================================================== */

let ctx = null;

const getCtx = () => {
  if (!ctx) ctx = new AudioContext();
  return ctx;
};

const resumeCtx = async () => {
  const audioCtx = getCtx();
  if (audioCtx.state === 'suspended') {
    try {
      await audioCtx.resume();
    } catch {
      /* gesture may still be required */
    }
  }
  return audioCtx;
};

/**
 * Soft bell tone — 528 Hz sine with ADSR envelope.
 * Returns a play() function.
 */
export function createBellSound(audioCtx) {
  const attack = 0.01;
  const decay = 0.3;
  const sustain = 0.4;
  const release = 0.8;
  const peak = 0.35;
  const sustainLevel = peak * sustain;
  const duration = attack + decay + release;

  return () => {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 528;
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + attack);
    gain.gain.linearRampToValueAtTime(sustainLevel, now + attack + decay);
    gain.gain.linearRampToValueAtTime(0, now + attack + decay + release);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  };
}

/**
 * Gentle break chime — 784 Hz sine, softer envelope.
 * Returns a play() function.
 */
export function createSoftChime(audioCtx) {
  const attack = 0.008;
  const decay = 0.25;
  const sustain = 0.3;
  const release = 0.6;
  const peak = 0.22;
  const sustainLevel = peak * sustain;
  const duration = attack + decay + release;

  return () => {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 784;
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + attack);
    gain.gain.linearRampToValueAtTime(sustainLevel, now + attack + decay);
    gain.gain.linearRampToValueAtTime(0, now + attack + decay + release);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  };
}

/**
 * Subtle countdown tick — very low volume (0.05 peak).
 * Returns a play() function.
 */
export function createTickSound(audioCtx) {
  const peak = 0.05;

  return () => {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 880;
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.start(now);
    osc.stop(now + 0.07);
  };
}

let playBell = null;
let playChime = null;
let playTick = null;

/** Prepare sound generators. Call once on app init. */
export function preloadSounds() {
  const audioCtx = getCtx();
  playBell = createBellSound(audioCtx);
  playChime = createSoftChime(audioCtx);
  playTick = createTickSound(audioCtx);
}

export async function playSessionComplete() {
  await resumeCtx();
  if (!playBell) preloadSounds();
  playBell?.();
}

export async function playBreakStart() {
  await resumeCtx();
  if (!playChime) preloadSounds();
  playChime?.();
}

export async function playBreakEnd() {
  await resumeCtx();
  if (!playBell) preloadSounds();
  playBell?.();
}

export async function playLastFiveSeconds(secondsLeft) {
  if (secondsLeft > 5 || secondsLeft < 1) return;
  await resumeCtx();
  if (!playTick) preloadSounds();
  playTick?.();
}
