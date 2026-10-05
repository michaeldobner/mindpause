// Spiellogik von BLOCKS, ohne DOM.
//
// Ein quadratisches Brett, darunter ein Tablett mit drei Steinen. Jeder Stein wird einmal
// gelegt, sind alle drei gelegt, kommen drei neue. Volle Reihen und Spalten verschwinden
// gleichzeitig. Passt keiner der übrigen Steine mehr, ist das Spiel vorbei (im Modus Ruhe
// räumt sich das Brett stattdessen auf).
//
// Die Darstellung liest den Zustand und holt sich mit drainEvents() ab, was passiert ist.

import { SHAPES, FAMILY_IDS, shapeOf, createRandom, pickShape } from './shapes.js?v=1.0.0';
import { modeById, MODES, STREAK_KEEP, scorePlace } from './modes.js?v=1.0.0';

export const TRAY = 3;

// Code einer Zelle: 0 leer, sonst Nummer der Familie + 1
export const codeOf = (key) => FAMILY_IDS.indexOf(shapeOf(key).family) + 1;
export const familyOfCode = (code) => FAMILY_IDS[code - 1];

const emptyBoard = (n) => Array.from({ length: n }, () => new Array(n).fill(0));

// ---------- Brett, unabhängig vom Spiel (auch für die Suche) ----------

export function canPlace(board, key, x, y) {
  const s = shapeOf(key);
  const n = board.length;
  if (!s || x < 0 || y < 0 || x + s.w > n || y + s.h > n) return false;
  return s.cells.every(([cx, cy]) => !board[y + cy][x + cx]);
}

export function placements(board, key) {
  const s = shapeOf(key);
  const n = board.length;
  const out = [];
  for (let y = 0; y + s.h <= n; y++) {
    for (let x = 0; x + s.w <= n; x++) if (canPlace(board, key, x, y)) out.push([x, y]);
  }
  return out;
}

export function fitsAnywhere(board, key) {
  const s = shapeOf(key);
  const n = board.length;
  for (let y = 0; y + s.h <= n; y++) {
    for (let x = 0; x + s.w <= n; x++) if (canPlace(board, key, x, y)) return true;
  }
  return false;
}

// Volle Reihen und Spalten eines Bretts
export function fullLines(board) {
  const n = board.length;
  const rows = [];
  const cols = [];
  for (let i = 0; i < n; i++) {
    if (board[i].every(Boolean)) rows.push(i);
    let full = true;
    for (let y = 0; y < n && full; y++) if (!board[y][i]) full = false;
    if (full) cols.push(i);
  }
  return { rows, cols };
}

// Stein auf eine Kopie legen und volle Linien entfernen. Liefert das neue Brett und die Linien.
export function applyPlace(board, key, x, y) {
  const next = board.map((r) => r.slice());
  const code = codeOf(key);
  for (const [cx, cy] of shapeOf(key).cells) next[y + cy][x + cx] = code;
  const { rows, cols } = fullLines(next);
  for (const r of rows) next[r].fill(0);
  for (const c of cols) for (let yy = 0; yy < next.length; yy++) next[yy][c] = 0;
  return { board: next, rows, cols };
}

// Lassen sich alle Steine in irgendeiner Reihenfolge legen? Tiefensuche mit Grenze:
// Wird die Grenze erreicht, gilt die Antwort als nein (lieber neu ziehen).
export function canPlaceAll(board, keys, budget = { n: 6000 }) {
  if (!keys.length) return true;
  const tried = new Set();
  for (let i = 0; i < keys.length; i++) {
    if (tried.has(keys[i])) continue;
    tried.add(keys[i]);
    const rest = keys.slice(0, i).concat(keys.slice(i + 1));
    for (const [x, y] of placements(board, keys[i])) {
      if (--budget.n < 0) return false;
      if (canPlaceAll(applyPlace(board, keys[i], x, y).board, rest, budget)) return true;
    }
  }
  return false;
}

// ---------- Spiel ----------

export class Game {
  constructor({ mode = 'classic', seed = 1 } = {}) {
    this.mode = modeById(mode) ? mode : MODES[0].id;
    this.size = this.def.size;
    this.board = emptyBoard(this.size);
    this.rng = createRandom(seed);
    this.tray = new Array(TRAY).fill(null);
    this.score = 0;
    this.moves = 0;
    this.lines = 0;
    this.streak = 0;
    this.idle = 0; // Steine seit dem letzten Abräumen
    this.tally = { bestStreak: 0, perfect: 0, calmClears: 0 };
    this.state = 'playing';
    this.undoSnap = null;
    this.events = [];
    this.refill();
  }

  get def() {
    return modeById(this.mode);
  }

  get isOver() {
    return this.state === 'over';
  }

  drainEvents() {
    const out = this.events;
    this.events = [];
    return out;
  }

  // ---------- Tablett ----------

  // Drei neue Steine. Je nach Modus wird so oft neu gezogen, bis die Bedingung stimmt.
  refill() {
    const fair = this.def.fair;
    let chosen = null;
    let first = null; // erster Zug überhaupt
    let oneFits = null; // erster Zug, in dem wenigstens ein Stein passt
    for (let attempt = 0; attempt < 40 && !chosen; attempt++) {
      const trio = [pickShape(this.rng), pickShape(this.rng), pickShape(this.rng)];
      first = first || trio;
      if (fair === 'none') {
        chosen = trio;
        break;
      }
      const some = trio.some((k) => fitsAnywhere(this.board, k));
      if (some) oneFits = oneFits || trio;
      if (fair === 'one' && some) chosen = trio;
      else if (fair === 'all' && some && canPlaceAll(this.board, trio)) chosen = trio;
    }
    this.tray = chosen || oneFits || first;
    this.events.push({ type: 'refill', tray: this.tray.slice() });
  }

  // Passt der Stein in diesem Fach noch irgendwo hin?
  fits(slot) {
    const key = this.tray[slot];
    return Boolean(key) && fitsAnywhere(this.board, key);
  }

  canPlace(slot, x, y) {
    const key = this.tray[slot];
    return this.state === 'playing' && Boolean(key) && canPlace(this.board, key, x, y);
  }

  // Was beim Legen verschwinden würde, für die Vorschau beim Ziehen
  preview(slot, x, y) {
    if (!this.canPlace(slot, x, y)) return null;
    const { rows, cols } = applyPlace(this.board, this.tray[slot], x, y);
    return { rows, cols };
  }

  // ---------- Legen ----------

  place(slot, x, y) {
    if (!this.canPlace(slot, x, y)) return null;
    const key = this.tray[slot];
    const shape = shapeOf(key);
    this.undoSnap = this.serialize();

    const before = this.board;
    const { board, rows, cols } = applyPlace(before, key, x, y);
    const code = codeOf(key);
    const cells = shape.cells.map(([cx, cy]) => [x + cx, y + cy]);
    // Zellen, die verschwinden, mit ihrem Code (für die Darstellung)
    const placed = before.map((r) => r.slice());
    for (const [cx, cy] of cells) placed[cy][cx] = code;
    const cleared = [];
    for (let yy = 0; yy < this.size; yy++) {
      for (let xx = 0; xx < this.size; xx++) {
        if (rows.includes(yy) || cols.includes(xx)) cleared.push({ x: xx, y: yy, code: placed[yy][xx] });
      }
    }

    const lines = rows.length + cols.length;
    if (lines > 0) {
      this.streak += 1;
      this.idle = 0;
    } else {
      this.idle += 1;
      if (this.idle >= STREAK_KEEP) this.streak = 0;
    }
    const perfect = lines > 0 && board.every((r) => r.every((c) => !c));
    const points = scorePlace({ cells: cells.length, lines, streak: this.streak, perfect });

    this.board = board;
    this.tray[slot] = null;
    this.score += points;
    this.moves += 1;
    this.lines += lines;
    if (perfect) this.tally.perfect += 1;
    this.tally.bestStreak = Math.max(this.tally.bestStreak, this.streak);

    this.events.push({ type: 'place', slot, key, code, x, y, cells });
    if (lines) {
      this.events.push({ type: 'clear', rows, cols, cells: cleared, lines, streak: this.streak, points, perfect, at: [x + shape.w / 2, y + shape.h / 2] });
    }
    this.events.push({ type: 'score', points, at: [x + shape.w / 2, y + shape.h / 2] });

    if (this.tray.every((k) => !k)) this.refill();
    this.checkStuck();
    return { points, lines, rows, cols, perfect, streak: this.streak };
  }

  // Passt kein Stein mehr? Ende, oder im Modus Ruhe: das Brett räumt sich auf.
  checkStuck() {
    const left = this.tray.filter(Boolean);
    if (!left.length || left.some((k) => fitsAnywhere(this.board, k))) return;
    if (this.def.calm) {
      const cells = [];
      this.board.forEach((r, y) => r.forEach((code, x) => code && cells.push({ x, y, code })));
      this.board = emptyBoard(this.size);
      this.streak = 0;
      this.idle = 0;
      this.tally.calmClears += 1;
      this.events.push({ type: 'calmClear', cells });
      return;
    }
    this.state = 'over';
    this.events.push({ type: 'gameOver' });
  }

  // ---------- Zurück und Tipp ----------

  get canUndo() {
    return Boolean(this.undoSnap);
  }

  // Den letzten gelegten Stein zurücknehmen, auch nach dem Ende. Ein Schritt.
  undo() {
    if (!this.undoSnap) return false;
    const g = Game.restore(this.undoSnap);
    if (!g) return false;
    for (const k of ['board', 'rng', 'tray', 'score', 'moves', 'lines', 'streak', 'idle', 'tally', 'state']) this[k] = g[k];
    this.undoSnap = null;
    this.events.push({ type: 'undo' });
    return true;
  }

  // Guter Platz für einen Stein: viele Linien, wenig Lücken, und die übrigen Steine passen noch
  hint() {
    if (this.state !== 'playing') return null;
    let best = null;
    this.tray.forEach((key, slot) => {
      if (!key) return;
      const rest = this.tray.filter((k, i) => k && i !== slot);
      for (const [x, y] of placements(this.board, key)) {
        const { board, rows, cols } = applyPlace(this.board, key, x, y);
        let v = (rows.length + cols.length) * 100 + contact(this.board, key, x, y) * 3 - holes(board) * 12;
        if (rest.length && !rest.some((k) => fitsAnywhere(board, k))) v -= 1000;
        // Bei Gleichstand gewinnt die Stelle oben links, damit der Tipp ruhig bleibt
        if (!best || v > best.v) best = { slot, x, y, v };
      }
    });
    return best && { slot: best.slot, x: best.x, y: best.y };
  }

  // ---------- Speichern ----------

  serialize() {
    return {
      v: 1,
      mode: this.mode,
      board: this.board.map((r) => r.slice()),
      tray: this.tray.slice(),
      rng: this.rng.state,
      score: this.score,
      moves: this.moves,
      lines: this.lines,
      streak: this.streak,
      idle: this.idle,
      tally: { ...this.tally },
      state: this.state,
    };
  }

  static restore(data) {
    try {
      if (!data || data.v !== 1 || !modeById(data.mode)) return null;
      const g = Object.create(Game.prototype);
      g.mode = data.mode;
      g.size = modeById(data.mode).size;
      if (!Array.isArray(data.board) || data.board.length !== g.size || data.board.some((r) => r.length !== g.size)) return null;
      if (!Array.isArray(data.tray) || data.tray.length !== TRAY || data.tray.some((k) => k && !SHAPES[k])) return null;
      g.board = data.board.map((r) => r.map((c) => (Number.isInteger(c) && c > 0 && c <= FAMILY_IDS.length ? c : 0)));
      g.tray = data.tray.map((k) => k || null);
      g.rng = createRandom(0);
      g.rng.state = data.rng >>> 0;
      g.score = Number(data.score) || 0;
      g.moves = Number(data.moves) || 0;
      g.lines = Number(data.lines) || 0;
      g.streak = Number(data.streak) || 0;
      g.idle = Number(data.idle) || 0;
      g.tally = { bestStreak: 0, perfect: 0, calmClears: 0, ...data.tally };
      g.state = data.state === 'over' ? 'over' : 'playing';
      g.undoSnap = null;
      g.events = [];
      if (g.tray.every((k) => !k)) g.refill();
      return g;
    } catch {
      return null;
    }
  }
}

// Wie viele Kanten des Steins an Rand oder liegende Steine stoßen
function contact(board, key, x, y) {
  const n = board.length;
  const s = shapeOf(key);
  const own = new Set(s.cells.map(([cx, cy]) => `${x + cx},${y + cy}`));
  let c = 0;
  for (const [cx, cy] of s.cells) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const xx = x + cx + dx;
      const yy = y + cy + dy;
      if (own.has(`${xx},${yy}`)) continue;
      if (xx < 0 || yy < 0 || xx >= n || yy >= n || board[yy][xx]) c += 1;
    }
  }
  return c;
}

// Einzelne leere Felder, die rundum eingeschlossen sind
function holes(board) {
  const n = board.length;
  let h = 0;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (board[y][x]) continue;
      const closed = [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => {
        const xx = x + dx;
        const yy = y + dy;
        return xx < 0 || yy < 0 || xx >= n || yy >= n || board[yy][xx];
      });
      if (closed) h += 1;
    }
  }
  return h;
}
