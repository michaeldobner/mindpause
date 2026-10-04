// Brettstile von MÜHLE, abgeleitet von QUEEN. Jeder Stil ist nur ein Satz Verläufe und Muster.
// view.js zeichnet alles mit Verweisen wie url(#m-plate), ein Wechsel des Stils tauscht also nur
// die Definitionen aus.
//
// p1 ist die Seite, die unten sitzt und beginnt (Weiß oder Blau), p2 die Seite oben (immer Schwarz).

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

// Verlauf im Brettraum statt am Umriss: für gerade Linien, deren Umriss keine Fläche hat
const across = (id, list) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1000" y2="1280">${stops(list)}</linearGradient>`;

const empty = (id) => `<pattern id="${id}" width="1" height="1" patternUnits="userSpaceOnUse"></pattern>`;

const common = radial('m-shadow', [[0, '#000', 0.5], [1, '#000', 0]], '50%', '50%', '50%');

export const THEMES = {
  // Schwarzes Holz, Linien als eingelegte Goldadern, Elfenbein und Ebenholz
  classic: {
    sides: { p1: 'white', p2: 'black' },
    defs: [
      common,
      linear('m-plate', [[0, '#1d1a17'], [1, '#0f0d0c']]),
      grain('m-grain', '#ffffff', 0.035, 7),
      linear('m-tray', [[0, '#080706'], [0.6, '#11100e'], [1, '#1c1916']]),
      lattice('m-lattice', '#c9a24a', 0.13),
      solid('m-tray-edge', '#c9a24a', 0.55),
      solid('m-frame', '#161412'),
      solid('m-frame-line', '#c9a24a'),
      linear('m-field', [[0, '#2a241e'], [1, '#1d1915']], 1, 1),
      grain('m-field-grain', '#c9a070', 0.07, 3),
      linear('m-line', [[0, '#e3c06a'], [1, '#b68a2e']], 1, 1),
      solid('m-line-shadow', '#000', 0.55),
      radial('m-point', [[0, '#0b0a09'], [1, '#2a241e']], '50%', '40%', '70%'),
      solid('m-point-ring', '#d9b45a'),
      solid('m-coord', '#c9a24a'),
      solid('m-wheel', '#c9a24a', 0.5),
      across('m-mill', [[0, '#fff1c4'], [1, '#e8c25c']]),
      // Elfenbein: gedrechseltes Holz, matt mit weichem Licht
      radial('m-p1', [[0, '#fffaf0'], [0.55, '#efe4cb'], [1, '#cdb88f']]),
      solid('m-p1-ring', '#a8916a', 0.55),
      solid('m-p1-ring2', '#a8916a', 0.35),
      solid('m-p1-edge', '#ffffff', 0),
      solid('m-p1-shine', '#ffffff', 0.7),
      // Ebenholz: tiefes Schwarz mit Glanz und hellem Rand, damit es auf dem dunklen Feld sichtbar bleibt
      radial('m-p2', [[0, '#57514c'], [0.45, '#1b1816'], [1, '#050404']]),
      solid('m-p2-ring', '#7a7068', 0.45),
      solid('m-p2-ring2', '#7a7068', 0.25),
      solid('m-p2-edge', '#e9dcc0', 0.32),
      solid('m-p2-shine', '#ffffff', 0.55),
    ],
  },
  // Tiefblaues Lackbrett mit Keramiksteinen wie bei QUEEN
  midnight: {
    sides: { p1: 'blue', p2: 'black' },
    defs: [
      common,
      linear('m-plate', [[0, '#2a2f7a'], [1, '#14174a']]),
      empty('m-grain'),
      linear('m-tray', [[0, '#0b0d33'], [0.6, '#121543'], [1, '#1c2060']]),
      empty('m-lattice'),
      solid('m-tray-edge', '#000', 0),
      solid('m-frame', '#232870'),
      solid('m-frame-line', '#2f3588'),
      radial('m-field', [[0, '#1b1f5a'], [1, '#121547']], '50%', '40%', '75%'),
      empty('m-field-grain'),
      solid('m-line', '#4a52b0'),
      solid('m-line-shadow', '#000', 0.35),
      radial('m-point', [[0, '#0d0f38'], [1, '#1b1f5a']], '50%', '40%', '70%'),
      solid('m-point-ring', '#6b74d6'),
      solid('m-coord', '#000', 0),
      solid('m-wheel', '#4a52b0', 0.55),
      across('m-mill', [[0, '#d6e2ff'], [1, '#86abff']]),
      radial('m-p1', [[0, '#86abff'], [0.5, '#3f6ef0'], [1, '#2142b4']]),
      solid('m-p1-ring', '#9bb8ff', 0.45),
      solid('m-p1-ring2', '#000', 0),
      solid('m-p1-edge', '#fff', 0),
      solid('m-p1-shine', '#ffffff', 0.55),
      radial('m-p2', [[0, '#5e616e'], [0.5, '#1d1e26'], [1, '#07070a']]),
      solid('m-p2-ring', '#6a6d7a', 0.45),
      solid('m-p2-ring2', '#000', 0),
      solid('m-p2-edge', '#fff', 0),
      solid('m-p2-shine', '#ffffff', 0.55),
    ],
  },
};

export const THEME_IDS = ['classic', 'midnight'];
export const DEFAULT_THEME = 'classic';

// Mühlrad als feine Gravur in der Mitte des Bretts: Nabe, Speichen, Kranz mit Schaufeln.
// Koordinaten um den Ursprung, Radius etwa 74.
export function millWheel() {
  const parts = [
    '<circle r="74" fill="none" stroke-width="2.2"/>',
    '<circle r="60" fill="none" stroke-width="1.4"/>',
    '<circle r="13" fill="none" stroke-width="2.2"/>',
    '<circle r="4.5" stroke="none"/>',
  ];
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    const c = Math.cos(a);
    const s = Math.sin(a);
    parts.push(`<path d="M ${(13 * c).toFixed(1)} ${(13 * s).toFixed(1)} L ${(60 * c).toFixed(1)} ${(60 * s).toFixed(1)}" fill="none" stroke-width="2"/>`);
  }
  // Schaufeln zwischen den Kränzen
  for (let k = 0; k < 16; k++) {
    const a = ((k + 0.5) * Math.PI) / 8;
    const c = Math.cos(a);
    const s = Math.sin(a);
    parts.push(`<path d="M ${(60 * c).toFixed(1)} ${(60 * s).toFixed(1)} L ${(74 * c).toFixed(1)} ${(74 * s).toFixed(1)}" fill="none" stroke-width="1.4"/>`);
  }
  return parts.join('');
}
