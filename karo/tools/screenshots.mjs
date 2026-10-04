// Erzeugt die Bilder für die Dokumentation in karo/docs/images/ (braucht Playwright).
//
//   node karo/tools/screenshots.mjs

import { chromium, devices } from 'playwright';
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const ROOT = process.cwd();
const OUT = join(ROOT, 'karo/docs/images');
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
const URL_KARO = `http://localhost:${server.address().port}/karo/`;
const browser = await chromium.launch();

// Ein paar Züge nach dem Tipp spielen, damit der Tisch belebt aussieht
const playSome = (n) => `(async () => {
  const w = window.__game;
  for (let i = 0; i < ${n}; i++) {
    const g = w.game;
    let done = false;
    for (let col = 0; col < 7 && !done; col++) {
      const from = { pile: 'tableau', col, index: 0 };
      if (g.tableau[col].down.length && g.bestTarget(from)) { g.move(from, g.bestTarget(from)); done = true; }
    }
    if (!done && g.waste.length && g.bestTarget({ pile: 'waste' })) { g.move({ pile: 'waste' }, g.bestTarget({ pile: 'waste' })); done = true; }
    if (!done) g.drawCards();
  }
  await w.e2e.move();
  w.view.render({ animate: false });
})()`;

async function shot(name, device, locale, prepare) {
  const ctx = await browser.newContext({ ...device, locale, serviceWorkers: 'block' });
  await ctx.addInitScript(() => localStorage.setItem('karo:coachSeen', 'true'));
  const page = await ctx.newPage();
  await page.goto(URL_KARO);
  await page.waitForTimeout(1600);
  if (prepare) await prepare(page);
  await page.screenshot({ path: join(OUT, `${name}.jpg`), type: 'jpeg', quality: 84 });
  await ctx.close();
}

const iphone = devices['iPhone 15'];
await shot('iphone-game-de', iphone, 'de-DE', async (p) => { await p.evaluate(playSome(40)); await p.waitForTimeout(500); });
await shot('iphone-game-en', iphone, 'en-US', async (p) => { await p.evaluate(playSome(40)); await p.waitForTimeout(500); });
await shot('iphone-levels-de', iphone, 'de-DE', async (p) => { await p.click('#btn-levels'); await p.waitForTimeout(700); });
await shot('iphone-win-de', iphone, 'de-DE', async (p) => {
  await p.evaluate(() => {
    const w = window.__game;
    const g = w.game;
    g.tableau.forEach((c) => { c.down = []; c.up = []; });
    g.stock = [];
    g.waste = [];
    g.foundations = [13, 13, 13, 12];
    g.tableau[3].up = [51];
    w.view.render({ animate: false });
  });
  await p.click('.k-card[data-card="51"]');
  await p.waitForTimeout(5200);
});
await shot('ipad-de', devices['iPad Pro 11 landscape'], 'de-DE', async (p) => { await p.evaluate(playSome(30)); await p.waitForTimeout(500); });

await browser.close();
server.close();
console.log('Bilder geschrieben');
