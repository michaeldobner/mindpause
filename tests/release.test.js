// Prüft, dass jede Version nur ihre eigenen Dateien lädt (siehe scripts/release.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const games = JSON.parse(readFileSync('games.json', 'utf8'));
const shellVersion = readFileSync('shared/js/shell.js', 'utf8').match(/SHELL_VERSION = '([^']+)'/)[1];
const refs = (src) => [...src.matchAll(/(?:from |new URL\(|href="|src=")'?([.][^'"]+)['"]/g)].map((m) => m[1]);

test('Die Hülle verweist intern nur mit ihrer eigenen Version', () => {
  for (const f of readdirSync('shared/js')) {
    for (const ref of refs(readFileSync(`shared/js/${f}`, 'utf8'))) {
      assert.ok(ref.endsWith(`?shell=${shellVersion}`), `shared/js/${f}: ${ref}`);
    }
  }
});

for (const game of games) {
  const dir = game.id;
  const main = readFileSync(`${dir}/js/main.js`, 'utf8');
  const version = main.match(/export const VERSION = '([^']+)'/)[1];

  test(`${game.title}: jeder Verweis trägt die richtige Version`, () => {
    const files = ['index.html', ...readdirSync(`${dir}/js`).map((f) => `js/${f}`)];
    for (const f of files) {
      for (const ref of refs(readFileSync(`${dir}/${f}`, 'utf8'))) {
        if (!/\.(js|css)/.test(ref)) continue;
        if (ref.includes('shared/')) assert.ok(ref.endsWith(`?shell=${shellVersion}`), `${dir}/${f}: ${ref}`);
        else assert.ok(ref.endsWith(`?v=${version}`), `${dir}/${f}: ${ref}`);
      }
    }
  });

  test(`${game.title}: Service Worker kennt Spiel- und Hüllenversion und jedes Modul`, () => {
    const sw = readFileSync(`${dir}/sw.js`, 'utf8');
    assert.match(sw, new RegExp(`const VERSION = '${version}'`));
    assert.match(sw, new RegExp(`const SHELL = '${shellVersion}'`));
    for (const f of readdirSync(`${dir}/js`)) assert.ok(sw.includes(`'${f.replace('.js', '')}'`), `${f} fehlt in ${dir}/sw.js`);
    for (const f of readdirSync('shared/js')) assert.ok(sw.includes(`'${f.replace('.js', '')}'`), `shared ${f} fehlt in ${dir}/sw.js`);
  });

  test(`${game.title}: Ordner ist vollständig`, () => {
    for (const f of ['index.html', 'sw.js', 'manifest.webmanifest', 'README.md', 'README.de.md', 'CHANGELOG.md', 'CHANGELOG.de.md', 'icons/apple-touch-icon.png']) {
      assert.ok(existsSync(`${dir}/${f}`), `${dir}/${f} fehlt`);
    }
  });
}
