import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FIGURES, GOAL, figureById, nextFigure } from '../js/figures.js';
import { Game } from '../js/game.js';
import { prepare, solve } from '../js/solver.js';

test('Alle Figuren nutzen das 33er-Kreuzbrett', () => {
  for (const f of FIGURES) {
    const g = new Game(f);
    assert.equal(g.cells.length, 33, f.id);
    assert.ok(g.count >= 2 && g.count <= 32, f.id);
    assert.ok(f.name.de && f.name.en, f.id);
    assert.ok(f.difficulty >= 1 && f.difficulty <= 5, f.id);
  }
});

test('Jede Figur ist bis auf eine Murmel in der Mitte lösbar', () => {
  for (const f of FIGURES) {
    const g = new Game(f);
    const goal = g.cellAt(...GOAL);
    const moves = solve(prepare(g.cells), g.occupancy(), goal, 60000);
    assert.ok(Array.isArray(moves), `${f.id}: ${moves}`);
    for (const [from, , to] of moves) g.apply(g.findMove(from, to));
    assert.ok(g.isPerfect, f.id);
    assert.equal(g.rating().stars, 3, f.id);
  }
});

test('Figuren sind nach Schwierigkeit sortiert, Klassisch zuletzt', () => {
  const d = FIGURES.map((f) => f.difficulty);
  assert.deepEqual(d, [...d].sort((a, b) => a - b));
  assert.equal(FIGURES.at(-1).id, 'klassisch');
  assert.equal(new Set(FIGURES.map((f) => f.id)).size, FIGURES.length);
});

test('Navigation zwischen Figuren', () => {
  assert.equal(figureById('plus').name.en, 'Plus');
  assert.equal(figureById('gibtsnicht'), null);
  assert.equal(nextFigure('kreuz').id, 'plus');
  assert.equal(nextFigure('klassisch'), null);
});

test('Löser erkennt eine unlösbare Stellung', () => {
  const g = new Game(figureById('kreuz'));
  // Zwei Murmeln, die nie zusammenkommen
  const occ = g.cells.map(() => false);
  occ[g.cellAt(0, 2)] = true;
  occ[g.cellAt(6, 4)] = true;
  assert.equal(solve(prepare(g.cells), occ, g.cellAt(...GOAL), 1000), null);
});
