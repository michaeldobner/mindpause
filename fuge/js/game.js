// Spiellogik von FUGE, ohne Darstellung. Die Zeit läuft über step(dt), alle Eingaben sind Methoden.
// Was passiert (Stein erscheint, landet, Reihen verschwinden …), landet als Ereignis in events,
// damit Darstellung und Klang darauf reagieren können.
//
// Brett: 10 Spalten, 22 Reihen. Die oberen 2 Reihen sind unsichtbar, dort erscheinen die Steine.
// Eine Zelle ist 0 (leer) oder ein Code aus Nummer des Steins und Form: nummer × 8 + form + 1.

import { TYPES, cellsOf, kicksFor, spawnX, createRandom, nextBag } from './pieces.js?v=1.0.1';
import { modeById, gravity, scoreLock, LINES_PER_LEVEL, CALM_SECONDS_PER_ROW } from './modes.js?v=1.0.1';

export const WIDTH = 10;
export const HEIGHT = 22;
export const HIDDEN = 2;
export const LOCK_DELAY = 0.5; // Sekunden, die ein Stein auf dem Boden noch bewegt werden kann
export const MAX_RESETS = 15; // so oft verlängert eine Bewegung am Boden die Frist
export const SPAWN_DELAY = 0.05;
export const CLEAR_DELAY = 0.3;
export const CALM_CLEAR_DELAY = 0.9;
export const SOFT_DROP_INTERVAL = 0.04;
export const QUEUE_MIN = 7;

export const encode = (type, id) => id * 8 + TYPES.indexOf(type) + 1;
export const typeOf = (code) => (code ? TYPES[(code % 8) - 1] : null);
export const idOf = (code) => (code ? Math.floor(code / 8) : 0);

const emptyRow = () => new Array(WIDTH).fill(0);

export class Game {
  constructor({ mode = 'classic', seed = 1, startLevel = 1 } = {}) {
    this.mode = modeById(mode) ? mode : 'classic';
    this.seed = seed >>> 0;
    this.startLevel = startLevel;
    this.random = createRandom(this.seed);
    this.board = Array.from({ length: HEIGHT }, emptyRow);
    this.queue = [];
    this.hold = null;
    this.holdUsed = false;
    this.active = null;
    this.score = 0;
    this.lines = 0;
    this.level = startLevel;
    this.combo = -1;
    this.b2b = false;
    this.elapsed = 0;
    this.pieces = 0;
    this.nextId = 1;
    this.state = 'ready'; // ready, playing, over (Kasten voll), done (Ziel erreicht)
    this.tally = { quarts: 0, tspins: 0, maxCombo: 0, perfect: 0, calmClears: 0 };
    this.softDrop = false;
    this.events = [];
    this.resetPieceState();
    this.spawnTimer = 0;
    this.fillQueue();
    this.spawn();
  }

  get rules() {
    return modeById(this.mode);
  }

  resetPieceState() {
    this.fallAcc = 0;
    this.lockTimer = 0;
    this.resets = 0;
    this.lowestY = 0;
    this.lastRotate = false;
    this.lastKick = 0;
    this.grounded = false;
  }

  emit(type, data = {}) {
    this.events.push({ type, ...data });
  }

  drainEvents() {
    const e = this.events;
    this.events = [];
    return e;
  }

  // ---------- Abfragen ----------

  cellsAt(type, rot, x, y) {
    return cellsOf(type, rot).map(([cx, cy]) => [x + cx, y + cy]);
  }

  fits(type, rot, x, y) {
    for (const [cx, cy] of cellsOf(type, rot)) {
      const bx = x + cx;
      const by = y + cy;
      if (bx < 0 || bx >= WIDTH || by >= HEIGHT) return false;
      if (by >= 0 && this.board[by][bx]) return false;
    }
    return true;
  }

  occupied(x, y) {
    return x < 0 || x >= WIDTH || y >= HEIGHT || (y >= 0 && this.board[y][x] !== 0);
  }

  get activeCells() {
    const a = this.active;
    return a ? this.cellsAt(a.type, a.rot, a.x, a.y) : [];
  }

  onGround() {
    const a = this.active;
    return Boolean(a) && !this.fits(a.type, a.rot, a.x, a.y + 1);
  }

  // Wie tief der Stein fallen würde (für den Geisterstein und den harten Fall)
  dropDistance() {
    const a = this.active;
    if (!a) return 0;
    let d = 0;
    while (this.fits(a.type, a.rot, a.x, a.y + d + 1)) d++;
    return d;
  }

  get canControl() {
    return this.state === 'playing' && Boolean(this.active);
  }

  get isOver() {
    return this.state === 'over' || this.state === 'done';
  }

  get secondsPerRow() {
    return this.rules.calm ? CALM_SECONDS_PER_ROW : gravity(this.level);
  }

  get timeLeft() {
    const limit = this.rules.timeLimit;
    return limit ? Math.max(0, limit - this.elapsed) : null;
  }

  get linesLeft() {
    const goal = this.rules.goalLines;
    return goal ? Math.max(0, goal - this.lines) : null;
  }

  // ---------- Ablauf ----------

  start() {
    if (this.state !== 'ready') return false;
    this.state = 'playing';
    this.emit('start');
    return true;
  }

  fillQueue() {
    while (this.queue.length < QUEUE_MIN) this.queue.push(...nextBag(this.random));
  }

  spawn(type = null) {
    const t = type || this.queue.shift();
    this.fillQueue();
    this.active = { type: t, rot: 0, x: spawnX(t, WIDTH), y: 0, id: this.nextId++ };
    this.resetPieceState();
    if (!this.fits(t, 0, this.active.x, 0)) {
      // Kein Platz mehr: im Modus Ruhe kommt der Stein nach dem Leeren wieder
      if (this.rules.topOut === 'clear') this.queue.unshift(t);
      this.active = null;
      this.topOut('block');
      return false;
    }
    // Wie in der Guideline rückt ein neuer Stein sofort eine Reihe nach unten, wenn er kann
    if (this.fits(t, 0, this.active.x, 1)) {
      this.active.y = 1;
      this.lowestY = 1;
    }
    this.emit('spawn', { piece: { ...this.active } });
    return true;
  }

  topOut(reason) {
    if (this.rules.topOut === 'clear') {
      const cells = [];
      this.board.forEach((row, y) => row.forEach((code, x) => code && cells.push({ x, y, code })));
      this.board = Array.from({ length: HEIGHT }, emptyRow);
      this.combo = -1;
      this.b2b = false;
      this.tally.calmClears += 1;
      this.active = null;
      this.spawnTimer = CALM_CLEAR_DELAY;
      this.emit('calmClear', { cells });
      return;
    }
    this.state = 'over';
    this.active = null;
    this.emit('gameOver', { reason });
  }

  finish(reason) {
    if (this.isOver) return;
    this.state = 'done';
    this.active = null;
    this.emit('finish', { reason });
  }

  // Zeit vergeht: Schwerkraft, sanftes Fallen, Frist am Boden, nächster Stein
  step(dt) {
    if (this.state !== 'playing') return;
    this.elapsed += dt;
    const limit = this.rules.timeLimit;
    if (limit && this.elapsed >= limit) {
      this.elapsed = limit;
      this.finish('time');
      return;
    }
    if (!this.active) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) this.spawn();
      return;
    }
    const a = this.active;
    const g = this.secondsPerRow;
    const interval = this.softDrop ? Math.min(g, SOFT_DROP_INTERVAL) : g;
    if (!this.onGround()) {
      this.fallAcc += dt;
      let rows = 0;
      while (this.fallAcc >= interval && rows < HEIGHT) {
        this.fallAcc -= interval;
        if (!this.translate(0, 1)) {
          this.fallAcc = 0;
          break;
        }
        rows++;
        if (this.softDrop) this.score += 1;
      }
      if (rows && this.softDrop) this.emit('softDrop', { rows });
    }
    if (this.onGround()) {
      if (!this.grounded) {
        this.grounded = true;
        this.emit('land', { piece: { ...a } });
      }
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY || (this.resets >= MAX_RESETS && this.lockTimer > 0)) this.lock();
    } else {
      this.grounded = false;
    }
  }

  // Verschiebt den Stein, wenn Platz ist
  translate(dx, dy) {
    const a = this.active;
    if (!a || !this.fits(a.type, a.rot, a.x + dx, a.y + dy)) return false;
    a.x += dx;
    a.y += dy;
    this.lastRotate = false;
    if (dy > 0) {
      this.lockTimer = 0;
      if (a.y > this.lowestY) {
        this.lowestY = a.y;
        this.resets = 0;
      }
    }
    return true;
  }

  // Bewegung am Boden verlängert die Frist, höchstens MAX_RESETS Mal pro Stein
  extendLock(wasGrounded) {
    if (!wasGrounded && !this.onGround()) return;
    if (this.resets < MAX_RESETS) {
      this.resets += 1;
      this.lockTimer = 0;
    }
    if (!this.onGround()) this.grounded = false;
  }

  // ---------- Eingaben ----------

  move(dx) {
    if (!this.canControl) return false;
    const wasGrounded = this.onGround();
    if (!this.translate(dx, 0)) {
      this.emit('blocked', { dx });
      return false;
    }
    this.extendLock(wasGrounded);
    this.emit('move', { dx });
    return true;
  }

  // dir: 1 im Uhrzeigersinn, -1 dagegen. Probiert die Wandsprünge nach SRS der Reihe nach.
  rotate(dir) {
    if (!this.canControl) return false;
    const a = this.active;
    const to = (a.rot + dir + 4) % 4;
    const kicks = kicksFor(a.type, a.rot, to);
    const wasGrounded = this.onGround();
    for (let i = 0; i < kicks.length; i++) {
      const [kx, ky] = kicks[i];
      if (!this.fits(a.type, to, a.x + kx, a.y + ky)) continue;
      const from = a.rot;
      a.rot = to;
      a.x += kx;
      a.y += ky;
      this.lastRotate = true;
      this.lastKick = i;
      if (a.y > this.lowestY) {
        this.lowestY = a.y;
        this.resets = 0;
      }
      this.extendLock(wasGrounded);
      this.emit('rotate', { dir, from, to, kick: [kx, ky] });
      return true;
    }
    this.emit('blocked', { dir });
    return false;
  }

  setSoftDrop(on) {
    this.softDrop = Boolean(on);
  }

  // Ein Schritt nach unten auf Wunsch (Wischen): wie sanftes Fallen, ein Punkt pro Reihe
  dropStep() {
    if (!this.canControl) return false;
    if (!this.translate(0, 1)) return false;
    this.score += 1;
    this.fallAcc = 0;
    this.emit('softDrop', { rows: 1 });
    return true;
  }

  hardDrop() {
    if (!this.canControl) return false;
    const a = this.active;
    const from = { ...a };
    const dist = this.dropDistance();
    if (dist > 0) {
      a.y += dist;
      this.lastRotate = false;
    }
    this.score += 2 * dist;
    this.emit('hardDrop', { dist, from, piece: { ...a } });
    this.lock({ hard: true });
    return true;
  }

  holdPiece() {
    if (!this.canControl || this.holdUsed) return false;
    const prev = this.hold;
    const type = this.active.type;
    this.hold = type;
    this.holdUsed = true;
    this.active = null;
    this.emit('hold', { type, from: prev });
    this.spawn(prev);
    return true;
  }

  // ---------- Ablegen ----------

  tspinKind() {
    const a = this.active;
    if (a.type !== 'T' || !this.lastRotate) return 'none';
    const corners = [[0, 0], [2, 0], [0, 2], [2, 2]].map(([cx, cy]) => this.occupied(a.x + cx, a.y + cy));
    if (corners.filter(Boolean).length < 3) return 'none';
    const front = [[0, 1], [1, 3], [2, 3], [0, 2]][a.rot];
    if (corners[front[0]] && corners[front[1]]) return 'full';
    return this.lastKick === 4 ? 'full' : 'mini';
  }

  lock({ hard = false } = {}) {
    const a = this.active;
    if (!a) return;
    const cells = this.activeCells;
    const tspin = this.tspinKind();

    // Liegt der ganze Stein über dem sichtbaren Kasten, ist das Spiel vorbei
    if (cells.every(([, y]) => y < HIDDEN) || cells.some(([, y]) => y < 0)) {
      this.active = null;
      this.emit('lock', { piece: { ...a }, cells, lines: 0, rows: [], points: 0, hard, tspin: 'none' });
      this.topOut('lock');
      return;
    }

    const code = encode(a.type, a.id);
    for (const [x, y] of cells) this.board[y][x] = code;

    const rows = [];
    for (let y = 0; y < HEIGHT; y++) if (this.board[y].every((c) => c !== 0)) rows.push(y);
    const removed = rows.map((y) => this.board[y].slice());
    if (rows.length) {
      this.board = this.board.filter((_, y) => !rows.includes(y));
      while (this.board.length < HEIGHT) this.board.unshift(emptyRow());
    }
    const perfect = rows.length > 0 && this.board.every((row) => row.every((c) => c === 0));

    const result = scoreLock({ lines: rows.length, tspin, level: this.level, b2b: this.b2b, combo: this.combo, perfect });
    this.score += result.points;
    this.combo = result.combo;
    this.b2b = result.b2b;
    this.lines += rows.length;
    if (rows.length === 4) this.tally.quarts += 1;
    if (tspin !== 'none') this.tally.tspins += 1;
    if (perfect) this.tally.perfect += 1;
    this.tally.maxCombo = Math.max(this.tally.maxCombo, this.combo);
    this.pieces += 1;
    this.holdUsed = false;
    this.active = null;
    this.spawnTimer = rows.length ? CLEAR_DELAY : SPAWN_DELAY;

    this.emit('lock', {
      piece: { ...a },
      cells,
      rows,
      removed,
      lines: rows.length,
      points: result.points,
      tspin,
      combo: this.combo,
      backToBack: result.backToBack,
      perfect,
      hard,
    });

    if (this.rules.levelUp) {
      const level = this.startLevel + Math.floor(this.lines / LINES_PER_LEVEL);
      if (level > this.level) {
        this.level = level;
        this.emit('levelUp', { level });
      }
    }
    const goal = this.rules.goalLines;
    if (goal && this.lines >= goal) this.finish('goal');
  }

  // ---------- Speichern ----------

  serialize() {
    return {
      mode: this.mode,
      seed: this.seed,
      rng: this.random.state,
      startLevel: this.startLevel,
      board: this.board.map((r) => r.slice()),
      queue: this.queue.slice(),
      hold: this.hold,
      holdUsed: this.holdUsed,
      active: this.active ? { ...this.active } : null,
      score: this.score,
      lines: this.lines,
      level: this.level,
      combo: this.combo,
      b2b: this.b2b,
      elapsed: this.elapsed,
      pieces: this.pieces,
      nextId: this.nextId,
      state: this.state,
      tally: { ...this.tally },
    };
  }

  static restore(data) {
    try {
      if (!data || !modeById(data.mode) || !Array.isArray(data.board) || data.board.length !== HEIGHT) return null;
      const g = new Game({ mode: data.mode, seed: data.seed, startLevel: data.startLevel || 1 });
      g.events = [];
      g.random.state = data.rng;
      g.board = data.board.map((r) => {
        if (!Array.isArray(r) || r.length !== WIDTH) throw new Error('row');
        return r.map((c) => (Number.isInteger(c) && c >= 0 ? c : 0));
      });
      g.queue = data.queue.filter((t) => TYPES.includes(t));
      g.fillQueue();
      g.hold = TYPES.includes(data.hold) ? data.hold : null;
      g.holdUsed = Boolean(data.holdUsed);
      const a = data.active;
      g.active = a && TYPES.includes(a.type) && g.fits(a.type, a.rot, a.x, a.y) ? { ...a } : null;
      Object.assign(g, {
        score: data.score | 0,
        lines: data.lines | 0,
        level: data.level || 1,
        combo: data.combo ?? -1,
        b2b: Boolean(data.b2b),
        elapsed: +data.elapsed || 0,
        pieces: data.pieces | 0,
        nextId: data.nextId || 1,
        tally: { ...g.tally, ...(data.tally || {}) },
      });
      g.state = ['ready', 'playing', 'over', 'done'].includes(data.state) ? data.state : 'ready';
      if (!g.active && !g.isOver) g.spawnTimer = 0;
      return g;
    } catch {
      return null;
    }
  }
}
