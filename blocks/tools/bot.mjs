// Ein einfacher Computerspieler, der immer dem Tipp folgt. Dient zum Abschätzen der Grenzen
// für die Sterne (js/modes.js) und zum Prüfen, wie schnell das Füllen des Tabletts ist.
//
//   node blocks/tools/bot.mjs [Spiele je Modus]

import { Game } from '../js/game.js';
import { MODES } from '../js/modes.js';

const N = Number(process.argv[2]) || 40;
const LIMIT = 3000; // höchstens so viele Steine pro Spiel

for (const mode of MODES) {
  const scores = [];
  const t0 = performance.now();
  let moves = 0;
  for (let i = 0; i < N; i++) {
    const g = new Game({ mode: mode.id, seed: 1000 + i });
    while (g.state === 'playing' && g.moves < LIMIT) {
      const h = g.hint();
      if (!h) break;
      g.place(h.slot, h.x, h.y);
    }
    moves += g.moves;
    scores.push(g.score);
  }
  scores.sort((a, b) => a - b);
  const q = (p) => scores[Math.min(scores.length - 1, Math.floor(p * scores.length))];
  const ms = (performance.now() - t0) / moves;
  console.log(`${mode.id.padEnd(8)} Median ${q(0.5)}  25 % ${q(0.25)}  75 % ${q(0.75)}  90 % ${q(0.9)}  ${(moves / N).toFixed(0)} Steine  ${ms.toFixed(2)} ms pro Stein`);
}
