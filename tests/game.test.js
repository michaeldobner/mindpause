import { test } from 'node:test';
import assert from 'node:assert/strict';
import { figureById } from '../js/figures.js';
import { Game } from '../js/game.js';

const newGame = () => new Game(figureById('klassisch'));

test('Startstellung: 33 Felder, 32 Murmeln, Mitte frei', () => {
  const g = newGame();
  assert.equal(g.cells.length, 33);
  assert.equal(g.count, 32);
  assert.ok(g.isEmpty(g.cellAt(3, 3)));
});

test('Zu Beginn gibt es genau 4 Züge, alle in die Mitte', () => {
  const g = newGame();
  const moves = g.allMoves();
  assert.equal(moves.length, 4);
  assert.ok(moves.every((m) => m.to === g.cellAt(3, 3)));
});

test('Keine diagonalen Sprünge', () => {
  const g = newGame();
  assert.equal(g.findMove(g.cellAt(1, 1), g.cellAt(3, 3)), null);
  assert.equal(g.findMove(g.cellAt(2, 2), g.cellAt(3, 3)), null);
});

test('Sprung entfernt die übersprungene Murmel, Rückgängig stellt alles wieder her', () => {
  const g = newGame();
  const before = [...g.marbles];
  const move = g.findMove(g.cellAt(1, 3), g.cellAt(3, 3));
  g.apply(move);
  assert.equal(g.count, 31);
  assert.ok(g.isEmpty(g.cellAt(1, 3)));
  assert.ok(g.isEmpty(g.cellAt(2, 3)));
  assert.ok(g.hasMarble(g.cellAt(3, 3)));
  g.undo();
  assert.deepEqual(g.marbles, before);
  assert.equal(g.history.length, 0);
});

test('Spielstand lässt sich speichern und laden', () => {
  const g = newGame();
  g.apply(g.allMoves()[0]);
  const data = JSON.parse(JSON.stringify(g.serialize()));
  const h = newGame();
  assert.ok(h.restore(data));
  assert.deepEqual(h.marbles, g.marbles);
  assert.equal(h.count, 31);
  assert.equal(h.restore({ marbles: [1, 2] }), false);
});

test('Eine bekannte Lösung endet mit einer Murmel in der Mitte (Meisterhaft)', () => {
  // Lösung als Folge von Sprüngen [vonFeld, nachFeld]
  const solution = solve(newGame());
  assert.ok(solution, 'Löser findet eine Lösung');
  const g = newGame();
  for (const [from, to] of solution) {
    const m = g.findMove(from, to);
    assert.ok(m);
    g.apply(m);
  }
  assert.equal(g.count, 1);
  assert.ok(g.isOver);
  assert.ok(g.isPerfect);
  assert.equal(g.rating().key, 'perfect');
  assert.equal(g.rating().stars, 3);
});

test('Bewertung nach Restmurmeln', () => {
  const g = newGame();
  assert.deepEqual(g.rating(), { key: 'more', stars: 0, left: 32 });
});

// Einfacher Löser mit Merkliste bereits gesehener Stellungen
function solve(g) {
  const seen = new Set();
  const path = [];
  const goal = g.cellAt(3, 3);
  const rec = () => {
    if (g.count === 1) return g.hasMarble(goal);
    const k = g.marbles.map((m) => (m === null ? 0 : 1)).join('');
    if (seen.has(k)) return false;
    seen.add(k);
    for (const m of g.allMoves()) {
      g.apply(m);
      path.push([m.from, m.to]);
      if (rec()) return true;
      path.pop();
      g.undo();
    }
    return false;
  };
  return rec() ? path : null;
}
