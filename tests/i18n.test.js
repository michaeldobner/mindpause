import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectLanguage, t, strings, LANGUAGES } from '../js/i18n.js';

test('Deutsch bei deutscher Gerätesprache, sonst Englisch', () => {
  assert.equal(detectLanguage(['de-DE']), 'de');
  assert.equal(detectLanguage(['de-AT', 'en']), 'de');
  assert.equal(detectLanguage(['de']), 'de');
  assert.equal(detectLanguage(['en-US', 'de-DE']), 'en');
  assert.equal(detectLanguage(['fr-FR']), 'en');
  assert.equal(detectLanguage([]), 'en');
});

test('Einzahl und Mehrzahl', () => {
  assert.equal(t('marbles', { n: 1 }, 'de'), 'Murmel');
  assert.equal(t('marbles', { n: 5 }, 'de'), 'Murmeln');
  assert.equal(t('marbles', { n: 1 }, 'en'), 'marble');
  assert.equal(t('best', { n: 2 }, 'en'), 'Best result: 2 marbles');
});

test('Beide Sprachen haben dieselben Schlüssel', () => {
  const keys = (o, p = '') => Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v) ? keys(v, `${p}${k}.`) : [`${p}${k}`]);
  const [a, b] = LANGUAGES.map((l) => keys(strings(l)).sort());
  assert.deepEqual(a, b);
});

test('Keine Gedankenstriche in den Texten', () => {
  for (const l of LANGUAGES) assert.ok(!/[\u2013\u2014]/.test(JSON.stringify(strings(l))), l);
});
