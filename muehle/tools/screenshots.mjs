// Erzeugt die Bilder für die Dokumentation in muehle/docs/images/ (braucht Playwright).
//
//   node muehle/tools/screenshots.mjs

import { chromium, devices } from 'playwright';
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const ROOT = process.cwd();
const OUT = join(ROOT, 'muehle/docs/images');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
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
const URL_MUEHLE = `http://localhost:${server.address().port}/muehle/`;
const browser = await chromium.launch();

// Eine belebte Stellung zu zweit nach festem Plan, ohne Zufall im Ergebnis
const PLAN = ['d6', 'd2', 'f4', 'b4', 'f6', 'b2', 'e4', 'c4', 'a7', 'g1', 'd7', 'a1'];
async function playPlan(page, theme = 'classic') {
  await page.evaluate(async ({ plan, theme }) => {
    const w = window.__game;
    localStorage.setItem('muehle:theme', JSON.stringify(theme));
    await w.switchMode('duo');
    const names = ['a7', 'd7', 'g7', 'g4', 'g1', 'd1', 'a1', 'a4', 'b6', 'd6', 'f6', 'f4', 'f2', 'd2', 'b2', 'b4', 'c5', 'd5', 'e5', 'e4', 'e3', 'd3', 'c3', 'c4'];
    for (const n of plan) await w.view.events.move(w.game.movesTo(-1, names.indexOf(n))[0]);
  }, { plan: PLAN, theme });
}

// Mühle schließen und die Auswahl der Steine offen lassen
async function stageMill(page) {
  await page.evaluate(async () => {
    const w = window.__game;
    const to = 2; // g7 schließt a7, d7, g7
    await w.view.stage(-1, to, w.game.movesTo(-1, to));
    w.refresh();
  });
}

async function shot(name, device, locale, prepare, colorScheme = 'light', theme = 'classic') {
  const ctx = await browser.newContext({ ...device, locale, colorScheme, serviceWorkers: 'block' });
  await ctx.addInitScript((t) => {
    localStorage.setItem('muehle:coachSeen', 'true');
    localStorage.setItem('muehle:millToastSeen', 'true');
    localStorage.setItem('muehle:theme', JSON.stringify(t));
  }, theme);
  const page = await ctx.newPage();
  await page.goto(URL_MUEHLE);
  await page.waitForTimeout(900);
  if (prepare) await prepare(page);
  await page.waitForTimeout(700);
  await page.screenshot({ path: join(OUT, `${name}.jpg`), type: 'jpeg', quality: 84 });
  await ctx.close();
}

const phone = devices['iPhone 15'];
for (const lang of ['de', 'en']) {
  const locale = lang === 'de' ? 'de-DE' : 'en-US';
  await shot(`iphone-game-${lang}`, phone, locale, async (p) => { await playPlan(p); await stageMill(p); });
  await shot(`iphone-modes-${lang}`, phone, locale, async (p) => { await p.click('#btn-levels'); });
}
await shot('iphone-midnight-de', phone, 'de-DE', (p) => playPlan(p, 'midnight'), 'light', 'midnight');
await shot('iphone-landscape-dark-de', devices['iPhone 15 landscape'], 'de-DE', (p) => playPlan(p), 'dark');
await shot('ipad-de', devices['iPad Pro 11 landscape'], 'de-DE', (p) => playPlan(p));
await shot('iphone-result-de', phone, 'de-DE', async (p) => {
  await p.evaluate(() => window.__game.shell.showResult({ title: 'Gewonnen', text: 'Schwarz hat nur noch zwei Steine.', stars: 2, stats: '3 Siege', highlight: true, showNext: true }));
});

await browser.close();
server.close();
console.log('Bilder geschrieben');
