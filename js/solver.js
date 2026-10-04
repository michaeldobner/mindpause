// Löser für Tipps: Tiefensuche mit Merkliste bereits geprüfter Stellungen.
// Arbeitet nur mit Daten, damit er im Web Worker und in Tests läuft.

const DIRECTIONS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

// Bereitet das Brett einmal vor: alle möglichen Sprünge als Feldindizes
export function prepare(cells) {
  const index = new Map(cells.map((c, i) => [`${c.r},${c.c}`, i]));
  const jumps = [];
  cells.forEach((c, from) => {
    for (const [dr, dc] of DIRECTIONS) {
      const over = index.get(`${c.r + dr},${c.c + dc}`);
      const to = index.get(`${c.r + 2 * dr},${c.c + 2 * dc}`);
      if (over !== undefined && to !== undefined) jumps.push([from, over, to]);
    }
  });
  return { jumps, size: cells.length };
}

// Sucht eine Folge von Sprüngen bis zu einer Murmel auf dem Zielfeld.
// Gibt die Züge als [von, über, nach] zurück, null wenn keine Lösung existiert,
// oder 'timeout', wenn das Zeitbudget nicht reicht.
export function solve(prepared, occupied, goal, budgetMs = 5000) {
  const board = occupied.map(Boolean);
  const { jumps } = prepared;
  const dead = new Set();
  const path = [];
  const deadline = Date.now() + budgetMs;
  let count = board.filter(Boolean).length;
  let steps = 0;
  let timedOut = false;

  const key = () => {
    let k = '';
    for (let i = 0; i < board.length; i++) k += board[i] ? '1' : '0';
    return k;
  };

  const rec = () => {
    if (count === 1) return board[goal];
    if ((++steps & 1023) === 0 && Date.now() > deadline) {
      timedOut = true;
      return false;
    }
    const k = key();
    if (dead.has(k)) return false;
    for (const j of jumps) {
      const [from, over, to] = j;
      if (!board[from] || !board[over] || board[to]) continue;
      board[from] = false;
      board[over] = false;
      board[to] = true;
      count--;
      path.push(j);
      if (rec()) return true;
      path.pop();
      count++;
      board[from] = true;
      board[over] = true;
      board[to] = false;
      if (timedOut) return false;
    }
    dead.add(k);
    return false;
  };

  if (rec()) return path.slice();
  return timedOut ? 'timeout' : null;
}
