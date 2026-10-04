import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../js/game.js';
import { BLUE, BLACK, indexOf as at } from '../js/rules.js';
import { chooseMove, evaluate } from '../js/ai.js';

// Fester Zufall für wiederholbare Tests
function seeded(seed) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

test('Zug, Seitenwechsel und Zurück stellen alles wieder her', () => {
  const g = new Game();
  const before = JSON.stringify(g.serialize());
  const rec = g.apply(g.moves[0]);
  assert.equal(g.turn, BLACK);
  assert.equal(rec.side, BLUE);
  assert.equal(g.ids[rec.move.to], rec.mover);
  g.undo();
  assert.equal(JSON.stringify(g.serialize()), before);
  assert.equal(g.history.length, 0);
});

test('Steinnummern: Farben und Wege bleiben stimmig', () => {
  const g = new Game();
  const ids = g.ids.filter((x) => x !== null);
  assert.equal(new Set(ids).size, 24);
  g.board.forEach((v, i) => {
    if (v) assert.equal(Game.colorOf(g.ids[i]), Math.sign(v));
  });
});

function kingsOnly() {
  const g = new Game();
  const board = new Array(64).fill(0);
  const ids = new Array(64).fill(null);
  board[at(7, 0)] = 2; ids[at(7, 0)] = 12; // blaue Dame
  board[at(0, 1)] = -2; ids[at(0, 1)] = 0; // schwarze Dame, nicht auf derselben Diagonale
  g.restore({ board, ids, turn: BLUE });
  return g;
}

test('Remis nach 30 Halbzügen nur mit Damen ohne Schlag', () => {
  const g = kingsOnly();
  g.quiet = 29;
  const m = g.moves.find((x) => x.captured.length === 0);
  g.apply(m);
  assert.deepEqual(g.result, { draw: 'quiet' });
});

test('Remis bei dreifacher Wiederholung', () => {
  const g = kingsOnly();
  const there = g.findMove(at(7, 0), at(6, 1));
  for (let k = 0; k < 2 && !g.isOver; k++) {
    g.apply(g.findMove(at(7, 0), at(6, 1)) || there);
    g.apply(g.findMove(at(0, 1), at(1, 0)));
    g.apply(g.findMove(at(6, 1), at(7, 0)));
    g.apply(g.findMove(at(1, 0), at(0, 1)));
  }
  assert.deepEqual(g.result, { draw: 'repetition' });
});

test('Spiel gespeichert und fortgesetzt', () => {
  const g = new Game();
  g.apply(g.moves[0]);
  const data = JSON.parse(JSON.stringify(g.serialize()));
  const h = new Game();
  assert.ok(h.restore(data));
  assert.deepEqual(h.board, g.board);
  assert.equal(h.turn, BLACK);
  assert.equal(h.restore({ board: [1, 2] }), false);
});

test('Computer nimmt einen gewinnbringenden Schlag', () => {
  const b = new Array(64).fill(0);
  b[at(5, 2)] = BLUE;
  b[at(4, 3)] = BLACK;
  b[at(0, 1)] = BLACK;
  const m = chooseMove(b, BLUE, 'medium', { random: seeded(1) });
  assert.deepEqual(m.captured, [at(4, 3)]);
});

test('Bewertung ist symmetrisch', () => {
  const g = new Game();
  assert.equal(evaluate(g.board, BLUE), -evaluate(g.board, BLACK));
});

test('Mittel gewinnt deutlich gegen Leicht', () => {
  let mediumWins = 0;
  const games = 4;
  for (let k = 0; k < games; k++) {
    const g = new Game();
    const random = seeded(100 + k);
    const mediumSide = k % 2 === 0 ? BLUE : BLACK;
    let plies = 0;
    while (!g.isOver && plies < 160) {
      const level = g.turn === mediumSide ? 'medium' : 'easy';
      g.apply(g.match(chooseMove(g.board, g.turn, level, { random })));
      plies++;
    }
    if (g.result && g.result.winner === mediumSide) mediumWins++;
  }
  assert.ok(mediumWins >= 3, `Mittel gewann ${mediumWins} von ${games}`);
});

test('Tippen auf ein Ziel wählt den Schlagweg mit den meisten Steinen', () => {
  // Gleiches Start- und Zielfeld mit verschieden langen Schlagwegen: findMove nimmt den längsten
  const random = seeded(11);
  let checked = 0;
  for (let n = 0; n < 200; n++) {
    const g = new Game();
    while (!g.isOver && g.history.length < 120) {
      for (const m of g.moves) {
        const best = g.findMove(m.from, m.to);
        assert.ok(best.captured.length >= m.captured.length);
        checked++;
      }
      g.apply(g.moves[Math.floor(random() * g.moves.length)]);
    }
  }
  assert.ok(checked > 1000);
});
