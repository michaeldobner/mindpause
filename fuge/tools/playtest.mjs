// Spieltest im Browser: bedient FUGE wie ein Mensch, mit Tippen, Ziehen, Wischen, Tasten und
// Schaltflächen, und prüft nach jedem Schritt den Zustand des Spiels (braucht Playwright).
//
//   node fuge/tools/playtest.mjs

import { chromium, devices } from 'playwright';
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
const ROOT = process.cwd();
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/json' };
const server = http.createServer((req, res) => { let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html'; const f = normalize(join(ROOT, p)); if (!existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': TYPES[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)); }).listen(0);
const browser = await chromium.launch();
const fails = [];
const check = (ok, what) => { console.log(ok ? 'ok  ' : 'FAIL', what); if (!ok) fails.push(what); };
const ctx = await browser.newContext({ ...devices['iPhone 15'], locale: 'de-DE', serviceWorkers: 'block' });
const page = await ctx.newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`http://localhost:${server.address().port}/fuge/`);
await page.waitForTimeout(700);
const st = () => page.evaluate(() => { const g = window.__game.game; return { state: g.state, paused: window.__game.paused, a: g.active && { ...g.active }, hold: g.hold, holdUsed: g.holdUsed, pieces: g.pieces, score: g.score }; });
const m = await page.evaluate(() => window.__game.view.metrics());
const cx = (m.well.left + m.well.right) / 2, cy = (m.well.top + m.well.bottom) / 2;
// Tipp startet
await page.mouse.click(cx, cy);
await page.waitForTimeout(100);
let s = await st();
check(s.state === 'playing' && !s.paused, 'Tipp startet das Spiel');
// Ziehen nach rechts um 3 Zellen
const x0 = s.a.x;
await page.mouse.move(cx, cy); await page.mouse.down();
for (let i = 1; i <= 12; i++) await page.mouse.move(cx + i * m.cell * 3 / 12 + 4, cy);
await page.mouse.up();
s = await st();
check(s.a.x - x0 === 3, `Ziehen verschiebt 3 Felder (war ${s.a.x - x0})`);
// Tipp rechts dreht im Uhrzeigersinn
const r0 = s.a.rot;
await page.mouse.click(cx + 40, cy);
s = await st();
check(s.a.rot === (r0 + 1) % 4, 'Tipp rechts dreht rechts');
await page.mouse.click(cx - 40, cy);
s = await st();
check(s.a.rot === r0, 'Tipp links dreht zurück');
// Wischen nach oben hält
const type0 = s.a.type;
await page.mouse.move(cx, cy); await page.mouse.down();
await page.mouse.move(cx, cy - 40); await page.mouse.move(cx, cy - 90); await page.mouse.up();
s = await st();
check(s.hold === type0, 'Wischen nach oben hält den Stein');
// Schnelles Wischen nach unten: harter Fall
const p0 = s.pieces;
await page.mouse.move(cx, cy - 100); await page.mouse.down();
await page.mouse.move(cx, cy - 40); await page.mouse.move(cx, cy + 40);
await page.mouse.up();
await page.waitForTimeout(50);
s = await st();
check(s.pieces === p0 + 1, 'Schnelles Wischen nach unten lässt fallen');
if (s.pieces !== p0 + 1) console.log(await page.evaluate(() => JSON.stringify({ g: window.__game.input.lastGesture, t: window.__game.input.touch && window.__game.input.touch.samples, a: window.__game.game.active, st: window.__game.game.state })));
// Langsames Ziehen nach unten: sanft, ohne Ablegen
await page.waitForTimeout(150);
s = await st();
const y0 = s.a.y; const pp = s.pieces;
await page.mouse.move(cx, m.well.top + 20); await page.mouse.down();
for (let i = 1; i <= 8; i++) { await page.mouse.move(cx, m.well.top + 20 + i * m.cell * 0.5); await page.waitForTimeout(40); }
await page.waitForTimeout(150); await page.mouse.up();
s = await st();
check(s.a && s.a.y > y0 && s.pieces === pp, `Langsam nach unten: sanftes Fallen (${y0} → ${s.a && s.a.y})`);
// Tastatur
await page.keyboard.press('ArrowLeft');
const xk = (await st()).a.x;
await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(500); await page.keyboard.up('ArrowLeft');
s = await st();
check(s.a.x === 0 || s.a.x < xk - 1, 'Gedrückt halten wiederholt bis zur Wand');
await page.keyboard.press('ArrowUp');
check((await st()).a.rot === 1, 'Pfeil hoch dreht');
const pk = s.pieces;
await page.keyboard.press('Space');
await page.waitForTimeout(80);
check((await st()).pieces === pk + 1, 'Leertaste lässt fallen');
await page.keyboard.press('KeyP');
s = await st();
check(s.paused, 'P pausiert');
const before = await page.evaluate(() => window.__game.game.elapsed);
await page.waitForTimeout(400);
check(await page.evaluate(() => window.__game.game.elapsed) === before, 'Pause hält die Zeit an');
await page.keyboard.press('Space');
check(!(await st()).paused, 'Leertaste setzt fort');
// Einstellungen öffnen pausiert
await page.click('#btn-settings'); await page.waitForTimeout(400);
check((await st()).paused, 'Einstellungen pausieren');
await page.click('#settings-close'); await page.waitForTimeout(400);
await page.click('#btn-pause');
check(!(await st()).paused, 'Knopf Weiter setzt fort');
// Knopf Halten
await page.click('#btn-hold');
check((await st()).holdUsed, 'Knopf Halten');
// Neu
await page.click('#btn-restart'); await page.waitForTimeout(200);
s = await st();
check(s.state === 'ready' && s.score === 0, 'Neu: neues Spiel bereit');
// Modus wechseln
await page.click('#btn-levels'); await page.waitForTimeout(500);
await page.click('.level-card[data-id="sprint"]'); await page.waitForTimeout(500);
check(await page.evaluate(() => window.__game.game.mode) === 'sprint', 'Moduswechsel zu Sprint');
// Fortsetzen nach Neuladen
await page.keyboard.press('Enter');
await page.keyboard.press('Space'); await page.waitForTimeout(100);
const saved = await page.evaluate(() => window.__game.game.pieces);
await page.reload(); await page.waitForTimeout(800);
s = await st();
check(s.paused && s.pieces === saved, 'Nach Neuladen: Spiel pausiert fortgesetzt');
check(errors.length === 0, `keine Fehler ${errors.join(' | ')}`);
await browser.close(); server.close();
console.log(fails.length ? `\n${fails.length} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
process.exit(fails.length ? 1 : 0);
