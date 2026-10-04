// Erzeugt das App-Symbol von QUEEN: ein Ausschnitt des Bretts von oben, in den Ecken zwei Steine je Seite,
// in der Mitte eine Dame aus zwei gestapelten Elfenbeinsteinen mit der gravierten Krone aus js/themes.js.
// Gleiche Bildsprache wie das Symbol von SPRING: Spielmaterial von oben, Licht von oben links, weicher Schatten.
// Schreibt icons/icon.svg und mit Playwright die PNG-Dateien.
//
//   node queen/tools/icons.mjs

import { writeFileSync } from 'node:fs';
import { CROWN } from '../js/themes.js';

const SQ = 100; // Feldgröße
const O = 256 - SQ * 1.5; // linke obere Ecke des 3×3-Ausschnitts

// Felder: dunkel, wo die Steine stehen
let squares = '';
for (let y = 0; y < 3; y++) {
  for (let x = 0; x < 3; x++) {
    const dark = (x + y) % 2 === 0;
    squares += `<rect x="${O + x * SQ}" y="${O + y * SQ}" width="${SQ}" height="${SQ}" fill="${dark ? '#000' : '#fff'}" fill-opacity="${dark ? 0.32 : 0.1}"/>`;
  }
}

// Ein Stein mit Radius 44 wie im Spiel, Mitte im Ursprung
const stone = (side) => `<use href="#sh"/><circle r="44" fill="url(#${side})"/>
      <circle r="37.8" fill="none" stroke="${side === 'p1' ? '#a8916a' : '#7a7068'}" stroke-opacity="0.45" stroke-width="1.5"/>
      <circle r="30" fill="none" stroke="${side === 'p1' ? '#a8916a' : '#7a7068'}" stroke-opacity="0.25" stroke-width="1.2"/>
      ${side === 'p2' ? '<circle r="43" fill="none" stroke="#e9dcc0" stroke-opacity="0.32" stroke-width="1.6"/>' : ''}
      <use href="#hl"/>`;

const engraving = (paint) => [
  ...CROWN.lines.map((d) => `<path d="${d}" fill="none" stroke="${paint}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`),
  ...CROWN.fills.map((d) => `<path d="${d}" fill="${paint}"/>`),
  ...CROWN.dots.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${paint}"/>`),
  ...CROWN.tails.map((x) => `<path d="M${x} 17.8 l1.3 2.4 l-1.3 1.6 l-1.3 -1.6 Z" fill="${paint}"/>`),
].join('');

const corner = (x, y, side, k) => `<g transform="translate(${O + x * SQ + SQ / 2} ${O + y * SQ + SQ / 2}) scale(${k})">${stone(side)}</g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#8a2f2c"/><stop offset="1" stop-color="#3a1010"/></radialGradient>
    <radialGradient id="p1" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fffaf0"/><stop offset="0.55" stop-color="#efe4cb"/><stop offset="1" stop-color="#cdb88f"/></radialGradient>
    <radialGradient id="p1side" cx="50%" cy="20%" r="80%"><stop offset="0" stop-color="#d9c79f"/><stop offset="1" stop-color="#9c8357"/></radialGradient>
    <radialGradient id="p2" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#57514c"/><stop offset="0.45" stop-color="#1b1816"/><stop offset="1" stop-color="#050404"/></radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8892c"/><stop offset="1" stop-color="#7d5a14"/></linearGradient>
    <radialGradient id="s" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity="0.5"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <radialGradient id="w" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <g id="sh"><ellipse cx="4" cy="9" rx="50" ry="44" fill="url(#s)"/></g>
    <g id="hl"><ellipse cx="-14" cy="-17" rx="16" ry="10" fill="url(#w)" transform="rotate(-30)"/></g>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g>${squares}</g>
  <rect x="${O}" y="${O}" width="${SQ * 3}" height="${SQ * 3}" fill="none" stroke="#fff" stroke-opacity="0.18" stroke-width="2"/>
  ${corner(0, 0, 'p2', 0.92)}
  ${corner(2, 0, 'p2', 0.92)}
  ${corner(0, 2, 'p1', 0.92)}
  ${corner(2, 2, 'p1', 0.92)}
  <g transform="translate(256 262) scale(1.45)">
    <use href="#sh"/>
    <circle cy="7" r="44" fill="url(#p1side)"/>
    <circle cy="7" r="44" fill="none" stroke="#7d6640" stroke-opacity="0.5" stroke-width="1.2"/>
    <g transform="translate(0 -4)">
      <circle r="44" fill="url(#p1)"/>
      <circle r="39.6" fill="none" stroke="url(#gold)" stroke-width="1.6"/>
      <g transform="translate(0 -1) scale(1.45)">
        <g transform="translate(0 0.7)" opacity="0.18">${engraving('#000')}</g>
        ${engraving('url(#gold)')}
      </g>
      <use href="#hl"/>
    </g>
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
