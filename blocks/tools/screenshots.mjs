// Erzeugt die Bilder für die Dokumentation in blocks/docs/images/ (braucht Playwright).
//
//   node blocks/tools/screenshots.mjs [Zielordner]

import { chromium, devices } from 'playwright';
import http from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = process.cwd();
const OUT = resolve(process.argv[2] || join(ROOT, 'blocks/docs/images'));
mkdirSync(OUT, { recursive: true });
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
const URL_BLOCKS = `http://localhost:${server.address().port}/blocks/`;
const browser = await chromium.launch();

// Eine belebte Stellung: in einem Level oder Modus nach Tipps legen
const playSome = (moves, choice = 'classic') => `(async () => {
  const w = window.__game;
  w.progress.unlocked = 30;
  w.choose('${choice}');
  const g = w.game;
  if (g.mode !== 'level') {
    g.rng.state = 12345;
    g.refill();
  }
  for (let i = 0; i < ${moves} && g.state === 'playing'; i++) {
    const h = g.hint();
    if (!h) break;
    g.place(h.slot, h.x, h.y);
  }
  await new Promise((r) => setTimeout(r, 1600));
})()`;

// Stein über dem Brett halten, mit Vorschau der Linien
const holdPiece = `(() => {
  const w = window.__game;
  const g = w.game;
  const h = g.hint();
  if (!h) return;
  const v = w.view;
  const s = v.dragShape(h.slot);
  const { grid, c } = v.metrics();
  v.drag = { slot: h.slot, x: grid.x + (h.x + s.w / 2) * c + c * 0.2, y: grid.y + (h.y + s.h / 2) * c + c * 0.15, touch: false, grow: 1, target: null, preview: null };
  v.drag.target = { x: h.x, y: h.y };
  v.drag.preview = g.preview(h.slot, h.x, h.y);
  v.dirty = true;
})()`;

async function shot(name, device, locale, prepare, colorScheme = 'light') {
  const ctx = await browser.newContext({ ...device, locale, colorScheme, serviceWorkers: 'block' });
  await ctx.addInitScript(() => localStorage.setItem('blocks:coachSeen', 'true'));
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error(name, e.message));
  await page.goto(URL_BLOCKS);
  await page.waitForTimeout(900);
  if (prepare) await prepare(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(OUT, `${name}.jpg`), type: 'jpeg', quality: 84 });
  await ctx.close();
}

const iphone = devices['iPhone 15'];
await shot('iphone-level-de', iphone, 'de-DE');
await shot('iphone-game-de', iphone, 'de-DE', async (p) => { await p.evaluate(playSome(6, 'level-8')); await p.evaluate(holdPiece); });
await shot('iphone-game-en', iphone, 'en-US', async (p) => { await p.evaluate(playSome(6, 'level-8')); await p.evaluate(holdPiece); });
await shot('iphone-modes-de', iphone, 'de-DE', async (p) => { await p.evaluate(playSome(0, 'level-3')); await p.click('#btn-levels'); await p.waitForTimeout(600); });
await shot('iphone-result-de', iphone, 'de-DE', async (p) => {
  await p.evaluate(playSome(400, 'level-2'));
  await p.waitForTimeout(1500);
});
await shot('iphone-dark-de', iphone, 'de-DE', (p) => p.evaluate(playSome(22)), 'dark');
await shot('iphone-landscape-dark-de', devices['iPhone 15 landscape'], 'de-DE', (p) => p.evaluate(playSome(4, 'level-14')), 'dark');
await shot('ipad-de', devices['iPad Pro 11 landscape'], 'de-DE', (p) => p.evaluate(playSome(5, 'level-21')));

await browser.close();
server.close();
console.log('Bilder geschrieben');
