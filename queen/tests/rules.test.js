import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BLUE, BLACK, initialBoard, legalMoves, applyMove, indexOf as at, countPieces } from '../js/rules.js';

const empty = () => new Array(64).fill(0);

test('Startstellung: je 12 Steine auf dunklen Feldern, 7 Züge für Blau', () => {
  const b = initialBoard();
  assert.deepEqual(countPieces(b), { blue: 12, black: 12 });
  assert.equal(legalMoves(b, BLUE).length, 7);
  assert.ok(legalMoves(b, BLUE).every((m) => m.to < m.from), 'Blau zieht nach oben');
});

test('Steine ziehen nur vorwärts, aber schlagen auch rückwärts', () => {
  const b = empty();
  b[at(4, 3)] = BLUE;
  assert.ok(legalMoves(b, BLUE).every((m) => m.to < at(4, 3)));
  b[at(5, 4)] = BLACK; // hinter dem blauen Stein
  const moves = legalMoves(b, BLUE);
  assert.equal(moves.length, 1);
  assert.deepEqual(moves[0].captured, [at(5, 4)]);
  assert.equal(moves[0].to, at(6, 5));
});

test('Schlagpflicht: Gibt es einen Schlag, sind andere Züge verboten', () => {
  const b = empty();
  b[at(5, 0)] = BLUE;
  b[at(5, 4)] = BLUE;
  b[at(4, 5)] = BLACK;
  const moves = legalMoves(b, BLUE);
  assert.ok(moves.length > 0 && moves.every((m) => m.captured.length > 0));
});

test('Mehrfachschlag wird vollständig ausgeführt', () => {
  const b = empty();
  b[at(6, 1)] = BLUE;
  b[at(5, 2)] = BLACK;
  b[at(3, 4)] = BLACK;
  const moves = legalMoves(b, BLUE);
  assert.equal(moves.length, 1);
  assert.deepEqual(moves[0].captured, [at(5, 2), at(3, 4)]);
  assert.deepEqual(moves[0].path, [at(4, 3), at(2, 5)]);
  const after = applyMove(b, moves[0]);
  assert.deepEqual(countPieces(after), { blue: 1, black: 0 });
});

test('Ein Stein darf nicht zweimal übersprungen werden', () => {
  const b = empty();
  b[at(3, 3)] = { k: 2 }.k; // blaue Dame
  b[at(4, 4)] = BLACK;
  const moves = legalMoves(b, BLUE);
  for (const m of moves) assert.equal(new Set(m.captured).size, m.captured.length);
});

test('Fliegende Dame: zieht weit und schlägt aus der Ferne, Landung frei wählbar', () => {
  const b = empty();
  b[at(7, 0)] = 2; // blaue Dame
  const quiet = legalMoves(b, BLUE);
  assert.equal(quiet.length, 7, 'ganze Diagonale');
  b[at(3, 4)] = BLACK;
  const caps = legalMoves(b, BLUE);
  assert.ok(caps.length >= 3);
  assert.ok(caps.every((m) => m.captured[0] === at(3, 4)));
  assert.deepEqual(caps.map((m) => m.to).sort((x, y) => x - y), [at(0, 7), at(1, 6), at(2, 5)].sort((x, y) => x - y));
});

test('Krönung auf der gegnerischen Grundreihe', () => {
  const b = empty();
  b[at(1, 2)] = BLUE;
  const m = legalMoves(b, BLUE).find((x) => x.to === at(0, 1));
  assert.ok(m.crown);
  assert.equal(applyMove(b, m)[at(0, 1)], 2);
});

test('Kein Krönen, wenn der Stein auf der Grundreihe weiterschlagen muss', () => {
  const b = empty();
  b[at(2, 1)] = BLUE;
  b[at(1, 2)] = BLACK; // Schlag auf die Grundreihe nach (0,3)
  b[at(1, 4)] = BLACK; // von dort weiter rückwärts nach (2,5)
  const moves = legalMoves(b, BLUE);
  assert.equal(moves.length, 1);
  assert.equal(moves[0].to, at(2, 5));
  assert.equal(moves[0].crown, false);
});

test('Wer nicht ziehen kann, hat keine Züge mehr', () => {
  const b = empty();
  b[at(0, 1)] = BLACK;
  b[at(1, 0)] = BLUE;
  b[at(2, 1)] = BLUE; // Schwarz ist blockiert? (0,1) kann nach (1,0) oder (1,2)
  b[at(1, 2)] = BLUE;
  b[at(2, 3)] = BLUE;
  assert.equal(legalMoves(b, BLACK).length, 0);
});
