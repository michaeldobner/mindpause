// Modi, Punkte und Sterne von BLOCKS.
//
// fair: wie das Tablett gefüllt wird
//   'all'   alle drei Steine passen in irgendeiner Reihenfolge aufs Brett
//   'one'   mindestens ein Stein passt
//   'none'  reiner Zufall
// start: Anteil der Felder, die beim Start schon belegt sind. Die ersten drei Steine passen immer.

export const MODES = [
  // Das bekannte Spiel: 8 × 8, leicht belegt, danach passt mindestens ein neuer Stein
  { id: 'classic', size: 8, start: 0.15, fair: 'one', calm: false, difficulty: 3 },
  // Mehr Platz: 10 × 10
  { id: 'wide', size: 10, start: 0.15, fair: 'one', calm: false, difficulty: 2 },
  // Ohne Ende: jedes Tablett passt, ein volles Brett räumt sich auf
  { id: 'calm', size: 8, start: 0.2, fair: 'all', calm: true, difficulty: 1 },
];

export const modeById = (id) => MODES.find((m) => m.id === id);

// Die Serie reißt, wenn so viele Steine nacheinander nichts abräumen
export const STREAK_KEEP = 3;
export const PERFECT_POINTS = 300;

// Punkte für k Reihen und Spalten auf einmal: 20, 60, 120, 200, 300 …
export const linePoints = (k) => 10 * k * (k + 1);

// Punkte für einen gelegten Stein. streak ist die Serie nach diesem Stein (1 beim ersten Abräumen).
export function scorePlace({ cells, lines, streak = 0, perfect = false }) {
  let points = cells;
  if (lines > 0) points += linePoints(lines) * Math.max(1, streak);
  if (perfect) points += PERFECT_POINTS;
  return points;
}

// Grenzen für die Sterne je Modus, aus Spielen eines einfachen Computerspielers geschätzt
const STARS = {
  classic: [1500, 5000, 12000],
  wide: [2500, 8000, 20000],
};

export function starsFor(modeId, best) {
  const limits = STARS[modeId];
  if (!limits) return null; // Ruhe kennt keine Wertung
  if (!best) return 0;
  return limits.filter((v) => best.score >= v).length;
}
