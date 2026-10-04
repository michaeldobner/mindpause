// Die sieben Steine von FUGE, ihre Drehungen nach SRS und die Wandsprünge.
// Koordinaten: x nach rechts, y nach unten. Jeder Stein liegt in einem quadratischen Kasten
// (I 4 × 4, O 2 × 2, alle anderen 3 × 3) und dreht sich um dessen Mitte.

export const TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

const SHAPES = {
  I: { size: 4, cells: [[0, 1], [1, 1], [2, 1], [3, 1]] },
  O: { size: 2, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  T: { size: 3, cells: [[1, 0], [0, 1], [1, 1], [2, 1]] },
  S: { size: 3, cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  Z: { size: 3, cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  J: { size: 3, cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  L: { size: 3, cells: [[2, 0], [0, 1], [1, 1], [2, 1]] },
};

// Zellen eines Steins in einer Drehung 0 bis 3 (im Uhrzeigersinn)
const CACHE = {};
for (const type of TYPES) {
  const { size, cells } = SHAPES[type];
  CACHE[type] = [cells];
  for (let r = 1; r < 4; r++) {
    CACHE[type].push(CACHE[type][r - 1].map(([x, y]) => [size - 1 - y, x]));
  }
}

export const sizeOf = (type) => SHAPES[type].size;
export const cellsOf = (type, rot = 0) => CACHE[type][((rot % 4) + 4) % 4];

// Startspalte: mittig, bei ungerader Breite eine Spalte nach links (wie in der Guideline)
export const spawnX = (type, width = 10) => Math.floor((width - sizeOf(type)) / 2);

// Wandsprünge nach SRS, wie in der Guideline mit y nach oben angegeben.
// Schlüssel: "von>nach", Drehung 0, 1 (R), 2, 3 (L)
const KICKS_JLSTZ = {
  '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

const KICKS_I = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

// Versuche einer Drehung als Verschiebung in Brettkoordinaten (y nach unten)
export function kicksFor(type, from, to) {
  if (type === 'O') return [[0, 0]];
  const table = type === 'I' ? KICKS_I : KICKS_JLSTZ;
  return table[`${from}>${to}`].map(([x, y]) => [x, -y]);
}

// Zufall mit Startwert (mulberry32): gleiche Zahl, gleiche Folge
export function createRandom(seed) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { next, get state() { return state; }, set state(v) { state = v >>> 0; } };
}

// 7-Bag: jede der sieben Formen genau einmal pro Beutel, in zufälliger Reihenfolge
export function nextBag(random) {
  const bag = TYPES.slice();
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(random.next() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}
