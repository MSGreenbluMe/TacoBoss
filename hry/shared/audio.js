// Zvuk pro hry: syntetizované efekty (Web Audio) a hlasové hlášky El Bosse.
// Nic nehraje před prvním ťuknutím. Chybějící mp3 tiše selže.

const VOICE_DIR = "/audio/games/voice/";
const MUTE_KEY = "tacoboss.muted";
const VOICE_GAP = 2500; // ms mezi začátky hlášek

// skupina → varianty (soubor = klíč.mp3)
const GROUPS = {
  start: ["start_1", "start_2"],
  good: ["good_1", "good_2", "good_3"],
  combo: ["combo_1"],
  hurry: ["hurry_1"],
  fiesta: ["fiesta"],
  record: ["record"],
  end_good: ["end_good"],
  end_bad: ["end_bad"],
  bad_knedlik: ["bad_knedlik"],
  bad_ponozka: ["bad_ponozka"],
  bad_kecup: ["bad_kecup"],
  bad_budik: ["bad_budik"],
  golden: ["golden"],
  order_new: ["order_new_1", "order_new_2"],
  order_ok: ["order_ok_1"],
  order_wrong: ["order_wrong_1", "order_wrong_2"],
  patience_low: ["patience_low"],
  order_late: ["order_late"],
};

let ctx = null;
let master = null;
let unlocked = false;
let muted = readMuted();
let current = null;
let queued = null;
let lastStart = -Infinity;
const cache = new Map();
const missing = new Set();

function readMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

function voiceEl(key) {
  if (cache.has(key)) return cache.get(key);
  const el = new Audio(`${VOICE_DIR}${key}.mp3`);
  el.preload = "auto";
  el.addEventListener("error", () => {
    missing.add(key);
    if (current === el) finish(el);
  });
  el.addEventListener("ended", () => finish(el));
  cache.set(key, el);
  return el;
}

function finish(el) {
  if (current !== el) return;
  current = null;
  if (queued) {
    const next = queued;
    queued = null;
    playKey(next);
  }
}

function playKey(key) {
  const el = voiceEl(key);
  if (missing.has(key)) return;
  current = el;
  lastStart = performance.now();
  try {
    el.currentTime = 0;
  } catch {}
  el.play().catch(() => finish(el));
}

function tone({ type = "sine", f0, f1 = f0, dur = 0.12, vol = 0.18, delay = 0 }) {
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.03);
}

const SFX = {
  pop: () => tone({ f0: 520, f1: 1040, dur: 0.09 }),
  golden: () => [660, 880, 1320, 1760].forEach((f, i) => tone({ f0: f, dur: 0.14, vol: 0.14, delay: i * 0.06 })),
  combo: () => [523, 659, 784].forEach((f, i) => tone({ type: "triangle", f0: f, dur: 0.12, vol: 0.16, delay: i * 0.07 })),
  buzz: () => {
    tone({ type: "sawtooth", f0: 160, f1: 90, dur: 0.3, vol: 0.12 });
    tone({ type: "square", f0: 120, f1: 70, dur: 0.3, vol: 0.06 });
  },
  miss: () => tone({ type: "triangle", f0: 260, f1: 180, dur: 0.12, vol: 0.07 }),
  tick: () => tone({ type: "square", f0: 1000, dur: 0.035, vol: 0.06 }),
  go: () => tone({ type: "triangle", f0: 880, f1: 1320, dur: 0.25, vol: 0.16 }),
  bell: () => {
    tone({ f0: 1318, dur: 0.9, vol: 0.18 });
    tone({ f0: 1976, dur: 0.6, vol: 0.07 });
  },
  add: () => tone({ type: "triangle", f0: 700, f1: 900, dur: 0.06, vol: 0.12 }),
  remove: () => tone({ type: "triangle", f0: 600, f1: 420, dur: 0.07, vol: 0.1 }),
  wrong: () => {
    tone({ type: "square", f0: 330, dur: 0.12, vol: 0.08 });
    tone({ type: "square", f0: 247, dur: 0.22, vol: 0.08, delay: 0.12 });
  },
  leave: () => [440, 370, 311].forEach((f, i) => tone({ type: "triangle", f0: f, dur: 0.16, vol: 0.12, delay: i * 0.12 })),
};

export const audio = {
  /** Zavolat při prvním ťuknutí (tlačítko Hrát). */
  unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        try {
          ctx = new AC();
          master = ctx.createGain();
          master.gain.value = 0.9;
          master.connect(ctx.destination);
        } catch {
          ctx = null;
        }
      }
    }
    if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    unlocked = true;
  },
  /** Přednačte jen hlášky, které daná hra používá. */
  preload(groups) {
    groups.forEach(g => (GROUPS[g] || [g]).forEach(voiceEl));
  },
  isMuted: () => muted,
  setMuted(value) {
    muted = value;
    try {
      localStorage.setItem(MUTE_KEY, value ? "1" : "0");
    } catch {}
    if (muted && current) {
      current.pause();
      current = null;
      queued = null;
    }
  },
  toggleMute() {
    this.setMuted(!muted);
    return muted;
  },
  sfx(name) {
    if (muted || !ctx || !SFX[name]) return;
    try {
      SFX[name]();
    } catch {}
  },
  /**
   * Hláška El Bosse. Jedna naráz, min. 2,5 s rozestup.
   * force: počká, až dohraje aktuální (konec kola).
   */
  voice(group, { force = false } = {}) {
    if (muted || !unlocked) return;
    const options = (GROUPS[group] || [group]).filter(k => !missing.has(k));
    if (!options.length) return;
    const key = options[Math.floor(Math.random() * options.length)];
    const busy = current && !current.paused && !current.ended;
    if (force) {
      if (busy) queued = key;
      else playKey(key);
      return;
    }
    if (busy || performance.now() - lastStart < VOICE_GAP) return;
    playKey(key);
  },
  stopVoice() {
    queued = null;
    if (current) current.pause();
    current = null;
  },
};
