// El Boss chytá – chytej ingredience do tortilly, blbosti nech padat.
import { createShell, reducedMotion } from "../shared/shell.js";
import { audio } from "../shared/audio.js";
import { SPRITES, loadSpriteImages, spriteSrc } from "../shared/sprites.js";

const ROUND = 60; // s
const FIESTA_AT = ROUND - 10;
const HURRY_AT = ROUND - 20;
const GOOD = ["hovezi", "kureci", "tofu", "syr", "pico", "guac", "cibule", "jalapeno", "limetka"];
const JUNK = ["knedlik", "ponozka", "kecup", "budik"];
const GOLDEN = "avokado_zlate";

const RANKS = [
  { min: 0, title: "Aprendiz" },
  { min: 25, title: "Taquero" },
  { min: 60, title: "Jefe" },
  { min: 100, title: "El Boss" },
];

const stage = document.getElementById("play");
const canvas = document.getElementById("cv");
const ctx = canvas.getContext("2d");
const hud = {
  time: document.getElementById("h-time"),
  score: document.getElementById("h-score"),
  mult: document.getElementById("h-mult"),
  dots: [...document.querySelectorAll("#h-dots i")],
  fiesta: document.getElementById("fiesta"),
};

const mascot = new Image();
mascot.src = "/img/mascot.webp";
let sprites = new Map();
loadSpriteImages([...GOOD, ...JUNK, GOLDEN]).then(m => (sprites = m));

// ── stav ──
let W = 0, H = 0, dpr = 1;
let S = 48; // velikost předmětu
let boss, items, popups, caught;
let t, score, streak, mult, nextSpawn, nextGolden, raf, lastTs, running;
let hurryDone, fiestaDone, lastTick, keys, shakeT;

function resize() {
  const r = stage.getBoundingClientRect();
  const prevW = W || r.width;
  W = r.width;
  H = r.height;
  dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  S = Math.max(40, Math.min(66, W * 0.12));
  if (boss) {
    boss.x = (boss.x / prevW) * W;
    boss.target = (boss.target / prevW) * W;
    sizeBoss();
  }
  if (!running) draw();
}

function sizeBoss() {
  boss.w = Math.max(120, Math.min(200, W * 0.36));
  boss.h = boss.w * (574 / 800);
  boss.y = H - boss.h - Math.max(8, H * 0.015);
  boss.trayW = boss.w * 0.86;
  boss.trayY = boss.y - S * 0.15;
}

function reset() {
  boss = { x: W / 2, target: W / 2, stunUntil: 0 };
  sizeBoss();
  items = [];
  popups = [];
  caught = [];
  t = 0;
  score = 0;
  streak = 0;
  mult = 1;
  nextSpawn = 0.6;
  nextGolden = 12 + Math.random() * 6;
  hurryDone = false;
  fiestaDone = false;
  lastTick = -1;
  keys = { left: false, right: false };
  shakeT = 0;
  hud.fiesta.hidden = true;
  stage.classList.remove("is-fiesta");
  renderHud();
}

// ── spawn ──
function spawn(kind) {
  const p = t / ROUND;
  const key = kind === "golden" ? GOLDEN : kind === "junk" ? JUNK[(Math.random() * JUNK.length) | 0] : GOOD[(Math.random() * GOOD.length) | 0];
  const margin = S * 0.6;
  items.push({
    key,
    kind,
    x: margin + Math.random() * (W - margin * 2),
    y: -S,
    vy: H * (0.3 + 0.34 * p) * (0.85 + Math.random() * 0.3) * (kind === "golden" ? 1.15 : 1),
    rot: (Math.random() - 0.5) * 0.6,
    vr: (Math.random() - 0.5) * 2.4,
    sway: Math.random() * Math.PI * 2,
  });
}

function scheduleSpawn() {
  const p = t / ROUND;
  let interval = 0.85 - 0.45 * p;
  if (t >= FIESTA_AT) interval /= 2;
  nextSpawn = t + interval * (0.75 + Math.random() * 0.5);
}

// ── herní smyčka ──
function update(dt) {
  t += dt;

  // čas a fáze
  if (!hurryDone && t >= HURRY_AT) {
    hurryDone = true;
    audio.voice("hurry");
  }
  if (!fiestaDone && t >= FIESTA_AT) {
    fiestaDone = true;
    hud.fiesta.hidden = false;
    stage.classList.add("is-fiesta");
    audio.voice("fiesta");
    nextGolden = Math.min(nextGolden, t + 1.5);
  }
  const left = Math.ceil(ROUND - t);
  if (left <= 5 && left > 0 && left !== lastTick) {
    lastTick = left;
    audio.sfx("tick");
  }

  // spawn
  if (t >= nextSpawn) {
    const junkChance = 0.16 + 0.12 * (t / ROUND);
    spawn(Math.random() < junkChance ? "junk" : "good");
    scheduleSpawn();
  }
  if (t >= nextGolden) {
    spawn("golden");
    nextGolden = t + (t >= FIESTA_AT ? 3 + Math.random() * 2 : 12 + Math.random() * 6);
  }

  // El Boss
  const now = performance.now();
  const stunned = now < boss.stunUntil;
  if (!stunned) {
    if (keys.left) boss.target -= W * 1.15 * dt;
    if (keys.right) boss.target += W * 1.15 * dt;
    const half = boss.w / 2;
    boss.target = Math.max(half * 0.85, Math.min(W - half * 0.85, boss.target));
    boss.x += (boss.target - boss.x) * Math.min(1, dt * 16);
  }

  // předměty
  const trayHalf = boss.trayW / 2;
  for (const it of items) {
    if (it.done) continue;
    it.y += it.vy * dt;
    it.rot += it.vr * dt;
    it.sway += dt * 3;
    const bottom = it.y + S * 0.35;
    if (bottom >= boss.trayY && it.y <= boss.trayY + S * 0.5 && Math.abs(it.x - boss.x) <= trayHalf + S * 0.2) {
      it.done = true;
      catchItem(it);
    } else if (it.y - S / 2 > H) {
      it.done = true;
      if (it.kind !== "junk") miss();
    }
  }
  items = items.filter(it => !it.done);

  // popupy
  for (const p of popups) p.life -= dt;
  popups = popups.filter(p => p.life > 0);
  if (shakeT > 0) shakeT -= dt;

  if (t >= ROUND) {
    renderHud();
    shell.end(score);
    return;
  }
  renderHud();
}

function addPopup(text, x, y, color = "#1a1210", big = false) {
  popups.push({ text, x, y, color, big, life: 0.9, max: 0.9 });
}

function catchItem(it) {
  if (it.kind === "junk") {
    score = Math.max(0, score - 3);
    streak = 0;
    mult = 1;
    boss.stunUntil = performance.now() + 500;
    if (!reducedMotion) shakeT = 0.3;
    addPopup("−3", it.x, boss.trayY - 10, "#d62b2b", true);
    audio.sfx("buzz");
    audio.voice(`bad_${it.key}`);
    return;
  }
  streak++;
  const prev = mult;
  mult = Math.min(3, 1 + Math.floor(streak / 5));
  const gain = (it.kind === "golden" ? 5 : 1) * mult;
  score += gain;
  caught.push(it.key);
  if (caught.length > 6) caught.shift();
  if (it.kind === "golden") {
    addPopup(`+${gain}`, it.x, boss.trayY - 10, "#c98a00", true);
    audio.sfx("golden");
    audio.voice("golden");
  } else {
    addPopup(`+${gain}`, it.x, boss.trayY - 10);
    audio.sfx("pop");
  }
  if (mult > prev) {
    addPopup(`×${mult}!`, boss.x, boss.trayY - S * 1.3, "#e4007c", true);
    audio.sfx("combo");
    audio.voice("combo");
  } else if (it.kind !== "golden" && streak % 8 === 0) {
    audio.voice("good");
  }
}

function miss() {
  if (streak > 0 || mult > 1) audio.sfx("miss");
  streak = 0;
  mult = 1;
}

// ── kreslení ──
function drawSprite(key, x, y, size, rot = 0) {
  const img = sprites.get(key);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  if (img) {
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
  } else {
    ctx.font = `${size * 0.8}px system-ui, "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(SPRITES[key]?.emoji || "?", 0, 0);
  }
  ctx.restore();
}

function drawBoss() {
  const now = performance.now();
  const stunned = now < boss.stunUntil;
  const { x, y, w, h, trayW, trayY } = boss;
  ctx.save();
  ctx.translate(x, y + h / 2);
  if (stunned && !reducedMotion) ctx.rotate(Math.sin(now / 40) * 0.08);

  // tortilla (miska) nad hlavou
  const ty = trayY - (y + h / 2);
  // chycené ingredience v tortille
  caught.forEach((k, i) => {
    const cx = (i - (caught.length - 1) / 2) * (trayW / 7);
    drawSprite(k, cx, ty + S * 0.05 - (i % 2) * 5, S * 0.6, (i % 3 - 1) * 0.3);
  });
  // tortilla jako mělká miska: horní okraj + spodní oblouk
  const depth = S * 0.95;
  ctx.fillStyle = "#f2c14e";
  ctx.strokeStyle = "#1a1210";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-trayW / 2, ty);
  ctx.bezierCurveTo(-trayW * 0.42, ty + depth, trayW * 0.42, ty + depth, trayW / 2, ty);
  ctx.quadraticCurveTo(0, ty + depth * 0.32, -trayW / 2, ty);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#c98a1b";
  for (const [fx, fy] of [[-0.22, 0.5], [0.05, 0.62], [0.26, 0.45], [-0.05, 0.4], [0.15, 0.7]]) {
    ctx.beginPath();
    ctx.arc(fx * trayW, ty + fy * depth, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  // ruce drží tortillu
  ctx.strokeStyle = "#1a1210";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-trayW * 0.42, ty + 6);
  ctx.lineTo(-w * 0.3, -h * 0.05);
  ctx.moveTo(trayW * 0.42, ty + 6);
  ctx.lineTo(w * 0.3, -h * 0.05);
  ctx.stroke();

  if (mascot.complete && mascot.naturalWidth) ctx.drawImage(mascot, -w / 2, -h / 2, w, h);
  else drawSprite("hovezi", 0, 0, h);

  if (stunned) {
    ctx.font = `${S * 0.5}px system-ui, "Segoe UI Emoji", sans-serif`;
    ctx.textAlign = "center";
    const a = reducedMotion ? 0 : now / 150;
    for (let i = 0; i < 3; i++) {
      const ang = a + (i * Math.PI * 2) / 3;
      ctx.fillText("💫", Math.cos(ang) * w * 0.28, -h * 0.45 + Math.sin(ang) * 8);
    }
  }
  ctx.restore();
}

function draw() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if (!boss) return;
  if (shakeT > 0) ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 6);

  // stín pod Bossem
  ctx.fillStyle = "rgba(26,18,16,.15)";
  ctx.beginPath();
  ctx.ellipse(boss.x, H - 6, boss.w * 0.4, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  for (const it of items) {
    const size = it.kind === "golden" ? S * 1.15 : S;
    const x = it.x + Math.sin(it.sway) * S * 0.08;
    if (it.kind === "golden") {
      ctx.fillStyle = "rgba(255,210,63,.35)";
      ctx.beginPath();
      ctx.arc(x, it.y, size * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }
    drawSprite(it.key, x, it.y, size, it.rot);
  }

  drawBoss();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const p of popups) {
    const k = p.life / p.max;
    ctx.globalAlpha = Math.min(1, k * 1.6);
    ctx.font = `${p.big ? 30 : 22}px Chango, "Arial Black", sans-serif`;
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#f6ecd6";
    const y = p.y - (1 - k) * 40;
    ctx.strokeText(p.text, p.x, y);
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, y);
  }
  ctx.globalAlpha = 1;
}

let shownScore = -1, shownMult = -1, shownTime = -1, shownStreak = -1;
function renderHud() {
  const left = Math.max(0, Math.ceil(ROUND - (t || 0)));
  if (left !== shownTime) {
    shownTime = left;
    hud.time.textContent = `0:${String(left).padStart(2, "0")}`;
    hud.time.parentElement.classList.toggle("hurry", left <= 10);
  }
  if (score !== shownScore) {
    shownScore = score;
    hud.score.textContent = score;
  }
  if (mult !== shownMult) {
    shownMult = mult;
    hud.mult.textContent = `×${mult}`;
    hud.mult.parentElement.dataset.m = mult;
  }
  const dots = mult >= 3 ? 5 : streak % 5;
  if (dots !== shownStreak) {
    shownStreak = dots;
    hud.dots.forEach((d, i) => d.classList.toggle("on", i < dots));
  }
}

function loop(ts) {
  if (!running) return;
  const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0);
  lastTs = ts;
  update(dt);
  if (!running) return;
  draw();
  raf = requestAnimationFrame(loop);
}

// ── ovládání ──
function pointerX(e) {
  const r = canvas.getBoundingClientRect();
  return e.clientX - r.left;
}
canvas.addEventListener("pointerdown", e => {
  if (!boss) return;
  canvas.setPointerCapture?.(e.pointerId);
  boss.target = pointerX(e);
});
canvas.addEventListener("pointermove", e => {
  if (!boss) return;
  if (e.pointerType === "mouse" || e.buttons || e.pressure > 0) boss.target = pointerX(e);
});
addEventListener("keydown", e => {
  if (!keys) return;
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = true;
  else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = true;
  else return;
  e.preventDefault();
});
addEventListener("keyup", e => {
  if (!keys) return;
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = false;
});
addEventListener("resize", resize);

// ── legenda na úvodní obrazovce ──
const legend = document.getElementById("legend");
const icon = k => `<img src="${spriteSrc(k)}" alt="${SPRITES[k].label}" title="${SPRITES[k].label}" width="28" height="28">`;
legend.innerHTML = `
  <div class="legend-row">${GOOD.map(icon).join("")}<b>+1</b></div>
  <div class="legend-row gold">${icon(GOLDEN)}<span>Zlaté avokádo</span><b>+5</b></div>
  <div class="legend-row bad">${JUNK.map(icon).join("")}<b>−3</b></div>`;

// ── napojení na shell ──
const game = {
  prepare() {
    resize();
    reset();
    draw();
  },
  start() {
    running = true;
    lastTs = performance.now();
    raf = requestAnimationFrame(loop);
  },
  pause() {
    running = false;
    cancelAnimationFrame(raf);
    if (keys) keys.left = keys.right = false;
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
  id: "el-boss-chyta",
  name: "El Boss chytá",
  ranks: RANKS,
  game,
  voices: ["good", "combo", "hurry", "fiesta", "golden", ...JUNK.map(k => `bad_${k}`)],
});
