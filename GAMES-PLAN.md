# Taco Boss – mini games (plan for Claude Code)

Two short, funny, mobile-first games for tacoboss.cz:

1. **El Boss chytá** – catch falling ingredients with the mascot.
2. **¡Orden!** – assemble the customer's order from the real menu.

## Scope

**In:** two playable games, a "Hry" section on the home page linking to them, El Boss voice lines, local best score.

**Out (for now):** login, accounts, backend, points economy, discounts, leaderboards. Alejandro decides the loyalty logic later. Do not build any of it.

**One hook for later:** every game ends by calling a single `onGameEnd({ game, score })` function. Today it only saves the best score locally. A points system can be attached there later without touching the games.

## Before you write code

1. Read the repo. Tell Miloš in a few lines what the stack is, where pages, styles, images and audio live, and where you plan to put the games.
2. Follow the existing stack and conventions. Do not add a framework or a game engine. Ask before adding any dependency.
3. Reuse the site's fonts, colors (theme `#e4007c`), lotería card style and the mascot (`/img/mascot.webp`).

## Site integration

- New home section **"Los Juegos"** with two lotería-style cards (one per game), plus a **"Hry"** item in the nav.
- Each game has its own URL so it can be shared or put on a QR code later:
  - `/hry/el-boss-chyta/`
  - `/hry/orden/`
- Game code loads only on the game pages. The home page must not get heavier.
- Add both pages to the sitemap, give each a title and meta description in Czech.
- Do not change the behavior of existing sections (menu, Rockola, ordering, FAQ).

## Shared game shell

Both games use the same shell:

- **Screens:** start (title, one-line how-to, "Hrát" button) → game → result.
- **Result screen:** score in 🌶️, best score, rank title, buttons "Hrát znovu", "Zkus druhou hru", "Sdílet" (Web Share API with text + link, hidden where unsupported), and a soft link "Dostal jsi hlad? Mrkni na menu".
- **Rank titles** by score: Aprendiz → Taquero → Jefe → El Boss. Tune thresholds after playtesting so a typical first run lands on Taquero.
- **Best score:** `localStorage`, wrapped in try/catch; game works without it.
- **Layout:** portrait phone first (360 px wide and up). The play area must not scroll or zoom the page while playing.
- **Controls:** touch, mouse and keyboard.
- **Pause** when the tab is hidden.
- **Reduced motion:** no screen shake or flashing when `prefers-reduced-motion` is set.
- **Language:** all UI copy in Czech, informal "ty", with Spanish exclamations, same tone as the rest of the site.

## Art

- El Boss = existing mascot image.
- Ingredients and junk items = simple flat SVG icons drawn in code (emoji as fallback). No generated or stock images in this pass.
- Keep all sprites in one manifest so nicer illustrations can be swapped in later without code changes.

---

## Game 1: El Boss chytá

**Idea:** ingredients fall from the top, El Boss stands at the bottom with a tortilla and catches them. Junk falls too.

**Round:** 60 seconds.

**Controls:** El Boss follows the finger or mouse horizontally; arrow keys or A/D on keyboard.

| Item | Effect |
|---|---|
| Hovězí, kuřecí, tofu, sýr, pico de gallo, guacamole, nakládaná cibule, jalapeño, limetka | +1 🌶️ |
| Zlaté avokádo (rare, about one per 15 s) | +5 🌶️ |
| Knedlík, ponožka, kečup, budík | −3 🌶️, combo reset, El Boss stunned for half a second |

**Rules:**

- Score never goes below 0.
- **Combo:** every 5 good catches in a row raises the multiplier by 1, up to ×3. A missed good item or a junk catch resets it.
- **Ramp:** fall speed and spawn rate grow steadily through the round.
- **¡Fiesta!:** the last 10 seconds double the spawn rate and golden avocados appear more often.
- Each junk item has its own voice line (see Audio).

---

## Game 2: ¡Orden!

**Idea:** a customer arrives with an order ticket. The player taps ingredients onto the plate and rings the bell. Players learn the real menu while playing.

**Round:** 90 seconds.

**Recipes (from the real menu):**

| Dish | Ingredients |
|---|---|
| Tacos | kukuřičná tortilla, protein, sýr, pico de gallo, nakládaná cibule, guacamole |
| Burrito | pšeničná tortilla, protein, sýr, fazolová pasta, pico de gallo, nakládaná cibule, guacamole |
| Quesadilla | pšeničná tortilla, protein, 2× sýr, fazolová pasta, pico de gallo, nakládaná cibule, guacamole |
| Nachos | nachos, protein, sýrová omáčka, pico de gallo, nakládaná cibule, jalapeños, guacamole |

Protein is one of: hovězí, kuřecí, tofu fajitas.

**Ticket:** dish + protein + 0 to 2 modifiers. Modifiers: "bez cibule", "bez jalapeños" (nachos only), "extra guacamole", "pálivá omáčka".

**Ingredient tray (14 buttons):** kukuřičná tortilla, pšeničná tortilla, nachos, hovězí, kuřecí, tofu fajitas, sýr, sýrová omáčka, fazolová pasta, pico de gallo, nakládaná cibule, guacamole, jalapeños, pálivá omáčka.

**Rules:**

- Tap an ingredient to add it to the plate; tap it on the plate to remove it. Order of ingredients does not matter, counts do (quesadilla needs sýr twice, "extra guacamole" means two).
- Bell button **"¡Listo!"** submits the plate.
- **Correct:** +10 🌶️, plus 1 🌶️ per second of patience left, plus a streak bonus. Next customer.
- **Wrong:** plate shakes, the wrong or missing parts are highlighted, the player can fix it while patience lasts.
- **Patience bar** per customer: starts at 15 s, shrinks to 8 s as the round goes on. When it runs out the customer leaves, streak resets, next customer.
- **Learning ramp:** the first 3 tickets show the full ingredient list. After that the ticket shows only dish, protein and modifiers. A "?" button reveals the recipe and costs 2 s of patience.
- If playtesting shows "2× sýr" is confusing, print it explicitly on the ticket.

**Customers:** six characters shown as a simple avatar + name + one short text bubble (text only, not voiced): rocker z festivalu, babička, hladový student, hokejový fanoušek, nevěsta, turista z Mexika.

---

## Audio

**Voice:** El Boss, ElevenLabs model `eleven_v4`, voice "Leo" (id `wXojZ3FhzsE0AumH6Oym`, Mexican accent). Miloš delivers the mp3 files; put them in the site's audio folder under `games/voice/`, one file per key below.

**Sound effects:** short synthesized Web Audio sounds made in code (catch pop, junk buzz, bell, countdown tick). No sound files needed.

**Music:** none. The site already has the Rockola; if it is playing, leave it alone.

**Rules:**

- No sound before the first tap. Mute toggle on every screen, remembered between visits.
- One voice line at a time. If one is playing, drop the new one, except the end-of-round line, which waits and plays.
- At least 2.5 seconds between voice lines so it stays funny and not annoying.
- Where a key has several variants, pick one at random.
- A missing audio file must fail silently. The games have to be fully playable before the voice files arrive.

**Voice lines:**

| Key | Text | When |
|---|---|---|
| `start_1` | ¡Órale! Jdeme na to! | round start |
| `start_2` | ¡Vámonos, amigo! | round start |
| `good_1` | ¡Qué sabroso! | good moment |
| `good_2` | ¡Perfecto! | good moment |
| `good_3` | ¡Eso es! | good moment |
| `combo_1` | ¡Combo! ¡Arriba, arriba! | multiplier goes up |
| `hurry_1` | ¡Ándale, ándale! | 20 seconds left |
| `fiesta` | ¡Fiesta! Posledních deset vteřin! | catch game, last 10 s |
| `record` | Nový rekord! ¡Eres el jefe! | new best score |
| `end_good` | Dobrá práce, amigo! A teď na opravdové tacos. | result, decent score |
| `end_bad` | No… to chce trénink. ¡Otra vez! | result, low score |
| `bad_knedlik` | Knedlík? ¡No, no, no! | caught knedlík |
| `bad_ponozka` | Ponožka do taca nepatří! | caught ponožka |
| `bad_kecup` | Kečup? ¡Dios mío! | caught kečup |
| `bad_budik` | Budík? Tady se nespěchá, amigo. | caught budík |
| `golden` | Zlaté avokádo! ¡Increíble! | caught golden avocado |
| `order_new_1` | ¡Orden! Nová objednávka! | new customer |
| `order_new_2` | Další hladový zákazník! | new customer |
| `order_ok_1` | ¡Listo! Další! | correct order |
| `order_wrong_1` | To si neobjednal, amigo. | wrong plate |
| `order_wrong_2` | Mrkni na lístek ještě jednou. | wrong plate |
| `patience_low` | Zákazník čeká! ¡Rápido! | patience under 4 s |
| `order_late` | Zákazník odešel hladový. ¡Ay, caramba! | customer left |

---

## Build order

1. Shared shell + audio manager (with silent fallback).
2. El Boss chytá.
3. ¡Orden!
4. Home section "Los Juegos" + nav item + sitemap.
5. Playtest on a real phone, tune speeds, patience and rank thresholds.

Show Miloš a preview after step 2 before continuing.

## Done when

- Both games play start to finish on iPhone Safari and Android Chrome in portrait, and on desktop with mouse and keyboard.
- The page does not scroll or zoom during play.
- Sound follows the rules above; games work with sound off and with voice files missing.
- Best score survives a page reload.
- The home page loads no game code and is not slower than before.
- No console errors.
