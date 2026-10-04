// Regeln der Mühle (Neun Männer Mühle) nach den Turnierregeln des Weltmühlespiel-Dachverbands.
// Ohne Darstellung, läuft auch in Node.js.
//
// Das Brett hat 24 Punkte auf drei ineinanderliegenden Quadraten (Ringen). Punkt = Ring · 8 + k,
// Ring 0 außen, Ring 2 innen. k läuft im Uhrzeigersinn ab der Ecke oben links:
//
//   0 ───────── 1 ───────── 2        Ecken haben gerade k, Mitten ungerade k.
//   │   8 ───── 9 ───── 10  │        Nur die Mitten sind mit dem Nachbarring verbunden.
//   │   │  16 ─ 17 ─ 18  │  │
//   7 ─ 15 ─ 23     19 ─ 11 ─ 3
//   │   │  22 ─ 21 ─ 20  │  │
//   │  14 ───── 13 ───── 12  │
//   6 ───────── 5 ───────── 4

export const WHITE = 1; // beginnt, spielt von unten
export const BLACK = -1;
export const STONES = 9; // Steine je Seite
export const POINTS = 24;
export const DRAW_PLIES = 40; // 20 Züge je Seite ohne Mühle in der Zug- und Sprungphase: Remis

// Lage der Punkte im 7 × 7 Raster, [Spalte, Zeile]
const RING_OFFSETS = [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [1, 2], [0, 2], [0, 1]];
export const GRID = [];
for (let r = 0; r < 3; r++) {
  const span = 3 - r;
  for (const [x, y] of RING_OFFSETS) GRID.push([r + x * span, r + y * span]);
}

// Nachbarn jedes Punkts entlang der Linien
export const ADJACENT = [];
for (let i = 0; i < POINTS; i++) {
  const r = i >> 3;
  const k = i & 7;
  const list = [r * 8 + ((k + 7) & 7), r * 8 + ((k + 1) & 7)];
  if (k % 2 === 1) {
    if (r > 0) list.push(i - 8);
    if (r < 2) list.push(i + 8);
  }
  ADJACENT.push(list);
}

// Alle 16 Mühlen: je Ring vier Seiten, dazu die vier Querlinien durch die Mitten
export const MILLS = [];
for (let r = 0; r < 3; r++) {
  for (const k of [0, 2, 4, 6]) MILLS.push([r * 8 + k, r * 8 + k + 1, r * 8 + ((k + 2) & 7)]);
}
for (const k of [1, 3, 5, 7]) MILLS.push([k, 8 + k, 16 + k]);

// Für jeden Punkt die beiden Mühlen, zu denen er gehört
export const MILLS_AT = Array.from({ length: POINTS }, () => []);
for (const m of MILLS) for (const p of m) MILLS_AT[p].push(m);

// Ein Zustand: { board, hand, turn }. board: 24 Zahlen (0, WHITE, BLACK),
// hand: Steine im Vorrat { [WHITE]: n, [BLACK]: n }, turn: Seite am Zug.
export function initialState() {
  return { board: new Array(POINTS).fill(0), hand: { [WHITE]: STONES, [BLACK]: STONES }, turn: WHITE };
}

export function countOnBoard(board, side) {
  let n = 0;
  for (let i = 0; i < POINTS; i++) if (board[i] === side) n++;
  return n;
}

// Steine einer Seite insgesamt: auf dem Brett und im Vorrat
export function material(state, side) {
  return countOnBoard(state.board, side) + state.hand[side];
}

// Phase einer Seite: 'place' (Setzen), 'move' (Ziehen) oder 'fly' (Springen mit drei Steinen)
export function phaseOf(state, side) {
  if (state.hand[side] > 0) return 'place';
  return countOnBoard(state.board, side) === 3 ? 'fly' : 'move';
}

// Steht der Stein auf p in einer geschlossenen Mühle?
export function inMill(board, p) {
  const side = board[p];
  if (side === 0) return false;
  return MILLS_AT[p].some((m) => board[m[0]] === side && board[m[1]] === side && board[m[2]] === side);
}

// Mühlen, die ein Stein der Seite side auf p schließt
export function millsAt(board, p, side) {
  return MILLS_AT[p].filter((m) => m.every((q) => q === p || board[q] === side));
}

// Steine der Gegenseite, die genommen werden dürfen: nie aus einer Mühle, außer alle stehen in Mühlen
export function removable(board, opponent) {
  const all = [];
  const free = [];
  for (let i = 0; i < POINTS; i++) {
    if (board[i] !== opponent) continue;
    all.push(i);
    if (!inMill(board, i)) free.push(i);
  }
  return free.length ? free : all;
}

// Alle erlaubten Züge. Ein Zug ist { from, to, remove }: from = -1 beim Setzen,
// remove = Punkt des genommenen Steins oder -1. Schließt ein Zug eine Mühle, gibt es ihn
// einmal je erlaubtem Stein zum Nehmen. Auch zwei Mühlen auf einmal nehmen nur einen Stein.
export function legalMoves(state, side = state.turn) {
  const { board } = state;
  const phase = phaseOf(state, side);
  const steps = [];
  if (phase === 'place') {
    for (let i = 0; i < POINTS; i++) if (board[i] === 0) steps.push([-1, i]);
  } else {
    const empty = [];
    for (let i = 0; i < POINTS; i++) if (board[i] === 0) empty.push(i);
    for (let i = 0; i < POINTS; i++) {
      if (board[i] !== side) continue;
      const targets = phase === 'fly' ? empty : ADJACENT[i].filter((j) => board[j] === 0);
      for (const j of targets) steps.push([i, j]);
    }
  }
  const moves = [];
  for (const [from, to] of steps) {
    const after = board.slice();
    if (from >= 0) after[from] = 0;
    after[to] = side;
    if (millsAt(after, to, side).length > 0) {
      for (const r of removable(after, -side)) moves.push({ from, to, remove: r });
    } else {
      moves.push({ from, to, remove: -1 });
    }
  }
  return moves;
}

// Neuer Zustand nach dem Zug, der alte bleibt unverändert
export function applyMove(state, move) {
  const board = state.board.slice();
  const side = state.turn;
  const hand = { ...state.hand };
  if (move.from >= 0) board[move.from] = 0;
  else hand[side] -= 1;
  board[move.to] = side;
  if (move.remove >= 0) board[move.remove] = 0;
  return { board, hand, turn: -side };
}

// Ergebnis für die Seite am Zug: verloren mit weniger als drei Steinen oder ohne Zug
export function lossReason(state, moves = legalMoves(state)) {
  if (material(state, state.turn) < 3) return 'few';
  if (moves.length === 0) return 'blocked';
  return null;
}

// Schlüssel einer Stellung für die Wiederholungsregel
export function positionKey(state) {
  return `${state.board.map((v) => (v === 1 ? 'w' : v === -1 ? 'b' : '.')).join('')}${state.hand[WHITE]},${state.hand[BLACK]}${state.turn === WHITE ? 'W' : 'B'}`;
}

// Bezeichnung eines Punkts in der üblichen Notation: Spalte a bis g, Zeile 1 bis 7 von unten
export function pointName(p) {
  const [x, y] = GRID[p];
  return `${'abcdefg'[x]}${7 - y}`;
}

export function pointAt(name) {
  return GRID.findIndex((_, p) => pointName(p) === name);
}
