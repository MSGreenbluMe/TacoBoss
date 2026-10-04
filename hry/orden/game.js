// ¡Orden! – poskládej objednávku podle lístku a zazvoň.
import { createShell, reducedMotion } from "../shared/shell.js";
import { audio } from "../shared/audio.js";
import { SPRITES, spriteSrc } from "../shared/sprites.js";

const ROUND = 90; // s
const HURRY_AT = ROUND - 20;
const LEARN_TICKETS = 3; // první lístky ukazují celý recept
const PATIENCE_START = 15;
const PATIENCE_END = 8;
const HINT_COST = 2;

const RANKS = [
  { min: 0, title: "Aprendiz" },
  { min: 40, title: "Taquero" },
  { min: 100, title: "Jefe" },
  { min: 170, title: "El Boss" },
];

// ingredience: klíč → sprite + popisek na tácu + klávesa
const ING = {
  corn: { sprite: "tortilla_kukuricna", label: "Kukuřičná tortilla", key: "q" },
  flour: { sprite: "tortilla_psenicna", label: "Pšeničná tortilla", key: "w" },
  nachos: { sprite: "nachos", label: "Nachos", key: "e" },
  beef: { sprite: "hovezi", label: "Hovězí", key: "r" },
  chicken: { sprite: "kureci", label: "Kuřecí", key: "t" },
  tofu: { sprite: "tofu", label: "Tofu fajitas", key: "a" },
  cheese: { sprite: "syr", label: "Sýr", key: "s" },
  sauce: { sprite: "syrova_omacka", label: "Sýrová omáčka", key: "d" },
  beans: { sprite: "fazole", label: "Fazolová pasta", key: "f" },
  pico: { sprite: "pico", label: "Pico de gallo", key: "g" },
  onion: { sprite: "cibule", label: "Nakládaná cibule", key: "z" },
  guac: { sprite: "guac", label: "Guacamole", key: "x" },
  jalapeno: { sprite: "jalapeno", label: "Jalapeños", key: "c" },
  hot: { sprite: "paliva_omacka", label: "Pálivá omáčka", key: "v" },
};
const TRAY = Object.keys(ING);

const PROTEINS = { beef: "hovězí", chicken: "kuřecí", tofu: "tofu fajitas" };

// recepty podle skutečného menu (P = zvolený protein)
const DISHES = {
  tacos: { name: "Tacos", base: { corn: 1, P: 1, cheese: 1, pico: 1, onion: 1, guac: 1 } },
  burrito: { name: "Burrito", base: { flour: 1, P: 1, cheese: 1, beans: 1, pico: 1, onion: 1, guac: 1 } },
  quesadilla: { name: "Quesadilla", base: { flour: 1, P: 1, cheese: 2, beans: 1, pico: 1, onion: 1, guac: 1 }, note: "dvojitý sýr" },
  nachos: { name: "Nachos", base: { nachos: 1, P: 1, sauce: 1, pico: 1, onion: 1, jalapeno: 1, guac: 1 } },
};

const MODS = {
  no_onion: { label: "bez cibule", apply: e => delete e.onion },
  no_jalapeno: { label: "bez jalapeños", only: "nachos", apply: e => delete e.jalapeno },
  extra_guac: { label: "extra guacamole", apply: e => (e.guac = 2) },
  hot: { label: "pálivá omáčka", apply: e => (e.hot = 1) },
};

const CUSTOMERS = [
  { name: "Rocker z festivalu", emoji: "🤘", color: "#e4007c", lines: ["Po pogu mám hlad jak vlk!", "Ať to pálí jako kytarový sólo!"] },
  { name: "Babička Jarmila", emoji: "👵", color: "#c9e07a", lines: ["Ať je to pořádně teplé, zlatíčko.", "Vnouček říkal, že je to lepší než svíčková."] },
  { name: "Hladový student", emoji: "🎒", color: "#ffd23f", lines: ["Mám zkouškový a hlad.", "Hlavně ať je toho hodně, jo?"] },
  { name: "Hokejový fanoušek", emoji: "🏒", color: "#0fa3a3", lines: ["Než začne třetina, jo?", "Jedeme! Ale nejdřív tacos."] },
  { name: "Nevěsta", emoji: "👰", color: "#f6ecd6", lines: ["Ať nekape na šaty, prosím!", "Za hodinu mám obřad, rychle!"] },
  { name: "Turista z Mexika", emoji: "🌵", color: "#ffa400", lines: ["¡Hola! Jako doma v Guadalajaře?", "Ukaž, co umíš, amigo."] },
];

const $ = id => document.getElementById(id);
const el = {
  time: $("h-time"),
  score: $("h-score"),
  streak: $("h-streak"),
  avatar: $("c-avatar"),
  name: $("c-name"),
  line: $("c-line"),
  patience: $("patience"),
  ticketNo: $("t-no"),
  dish: $("t-dish"),
  protein: $("t-protein"),
  note: $("t-note"),
  mods: $("t-mods"),
  recipe: $("t-recipe"),
  hint: $("t-hint"),
  plate: $("plate"),
  plateItems: $("plate-items"),
  tray: $("tray"),
  listo: $("listo"),
  clear: $("clear"),
  stamp: $("stamp"),
  customer: $("customer"),
};

const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const img = (key, size = 30) =>
  `<img src="${spriteSrc(ING[key].sprite)}" alt="" width="${size}" height="${size}" draggable="false">`;

// ── tác ──
el.tray.innerHTML = TRAY.map(
  k => `<button type="button" class="ing" data-ing="${k}">${img(k, 32)}<span>${ING[k].label}</span><kbd>${ING[k].key.toUpperCase()}</kbd></button>`,
).join("");

// ── stav ──
let t, score, streak, ticketCount, order, plate, raf, lastTs, running;
let patienceMax, patience, lowWarned, hurryDone, lastTick, busy, lastCustomer, hintShown;

function reset() {
  t = 0;
  score = 0;
  streak = 0;
  ticketCount = 0;
  hurryDone = false;
  lastTick = -1;
  lastCustomer = -1;
  busy = false;
  plate = {};
  renderHud();
  newOrder(true);
}

function makeOrder() {
  const dishKey = pick(Object.keys(DISHES));
  const dish = DISHES[dishKey];
  const protein = pick(Object.keys(PROTEINS));
  const expected = {};
  for (const [k, n] of Object.entries(dish.base)) expected[k === "P" ? protein : k] = n;

  // 0–2 úpravy, první lístky jednodušší
  const pool = Object.keys(MODS).filter(m => !MODS[m].only || MODS[m].only === dishKey);
  let count;
  if (ticketCount <= 1) count = 0;
  else if (ticketCount <= LEARN_TICKETS) count = Math.random() < 0.5 ? 0 : 1;
  else {
    const r = Math.random();
    count = r < 0.35 ? 0 : r < 0.8 ? 1 : 2;
  }
  const mods = [];
  while (mods.length < count) {
    const m = pick(pool);
    if (!mods.includes(m)) mods.push(m);
  }
  mods.forEach(m => MODS[m].apply(expected));

  let ci;
  do ci = Math.floor(Math.random() * CUSTOMERS.length);
  while (ci === lastCustomer);
  lastCustomer = ci;

  return { dishKey, dish, protein, mods, expected, customer: CUSTOMERS[ci] };
}

function newOrder(first = false) {
  ticketCount++;
  order = makeOrder();
  plate = {};
  hintShown = ticketCount <= LEARN_TICKETS;
  patienceMax = PATIENCE_START - (PATIENCE_START - PATIENCE_END) * Math.min(1, t / ROUND);
  patience = patienceMax;
  lowWarned = false;
  busy = false;
  renderOrder();
  renderPlate();
  if (!first) audio.voice("order_new");
}

// ── vykreslení ──
function renderOrder() {
  const { dish, protein, mods, customer, expected } = order;
  el.avatar.textContent = customer.emoji;
  el.avatar.style.background = customer.color;
  el.name.textContent = customer.name;
  el.line.textContent = pick(customer.lines);
  el.ticketNo.textContent = `Objednávka #${ticketCount}`;
  el.dish.textContent = dish.name;
  el.protein.textContent = PROTEINS[protein];
  el.note.textContent = dish.note ? `(${dish.note})` : "";
  el.note.hidden = !dish.note;
  el.mods.innerHTML = mods.map(m => `<span class="mod">${MODS[m].label}</span>`).join("");
  el.recipe.innerHTML = Object.entries(expected)
    .map(([k, n]) => `<span class="r-item" title="${ING[k].label}">${img(k, 26)}<span class="lbl">${ING[k].label}</span>${n > 1 ? `<b>×${n}</b>` : ""}</span>`)
    .join("");
  el.recipe.hidden = !hintShown;
  el.hint.hidden = hintShown;
  el.customer.classList.remove("arrive");
  void el.customer.offsetWidth;
  el.customer.classList.add("arrive");
}

function renderPlate(check = null) {
  const keys = TRAY.filter(k => plate[k]);
  let html = keys
    .map(k => {
      const bad = check && (plate[k] || 0) > (order.expected[k] || 0);
      return `<button type="button" class="chip${bad ? " bad" : ""}" data-chip="${k}" aria-label="Odebrat: ${ING[k].label}">${img(k, 40)}${plate[k] > 1 ? `<b class="n">×${plate[k]}</b>` : ""}</button>`;
    })
    .join("");
  if (check) {
    html += Object.entries(order.expected)
      .filter(([k, n]) => (plate[k] || 0) < n)
      .map(([k, n]) => `<span class="chip ghost" title="Chybí: ${ING[k].label}">${img(k, 40)}${n - (plate[k] || 0) > 1 ? `<b class="n">×${n - (plate[k] || 0)}</b>` : ""}</span>`)
      .join("");
  }
  el.plateItems.innerHTML = html || `<span class="plate-empty">Ťukni na ingredience dole</span>`;
}

let shown = {};
function renderHud() {
  const left = Math.max(0, Math.ceil(ROUND - t));
  if (left !== shown.time) {
    shown.time = left;
    el.time.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
    el.time.parentElement.classList.toggle("hurry", left <= 10);
  }
  if (score !== shown.score) el.score.textContent = shown.score = score;
  if (streak !== shown.streak) {
    shown.streak = streak;
    el.streak.textContent = `🔥 ${streak}`;
    el.streak.parentElement.dataset.on = streak >= 2 ? "1" : "0";
  }
  const p = Math.max(0, patience / patienceMax);
  el.patience.style.setProperty("--p", `${p * 100}%`);
  el.patience.dataset.level = p > 0.5 ? "ok" : p > 0.25 ? "mid" : "low";
}

// ── akce hráče ──
function add(k) {
  if (!running || busy) return;
  if ((plate[k] || 0) >= 3) return;
  plate[k] = (plate[k] || 0) + 1;
  audio.sfx("add");
  renderPlate();
}

function remove(k) {
  if (!running || busy || !plate[k]) return;
  plate[k]--;
  if (!plate[k]) delete plate[k];
  audio.sfx("remove");
  renderPlate();
}

function clearPlate() {
  if (!running || busy) return;
  plate = {};
  audio.sfx("remove");
  renderPlate();
}

function showHint() {
  if (!running || busy || hintShown) return;
  hintShown = true;
  patience = Math.max(0.5, patience - HINT_COST);
  el.recipe.hidden = false;
  el.hint.hidden = true;
  renderHud();
}

function stamp(text, cls) {
  el.stamp.textContent = text;
  el.stamp.className = `stamp ${cls}`;
  void el.stamp.offsetWidth;
  el.stamp.classList.add("show");
}

function submit() {
  if (!running || busy) return;
  const keys = new Set([...Object.keys(plate), ...Object.keys(order.expected)]);
  const ok = [...keys].every(k => (plate[k] || 0) === (order.expected[k] || 0));
  if (ok) {
    streak++;
    const bonus = streak >= 2 ? Math.min(10, (streak - 1) * 2) : 0;
    const gain = 10 + Math.floor(patience) + bonus;
    score += gain;
    busy = true;
    audio.sfx("bell");
    audio.voice("order_ok");
    stamp(`+${gain} 🌶️`, "ok");
    renderHud();
    setTimeout(() => running && newOrder(), 750);
  } else {
    audio.sfx("wrong");
    audio.voice("order_wrong");
    renderPlate(true);
    if (!reducedMotion) {
      el.plate.classList.remove("shake");
      void el.plate.offsetWidth;
      el.plate.classList.add("shake");
    }
  }
}

function customerLeft() {
  streak = 0;
  busy = true;
  audio.sfx("leave");
  audio.voice("order_late");
  stamp("Odešel hladový…", "late");
  renderHud();
  setTimeout(() => running && newOrder(), 900);
}

el.tray.addEventListener("click", e => {
  const b = e.target.closest("[data-ing]");
  if (b) add(b.dataset.ing);
});
el.plateItems.addEventListener("click", e => {
  const c = e.target.closest("[data-chip]");
  if (c) remove(c.dataset.chip);
});
el.listo.addEventListener("click", submit);
el.clear.addEventListener("click", clearPlate);
el.hint.addEventListener("click", showHint);

const KEYMAP = Object.fromEntries(TRAY.map(k => [ING[k].key, k]));
addEventListener("keydown", e => {
  if (!running || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (KEYMAP[k]) {
    add(KEYMAP[k]);
    e.preventDefault();
  } else if (k === "enter" || k === " ") {
    if (e.target.closest("button")) return; // zaostřené tlačítko odpoví samo
    submit();
    e.preventDefault();
  } else if (k === "backspace") {
    const last = TRAY.filter(x => plate[x]).pop();
    if (last) remove(last);
    e.preventDefault();
  } else if (k === "?" || k === "h") {
    showHint();
  }
});

// ── smyčka (čas a trpělivost) ──
function update(dt) {
  t += dt;
  if (!busy) {
    patience -= dt;
    if (!lowWarned && patience < 4) {
      lowWarned = true;
      audio.voice("patience_low");
    }
    if (patience <= 0) {
      patience = 0;
      customerLeft();
    }
  }
  if (!hurryDone && t >= HURRY_AT) {
    hurryDone = true;
    audio.voice("hurry");
  }
  const left = Math.ceil(ROUND - t);
  if (left <= 5 && left > 0 && left !== lastTick) {
    lastTick = left;
    audio.sfx("tick");
  }
  renderHud();
  if (t >= ROUND) shell.end(score);
}

function loop(ts) {
  if (!running) return;
  update(Math.min(0.1, (ts - lastTs) / 1000 || 0));
  lastTs = ts;
  if (running) raf = requestAnimationFrame(loop);
}

const game = {
  prepare() {
    running = false;
    reset();
  },
  start() {
    running = true;
    lastTs = performance.now();
    raf = requestAnimationFrame(loop);
  },
  pause() {
    running = false;
    cancelAnimationFrame(raf);
  },
  resume() {
    running = true;
    lastTs = performance.now();
    raf = requestAnimationFrame(loop);
  },
  stop() {
    running = false;
    cancelAnimationFrame(raf);
  },
};

const shell = createShell({
  id: "orden",
  name: "¡Orden!",
  ranks: RANKS,
  game,
  voices: ["order_new", "order_ok", "order_wrong", "patience_low", "order_late", "hurry"],
});
