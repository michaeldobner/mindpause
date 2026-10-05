// Die 30 Level von BLOCKS.
//
// Ziel jedes Levels: alle Startsteine abräumen und die Punktzahl erreichen.
// Die Schwierigkeit folgt einer Sägezahnkurve: sechs Kapitel zu fünf Leveln. Innerhalb eines
// Kapitels steigen Dichte des Startbretts und Punkteziel, zu Beginn des nächsten Kapitels fällt
// beides etwas ab und steigt dann höher als zuvor. Neue Formen kommen kapitelweise dazu, das
// erste Level eines Kapitels führt sie auf einem leichteren Brett ein.
//
// Startbrett, Startwert und Richtwert für die Sterne stehen in level-data.js. Sie werden von
// tools/levels.mjs erzeugt, das jedes Level mit dem Computerspieler durchspielt.

import { LEVEL_DATA } from './level-data.js?v=1.1.0';

export const LEVEL_COUNT = 30;
export const CHAPTER = 5;

// Formen je Kapitel: erst kleine, dann lange, dann große
const FAMILIES = [
  ['dot', 'i2', 'i3', 'c3', 'o2'],
  ['dot', 'i2', 'i3', 'c3', 'o2', 'i4', 'l4', 't4'],
  ['dot', 'i2', 'i3', 'c3', 'o2', 'i4', 'l4', 't4', 's4', 'i5'],
  ['dot', 'i2', 'i3', 'c3', 'o2', 'i4', 'l4', 't4', 's4', 'i5', 'c5', 'r6'],
  null, // alle Formen, dazu das Quadrat aus neun
  null,
];

// Kurve: Dichte und Ziel je Kapitel und Stufe im Kapitel
const DENSITY = [0.22, 0.27, 0.32, 0.36, 0.4, 0.44];
const TARGET = [150, 350, 600, 900, 1250, 1650];

export function levelParams(n) {
  const c = Math.floor((n - 1) / CHAPTER);
  const step = (n - 1) % CHAPTER;
  return {
    n,
    chapter: c + 1,
    density: Math.round((DENSITY[c] + step * 0.025) * 1000) / 1000,
    target: TARGET[c] + step * 50,
    families: FAMILIES[c],
    // In den letzten beiden Kapiteln passt nur noch mindestens ein Stein jedes Tabletts sicher
    fair: c < 4 ? 'all' : 'one',
    // Schwierigkeit für die Punkte auf der Karte, 1 bis 5
    difficulty: Math.min(5, 1 + Math.floor((c * CHAPTER + step) / 6)),
  };
}

// Vollständige Beschreibung eines Levels für das Spiel
export function levelDef(n) {
  const data = LEVEL_DATA[n - 1];
  if (!data) return null;
  const p = levelParams(n);
  return { ...p, id: `level-${n}`, size: data.board.length, board: data.board, seed: data.seed, par: data.par, calm: false };
}

// Sterne: geschafft ★, mit höchstens anderthalb mal so vielen Steinen wie der Computerspieler ★★,
// mit höchstens so vielen ★★★
export function levelStars(n, pieces) {
  const def = levelDef(n);
  if (!def || !pieces) return 0;
  if (pieces <= def.par) return 3;
  if (pieces <= Math.ceil(def.par * 1.5)) return 2;
  return 1;
}
