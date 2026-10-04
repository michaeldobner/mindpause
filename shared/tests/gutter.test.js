import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Gutter, _internal } from '../js/gutter.js';

const R = 446;
const MR = 37;
const make = (opts = {}) => new Gutter({ radius: R, marbleRadius: MR, ...opts });

function minGap(g) {
  const a = [...g.items.values()].map((it) => it.a).sort((x, y) => x - y);
  let m = Infinity;
  for (let i = 0; i < a.length; i++) {
    const d = i + 1 < a.length ? a[i + 1] - a[i] : a[0] + 2 * Math.PI - a[i];
    m = Math.min(m, d);
  }
  return m;
}

function run(g, seconds) {
  let moving = true;
  for (let t = 0; t < seconds; t += 1 / 180) moving = g.step(1 / 180);
  return moving;
}

test('Bis zu 31 Murmeln passen überlappungsfrei in die Rinne', () => {
  const g = make();
  g.pack([...Array(31).keys()]);
  assert.ok(minGap(g) >= g.gap - 1e-9);
});

test('Ein Schubs kommt nach kurzer Zeit zur Ruhe', () => {
  let hits = 0;
  const g = make({ onCollide: () => hits++ });
  g.pack([...Array(12).keys()]);
  g.items.get(0).v = -6;
  assert.equal(run(g, 4), false);
  assert.ok(minGap(g) >= g.gap * 0.98);
});

test('Stöße geben Schwung weiter und melden sich für den Klang', () => {
  let hits = 0;
  const g = make({ onCollide: () => hits++ });
  g.add(1, 0, 3);
  g.add(2, 0.4, 0);
  run(g, 0.5);
  assert.ok(hits >= 1);
  assert.ok(g.items.get(2).v > 0 || g.items.get(2).a > 0.4);
});

test('Bei Neigung sammeln sich die Murmeln unten und kommen zur Ruhe', () => {
  const g = make();
  g.pack([...Array(10).keys()]);
  // alle nach oben verschieben, dann Schwerkraft nach unten (Bildschirm-y)
  for (const it of g.items.values()) it.a = _internal.norm(it.a + Math.PI);
  g.gravity = { x: 0, y: 1 };
  assert.equal(run(g, 8), false, 'kommt zur Ruhe');
  for (const it of g.items.values()) assert.ok(Math.sin(it.a) > 0.5, 'liegt unten');
  assert.ok(minGap(g) >= g.gap * 0.97);
});

test('Freier Platz wird nahe am Wunschwinkel gefunden', () => {
  const g = make();
  g.pack([1, 2, 3]);
  const a = g.freeAngle(Math.PI / 2);
  for (const it of g.items.values()) assert.ok(Math.abs(_internal.signed(it.a - a)) >= g.gap - 1e-9);
  assert.ok(Math.abs(_internal.signed(a - Math.PI / 2)) < g.gap * 2.1);
});

test('Finger schiebt nur Murmeln vor sich her', () => {
  const g = make();
  g.add(1, 1.0, 0);
  g.add(2, 1.0 - g.gap * 0.6, 0);
  g.push(1.0 - 0.01, 3);
  assert.ok(g.items.get(1).v > 0);
});

test('Schale: Steine bleiben zwischen den Wänden und kommen zur Ruhe', () => {
  let hits = 0;
  const g = make({ arc: { center: Math.PI / 2, half: Math.PI / 2 - 0.08 }, onCollide: () => hits++ });
  g.pack([...Array(12).keys()]);
  g.items.get(0).v = -8;
  g.items.get(11).v = 8;
  assert.equal(run(g, 5), false);
  for (const it of g.items.values()) assert.ok(Math.abs(g.local(it.a)) <= g.limit + 1e-9);
  assert.ok(hits > 0);
});

test('Schale: 12 Steine passen hinein, freier Platz liegt in der Schale', () => {
  const g = make({ arc: { center: -Math.PI / 2, half: Math.PI / 2 - 0.08 } });
  g.pack([...Array(11).keys()]);
  const a = g.freeAngle(-Math.PI / 2);
  assert.ok(Math.abs(g.local(a)) <= g.limit + 1e-9);
  g.add(99, a);
  run(g, 2);
  for (const it of g.items.values()) assert.ok(Math.abs(g.local(it.a)) <= g.limit + 1e-9);
});

test('Schale mit Neigung: Steine rutschen zur tiefsten Wand', () => {
  const g = make({ arc: { center: 0, half: Math.PI / 2 - 0.08 } }); // rechte Schale
  g.pack([1, 2, 3]);
  g.gravity = { x: 0, y: 1 }; // nach unten
  run(g, 6);
  for (const it of g.items.values()) assert.ok(g.local(it.a) > 0.5, 'liegt unten in der Schale');
});
