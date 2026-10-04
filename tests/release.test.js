import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const jsFiles = readdirSync('js').map((f) => `js/${f}`);

test('Jeder Verweis auf CSS und JavaScript trägt die aktuelle Version', () => {
  const html = readFileSync('index.html', 'utf8');
  assert.match(html, new RegExp(`css/style\\.css\\?v=${version}"`));
  assert.match(html, new RegExp(`js/main\\.js\\?v=${version}"`));
  for (const file of jsFiles) {
    const src = readFileSync(file, 'utf8');
    for (const [, ref] of src.matchAll(/(?:from |new URL\()'(\.\/[^']+)'/g)) {
      assert.ok(ref.endsWith(`?v=${version}`), `${file}: ${ref}`);
    }
  }
});

test('Versionsnummern stimmen überall überein', () => {
  assert.match(readFileSync('js/main.js', 'utf8'), new RegExp(`VERSION = '${version}'`));
  assert.match(readFileSync('sw.js', 'utf8'), new RegExp(`const VERSION = '${version}'`));
});

test('Service Worker speichert jedes Modul der App', () => {
  const sw = readFileSync('sw.js', 'utf8');
  for (const file of jsFiles) {
    const name = file.replace('js/', '').replace('.js', '');
    assert.ok(sw.includes(`'${name}'`), `${name} fehlt in sw.js`);
  }
});
