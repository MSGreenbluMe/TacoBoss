// Skóre a jediný háček na konec hry.
// Dnes jen ukládá nejlepší skóre do localStorage. Věrnostní body se později
// napojí tady – hry samotné se měnit nemusí.

const key = game => `tacoboss.best.${game}`;

export function getBest(game) {
  try {
    return Number(localStorage.getItem(key(game))) || 0;
  } catch {
    return 0;
  }
}

/**
 * Volá každá hra právě jednou na konci kola.
 * @param {{ game: string, score: number }} result
 * @returns {{ best: number, previousBest: number, isRecord: boolean }}
 */
export function onGameEnd({ game, score }) {
  const previousBest = getBest(game);
  const isRecord = score > previousBest;
  if (isRecord) {
    try {
      localStorage.setItem(key(game), String(score));
    } catch {
      // bez localStorage hra funguje dál, jen si rekord nepamatuje
    }
  }
  // TODO (věrnostní program): odeslat { game, score } na server a připsat body.
  return { best: Math.max(previousBest, score), previousBest, isRecord };
}
