// Erzeugt das App-Symbol von BLOCKS: Steine aus blauer Keramik auf dem Nachtblau der Sammlung,
// eine Reihe ist fast voll, ein L-Stein schwebt über seiner Lücke. Farben aus js/view.js.
// Schreibt icons/icon.svg und mit Playwright die PNG-Dateien.
//
//   node blocks/tools/icons.mjs

import { writeFileSync } from 'node:fs';
import { COLORS } from '../js/view.js';

const S = 78; // Zellgröße
const GAP = 5;
const R = 15;
const OX = 256 - 2.5 * S;
const OY = 256 - 2.2 * S;

// Liegende Steine [x, y], fünf Spalten, y nach unten
const LYING = [[0, 4], [1, 4], [2, 4], [4, 4], [0, 3], [1, 3], [4, 3], [0, 2], [4, 2]];
// Schwebender Stein: füllt die Lücken bei (2,3), (3,3), (3,4)
const FALLING = [[2, 3], [3, 3], [3, 4]];
const LIFT = -46;

function block(x, y, dy = 0) {
  const px = OX + x * S + GAP;
  const py = OY + y * S + GAP + dy;
  const w = S - 2 * GAP;
  return `<rect x="${px}" y="${py}" width="${w}" height="${w}" rx="${R}" fill="url(#body)"/>`
    + `<rect x="${px + 11}" y="${py + 11}" width="${w - 22}" height="${w - 22}" rx="${R * 0.6}" fill="url(#face)" stroke="#fff" stroke-opacity="0.14" stroke-width="1.5"/>`
    + `<rect x="${px}" y="${py}" width="${w}" height="${w}" rx="${R}" fill="url(#shine)"/>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="72%"><stop offset="0" stop-color="${COLORS.plateTop}"/><stop offset="1" stop-color="#0b0d33"/></radialGradient>
    <radialGradient id="body" cx="32%" cy="26%" r="85%"><stop offset="0" stop-color="${COLORS.blueLight}"/><stop offset="0.5" stop-color="${COLORS.blue}"/><stop offset="1" stop-color="${COLORS.blueDark}"/></radialGradient>
    <linearGradient id="face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.1"/><stop offset="1" stop-color="#000014" stop-opacity="0.12"/></linearGradient>
    <radialGradient id="shine" cx="30%" cy="24%" r="34%"><stop offset="0" stop-color="#fff" stop-opacity="0.5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#02031a" flood-opacity="0.6"/></filter>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  ${[0, 1, 2, 3, 4].flatMap((x) => [0, 1, 2, 3, 4].map((y) => `<rect x="${OX + x * S + GAP + 3}" y="${OY + y * S + GAP + 3}" width="${S - 2 * GAP - 6}" height="${S - 2 * GAP - 6}" rx="${R * 0.8}" fill="${COLORS.slotTop}" opacity="0.55"/>`)).join('')}
  <g filter="url(#sh)">${LYING.map(([x, y]) => block(x, y)).join('')}</g>
  <g filter="url(#sh)">${FALLING.map(([x, y]) => block(x, y, LIFT)).join('')}</g>
</svg>
`;
const dir = new URL('../icons/', import.meta.url);
writeFileSync(new URL('icon.svg', dir), svg);

const { chromium } = await import('playwright');
const browser = await chromium.launch();
for (const [name, size] of [['icon-512.png', 512], ['icon-192.png', 192], ['apple-touch-icon.png', 180]]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<html><body style="margin:0">${svg.replace('width="512" height="512"', `width="${size}" height="${size}"`)}</body></html>`);
  await page.waitForTimeout(200);
  await page.screenshot({ path: new URL(name, dir).pathname });
  await page.close();
}
await browser.close();
console.log('Symbole geschrieben');
