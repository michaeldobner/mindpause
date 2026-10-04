// Darstellung von QUEEN als SVG: Brett mit 8×8 Feldern, Keramiksteine, goldene Krone,
// zwei Schalen für geschlagene Steine, Animationen und Touch-Bedienung.
//
// Alles wird im "Brettraum" gezeichnet (Hochformat, Blau unten, 1000 × 1280 Einheiten).
// Im Querformat dreht eine Transformation das Brett um 90°, die Schalen liegen dann links und
// rechts. Beim Spiel zu zweit kann sich das Brett zusätzlich nach jedem Zug um 180° drehen.

import { Gutter } from '../../shared/js/gutter.js?shell=1.2.0';
import { BLUE, BLACK } from './rules.js?v=1.1.0';
import { Game } from './game.js?v=1.1.0';
import { THEMES, DEFAULT_THEME, CROWN } from './themes.js?v=1.1.0';

const NS = 'http://www.w3.org/2000/svg';
const W = 1000;
const H = 1280;
const CX = W / 2;

const BOARD_X = 40;
const BOARD_Y = 180;
const CELL = 115;
const BOARD = CELL * 8; // 920
const PIECE_R = 44;
const TRAY_R = 34; // Steine in der Schale sind etwas kleiner
const TRAY_HALF = 440; // halbe nutzbare Länge einer Schale
const TRAY_Y = { [BLUE]: 1192, [BLACK]: 88 }; // Blau hat seine Schale unten, Schwarz oben
const VIRTUAL_R = 10000; // Schalen sind gerade, die Physik rechnet auf einem sehr großen Kreis

const LIFT = 0.1;
const TAP_SLOP = 10;

export class QueenView {
  constructor(svg, events = {}, theme = DEFAULT_THEME) {
    this.svg = svg;
    this.events = events;
    this.game = null;
    this.selected = -1;
    this.hintTo = -1;
    this.busy = false;
    this.drag = null;
    this.trayTouch = null;
    this.pieces = []; // 24 Steine, Index = Nummer
    this.loopRunning = false;
    this.flip = false; // um 180° gedreht (Spiel zu zweit)
    this.chain = Promise.resolve();

    // Eine Schale je Seite: Blau sammelt dort die geschlagenen schwarzen Steine und umgekehrt
    const tray = (center) => new Gutter({
      radius: VIRTUAL_R,
      marbleRadius: TRAY_R,
      arc: { center, half: TRAY_HALF / VIRTUAL_R },
      speedScale: 446 / VIRTUAL_R,
      onCollide: (i) => this.emit('clack', i),
    });
    this.trays = { [BLUE]: tray(Math.PI / 2), [BLACK]: tray(-Math.PI / 2) };

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

  cellPos(i) {
    const r = i >> 3;
    const c = i & 7;
    return { x: BOARD_X + c * CELL + CELL / 2, y: BOARD_Y + r * CELL + CELL / 2 };
  }

  // Schale eines geschlagenen Steins: die Schale der Seite, die ihn geschlagen hat
  trayOf(id) {
    return Game.colorOf(id) === BLUE ? BLACK : BLUE;
  }

  // Position in einer Schale aus dem Winkel der Physik (gerade Linie)
  trayPos(side, angle) {
    const tray = this.trays[side];
    const u = tray.local(angle);
    const dir = side === BLUE ? -1 : 1;
    return { x: CX + dir * u * VIRTUAL_R, y: TRAY_Y[side] };
  }

  trayAngle(side, x) {
    const tray = this.trays[side];
    const dir = side === BLUE ? -1 : 1;
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
        <rect x="0" y="0" width="${W}" height="${H}" rx="70" fill="url(#q-plate)"/>
        <rect x="0" y="0" width="${W}" height="${H}" rx="70" fill="url(#q-grain)"/>
        ${[BLACK, BLUE].map((side) => `
        <rect class="tray-bed" ${trayBed(side)} fill="url(#q-tray)"/>
        <rect ${trayBed(side)} fill="url(#q-lattice)"/>
        <rect ${trayBed(side)} fill="none" stroke="url(#q-tray-edge)" stroke-width="2"/>`).join('')}
        <rect ${frame(8)} rx="18" fill="url(#q-frame)" stroke="url(#q-frame-line)" stroke-width="3"/>
        <g class="squares"></g>
        <rect ${frame(0)} fill="url(#q-sq-grain)" pointer-events="none"/>
        <rect ${frame(4)} fill="none" stroke="url(#q-coord)" stroke-width="1.5"/>
        <g class="coords" fill="url(#q-coord)" font-family="Didot, 'Bodoni 72', 'Bodoni MT', Georgia, serif" font-size="25" text-anchor="middle" dominant-baseline="central"></g>
        <g class="targets"></g>
        <g class="pieces"></g>
      </g>
    `;
    this.defsEl = this.svg.querySelector('.theme-defs');
    this.world = this.svg.querySelector('.world');
    this.targetsEl = this.svg.querySelector('.targets');
    this.piecesEl = this.svg.querySelector('.pieces');

    const squares = this.svg.querySelector('.squares');
    for (let i = 0; i < 64; i++) {
      const r = i >> 3;
      const c = i & 7;
      const dark = (r + c) % 2 === 1;
      squares.appendChild(el('rect', {
        x: BOARD_X + c * CELL, y: BOARD_Y + r * CELL, width: CELL, height: CELL,
        fill: dark ? 'url(#q-dark)' : 'url(#q-light)',
        class: dark ? 'sq dark' : 'sq light',
      }));
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
    for (let c = 0; c < 8; c++) label('ABCDEFGH'[c], BOARD_X + c * CELL + CELL / 2, BOARD_Y + BOARD + 26);
    for (let r = 0; r < 8; r++) label(String(8 - r), BOARD_X - 22, BOARD_Y + r * CELL + CELL / 2);

    for (let id = 0; id < 24; id++) this.pieces.push(this.createPiece(Game.colorOf(id) === BLUE ? 'p1' : 'p2'));
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
    const shadow = el('ellipse', { rx: PIECE_R * 1.08, ry: PIECE_R * 0.95, fill: 'url(#q-shadow)' });
    const body = el('circle', { r: PIECE_R, fill: `url(#q-${side})` });
    // Heller Rand (nur Ebenholz), innerer Rand und Drechselring, Lichtkante
    const edge = el('circle', { r: PIECE_R - 1.2, fill: 'none', stroke: `url(#q-${side}-edge)`, 'stroke-width': 2.4 });
    const rim = el('circle', { r: PIECE_R * 0.74, fill: 'none', stroke: `url(#q-${side}-ring)`, 'stroke-width': 3 });
    const ring2 = el('circle', { r: PIECE_R * 0.86, fill: 'none', stroke: `url(#q-${side}-ring2)`, 'stroke-width': 1.5 });
    const shine = el('path', {
      d: `M ${-PIECE_R * 0.62} ${-PIECE_R * 0.32} A ${PIECE_R * 0.72} ${PIECE_R * 0.72} 0 0 1 ${PIECE_R * 0.32} ${-PIECE_R * 0.62}`,
      fill: 'none', stroke: `url(#q-${side}-shine)`, 'stroke-width': 5, 'stroke-linecap': 'round',
    });
    const crown = this.createCrown(side);
    // Innere Gruppe dreht gegen das Brett, damit Licht, Schatten und Krone immer gleich wirken
    const spin = el('g');
    spin.append(shadow, body, edge, ring2, rim, shine, crown);
    group.appendChild(spin);
    this.piecesEl.appendChild(group);
    return { group, spin, shadow, crown, x: CX, y: H / 2, lift: 0, scale: 1, king: false, flying: false, where: null };
  }

  // Krone der Dame als Goldgravur. Unter jeder Linie liegt eine feine Schattenlinie, das wirkt eingelegt.
  createCrown(side) {
    const gold = `url(#q-${side}-engrave)`;
    const crown = el('g', { class: 'crown', opacity: 0 });
    const layer = (stroke, dy, opacity) => {
      const g = el('g', { transform: `translate(0 ${dy})`, opacity });
      g.appendChild(el('circle', { r: PIECE_R * 0.9, fill: 'none', stroke, 'stroke-width': 1.6 }));
      const art = el('g', { transform: 'translate(0 -1.5) scale(1.3)' });
      for (const d of CROWN.lines) {
        art.appendChild(el('path', { d, fill: 'none', stroke, 'stroke-width': 1.7, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
      }
      for (const d of CROWN.fills) art.appendChild(el('path', { d, fill: stroke }));
      for (const [cx, cy, r] of CROWN.dots) art.appendChild(el('circle', { cx, cy, r, fill: stroke }));
      for (const x of CROWN.tails) art.appendChild(el('path', { d: `M${x} 17.8 l1.3 2.4 l-1.3 1.6 l-1.3 -1.6 Z`, fill: stroke }));
      g.appendChild(art);
      return g;
    };
    crown.append(layer('#000', 0.9, side === 'p1' ? 0.18 : 0.5), layer(gold, 0, 1));
    return crown;
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

  setKing(p, king) {
    p.king = king;
    p.crown.setAttribute('opacity', king ? 1 : 0);
  }

  toFront(p) {
    this.piecesEl.appendChild(p.group);
  }

  // ---------- Ausrichtung ----------

  // Querformat: Brett um 90° drehen (Blau links). Spiel zu zweit: optional zusätzlich 180°.
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
    // Steine sollen trotz Drehung gleich beleuchtet sein und die Krone aufrecht stehen
    const upright = -90 * this.turns;
    this.pieces.forEach((p) => p.spin.setAttribute('transform', `rotate(${upright})`));
    this.coordLabels.forEach((c) => c.el.setAttribute('transform', `rotate(${upright} ${c.x} ${c.y})`));
    // Neigung muss in den Brettraum zurückgedreht werden
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
    for (const t of Object.values(this.trays)) t.items.clear();
    const onBoard = new Map();
    game.ids.forEach((id, i) => id !== null && onBoard.set(id, i));
    const captured = { [BLUE]: [], [BLACK]: [] };
    this.pieces.forEach((p, id) => {
      p.flying = false;
      if (onBoard.has(id)) {
        const i = onBoard.get(id);
        const pos = this.cellPos(i);
        this.setKing(p, game.pieceAt(i).king);
        this.place(p, pos.x, pos.y, 0, 1);
        p.where = 'board';
      } else {
        captured[this.trayOf(id)].push(id);
      }
    });
    for (const side of [BLUE, BLACK]) {
      this.trays[side].pack(captured[side]);
      for (const id of captured[side]) {
        this.setKing(this.pieces[id], false);
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
    this.select(-1);
    const onBoard = new Map();
    game.ids.forEach((id, i) => id !== null && onBoard.set(id, i));
    const jobs = [];
    let delay = 0;
    this.pieces.forEach((p, id) => {
      if (onBoard.has(id)) {
        const i = onBoard.get(id);
        const to = this.cellPos(i);
        const king = game.pieceAt(i).king;
        if (p.where !== 'board') this.trays[p.where].remove(id);
        p.where = 'board';
        this.setKing(p, king);
        if (Math.hypot(p.x - to.x, p.y - to.y) < 1 && p.scale === 1) return;
        p.flying = true;
        this.toFront(p);
        const from = { x: p.x, y: p.y, s: p.scale };
        jobs.push(wait(delay).then(() => tween(380, (t) => {
          this.place(p, lerp(from.x, to.x, t), lerp(from.y, to.y, t), Math.sin(Math.PI * t), lerp(from.s, 1, t));
        })).then(() => { p.flying = false; }));
        delay += 10;
      } else if (p.where === 'board') {
        jobs.push(this.toTray(id, delay));
        delay += 30;
      }
    });
    this.startLoop();
    await Promise.all(jobs);
  }

  // Geschlagenen Stein in die passende Schale rollen lassen
  toTray(id, delay = 0) {
    const p = this.pieces[id];
    const side = this.trayOf(id);
    const tray = this.trays[side];
    const angle = tray.freeAngle(this.trayAngle(side, p.x));
    tray.add(id, angle, 0);
    p.where = side;
    p.flying = true;
    this.setKing(p, false);
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

  // record kommt von Game.apply: Zug, Nummer des Steins, geschlagene Steine, Krönung
  async playNow(record, fromPos) {
    const { move, mover, capturedIds, crowned } = record;
    const p = this.pieces[mover];
    this.targetsEl.innerHTML = '';
    this.selected = -1;
    this.hintTo = -1;
    this.toFront(p);

    // Den Weg Feld für Feld springen, geschlagene Steine heben sich danach ab
    let start = fromPos || { x: p.x, y: p.y };
    for (let k = 0; k < move.path.length; k++) {
      const to = this.cellPos(move.path[k]);
      const s = start;
      const capture = move.captured.length > 0;
      const quickDrag = fromPos && k === 0 && !capture;
      await tween(quickDrag ? 160 : capture ? 300 : 260, (t) => {
        const lift = quickDrag ? 0 : Math.sin(Math.PI * t);
        this.place(p, lerp(s.x, to.x, t), lerp(s.y, to.y, t), lift, 1);
      });
      this.emit(capture ? 'hop' : 'land', record, k);
      start = to;
    }

    // Geschlagene Steine wandern in die Schale
    await Promise.all(capturedIds.map((id, k) => this.toTray(id, k * 90)));

    // Krönung: goldene Krone erscheint mit einem kleinen Puls
    if (crowned) {
      this.emit('crown', record);
      p.king = true;
      await tween(520, (t) => {
        p.crown.setAttribute('opacity', Math.min(1, t * 1.6).toFixed(2));
        p.crown.setAttribute('transform', `scale(${(0.82 + 0.18 * Math.sin((Math.PI / 2) * t)).toFixed(3)})`);
        this.place(p, p.x, p.y, Math.sin(Math.PI * t) * 0.8, 1);
      });
      this.setKing(p, true);
    }
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

  // ---------- Auswahl, Ziele, Tipps ----------

  select(i) {
    if (this.selected >= 0 && this.game) {
      const id = this.game.ids[this.selected];
      if (id !== null && !this.drag) this.animateLift(this.pieces[id], 0);
    }
    this.selected = i;
    this.hintTo = -1;
    this.targetsEl.innerHTML = '';
    if (i < 0) return;
    const p = this.pieces[this.game.ids[i]];
    this.toFront(p);
    this.animateLift(p, 1);
    this.emit('lift');
    const seen = new Set();
    for (const m of this.game.movesFrom(i)) {
      if (seen.has(m.to)) continue;
      seen.add(m.to);
      const pos = this.cellPos(m.to);
      this.targetsEl.appendChild(el('circle', { class: 'target', cx: pos.x, cy: pos.y, r: PIECE_R * 0.7 }));
    }
  }

  showHint(move) {
    this.select(move.from);
    this.targetsEl.innerHTML = '';
    this.hintTo = move.to;
    const pos = this.cellPos(move.to);
    this.targetsEl.appendChild(el('circle', { class: 'target hint', cx: pos.x, cy: pos.y, r: PIECE_R * 0.76 }));
  }

  animateLift(p, to) {
    const from = p.lift;
    tween(140, (t) => this.place(p, p.x, p.y, from + (to - from) * t, p.scale));
  }

  // ---------- Schalen ----------

  renderTrays() {
    for (const side of [BLUE, BLACK]) {
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

  cellAtPoint(p) {
    const c = Math.floor((p.x - BOARD_X) / CELL);
    const r = Math.floor((p.y - BOARD_Y) / CELL);
    if (r < 0 || r > 7 || c < 0 || c > 7) return -1;
    return r * 8 + c;
  }

  trayAtPoint(p) {
    for (const side of [BLUE, BLACK]) {
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
    const i = this.cellAtPoint(p);
    const g = this.game;

    if (this.selected >= 0 && i >= 0 && g.board[i] === 0) {
      const m = g.findMove(this.selected, i);
      if (m) {
        this.emit('move', m);
        return;
      }
    }
    if (i < 0 || g.board[i] === 0 || Math.sign(g.board[i]) !== g.turn) {
      this.select(-1);
      return;
    }
    if (g.movesFrom(i).length === 0) {
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
    const target = this.cellAtPoint({ x: d.p.x, y: d.p.y });
    const m = target >= 0 ? this.game.findMove(d.from, target) : null;
    if (m) this.emit('move', m, { x: d.p.x, y: d.p.y });
    else this.returnHome(d);
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
    const home = this.cellPos(d.from);
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
