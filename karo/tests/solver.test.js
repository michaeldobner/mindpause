import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../js/game.js';
import { solve, fromGame, hintFor, toGameMove } from '../js/solver.js';

// Eine gefundene Lösung muss sich im echten Spiel nachspielen lassen
function replay(seed, draw) {
  const g = new Game({ seed, draw });
  const r = solve(fromGame(g), { draw, budget: 100000 });
  if (r.status !== 'solved') return null;
  for (let i = 0; i < 2000 && !g.isWon; i++) {
    if (g.canAutoComplete) {
      const m = g.autoMove();
      g.move(m.from, m.to);
      continue;
    }
    const h = hintFor(g, 100000);
    assert.equal(h.status, 'solved', `Spiel ${seed}: Löser verliert den Weg`);
    if (h.move.type === 'draw') assert.ok(g.drawCards(), 'Ziehen muss möglich sein');
    else assert.ok(g.move(h.move.from, h.move.to), `Spiel ${seed}: ungültiger Zug ${JSON.stringify(h.move)}`);
  }
  return g.isWon;
}

test('Lösungen lassen sich Zug für Zug nachspielen (1 Karte)', () => {
  let solved = 0;
  for (const seed of [1, 2, 3, 4, 5, 6]) if (replay(seed, 1)) solved += 1;
  assert.ok(solved >= 3);
});

test('Lösungen lassen sich Zug für Zug nachspielen (3 Karten)', () => {
  let solved = 0;
  for (const seed of [1, 2, 3, 4, 5, 6]) if (replay(seed, 3)) solved += 1;
  assert.ok(solved >= 2);
});

test('Tipp bei fast fertigem Spiel und Übersetzung der Züge', () => {
  const g = new Game({ seed: 1 });
  g.tableau.forEach((c) => { c.down = []; c.up = []; });
  g.stock = [];
  g.waste = [];
  g.foundations = [13, 13, 13, 12];
  g.tableau[2].up = [51];
  const h = hintFor(g);
  assert.equal(h.status, 'solved');
  assert.deepEqual(h.move.from, { pile: 'tableau', col: 2, index: 0 });
  assert.equal(toGameMove(g, null), null);
});
