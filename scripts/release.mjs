// Setzt eine neue Versionsnummer überall, wo sie gebraucht wird.
//
//   node scripts/release.mjs spring 2.2.0   Version eines Spiels (alle ?v= Verweise im Spielordner)
//   node scripts/release.mjs shell 1.1.0    Version der Hülle (alle ?shell= Verweise in allen Spielen)
//
// Danach: Changelogs ergänzen, npm test, Pull Request.

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const [target, version] = process.argv.slice(2);
if (!target || !/^\d+\.\d+\.\d+$/.test(version || '')) {
  console.error('Aufruf: node scripts/release.mjs <spiel|shell> <major.minor.patch>');
  process.exit(1);
}

const games = JSON.parse(readFileSync('games.json', 'utf8')).map((g) => g.id);
const filesIn = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  if (statSync(p).isDirectory()) return ['js', 'css'].includes(f) || dir === '.' ? filesIn(p) : [];
  return /\.(js|html|css)$/.test(f) ? [p] : [];
});

function rewrite(files, replacers) {
  for (const file of files) {
    const before = readFileSync(file, 'utf8');
    const after = replacers.reduce((s, [re, to]) => s.replace(re, to), before);
    if (after !== before) {
      writeFileSync(file, after);
      console.log(`aktualisiert: ${file}`);
    }
  }
}

if (target === 'shell') {
  const files = ['index.html', ...games.flatMap((g) => filesIn(g)), ...filesIn('shared/js')];
  rewrite(files, [
    [/\?shell=\d+\.\d+\.\d+/g, `?shell=${version}`],
    [/^const SHELL = '[^']+';/m, `const SHELL = '${version}';`],
    [/export const SHELL_VERSION = '[^']+';/, `export const SHELL_VERSION = '${version}';`],
  ]);
} else if (games.includes(target) && existsSync(target)) {
  rewrite(filesIn(target), [
    [/\?v=\d+\.\d+\.\d+/g, `?v=${version}`],
    [/export const VERSION = '[^']+';/, `export const VERSION = '${version}';`],
    [/^const VERSION = '[^']+';/m, `const VERSION = '${version}';`],
  ]);
  // Das Symbol auf der Startseite trägt die Version, damit der Browser kein altes Bild zeigt
  const list = readFileSync('games.json', 'utf8');
  const next = list.replace(new RegExp(`"${target}/icons/icon\\.svg(\\?v=[^"]*)?"`), `"${target}/icons/icon.svg?v=${version}"`);
  if (next !== list) {
    writeFileSync('games.json', next);
    console.log('aktualisiert: games.json');
  }
} else {
  console.error(`Unbekanntes Ziel: ${target}. Erlaubt: shell, ${games.join(', ')}`);
  process.exit(1);
}
console.log(`${target} steht jetzt auf ${version}. Changelogs und Dokumentation nicht vergessen.`);
