import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, fullLines, canPlaceAll } from '../js/game.js';
import { levelDef, levelParams, levelStars, LEVEL_COUNT, CHAPTER } from '../js/levels.js';
import { shapeOf } from '../js/shapes.js';

const boardOf = (def) => def.board.map((row) => [...row].map((ch) => ch === '#'));

test('30 Level mit 8 × 8 Feldern, Startsteinen und ohne volle Linie', () => {
  assert.equal(LEVEL_COUNT, 30);
  for (let n = 1; n <= LEVEL_COUNT; n++) {
    const def = levelDef(n);
    assert.ok(def, `Level ${n}`);
    assert.equal(def.board.length, 8);
    assert.ok(def.board.every((r) => r.length === 8 && /^[#.]+$/.test(r)));
    const b = boardOf(def);
    assert.deepEqual(fullLines(b), { rows: [], cols: [] }, `Level ${n}`);
    const filled = b.flat().filter(Boolean).length;
    assert.ok(Math.abs(filled / 64 - def.density) <= 0.05, `Level ${n}: Dichte ${filled / 64}`);
    // Spiegelsymmetrisch
    assert.ok(def.board.every((r) => r === [...r].reverse().join('')), `Level ${n} symmetrisch`);
  }
  assert.equal(levelDef(0), null);
  assert.equal(levelDef(31), null);
});

test('Sägezahn: Dichte und Ziel steigen im Kapitel, fallen zu Beginn des nächsten', () => {
  for (let n = 2; n <= LEVEL_COUNT; n++) {
    const a = levelParams(n - 1);
    const b = levelParams(n);
    if ((n - 1) % CHAPTER === 0) {
      assert.ok(b.density < a.density, `Level ${n} ist leichter als Level ${n - 1}`);
      assert.ok(b.density > levelParams(n - CHAPTER).density, `Level ${n} ist schwerer als der Anfang des Kapitels davor`);
    } else {
      assert.ok(b.density > a.density, `Level ${n}`);
    }
    assert.ok(b.target >= a.target, `Ziel Level ${n}`);
  }
});

test('Formen kommen kapitelweise dazu, das erste Kapitel nur mit kleinen Steinen', () => {
  const g = new Game({ mode: 'level', level: 1 });
  for (let i = 0; i < 60 && g.state === 'playing'; i++) {
    for (const k of g.tray.filter(Boolean)) assert.ok(shapeOf(k).size <= 4, k);
    const h = g.hint();
    g.place(h.slot, h.x, h.y);
  }
  assert.ok(levelParams(1).families.length < levelParams(6).families.length);
  assert.equal(levelParams(21).families, null);
});

test('Jedes Level: die ersten drei Steine passen sicher', () => {
  for (let n = 1; n <= LEVEL_COUNT; n++) {
    const g = new Game({ mode: 'level', level: n });
    assert.ok(canPlaceAll(g.board, g.tray, { n: 1e7 }), `Level ${n}`);
    assert.equal(g.preLeft, boardOf(levelDef(n)).flat().filter(Boolean).length);
  }
});

test('Jedes Level ist lösbar: der Computerspieler schafft es mit genau dem Richtwert', () => {
  for (let n = 1; n <= LEVEL_COUNT; n++) {
    const g = new Game({ mode: 'level', level: n });
    while (g.state === 'playing' && g.moves < 400) {
      const h = g.hint();
      if (!h) break;
      g.place(h.slot, h.x, h.y);
    }
    assert.equal(g.state, 'won', `Level ${n}`);
    assert.equal(g.moves, levelDef(n).par, `Level ${n}: level-data.js passt nicht mehr zur Spiellogik, tools/levels.mjs neu ausführen`);
    assert.equal(g.preLeft, 0);
    assert.ok(g.score >= levelDef(n).target);
  }
});

test('Gewonnen erst, wenn alle Startsteine weg sind und das Ziel erreicht ist', () => {
  const g = new Game({ mode: 'level', level: 1 });
  g.score = 10000;
  assert.equal(g.levelDone, false, 'Startsteine liegen noch');
  g.pre = g.pre.map((r) => r.map(() => false));
  g.score = 0;
  assert.equal(g.levelDone, false, 'zu wenig Punkte');
  g.score = levelDef(1).target;
  assert.equal(g.levelDone, true);
  assert.equal(new Game({ mode: 'classic' }).levelDone, false);
});

test('Level speichern und fortsetzen, Startsteine bleiben markiert', () => {
  const g = new Game({ mode: 'level', level: 12 });
  for (let i = 0; i < 5; i++) {
    const h = g.hint();
    g.place(h.slot, h.x, h.y);
  }
  const copy = Game.restore(JSON.parse(JSON.stringify(g.serialize())));
  assert.equal(copy.mode, 'level');
  assert.equal(copy.level, 12);
  assert.deepEqual(copy.pre, g.pre);
  assert.equal(copy.preLeft, g.preLeft);
  assert.equal(Game.restore({ ...g.serialize(), level: 99 }), null);
});

test('Zurück stellt auch die Startsteine wieder her', () => {
  const g = new Game({ mode: 'level', level: 3 });
  let cleared = false;
  for (let i = 0; i < 80 && !cleared && g.state === 'playing'; i++) {
    const before = g.preLeft;
    const h = g.hint();
    g.place(h.slot, h.x, h.y);
    if (g.preLeft < before && g.state === 'playing') {
      cleared = true;
      g.undo();
      assert.equal(g.preLeft, before);
    }
  }
  assert.ok(cleared);
});

test('Sterne nach Steinen: Richtwert drei, anderthalbfach zwei, sonst einer', () => {
  const par = levelDef(1).par;
  assert.equal(levelStars(1, par), 3);
  assert.equal(levelStars(1, par + 1), 2);
  assert.equal(levelStars(1, Math.ceil(par * 1.5)), 2);
  assert.equal(levelStars(1, Math.ceil(par * 1.5) + 1), 1);
  assert.equal(levelStars(1, 0), 0);
});
