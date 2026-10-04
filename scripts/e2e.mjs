// Browser-Test für die ganze Sammlung: Startseite und jedes Spiel auf iPhone und iPad,
// auf Deutsch und Englisch. Prüft, dass die Hülle vollständig steht, nichts aus dem Bild
// ragt, keine Fehler auftreten, und spielt bei jedem Spiel einen Zug samt Zurück.
// Screenshots landen in e2e-output/ (in GitHub Actions als Artefakt zum Herunterladen).
//
//   npm run e2e

import { chromium, devices } from 'playwright';
import http from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const ROOT = process.cwd();
const OUT = join(ROOT, 'e2e-output');
mkdirSync(OUT, { recursive: true });

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };

// Kleiner Server, der wie GitHub Pages unter /mindpause/ ausliefert
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  let path = decodeURIComponent(url.pathname.replace(/^\/mindpause/, '')) || '/';
  if (path.endsWith('/')) path += 'index.html';
  const file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(0);
const BASE = `http://localhost:${server.address().port}/mindpause/`;

const games = JSON.parse(readFileSync('games.json', 'utf8'));
const browser = await chromium.launch();
const failures = [];
const check = (ok, what) => {
  if (!ok) failures.push(what);
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`);
};

const DEVICES = [
  ['iphone', devices['iPhone 15'], 'de-DE'],
  ['iphone-landscape', devices['iPhone 15 landscape'], 'en-US'],
  ['iphone-se', devices['iPhone SE'], 'de-DE'],
  ['ipad', devices['iPad Pro 11 landscape'], 'en-US'],
];

async function open(device, locale, path) {
  const ctx = await browser.newContext({ ...device, locale, serviceWorkers: 'block' });
  await ctx.addInitScript(() => {
    for (const k of Object.keys(localStorage)) if (k.endsWith('coachSeen')) localStorage.removeItem(k);
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(BASE + path);
  await page.waitForTimeout(1200);
  return { ctx, page, errors };
}

// Startseite
for (const [name, device, locale] of DEVICES.slice(0, 1)) {
  const { ctx, page, errors } = await open(device, locale, '');
  const cards = await page.locator('.game').count();
  check(cards === games.length, `Startseite (${name}): ${cards} von ${games.length} Spielen sichtbar`);
  check(errors.length === 0, `Startseite (${name}): keine Fehler ${errors.join(' | ')}`);
  await page.screenshot({ path: join(OUT, `home-${name}.png`) });
  await ctx.close();
}

// Jedes Spiel
for (const game of games) {
  for (const [name, device, locale] of DEVICES) {
    const label = `${game.title} (${name}, ${locale})`;
    const { ctx, page, errors } = await open(device, locale, `${game.id}/`);
    const shell = await page.evaluate(() => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const visible = [...document.querySelectorAll('.top, .controls .icon-btn, #board')].filter((el) => el.offsetParent !== null);
      const outside = visible.some((el) => {
        const b = el.getBoundingClientRect();
        return b.left < -1 || b.right > vw + 1 || b.top < -1 || b.bottom > vh + 1;
      });
      const emptyLabels = [...document.querySelectorAll('.controls .icon-btn span')].filter((s) => !s.textContent.trim()).length;
      return { outside, emptyLabels, hasGame: Boolean(window.__game), title: document.querySelector('.brand')?.textContent };
    });
    check(shell.title === game.title, `${label}: Titel`);
    check(!shell.outside, `${label}: nichts ragt aus dem Bildschirm`);
    check(shell.emptyLabels === 0, `${label}: alle Schaltflächen beschriftet`);
    check(shell.hasGame, `${label}: Spiel gestartet`);

    // Ein Zug (jedes Spiel stellt dafür window.__game.e2e.move bereit), danach Zurück
    if (name === 'iphone' || name === 'ipad') {
      const before = await page.evaluate(() => window.__game.history);
      await page.evaluate(() => window.__game.e2e.move());
      await page.waitForTimeout(1100);
      const after = await page.evaluate(() => window.__game.history);
      check(after > before, `${label}: Zug ausgeführt`);
      // Spiele ohne Zurück (zum Beispiel FUGE) zeigen keine Schaltfläche dafür
      if (await page.locator('#btn-undo').count()) {
        await page.click('#btn-undo');
        await page.waitForTimeout(900);
        const undone = await page.evaluate(() => window.__game.history);
        check(undone === before, `${label}: Zurück funktioniert`);
      }
      await page.click('#btn-settings');
      await page.waitForTimeout(500);
      await page.screenshot({ path: join(OUT, `${game.id}-${name}-settings.png`) });
      await page.click('#settings-close');
      await page.waitForTimeout(400);
    }
    await page.screenshot({ path: join(OUT, `${game.id}-${name}.png`) });
    check(errors.length === 0, `${label}: keine Fehler ${errors.join(' | ')}`);
    await ctx.close();
  }
}

await browser.close();
server.close();
console.log(failures.length ? `\n${failures.length} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
process.exit(failures.length ? 1 : 0);
