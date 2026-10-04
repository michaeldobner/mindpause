// Modi, Geschwindigkeit und Punkte von FUGE.

export const MODES = [
  // Endlos, alle 10 Reihen eine Stufe schneller
  { id: 'classic', levelUp: true, topOut: 'end', difficulty: 3 },
  // 40 Reihen so schnell wie möglich, gleichbleibende Geschwindigkeit
  { id: 'sprint', levelUp: false, topOut: 'end', goalLines: 40, difficulty: 2 },
  // Drei Minuten, so viele Punkte wie möglich
  { id: 'ultra', levelUp: true, topOut: 'end', timeLimit: 180, difficulty: 4 },
  // Ohne Eile: langsam, ohne Ende. Ist der Kasten voll, leert er sich
  { id: 'calm', levelUp: false, topOut: 'clear', calm: true, difficulty: 1 },
];

export const modeById = (id) => MODES.find((m) => m.id === id);

export const LINES_PER_LEVEL = 10;
export const MAX_SPEED_LEVEL = 20;
export const CALM_SECONDS_PER_ROW = 1.25;

// Sekunden pro Reihe nach der Kurve der Guideline: Stufe 1 eine Sekunde, ab Stufe 20 sofort
export function gravity(level) {
  const l = Math.min(MAX_SPEED_LEVEL, Math.max(1, level));
  return Math.pow(0.8 - (l - 1) * 0.007, l - 1);
}

const LINE_POINTS = [0, 100, 300, 500, 800];
const TSPIN_POINTS = [400, 800, 1200, 1600];
const MINI_POINTS = [100, 200, 400];
const PERFECT_POINTS = [0, 800, 1200, 1800, 2000];

// Punkte für das Ablegen eines Steins. Liefert Punkte und den neuen Zustand von Serie und Folge.
// tspin: 'none', 'mini' oder 'full'. b2b: die letzte Reihe war schwierig. combo: -1 ohne Serie.
export function scoreLock({ lines, tspin = 'none', level = 1, b2b = false, combo = -1, perfect = false }) {
  let base = 0;
  if (tspin === 'full') base = TSPIN_POINTS[lines];
  else if (tspin === 'mini') base = MINI_POINTS[Math.min(lines, 2)];
  else base = LINE_POINTS[lines];

  const difficult = lines === 4 || (tspin !== 'none' && lines > 0);
  const backToBack = difficult && b2b;
  let points = base * level;
  if (backToBack) points = Math.floor(points * 1.5);

  const nextCombo = lines > 0 ? combo + 1 : -1;
  if (nextCombo > 0) points += 50 * nextCombo * level;
  if (perfect && lines > 0) points += PERFECT_POINTS[lines] * level;

  let nextB2b = b2b;
  if (lines > 0) nextB2b = difficult;
  return { points, b2b: nextB2b, backToBack, combo: nextCombo, difficult };
}

// Sterne je Modus aus dem besten Ergebnis
export function starsFor(modeId, best) {
  if (modeId === 'calm') return null; // Ruhe kennt keine Wertung
  if (!best) return 0;
  if (modeId === 'classic') return best.lines >= 150 ? 3 : best.lines >= 80 ? 2 : best.lines >= 30 ? 1 : 0;
  if (modeId === 'sprint') {
    if (!best.time) return 0;
    return best.time <= 105 ? 3 : best.time <= 180 ? 2 : 1;
  }
  if (modeId === 'ultra') return best.score >= 40000 ? 3 : best.score >= 18000 ? 2 : best.score >= 6000 ? 1 : 0;
  return null;
}
