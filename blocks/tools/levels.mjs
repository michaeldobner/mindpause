// Erzeugt die 30 Level von BLOCKS (js/level-data.js).
//
// Für jedes Level nach der Kurve in js/levels.js: ein spiegelsymmetrisches Startbrett ohne volle
// Linie, ein Startwert für die Steinfolge, und ein Durchgang des Computerspielers, der immer dem
// Tipp folgt. Aufgenommen wird nur, was er schafft. Seine Zahl an Steinen ist der Richtwert für
// drei Sterne. Gleiche Kurve ergibt immer dieselben Level.
//
//   node blocks/tools/levels.mjs

import { writeFileSync } from 'node:fs';
import { Game, fullLines, canPlaceAll } from '../js/game.js';
import { levelParams, LEVEL_COUNT } from '../js/levels.js';
import { createRandom } from '../js/shapes.js';

const SIZE = 8;
const LIMIT = 400; // höchstens so viele Steine pro Durchgang

// Spiegelsymmetrisches Brett: ruhiger fürs Auge, wie ein gestaltetes Muster
function symmetricBoard(density, rng) {
  const b = Array.from({ length: SIZE }, () => new Array(SIZE).fill(false));
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE / 2; x++) {
      if (rng.next() < density) b[y][x] = b[y][SIZE - 1 - x] = true;
    }
  }
  // Volle Linien bekommen eine Lücke, gespiegelt
  for (;;) {
    const { rows, cols } = fullLines(b);
    if (rows.length) {
      const x = Math.floor(rng.next() * (SIZE / 2));
      b[rows[0]][x] = b[rows[0]][SIZE - 1 - x] = false;
    } else if (cols.length) {
      const y = Math.floor(rng.next() * SIZE);
      b[y][cols[0]] = b[y][SIZE - 1 - cols[0]] = false;
    } else break;
  }
  return b.map((r) => r.map((v) => (v ? '#' : '.')).join(''));
}

function play(n, board, seed) {
  const custom = { ...levelParams(n), size: SIZE, board, seed, par: 0, calm: false };
  const g = new Game({ mode: 'level', level: n, custom });
  if (!canPlaceAll(g.board, g.tray, { n: 1e6 })) return null;
  while (g.state === 'playing' && g.moves < LIMIT) {
    const h = g.hint();
    if (!h) break;
    g.place(h.slot, h.x, h.y);
  }
  return g.state === 'won' ? g.moves : null;
}

const out = [];
for (let n = 1; n <= LEVEL_COUNT; n++) {
  const p = levelParams(n);
  const rng = createRandom(7919 * n);
  let found = null;
  for (let attempt = 1; attempt <= 400 && !found; attempt++) {
    const board = symmetricBoard(p.density, rng);
    const filled = board.join('').split('#').length - 1;
    // Dichte soll ungefähr stimmen, damit die Kurve hält
    if (Math.abs(filled / (SIZE * SIZE) - p.density) > 0.05) continue;
    const seed = 100000 * n + attempt;
    const par = play(n, board, seed);
    // Zu schnell gelöste Level wären keine Herausforderung
    if (par && par >= 4 + Math.floor(n / 3)) found = { board, seed, par, filled };
  }
  if (!found) throw new Error(`Level ${n}: kein lösbares Brett gefunden`);
  out.push(found);
  console.log(`Level ${String(n).padStart(2)}  Kapitel ${p.chapter}  Dichte ${(found.filled / 64).toFixed(2)}  Ziel ${p.target}  Richtwert ${found.par} Steine`);
}

const body = out.map((l) => `  { seed: ${l.seed}, par: ${l.par}, board: [${l.board.map((r) => `'${r}'`).join(', ')}] },`).join('\n');
writeFileSync(new URL('../js/level-data.js', import.meta.url), `// Erzeugt von tools/levels.mjs, nicht von Hand ändern.
// Je Level: Startwert der Steinfolge, Richtwert für drei Sterne (Steine des Computerspielers),
// Startbrett (# ist ein Startstein).
export const LEVEL_DATA = [
${body}
];
`);
console.log('js/level-data.js geschrieben');
