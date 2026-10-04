import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../js/game.js';
import { WHITE, BLACK, DRAW_PLIES, pointAt as at } from '../js/rules.js';
import { chooseMove, evaluate } from '../js/ai.js';

// Fester Zufall für wiederholbare Tests
function seeded(seed) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

const place = (g, name) => g.apply(g.movesTo(-1, at(name))[0]);

test('Zug, Seitenwechsel und Zurück stellen alles wieder her', () => {
  const g = new Game();
  const before = JSON.stringify(g.serialize());
  const rec = place(g, 'd6');
  assert.equal(g.turn, BLACK);
  assert.equal(rec.side, WHITE);
  assert.equal(g.ids[at('d6')], rec.mover);
  assert.equal(Game.colorOf(rec.mover), WHITE);
  g.undo();
  assert.equal(JSON.stringify(g.serialize()), before);
});

test('Mühle: genommener Stein wandert aus dem Spiel, Zähler stimmen', () => {
  const g = new Game();
  for (const n of ['a7', 'g1', 'd7', 'g4']) place(g, n);
  const options = g.movesTo(-1, at('g7'));
  assert.equal(options.length, 2);
  const rec = g.apply(options[0]);
  assert.equal(rec.mills.length, 1);
  assert.equal(Game.colorOf(rec.removedId), BLACK);
  assert.equal(g.ids.filter((x) => x === rec.removedId).length, 0);
  assert.deepEqual([g.counts.white, g.counts.black], [9, 8]);
  // Alle 18 Steine bleiben eindeutig: Brett, Vorrat und genommene ergeben zusammen jede Nummer einmal
  const seen = [...g.ids.filter((x) => x !== null), ...g.reserve[WHITE], ...g.reserve[BLACK], rec.removedId];
  assert.equal(new Set(seen).size, 18);
});

test('Remis nach 20 Zügen je Seite ohne Mühle', () => {
  const g = new Game();
  g.restore({
    board: Object.assign(new Array(24).fill(0), { [at('a7')]: WHITE, [at('a1')]: WHITE, [at('g1')]: WHITE, [at('b4')]: WHITE, [at('g7')]: BLACK, [at('d2')]: BLACK, [at('f4')]: BLACK, [at('d5')]: BLACK }),
    ids: new Array(24).fill(null), hand: { [WHITE]: 0, [BLACK]: 0 }, reserve: { [WHITE]: [], [BLACK]: [] }, turn: WHITE, quiet: DRAW_PLIES - 1,
  });
  g.apply(g.moves.find((m) => m.remove < 0));
  assert.deepEqual(g.result, { draw: 'quiet' });
});

test('Remis bei dreifacher Wiederholung', () => {
  const g = new Game();
  g.restore({
    board: Object.assign(new Array(24).fill(0), { [at('a7')]: WHITE, [at('a1')]: WHITE, [at('g1')]: WHITE, [at('f6')]: WHITE, [at('g7')]: BLACK, [at('d2')]: BLACK, [at('c3')]: BLACK, [at('e5')]: BLACK }),
    ids: new Array(24).fill(null), hand: { [WHITE]: 0, [BLACK]: 0 }, reserve: { [WHITE]: [], [BLACK]: [] }, turn: WHITE,
  });
  const go = (a, b) => g.apply(g.movesTo(at(a), at(b))[0]);
  for (let k = 0; k < 2; k++) {
    go('f6', 'f4');
    go('e5', 'd5');
    go('f4', 'f6');
    go('d5', 'e5');
  }
  assert.deepEqual(g.result, { draw: 'repetition' });
});

test('Spiel gespeichert und fortgesetzt', () => {
  const g = new Game();
  place(g, 'd6');
  const data = JSON.parse(JSON.stringify(g.serialize()));
  const h = new Game();
  assert.ok(h.restore(data));
  assert.deepEqual(h.board, g.board);
  assert.equal(h.turn, BLACK);
  assert.equal(h.hand[WHITE], 8);
  assert.equal(h.restore({ board: [1, 2] }), false);
});

test('Computer schließt eine Mühle, wenn er kann', () => {
  const g = new Game();
  for (const n of ['a7', 'g1', 'd7', 'g4']) place(g, n);
  const m = chooseMove(g.state, 'medium', { random: seeded(1) });
  assert.equal(m.to, at('g7'));
  assert.ok(m.remove >= 0);
});

test('Computer verhindert eine gegnerische Mühle', () => {
  const g = new Game();
  for (const n of ['a7', 'g1', 'd7']) place(g, n);
  const m = chooseMove(g.state, 'medium', { random: seeded(2) });
  assert.equal(m.to, at('g7'));
});

test('Bewertung ist symmetrisch', () => {
  const g = new Game();
  for (const n of ['a7', 'g1', 'd7', 'b4']) place(g, n);
  assert.equal(evaluate(g.state, WHITE), -evaluate(g.state, BLACK));
});

test('Mittel gewinnt deutlich gegen Leicht', () => {
  let mediumWins = 0;
  const games = 4;
  for (let k = 0; k < games; k++) {
    const g = new Game();
    const random = seeded(100 + k);
    const mediumSide = k % 2 === 0 ? WHITE : BLACK;
    while (!g.isOver && g.history.length < 200) {
      const level = g.turn === mediumSide ? 'medium' : 'easy';
      g.apply(g.match(chooseMove(g.state, level, { random })));
    }
    if (g.result && g.result.winner === mediumSide) mediumWins++;
  }
  assert.ok(mediumWins >= 3, `Mittel gewann ${mediumWins} von ${games}`);
});

test('Zufallspartien: jeder Zug ist erlaubt, Zurück stellt jeden Zustand wieder her', () => {
  const random = seeded(7);
  for (let n = 0; n < 40; n++) {
    const g = new Game();
    const snapshots = [];
    while (!g.isOver && g.history.length < 150) {
      snapshots.push(JSON.stringify(g.serialize()));
      g.apply(g.moves[Math.floor(random() * g.moves.length)]);
      const { white, black } = g.counts;
      assert.ok(white >= 2 && black >= 2);
    }
    while (snapshots.length) {
      g.undo();
      assert.equal(JSON.stringify({ ...g.serialize(), plies: 0 }), JSON.stringify({ ...JSON.parse(snapshots.pop()), plies: 0 }));
    }
  }
});
