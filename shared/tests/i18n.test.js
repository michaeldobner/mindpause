import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, existsSync } from 'node:fs';
import { detectLanguage, createI18n, SHELL_STRINGS, LANGUAGES } from '../js/i18n.js';

const keys = (o, p = '') => Object.entries(o).flatMap(([k, v]) =>
  v && typeof v === 'object' && !Array.isArray(v) ? keys(v, `${p}${k}.`) : [`${p}${k}`]);

test('Deutsch bei deutscher Gerätesprache, sonst Englisch', () => {
  assert.equal(detectLanguage(['de-DE']), 'de');
  assert.equal(detectLanguage(['de-AT', 'en']), 'de');
  assert.equal(detectLanguage(['en-US', 'de-DE']), 'en');
  assert.equal(detectLanguage(['fr-FR']), 'en');
  assert.equal(detectLanguage([]), 'en');
});

test('Texte der Hülle: gleiche Schlüssel in allen Sprachen, keine Gedankenstriche', () => {
  const [a, b] = LANGUAGES.map((l) => keys(SHELL_STRINGS[l]).sort());
  assert.deepEqual(a, b);
  assert.ok(!/[\u2013\u2014]/.test(JSON.stringify(SHELL_STRINGS)));
});

test('Spieltexte ergänzen die Hülle, Einzahl und Mehrzahl', () => {
  const i18n = createI18n({ de: { marbles: { one: 'Murmel', other: 'Murmeln' } }, en: { marbles: { one: 'marble', other: 'marbles' } } }, 'de');
  assert.equal(i18n.t('undo'), 'Zurück');
  assert.equal(i18n.t('marbles', { n: 1 }), 'Murmel');
  assert.equal(i18n.t('marbles', { n: 3 }), 'Murmeln');
  assert.equal(i18n.t('version', { v: '1.0' }), 'Version 1.0');
  assert.equal(i18n.t('undo', {}, 'en'), 'Undo');
});

test('Jedes Spiel: gleiche Schlüssel in beiden Sprachen, keine Gedankenstriche', async () => {
  const games = readdirSync('.').filter((d) => existsSync(`${d}/js/strings.js`));
  assert.ok(games.length >= 1);
  for (const g of games) {
    const mod = await import(`../../${g}/js/strings.js`);
    const strings = Object.values(mod)[0];
    const [a, b] = LANGUAGES.map((l) => keys(strings[l]).sort());
    assert.deepEqual(a, b, g);
    assert.ok(!/[\u2013\u2014]/.test(JSON.stringify(strings)), g);
  }
});
