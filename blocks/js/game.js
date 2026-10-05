// Spiellogik von BLOCKS, ohne DOM.
//
// Ein quadratisches Brett, darunter ein Tablett mit drei Steinen. Jeder Stein wird einmal
// gelegt, sind alle drei gelegt, kommen drei neue. Volle Reihen und Spalten verschwinden
// gleichzeitig. Passt keiner der übrigen Steine mehr, ist das Spiel vorbei (im Modus Ruhe
// räumt sich das Brett stattdessen auf).
//
// Die Darstellung liest den Zustand und holt sich mit drainEvents() ab, was passiert ist.

import { SHAPES, FAMILY_IDS, shapeOf, createRandom, pickShape } from './shapes.js?v=1.1.1';
import { modeById, MODES, STREAK_KEEP, scorePlace } from './modes.js?v=1.1.1';
import { levelDef, LEVEL_COUNT } from './levels.js?v=1.1.1';

export const TRAY = 3;

// Code einer Zelle: 0 leer, sonst Nummer der Familie + 1
export const codeOf = (key) => FAMILY_IDS.indexOf(shapeOf(key).family) + 1;
export const familyOfCode = (code) => FAMILY_IDS[code - 1];

const emptyBoard = (n) => Array.from({ length: n }, () => new Array(n).fill(0));

// Zufällig belegtes Brett: jedes Feld mit Wahrscheinlichkeit density. Volle Reihen und Spalten
// bekommen danach an einer zufälligen Stelle eine Lücke, damit nichts sofort verschwindet.
export function scatter(n, density, rng) {
  const board = emptyBoard(n);
  if (!density) return board;
  const code = FAMILY_IDS.indexOf('dot') + 1;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (rng.next() < density) board[y][x] = code;
  for (;;) {
    const { rows, cols } = fullLines(board);
    if (rows.length) board[rows[0]][Math.floor(rng.next() * n)] = 0;
    else if (cols.length) board[Math.floor(rng.next() * n)][cols[0]] = 0;
    else return board;
  }
}

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
  // mode: ein freier Modus oder 'level' mit level (1 bis 30).
  // custom: eigene Beschreibung eines Levels, nur für tools/levels.mjs
  constructor({ mode = 'classic', seed = 1, level = 1, custom = null } = {}) {
    if (mode === 'level') {
      this.mode = 'level';
      this.level = Math.min(LEVEL_COUNT, Math.max(1, Math.floor(level) || 1));
      this.custom = custom;
      seed = this.def.seed;
    } else {
      this.mode = modeById(mode) ? mode : MODES[0].id;
      this.level = 0;
      this.custom = null;
    }
    this.size = this.def.size;
    this.board = emptyBoard(this.size);
    this.pre = null; // Startsteine eines Levels, die noch liegen
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
    this.setup();
  }

  get def() {
    if (this.mode === 'level') return this.custom || levelDef(this.level);
    return modeById(this.mode);
  }

  // Vorbei: verloren (over) oder Level geschafft (won)
  get isOver() {
    return this.state !== 'playing';
  }

  // Wie viele Startsteine noch liegen
  get preLeft() {
    return this.pre ? this.pre.flat().filter(Boolean).length : 0;
  }

  // Ziel des Levels erreicht: alle Startsteine weg und genug Punkte
  get levelDone() {
    return this.mode === 'level' && this.preLeft === 0 && this.score >= this.def.target;
  }

  drainEvents() {
    const out = this.events;
    this.events = [];
    return out;
  }

  // ---------- Tablett ----------

  // Drei neue Steine. Je nach Modus wird so oft neu gezogen, bis die Bedingung stimmt.
  refill() {
    this.tray = this.draw(this.def.fair).tray;
    this.events.push({ type: 'refill', tray: this.tray.slice() });
  }

  // Bis zu 40 Ziehungen. Liefert die erste, die die Regel erfüllt (ok), sonst die beste andere.
  draw(fair) {
    let first = null; // erste Ziehung überhaupt
    let oneFits = null; // erste Ziehung, in der wenigstens ein Stein passt
    for (let attempt = 0; attempt < 40; attempt++) {
      const fam = this.def.families;
      const trio = [pickShape(this.rng, fam), pickShape(this.rng, fam), pickShape(this.rng, fam)];
      first = first || trio;
      if (fair === 'none') return { tray: trio, ok: true };
      const some = trio.some((k) => fitsAnywhere(this.board, k));
      if (some) oneFits = oneFits || trio;
      if (fair === 'one' && some) return { tray: trio, ok: true };
      if (fair === 'all' && some && canPlaceAll(this.board, trio)) return { tray: trio, ok: true };
    }
    return { tray: oneFits || first, ok: false };
  }

  // Startbild wie bei einem neuen Level: ein Teil des Bretts ist schon belegt, keine Linie ist voll,
  // und die ersten drei Steine passen in jedem Modus sicher in irgendeiner Reihenfolge.
  // Gelingt das nicht, beginnt das Spiel auf leerem Brett, dort passen drei Steine immer.
  setup() {
    if (this.def.board) {
      // Level: festes Startbrett, die Startsteine sind schwarze Keramik
      const code = FAMILY_IDS.indexOf('dot') + 1;
      this.board = this.def.board.map((row) => [...row].map((ch) => (ch === '#' ? code : 0)));
      this.pre = this.board.map((r) => r.map(Boolean));
      let tray = this.draw('all');
      while (!tray.ok && !canPlaceAll(this.board, tray.tray, { n: 1e6 })) tray = this.draw('all');
      this.tray = tray.tray;
      this.events.push({ type: 'refill', tray: this.tray.slice() });
      return;
    }
    for (let attempt = 0; attempt < 30; attempt++) {
      this.board = scatter(this.size, this.def.start, this.rng);
      const { tray, ok } = this.draw('all');
      if (ok) {
        this.tray = tray;
        this.events.push({ type: 'refill', tray: tray.slice() });
        return;
      }
    }
    this.board = emptyBoard(this.size);
    let tray = this.draw('all').tray;
    while (!canPlaceAll(this.board, tray, { n: 1e6 })) tray = this.draw('all').tray;
    this.tray = tray;
    this.events.push({ type: 'refill', tray: tray.slice() });
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
        if (rows.includes(yy) || cols.includes(xx)) cleared.push({ x: xx, y: yy, code: placed[yy][xx], pre: Boolean(this.pre?.[yy][xx]) });
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
    if (this.pre) {
      for (const r of rows) this.pre[r].fill(false);
      for (const c of cols) for (let yy = 0; yy < this.size; yy++) this.pre[yy][c] = false;
    }
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

    if (this.levelDone) {
      this.state = 'won';
      this.events.push({ type: 'levelDone', level: this.level });
      return { points, lines, rows, cols, perfect, streak: this.streak };
    }
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
    for (const k of ['board', 'pre', 'rng', 'tray', 'score', 'moves', 'lines', 'streak', 'idle', 'tally', 'state']) this[k] = g[k];
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
        // Im Level zählen abgeräumte Startsteine extra
        if (this.pre) v += preCleared(this.pre, rows, cols) * 25;
        // Danach müssen die übrigen Steine noch alle passen, sonst verbaut der Tipp das Tablett
        if (rest.length && !rest.some((k) => fitsAnywhere(board, k))) v -= 2000;
        else if (rest.length > 1 && !canPlaceAll(board, rest, { n: 1500 })) v -= 1000;
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
      level: this.level,
      board: this.board.map((r) => r.slice()),
      pre: this.pre ? this.pre.map((r) => r.map((v) => (v ? 1 : 0))) : null,
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
      if (!data || data.v !== 1) return null;
      const g = Object.create(Game.prototype);
      g.mode = data.mode;
      g.custom = null;
      g.level = data.mode === 'level' ? Number(data.level) : 0;
      if (data.mode === 'level' ? !levelDef(g.level) : !modeById(data.mode)) return null;
      g.size = g.def.size;
      if (!Array.isArray(data.board) || data.board.length !== g.size || data.board.some((r) => r.length !== g.size)) return null;
      if (!Array.isArray(data.tray) || data.tray.length !== TRAY || data.tray.some((k) => k && !SHAPES[k])) return null;
      g.board = data.board.map((r) => r.map((c) => (Number.isInteger(c) && c > 0 && c <= FAMILY_IDS.length ? c : 0)));
      g.tray = data.tray.map((k) => k || null);
      g.pre = g.mode === 'level' && Array.isArray(data.pre) && data.pre.length === g.size
        ? data.pre.map((r, y) => r.map((v, x) => Boolean(v) && Boolean(g.board[y][x])))
        : g.mode === 'level' ? g.board.map((r) => r.map(() => false)) : null;
      g.rng = createRandom(0);
      g.rng.state = data.rng >>> 0;
      g.score = Number(data.score) || 0;
      g.moves = Number(data.moves) || 0;
      g.lines = Number(data.lines) || 0;
      g.streak = Number(data.streak) || 0;
      g.idle = Number(data.idle) || 0;
      g.tally = { bestStreak: 0, perfect: 0, calmClears: 0, ...data.tally };
      g.state = ['over', 'won'].includes(data.state) ? data.state : 'playing';
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

// Startsteine in den Linien, die verschwinden
function preCleared(pre, rows, cols) {
  let n = 0;
  pre.forEach((r, y) => r.forEach((v, x) => {
    if (v && (rows.includes(y) || cols.includes(x))) n += 1;
  }));
  return n;
}
