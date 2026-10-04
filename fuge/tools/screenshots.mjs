// Erzeugt die Bilder für die Dokumentation in fuge/docs/images/ (braucht Playwright).
//
//   node fuge/tools/screenshots.mjs

import { chromium, devices } from 'playwright';
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const ROOT = process.cwd();
const OUT = join(ROOT, 'fuge/docs/images');
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
const URL_FUGE = `http://localhost:${server.address().port}/fuge/`;
const browser = await chromium.launch();

// Eine belebte Stellung: einige Steine nach festem Plan ablegen, ohne Zufall im Ergebnis
const playSome = `(async () => {
  const w = window.__game;
  w.newGame();
  const g = w.game;
  g.seed = 7;
  w.startGame();
  const plan = [[-4, 0], [3, 1], [0, 2], [-2, 1], [4, 0], [1, 3], [-3, 2], [2, 0], [0, 1], [-4, 1], [3, 0]];
  for (const [dx, r] of plan) {
    for (let i = 0; i < r; i++) g.rotate(1);
    for (let i = 0; i < Math.abs(dx); i++) g.move(Math.sign(dx));
    g.hardDrop();
    g.step(0.4);
  }
  g.step(0.3);
  g.holdPiece();
  g.step(1.2);
  await new Promise((r) => setTimeout(r, 900));
  w.pause();
  w.view.setOverlay(null);
})()`;

async function shot(name, device, locale, prepare, colorScheme = 'light') {
  const ctx = await browser.newContext({ ...device, locale, colorScheme, serviceWorkers: 'block' });
  await ctx.addInitScript(() => localStorage.setItem('fuge:coachSeen', 'true'));
  const page = await ctx.newPage();
  await page.goto(URL_FUGE);
  await page.waitForTimeout(900);
  if (prepare) await prepare(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(OUT, `${name}.jpg`), type: 'jpeg', quality: 84 });
  await ctx.close();
}

const iphone = devices['iPhone 15'];
await shot('iphone-start-de', iphone, 'de-DE');
await shot('iphone-game-de', iphone, 'de-DE', (p) => p.evaluate(playSome));
await shot('iphone-game-en', iphone, 'en-US', (p) => p.evaluate(playSome));
await shot('iphone-modes-de', iphone, 'de-DE', async (p) => { await p.click('#btn-levels'); await p.waitForTimeout(600); });
await shot('iphone-result-de', iphone, 'de-DE', async (p) => {
  await p.evaluate(async () => {
    const w = window.__game;
    w.startGame();
    const g = w.game;
    for (let i = 0; i < 80 && !g.isOver; i++) {
      g.move(i % 2 ? 3 : -3);
      g.hardDrop();
      await new Promise((r) => setTimeout(r, 30));
    }
  });
  await p.waitForTimeout(2200);
});
await shot('iphone-landscape-dark-de', devices['iPhone 15 landscape'], 'de-DE', (p) => p.evaluate(playSome), 'dark');
await shot('ipad-de', devices['iPad Pro 11 landscape'], 'de-DE', (p) => p.evaluate(playSome));

await browser.close();
server.close();
console.log('Bilder geschrieben');
