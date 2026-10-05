import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SHAPES, FAMILY_IDS, createRandom, pickShape, shapeOf } from '../js/shapes.js';
import { Game, canPlace, canPlaceAll, fitsAnywhere, applyPlace, fullLines, codeOf, TRAY } from '../js/game.js';
import { MODES, modeById, linePoints, scorePlace, starsFor, STREAK_KEEP, PERFECT_POINTS } from '../js/modes.js';

// Spiel mit bestimmtem Tablett
function setup({ mode = 'classic', tray = ['dot:0', 'dot:0', 'dot:0'] } = {}) {
  const g = new Game({ mode, seed: 7 });
  g.tray = tray.slice();
  g.events = [];
  return g;
}

// Reihe y bis auf die Spalten in holes füllen
function fillRow(g, y, holes = []) {
  for (let x = 0; x < g.size; x++) if (!holes.includes(x)) g.board[y][x] = 1;
}

test('Formen: Drehungen und Spiegelungen ohne Doppelte, Zellen bei 0,0', () => {
  const count = (fam) => Object.values(SHAPES).filter((s) => s.family === fam).length;
  assert.equal(count('dot'), 1);
  assert.equal(count('i2'), 2);
  assert.equal(count('o2'), 1);
  assert.equal(count('o3'), 1);
  assert.equal(count('c3'), 4);
  assert.equal(count('t4'), 4);
  assert.equal(count('s4'), 4); // S und Z, je zwei Lagen
  assert.equal(count('l4'), 8); // L und J, je vier Lagen
  assert.equal(count('c5'), 4);
  for (const s of Object.values(SHAPES)) {
    assert.equal(Math.min(...s.cells.map(([x]) => x)), 0);
    assert.equal(Math.min(...s.cells.map(([, y]) => y)), 0);
    assert.equal(new Set(s.cells.map((c) => c.join())).size, s.cells.length);
    assert.ok(s.w <= 5 && s.h <= 5);
  }
  assert.equal(shapeOf('o3:0').size, 9);
  assert.equal(shapeOf('nix'), null);
});

test('Zufall: gleicher Startwert gleiche Folge, jede Familie kommt vor', () => {
  const a = createRandom(42);
  const b = createRandom(42);
  const seen = new Set();
  for (let i = 0; i < 2000; i++) {
    const k = pickShape(a);
    assert.equal(k, pickShape(b));
    seen.add(shapeOf(k).family);
  }
  assert.equal(seen.size, FAMILY_IDS.length);
  assert.deepEqual(new Game({ seed: 5 }).tray, new Game({ seed: 5 }).tray);
});

test('Modi: Größe des Bretts, unbekannter Modus wird Klassisch', () => {
  assert.equal(new Game({ mode: 'classic' }).board.length, 8);
  assert.equal(new Game({ mode: 'wide' }).board.length, 10);
  assert.equal(new Game({ mode: 'calm' }).board.length, 8);
  assert.equal(new Game({ mode: 'gibtsnicht' }).mode, 'classic');
  assert.equal(modeById('calm').calm, true);
  assert.equal(MODES.length, 3);
});

test('Neues Spiel: leeres Brett, drei Steine auf dem Tablett', () => {
  const g = new Game({ seed: 3 });
  assert.equal(g.tray.length, TRAY);
  assert.ok(g.tray.every((k) => SHAPES[k]));
  assert.ok(g.board.every((r) => r.every((c) => c === 0)));
  assert.equal(g.state, 'playing');
});

test('Legen: nur auf freie Felder und innerhalb des Bretts', () => {
  const g = setup({ tray: ['i3:0', 'o2:0', 'dot:0'] });
  assert.equal(g.canPlace(0, 6, 0), false); // ragt rechts hinaus
  assert.equal(g.canPlace(0, -1, 0), false);
  assert.equal(g.canPlace(0, 5, 0), true);
  assert.ok(g.place(0, 5, 0));
  assert.deepEqual(g.board[0].slice(5), [codeOf('i3:0'), codeOf('i3:0'), codeOf('i3:0')]);
  assert.equal(g.tray[0], null);
  assert.equal(g.place(0, 0, 0), null, 'leeres Fach');
  assert.equal(g.canPlace(1, 6, 0), false, 'belegt');
  assert.equal(g.score, 3);
  assert.equal(g.moves, 1);
  const types = g.drainEvents().map((e) => e.type);
  assert.deepEqual(types, ['place', 'score']);
});

test('Volle Reihe und volle Spalte verschwinden gleichzeitig', () => {
  const g = setup({ tray: ['dot:0', 'i2:0', 'i2:0'] });
  fillRow(g, 3, [4]);
  for (let y = 0; y < 8; y++) if (y !== 3) g.board[y][4] = 1;
  const r = g.place(0, 4, 3);
  assert.deepEqual(r.rows, [3]);
  assert.deepEqual(r.cols, [4]);
  assert.equal(r.lines, 2);
  assert.ok(g.board.every((row) => row.every((c) => c === 0)));
  // 1 Feld, zwei Linien in Serie 1, und das Brett ist leer
  assert.equal(r.points, 1 + linePoints(2) + PERFECT_POINTS);
  assert.equal(r.perfect, true);
  const clear = g.drainEvents().find((e) => e.type === 'clear');
  assert.equal(clear.cells.length, 15);
});

test('Punkte: Linien, Serie, Leer geräumt', () => {
  assert.deepEqual([1, 2, 3, 4].map(linePoints), [20, 60, 120, 200]);
  assert.equal(scorePlace({ cells: 4, lines: 0 }), 4);
  assert.equal(scorePlace({ cells: 4, lines: 1, streak: 1 }), 24);
  assert.equal(scorePlace({ cells: 4, lines: 2, streak: 3 }), 4 + 180);
  assert.equal(scorePlace({ cells: 1, lines: 1, streak: 1, perfect: true }), 1 + 20 + PERFECT_POINTS);
});

test('Serie wächst mit jedem Abräumen und reißt nach drei Steinen ohne', () => {
  const g = setup({ tray: ['dot:0', 'dot:0', 'dot:0'] });
  const keepTray = () => { g.tray = ['dot:0', 'dot:0', 'dot:0']; };
  // Zwei Reihen mit je einer Lücke, damit das Brett danach nicht leer ist
  fillRow(g, 0, [0]);
  fillRow(g, 1, [0]);
  g.board[7][7] = 1;
  g.place(0, 0, 0);
  assert.equal(g.streak, 1);
  keepTray();
  g.place(0, 0, 1);
  assert.equal(g.streak, 2);
  for (let i = 0; i < STREAK_KEEP - 1; i++) {
    keepTray();
    g.place(0, 3 + i, 5);
    assert.equal(g.streak, 2, 'hält noch');
  }
  keepTray();
  g.place(0, 6, 5);
  assert.equal(g.streak, 0, 'gerissen');
  assert.equal(g.tally.bestStreak, 2);
});

test('Sind alle drei Steine gelegt, kommen drei neue', () => {
  const g = setup({ tray: ['dot:0', 'dot:0', 'dot:0'] });
  g.place(0, 0, 0);
  g.place(1, 2, 0);
  assert.equal(g.tray.filter(Boolean).length, 1);
  g.place(2, 4, 0);
  assert.equal(g.tray.filter(Boolean).length, 3);
  assert.ok(g.drainEvents().some((e) => e.type === 'refill'));
});

test('Klassisch: mindestens ein neuer Stein passt, sonst wird neu gezogen', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const g = new Game({ seed });
    // Fast volles Brett: nur ein einzelnes Feld frei
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) g.board[y][x] = (x + y) % 2 ? 1 : 2;
    g.board[3][3] = 0;
    g.refill();
    // Nur der einzelne Punkt passt, er muss also dabei sein
    assert.ok(g.tray.some((k) => fitsAnywhere(g.board, k)), `Startwert ${seed}`);
    assert.ok(g.tray.includes('dot:0'));
  }
});

test('Ruhe: alle drei Steine passen in irgendeiner Reihenfolge', () => {
  for (let seed = 1; seed <= 25; seed++) {
    const g = new Game({ mode: 'calm', seed });
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if ((x * 3 + y * 5 + seed) % 4 === 0) g.board[y][x] = 1;
    g.refill();
    assert.ok(canPlaceAll(g.board, g.tray, { n: 1e6 }), `Startwert ${seed}`);
  }
});

test('Suche: ein Stein, der erst nach dem Abräumen Platz findet', () => {
  // Reihe 0 links frei, darunter Reihen mit je einer Lücke rechts, keine Linie ist voll
  const board = Array.from({ length: 8 }, (_, y) => Array.from({ length: 8 }, (_, x) => (y === 0 ? (x < 5 ? 0 : 1) : x === 5 + (y % 3) ? 0 : 1)));
  assert.deepEqual(fullLines(board), { rows: [], cols: [] });
  assert.equal(canPlaceAll(board, ['o3:0']), false);
  assert.equal(canPlace(board, 'i5:0', 0, 0), true);
  // Das I5 schließt Reihe 0 und die Spalten 0 bis 4, danach passt das O3
  const after = applyPlace(board, 'i5:0', 0, 0);
  assert.deepEqual(after.rows, [0]);
  assert.deepEqual(after.cols, [0, 1, 2, 3, 4]);
  assert.equal(canPlaceAll(board, ['o3:0', 'i5:0']), true);
  assert.equal(canPlaceAll(board, ['o3:0', 'o3:0']), false);
});

test('Ende: passt keiner der übrigen Steine, ist das Spiel vorbei', () => {
  const g = setup({ tray: ['dot:0', 'o3:0', 'o3:0'] });
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) g.board[y][x] = (x + y) % 2 ? 1 : 0;
  g.board[0][0] = 0;
  // Schachbrett: das O3 passt nirgends, nach dem Punkt ist Schluss
  g.place(0, 0, 0);
  assert.equal(g.state, 'over');
  assert.ok(g.drainEvents().some((e) => e.type === 'gameOver'));
  assert.equal(g.place(1, 0, 0), null);
  assert.equal(g.hint(), null);
});

test('Ruhe: statt des Endes räumt sich das Brett auf', () => {
  const g = setup({ mode: 'calm', tray: ['dot:0', 'o3:0', 'o3:0'] });
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) g.board[y][x] = (x + y) % 2 ? 1 : 0;
  g.place(0, 0, 0);
  assert.equal(g.state, 'playing');
  assert.ok(g.board.every((r) => r.every((c) => c === 0)));
  const e = g.drainEvents().find((ev) => ev.type === 'calmClear');
  assert.ok(e && e.cells.length > 30);
  assert.equal(g.tally.calmClears, 1);
});

test('Zurück nimmt genau den letzten Stein zurück, auch nach dem Ende', () => {
  const g = setup({ tray: ['dot:0', 'o3:0', 'o3:0'] });
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) g.board[y][x] = (x + y) % 2 ? 1 : 0;
  const before = g.serialize();
  g.place(0, 0, 0);
  assert.equal(g.isOver, true);
  assert.equal(g.undo(), true);
  assert.equal(g.state, 'playing');
  assert.deepEqual(g.serialize(), before);
  assert.equal(g.undo(), false, 'nur ein Schritt');
});

test('Zurück bringt nach dem Nachfüllen dieselben Steine wieder', () => {
  const g = setup({ tray: ['dot:0', null, null] });
  g.place(0, 0, 0);
  const tray = g.tray.slice();
  g.undo();
  g.place(0, 1, 1);
  assert.deepEqual(g.tray, tray);
});

test('Tipp: legt den Stein, der eine Reihe schließt', () => {
  const g = setup({ tray: ['dot:0', 'i3:0', 'o2:0'] });
  fillRow(g, 7, [5, 6, 7]);
  const h = g.hint();
  assert.deepEqual(h, { slot: 1, x: 5, y: 7 });
  assert.equal(g.place(h.slot, h.x, h.y).lines, 1);
});

test('Speichern und Fortsetzen', () => {
  const g = new Game({ mode: 'wide', seed: 11 });
  for (let i = 0; i < 6; i++) {
    const h = g.hint();
    g.place(h.slot, h.x, h.y);
  }
  const copy = Game.restore(JSON.parse(JSON.stringify(g.serialize())));
  assert.deepEqual(copy.serialize(), g.serialize());
  // Gleicher Zufall: dieselben nächsten Steine
  for (let i = 0; i < 6; i++) {
    const h = g.hint();
    copy.place(h.slot, h.x, h.y);
    g.place(h.slot, h.x, h.y);
  }
  assert.deepEqual(copy.tray, g.tray);
  assert.equal(Game.restore(null), null);
  assert.equal(Game.restore({ v: 1, mode: 'classic', board: [[0]] }), null);
  assert.equal(Game.restore({ ...g.serialize(), tray: ['xyz', null, null] }), null);
});

test('Sterne je Modus, Ruhe ohne Wertung', () => {
  assert.equal(starsFor('classic', null), 0);
  assert.equal(starsFor('classic', { score: 1500 }), 1);
  assert.equal(starsFor('classic', { score: 12000 }), 3);
  assert.equal(starsFor('wide', { score: 7999 }), 1);
  assert.equal(starsFor('calm', { score: 99999 }), null);
});

test('Ein ganzes Spiel nach Tipps endet sauber und schnell', () => {
  const g = new Game({ seed: 99 });
  const t0 = Date.now();
  while (g.state === 'playing' && g.moves < 2000) {
    const h = g.hint();
    assert.ok(h);
    assert.ok(g.place(h.slot, h.x, h.y));
  }
  assert.equal(g.state, 'over');
  assert.ok(Date.now() - t0 < 5000);
  assert.ok(g.score >= g.moves);
});
