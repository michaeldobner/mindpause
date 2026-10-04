import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEALS } from '../js/deals.js';
import { LEVELS, seedFor, dailySeed, dayNumber } from '../js/levels.js';
import { Game } from '../js/game.js';
import { solve, fromGame } from '../js/solver.js';

const fakeStorage = () => {
  const data = {};
  return { load: (k, f) => (k in data ? data[k] : f), save: (k, v) => { data[k] = v; } };
};

test('Jede Stufe hat für beide Ziehmodi eigene, eindeutige Spielnummern', () => {
  for (const draw of [1, 3]) {
    const seen = new Set();
    for (const level of ['easy', 'medium', 'hard', 'master']) {
      const list = DEALS[draw][level];
      assert.ok(list.length >= 3, `${draw}/${level}`);
      for (const s of list) {
        assert.ok(Number.isInteger(s) && s > 0);
        assert.ok(!seen.has(s), `${s} doppelt`);
        seen.add(s);
      }
    }
  }
});

test('Stichprobe: Spiele der schweren Stufen sind lösbar', () => {
  for (const draw of [1, 3]) {
    for (const level of ['hard', 'master']) {
      const seed = DEALS[draw][level][0];
      const r = solve(fromGame(new Game({ seed, draw })), { draw, budget: 200000 });
      assert.equal(r.status, 'solved', `${draw}/${level}/${seed}`);
    }
  }
});

test('Nächste Spielnummer geht die Liste der Reihe nach durch', () => {
  const st = fakeStorage();
  const a = seedFor('medium', 1, st, () => 0);
  const b = seedFor('medium', 1, st, () => 0);
  assert.equal(a, DEALS[1].medium[0]);
  assert.equal(b, DEALS[1].medium[1 % DEALS[1].medium.length]);
  const r = seedFor('random', 1, st, () => 0.5);
  assert.ok(r >= 1 && r <= 1000000);
});

test('Tagesspiel ist für alle gleich und wechselt täglich', () => {
  const d1 = new Date(2026, 9, 4);
  const d2 = new Date(2026, 9, 5);
  assert.equal(dayNumber(new Date(2026, 0, 1)), 0);
  assert.equal(dailySeed(1, d1), dailySeed(1, new Date(2026, 9, 4, 22, 0)));
  assert.ok(DEALS[1].medium.includes(dailySeed(1, d1)));
  if (DEALS[1].medium.length > 1) assert.notEqual(dailySeed(1, d1), dailySeed(1, d2));
  assert.equal(seedFor('daily', 3, fakeStorage()), dailySeed(3));
  assert.equal(LEVELS.length, 6);
});
