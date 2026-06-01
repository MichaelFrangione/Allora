// Lightweight answer feedback: synthesized tones (Web Audio) + haptics.
// No audio assets; the AudioContext is created lazily on a user gesture (a click),
// which satisfies browser autoplay policies.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (localStorage.getItem("allora-sound") === "off") return null;
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!ctx) ctx = new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function beep(
  c: AudioContext,
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType = "sine",
  gain = 0.07
) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(c.destination);
  osc.start(start);
  osc.stop(start + dur);
}

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* not supported */
  }
}

/** Pleasant rising two-note chime + a short buzz. */
export function playCorrect() {
  const c = getCtx();
  if (c) {
    const t = c.currentTime;
    beep(c, 660, t, 0.12);
    beep(c, 988, t + 0.09, 0.18);
  }
  vibrate(18);
}

/** Low, short "nope" tone + a double buzz. */
export function playWrong() {
  const c = getCtx();
  if (c) {
    const t = c.currentTime;
    beep(c, 196, t, 0.22, "square", 0.045);
  }
  vibrate([25, 40, 25]);
}
