// Erzeugt das App-Symbol von MÜHLE: das Mühlebrett als Goldeinlage auf schwarzem Holz, oben eine
// geschlossene Mühle aus drei Elfenbeinsteinen mit leuchtender Linie, unten zwei Ebenholzsteine.
// Gleiche Farben wie der Brettstil Klassik (js/themes.js).
// Schreibt icons/icon.svg und mit Playwright die PNG-Dateien.
//
//   node muehle/tools/icons.mjs

import { writeFileSync } from 'node:fs';

const dir = new URL('../icons/', import.meta.url);
const STEP = 56;
const O = 88; // äußere Linie
const at = (x, y) => [O + x * STEP, O + y * STEP];

let lines = '';
for (let r = 0; r < 3; r++) {
  const [a] = at(r, r);
  const size = (6 - 2 * r) * STEP;
  lines += `M${a} ${a} h${size} v${size} h${-size} Z `;
}
const [m0] = at(3, 0);
lines += `M${m0} ${O} V${at(3, 2)[1]} M${m0} ${at(3, 4)[1]} V${at(3, 6)[1]} M${O} ${m0} H${at(2, 3)[0]} M${at(4, 3)[0]} ${m0} H${at(6, 3)[0]}`;

const points = [];
for (let r = 0; r < 3; r++) {
  const s = 3 - r;
  for (const [x, y] of [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [1, 2], [0, 2], [0, 1]]) points.push(at(r + x * s, r + y * s));
}

const stone = ([x, y], side) => {
  const r = 27;
  return `<g transform="translate(${x} ${y})">
    <ellipse cx="3" cy="6" rx="${r * 1.1}" ry="${r}" fill="url(#s)"/>
    <circle r="${r}" fill="url(#${side})"/>
    ${side === 'k' ? `<circle r="${r - 1}" fill="none" stroke="#e9dcc0" stroke-opacity="0.32" stroke-width="1.6"/>` : ''}
    <circle r="${r * 0.86}" fill="none" stroke="${side === 'w' ? '#a8916a' : '#7a7068'}" stroke-opacity="0.35" stroke-width="1.2"/>
    <circle r="${r * 0.74}" fill="none" stroke="${side === 'w' ? '#a8916a' : '#7a7068'}" stroke-opacity="0.55" stroke-width="2"/>
    <path d="M ${-r * 0.62} ${-r * 0.32} A ${r * 0.72} ${r * 0.72} 0 0 1 ${r * 0.32} ${-r * 0.62}" fill="none" stroke="#fff" stroke-opacity="${side === 'w' ? 0.7 : 0.55}" stroke-width="3.4" stroke-linecap="round"/>
  </g>`;
};

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1a17"/><stop offset="1" stop-color="#0f0d0c"/></linearGradient>
    <linearGradient id="f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a241e"/><stop offset="1" stop-color="#1d1915"/></linearGradient>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e3c06a"/><stop offset="1" stop-color="#b68a2e"/></linearGradient>
    <linearGradient id="mill" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff1c4"/><stop offset="1" stop-color="#e8c25c"/></linearGradient>
    <radialGradient id="w" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fffaf0"/><stop offset="0.55" stop-color="#efe4cb"/><stop offset="1" stop-color="#cdb88f"/></radialGradient>
    <radialGradient id="k" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#57514c"/><stop offset="0.45" stop-color="#1b1816"/><stop offset="1" stop-color="#050404"/></radialGradient>
    <radialGradient id="s" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity="0.6"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <rect x="40" y="40" width="432" height="432" rx="14" fill="url(#f)" stroke="#c9a24a" stroke-width="3"/>
  <path d="${lines}" fill="none" stroke="#000" stroke-opacity="0.55" stroke-width="7" transform="translate(1 2)"/>
  <path d="${lines}" fill="none" stroke="url(#g)" stroke-width="5.5" stroke-linecap="square"/>
  ${points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#0b0a09" stroke="#d9b45a" stroke-width="2.4"/>`).join('')}
  <path d="M${at(0, 0)[0]} ${O} H${at(6, 0)[0]}" stroke="url(#mill)" stroke-width="24" stroke-linecap="round" opacity="0.25"/>
  <path d="M${at(0, 0)[0]} ${O} H${at(6, 0)[0]}" stroke="url(#mill)" stroke-width="7" stroke-linecap="round"/>
  ${stone(at(0, 0), 'w')}${stone(at(3, 0), 'w')}${stone(at(6, 0), 'w')}
  ${stone(at(2, 4), 'k')}${stone(at(5, 3), 'k')}
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
