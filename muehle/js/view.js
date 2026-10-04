// Darstellung von MÜHLE als SVG: Brett mit drei Quadraten aus Goldlinien, 24 Punkte, gedrechselte
// Steine, zwei Schalen für Vorrat und genommene Steine, Animationen und Touch-Bedienung.
//
// Alles wird im "Brettraum" gezeichnet (Hochformat, Weiß unten, 1000 × 1280 Einheiten), wie bei
// QUEEN. Im Querformat dreht eine Transformation das Brett um 90°, die Schalen liegen dann links und
// rechts. Beim Spiel zu zweit kann sich das Brett zusätzlich nach jedem Zug um 180° drehen.
//
// Jede Seite hat eine Schale. Darin liegen ihre noch nicht gesetzten Steine und die Steine, die sie
// der Gegenseite genommen hat. Pro Zug verliert der Vorrat einen Stein und gewinnt höchstens einen
// genommenen, eine Schale hält deshalb nie mehr als neun Steine.

import { Gutter } from '../../shared/js/gutter.js?shell=1.4.0';
import { WHITE, BLACK, GRID, ADJACENT, POINTS, millsAt } from './rules.js?v=1.0.0';
import { Game } from './game.js?v=1.0.0';
import { THEMES, DEFAULT_THEME, millWheel } from './themes.js?v=1.0.0';

const NS = 'http://www.w3.org/2000/svg';
const W = 1000;
const H = 1280;
const CX = W / 2;

const BOARD_X = 40;
const BOARD_Y = 180;
const BOARD = 920;
const MARGIN = 70; // vom Rand des Felds bis zur äußeren Linie
const STEP = 130; // Abstand der Rasterlinien, 6 × 130 = 780
const PIECE_R = 50;
const TRAY_R = 38; // Steine in der Schale sind etwas kleiner
const TRAY_HALF = 440; // halbe nutzbare Länge einer Schale
const TRAY_Y = { [WHITE]: 1192, [BLACK]: 88 }; // Weiß hat seine Schale unten, Schwarz oben
const VIRTUAL_R = 10000; // Schalen sind gerade, die Physik rechnet auf einem sehr großen Kreis
const HIT_R = 64; // Tippfläche um einen Punkt

const LIFT = 0.1;
const TAP_SLOP = 10;

export class MuehleView {
  constructor(svg, events = {}, theme = DEFAULT_THEME) {
    this.svg = svg;
    this.events = events;
    this.game = null;
    this.selected = -1;
    this.hintMove = null;
    this.pending = null; // Mühle geschlossen, es wird noch ein Stein zum Nehmen gewählt
    this.busy = false;
    this.drag = null;
    this.trayTouch = null;
    this.pieces = []; // 18 Steine, Index = Nummer
    this.loopRunning = false;
    this.flip = false;
    this.chain = Promise.resolve();

    const tray = (center) => new Gutter({
      radius: VIRTUAL_R,
      marbleRadius: TRAY_R,
      arc: { center, half: TRAY_HALF / VIRTUAL_R },
      speedScale: 446 / VIRTUAL_R,
      onCollide: (i) => this.emit('clack', i),
    });
    this.trays = { [WHITE]: tray(Math.PI / 2), [BLACK]: tray(-Math.PI / 2) };

    this.build();
    this.setTheme(theme);
    this.bindInput();
    this.orient();
    window.addEventListener('resize', () => this.orient());
  }

  emit(name, ...args) {
    const fn = this.events[name];
    if (!fn) return;
    try {
      fn(...args);
    } catch (err) {
      console.error(err);
    }
  }

  // Aktionen nacheinander ausführen, nie gleichzeitig
  run(action) {
    const next = this.chain.then(async () => {
      this.busy = true;
      try {
        return await action();
      } finally {
        this.busy = false;
      }
    });
    this.chain = next.catch((err) => console.error(err));
    return next;
  }

  // ---------- Geometrie ----------

  pointPos(i) {
    const [x, y] = GRID[i];
    return { x: BOARD_X + MARGIN + x * STEP, y: BOARD_Y + MARGIN + y * STEP };
  }

  // Schale, in die ein Stein gehört, solange er nicht auf dem Brett steht:
  // im Vorrat die eigene, genommen die der Gegenseite
  trayFor(game, id) {
    const color = Game.colorOf(id);
    return game.reserve[color].includes(id) ? color : -color;
  }

  trayPos(side, angle) {
    const tray = this.trays[side];
    const u = tray.local(angle);
    const dir = side === WHITE ? -1 : 1;
    return { x: CX + dir * u * VIRTUAL_R, y: TRAY_Y[side] };
  }

  trayAngle(side, x) {
    const tray = this.trays[side];
    const dir = side === WHITE ? -1 : 1;
    return tray.arc.center + ((x - CX) / VIRTUAL_R) * dir;
  }

  // ---------- Aufbau ----------

  build() {
    const frame = (inset) => `x="${BOARD_X - inset}" y="${BOARD_Y - inset}" width="${BOARD + 2 * inset}" height="${BOARD + 2 * inset}"`;
    const trayBed = (side) => `x="44" y="${TRAY_Y[side] - 50}" width="${W - 88}" height="100" rx="50"`;
    this.svg.innerHTML = `
      <defs class="theme-defs"></defs>
      <g class="world">
        <rect x="6" y="18" width="${W - 12}" height="${H - 12}" rx="70" fill="#000" opacity="0.16"/>
        <rect x="0" y="0" width="${W}" height="${H}" rx="70" fill="url(#m-plate)"/>
        <rect x="0" y="0" width="${W}" height="${H}" rx="70" fill="url(#m-grain)"/>
        ${[BLACK, WHITE].map((side) => `
        <rect class="tray-bed" ${trayBed(side)} fill="url(#m-tray)"/>
        <rect ${trayBed(side)} fill="url(#m-lattice)"/>
        <rect ${trayBed(side)} fill="none" stroke="url(#m-tray-edge)" stroke-width="2"/>`).join('')}
        <rect ${frame(8)} rx="18" fill="url(#m-frame)" stroke="url(#m-frame-line)" stroke-width="3"/>
        <rect ${frame(0)} rx="10" fill="url(#m-field)"/>
        <rect ${frame(0)} rx="10" fill="url(#m-field-grain)" pointer-events="none"/>
        <rect ${frame(-14)} rx="4" fill="none" stroke="url(#m-coord)" stroke-width="1.2" opacity="0.6"/>
        <g class="wheel" transform="translate(${CX} ${BOARD_Y + BOARD / 2}) scale(0.8)" stroke="url(#m-wheel)" fill="url(#m-wheel)">${millWheel()}</g>
        <g class="lines" fill="none" stroke-linecap="square"></g>
        <g class="coords" fill="url(#m-coord)" font-family="Didot, 'Bodoni 72', 'Bodoni MT', Georgia, serif" font-size="25" text-anchor="middle" dominant-baseline="central"></g>
        <g class="mills" pointer-events="none"></g>
        <g class="targets"></g>
        <g class="pieces"></g>
      </g>
    `;
    this.defsEl = this.svg.querySelector('.theme-defs');
    this.world = this.svg.querySelector('.world');
    this.millsEl = this.svg.querySelector('.mills');
    this.targetsEl = this.svg.querySelector('.targets');
    this.piecesEl = this.svg.querySelector('.pieces');

    // Linien: drei Quadrate und vier Querlinien. Unter jeder Goldlinie eine Schattenlinie, das wirkt eingelegt.
    const lines = this.svg.querySelector('.lines');
    const segments = [];
    for (let r = 0; r < 3; r++) {
      const a = this.pointPos(r * 8);
      const b = this.pointPos(r * 8 + 4);
      segments.push(`M ${a.x} ${a.y} H ${b.x} V ${b.y} H ${a.x} Z`);
    }
    for (const k of [1, 3, 5, 7]) {
      const a = this.pointPos(k);
      const b = this.pointPos(16 + k);
      segments.push(`M ${a.x} ${a.y} L ${b.x} ${b.y}`);
    }
    const d = segments.join(' ');
    lines.appendChild(el('path', { d, stroke: 'url(#m-line-shadow)', 'stroke-width': 7, transform: 'translate(1.2 2)' }));
    lines.appendChild(el('path', { d, stroke: 'url(#m-line)', 'stroke-width': 5.5 }));
    for (let i = 0; i < POINTS; i++) {
      const { x, y } = this.pointPos(i);
      lines.appendChild(el('circle', { cx: x + 1, cy: y + 1.6, r: 16, fill: '#000', opacity: 0.35 }));
      lines.appendChild(el('circle', { cx: x, cy: y, r: 15, fill: 'url(#m-point)', stroke: 'url(#m-point-ring)', 'stroke-width': 3 }));
    }

    // Koordinaten in Gold: Buchstaben unter dem Brett, Zahlen links. Nur im Stil Klassik sichtbar.
    const coords = this.svg.querySelector('.coords');
    this.coordLabels = [];
    const label = (text, x, y) => {
      const t = el('text', { x, y });
      t.textContent = text;
      coords.appendChild(t);
      this.coordLabels.push({ el: t, x, y });
    };
    for (let c = 0; c < 7; c++) label('abcdefg'[c], BOARD_X + MARGIN + c * STEP, BOARD_Y + BOARD + 28);
    for (let r = 0; r < 7; r++) label(String(7 - r), BOARD_X - 22, BOARD_Y + MARGIN + r * STEP);

    for (let id = 0; id < 18; id++) this.pieces.push(this.createPiece(Game.colorOf(id) === WHITE ? 'p1' : 'p2'));
  }

  // Brettstil wechseln: nur die Definitionen der Verläufe und Muster werden ausgetauscht
  setTheme(name) {
    const theme = THEMES[name] || THEMES[DEFAULT_THEME];
    this.theme = name;
    this.defsEl.innerHTML = theme.defs.join('');
    this.svg.dataset.theme = name;
  }

  createPiece(side) {
    const group = el('g', { class: `piece ${side}` });
    const shadow = el('ellipse', { rx: PIECE_R * 1.08, ry: PIECE_R * 0.95, fill: 'url(#m-shadow)' });
    const body = el('circle', { r: PIECE_R, fill: `url(#m-${side})` });
    // Heller Rand (nur Ebenholz), Drechselringe, Lichtkante
    const edge = el('circle', { r: PIECE_R - 1.2, fill: 'none', stroke: `url(#m-${side}-edge)`, 'stroke-width': 2.4 });
    const rim = el('circle', { r: PIECE_R * 0.74, fill: 'none', stroke: `url(#m-${side}-ring)`, 'stroke-width': 3 });
    const ring2 = el('circle', { r: PIECE_R * 0.86, fill: 'none', stroke: `url(#m-${side}-ring2)`, 'stroke-width': 1.5 });
    const dimple = el('circle', { r: PIECE_R * 0.18, fill: 'none', stroke: `url(#m-${side}-ring2)`, 'stroke-width': 1.5 });
    const shine = el('path', {
      d: `M ${-PIECE_R * 0.62} ${-PIECE_R * 0.32} A ${PIECE_R * 0.72} ${PIECE_R * 0.72} 0 0 1 ${PIECE_R * 0.32} ${-PIECE_R * 0.62}`,
      fill: 'none', stroke: `url(#m-${side}-shine)`, 'stroke-width': 5, 'stroke-linecap': 'round',
    });
    // Innere Gruppe dreht gegen das Brett, damit Licht und Schatten immer gleich wirken
    const spin = el('g');
    spin.append(shadow, body, edge, ring2, rim, dimple, shine);
    group.appendChild(spin);
    this.piecesEl.appendChild(group);
    return { group, spin, shadow, x: CX, y: H / 2, lift: 0, scale: 1, flying: false, where: null };
  }

  place(p, x, y, lift = 0, scale = p.scale) {
    p.x = x;
    p.y = y;
    p.lift = lift;
    p.scale = scale;
    const s = scale * (1 + LIFT * lift);
    p.group.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})`);
    const off = 4 + 14 * lift;
    p.shadow.setAttribute('cx', (off * 0.5).toFixed(1));
    p.shadow.setAttribute('cy', off.toFixed(1));
  }

  toFront(p) {
    this.piecesEl.appendChild(p.group);
  }

  // ---------- Ausrichtung ----------

  // Querformat: Brett um 90° drehen (Weiß links). Spiel zu zweit: optional zusätzlich 180°.
  orient() {
    const landscape = window.matchMedia('(orientation: landscape)').matches;
    const turns = (landscape ? 1 : 0) + (this.flip ? 2 : 0);
    const [vw, vh] = landscape ? [H, W] : [W, H];
    this.svg.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
    this.turns = turns % 4;
    const transforms = [
      '',
      `translate(${H} 0) rotate(90)`,
      `translate(${W} ${H}) rotate(180)`,
      `translate(0 ${W}) rotate(270)`,
    ];
    this.world.setAttribute('transform', transforms[this.turns]);
    // Steine sollen trotz Drehung gleich beleuchtet sein, Koordinaten aufrecht stehen
    const upright = -90 * this.turns;
    this.pieces.forEach((p) => p.spin.setAttribute('transform', `rotate(${upright})`));
    this.coordLabels.forEach((c) => c.el.setAttribute('transform', `rotate(${upright} ${c.x} ${c.y})`));
    this.applyGravity();
  }

  setFlip(flip) {
    if (this.flip === flip) return;
    this.flip = flip;
    this.orient();
  }

  // ---------- Spiel setzen und abgleichen ----------

  // Ohne Animation (App-Start)
  setGame(game) {
    this.game = game;
    this.clearPending();
    for (const t of Object.values(this.trays)) t.items.clear();
    const onBoard = new Map();
    game.ids.forEach((id, i) => id !== null && onBoard.set(id, i));
    const inTray = { [WHITE]: [], [BLACK]: [] };
    this.pieces.forEach((p, id) => {
      p.flying = false;
      if (onBoard.has(id)) {
        const pos = this.pointPos(onBoard.get(id));
        this.place(p, pos.x, pos.y, 0, 1);
        p.where = 'board';
      } else {
        inTray[this.trayFor(game, id)].push(id);
      }
    });
    for (const side of [WHITE, BLACK]) {
      // Vorrat zur Mitte, genommene Steine dahinter
      this.trays[side].pack(inTray[side]);
      for (const id of inTray[side]) {
        this.pieces[id].where = side;
        this.pieces[id].scale = TRAY_R / PIECE_R;
      }
    }
    this.renderTrays();
    this.select(-1);
  }

  // Mit Animation an den Zustand des Spiels angleichen (Zurück, Neu, Fortsetzen)
  sync(game) {
    return this.run(() => this.syncNow(game));
  }

  async syncNow(game) {
    this.game = game;
    this.clearPending();
    this.select(-1);
    const onBoard = new Map();
    game.ids.forEach((id, i) => id !== null && onBoard.set(id, i));
    const jobs = [];
    let delay = 0;
    this.pieces.forEach((p, id) => {
      if (onBoard.has(id)) {
        const to = this.pointPos(onBoard.get(id));
        if (p.where !== 'board') this.trays[p.where].remove(id);
        p.where = 'board';
        if (Math.hypot(p.x - to.x, p.y - to.y) < 1 && p.scale === 1) return;
        p.flying = true;
        this.toFront(p);
        const from = { x: p.x, y: p.y, s: p.scale };
        jobs.push(wait(delay).then(() => tween(380, (t) => {
          this.place(p, lerp(from.x, to.x, t), lerp(from.y, to.y, t), Math.sin(Math.PI * t), lerp(from.s, 1, t));
        })).then(() => { p.flying = false; }));
        delay += 10;
      } else {
        const side = this.trayFor(game, id);
        if (p.where === side) return;
        if (p.where !== 'board') this.trays[p.where].remove(id);
        jobs.push(this.toTray(id, side, delay));
        delay += 30;
      }
    });
    this.startLoop();
    await Promise.all(jobs);
  }

  // Stein in eine Schale rollen lassen
  toTray(id, side, delay = 0) {
    const p = this.pieces[id];
    const tray = this.trays[side];
    const angle = tray.freeAngle(this.trayAngle(side, p.x));
    tray.add(id, angle, 0);
    p.where = side;
    p.flying = true;
    this.toFront(p);
    const from = { x: p.x, y: p.y, s: p.scale };
    return wait(delay)
      .then(() => tween(420, (t) => {
        const to = this.trayPos(side, tray.angleOf(id) ?? angle);
        this.place(p, lerp(from.x, to.x, t), lerp(from.y, to.y, t), 0.7 * Math.sin(Math.PI * t), lerp(from.s, TRAY_R / PIECE_R, t));
      }))
      .then(() => {
        p.flying = false;
        const it = tray.items.get(id);
        if (it) it.v = (Math.random() < 0.5 ? -1 : 1) * 0.5 * tray.k;
        this.emit('rim');
        this.startLoop();
      });
  }

  // ---------- Züge ----------

  play(record) {
    return this.run(() => this.playNow(record));
  }

  // Den ziehenden Stein bewegen: aus der Schale aufs Brett, entlang der Linie oder im Sprung
  async moveStone(id, from, to, fromPos) {
    const p = this.pieces[id];
    if (p.where !== 'board') this.trays[p.where].remove(id);
    p.where = 'board';
    p.flying = true;
    this.toFront(p);
    const target = this.pointPos(to);
    const s = fromPos || { x: p.x, y: p.y };
    const scale0 = p.scale;
    const far = from < 0 || !ADJACENT[from].includes(to); // Setzen oder Springen
    const quick = Boolean(fromPos);
    await tween(quick ? 160 : far ? 380 : 260, (t) => {
      const lift = quick ? 0 : (far ? 1.2 : 1) * Math.sin(Math.PI * t);
      this.place(p, lerp(s.x, target.x, t), lerp(s.y, target.y, t), lift, lerp(scale0, 1, t));
    });
    p.flying = false;
    this.emit('land', from < 0);
  }

  // Geschlossene Mühlen als leuchtende Goldlinie nachziehen
  async showMills(mills) {
    if (!mills.length) return;
    this.emit('mill', mills.length);
    const paths = mills.map((m) => {
      const a = this.pointPos(m[0]);
      const b = this.pointPos(m[2]);
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const glow = el('path', { d: `M ${a.x} ${a.y} L ${b.x} ${b.y}`, stroke: 'url(#m-mill)', 'stroke-width': 22, 'stroke-linecap': 'round', opacity: 0.22, fill: 'none' });
      const line = el('path', { d: `M ${a.x} ${a.y} L ${b.x} ${b.y}`, stroke: 'url(#m-mill)', 'stroke-width': 7, 'stroke-linecap': 'round', fill: 'none' });
      for (const node of [glow, line]) {
        node.setAttribute('stroke-dasharray', `${len} ${len}`);
        node.setAttribute('stroke-dashoffset', len);
        this.millsEl.appendChild(node);
      }
      return { glow, line, len };
    });
    await tween(320, (t) => {
      for (const { glow, line, len } of paths) {
        glow.setAttribute('stroke-dashoffset', (len * (1 - t)).toFixed(1));
        line.setAttribute('stroke-dashoffset', (len * (1 - t)).toFixed(1));
      }
    });
  }

  clearMills() {
    this.millsEl.innerHTML = '';
  }

  // record kommt von Game.apply. staged: der Stein steht schon, die Mühle leuchtet bereits
  // (eigener Zug, bei dem der Stein zum Nehmen eben gewählt wurde)
  async playNow(record, fromPos, staged = false) {
    const { move, mover, removedId, mills, side } = record;
    this.targetsEl.innerHTML = '';
    this.selected = -1;
    this.hintMove = null;
    this.pending = null;
    if (!staged) {
      this.clearMills();
      await this.moveStone(mover, move.from, move.to, fromPos);
      await this.showMills(mills);
      if (removedId !== null) await wait(260);
    }
    if (removedId !== null) {
      this.emit('take');
      const p = this.pieces[removedId];
      await tween(160, (t) => this.place(p, p.x, p.y, Math.sin((Math.PI / 2) * t), 1));
      await this.toTray(removedId, side);
    }
    await wait(mills.length ? 120 : 0);
    this.clearMills();
    this.emit('done', record);
    return record;
  }

  shake(i) {
    const id = this.game.ids[i];
    if (id === null) return;
    const p = this.pieces[id];
    const { x, y } = p;
    tween(260, (t) => this.place(p, x + Math.sin(t * Math.PI * 5) * 6 * (1 - t), y));
  }

  // ---------- Mühle geschlossen: Stein zum Nehmen wählen ----------

  // Eigener Zug schließt eine Mühle: Stein steht, Mühle leuchtet, nehmbare Steine pulsieren
  stage(from, to, options, fromPos) {
    return this.run(async () => {
      const g = this.game;
      const side = g.turn;
      const id = from < 0 ? g.reserve[side][g.reserve[side].length - 1] : g.ids[from];
      this.select(-1, true);
      const board = g.board.slice();
      if (from >= 0) board[from] = 0;
      await this.moveStone(id, from, to, fromPos);
      await this.showMills(millsAt(board, to, side));
      const hint = this.hintMove && this.hintMove.from === from && this.hintMove.to === to ? this.hintMove.remove : -1;
      this.pending = { from, to, options, id };
      this.showRemovable(hint);
      this.emit('pending', true);
    });
  }

  showRemovable(hint = -1) {
    this.targetsEl.innerHTML = '';
    if (!this.pending) return;
    for (const m of this.pending.options) {
      const pos = this.pointPos(m.remove);
      this.targetsEl.appendChild(el('circle', { class: `target take${m.remove === hint ? ' hint' : ''}`, cx: pos.x, cy: pos.y, r: PIECE_R + 9 }));
    }
  }

  clearPending() {
    const had = Boolean(this.pending);
    this.pending = null;
    this.clearMills();
    this.targetsEl.innerHTML = '';
    if (had) this.emit('pending', false);
  }

  // ---------- Auswahl, Ziele, Tipps ----------

  select(i, quiet = false) {
    if (this.selected >= 0 && this.game) {
      const id = this.game.ids[this.selected];
      if (id !== null && !this.drag) this.animateLift(this.pieces[id], 0);
    }
    this.selected = i;
    if (!this.pending) this.targetsEl.innerHTML = '';
    if (i < 0) return;
    const p = this.pieces[this.game.ids[i]];
    this.toFront(p);
    this.animateLift(p, 1);
    if (!quiet) this.emit('lift');
    for (const to of this.game.targetsFrom(i)) {
      const pos = this.pointPos(to);
      this.targetsEl.appendChild(el('circle', { class: 'target', cx: pos.x, cy: pos.y, r: PIECE_R * 0.62 }));
    }
    this.markHint();
  }

  // Tipp: Ring um das Ziel, beim Ziehen ist der Stein angehoben. Steht schon eine Mühle,
  // zeigt der Tipp den besten Stein zum Nehmen.
  showHint(move) {
    if (this.pending) {
      this.showRemovable(move.remove);
      return;
    }
    this.hintMove = move;
    if (move.from >= 0) {
      this.select(move.from, true);
    } else {
      this.select(-1, true);
      this.markHint();
    }
  }

  markHint() {
    const m = this.hintMove;
    if (!m || m.from !== this.selected) return;
    const pos = this.pointPos(m.to);
    this.targetsEl.appendChild(el('circle', { class: 'target hint', cx: pos.x, cy: pos.y, r: PIECE_R * 0.7 }));
  }

  animateLift(p, to) {
    const from = p.lift;
    tween(140, (t) => this.place(p, p.x, p.y, from + (to - from) * t, p.scale));
  }

  // ---------- Schalen ----------

  renderTrays() {
    for (const side of [WHITE, BLACK]) {
      for (const [id, it] of this.trays[side].items) {
        const p = this.pieces[id];
        if (p.flying) continue;
        const pos = this.trayPos(side, it.a);
        this.place(p, pos.x, pos.y, 0, TRAY_R / PIECE_R);
      }
    }
  }

  startLoop() {
    if (this.loopRunning) return;
    this.loopRunning = true;
    let last = performance.now();
    let idle = 0;
    const frame = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      let moving = false;
      for (const tray of Object.values(this.trays)) {
        for (let k = 0; k < 3; k++) moving = tray.step(dt / 3) || moving;
      }
      this.renderTrays();
      const flying = this.pieces.some((p) => p.flying);
      idle = moving || flying || this.trayTouch ? 0 : idle + 1;
      if (idle > 10) {
        this.loopRunning = false;
        return;
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  // Neigung in Bildschirmrichtung in den Brettraum drehen und an beide Schalen geben
  setGravity(x, y) {
    this.screenGravity = { x, y };
    this.applyGravity();
  }

  applyGravity() {
    const g = this.screenGravity || { x: 0, y: 0 };
    const a = (-90 * (this.turns || 0) * Math.PI) / 180;
    const board = { x: g.x * Math.cos(a) - g.y * Math.sin(a), y: g.x * Math.sin(a) + g.y * Math.cos(a) };
    let changed = false;
    for (const tray of Object.values(this.trays)) {
      const old = tray.gravity;
      tray.gravity = board;
      if (Math.hypot(board.x - old.x, board.y - old.y) > 0.02) changed = true;
    }
    if (changed) this.startLoop();
  }

  // ---------- Eingabe ----------

  toBoard(evt) {
    const pt = this.svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    return pt.matrixTransform(this.world.getScreenCTM().inverse());
  }

  pointAtPos(p) {
    let best = -1;
    let dist = HIT_R;
    for (let i = 0; i < POINTS; i++) {
      const q = this.pointPos(i);
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < dist) {
        dist = d;
        best = i;
      }
    }
    return best;
  }

  trayAtPoint(p) {
    for (const side of [WHITE, BLACK]) {
      if (Math.abs(p.y - TRAY_Y[side]) < 64 && p.x > 30 && p.x < W - 30) return side;
    }
    return null;
  }

  bindInput() {
    this.svg.addEventListener('pointerdown', (e) => this.down(e));
    this.svg.addEventListener('pointermove', (e) => this.move(e));
    this.svg.addEventListener('pointerup', (e) => this.up(e));
    this.svg.addEventListener('pointercancel', (e) => this.cancel(e));
  }

  // Zug von from nach to versuchen: ohne Mühle sofort, mit Mühle erst den Stein zum Nehmen wählen
  act(from, to, fromPos) {
    const options = this.game.movesTo(from, to);
    if (!options.length) return false;
    if (options[0].remove < 0) this.emit('move', options[0], fromPos);
    else this.stage(from, to, options, fromPos);
    return true;
  }

  // canMove: darf die Person gerade ziehen (Spiel läuft, sie ist am Zug)
  down(e) {
    if (!this.game) return;
    if (this.drag && this.drag.id !== e.pointerId) this.cancel({ pointerId: this.drag.id });
    if (this.trayTouch && this.trayTouch.id !== e.pointerId) this.trayTouch = null;
    if (this.drag || this.trayTouch) return;
    e.preventDefault();
    const p = this.toBoard(e);

    // Schalen: Steine antippen und wischen, das Spiel bleibt unberührt
    const side = this.trayAtPoint(p);
    if (side !== null) {
      capture(this.svg, e.pointerId);
      this.trayTouch = { id: e.pointerId, side, x: p.x, t: performance.now(), sx: e.clientX, sy: e.clientY, moved: false };
      this.startLoop();
      return;
    }

    if (this.busy || !this.events.canMove || !this.events.canMove()) return;
    const i = this.pointAtPos(p);
    const g = this.game;

    // Mühle steht: nur ein pulsierender Stein der Gegenseite lässt sich nehmen
    if (this.pending) {
      const m = this.pending.options.find((o) => o.remove === i);
      if (m) {
        this.emit('move', m, null, true);
      } else if (i >= 0 && g.board[i] === -g.turn) {
        this.shake(i);
        this.emit('invalid');
      }
      return;
    }

    if (i < 0) {
      this.select(-1);
      return;
    }

    // Setzen: freien Punkt antippen
    if (g.phase() === 'place') {
      if (g.board[i] === 0) this.act(-1, i);
      else if (g.board[i] === g.turn) {
        this.shake(i);
        this.emit('invalid');
      }
      return;
    }

    if (this.selected >= 0 && g.board[i] === 0 && this.act(this.selected, i)) return;
    if (g.board[i] !== g.turn) {
      this.select(-1);
      return;
    }
    if (g.targetsFrom(i).length === 0) {
      this.select(-1);
      this.shake(i);
      this.emit('invalid');
      return;
    }
    if (this.selected !== i) this.select(i);
    const piece = this.pieces[g.ids[i]];
    capture(this.svg, e.pointerId);
    this.drag = { id: e.pointerId, from: i, p: piece, sx: e.clientX, sy: e.clientY, ox: piece.x - p.x, oy: piece.y - p.y, active: false };
  }

  move(e) {
    const tt = this.trayTouch;
    if (tt && e.pointerId === tt.id) {
      if (!tt.moved && Math.hypot(e.clientX - tt.sx, e.clientY - tt.sy) < TAP_SLOP) return;
      tt.moved = true;
      const now = performance.now();
      const x = this.toBoard(e).x;
      const tray = this.trays[tt.side];
      const a = this.trayAngle(tt.side, x);
      const v = (a - this.trayAngle(tt.side, tt.x)) / Math.max(0.008, (now - tt.t) / 1000);
      tray.push(a, v);
      tt.x = x;
      tt.t = now;
      return;
    }
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    if (!d.active && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < TAP_SLOP) return;
    d.active = true;
    const p = this.toBoard(e);
    this.place(d.p, p.x + d.ox, p.y + d.oy, 1, 1);
  }

  up(e) {
    const tt = this.trayTouch;
    if (tt && e.pointerId === tt.id) {
      this.trayTouch = null;
      if (!tt.moved) this.trays[tt.side].nudge(this.trayAngle(tt.side, tt.x));
      this.startLoop();
      return;
    }
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    this.drag = null;
    if (!d.active) return;
    const target = this.pointAtPos({ x: d.p.x, y: d.p.y });
    if (target < 0 || this.game.board[target] !== 0 || !this.act(d.from, target, { x: d.p.x, y: d.p.y })) this.returnHome(d);
  }

  cancel(e) {
    if (this.trayTouch && e.pointerId === this.trayTouch.id) {
      this.trayTouch = null;
      return;
    }
    const d = this.drag;
    if (!d) return;
    this.drag = null;
    if (d.active) this.returnHome(d);
  }

  returnHome(d) {
    const home = this.pointPos(d.from);
    const s = { x: d.p.x, y: d.p.y };
    this.run(() => tween(180, (t) => this.place(d.p, lerp(s.x, home.x, t), lerp(s.y, home.y, t), 1, 1)));
  }
}

// ---------- Hilfsfunktionen ----------

function el(name, attrs = {}) {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function capture(svg, id) {
  try {
    svg.setPointerCapture(id);
  } catch {
    // nicht jedes Ereignis erlaubt das, das Spiel funktioniert trotzdem
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function ease(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function wait(ms) {
  return ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve();
}

function tween(duration, step) {
  return new Promise((resolve) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      step(1);
      resolve();
      return;
    }
    const t0 = performance.now();
    const frame = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      step(ease(t));
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
}
