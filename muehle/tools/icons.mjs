// Erzeugt das App-Symbol von MÜHLE: das Mühlebrett in Goldlinien von oben, oben eine geschlossene
// Mühle aus drei Elfenbeinsteinen mit leuchtender Linie, dazu zwei Ebenholzsteine.
// Gleiche Bildsprache wie die Symbole von SPRING und QUEEN: kräftige Farbe ohne Rahmen (Petrol),
// Spielmaterial von oben, Licht von oben links, weicher Schatten. Steine wie im Spiel (js/themes.js).
// Schreibt icons/icon.svg und mit Playwright die PNG-Dateien.
//
//   node muehle/tools/icons.mjs

import { writeFileSync } from 'node:fs';

const dir = new URL('../icons/', import.meta.url);
const STEP = 56;
const O = 256 - 3 * STEP; // äußere Linie, das Brett steht mittig
const at = (x, y) => [O + x * STEP, O + y * STEP];

let lines = '';
for (let r = 0; r < 3; r++) {
  const [a] = at(r, r);
  const size = (6 - 2 * r) * STEP;
  lines += `M${a} ${a} h${size} v${size} h${-size} Z `;
}
const [m] = at(3, 0);
lines += `M${m} ${O} V${at(3, 2)[1]} M${m} ${at(3, 4)[1]} V${at(3, 6)[1]} M${O} ${m} H${at(2, 3)[0]} M${at(4, 3)[0]} ${m} H${at(6, 3)[0]}`;

const points = [];
for (let r = 0; r < 3; r++) {
  const s = 3 - r;
  for (const [x, y] of [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [1, 2], [0, 2], [0, 1]]) points.push(at(r + x * s, r + y * s));
}

// Ein Stein mit Radius 44 wie im Spiel, Mitte im Ursprung, verkleinert aufs Raster
const stone = ([x, y], side) => `<g transform="translate(${x} ${y}) scale(0.68)">
    <use href="#sh"/><circle r="44" fill="url(#${side})"/>
    ${side === 'p2' ? '<circle r="43" fill="none" stroke="#e9dcc0" stroke-opacity="0.32" stroke-width="1.6"/>' : ''}
    <circle r="37.8" fill="none" stroke="${side === 'p1' ? '#a8916a' : '#7a7068'}" stroke-opacity="0.45" stroke-width="1.5"/>
    <circle r="32.5" fill="none" stroke="${side === 'p1' ? '#a8916a' : '#7a7068'}" stroke-opacity="0.6" stroke-width="2.4"/>
    <circle r="8" fill="none" stroke="${side === 'p1' ? '#a8916a' : '#7a7068'}" stroke-opacity="0.35" stroke-width="1.5"/>
    <use href="#hl"/>
  </g>`;

const [mx0, my] = at(0, 0);
const [mx1] = at(6, 0);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#1f6b73"/><stop offset="1" stop-color="#0a2a2f"/></radialGradient>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ecca74"/><stop offset="1" stop-color="#c0943a"/></linearGradient>
    <linearGradient id="mill" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="512" y2="0"><stop offset="0" stop-color="#fff4cf"/><stop offset="1" stop-color="#f0cf6e"/></linearGradient>
    <radialGradient id="p1" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fffaf0"/><stop offset="0.55" stop-color="#efe4cb"/><stop offset="1" stop-color="#cdb88f"/></radialGradient>
    <radialGradient id="p2" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#57514c"/><stop offset="0.45" stop-color="#1b1816"/><stop offset="1" stop-color="#050404"/></radialGradient>
    <radialGradient id="s" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity="0.5"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <radialGradient id="w" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <g id="sh"><ellipse cx="4" cy="9" rx="50" ry="44" fill="url(#s)"/></g>
    <g id="hl"><ellipse cx="-14" cy="-17" rx="16" ry="10" fill="url(#w)" transform="rotate(-30)"/></g>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <path d="${lines}" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="7" transform="translate(1.5 2.5)"/>
  <path d="${lines}" fill="none" stroke="url(#g)" stroke-width="6" stroke-linecap="square"/>
  ${points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9.5" fill="#082024" stroke="url(#g)" stroke-width="3"/>`).join('')}
  <path d="M${mx0} ${my} H${mx1}" stroke="url(#mill)" stroke-width="26" stroke-linecap="round" opacity="0.3"/>
  <path d="M${mx0} ${my} H${mx1}" stroke="url(#mill)" stroke-width="8" stroke-linecap="round"/>
  ${stone(at(0, 0), 'p1')}${stone(at(3, 0), 'p1')}${stone(at(6, 0), 'p1')}
  ${stone(at(2, 4), 'p2')}${stone(at(5, 3), 'p2')}
</svg>
`;

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
