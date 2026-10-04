// Erzeugt das App-Symbol von FUGE: lackierte Steine, die passgenau ineinandergreifen,
// ein T schwebt über seiner Lücke. Gleiche Formensprache wie im Spiel (js/view.js):
// außen gerundete Ecken, feine Naht innerhalb eines Steins, Fuge zwischen den Steinen.
// Schreibt icons/icon.svg und mit Playwright die PNG-Dateien.
//
//   node fuge/tools/icons.mjs

import { writeFileSync } from 'node:fs';
import { COLORS } from '../js/view.js';

const S = 64; // Zellgröße
const GAP = 3.2;
const R = 11;
const OX = 64;
const OY = 92;

// Steine als [Form, [[x, y] …]], y nach unten
const PIECES = [
  ['I', [[0, 5], [1, 5], [2, 5], [3, 5]]],
  ['O', [[4, 4], [5, 4], [4, 5], [5, 5]]],
  ['J', [[0, 3], [0, 4], [1, 4], [2, 4]]],
  ['L', [[1, 1], [2, 1], [1, 2], [1, 3]]],
];
const FALLING = ['T', [[2, 3], [3, 3], [4, 3], [3, 4]]];
const LIFT = -44; // so weit schwebt das T über seinem Platz

// Umriss einer Zelle als SVG-Pfad, wie cellPath in view.js
function cellD(px, py, nb) {
  const L = px + (nb.l ? 0 : GAP);
  const Rt = px + S - (nb.r ? 0 : GAP);
  const T = py + (nb.u ? 0 : GAP);
  const B = py + S - (nb.d ? 0 : GAP);
  const kind = (a, b, diag) => (!a && !b ? 'round' : a && b && !diag ? 'notch' : 'square');
  const tl = kind(nb.u, nb.l, nb.ul);
  const tr = kind(nb.u, nb.r, nb.ur);
  const br = kind(nb.d, nb.r, nb.dr);
  const bl = kind(nb.d, nb.l, nb.dl);
  const n = GAP;
  let d = tl === 'round' ? `M${L + R} ${T}` : tl === 'notch' ? `M${L + n} ${T}` : `M${L} ${T}`;
  d += tr === 'round' ? `L${Rt - R} ${T}Q${Rt} ${T} ${Rt} ${T + R}` : tr === 'notch' ? `L${Rt - n} ${T}L${Rt - n} ${T + n}L${Rt} ${T + n}` : `L${Rt} ${T}`;
  d += br === 'round' ? `L${Rt} ${B - R}Q${Rt} ${B} ${Rt - R} ${B}` : br === 'notch' ? `L${Rt} ${B - n}L${Rt - n} ${B - n}L${Rt - n} ${B}` : `L${Rt} ${B}`;
  d += bl === 'round' ? `L${L + R} ${B}Q${L} ${B} ${L} ${B - R}` : bl === 'notch' ? `L${L + n} ${B}L${L + n} ${B - n}L${L} ${B - n}` : `L${L} ${B}`;
  d += tl === 'round' ? `L${L} ${T + R}Q${L} ${T} ${L + R} ${T}` : tl === 'notch' ? `L${L} ${T + n}L${L + n} ${T + n}L${L + n} ${T}` : `L${L} ${T}`;
  return `${d}Z`;
}

function piece([type, cells], dy = 0) {
  const set = new Set(cells.map(([x, y]) => `${x},${y}`));
  const has = (x, y) => set.has(`${x},${y}`);
  let out = '';
  for (const [x, y] of cells) {
    const nb = {
      u: has(x, y - 1), r: has(x + 1, y), d: has(x, y + 1), l: has(x - 1, y),
      ur: has(x + 1, y - 1), dr: has(x + 1, y + 1), dl: has(x - 1, y + 1), ul: has(x - 1, y - 1),
    };
    const d = cellD(OX + x * S, OY + y * S + dy, nb);
    out += `<path d="${d}" fill="${COLORS[type]}"/><path d="${d}" fill="url(#sheen)"/>`;
    // feine Naht zum Nachbarn desselben Steins
    if (nb.r) out += `<rect x="${OX + (x + 1) * S - 1}" y="${OY + y * S + dy + (nb.u ? 0 : GAP)}" width="1.6" height="${S - (nb.u ? 0 : GAP) - (nb.d ? 0 : GAP)}" fill="#0a0b2a" opacity="0.16"/>`;
    if (nb.d) out += `<rect x="${OX + x * S + (nb.l ? 0 : GAP)}" y="${OY + (y + 1) * S + dy - 1}" width="${S - (nb.l ? 0 : GAP) - (nb.r ? 0 : GAP)}" height="1.6" fill="#0a0b2a" opacity="0.16"/>`;
  }
  return out;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b307c"/><stop offset="1" stop-color="#171a50"/></linearGradient>
    <linearGradient id="well" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0d31"/><stop offset="1" stop-color="#181b50"/></linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.16"/><stop offset="0.45" stop-color="#fff" stop-opacity="0.02"/><stop offset="1" stop-color="#0c0c28" stop-opacity="0.12"/></linearGradient>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#02031a" flood-opacity="0.6"/></filter>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <rect x="22" y="22" width="468" height="468" rx="22" fill="none" stroke="#ece2cc" stroke-opacity="0.18" stroke-width="2"/>
  <rect x="48" y="48" width="416" height="428" rx="26" fill="url(#well)"/>
  <g filter="url(#sh)">${PIECES.map((p) => piece(p)).join('')}</g>
  <g filter="url(#sh)">${piece(FALLING, LIFT)}</g>
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
