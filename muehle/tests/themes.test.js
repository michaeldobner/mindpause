import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES, THEME_IDS, DEFAULT_THEME } from '../js/themes.js';
import { MUEHLE_STRINGS } from '../js/strings.js';

const ids = (theme) => theme.defs.join('').match(/id="([^"]+)"/g).map((m) => m.slice(4, -1)).sort();

test('Brettstile: jeder Stil definiert dieselben Verläufe und Muster', () => {
  const reference = ids(THEMES[DEFAULT_THEME]);
  assert.ok(reference.includes('m-mill') && reference.includes('m-line'));
  for (const id of THEME_IDS) assert.deepEqual(ids(THEMES[id]), reference, id);
});

test('Brettstile: Namen und Seitenfarben gibt es in beiden Sprachen', () => {
  for (const lang of ['de', 'en']) {
    for (const id of THEME_IDS) {
      assert.ok(MUEHLE_STRINGS[lang].themes[id], `${lang} ${id}`);
      for (const side of Object.values(THEMES[id].sides)) assert.ok(MUEHLE_STRINGS[lang].side[side], `${lang} ${side}`);
    }
  }
});
