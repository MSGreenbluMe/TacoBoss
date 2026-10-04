// Manifest všech herních obrázků. Každý sprite má jednoduché ploché SVG
// nakreslené v kódu a emoji jako zálohu. Hezčí ilustrace lze později
// podstrčit přidáním `src: "/img/games/…png"` – kód her se měnit nemusí.

const svg = body =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="#1a1210" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`;

const bowl = (fill, inner) =>
  `<path fill="${fill}" d="M8 32h48c0 12-10 20-24 20S8 44 8 32Z"/>${inner}`;

export const SPRITES = {
  // ── ingredience ──
  hovezi: {
    label: "Hovězí", emoji: "🥩",
    svg: svg(`<path fill="#8b3a1e" d="M8 34c0-9 8-14 16-12 4-9 18-9 22-1 9 0 12 8 10 15-2 8-10 12-18 12H20C12 48 8 42 8 34Z"/><path stroke="#5a2410" stroke-width="2.5" d="M20 30l5 10M32 26l5 14M44 28l3 9"/>`),
  },
  kureci: {
    label: "Kuřecí", emoji: "🍗",
    svg: svg(`<g transform="rotate(45 46 46)"><rect x="38" y="42" width="16" height="8" fill="#f6ecd6"/><circle cx="55" cy="42" r="4.5" fill="#f6ecd6"/><circle cx="55" cy="50" r="4.5" fill="#f6ecd6"/></g><path fill="#e8a548" d="M10 30C7 19 15 9 26 11c11 2 20 11 20 20s-7 15-15 15c-9 0-17-6-21-16Z"/><path stroke="#b86f1c" stroke-width="2.5" d="M18 22c5-3 10-3 13 1"/>`),
  },
  tofu: {
    label: "Tofu fajitas", emoji: "🧈",
    svg: svg(`<path fill="#f6ecc9" d="M6 26l14-8 14 8v16l-14 8-14-8Z"/><path d="M6 26l14 8 14-8M20 34v16"/><path fill="#f3e2b0" d="M30 30l13-7 13 7v15l-13 7-13-7Z"/><path d="M30 30l13 7 13-7M43 37v15"/><path stroke="#d9822b" stroke-width="2.5" d="M9 37l6 3M47 43l6-3"/><path fill="#d62b2b" stroke-width="2" d="M24 14c4-4 10-2 10 2-4 0-7 1-10-2Z"/>`),
  },
  syr: {
    label: "Sýr", emoji: "🧀",
    svg: svg(`<path fill="#ffd23f" d="M6 46 46 18l12 8v20Z"/><path d="M6 46l52-20"/><circle cx="26" cy="41" r="3" fill="#e9b200" stroke-width="2"/><circle cx="41" cy="40" r="2.5" fill="#e9b200" stroke-width="2"/><circle cx="50" cy="37" r="2" fill="#e9b200" stroke-width="2"/>`),
  },
  pico: {
    label: "Pico de gallo", emoji: "🍅",
    svg: svg(`${bowl("#0fa3a3", "")}<path fill="#d62b2b" d="M12 32c2-9 9-13 20-13s18 4 20 13Z"/><g stroke-width="2"><rect x="19" y="24" width="5" height="5" fill="#fff"/><rect x="33" y="22" width="5" height="5" fill="#8cc63f"/><rect x="41" y="27" width="5" height="5" fill="#fff"/><rect x="27" y="27" width="4" height="4" fill="#8cc63f"/></g><path stroke="#f6ecd6" stroke-width="2.5" d="M16 40l5-3 5 3 5-3 5 3 5-3 5 3"/>`),
  },
  guac: {
    label: "Guacamole", emoji: "🥑",
    svg: svg(`${bowl("#4a4a4a", "")}<path d="M18 50l-3 6M46 50l3 6"/><path fill="#8cc63f" d="M12 32c2-10 10-15 20-15s18 5 20 15Z"/><g fill="#3f7d1d" stroke="none"><circle cx="22" cy="27" r="2"/><circle cx="36" cy="23" r="2"/><circle cx="42" cy="28" r="2"/></g><circle cx="30" cy="27" r="2.6" fill="#d62b2b" stroke-width="1.5"/>`),
  },
  cibule: {
    label: "Nakládaná cibule", emoji: "🧅",
    svg: svg(`<ellipse cx="24" cy="30" rx="14" ry="11" stroke-width="9"/><ellipse cx="24" cy="30" rx="14" ry="11" stroke="#e4007c" stroke-width="5"/><ellipse cx="40" cy="38" rx="13" ry="10" stroke-width="9"/><ellipse cx="40" cy="38" rx="13" ry="10" stroke="#f05aa8" stroke-width="5"/>`),
  },
  jalapeno: {
    label: "Jalapeños", emoji: "🌶️",
    svg: svg(`<path fill="#1f9d57" d="M14 22c10-5 19 1 23 11s8 17 19 19c-12 5-27-1-33-11-4-7-11-13-9-19Z"/><path stroke="#5f8a1e" stroke-width="4" d="M14 22c-3-6 0-11 7-13"/><path stroke="#7fd39b" stroke-width="2.5" d="M21 26c6 2 10 7 12 13"/>`),
  },
  limetka: {
    label: "Limetka", emoji: "🍋",
    svg: svg(`<circle cx="32" cy="32" r="23" fill="#4f9e24"/><circle cx="32" cy="32" r="18" fill="#c8e88a" stroke="none"/><path stroke="#8fc24a" stroke-width="2" d="M32 15v34M15 32h34M20 20l24 24M44 20 20 44"/><circle cx="32" cy="32" r="2.5" fill="#f6ecd6" stroke="none"/>`),
  },
  avokado_zlate: {
    label: "Zlaté avokádo", emoji: "🥑",
    svg: svg(`<path fill="#e0a800" d="M32 5c-10 0-14 12-15 22-6 12-6 31 15 31s21-19 15-31C46 17 42 5 32 5Z"/><path fill="#fff1a8" stroke="none" d="M32 12c-7 0-10 9-11 17-5 11-4 24 11 24s16-13 11-24c-1-8-4-17-11-17Z"/><circle cx="32" cy="41" r="9" fill="#ffcf33"/><path fill="#fff6c2" stroke-width="2" d="M53 6l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/><path fill="#fff6c2" stroke-width="2" d="M10 40l1.5 3.5L15 45l-3.5 1.5L10 50l-1.5-3.5L5 45l3.5-1.5Z"/>`),
  },

  // ── blbosti (game 1) ──
  knedlik: {
    label: "Knedlík", emoji: "🥟",
    svg: svg(`<ellipse cx="24" cy="36" rx="16" ry="14" fill="#f3ead8"/><ellipse cx="41" cy="30" rx="16" ry="14" fill="#efe2c8"/><g fill="#c9b48e" stroke="none"><circle cx="18" cy="34" r="1.6"/><circle cx="25" cy="41" r="1.4"/><circle cx="36" cy="26" r="1.6"/><circle cx="44" cy="33" r="1.4"/><circle cx="47" cy="25" r="1.2"/></g>`),
  },
  ponozka: {
    label: "Ponožka", emoji: "🧦",
    svg: svg(`<path fill="#f6ecd6" d="M20 6h18v27l10 8c7 6 2 17-6 15L20 46c-6-2-8-9-5-13l5-6Z"/><path stroke="#d62b2b" stroke-width="4" d="M21 13h16M21 21h16"/><path stroke="#8cc63f" stroke-width="2.5" d="M50 8c-3 3 3 5 0 8s3 5 0 8M57 13c-3 3 3 5 0 8"/>`),
  },
  kecup: {
    label: "Kečup", emoji: "🥫",
    svg: svg(`<rect x="26" y="7" width="12" height="13" rx="2" fill="#f6ecd6"/><path fill="#d62b2b" d="M24 20h16l4 9v25a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V29Z"/><rect x="22" y="35" width="20" height="13" fill="#f6ecd6" stroke-width="2"/><circle cx="32" cy="41.5" r="3.5" fill="#d62b2b" stroke="none"/>`),
  },
  budik: {
    label: "Budík", emoji: "⏰",
    svg: svg(`<path d="M20 52l-4 7M44 52l4 7"/><path fill="#ffd23f" d="M8 22a10 10 0 0 1 14-13Z"/><path fill="#ffd23f" d="M56 22a10 10 0 0 0-14-13Z"/><circle cx="32" cy="36" r="19" fill="#0fa3a3"/><circle cx="32" cy="36" r="14" fill="#f6ecd6" stroke-width="2"/><path d="M32 36V27M32 36l6 4"/>`),
  },

  // ── tác (game 2) ──
  tortilla_kukuricna: {
    label: "Kukuřičná tortilla", emoji: "🌮",
    svg: svg(`<circle cx="32" cy="32" r="24" fill="#f2c14e"/><g fill="#c98a1b" stroke="none"><circle cx="22" cy="24" r="2"/><circle cx="38" cy="20" r="1.6"/><circle cx="44" cy="36" r="2"/><circle cx="28" cy="42" r="1.6"/><circle cx="20" cy="36" r="1.4"/><circle cx="36" cy="32" r="1.5"/></g>`),
  },
  tortilla_psenicna: {
    label: "Pšeničná tortilla", emoji: "🫓",
    svg: svg(`<circle cx="32" cy="32" r="24" fill="#f8e7bd"/><g fill="#c49155" stroke="none"><ellipse cx="22" cy="25" rx="3.5" ry="2.2"/><ellipse cx="40" cy="22" rx="2.6" ry="1.8"/><ellipse cx="42" cy="40" rx="3.6" ry="2.4"/><ellipse cx="26" cy="41" rx="2.6" ry="1.8"/></g>`),
  },
  nachos: {
    label: "Nachos", emoji: "🔺",
    svg: svg(`<path fill="#ffd23f" d="M6 48 20 14l14 34Z"/><path fill="#f7b32b" d="M24 52 40 18l18 31Z"/><g fill="#d39a12" stroke="none"><circle cx="18" cy="36" r="1.5"/><circle cx="23" cy="42" r="1.5"/><circle cx="40" cy="34" r="1.5"/><circle cx="46" cy="44" r="1.5"/></g>`),
  },
  syrova_omacka: {
    label: "Sýrová omáčka", emoji: "🧀",
    svg: svg(`${bowl("#f6ecd6", "")}<ellipse cx="32" cy="32" rx="24" ry="6" fill="#ffa400"/><path fill="#ffa400" d="M46 34c0 7 4 7 4 13 0 4-5 4-5 0Z" stroke-width="2"/><path stroke="#0fa3a3" stroke-width="2.5" d="M14 42l5-3 5 3 5-3 5 3 5-3 5 3"/>`),
  },
  fazole: {
    label: "Fazolová pasta", emoji: "🫘",
    svg: svg(`${bowl("#c0602b", "")}<path fill="#6b3a22" d="M12 32c2-9 9-13 20-13s18 4 20 13Z"/><g fill="#8a4a2a" stroke-width="2"><ellipse cx="24" cy="26" rx="3.5" ry="2.3" transform="rotate(-20 24 26)"/><ellipse cx="38" cy="24" rx="3.5" ry="2.3" transform="rotate(15 38 24)"/></g><path stroke="#f6ecd6" stroke-width="2.5" d="M16 40l5-3 5 3 5-3 5 3 5-3 5 3"/>`),
  },
  paliva_omacka: {
    label: "Pálivá omáčka", emoji: "🔥",
    svg: svg(`<rect x="27" y="7" width="10" height="12" rx="2" fill="#178a4e"/><path fill="#ff5a1f" d="M26 19h12v6l4 7v22a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4V32l4-7Z"/><rect x="23" y="34" width="18" height="15" fill="#f6ecd6" stroke-width="2"/><path fill="#ffd23f" stroke-width="2" d="M32 36c5 4 5 10 0 12-5-2-5-8 0-12Z"/>`),
  },
};

/** URL obrázku pro sprite (vlastní src má přednost). */
export function spriteSrc(key) {
  const s = SPRITES[key];
  if (!s) return "";
  if (s.src) return s.src;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s.svg)}`;
}

/** Načte obrázky pro canvas. Co se nenačte, zůstane null → kreslí se emoji. */
export function loadSpriteImages(keys) {
  return Promise.all(
    keys.map(
      key =>
        new Promise(resolve => {
          const img = new Image();
          img.onload = () => resolve([key, img]);
          img.onerror = () => resolve([key, null]);
          img.src = spriteSrc(key);
        }),
    ),
  ).then(entries => new Map(entries));
}
