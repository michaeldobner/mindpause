// Setzt eine neue Versionsnummer überall, wo sie gebraucht wird:
// package.json, js/main.js, sw.js und alle ?v=… Verweise in index.html und js/*.js.
//
//   node scripts/release.mjs 2.1.0

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(version || '')) {
  console.error('Aufruf: node scripts/release.mjs <major.minor.patch>');
  process.exit(1);
}

const files = ['index.html', 'sw.js', 'package.json', ...readdirSync('js').map((f) => `js/${f}`)];
for (const file of files) {
  const before = readFileSync(file, 'utf8');
  const after = before
    .replace(/\?v=\d+\.\d+\.\d+/g, `?v=${version}`)
    .replace(/export const VERSION = '[^']+';/, `export const VERSION = '${version}';`)
    .replace(/^const VERSION = '[^']+';/m, `const VERSION = '${version}';`)
    .replace(/"version": "[^"]+"/, `"version": "${version}"`);
  if (after !== before) {
    writeFileSync(file, after);
    console.log(`aktualisiert: ${file}`);
  }
}
console.log(`Version ${version} gesetzt. Changelogs und Dokumentation nicht vergessen.`);
