// Das Kartendeck von KARO als SVG: Rückseite mit Harlekin-Rauten, Zahlkarten, Asse und
// zwölf Bildkarten im Art-déco-Stil. Alles wird einmal als <symbol> angelegt und von jeder
// Karte mit <use> eingebunden. Gestochen scharf auf jedem Display, nur wenige KB.
//
// Maße einer Karte: 250 × 350 (Seitenverhältnis wie echte Spielkarten 63 × 88 mm).
// Oben liegt die Kopfzeile mit Wert und Farbe. Sie muss allein lesbar sein, denn in den
// Spalten sieht man von verdeckten Karten nur diesen Streifen.

import { suitOf, rankOf } from './cards.js?v=1.0.0';

export const W = 250;
export const H = 350;

export const COLORS = {
  paper: '#fbf8f2',
  cream: '#f4ecdc',
  ink: '#1c1d2a',
  red: '#c63b2c',
  gold: '#c9a961',
  petrol: '#1f5a50',
  orange: '#e08a3c',
  blue: '#3e9ad3',
  rust: '#b5532a',
  indigo: '#454c96',
  ochre: '#d9a441',
  skin: '#f7efe2',
};

const DISPLAY = "Didot, 'Bodoni 72', 'Bodoni MT', 'Playfair Display', Georgia, 'Times New Roman', serif";

export const suitColor = (suit) => (suit % 2 === 1 ? COLORS.red : COLORS.ink);

export const RANK_LABELS = {
  de: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'B', 'D', 'K'],
  en: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
};

// ---------- Farbsymbole ----------
// Eigene Zeichnung, etwas weicher und runder als üblich. Im Feld 100 × 100, ohne Füllfarbe,
// damit sie gefüllt (Karten) und als Kontur (leere Ablagen) nutzbar sind.

const SUIT_SHAPES = [
  // Pik
  '<path d="M50 5C63 25 93 39 93 61c0 13-10 22-22 22-8 0-14-4-17-9 1 9 5 15 13 20H33c8-5 12-11 13-20-3 5-9 9-17 9C17 83 7 74 7 61 7 39 37 25 50 5z"/>',
  // Herz
  '<path d="M50 90C22 68 6 52 6 32 6 18 17 8 30 8c9 0 16 5 20 13 4-8 11-13 20-13 13 0 24 10 24 24 0 20-16 36-44 58z"/>',
  // Kreuz
  '<circle cx="50" cy="28" r="19"/><circle cx="28" cy="57" r="19"/><circle cx="72" cy="57" r="19"/><circle cx="50" cy="52" r="11"/><path d="M45 50h10l-1 14c1 13 5 22 13 30H33c8-8 12-17 13-30z"/>',
  // Karo
  '<path d="M50 3c9 17 21 33 38 47-17 14-29 30-38 47-9-17-21-33-38-47C29 36 41 20 50 3z"/>',
];

// ---------- Rückseite ----------
// Rauten in diagonalen Bahnen: Petrol als Grund, dazwischen Reihen aus Creme mit Orange
// und Creme mit Himmelblau, wie bei einem Harlekin-Muster.

function backSymbol() {
  const a = 17; // halbe Breite einer Raute
  const b = 29; // halbe Höhe einer Raute
  const inset = 11;
  let shapes = '';
  for (let u = -14; u < 22; u++) {
    for (let v = -14; v < 22; v++) {
      const x = (u - v) * a + 125;
      const y = (u + v) * b - 140;
      if (x < -a || x > W + a || y < -b || y > H + b) continue;
      // Petrol im Schachbrett, dazwischen Bahnen aus Orange, Creme und Blau
      const m = ((u % 4) + 4) % 4;
      let fill = COLORS.petrol;
      if ((u + v) % 2 !== 0) fill = [COLORS.cream, COLORS.orange, COLORS.cream, COLORS.blue][m];
      shapes += `<path d="M${x} ${y - b}L${x + a} ${y}L${x} ${y + b}L${x - a} ${y}z" fill="${fill}"/>`;
    }
  }
  return `<symbol id="karo-back" viewBox="0 0 ${W} ${H}">
    <clipPath id="karo-back-clip"><rect x="${inset}" y="${inset}" width="${W - inset * 2}" height="${H - inset * 2}" rx="8"/></clipPath>
    <rect width="${W}" height="${H}" rx="16" fill="${COLORS.cream}"/>
    <g clip-path="url(#karo-back-clip)">${shapes}</g>
    <rect x="${inset}" y="${inset}" width="${W - inset * 2}" height="${H - inset * 2}" rx="8" fill="none" stroke="rgba(28,29,42,0.25)" stroke-width="1"/>
  </symbol>`;
}

// ---------- Vorderseiten ----------

const pip = (suit, cx, cy, size, flip = false) => {
  const x = cx - size / 2;
  const y = cy - size / 2;
  const t = flip ? ` transform="rotate(180 ${cx} ${cy})"` : '';
  return `<use href="#karo-suit-${suit}" x="${x}" y="${y}" width="${size}" height="${size}" fill="${suitColor(suit)}"${t}/>`;
};

// Kopfzeile: links groß der Wert, rechts die Farbe
function header(card, lang) {
  const suit = suitOf(card);
  const label = RANK_LABELS[lang][rankOf(card) - 1];
  const wide = label.length > 1;
  return `<text x="${wide ? 12 : 18}" y="80" font-family="${DISPLAY}" font-size="${wide ? 80 : 86}" font-weight="700"
      fill="${suitColor(suit)}" ${wide ? 'textLength="92" lengthAdjust="spacingAndGlyphs"' : ''}>${label}</text>
    ${pip(suit, 202, 46, 62)}`;
}

// Anordnung der Symbole auf den Zahlkarten: [Spalte, Zeile 0 bis 1]
const L = 0;
const M = 1;
const R = 2;
const PIPS = {
  2: [[M, 0], [M, 1]],
  3: [[M, 0], [M, 0.5], [M, 1]],
  4: [[L, 0], [R, 0], [L, 1], [R, 1]],
  5: [[L, 0], [R, 0], [M, 0.5], [L, 1], [R, 1]],
  6: [[L, 0], [R, 0], [L, 0.5], [R, 0.5], [L, 1], [R, 1]],
  7: [[L, 0], [R, 0], [M, 0.25], [L, 0.5], [R, 0.5], [L, 1], [R, 1]],
  8: [[L, 0], [R, 0], [M, 0.25], [L, 0.5], [R, 0.5], [M, 0.75], [L, 1], [R, 1]],
  9: [[L, 0], [R, 0], [L, 1 / 3], [R, 1 / 3], [M, 0.5], [L, 2 / 3], [R, 2 / 3], [L, 1], [R, 1]],
  10: [[L, 0], [R, 0], [M, 1 / 6], [L, 1 / 3], [R, 1 / 3], [L, 2 / 3], [R, 2 / 3], [M, 5 / 6], [L, 1], [R, 1]],
};

function numberBody(card) {
  const suit = suitOf(card);
  const xs = [76, 125, 174];
  const top = 136;
  const bottom = 314;
  return PIPS[rankOf(card)].map(([c, r]) => pip(suit, xs[c], top + r * (bottom - top), 46, r > 0.5)).join('');
}

// Ass: großes Symbol in einem Rautenrahmen mit feiner Goldlinie.
// Das Pik-Ass trägt als Signatur des Decks ein Ornament.
function aceBody(card) {
  const suit = suitOf(card);
  const cx = 125;
  const cy = 222;
  const frame = (dx, dy, w) => `<path d="M${cx} ${cy - dy}L${cx + dx} ${cy}L${cx} ${cy + dy}L${cx - dx} ${cy}z" fill="none" stroke="${COLORS.gold}" stroke-width="${w}"/>`;
  let art = frame(96, 116, 2.4) + frame(86, 104, 1);
  if (suit === 0) {
    let rays = '';
    for (let i = 0; i < 24; i++) {
      const ang = (i / 24) * Math.PI * 2;
      const r1 = 64;
      const r2 = i % 2 ? 72 : 78;
      rays += `<line x1="${cx + Math.cos(ang) * r1}" y1="${cy + Math.sin(ang) * r1}" x2="${cx + Math.cos(ang) * r2}" y2="${cy + Math.sin(ang) * r2}"/>`;
    }
    art += `<g stroke="${COLORS.gold}" stroke-width="2" stroke-linecap="round">${rays}</g>
      <circle cx="${cx}" cy="${cy}" r="58" fill="${COLORS.cream}" stroke="${COLORS.gold}" stroke-width="1.6"/>
      ${pip(0, cx, cy, 84)}
      <path d="M${cx} ${cy - 22}l7 12-7 12-7-12z" fill="${COLORS.gold}"/>`;
  } else {
    art += pip(suit, cx, cy, 104);
  }
  return art;
}

// ---------- Bildkarten ----------
// Ein festes Formensystem, damit alle zwölf Figuren wie aus einer Hand wirken:
// gespiegelt (oben und unten gleich), ein ovales Gesicht mit geschlossenen Augen,
// ein Gewand als Sechseck mit Musterbändern, eine Kopfbedeckung je Rang und ein Attribut.

const COURT_STYLE = [
  // Pik: Indigo, Winkel
  { gown: COLORS.indigo, trim: COLORS.ink, band: COLORS.cream, motif: 'chevron', hair: COLORS.ink },
  // Herz: Rost, Halbkreise
  { gown: COLORS.rust, trim: COLORS.red, band: COLORS.cream, motif: 'arc', hair: COLORS.ink },
  // Kreuz: Petrol, Punkte
  { gown: COLORS.petrol, trim: COLORS.ink, band: COLORS.cream, motif: 'dot', hair: COLORS.ink },
  // Karo: Ocker, Rauten
  { gown: COLORS.ochre, trim: COLORS.orange, band: COLORS.cream, motif: 'diamond', hair: COLORS.ink },
];

function motifRow(kind, y, color, from = -60, to = 60, step = 12) {
  let out = '';
  for (let x = from; x <= to; x += step) {
    if (kind === 'chevron') out += `<path d="M${x - 5} ${y + 3}l5-6 5 6" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round"/>`;
    if (kind === 'arc') out += `<path d="M${x - 5} ${y + 3}a5 5 0 0 1 10 0z" fill="${color}"/>`;
    if (kind === 'dot') out += `<circle cx="${x}" cy="${y}" r="2.8" fill="${color}"/>`;
    if (kind === 'diamond') out += `<path d="M${x} ${y - 5}l4 5-4 5-4-5z" fill="${color}"/>`;
  }
  return out;
}

// Eine Hälfte der Figur, Ursprung in der Mitte der Karte, nach oben negativ (bis -118)
function courtHalf(suit, rank) {
  const s = COURT_STYLE[suit];
  const ink = COLORS.ink;
  const line = `stroke="${ink}" stroke-width="1.8" stroke-linejoin="round"`;
  const id = `karo-gown-${suit}-${rank}`;

  // Gewand
  const gown = 'M-64 0L-70-28Q-62-52-36-60H36Q62-52 70-28L64 0z';
  let art = `<clipPath id="${id}"><path d="${gown}"/></clipPath>
    <path d="${gown}" fill="${s.gown}" ${line}/>
    <g clip-path="url(#${id})">
      <rect x="-90" y="-36" width="180" height="14" fill="${s.band}"/>
      ${motifRow(s.motif, -29, s.trim, -84, 84, 12)}
      <rect x="-90" y="-12" width="180" height="5" fill="${s.trim}"/>
      <rect x="-13" y="-60" width="26" height="60" fill="${s.trim}"/>
      ${motifRow(s.motif === 'chevron' ? 'diamond' : s.motif, -48, s.band, 0, 0)}
      ${motifRow(s.motif === 'chevron' ? 'diamond' : s.motif, -17, s.band, 0, 0)}
    </g>`;

  // Kragen
  art += `<path d="M-34-60Q0-38 34-60z" fill="${COLORS.cream}" ${line}/>
    ${motifRow('dot', -55, s.trim, -18, 18, 9)}`;

  // Hals und Gesicht
  art += `<rect x="-7" y="-66" width="14" height="10" fill="${COLORS.skin}" ${line}/>`;
  if (rank === 13) {
    // König: Bart
    art += `<path d="M-19-82Q-20-54 0-52 20-54 19-82z" fill="${s.hair}"/>`;
  }
  if (rank === 12) {
    // Dame: langes Haar zu beiden Seiten
    art += `<path d="M-22-90Q-34-62-24-52H24Q34-62 22-90z" fill="${s.hair}"/>`;
  }
  art += `<ellipse cx="0" cy="-80" rx="18" ry="22" fill="${COLORS.skin}" ${line}/>
    <path d="M-11-83q4.5 4 9 0M2-83q4.5 4 9 0" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M0-80l-2.5 8h4" fill="none" stroke="${ink}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M-5-66q5 3 10 0" fill="none" stroke="${COLORS.red}" stroke-width="2" stroke-linecap="round"/>`;
  if (rank === 13) art += `<path d="M-9-68q9-4 18 0" fill="none" stroke="${COLORS.cream}" stroke-width="1.4"/>`;

  // Kopfbedeckung
  if (rank === 13) {
    art += `<path d="M-19-98V-112l7 5 6-11 6 8 6-8 6 11 7-5V-98z" fill="${COLORS.ochre}" ${line}/>
      <rect x="-19" y="-101" width="38" height="5" fill="${s.trim}" ${line}/>
      <circle cx="0" cy="-107" r="2.6" fill="${COLORS.red}"/>`;
  } else if (rank === 12) {
    art += `<path d="M-17-97A17 15 0 0 1 17-97z" fill="${COLORS.ochre}" ${line}/>
      <circle cx="-11" cy="-108" r="3.2" fill="${COLORS.cream}" ${line}/>
      <circle cx="0" cy="-114" r="3.2" fill="${COLORS.cream}" ${line}/>
      <circle cx="11" cy="-108" r="3.2" fill="${COLORS.cream}" ${line}/>
      <path d="M-17-97h34" stroke="${s.trim}" stroke-width="3"/>`;
  } else {
    art += `<path d="M-20-96Q-22-112 0-112 22-112 24-98z" fill="${s.gown}" ${line}/>
      <path d="M-21-97h44" stroke="${s.trim}" stroke-width="3.5"/>
      <path d="M14-108Q34-124 46-110 30-112 18-102z" fill="${COLORS.cream}" ${line}/>
      <path d="M16-104Q32-116 44-110" fill="none" stroke="${s.trim}" stroke-width="1.2"/>`;
  }

  // Attribut in der Hand
  if (rank === 13) {
    art += `<path d="M54-6L60-92" stroke="${COLORS.ochre}" stroke-width="4" stroke-linecap="round"/>
      <path d="M60-104l6 9-6 9-6-9z" fill="${COLORS.ochre}" ${line}/>`;
  } else if (rank === 12) {
    art += `<path d="M56-8Q52-50 60-80" fill="none" stroke="${COLORS.petrol}" stroke-width="2.6"/>
      <g ${line}>${[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return `<circle cx="${60 + Math.cos(a) * 7}" cy="${-88 + Math.sin(a) * 7}" r="5.5" fill="${COLORS.red}"/>`;
      }).join('')}</g>
      <circle cx="60" cy="-88" r="3.6" fill="${COLORS.ochre}"/>`;
  } else {
    art += `<path d="M58-8L58-70" stroke="${COLORS.ochre}" stroke-width="3.4" stroke-linecap="round"/>
      <circle cx="58" cy="-78" r="8" fill="none" stroke="${COLORS.ochre}" stroke-width="3.4"/>
      <path d="M58-22h8M58-30h6" stroke="${COLORS.ochre}" stroke-width="3.4"/>`;
  }
  art += `<circle cx="54" cy="-18" r="6" fill="${COLORS.skin}" ${line}/>`;
  return art;
}

function courtBody(card) {
  const suit = suitOf(card);
  const rank = rankOf(card);
  const s = COURT_STYLE[suit];
  const x = 20;
  const y = 98;
  const w = 210;
  const h = 238;
  const cy = y + h / 2;
  const clip = `karo-court-${card}`;
  const half = courtHalf(suit, rank);
  // Feines Punktraster als Hintergrund
  let dots = '';
  for (let yy = y + 10; yy < y + h; yy += 14) {
    for (let xx = x + 10 + ((yy - y) % 28 ? 7 : 0); xx < x + w; xx += 14) dots += `<circle cx="${xx}" cy="${yy}" r="1.1"/>`;
  }
  return `<clipPath id="${clip}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/></clipPath>
    <g clip-path="url(#${clip})">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${COLORS.cream}"/>
      <g fill="${s.gown}" opacity="0.18">${dots}</g>
      <g id="karo-half-${card}" transform="translate(125 ${cy})">${half}</g>
      <use href="#karo-half-${card}" transform="rotate(180 125 ${cy})"/>
      <path d="M${x} ${cy}H${x + w}" stroke="${COLORS.gold}" stroke-width="1.6"/>
      <path d="M125 ${cy - 7}l7 7-7 7-7-7z" fill="${COLORS.gold}"/>
    </g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${COLORS.gold}" stroke-width="2.4"/>
    <rect x="${x + 5}" y="${y + 5}" width="${w - 10}" height="${h - 10}" rx="7" fill="none" stroke="${COLORS.gold}" stroke-width="0.8"/>`;
}

function faceSymbol(card, lang) {
  const rank = rankOf(card);
  const body = rank === 1 ? aceBody(card) : rank > 10 ? courtBody(card) : numberBody(card);
  return `<symbol id="karo-face-${card}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" rx="16" fill="${COLORS.paper}"/>
    ${header(card, lang)}
    ${body}
  </symbol>`;
}

const suitSymbols = () => SUIT_SHAPES.map((shape, i) => `<symbol id="karo-suit-${i}" viewBox="0 0 100 100">${shape}</symbol>`).join('');

// Alle Symbole als ein unsichtbares SVG zum Einfügen in die Seite
export function deckDefs(lang = 'en') {
  const faces = Array.from({ length: 52 }, (_, c) => faceSymbol(c, lang)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true">${suitSymbols()}${backSymbol()}${faces}</svg>`;
}

// Eine einzelne Karte als eigenständiges SVG (für die Siegesfeier und das App-Symbol).
// card = null ergibt die Rückseite.
export function cardSvg(card, lang = 'en') {
  const symbol = card === null ? backSymbol() : faceSymbol(card, lang);
  const ref = card === null ? 'karo-back' : `karo-face-${card}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>${suitSymbols()}${symbol}</defs><use href="#${ref}" width="${W}" height="${H}"/></svg>`;
}
