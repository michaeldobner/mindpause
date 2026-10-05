// Formen von BLOCKS und der Zufall, aus dem das Tablett gefüllt wird.
//
// Jede Familie ist als Zeichenbild beschrieben, # ist ein Feld. Alle Drehungen (und bei
// asymmetrischen Formen die Spiegelungen) werden daraus erzeugt, doppelte entfallen.
// Ein Stein auf dem Tablett ist eine dieser Lagen, sein Schlüssel ist „familie:nummer“.

const FAMILIES = [
  // id, Bild, Gewicht der Familie, Spiegelungen
  { id: 'dot', rows: ['#'], weight: 3 },
  { id: 'i2', rows: ['##'], weight: 6 },
  { id: 'i3', rows: ['###'], weight: 6 },
  { id: 'i4', rows: ['####'], weight: 5 },
  { id: 'i5', rows: ['#####'], weight: 3 },
  { id: 'c3', rows: ['##', '#.'], weight: 6 },
  { id: 'o2', rows: ['##', '##'], weight: 6 },
  { id: 'o3', rows: ['###', '###', '###'], weight: 2 },
  { id: 'r6', rows: ['###', '###'], weight: 3 },
  { id: 't4', rows: ['###', '.#.'], weight: 4 },
  { id: 's4', rows: ['.##', '##.'], weight: 4, mirror: true },
  { id: 'l4', rows: ['#..', '###'], weight: 6, mirror: true },
  { id: 'c5', rows: ['###', '#..', '#..'], weight: 4 },
];

// Zellen aus einem Zeichenbild, links oben bei 0,0
const parse = (rows) => rows.flatMap((row, y) => [...row].flatMap((ch, x) => (ch === '#' ? [[x, y]] : [])));

// Zellen auf 0,0 schieben und sortieren, damit gleiche Lagen gleich aussehen
function normalize(cells) {
  const mx = Math.min(...cells.map(([x]) => x));
  const my = Math.min(...cells.map(([, y]) => y));
  return cells.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}

const rotate = (cells) => normalize(cells.map(([x, y]) => [-y, x]));
const flip = (cells) => normalize(cells.map(([x, y]) => [-x, y]));

function orientations(rows, mirror) {
  const out = [];
  const seen = new Set();
  let starts = [normalize(parse(rows))];
  if (mirror) starts.push(flip(starts[0]));
  for (let cells of starts) {
    for (let r = 0; r < 4; r++) {
      const key = JSON.stringify(cells);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(cells);
      }
      cells = rotate(cells);
    }
  }
  return out;
}

// Alle Lagen als Schlüssel → { key, family, cells, w, h, size }
export const SHAPES = {};
const POOL = [];
for (const f of FAMILIES) {
  const list = orientations(f.rows, f.mirror);
  list.forEach((cells, i) => {
    const key = `${f.id}:${i}`;
    const w = Math.max(...cells.map(([x]) => x)) + 1;
    const h = Math.max(...cells.map(([, y]) => y)) + 1;
    SHAPES[key] = { key, family: f.id, cells, w, h, size: cells.length };
    // Das Gewicht verteilt sich auf die Lagen, damit Formen mit vielen Lagen nicht häufiger kommen
    POOL.push([key, f.weight / list.length]);
  });
}
const TOTAL = POOL.reduce((s, [, w]) => s + w, 0);

export const FAMILY_IDS = FAMILIES.map((f) => f.id);
export const shapeOf = (key) => SHAPES[key] || null;

// Kleiner Zufallsgenerator mit Startwert (mulberry32). Der Zustand lässt sich speichern.
export function createRandom(seed) {
  const r = {
    state: seed >>> 0,
    next() {
      r.state = (r.state + 0x6d2b79f5) >>> 0;
      let t = r.state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
  return r;
}

// Eine Lage nach Gewicht ziehen. families: nur diese Formen (Level führen große Formen nach und nach ein)
export function pickShape(rng, families = null) {
  const pool = families ? POOL.filter(([key]) => families.includes(SHAPES[key].family)) : POOL;
  const total = families ? pool.reduce((sum, [, w]) => sum + w, 0) : TOTAL;
  let v = rng.next() * total;
  for (const [key, w] of pool) {
    v -= w;
    if (v < 0) return key;
  }
  return pool[pool.length - 1][0];
}
