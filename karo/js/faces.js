// Das Kartendeck von KARO als SVG. Alles wird einmal als <symbol> angelegt und von jeder
// Karte mit <use> eingebunden. Gestochen scharf auf jedem Display, nur wenige KB.
//
// Gestaltung im Stil klassischer Designer-Decks:
//   * reinweißes Papier, keine Rahmen, viel Weißraum
//   * feiner Index in Didot: Wert über der Farbe, oben links und gedreht unten rechts
//   * Bildkarten als große, diagonal liegende Figuren über die ganze Karte, um 180° gespiegelt,
//     mit Musterbändern (Sägezahn, Punktreihe, Linsen mit Wellenlinie, Streifen am Rand)
//   * Rückseite mit Harlekin-Rauten in diagonalen Bahnen
//
// Maße einer Karte: 250 × 350 (Seitenverhältnis wie echte Spielkarten 63 × 88 mm).
// Der Index oben links muss allein lesbar sein, denn in den Spalten sieht man oft nur diesen Streifen.

import { suitOf, rankOf } from './cards.js?v=1.0.1';

export const W = 250;
export const H = 350;

export const COLORS = {
  paper: '#fdfcf9',
  cream: '#f2e8d6',
  ink: '#1b1c26',
  red: '#c8382b',
  petrol: '#1e5c52',
  orange: '#e39a4a',
  blue: '#4aa0d8',
  rust: '#c0652f',
  periwinkle: '#6f78b8',
  navy: '#2b3070',
  ochre: '#d9a441',
  green: '#2f6b5c',
  skin: '#f8f2e9',
};

const DISPLAY = "Didot, 'Bodoni 72', 'Bodoni MT', 'Playfair Display', Georgia, 'Times New Roman', serif";

export const suitColor = (suit) => (suit % 2 === 1 ? COLORS.red : COLORS.ink);

export const RANK_LABELS = {
  de: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'B', 'D', 'K'],
  en: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
};

// ---------- Farbsymbole ----------
// Klassisch, leicht weich gezeichnet. Im Feld 100 × 100, ohne Füllfarbe,
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

const suitSymbols = () => SUIT_SHAPES.map((shape, i) => `<symbol id="karo-suit-${i}" viewBox="0 0 100 100">${shape}</symbol>`).join('');

// ---------- Rückseite ----------
// Längliche Rauten in diagonalen Bahnen: Petrol als Grund, dazwischen Bahnen aus
// Creme mit Orange und Creme mit Himmelblau.

function backSymbol() {
  const a = 16; // halbe Breite einer Raute
  const b = 30; // halbe Höhe einer Raute
  const inset = 9;
  let shapes = '';
  for (let u = -14; u < 22; u++) {
    for (let v = -14; v < 22; v++) {
      const x = (u - v) * a + 125;
      const y = (u + v) * b - 140;
      if (x < -a || x > W + a || y < -b || y > H + b) continue;
      const m = ((u % 4) + 4) % 4;
      let fill = COLORS.petrol;
      if (m === 1) fill = v % 2 === 0 ? COLORS.cream : COLORS.orange;
      if (m === 3) fill = v % 2 === 0 ? COLORS.cream : COLORS.blue;
      shapes += `<path d="M${x} ${y - b}L${x + a} ${y}L${x} ${y + b}L${x - a} ${y}z" fill="${fill}"/>`;
    }
  }
  return `<symbol id="karo-back" viewBox="0 0 ${W} ${H}">
    <clipPath id="karo-back-clip"><rect x="${inset}" y="${inset}" width="${W - inset * 2}" height="${H - inset * 2}" rx="9"/></clipPath>
    <rect width="${W}" height="${H}" rx="16" fill="${COLORS.paper}"/>
    <g clip-path="url(#karo-back-clip)">${shapes}</g>
  </symbol>`;
}

// ---------- Index und Symbole ----------

const pip = (suit, cx, cy, size, flip = false) => {
  const t = flip ? ` transform="rotate(180 ${cx} ${cy})"` : '';
  return `<use href="#karo-suit-${suit}" x="${cx - size / 2}" y="${cy - size / 2}" width="${size}" height="${size}" fill="${suitColor(suit)}"${t}/>`;
};

// Feiner Index: Wert in Didot über der Farbe. Eine hauchdünne Kontur in derselben Farbe
// stärkt die Haarlinien der Didot, damit der Wert auch auf kleinen Karten lesbar bleibt.
function index(card, lang) {
  const suit = suitOf(card);
  const label = RANK_LABELS[lang][rankOf(card) - 1];
  const color = suitColor(suit);
  const wide = label.length > 1;
  const one = `<text x="38" y="77" text-anchor="middle" font-family="${DISPLAY}" font-size="${wide ? 68 : 78}"
      fill="${color}" stroke="${color}" stroke-width="2" ${wide ? 'textLength="66" lengthAdjust="spacingAndGlyphs"' : ''}>${label}</text>
    ${pip(suit, 38, 102, 34)}`;
  return `${one}<g transform="rotate(180 125 175)">${one}</g>`;
}

// ---------- Zahlkarten und Asse ----------

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
  const xs = [96, 131, 166];
  const top = 80;
  const bottom = 270;
  return PIPS[rankOf(card)].map(([c, r]) => pip(suit, xs[c], top + r * (bottom - top), 34, r > 0.5)).join('');
}

// Ass: ein einzelnes Symbol auf weißem Grund. Das Pik-Ass trägt als Signatur des Decks
// die Muster der Bildkarten: Sägezahnkranz, Punktreihe und eine Linse mit Wellenlinie.
function aceBody(card) {
  const suit = suitOf(card);
  if (suit !== 0) return pip(suit, 125, 175, 74);
  const cx = 125;
  const cy = 175;
  let teeth = '';
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const b = ((i + 0.5) / 36) * Math.PI * 2;
    const c = ((i + 1) / 36) * Math.PI * 2;
    const p = (ang, r) => `${(cx + Math.cos(ang) * r).toFixed(1)} ${(cy + Math.sin(ang) * r).toFixed(1)}`;
    teeth += `<path d="M${p(a, 74)}L${p(b, 64)}L${p(c, 74)}z" fill="${COLORS.paper}"/>`;
  }
  let dots = '';
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    dots += `<circle cx="${(cx + Math.cos(a) * 58).toFixed(1)}" cy="${(cy + Math.sin(a) * 58).toFixed(1)}" r="3.4" fill="${COLORS.red}"/>`;
  }
  return `<circle cx="${cx}" cy="${cy}" r="80" fill="${COLORS.ink}"/>
    ${teeth}
    <circle cx="${cx}" cy="${cy}" r="64" fill="${COLORS.rust}"/>
    ${dots}
    <circle cx="${cx}" cy="${cy}" r="51" fill="${COLORS.cream}"/>
    ${pip(0, cx, cy + 2, 66)}
    <path d="M${cx - 10} ${cy + 1}q5-5 10 0t10 0" fill="none" stroke="${COLORS.cream}" stroke-width="2.2" stroke-linecap="round"/>`;
}

// ---------- Bildkarten ----------
// Eine Hälfte der Figur wird in einem eigenen Koordinatensystem gezeichnet: Ursprung in der
// Kartenmitte, Kopf nach oben (negatives y). Die ganze Figur liegt um 28° gedreht diagonal
// auf der Karte, die zweite Hälfte ist die erste um 180° gedreht.

const TILT = 28;

const COURT_PALETTE = [
  // Pik: Taubenblau mit Marine
  { gown: COLORS.periwinkle, stripe: COLORS.navy, accent: COLORS.cream, dot: COLORS.navy, hood: COLORS.navy },
  // Herz: Rost mit Zinnober
  { gown: COLORS.rust, stripe: COLORS.red, accent: COLORS.cream, dot: COLORS.red, hood: COLORS.rust },
  // Kreuz: Petrol mit Ocker
  { gown: COLORS.green, stripe: COLORS.ochre, accent: COLORS.cream, dot: COLORS.ochre, hood: COLORS.green },
  // Karo: Ocker mit Orange
  { gown: COLORS.ochre, stripe: COLORS.orange, accent: COLORS.cream, dot: COLORS.red, hood: COLORS.orange },
];

// Umriss des Gewands je Rang: der König breit und kantig, die Dame schmal an den Schultern,
// der Bube schlank
const GOWN = {
  13: [[-98, 0], [-84, -48], [-52, -74], [52, -74], [84, -48], [98, 0]],
  12: [[-94, 0], [-76, -46], [-40, -75], [40, -75], [76, -46], [94, 0]],
  11: [[-86, 0], [-72, -50], [-38, -75], [38, -75], [72, -50], [86, 0]],
};

const pts = (list) => list.map(([x, y]) => `${x} ${y}`).join('L');

function courtHalf(card) {
  const suit = suitOf(card);
  const rank = rankOf(card);
  const p = COURT_PALETTE[suit];
  const ink = COLORS.ink;
  const g = GOWN[rank];
  const clip = `karo-gc-${card}`;
  // Ein Hauch über die Mitte hinaus, damit sich beide Hälften nahtlos überlappen
  const g2 = g.map(([x, y]) => [x, y === 0 ? 1.5 : y]);
  const outline = `M${pts(g2)}z`;
  const edge = `M${pts(g2)}`; // ohne die Mittelkante, dort treffen sich beide Hälften

  // Sägezahnband unter dem Hals
  let teeth = '';
  for (let x = -100; x < 100; x += 11) teeth += `<path d="M${x} -52L${x + 5.5} -63L${x + 11} -52z" fill="${COLORS.paper}"/>`;
  // Punktreihe
  let dots = '';
  for (let x = -90; x <= 90; x += 17) dots += `<circle cx="${x}" cy="-39" r="5.2" fill="${p.dot}"/><circle cx="${x}" cy="-39" r="1.9" fill="${COLORS.paper}"/>`;
  // Linse mit Wellenlinie und Punkten
  const lens = (cx, cy, rot) => `<g transform="translate(${cx} ${cy}) rotate(${rot})">
      <path d="M-26 0Q0-17 26 0Q0 17-26 0z" fill="${ink}"/>
      <path d="M-17 1q4-5 8 0t8 0 8 0 8 0" fill="none" stroke="${COLORS.paper}" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="-8" cy="-6" r="1.8" fill="${COLORS.paper}"/><circle cx="9" cy="6" r="1.8" fill="${COLORS.paper}"/>
    </g>`;

  // Muster je Rang: der König mit Schachbrett und Bögen, die Dame mit Punkten und Linsen,
  // der Bube mit Kordel und Fischgrät
  let checks = '';
  for (let x = -112, i = 0; x < 112; x += 8, i++) {
    checks += `<rect x="${x}" y="-44" width="8" height="5" fill="${i % 2 ? ink : p.accent}"/><rect x="${x}" y="-39" width="8" height="5" fill="${i % 2 ? p.accent : ink}"/>`;
  }
  const arcs = (cx, cy, rot) => `<g transform="translate(${cx} ${cy}) rotate(${rot})">
      ${[[24, ink], [18, p.accent], [12, p.stripe], [6, ink]].map(([r, c]) => `<path d="M${-r} 0A${r} ${r} 0 0 1 ${r} 0z" fill="${c}"/>`).join('')}
    </g>`;
  const herringbone = (cx) => {
    let out = `<rect x="${cx - 13}" y="-34" width="26" height="36" fill="${p.accent}"/>`;
    for (let y = -26; y <= 2; y += 7) out += `<path d="M${cx - 10} ${y}L${cx} ${y - 6}L${cx + 10} ${y}" fill="none" stroke="${ink}" stroke-width="2.6"/>`;
    return out;
  };
  // Kragen: König mit Zickzack nach beiden Seiten, Dame mit Sägezahn, Bube mit Wimpeln
  let collar = `<rect x="-110" y="-70" width="220" height="19" fill="${ink}"/>`;
  if (rank === 13) {
    for (let x = -110; x < 110; x += 11) collar += `<path d="M${x} -51L${x + 5.5} -59L${x + 11} -51z M${x + 5.5} -70L${x + 11} -62L${x + 16.5} -70z" fill="${COLORS.paper}"/>`;
  } else if (rank === 12) {
    collar += teeth;
  } else {
    for (let x = -110; x < 110; x += 14) collar += `<path d="M${x} -70L${x + 7} -56L${x + 14} -70z" fill="${p.accent}"/><circle cx="${x + 7}" cy="-64" r="1.6" fill="${ink}"/>`;
  }
  const pattern = {
    13: `${checks}${arcs(-50, 0, 0)}${arcs(50, 0, 0)}
      <path d="M0-30l10 8v8l-10 8-10-8v-8z" fill="${ink}"/><path d="M0-24l5 4v4l-5 4-5-4v-4z" fill="${COLORS.ochre}"/>`,
    12: `${dots}${lens(-52, -13, -58)}${lens(52, -13, 58)}
      <path d="M0-28l8 10-8 10-8-10z" fill="${ink}"/><path d="M0-23l4 5-4 5-4-5z" fill="${p.accent}"/>`,
    11: `<path d="M-110-39h220" stroke="${p.accent}" stroke-width="9"/><path d="M-110-39h220" stroke="${p.stripe}" stroke-width="3" stroke-dasharray="6 5"/>
      ${herringbone(-44)}${herringbone(44)}
      <circle cx="0" cy="-16" r="8" fill="${ink}"/><circle cx="0" cy="-16" r="3.5" fill="${p.accent}"/>`,
  }[rank];

  let behind = '';
  // Attribut in der Hand: Zepter, Blüte oder Schwert
  if (rank === 13) {
    behind += `<path d="M-60-30L-66-136" stroke="${COLORS.ochre}" stroke-width="4" stroke-linecap="round"/>
      <path d="M-67-150l7 9-7 9-7-9z" fill="${COLORS.ochre}" stroke="${ink}" stroke-width="1.2"/>`;
  } else if (rank === 12) {
    behind += `<path d="M-58-36Q-70-80-64-120" fill="none" stroke="${COLORS.green}" stroke-width="2.4"/>
      <path d="M-62-78q-12-6-16 4q10 4 16-4z" fill="${COLORS.green}"/>
      <g stroke="${ink}" stroke-width="1">${[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return `<circle cx="${(-64 + Math.cos(a) * 6.5).toFixed(1)}" cy="${(-128 + Math.sin(a) * 6.5).toFixed(1)}" r="5" fill="${COLORS.red}"/>`;
      }).join('')}</g>
      <circle cx="-64" cy="-128" r="3.4" fill="${COLORS.ochre}"/>`;
  } else {
    behind += `<path d="M-60-30L-64-144" stroke="${COLORS.cream}" stroke-width="4.5"/>
      <path d="M-60-30L-64-144" stroke="${ink}" stroke-width="1" stroke-dasharray="0" fill="none"/>
      <path d="M-72-50h22" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>
      <path d="M-64-144l-3-8 3-6 3 6z" fill="${COLORS.cream}" stroke="${ink}" stroke-width="1"/>`;
  }
  let art = `<clipPath id="${clip}"><path d="${outline}"/></clipPath>
    <g clip-path="url(#${clip})">
      <path d="${outline}" fill="${p.gown}"/>
      <path d="${edge}" fill="none" stroke="${p.accent}" stroke-width="34"/>
      <path d="${edge}" fill="none" stroke="${p.stripe}" stroke-width="24"/>
      <path d="${edge}" fill="none" stroke="${p.gown}" stroke-width="9"/>
      ${collar}
      ${pattern}
    </g>
    <path d="${edge}" fill="none" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>`;

  let head = '';
  // Kopfbedeckung hinter dem Kopf: Haube der Dame, Haar von König und Bube
  if (rank === 12) {
    head += `<path d="M-30-90Q-40-128-22-152Q0-170 22-152Q40-128 30-90z" fill="${p.hood}" stroke="${ink}" stroke-width="1.3"/>
      <path d="M-24-92Q-32-126-17-146Q0-160 17-146Q32-126 24-92" fill="none" stroke="${COLORS.cream}" stroke-width="2.2"/>`;
  } else {
    head += `<path d="M-21-112Q-24-150 0-151Q24-150 21-112z" fill="${ink}"/>`;
  }

  // Hals und Gesicht als feine Linienzeichnung: halb geöffnete Augen mit gesenktem Blick,
  // lange Nase, kleiner roter Mund
  const line = `fill="none" stroke="${ink}" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"`;
  head += `<path d="M-8-92V-104h16V-92" fill="${COLORS.skin}" stroke="${ink}" stroke-width="1.2"/>`;
  if (rank === 13) {
    head += `<path d="M-19-122Q-21-90 0-84Q21-90 19-122z" fill="${ink}"/>`;
  }
  head += `<ellipse cx="0" cy="-124" rx="17.5" ry="23" fill="${COLORS.skin}" stroke="${ink}" stroke-width="1.3"/>
    <path d="M-14-135q6-4.5 12-1.2M2-136.2q6-3.3 12 1.2" fill="none" stroke="${ink}" stroke-width="1.1" stroke-linecap="round"/>
    ${[-7, 7].map((x) => `<g transform="translate(${x} -127)">
      <path d="M-5.6 0Q0-3.6 5.6 0Q0 2.8-5.6 0z" fill="${COLORS.paper}"/>
      <path d="M-2.4-0.9a2.4 2.4 0 0 0 4.8 0z" fill="${ink}"/>
      <path d="M-5.8 0.2Q0-4.4 5.8 0.2" fill="none" stroke="${ink}" stroke-width="1.7" stroke-linecap="round"/>
      <path d="M-4.6 1.1Q0 3 4.6 1.1" fill="none" stroke="${ink}" stroke-width="0.6" stroke-linecap="round"/>
      <path d="M${x < 0 ? -5.8 : 5.8} 0.2l${x < 0 ? -1.8 : 1.8}-1.4" fill="none" stroke="${ink}" stroke-width="1" stroke-linecap="round"/>
    </g>`).join('')}
    <path d="M0-131L-2.4-115.5Q0-113.5 3-115.5" ${line}/>
    <path d="M-4.6-108.5Q0-105 4.6-108.5Q0-110.6-4.6-108.5z" fill="${COLORS.red}"/>`;
  if (rank === 13) {
    head += `<path d="M-12-102q12-4 24 0" fill="none" stroke="${COLORS.cream}" stroke-width="1.2"/>`;
  }

  // Krone, Haube oder Kappe
  if (rank === 13) {
    head += `<path d="M-20-144V-162l8 6 6-12 6 9 6-9 6 12 8-6V-144z" fill="${COLORS.ochre}" stroke="${ink}" stroke-width="1.3"/>
      <rect x="-20" y="-148" width="40" height="5" fill="${p.stripe}" stroke="${ink}" stroke-width="1.1"/>
      <circle cx="0" cy="-156" r="2.6" fill="${COLORS.red}"/>`;
  } else if (rank === 12) {
    head += `<g transform="rotate(24 0 -150)">
        <path d="M-14-150l3-13 5 8 6-12 6 12 5-8 3 13z" fill="${COLORS.cream}" stroke="${ink}" stroke-width="1.2"/>
        <path d="M-14-150h28" stroke="${COLORS.red}" stroke-width="3"/>
        <circle cx="0" cy="-166" r="2.2" fill="${COLORS.red}"/>
      </g>`;
  } else {
    head += `<path d="M-20-140Q-23-170 2-178Q24-172 21-140z" fill="${p.gown}" stroke="${ink}" stroke-width="1.3"/>
      <path d="M-21-146h42" stroke="${ink}" stroke-width="6"/>
      ${[-15, -7, 1, 9, 17].map((x) => `<circle cx="${x}" cy="-146" r="1.6" fill="${COLORS.paper}"/>`).join('')}`;
  }

  art += `<g transform="translate(0 -74) scale(1.35) translate(0 92)">${head}</g>`;
  return behind + art;
}

function courtBody(card) {
  const half = `karo-half-${card}`;
  return `<g transform="translate(125 175) rotate(${TILT})">
      <g id="${half}">${courtHalf(card)}</g>
      <use href="#${half}" transform="rotate(180)"/>
    </g>`;
}

function faceSymbol(card, lang) {
  const rank = rankOf(card);
  const body = rank === 1 ? aceBody(card) : rank > 10 ? courtBody(card) : numberBody(card);
  const clip = `karo-card-${card}`;
  return `<symbol id="karo-face-${card}" viewBox="0 0 ${W} ${H}">
    <clipPath id="${clip}"><rect width="${W}" height="${H}" rx="16"/></clipPath>
    <rect width="${W}" height="${H}" rx="16" fill="${COLORS.paper}"/>
    <g clip-path="url(#${clip})">${body}</g>
    ${index(card, lang)}
  </symbol>`;
}

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
