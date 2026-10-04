// Darstellung des runden Bretts als SVG: Murmeln, Animationen, Touch-Bedienung und die Rinne.
//
// Es gibt immer genau 32 Murmeln (16 blaue, 16 schwarze). Murmeln, die eine Figur nicht braucht,
// und geschlagene Murmeln liegen in der Rinne. Beim Wechsel der Figur baut sich das Brett sichtbar um.

import { Gutter } from '../../shared/js/gutter.js?shell=1.2.0';

const NS = 'http://www.w3.org/2000/svg';
const VB = 1000;
const CENTER = VB / 2;

const PLATE_R = 494; // Außenkante des Bretts
const GUTTER_OUTER = 484; // Rinne
const GUTTER_INNER = 408;
const DISC_R = 404; // Spielfläche
const GUTTER_R = (GUTTER_OUTER + GUTTER_INNER) / 2;

const S = 110; // Abstand der Felder
const MR = 37; // Radius einer Murmel
const HOLE_R = 13;
const POOL = 32;

const LIFT = 0.12; // Vergrößerung beim Anheben
const TAP_SLOP = 10; // Pixel, ab denen aus einem Tippen ein Ziehen wird

export class BoardView {
  constructor(svg, events = {}) {
    this.svg = svg;
    this.events = events;
    this.game = null;
    this.selected = -1;
    this.hintTo = -1;
    this.busy = false;
    this.drag = null;
    this.rimTouch = null;
    this.pool = []; // alle 32 Murmeln
    this.idMap = []; // Murmel-ID im Spiel -> Index im Pool
    this.loopRunning = false;

    this.gutter = new Gutter({
      radius: GUTTER_R,
      marbleRadius: MR,
      onCollide: (i) => this.emit('clack', i),
    });
    this.chain = Promise.resolve(); // Animationen laufen nacheinander, nie gleichzeitig

    this.build();
    this.bindInput();
  }

  // Ein Fehler in einem Ereignis darf das Brett nie blockieren
  emit(name, ...args) {
    const fn = this.events[name];
    if (!fn) return;
    try {
      fn(...args);
    } catch (err) {
      console.error(err);
    }
  }

  // Aktion hinten anstellen: Sie startet, sobald die laufende Animation fertig ist.
  // So geht kein Tipp auf Zurück verloren, auch nicht mitten in einer Animation.
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
    const { r, c } = this.game.cells[i];
    return { x: CENTER + (c - 3) * S, y: CENTER + (r - 3) * S };
  }

  rimPos(angle) {
    const p = this.gutter.position(angle);
    return { x: CENTER + p.x, y: CENTER + p.y };
  }

  angleAt(p) {
    return Math.atan2(p.y - CENTER, p.x - CENTER);
  }

  // ---------- Aufbau ----------

  build() {
    const svg = this.svg;
    svg.setAttribute('viewBox', `0 0 ${VB} ${VB}`);
    svg.innerHTML = `
      <defs>
        <radialGradient id="g-plate" cx="50%" cy="38%" r="65%">
          <stop offset="0" stop-color="#2a2f7a"/>
          <stop offset="1" stop-color="#14174a"/>
        </radialGradient>
        <radialGradient id="g-gutter" cx="50%" cy="50%" r="50%">
          <stop offset="0.82" stop-color="#0b0d33"/>
          <stop offset="0.9" stop-color="#121543"/>
          <stop offset="1" stop-color="#1c2060"/>
        </radialGradient>
        <radialGradient id="g-disc" cx="50%" cy="40%" r="62%">
          <stop offset="0" stop-color="#262b72"/>
          <stop offset="1" stop-color="#191c55"/>
        </radialGradient>
        <radialGradient id="g-hole" cx="50%" cy="40%" r="60%">
          <stop offset="0" stop-color="#05061c"/>
          <stop offset="1" stop-color="#11143f"/>
        </radialGradient>
        <radialGradient id="g-blue" cx="36%" cy="32%" r="72%">
          <stop offset="0" stop-color="#7fa6ff"/>
          <stop offset="0.45" stop-color="#3f6ef0"/>
          <stop offset="1" stop-color="#1d3cae"/>
        </radialGradient>
        <radialGradient id="g-black" cx="36%" cy="32%" r="72%">
          <stop offset="0" stop-color="#5a5d6a"/>
          <stop offset="0.45" stop-color="#1c1d24"/>
          <stop offset="1" stop-color="#050507"/>
        </radialGradient>
        <radialGradient id="g-shine" cx="50%" cy="50%" r="50%">
          <stop offset="0" stop-color="#fff" stop-opacity="0.9"/>
          <stop offset="1" stop-color="#fff" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="g-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stop-color="#000" stop-opacity="0.55"/>
          <stop offset="1" stop-color="#000" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="g-plate-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0.86" stop-color="#000" stop-opacity="0.28"/>
          <stop offset="1" stop-color="#000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="${CENTER + 4}" cy="${CENTER + 14}" r="${PLATE_R + 6}" fill="url(#g-plate-shadow)"/>
      <circle cx="${CENTER}" cy="${CENTER}" r="${PLATE_R}" fill="url(#g-plate)"/>
      <circle cx="${CENTER}" cy="${CENTER}" r="${GUTTER_OUTER}" fill="url(#g-gutter)"/>
      <circle cx="${CENTER}" cy="${CENTER}" r="${DISC_R}" fill="url(#g-disc)"
              stroke="#2f3588" stroke-width="3"/>
      <g class="lines"></g>
      <g class="holes"></g>
      <g class="targets"></g>
      <g class="marbles"></g>
    `;
    this.linesEl = svg.querySelector('.lines');
    this.holesEl = svg.querySelector('.holes');
    this.targetsEl = svg.querySelector('.targets');
    this.marblesEl = svg.querySelector('.marbles');

    // 16 blaue und 16 schwarze Murmeln, zunächst alle in der Rinne
    for (let i = 0; i < POOL; i++) {
      this.pool.push(this.createMarble(i < POOL / 2 ? 'blue' : 'black'));
    }
  }

  // Linien und Mulden hängen nur vom Brett ab, das für alle Figuren gleich ist
  drawBoard() {
    if (this.linesEl.childElementCount) return;
    const g = this.game;
    g.cells.forEach((cell, i) => {
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const j = g.cellAt(cell.r + dr, cell.c + dc);
        if (j < 0) continue;
        const a = this.cellPos(i);
        const b = this.cellPos(j);
        this.linesEl.appendChild(el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y }));
      }
    });
    g.cells.forEach((_, i) => {
      const p = this.cellPos(i);
      this.holesEl.appendChild(el('circle', { cx: p.x, cy: p.y, r: HOLE_R, fill: 'url(#g-hole)' }));
    });
  }

  createMarble(color) {
    const group = el('g', { class: `marble ${color}` });
    const shadow = el('ellipse', { class: 'shadow', rx: MR * 1.05, ry: MR * 0.9, fill: 'url(#g-shadow)' });
    const body = el('circle', { r: MR, fill: `url(#g-${color})` });
    const shine = el('ellipse', {
      cx: -MR * 0.3, cy: -MR * 0.36, rx: MR * 0.36, ry: MR * 0.24,
      fill: 'url(#g-shine)', transform: 'rotate(-30)',
    });
    group.append(shadow, body, shine);
    this.marblesEl.appendChild(group);
    return { group, shadow, color, x: CENTER, y: CENTER + GUTTER_R, lift: 0, flying: false };
  }

  place(m, x, y, lift = 0) {
    m.x = x;
    m.y = y;
    m.lift = lift;
    const s = 1 + LIFT * lift;
    m.group.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})`);
    const off = 5 + 16 * lift;
    m.shadow.setAttribute('cx', (off * 0.5).toFixed(1));
    m.shadow.setAttribute('cy', off.toFixed(1));
    m.shadow.setAttribute('opacity', (1 - 0.35 * lift).toFixed(2));
  }

  toFront(m) {
    this.marblesEl.appendChild(m.group);
  }

  toBack(m) {
    this.marblesEl.insertBefore(m.group, this.marblesEl.firstChild);
  }

  marbleOf(gameId) {
    return this.pool[this.idMap[gameId]];
  }

  // ---------- Figur setzen ----------

  // Ordnet jeder Murmel der Figur eine Murmel passender Farbe aus dem Pool zu.
  // Blau und Schwarz wechseln sich im Schachbrettmuster ab.
  mapFigure(game) {
    const blue = [];
    const black = [];
    this.pool.forEach((m, i) => (m.color === 'blue' ? blue : black).push(i));
    const map = [];
    game.cells.forEach((cell) => {
      if (!cell.start) return;
      map.push((cell.r + cell.c) % 2 === 0 ? blue.shift() : black.shift());
    });
    return map;
  }

  // Zielzustand aller Pool-Murmeln: Feldindex oder -1 für die Rinne
  targets(game, idMap) {
    const where = new Array(POOL).fill(-1);
    game.marbles.forEach((id, i) => {
      if (id !== null) where[idMap[id]] = i;
    });
    return where;
  }

  // Ohne Animation (Start der App)
  setGame(game) {
    this.game = game;
    this.drawBoard();
    this.idMap = this.mapFigure(game);
    const where = this.targets(game, this.idMap);
    // Geschlagene Murmeln in Zugreihenfolge, danach die ungenutzten
    const captured = game.history.map((h) => this.idMap[h.captured]);
    const rest = this.pool.map((_, i) => i).filter((i) => where[i] < 0 && !captured.includes(i));
    this.gutter.pack([...captured, ...rest]);
    where.forEach((cell, i) => {
      const m = this.pool[i];
      m.flying = false;
      if (cell >= 0) {
        const p = this.cellPos(cell);
        this.place(m, p.x, p.y);
      }
    });
    this.renderGutter();
    this.select(-1);
  }

  // Mit Animation: Figur wechseln oder neu beginnen
  morph(game) {
    return this.run(() => this.morphNow(game));
  }

  async morphNow(game) {
    this.select(-1);
    this.game = game;
    const idMap = this.mapFigure(game);
    const where = this.targets(game, idMap);
    const jobs = [];
    let delay = 0;

    where.forEach((cell, i) => {
      const m = this.pool[i];
      const inGutter = this.gutter.has(i);
      if (cell >= 0) {
        const p = this.cellPos(cell);
        if (!inGutter && Math.hypot(m.x - p.x, m.y - p.y) < 1) return;
        this.gutter.remove(i);
        m.flying = true;
        this.toFront(m);
        const from = { x: m.x, y: m.y };
        jobs.push(wait(delay).then(() => tween(460, (t) => {
          this.place(m, lerp(from.x, p.x, t), lerp(from.y, p.y, t), Math.sin(Math.PI * t));
        })).then(() => { m.flying = false; }));
        delay += 12;
      } else if (!inGutter) {
        jobs.push(this.toRim(i, delay));
        delay += 12;
      }
    });

    this.idMap = idMap;
    this.startLoop();
    await Promise.all(jobs);
  }

  // Eine Murmel vom Brett in die Rinne rollen lassen, möglichst an die nächste freie Stelle
  toRim(poolIndex, delay = 0, nudge = 0.6) {
    const m = this.pool[poolIndex];
    const angle = this.gutter.freeAngle(this.angleAt(m));
    this.gutter.add(poolIndex, angle, 0);
    m.flying = true;
    this.toBack(m);
    const from = { x: m.x, y: m.y };
    return wait(delay)
      .then(() => tween(420, (t) => {
        const to = this.rimPos(this.gutter.angleOf(poolIndex) ?? angle);
        this.place(m, lerp(from.x, to.x, t), lerp(from.y, to.y, t), 0.6 * Math.sin(Math.PI * t));
      }))
      .then(() => {
        m.flying = false;
        // Kleiner Schubs, damit sich die Nachbarn zurechtruckeln
        const it = this.gutter.items.get(poolIndex);
        if (it) it.v = (Math.random() < 0.5 ? -1 : 1) * nudge;
        this.startLoop();
      });
  }

  // ---------- Rinne ----------

  renderGutter() {
    for (const [i, it] of this.gutter.items) {
      const m = this.pool[i];
      if (m.flying) continue;
      const p = this.rimPos(it.a);
      this.place(m, p.x, p.y);
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
      // Mehrere kleine Schritte für stabile Stöße
      const moving = [0, 1, 2].map(() => this.gutter.step(dt / 3)).some(Boolean);
      this.renderGutter();
      const flying = this.pool.some((m) => m.flying);
      idle = moving || flying || this.rimTouch ? 0 : idle + 1;
      if (idle > 10) {
        this.loopRunning = false;
        return;
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  setGravity(x, y) {
    const old = this.gutter.gravity;
    this.gutter.gravity = { x, y };
    if (Math.hypot(x - old.x, y - old.y) > 0.02) this.startLoop();
  }

  // ---------- Auswahl, Ziele und Tipps ----------

  select(i) {
    if (this.selected >= 0 && this.game) {
      const id = this.game.marbles[this.selected];
      const prev = id !== null ? this.marbleOf(id) : null;
      if (prev && !this.drag) this.animateLift(prev, 0);
    }
    this.selected = i;
    this.hintTo = -1;
    this.targetsEl.innerHTML = '';
    if (i < 0) return;

    const m = this.marbleOf(this.game.marbles[i]);
    this.toFront(m);
    this.animateLift(m, 1);
    this.emit('lift');
    for (const move of this.game.movesFrom(i)) {
      const p = this.cellPos(move.to);
      this.targetsEl.appendChild(el('circle', { class: 'target', cx: p.x, cy: p.y, r: MR * 0.72 }));
    }
  }

  // Tipp: Murmel anheben und nur das empfohlene Ziel zeigen
  showHint(from, to) {
    this.select(from);
    this.targetsEl.innerHTML = '';
    this.hintTo = to;
    const p = this.cellPos(to);
    this.targetsEl.appendChild(el('circle', { class: 'target hint', cx: p.x, cy: p.y, r: MR * 0.78 }));
  }

  animateLift(m, to) {
    const from = m.lift;
    tween(140, (t) => this.place(m, m.x, m.y, from + (to - from) * t));
  }

  // ---------- Züge ----------

  play(move, fromPos) {
    return this.run(() => this.playNow(move, fromPos));
  }

  async playNow(move, fromPos) {
    this.targetsEl.innerHTML = '';
    const g = this.game;
    const m = this.marbleOf(g.marbles[move.from]);
    const capIndex = this.idMap[g.marbles[move.over]];
    const start = fromPos || { x: m.x, y: m.y };
    const startLift = m.lift;
    const end = this.cellPos(move.to);

    this.selected = -1;
    this.hintTo = -1;
    this.toFront(m);

    const jump = tween(fromPos ? 170 : 280, (t) => {
      const lift = fromPos ? startLift * (1 - t) : Math.max(startLift * (1 - t), Math.sin(Math.PI * t));
      this.place(m, lerp(start.x, end.x, t), lerp(start.y, end.y, t), lift);
    });

    const record = g.apply(move);
    this.emit('move', record, 'jump');
    await jump;
    this.emit('move', record, 'land');

    await this.toRim(capIndex, 0, 0.8);
    this.emit('move', record, 'gutter');
    return record;
  }

  // Zurück wartet, bis ein laufender Zug fertig ist. Mehrere Tipps werden nacheinander ausgeführt.
  undo() {
    return this.run(() => this.undoNow());
  }

  async undoNow() {
    const g = this.game;
    const rec = g.undo();
    if (!rec) return null;
    this.select(-1);
    const m = this.marbleOf(rec.marble);
    const capIndex = this.idMap[rec.captured];
    const cap = this.pool[capIndex];
    this.gutter.remove(capIndex);
    cap.flying = true;
    this.toFront(cap);
    const back = this.cellPos(rec.from);
    const over = this.cellPos(rec.over);
    const ms = { x: m.x, y: m.y };
    const cs = { x: cap.x, y: cap.y };
    await Promise.all([
      tween(340, (t) => this.place(cap, lerp(cs.x, over.x, t), lerp(cs.y, over.y, t), 0.7 * Math.sin(Math.PI * t))),
      tween(260, (t) => this.place(m, lerp(ms.x, back.x, t), lerp(ms.y, back.y, t), Math.sin(Math.PI * t))),
    ]);
    cap.flying = false;
    return rec;
  }

  shake(i) {
    const m = this.marbleOf(this.game.marbles[i]);
    const { x, y } = m;
    tween(260, (t) => this.place(m, x + Math.sin(t * Math.PI * 5) * 6 * (1 - t), y));
  }

  // ---------- Eingabe ----------

  toSvg(evt) {
    const pt = this.svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    return pt.matrixTransform(this.svg.getScreenCTM().inverse());
  }

  cellNear(p, radius = S * 0.5) {
    let best = -1;
    let bestD = radius;
    this.game.cells.forEach((_, i) => {
      const c = this.cellPos(i);
      const d = Math.hypot(c.x - p.x, c.y - p.y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  }

  bindInput() {
    const svg = this.svg;
    svg.addEventListener('pointerdown', (e) => this.down(e));
    svg.addEventListener('pointermove', (e) => this.moveDrag(e));
    svg.addEventListener('pointerup', (e) => this.up(e));
    svg.addEventListener('pointercancel', (e) => this.cancel(e));
  }

  down(e) {
    if (!this.game) return;
    // Hängende Berührungen (iOS meldet das Loslassen nicht immer) aufräumen statt das Brett zu sperren
    if (this.drag && this.drag.id !== e.pointerId) this.cancel({ pointerId: this.drag.id });
    if (this.rimTouch && this.rimTouch.id !== e.pointerId) this.rimTouch = null;
    if (this.drag || this.rimTouch) return;
    e.preventDefault();
    const p = this.toSvg(e);
    const r = Math.hypot(p.x - CENTER, p.y - CENTER);

    // Berührung im Rand: nur die Murmeln dort reagieren, das Spiel bleibt unberührt
    if (r > DISC_R - 6 && r < PLATE_R + 40) {
      capturePointer(this.svg, e.pointerId);
      this.rimTouch = {
        id: e.pointerId, a: this.angleAt(p), t: performance.now(),
        sx: e.clientX, sy: e.clientY, moved: false,
      };
      this.startLoop();
      return;
    }
    if (this.busy) return;

    const i = this.cellNear(p);
    const g = this.game;

    // Tippen auf ein Ziel der ausgewählten Murmel
    if (this.selected >= 0 && i >= 0 && g.isEmpty(i)) {
      const move = g.findMove(this.selected, i);
      if (move) {
        this.play(move);
        return;
      }
    }

    if (i < 0 || !g.hasMarble(i)) {
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
    const m = this.marbleOf(g.marbles[i]);
    capturePointer(this.svg, e.pointerId);
    this.drag = {
      id: e.pointerId, from: i, m,
      sx: e.clientX, sy: e.clientY,
      ox: m.x - p.x, oy: m.y - p.y,
      active: false,
    };
  }

  moveDrag(e) {
    const rt = this.rimTouch;
    if (rt && e.pointerId === rt.id) {
      if (!rt.moved && Math.hypot(e.clientX - rt.sx, e.clientY - rt.sy) < TAP_SLOP) return;
      rt.moved = true;
      const now = performance.now();
      const a = this.angleAt(this.toSvg(e));
      let da = a - rt.a;
      if (da > Math.PI) da -= 2 * Math.PI;
      if (da < -Math.PI) da += 2 * Math.PI;
      const dt = Math.max(0.008, (now - rt.t) / 1000);
      this.gutter.push(a, da / dt);
      rt.a = a;
      rt.t = now;
      return;
    }

    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    if (!d.active && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < TAP_SLOP) return;
    d.active = true;
    const p = this.toSvg(e);
    this.place(d.m, p.x + d.ox, p.y + d.oy, 1);
  }

  up(e) {
    const rt = this.rimTouch;
    if (rt && e.pointerId === rt.id) {
      this.rimTouch = null;
      if (!rt.moved) this.gutter.nudge(rt.a);
      this.startLoop();
      return;
    }

    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    this.drag = null;
    if (!d.active) return; // einfaches Tippen: Murmel bleibt ausgewählt

    const target = this.cellNear({ x: d.m.x, y: d.m.y }, S * 0.6);
    const move = target >= 0 ? this.game.findMove(d.from, target) : null;
    if (move) {
      this.play(move, { x: d.m.x, y: d.m.y });
    } else {
      this.returnHome(d);
    }
  }

  cancel(e) {
    if (this.rimTouch && e.pointerId === this.rimTouch.id) {
      this.rimTouch = null;
      return;
    }
    const d = this.drag;
    if (!d) return;
    this.drag = null;
    if (d.active) this.returnHome(d);
  }

  returnHome(d) {
    const home = this.cellPos(d.from);
    const s = { x: d.m.x, y: d.m.y };
    this.run(() => tween(180, (t) => this.place(d.m, lerp(s.x, home.x, t), lerp(s.y, home.y, t), 1)));
  }
}

// ---------- Hilfsfunktionen ----------

function el(name, attrs = {}) {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function capturePointer(svg, id) {
  try {
    svg.setPointerCapture(id);
  } catch {
    // Manche Browser erlauben das nicht für jedes Ereignis, das Spiel funktioniert trotzdem
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
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
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
