// Brettstile von QUEEN. Jeder Stil ist nur ein Satz Verläufe und Muster. view.js zeichnet alles mit
// Verweisen wie url(#q-plate), ein Wechsel des Stils tauscht also nur die Definitionen aus.
//
// p1 ist die Seite, die unten beginnt (Blau oder Weiß), p2 die Seite oben (immer Schwarz).

const stops = (list) => list.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('');
const solid = (id, color, alpha = 1) => `<linearGradient id="${id}">${stops([[0, color, alpha]])}</linearGradient>`;
const linear = (id, list, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops(list)}</linearGradient>`;
const radial = (id, list, cx = '38%', cy = '32%', r = '75%') => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(list)}</radialGradient>`;

// Feine Holzmaserung als Muster aus unregelmäßigen Linien
function grain(id, color, alpha, seed) {
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  let lines = '';
  for (let y = 2; y < 120; y += 3 + rnd() * 5) {
    const a = (alpha * (0.4 + rnd() * 0.8)).toFixed(3);
    const w = (0.6 + rnd() * 1.6).toFixed(2);
    const bend = (rnd() - 0.5) * 6;
    lines += `<path d="M0 ${y.toFixed(1)} C 70 ${(y + bend).toFixed(1)} 130 ${(y - bend).toFixed(1)} 200 ${y.toFixed(1)}" stroke="${color}" stroke-opacity="${a}" stroke-width="${w}" fill="none"/>`;
  }
  return `<pattern id="${id}" width="200" height="120" patternUnits="userSpaceOnUse">${lines}</pattern>`;
}

// Rautengitter für die Schalen
function lattice(id, color, alpha) {
  return `<pattern id="${id}" width="56" height="56" patternUnits="userSpaceOnUse" patternTransform="translate(0 22)">
    <path d="M28 2 L54 28 L28 54 L2 28 Z" fill="none" stroke="${color}" stroke-opacity="${alpha}" stroke-width="2"/>
    <path d="M28 18 L38 28 L28 38 L18 28 Z" fill="${color}" fill-opacity="${alpha * 0.8}"/>
  </pattern>`;
}

const empty = (id) => `<pattern id="${id}" width="1" height="1" patternUnits="userSpaceOnUse"></pattern>`;

const common = radial('q-shadow', [[0, '#000', 0.5], [1, '#000', 0]], '50%', '50%', '50%');

export const THEMES = {
  // Schwarzes Holz, Ahorn und Ebenholz, Elfenbein und Gold
  classic: {
    sides: { p1: 'white', p2: 'black' },
    defs: [
      common,
      linear('q-plate', [[0, '#1d1a17'], [1, '#0f0d0c']]),
      grain('q-grain', '#ffffff', 0.035, 7),
      linear('q-tray', [[0, '#080706'], [0.6, '#11100e'], [1, '#1c1916']]),
      lattice('q-lattice', '#c9a24a', 0.13),
      solid('q-tray-edge', '#c9a24a', 0.55),
      solid('q-frame', '#161412'),
      solid('q-frame-line', '#c9a24a'),
      linear('q-light', [[0, '#efdcb6'], [1, '#dcc394']], 1, 1),
      linear('q-dark', [[0, '#2a241e'], [1, '#1d1915']], 1, 1),
      grain('q-sq-grain', '#7a5a2a', 0.16, 3),
      solid('q-coord', '#c9a24a'),
      // Elfenbein: gedrechseltes Holz, matt mit weichem Licht
      radial('q-p1', [[0, '#fffaf0'], [0.55, '#efe4cb'], [1, '#cdb88f']]),
      solid('q-p1-ring', '#a8916a', 0.55),
      solid('q-p1-ring2', '#a8916a', 0.35),
      solid('q-p1-edge', '#ffffff', 0),
      solid('q-p1-shine', '#ffffff', 0.7),
      linear('q-p1-engrave', [[0, '#b8892c'], [1, '#7d5a14']]),
      // Ebenholz: tiefes Schwarz mit Glanz und hellem Rand, damit es auf dunklen Feldern sichtbar bleibt
      radial('q-p2', [[0, '#57514c'], [0.45, '#1b1816'], [1, '#050404']]),
      solid('q-p2-ring', '#7a7068', 0.45),
      solid('q-p2-ring2', '#7a7068', 0.25),
      solid('q-p2-edge', '#e9dcc0', 0.32),
      solid('q-p2-shine', '#ffffff', 0.55),
      linear('q-p2-engrave', [[0, '#fbe3a0'], [1, '#d4a443']]),
    ],
  },
  // Das ursprüngliche tiefblaue Brett mit Keramiksteinen
  midnight: {
    sides: { p1: 'blue', p2: 'black' },
    defs: [
      common,
      linear('q-plate', [[0, '#2a2f7a'], [1, '#14174a']]),
      empty('q-grain'),
      linear('q-tray', [[0, '#0b0d33'], [0.6, '#121543'], [1, '#1c2060']]),
      empty('q-lattice'),
      solid('q-tray-edge', '#000', 0),
      solid('q-frame', '#232870'),
      solid('q-frame-line', '#2f3588'),
      solid('q-light', '#2a3080'),
      radial('q-dark', [[0, '#1b1f5a'], [1, '#121547']], '50%', '40%', '75%'),
      empty('q-sq-grain'),
      solid('q-coord', '#000', 0),
      radial('q-p1', [[0, '#86abff'], [0.5, '#3f6ef0'], [1, '#2142b4']]),
      solid('q-p1-ring', '#9bb8ff', 0.45),
      solid('q-p1-ring2', '#000', 0),
      solid('q-p1-edge', '#fff', 0),
      solid('q-p1-shine', '#ffffff', 0.55),
      linear('q-p1-engrave', [[0, '#ffe7a0'], [1, '#e0ae3c']]),
      radial('q-p2', [[0, '#5e616e'], [0.5, '#1d1e26'], [1, '#07070a']]),
      solid('q-p2-ring', '#6a6d7a', 0.45),
      solid('q-p2-ring2', '#000', 0),
      solid('q-p2-edge', '#fff', 0),
      solid('q-p2-shine', '#ffffff', 0.55),
      linear('q-p2-engrave', [[0, '#ffe7a0'], [1, '#e0ae3c']]),
    ],
  },
};

export const THEME_IDS = ['classic', 'midnight'];
export const DEFAULT_THEME = 'classic';

// Krone der Dame als feine Goldgravur: Kreuz, Reichsapfel, Bügel, Lilien, Reif mit Steinen, Hermelin.
// Koordinaten für einen Stein mit Radius 44, Mitte im Ursprung.
export const CROWN = {
  lines: [
    'M-20.5 9 C-21.7 -11 -7.4 -17 0 -13.5 C7.4 -17 21.7 -11 20.5 9', // äußere Bügel
    'M0 9 C1.6 0 1.6 -7 0 -13.5', // vorderer Bügel
    'M-23 9 H23 V16.5 H-23 Z', // Reif
    'M-24 16.5 H24 A3.2 3.2 0 0 1 24 23 H-24 A3.2 3.2 0 0 1 -24 16.5 Z', // Hermelin
    'M-4 -17.5 A4 4 0 1 0 4 -17.5 A4 4 0 1 0 -4 -17.5 M-4 -17.5 H4', // Reichsapfel
  ],
  fills: [
    // Tatzenkreuz auf dem Reichsapfel
    'M-1.2 -21.5 L-1 -24 L-3.6 -25 V-28 L-1 -27 L-1.2 -29.6 H1.2 L1 -27 L3.6 -28 V-25 L1 -24 L1.2 -21.5 Z',
    // Tatzenkreuz auf dem Reif
    'M-1.6 9 L-1.4 6 L-4.2 5 V1.5 L-1.4 2.6 L-1.6 -0.4 H1.6 L1.4 2.6 L4.2 1.5 V5 L1.4 6 L1.6 9 Z',
    // Lilien links und rechts
    'M-13.5 9 C-15.5 6 -15.5 3 -13.5 0.5 C-11.5 3 -11.5 6 -13.5 9 Z M-13.5 7.6 C-16.6 7.6 -17.8 5.2 -16.6 3.4 C-16 5.6 -14.8 6.4 -13.5 6.4 Z M-13.5 7.6 C-10.4 7.6 -9.2 5.2 -10.4 3.4 C-11 5.6 -12.2 6.4 -13.5 6.4 Z',
    'M13.5 9 C15.5 6 15.5 3 13.5 0.5 C11.5 3 11.5 6 13.5 9 Z M13.5 7.6 C16.6 7.6 17.8 5.2 16.6 3.4 C16 5.6 14.8 6.4 13.5 6.4 Z M13.5 7.6 C10.4 7.6 9.2 5.2 10.4 3.4 C11 5.6 12.2 6.4 13.5 6.4 Z',
  ],
  // Steine im Reif und Perlen auf den Bügeln als kleine gravierte Punkte
  dots: [
    [-16.5, 12.75, 1.7], [-8.2, 12.75, 1.7], [0, 12.75, 2.1], [8.2, 12.75, 1.7], [16.5, 12.75, 1.7],
    [-16, -7.5, 1.1], [-9.5, -12.2, 1.1], [9.5, -12.2, 1.1], [16, -7.5, 1.1],
  ],
  // Hermelinschwänze
  tails: [-15, -5, 5, 15],
};
