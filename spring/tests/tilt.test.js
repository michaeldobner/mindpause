import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gravityFromOrientation } from '../js/tilt.js';

const close = (a, b) => Math.abs(a - b) < 1e-9;

test('Flach liegend: keine Schwerkraft in der Bildschirmebene', () => {
  const [x, y] = gravityFromOrientation(0, 0, 0);
  assert.ok(close(x, 0) && close(y, 0));
});

test('Hochkant gehalten: Murmeln rollen nach unten', () => {
  const [x, y] = gravityFromOrientation(90, 0, 0);
  assert.ok(close(x, 0) && close(y, 1));
});

test('Nach rechts geneigt: Murmeln rollen nach rechts', () => {
  const [x, y] = gravityFromOrientation(0, 30, 0);
  assert.ok(x > 0.49 && close(y, 0));
});

test('Querformat aufrecht: Murmeln rollen nach unten', () => {
  const [x, y] = gravityFromOrientation(0, -90, 90);
  assert.ok(Math.abs(x) < 1e-9 && close(y, 1));
  const [x2, y2] = gravityFromOrientation(0, 90, -90);
  assert.ok(Math.abs(x2) < 1e-9 && close(y2, 1));
});

test('Schalter für Neigen: Ausschalten während der Erlaubnis-Abfrage gewinnt', async () => {
  const { Tilt } = await import('../js/tilt.js?v=test');
  let resolvePermission;
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
  globalThis.DeviceOrientationEvent = { requestPermission: () => new Promise((r) => (resolvePermission = r)) };
  const calls = [];
  const tilt = new Tilt((x, y) => calls.push([x, y]), true);
  assert.equal(tilt.wanted, true);
  const pending = tilt.enable(); // Erlaubnis-Dialog offen
  tilt.disable(); // Person schaltet sofort wieder aus
  resolvePermission('granted');
  assert.equal(await pending, 'off');
  assert.equal(tilt.wanted, false);
  assert.equal(tilt.enabled, false);

  // Einschalten, dann ausschalten
  const p2 = tilt.enable();
  resolvePermission('granted');
  assert.equal(await p2, 'ok');
  assert.equal(tilt.enabled, true);
  tilt.disable();
  assert.equal(tilt.enabled, false);
  assert.deepEqual(calls.at(-1), [0, 0]);

  // Verweigert: Schalter geht zurück auf aus
  const p3 = tilt.enable();
  resolvePermission('denied');
  assert.equal(await p3, 'denied');
  assert.equal(tilt.wanted, false);
  delete globalThis.window;
  delete globalThis.DeviceOrientationEvent;
});
