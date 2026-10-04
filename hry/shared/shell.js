// Společná kostra her: obrazovky start → hra → výsledek, odpočet, pauza,
// rekord, hodnosti, sdílení a ztlumení zvuku.
import { audio } from "./audio.js";
import { getBest, onGameEnd } from "./score.js";

export const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];

/**
 * @param {object} opts
 * @param {string} opts.id        klíč hry (ukládání rekordu)
 * @param {string} opts.name      název hry pro sdílení
 * @param {{min:number,title:string}[]} opts.ranks  vzestupně
 * @param {{prepare():void,start():void,pause():void,resume():void,stop():void}} opts.game
 * @param {string[]} [opts.voices]  skupiny hlášek, které hra používá (přednačtení)
 */
export function createShell({ id, name, ranks, game, voices = [] }) {
  let state = "start"; // start | countdown | play | paused | result
  const pauseLayer = $("#pause");
  const countdownLayer = $("#countdown");
  const muteBtn = $("#g-mute");
  const shareBtn = $('[data-act="share"]');
  let lastResult = null;

  const rankFor = score => [...ranks].reverse().find(r => score >= r.min) || ranks[0];

  function show(screen) {
    $$("[data-screen]").forEach(s => s.classList.toggle("on", s.dataset.screen === screen));
    document.body.dataset.screen = screen;
  }

  function renderBest() {
    $$("[data-best]").forEach(el => (el.textContent = getBest(id)));
  }

  function renderMute() {
    const m = audio.isMuted();
    muteBtn.setAttribute("aria-pressed", String(m));
    muteBtn.setAttribute("aria-label", m ? "Zapnout zvuk" : "Vypnout zvuk");
    muteBtn.classList.toggle("is-muted", m);
  }

  function countdown() {
    return new Promise(resolve => {
      const steps = ["3", "2", "1", "¡Ya!"];
      let i = 0;
      countdownLayer.hidden = false;
      const next = () => {
        if (state !== "countdown") {
          countdownLayer.hidden = true;
          return;
        }
        if (i === steps.length) {
          countdownLayer.hidden = true;
          resolve();
          return;
        }
        countdownLayer.textContent = steps[i];
        countdownLayer.classList.remove("pop");
        void countdownLayer.offsetWidth;
        countdownLayer.classList.add("pop");
        audio.sfx(i === steps.length - 1 ? "go" : "tick");
        i++;
        setTimeout(next, i === steps.length ? 450 : 620);
      };
      next();
    });
  }

  async function play() {
    if (state === "countdown" || state === "play") return;
    audio.unlock();
    audio.preload(["start", "record", "end_good", "end_bad", ...voices]);
    audio.stopVoice();
    pauseLayer.hidden = true;
    show("play");
    game.prepare();
    state = "countdown";
    await countdown();
    if (state !== "countdown") return;
    state = "play";
    game.start();
    audio.voice("start");
  }

  function pause() {
    if (state !== "play") return;
    state = "paused";
    game.pause();
    pauseLayer.hidden = false;
    $('[data-act="resume"]').focus();
  }

  function resume() {
    if (state !== "paused") return;
    pauseLayer.hidden = true;
    state = "play";
    game.resume();
  }

  function quit() {
    game.stop();
    audio.stopVoice();
    state = "start";
    pauseLayer.hidden = true;
    countdownLayer.hidden = true;
    renderBest();
    show("start");
  }

  function end(score) {
    if (state !== "play") return;
    state = "result";
    game.stop();
    const res = onGameEnd({ game: id, score });
    const rank = rankFor(score);
    lastResult = { score, rank };
    $("[data-score]").textContent = score;
    $$("[data-rank]").forEach(el => (el.textContent = rank.title));
    $("[data-record]").hidden = !(res.isRecord && score > 0);
    $(".rank-card")?.setAttribute("data-rank-level", String(ranks.indexOf(rank)));
    renderBest();
    show("result");
    const line = res.isRecord && score > 0 ? "record" : score >= ranks[1].min ? "end_good" : "end_bad";
    audio.voice(line, { force: true });
    $('[data-act="again"]').focus({ preventScroll: true });
  }

  // ── ovládání ──
  document.addEventListener("click", e => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (!act) return;
    if (act === "play" || act === "again") play();
    else if (act === "pause") pause();
    else if (act === "resume") resume();
    else if (act === "quit") quit();
    else if (act === "share" && lastResult) {
      navigator
        .share({
          title: `Taco Boss – ${name}`,
          text: `Dal jsem ${lastResult.score} 🌶️ ve hře ${name} a jsem ${lastResult.rank.title}! Zvládneš víc? ¡Órale!`,
          url: location.href,
        })
        .catch(() => {});
    }
  });

  muteBtn.addEventListener("click", () => {
    audio.unlock();
    audio.toggleMute();
    renderMute();
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape" || e.key === "p" || e.key === "P") {
      if (state === "play") pause();
      else if (state === "paused") resume();
    } else if ((e.key === "Enter" || e.key === " ") && (state === "start" || state === "result")) {
      if (e.target.closest("button, a")) return;
      e.preventDefault();
      play();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
  });

  // Safari: zabránit pinch-zoomu během hry
  document.addEventListener("gesturestart", e => e.preventDefault());

  if (!navigator.share) shareBtn.hidden = true;
  else shareBtn.hidden = false;

  renderBest();
  renderMute();
  show("start");

  return {
    end,
    pause,
    isPlaying: () => state === "play",
  };
}
