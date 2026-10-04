// Erzeugt das App-Symbol von KARO: drei aufgefächerte Karten auf der Schiefermatte.
// Schreibt icons/icon.svg und mit Playwright die PNG-Dateien.
//
//   node karo/tools/icons.mjs

import { writeFileSync } from 'node:fs';
import { cardSvg } from '../js/faces.js';

const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
// Die Ids beider Karten getrennt halten, damit sich die Symbole nicht überschreiben
const card = (c, prefix) => inner(cardSvg(c, 'en')).replaceAll('karo-', `${prefix}-`);

const place = (content, angle) => `<g transform="rotate(${angle} 256 470)"><svg x="146" y="96" width="220" height="308" viewBox="0 0 250 350">${content}</svg></g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="#31434a"/><stop offset="0.6" stop-color="#26343a"/><stop offset="1" stop-color="#172025"/></radialGradient>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.35"/></filter>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <rect x="22" y="22" width="468" height="468" rx="20" fill="none" stroke="#c9a961" stroke-opacity="0.35" stroke-width="2"/>
  <g filter="url(#sh)">
    ${place(card(null, 'a'), -15)}
    ${place(card(null, 'b'), 0)}
    ${place(card(24, 'c'), 15)}
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
