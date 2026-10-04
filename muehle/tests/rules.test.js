import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  WHITE, BLACK, MILLS, ADJACENT, GRID, initialState, legalMoves, applyMove, removable, inMill,
  phaseOf, lossReason, pointAt as at, pointName,
} from '../js/rules.js';

// Stellung aus Punktnamen bauen, zum Beispiel { w: ['a7', 'd7'], b: ['g1'] }
function position({ w = [], b = [], hand = [0, 0], turn = WHITE }) {
  const s = initialState();
  for (const n of w) s.board[at(n)] = WHITE;
  for (const n of b) s.board[at(n)] = BLACK;
  s.hand = { [WHITE]: hand[0], [BLACK]: hand[1] };
  s.turn = turn;
  return s;
}

test('Brett: 24 Punkte, 32 Verbindungen, 16 Mühlen', () => {
  assert.equal(GRID.length, 24);
  assert.equal(new Set(GRID.map((p) => p.join())).size, 24);
  assert.equal(ADJACENT.flat().length / 2, 32);
  assert.equal(MILLS.length, 16);
  // Jede Verbindung gilt in beide Richtungen, jede Mühle liegt auf einer Geraden
  ADJACENT.forEach((list, i) => list.forEach((j) => assert.ok(ADJACENT[j].includes(i))));
  for (const m of MILLS) {
    const [a, b, c] = m.map((p) => GRID[p]);
    assert.ok((a[0] === b[0] && b[0] === c[0]) || (a[1] === b[1] && b[1] === c[1]), m.join());
  }
});

test('Notation: a7 oben links, g1 unten rechts, d5 auf dem inneren Ring', () => {
  assert.equal(pointName(0), 'a7');
  assert.equal(pointName(4), 'g1');
  assert.equal(at('d5'), 17);
  assert.equal(at('x9'), -1);
});

test('Start: Weiß setzt, 24 freie Punkte, keine Wegnahme', () => {
  const s = initialState();
  const moves = legalMoves(s);
  assert.equal(moves.length, 24);
  assert.ok(moves.every((m) => m.from === -1 && m.remove === -1));
  assert.equal(phaseOf(s, WHITE), 'place');
});

test('Setzen nimmt einen Stein aus dem Vorrat', () => {
  const s = applyMove(initialState(), { from: -1, to: at('d6'), remove: -1 });
  assert.equal(s.hand[WHITE], 8);
  assert.equal(s.board[at('d6')], WHITE);
  assert.equal(s.turn, BLACK);
});

test('Mühle schließen: je nehmbarem Stein ein eigener Zug', () => {
  const s = position({ w: ['a7', 'd7'], b: ['g1', 'g4'], hand: [7, 7] });
  const closing = legalMoves(s).filter((m) => m.to === at('g7'));
  assert.deepEqual(closing.map((m) => m.remove).sort((a, b) => a - b), [at('g4'), at('g1')].sort((a, b) => a - b));
  const after = applyMove(s, closing[0]);
  assert.equal(after.board.filter((v) => v === BLACK).length, 1);
});

test('Steine aus einer Mühle sind geschützt, außer alle stehen in Mühlen', () => {
  const s = position({ w: ['a1'], b: ['a7', 'd7', 'g7', 'b4'] });
  assert.ok(inMill(s.board, at('d7')));
  assert.deepEqual(removable(s.board, BLACK), [at('b4')]);
  const t = position({ w: ['a1'], b: ['a7', 'd7', 'g7'] });
  assert.equal(removable(t.board, BLACK).length, 3);
});

test('Doppelmühle nimmt trotzdem nur einen Stein', () => {
  // d7 schließt a7-d7-g7 und d7-d6-d5 zugleich
  const s = position({ w: ['a7', 'g7', 'd6', 'd5'], b: ['a1', 'g1'], hand: [3, 3] });
  const moves = legalMoves(s).filter((m) => m.to === at('d7'));
  assert.equal(moves.length, 2);
  const after = applyMove(s, moves[0]);
  assert.equal(after.board.filter((v) => v === BLACK).length, 1);
});

test('Ziehen nur entlang der Linien auf freie Nachbarpunkte', () => {
  const s = position({ w: ['d6', 'a1', 'g1', 'a4'], b: ['d7', 'b6', 'f6', 'a7'] });
  assert.equal(phaseOf(s, WHITE), 'move');
  const fromD6 = legalMoves(s).filter((m) => m.from === at('d6')).map((m) => pointName(m.to));
  assert.deepEqual(fromD6, ['d5']);
});

test('Mit drei Steinen springt eine Seite auf jeden freien Punkt', () => {
  const s = position({ w: ['a1', 'g1', 'b4'], b: ['a7', 'g7', 'd2', 'f4'] });
  assert.equal(phaseOf(s, WHITE), 'fly');
  const free = s.board.filter((v) => v === 0).length;
  const quiet = legalMoves(s).filter((m) => m.remove < 0 || m.remove === at('a7'));
  assert.equal(new Set(quiet.filter((m) => m.from === at('b4')).map((m) => m.to)).size, free);
});

test('Verloren: weniger als drei Steine oder kein Zug mehr', () => {
  assert.equal(lossReason(position({ w: ['a1', 'g1'], b: ['a7', 'g7', 'd2'] })), 'few');
  // Weiß auf a7 und d7, eingeschlossen von Schwarz, vier Steine, also kein Springen
  const blocked = position({ w: ['a7', 'd7', 'g7', 'a4'], b: ['b6', 'd6', 'f6', 'g4', 'b4', 'a1'] });
  assert.equal(lossReason(blocked), 'blocked');
  assert.equal(lossReason(position({ w: ['a1', 'g1'], b: ['a7'], hand: [1, 0] })), null);
});
