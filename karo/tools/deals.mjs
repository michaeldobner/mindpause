// Teilt Spielnummern in Schwierigkeitsstufen ein und schreibt karo/js/deals.js.
// Läuft einmalig auf dem Rechner, nicht im Spiel. Das Spiel liefert nur die fertigen Listen aus.
//
//   node karo/tools/deals.mjs [anzahl je stufe]
//
// Für jede Spielnummer und jeden Ziehmodus (1 oder 3 Karten):
//   1. Ein einfacher Spieler (player.mjs) spielt sie 24 Mal. Seine Gewinnquote zeigt, wie
//      naheliegend der Weg ist. Gewinnt er einmal, ist das Spiel sicher lösbar.
//   2. Gewinnt er nie, sucht der Löser (solver.js) mit Kenntnis aller Karten einen Weg.
//      Wie viele Stellungen er dafür untersucht, zeigt, wie schmal der Weg ist.
//
// Stufen:
//   easy     Gewinnquote ab 50 %
//   medium   Gewinnquote 10 bis 50 %
//   hard     Gewinnquote unter 10 %, oder 0 % und der Löser findet den Weg schnell
//   master   Gewinnquote 0 % und der Löser braucht lange, der Weg ist schmal
// Nur sicher lösbare Spiele kommen in eine Liste.

import { writeFileSync } from 'node:fs';
import { Game } from '../js/game.js';
import { solve, fromGame } from '../js/solver.js';
import { winRate } from './player.mjs';

const PER_LEVEL = Number(process.argv[2]) || 200;
const LEVELS = ['easy', 'medium', 'hard', 'master'];
const NARROW = { 1: 400, 3: 1500 }; // ab so vielen untersuchten Stellungen gilt der Weg als schmal

function classify(seed, draw) {
  const rate = winRate(seed, draw);
  if (rate >= 0.5) return 'easy';
  if (rate >= 0.1) return 'medium';
  if (rate > 0) return 'hard';
  const r = solve(fromGame(new Game({ seed, draw })), { draw, budget: 60000 });
  if (r.status !== 'solved') return null;
  return r.nodes >= NARROW[draw] ? 'master' : 'hard';
}

const result = {};
for (const draw of [1, 3]) {
  const lists = Object.fromEntries(LEVELS.map((l) => [l, []]));
  for (let seed = 1; LEVELS.some((l) => lists[l].length < PER_LEVEL); seed++) {
    const level = classify(seed, draw);
    if (level && lists[level].length < PER_LEVEL) lists[level].push(seed);
    if (seed % 500 === 0) console.log(`${draw} Karte(n), Nummer ${seed}: ${LEVELS.map((l) => `${l} ${lists[l].length}`).join(', ')}`);
  }
  result[draw] = lists;
}

const lines = [
  '// Spielnummern je Stufe und Ziehmodus. Erzeugt von karo/tools/deals.mjs, nicht von Hand ändern.',
  '// Jede Nummer ist sicher lösbar. Die Stufe richtet sich danach, wie naheliegend der Weg ist.',
  '',
  'export const DEALS = {',
  ...[1, 3].flatMap((draw) => [
    `  ${draw}: {`,
    ...LEVELS.map((l) => `    ${l}: [${result[draw][l].join(',')}],`),
    '  },',
  ]),
  '};',
  '',
];
writeFileSync(new URL('../js/deals.js', import.meta.url), lines.join('\n'));
console.log('karo/js/deals.js geschrieben');
