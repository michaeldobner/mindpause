// Prüft das Ausrollen: Jede Datei, die ein Spiel offline braucht, muss im
// Abbild landen. Ohne diesen Test könnte .dockerignore eines Tages still einen
// Ordner ausschließen, der im Service Worker steht. Auf dem Server fiele das
// erst auf, wenn ein Gerät offline geht.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { runInNewContext } from 'node:vm';

const games = JSON.parse(readFileSync('games.json', 'utf8'));
const shellVersion = readFileSync('shared/js/shell.js', 'utf8').match(/SHELL_VERSION = '([^']+)'/)[1];
const dockerfile = readFileSync('Dockerfile', 'utf8');
const nginx = readFileSync('deploy/nginx.conf', 'utf8');

// Die Muster aus .dockerignore, soweit das Projekt sie nutzt: ein Name,
// ein Name an beliebiger Stelle (**/name) und eine Endung (**/*.endung).
const patterns = readFileSync('.dockerignore', 'utf8')
  .split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));

const excluded = (path) => patterns.some((p) => {
  if (p.startsWith('**/*.')) return path.endsWith(p.slice(4));
  if (p.startsWith('**/')) return path.split('/').includes(p.slice(3));
  return path === p || path.startsWith(`${p}/`);
});

// Die Dateiliste aus dem Service Worker auswerten, mit den Versionen des Spiels
const filesOf = (dir, version) => {
  const source = readFileSync(`${dir}/sw.js`, 'utf8').match(/const FILES = (\[[\s\S]*?^\];)/m)[1];
  return runInNewContext(source.replace(/;$/, ''), { VERSION: version, SHELL: shellVersion });
};

for (const game of games) {
  const dir = game.id;
  const version = readFileSync(`${dir}/js/main.js`, 'utf8').match(/export const VERSION = '([^']+)'/)[1];

  test(`${game.title}: jede Datei des Service Workers kommt ins Abbild`, () => {
    const files = filesOf(dir, version);
    assert.ok(files.length > 5, `${dir}/sw.js: Dateiliste nicht gefunden`);
    for (const entry of files) {
      const withoutQuery = entry.split('?')[0];
      const path = relative(process.cwd(), resolve(dir, withoutQuery));
      const file = withoutQuery.endsWith('/') ? `${path}/index.html` : path;
      assert.ok(existsSync(file), `${dir}/sw.js verweist auf ${entry}, die Datei fehlt`);
      assert.ok(!excluded(file), `${file} steht in ${dir}/sw.js, wird aber von .dockerignore ausgeschlossen`);
    }
  });
}

test('Startseite und ihre Symbole kommen ins Abbild', () => {
  for (const file of ['index.html', 'games.json', ...games.map((g) => g.icon.split('?')[0])]) {
    assert.ok(existsSync(file), `${file} fehlt`);
    assert.ok(!excluded(file), `${file} wird von .dockerignore ausgeschlossen`);
  }
});

test('Das Dockerfile legt die nginx-Konfiguration ab und entfernt sie aus dem Web-Ordner', () => {
  assert.match(dockerfile, /COPY deploy\/nginx\.conf \/etc\/nginx\/conf\.d\/default\.conf/);
  assert.match(dockerfile, /rm -rf \/usr\/share\/nginx\/html\/deploy/);
  // deploy/ darf nicht in .dockerignore stehen, sonst kann COPY die Datei nicht sehen
  assert.ok(!excluded('deploy/nginx.conf'), 'deploy/nginx.conf wird von .dockerignore ausgeschlossen');
});

test('nginx liefert Service Worker, Manifest und versionierte Dateien richtig aus', () => {
  const swRule = nginx.indexOf('location ~ /sw\\.js$');
  const assetRule = nginx.search(/location ~\* \\\.\(\?:css\|js/);
  assert.ok(swRule > -1, 'Regel für sw.js fehlt');
  assert.ok(assetRule > -1, 'Regel für css und js fehlt');
  assert.ok(swRule < assetRule, 'Die Regel für sw.js muss vor der für css und js stehen, sonst wird sie nie erreicht');
  assert.match(nginx, /types \{ application\/manifest\+json webmanifest; \}/);
  assert.match(nginx, /location = \/healthz/);
});
