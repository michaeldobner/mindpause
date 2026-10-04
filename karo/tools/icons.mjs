// Erzeugt das App-Symbol von KARO: drei aufgefächerte Karten auf grünem Filz, vorne in der Mitte das Karo-Ass.
// Gleiche Bildsprache wie das Symbol von SPRING: kräftiger Grund ohne Rahmen, Motiv groß in der Mitte.
// Schreibt icons/icon.svg und mit Playwright die PNG-Dateien.
//
//   node karo/tools/icons.mjs

import { writeFileSync } from 'node:fs';
import { cardSvg } from '../js/faces.js';

const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
// Die Ids beider Karten getrennt halten, damit sich die Symbole nicht überschreiben
const card = (c, prefix) => inner(cardSvg(c, 'en')).replaceAll('karo-', `${prefix}-`);

// Vorne das Karo-Ass, das Karo größer als im Spiel, damit es auch klein noch trägt
const ace = `${card(39, 'c')}<use href="#c-suit-3" x="50" y="100" width="150" height="150" fill="#c8382b"/>`;

const place = (content, angle, dy = 0) => `<g transform="rotate(${angle} 256 470)"><svg x="148" y="${104 + dy}" width="216" height="302" viewBox="0 0 250 350">${content}</svg></g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#22805c"/><stop offset="1" stop-color="#0b3624"/></radialGradient>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#021a10" flood-opacity="0.5"/></filter>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g filter="url(#sh)">
    ${place(card(null, 'a'), -13, 16)}
    ${place(card(null, 'b'), 13, 16)}
    ${place(ace, 0)}
  </g>
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
