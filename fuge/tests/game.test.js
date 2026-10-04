import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TYPES, cellsOf, kicksFor, createRandom, nextBag, spawnX } from '../js/pieces.js';
import { Game, WIDTH, HEIGHT, HIDDEN, LOCK_DELAY, MAX_RESETS, encode, typeOf, idOf } from '../js/game.js';
import { scoreLock, gravity, starsFor, modeById } from '../js/modes.js';

// Spiel mit leerem Brett und einem bestimmten Stein an bestimmter Stelle
function setup({ type = 'T', rot = 0, x = null, y = 10, mode = 'classic' } = {}) {
  const g = new Game({ mode, seed: 7 });
  g.start();
  g.active = { type, rot, x: x ?? spawnX(type), y, id: 99 };
  g.resetPieceState();
  g.events = [];
  return g;
}

// Reihe y bis auf die Spalten in holes füllen
function fillRow(g, y, holes = []) {
  for (let x = 0; x < WIDTH; x++) if (!holes.includes(x)) g.board[y][x] = encode('O', 1);
}

test('Sieben Formen mit je vier Zellen, vier Drehungen kehren zum Anfang zurück', () => {
  assert.equal(TYPES.length, 7);
  for (const t of TYPES) {
    for (let r = 0; r < 4; r++) assert.equal(cellsOf(t, r).length, 4);
    assert.deepEqual(cellsOf(t, 4), cellsOf(t, 0));
  }
  // T zeigt nach rechts gedreht nach rechts
  assert.deepEqual(cellsOf('T', 1).sort(), [[1, 0], [1, 1], [1, 2], [2, 1]].sort());
});

test('7-Bag: jede Form genau einmal pro Beutel, gleicher Startwert gleiche Folge', () => {
  const r = createRandom(42);
  for (let i = 0; i < 20; i++) assert.deepEqual(nextBag(r).sort(), TYPES.slice().sort());
  assert.deepEqual(new Game({ seed: 5 }).queue, new Game({ seed: 5 }).queue);
  assert.notDeepEqual(new Game({ seed: 5 }).queue, new Game({ seed: 6 }).queue);
});

test('Neuer Stein erscheint mittig und rückt sofort in die erste sichtbare Reihe', () => {
  const g = new Game({ seed: 3 });
  const a = g.active;
  assert.ok(a);
  assert.equal(a.x, spawnX(a.type));
  const bottom = Math.max(...g.activeCells.map(([, y]) => y));
  assert.equal(bottom, HIDDEN);
});

test('Bewegen bis zur Wand, nicht hinein', () => {
  const g = setup({ type: 'I', x: 3 });
  let moves = 0;
  while (g.move(-1)) moves++;
  assert.equal(moves, 3);
  assert.equal(Math.min(...g.activeCells.map(([x]) => x)), 0);
  while (g.move(1));
  assert.equal(Math.max(...g.activeCells.map(([x]) => x)), WIDTH - 1);
});

test('Drehen am linken und rechten Rand nutzt die Wandsprünge', () => {
  // I senkrecht ganz links, Drehung zurück in die Waagerechte muss nach rechts ausweichen
  const g = setup({ type: 'I', rot: 1, x: -2, y: 8 });
  assert.ok(g.fits('I', 1, -2, 8));
  assert.ok(g.rotate(1));
  assert.ok(g.activeCells.every(([x]) => x >= 0 && x < WIDTH));
  // T senkrecht ganz rechts
  const h = setup({ type: 'T', rot: 3, x: 8, y: 8 });
  assert.ok(h.fits('T', 3, 8, 8));
  assert.ok(h.rotate(-1));
  assert.ok(h.activeCells.every(([x]) => x >= 0 && x < WIDTH));
});

test('Drehen auf liegenden Steinen: Sprung nach oben oder Ablehnung', () => {
  const g = setup({ type: 'T', rot: 0, x: 4, y: 19 });
  fillRow(g, 21, []);
  fillRow(g, 20, [4, 5, 6]);
  // Unter dem T ist kein Platz mehr für die gedrehte Form ohne Sprung
  const before = { ...g.active };
  const ok = g.rotate(1);
  if (ok) assert.ok(g.fits(g.active.type, g.active.rot, g.active.x, g.active.y));
  else assert.deepEqual(g.active, before);
  // O dreht sich nie aus der Stelle
  const o = setup({ type: 'O', x: 4, y: 10 });
  assert.ok(o.rotate(1));
  assert.equal(o.active.x, 4);
  assert.deepEqual(kicksFor('O', 0, 1), [[0, 0]]);
});

test('Harter Fall: ganz nach unten, zwei Punkte pro Reihe, sofort abgelegt', () => {
  const g = setup({ type: 'O', x: 4, y: 2 });
  const dist = g.dropDistance();
  assert.equal(dist, HEIGHT - 2 - 2);
  g.hardDrop();
  assert.equal(g.score, dist * 2);
  assert.equal(g.active, null);
  assert.equal(typeOf(g.board[HEIGHT - 1][4]), 'O');
  assert.equal(idOf(g.board[HEIGHT - 1][4]), 99);
  assert.equal(g.pieces, 1);
  g.step(0.1);
  assert.ok(g.active, 'nächster Stein erscheint');
});

test('Sanftes Fallen: schneller als die Schwerkraft, ein Punkt pro Reihe', () => {
  const g = setup({ type: 'T', x: 4, y: 2 });
  g.setSoftDrop(true);
  g.step(0.2);
  assert.ok(g.active.y >= 6);
  assert.equal(g.score, g.active.y - 2);
});

test('Schwerkraft: Stufe 1 eine Reihe pro Sekunde, schneller mit jeder Stufe', () => {
  assert.equal(gravity(1), 1);
  assert.ok(gravity(5) < gravity(4));
  assert.ok(gravity(20) < 0.001);
  assert.equal(gravity(25), gravity(20));
  const g = setup({ type: 'T', x: 4, y: 2 });
  g.step(0.99);
  assert.equal(g.active.y, 2);
  g.step(0.02);
  assert.equal(g.active.y, 3);
});

test('Frist am Boden: 0,5 s, Bewegung verlängert sie höchstens 15 Mal', () => {
  const g = setup({ type: 'T', x: 4, y: HEIGHT - 2 });
  assert.ok(g.onGround());
  g.step(LOCK_DELAY - 0.1);
  assert.ok(g.active, 'noch nicht abgelegt');
  g.step(0.11);
  assert.equal(g.active, null, 'abgelegt');

  const h = setup({ type: 'T', x: 4, y: HEIGHT - 2 });
  let survived = 0;
  for (let i = 0; i < 40 && h.active; i++) {
    h.step(LOCK_DELAY * 0.8);
    if (h.active) {
      survived++;
      h.move(i % 2 ? 1 : -1);
    }
  }
  assert.equal(h.active, null);
  assert.ok(survived <= MAX_RESETS + 1);
});

test('Halten: einmal pro Stein, tauscht beim zweiten Mal', () => {
  const g = new Game({ seed: 11 });
  g.start();
  const first = g.active.type;
  const second = g.queue[0];
  assert.ok(g.holdPiece());
  assert.equal(g.hold, first);
  assert.equal(g.active.type, second);
  assert.equal(g.holdPiece(), false, 'nur einmal pro Stein');
  g.hardDrop();
  g.step(0.1);
  assert.ok(g.holdPiece());
  assert.equal(g.active.type, first);
});

test('Reihen verschwinden, darüber rutscht alles nach', () => {
  const g = setup({ type: 'I', x: 3, y: 5 });
  fillRow(g, 21, [3, 4, 5, 6]);
  g.board[20][0] = encode('Z', 5);
  g.hardDrop();
  const lock = g.drainEvents().find((e) => e.type === 'lock');
  assert.equal(lock.lines, 1);
  assert.deepEqual(lock.rows, [21]);
  assert.equal(g.lines, 1);
  assert.equal(typeOf(g.board[21][0]), 'Z', 'Stein ist nachgerutscht');
  assert.ok(g.board[21].slice(1).every((c) => c === 0));
});

test('Vier Reihen auf einmal (Quart), Back-to-Back und Serie', () => {
  const g = setup({ type: 'I', rot: 1, x: -2 + 2, y: 2 });
  for (let y = 18; y < 22; y++) fillRow(g, y, [0]);
  g.active = { type: 'I', rot: 1, x: -2, y: 2, id: 50 };
  assert.ok(g.fits('I', 1, -2, 2));
  g.hardDrop();
  assert.equal(g.lines, 4);
  assert.equal(g.tally.quarts, 1);
  assert.ok(g.b2b);
  assert.equal(g.tally.perfect, 1, 'Brett ist leer');
});

test('Punkte nach der Guideline', () => {
  assert.equal(scoreLock({ lines: 1, level: 1 }).points, 100);
  assert.equal(scoreLock({ lines: 4, level: 2 }).points, 1600);
  assert.equal(scoreLock({ lines: 4, level: 1, b2b: true }).points, 1200);
  assert.equal(scoreLock({ lines: 2, tspin: 'full', level: 1 }).points, 1200);
  assert.equal(scoreLock({ lines: 0, tspin: 'mini', level: 1 }).points, 100);
  // Serie: zweite Reihe in Folge bringt 50 extra
  const s = scoreLock({ lines: 1, level: 1, combo: 0 });
  assert.equal(s.points, 150);
  assert.equal(s.combo, 1);
  // Eine einfache Reihe beendet Back-to-Back, ein T-Spin ohne Reihe nicht
  assert.equal(scoreLock({ lines: 1, b2b: true }).b2b, false);
  assert.equal(scoreLock({ lines: 0, tspin: 'full', b2b: true }).b2b, true);
  // Kein Ablegen ohne Reihe: Serie endet
  assert.equal(scoreLock({ lines: 0, combo: 3 }).combo, -1);
});

test('T-Spin wird erkannt: Drehung als letzte Bewegung, drei Ecken belegt', () => {
  const g = setup({ type: 'T', rot: 0, x: 3, y: 18 });
  // Schlitz für ein T mit der Spitze nach unten
  fillRow(g, 21, [4]);
  fillRow(g, 20, [3, 4, 5]);
  g.board[19][3] = encode('O', 2);
  g.active = { type: 'T', rot: 1, x: 3, y: 19, id: 77 };
  assert.ok(g.fits('T', 1, 3, 19));
  assert.ok(g.rotate(1));
  assert.equal(g.active.rot, 2);
  const kind = g.tspinKind();
  assert.notEqual(kind, 'none');
  g.hardDrop();
  assert.equal(g.tally.tspins, 1);
  assert.ok(g.lines >= 1);
});

test('Stufe steigt alle 10 Reihen im Klassisch-Modus, nicht im Sprint', () => {
  const g = setup({ type: 'I', x: 3, y: 2 });
  g.lines = 9;
  fillRow(g, 21, [3, 4, 5, 6]);
  g.hardDrop();
  assert.equal(g.level, 2);
  assert.ok(g.drainEvents().some((e) => e.type === 'levelUp'));
  const s = setup({ type: 'I', x: 3, y: 2, mode: 'sprint' });
  s.lines = 9;
  fillRow(s, 21, [3, 4, 5, 6]);
  s.hardDrop();
  assert.equal(s.level, 1);
});

test('Sprint endet nach 40 Reihen, Drei Minuten nach 180 Sekunden', () => {
  const s = setup({ type: 'I', x: 3, y: 2, mode: 'sprint' });
  s.lines = 39;
  fillRow(s, 21, [3, 4, 5, 6]);
  s.hardDrop();
  assert.equal(s.state, 'done');
  const u = setup({ mode: 'ultra' });
  for (let i = 0; i < 200 && !u.isOver; i++) {
    if (u.active) u.hardDrop();
    u.step(1);
    // Brett leeren, damit nur die Zeit entscheidet
    u.board.forEach((row) => row.fill(0));
  }
  assert.equal(u.state, 'done');
  assert.equal(u.elapsed, 180);
});

test('Game Over, wenn kein Platz mehr ist; im Modus Ruhe leert sich der Kasten', () => {
  const g = new Game({ seed: 1 });
  g.start();
  for (let i = 0; i < 100 && !g.isOver; i++) {
    g.hardDrop();
    g.step(0.1);
  }
  assert.equal(g.state, 'over');

  const c = new Game({ seed: 1, mode: 'calm' });
  c.start();
  let cleared = false;
  for (let i = 0; i < 100; i++) {
    c.hardDrop();
    if (c.drainEvents().some((e) => e.type === 'calmClear')) cleared = true;
    c.step(1);
  }
  assert.ok(cleared);
  assert.equal(c.state, 'playing');
  assert.ok(c.tally.calmClears >= 1);
});

test('Speichern und Fortsetzen ergibt dasselbe Spiel', () => {
  const g = new Game({ seed: 21 });
  g.start();
  for (let i = 0; i < 6; i++) {
    g.move(i % 3 - 1);
    g.rotate(1);
    g.hardDrop();
    g.step(0.1);
  }
  const copy = Game.restore(JSON.parse(JSON.stringify(g.serialize())));
  assert.ok(copy);
  assert.deepEqual(copy.serialize(), g.serialize());
  // Beide spielen gleich weiter
  for (const x of [g, copy]) {
    x.hardDrop();
    x.step(0.1);
  }
  assert.deepEqual(copy.serialize(), g.serialize());
  assert.equal(Game.restore({ mode: 'nix' }), null);
  assert.equal(Game.restore(null), null);
});

test('Modi und Sterne', () => {
  assert.ok(modeById('calm').calm);
  assert.equal(starsFor('classic', { lines: 10 }), 0);
  assert.equal(starsFor('classic', { lines: 150 }), 3);
  assert.equal(starsFor('sprint', { time: 100 }), 3);
  assert.equal(starsFor('sprint', { time: 400 }), 1);
  assert.equal(starsFor('ultra', { score: 20000 }), 2);
  assert.equal(starsFor('calm', { lines: 99 }), null);
  assert.equal(starsFor('calm', null), null);
  assert.equal(starsFor('classic', null), 0);
});
