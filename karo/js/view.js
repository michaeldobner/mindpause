// Darstellung von KARO: die Leinenmatte mit 52 Karten als HTML-Elemente.
// Jede Karte trägt Vorder- und Rückseite (SVG aus faces.js) und wird nur per transform bewegt.
//
// Zwei Anordnungen:
//   hoch   Stapel und Ablagen oben, darunter die sieben Spalten (iPhone hoch, iPad hoch)
//   breit  Stapel links, sieben Spalten in der Mitte, Ablagen rechts (iPhone quer, iPad quer)
//
// Bedienung: Tippen legt eine Karte an den besten Platz, Ziehen geht auch.

import { suitOf } from './cards.js?v=1.0.1';

const TAP_SLOP = 8; // Pixel, ab denen aus einem Tippen ein Ziehen wird
const RATIO = 1.4;

export class TableView {
  constructor(stage, events = {}) {
    this.events = events;
    this.game = null;
    this.drag = null;
    this.hint = null;
    this.hidden = new Set(); // Karten, die gerade die Siegesfeier zeigt

    this.el = document.createElement('div');
    this.el.className = 'table';
    stage.prepend(this.el);

    this.slots = {
      stock: this.slot('stock'),
      foundations: [0, 1, 2, 3].map((s) => this.slot('foundation', `<svg viewBox="0 0 100 100"><use href="#karo-suit-${s}"/></svg>`)),
      tableau: [0, 1, 2, 3, 4, 5, 6].map(() => this.slot('column')),
    };
    this.slots.stock.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v5h-5"/></svg>';

    this.cards = Array.from({ length: 52 }, (_, c) => {
      const el = document.createElement('div');
      el.className = 'k-card';
      el.dataset.card = c;
      el.innerHTML = `<div class="k-inner">
          <svg class="k-face" viewBox="0 0 250 350" aria-hidden="true"><use href="#karo-face-${c}"/></svg>
          <svg class="k-back" viewBox="0 0 250 350" aria-hidden="true"><use href="#karo-back"/></svg>
        </div>`;
      this.el.appendChild(el);
      return el;
    });

    this.bindInput();
    new ResizeObserver(() => {
      if (!this.game) return;
      this.layout();
      this.render({ animate: false });
    }).observe(this.el);
  }

  slot(kind, inner = '') {
    const el = document.createElement('div');
    el.className = `slot ${kind}`;
    el.innerHTML = inner;
    this.el.appendChild(el);
    return el;
  }

  emit(name, ...args) {
    const fn = this.events[name];
    if (!fn) return undefined;
    try {
      return fn(...args);
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }

  setGame(game, { deal = false } = {}) {
    this.game = game;
    this.hidden.clear();
    this.clearHint();
    this.layout();
    this.render({ animate: deal, deal });
  }

  // ---------- Geometrie ----------

  layout() {
    const tw = this.el.clientWidth;
    const th = this.el.clientHeight;
    const wide = tw / Math.max(1, th) > 1.25;
    const pad = Math.max(8, Math.min(tw, th) * 0.03);
    let W;
    let gap;
    const g = { wide, pad, tw, th };

    if (!wide) {
      W = Math.min((tw - 2 * pad) / 7.72, (th - 2 * pad) / (RATIO * 3.35));
      gap = Math.min(W * 0.2, (tw - 2 * pad - 7 * W) / 6);
      const left = (tw - (7 * W + 6 * gap)) / 2;
      const H = W * RATIO;
      g.colX = Array.from({ length: 7 }, (_, i) => left + i * (W + gap));
      g.top = pad;
      g.stock = { x: g.colX[0], y: pad };
      g.waste = { x: g.colX[1], y: pad, dx: W * 0.34, dy: 0 };
      g.found = [0, 1, 2, 3].map((i) => ({ x: g.colX[3 + i], y: pad }));
      g.tabY = pad + H + H * 0.24;
    } else {
      W = Math.min((tw - 2 * pad) / 11, (th - 2 * pad) / (RATIO * 4.25));
      gap = W * 0.16;
      const side = W * 0.42;
      const total = 9 * W + 6 * gap + 2 * side;
      const left = (tw - total) / 2;
      const H = W * RATIO;
      g.colX = Array.from({ length: 7 }, (_, i) => left + W + side + i * (W + gap));
      g.top = pad;
      g.stock = { x: left, y: pad };
      g.waste = { x: left, y: pad + H + gap * 1.2, dx: 0, dy: H * 0.24 };
      const fx = g.colX[6] + W + side;
      const fgap = Math.min(gap * 1.2, (th - 2 * pad - 4 * H) / 3);
      g.found = [0, 1, 2, 3].map((i) => ({ x: fx, y: pad + i * (H + fgap) }));
      g.tabY = pad;
    }
    g.W = W;
    g.H = W * RATIO;
    g.bottom = th - pad;
    this.g = g;

    this.el.style.setProperty('--cw', `${W}px`);
    this.el.style.setProperty('--ch', `${g.H}px`);
    this.el.classList.toggle('wide', wide);
    const place = (el, x, y) => { el.style.transform = `translate(${x}px, ${y}px)`; };
    place(this.slots.stock, g.stock.x, g.stock.y);
    this.slots.foundations.forEach((el, i) => place(el, g.found[i].x, g.found[i].y));
    this.slots.tableau.forEach((el, i) => place(el, g.colX[i], g.tabY));
  }

  // Abstände in einer Spalte, enger wenn sie sonst nicht auf die Matte passt
  columnOffsets(col) {
    const { H, wide, tabY, bottom } = this.g;
    const { down, up } = this.game.tableau[col];
    let dn = H * (wide ? 0.1 : 0.12);
    let un = H * (wide ? 0.3 : 0.34);
    const room = bottom - tabY - H;
    if (up.length > 1 && down.length * dn + (up.length - 1) * un > room) {
      un = Math.max(H * 0.2, (room - down.length * dn) / (up.length - 1));
      if (down.length * dn + (up.length - 1) * un > room) {
        dn = Math.max(H * 0.04, (room - (up.length - 1) * un) / Math.max(1, down.length));
      }
    }
    return { dn, un };
  }

  // Zielposition jeder Karte: { x, y, z, up }
  positions() {
    const game = this.game;
    const g = this.g;
    const pos = new Array(52);
    let z = 1;
    game.stock.slice().reverse().forEach((c, i) => {
      const depth = Math.floor(i / 8) * 0.8;
      pos[c] = { x: g.stock.x - depth, y: g.stock.y - depth, z: z++, up: false, where: 'stock' };
    });
    const fanCount = game.draw === 3 ? Math.min(3, Math.max(1, game.fan), game.waste.length) : Math.min(1, game.waste.length);
    game.waste.forEach((c, i) => {
      const k = i - (game.waste.length - fanCount);
      const f = Math.max(0, k);
      pos[c] = { x: g.waste.x + f * g.waste.dx, y: g.waste.y + f * g.waste.dy, z: z++, up: true, where: 'waste' };
    });
    game.foundations.forEach((rank, suit) => {
      for (let r = 1; r <= rank; r++) {
        pos[suit * 13 + r - 1] = { x: g.found[suit].x, y: g.found[suit].y, z: z++, up: true, where: 'foundation' };
      }
    });
    game.tableau.forEach((col, i) => {
      const { dn, un } = this.columnOffsets(i);
      let y = g.tabY;
      col.down.forEach((c) => {
        pos[c] = { x: g.colX[i], y, z: z++, up: false, where: 'tableau' };
        y += dn;
      });
      col.up.forEach((c) => {
        pos[c] = { x: g.colX[i], y, z: z++, up: true, where: 'tableau' };
        y += un;
      });
    });
    return pos;
  }

  // Alle Karten an ihren Platz. Bewegte Karten fliegen über den anderen.
  render({ animate = true, deal = false } = {}) {
    if (!this.game) return;
    const pos = this.positions();
    const dealOrder = deal ? this.dealOrder() : null;
    this.el.classList.toggle('no-anim', !animate);
    this.cards.forEach((el, c) => {
      const p = pos[c];
      if (!p) return;
      const key = `${Math.round(p.x)},${Math.round(p.y)}`;
      const moved = el.dataset.pos !== key;
      el.dataset.pos = key;
      el.classList.toggle('up', p.up);
      el.classList.toggle('gone', this.hidden.has(c));
      if (deal) {
        const i = dealOrder.get(c);
        el.style.transitionDelay = i === undefined ? '0ms' : `${i * 32}ms`;
        el.style.zIndex = String(i === undefined ? p.z : 200 + i);
      } else {
        el.style.transitionDelay = '0ms';
        el.style.zIndex = String(animate && moved ? 300 + p.z : p.z);
      }
      el.style.transform = `translate(${p.x}px, ${p.y}px)`;
    });
    clearTimeout(this.zTimer);
    // Nach dem Flug wieder die richtige Reihenfolge
    this.zTimer = setTimeout(() => {
      this.cards.forEach((el, c) => {
        if (pos[c]) el.style.zIndex = String(pos[c].z);
        el.style.transitionDelay = '0ms';
      });
    }, deal ? 1400 : 320);
    if (!animate) {
      void this.el.offsetWidth;
      this.el.classList.remove('no-anim');
    }
    this.slots.stock.classList.toggle('empty', this.game.stock.length === 0);
    this.slots.stock.classList.toggle('blocked', this.game.stock.length === 0 && !this.game.canRecycle);
  }

  // Reihenfolge beim Geben: zuerst liegen alle Karten im Stapel, dann reihenweise auf die Spalten
  dealOrder() {
    const order = new Map();
    let i = 0;
    for (let row = 0; row < 7; row++) {
      for (let col = row; col < 7; col++) {
        const { down, up } = this.game.tableau[col];
        const all = down.concat(up);
        if (all[row] !== undefined) order.set(all[row], i++);
      }
    }
    // Vor dem Geben alles auf den Stapel legen, ohne Animation
    this.el.classList.add('no-anim');
    const g = this.g;
    this.cards.forEach((el) => {
      el.classList.remove('up');
      el.style.transform = `translate(${g.stock.x}px, ${g.stock.y}px)`;
      el.dataset.pos = '';
    });
    void this.el.offsetWidth;
    this.el.classList.remove('no-anim');
    return order;
  }

  // ---------- Hinweise und Rückmeldung ----------

  showHint(move) {
    this.clearHint();
    const els = [];
    if (move.type === 'draw') els.push(this.game.stock.length ? this.cards[this.game.stock[0]] : this.slots.stock);
    else {
      for (const c of this.game.cardsAt(move.from)) els.push(this.cards[c]);
      const to = move.to;
      if (to.pile === 'foundation') {
        const card = this.game.cardsAt(move.from)[0];
        const suit = suitOf(card);
        const r = this.game.foundations[suit];
        els.push(r ? this.cards[suit * 13 + r - 1] : this.slots.foundations[suit]);
      } else {
        const top = this.game.topOf(to.col);
        els.push(top === null ? this.slots.tableau[to.col] : this.cards[top]);
      }
    }
    els.forEach((el) => el.classList.add('hinted'));
    this.hint = els;
  }

  clearHint() {
    if (this.hint) this.hint.forEach((el) => el.classList.remove('hinted'));
    this.hint = null;
  }

  shake(cards) {
    for (const c of cards) {
      const el = this.cards[c];
      el.classList.remove('shake');
      void el.offsetWidth;
      el.classList.add('shake');
      setTimeout(() => el.classList.remove('shake'), 400);
    }
  }

  // Bildschirmposition einer Ablage (für die Siegesfeier)
  foundationRect(suit) {
    const p = this.g.found[suit];
    return { x: p.x, y: p.y, w: this.g.W, h: this.g.H };
  }

  hideCard(c) {
    this.hidden.add(c);
    this.cards[c].classList.add('gone');
  }

  // ---------- Bedienung ----------

  // Wo liegt eine Karte, und was würde mit ihr bewegt?
  locate(card) {
    const game = this.game;
    if (game.stock.includes(card)) return { pile: 'stock' };
    if (game.waste.length && game.waste[game.waste.length - 1] === card) return { pile: 'waste' };
    if (game.waste.includes(card)) return { pile: 'waste-under' };
    const suit = suitOf(card);
    if (game.foundations[suit] && suit * 13 + game.foundations[suit] - 1 === card) return { pile: 'foundation', suit };
    for (let col = 0; col < 7; col++) {
      const index = game.tableau[col].up.indexOf(card);
      if (index >= 0) return { pile: 'tableau', col, index };
      if (game.tableau[col].down.includes(card)) return { pile: 'down', col };
    }
    return { pile: 'none' };
  }

  bindInput() {
    const el = this.el;
    el.addEventListener('pointerdown', (e) => {
      if (e.button > 0 || this.drag) return;
      this.emit('touch');
      const cardEl = e.target.closest('.k-card');
      const slotEl = e.target.closest('.slot');
      if (!cardEl) {
        if (slotEl === this.slots.stock) this.drag = { kind: 'stock', x: e.clientX, y: e.clientY, id: e.pointerId };
        return;
      }
      const card = Number(cardEl.dataset.card);
      const from = this.locate(card);
      if (from.pile === 'stock') {
        this.drag = { kind: 'stock', x: e.clientX, y: e.clientY, id: e.pointerId };
        return;
      }
      if (!['waste', 'foundation', 'tableau'].includes(from.pile)) return;
      const cards = this.game.cardsAt(from);
      const rect = el.getBoundingClientRect();
      const first = this.cards[cards[0]];
      const m = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(first.style.transform) || [0, 0, 0];
      this.drag = {
        kind: 'cards',
        id: e.pointerId,
        from,
        cards,
        x: e.clientX,
        y: e.clientY,
        ox: e.clientX - rect.left - Number(m[1]),
        oy: e.clientY - rect.top - Number(m[2]),
        moving: false,
      };
      try { el.setPointerCapture(e.pointerId); } catch { /* ältere Browser */ }
    });

    el.addEventListener('pointermove', (e) => {
      const d = this.drag;
      if (!d || d.kind !== 'cards' || e.pointerId !== d.id) return;
      if (!d.moving && Math.hypot(e.clientX - d.x, e.clientY - d.y) < TAP_SLOP) return;
      if (!d.moving) {
        d.moving = true;
        this.clearHint();
        d.cards.forEach((c, i) => {
          const card = this.cards[c];
          card.classList.add('dragging');
          card.style.zIndex = String(1000 + i);
        });
        this.emit('lift');
      }
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - d.ox;
      const y = e.clientY - rect.top - d.oy;
      const step = d.from.pile === 'tableau' ? this.columnOffsets(d.from.col).un : 0;
      d.cards.forEach((c, i) => {
        this.cards[c].style.transform = `translate(${x}px, ${y + i * step}px)`;
      });
      d.pos = { x, y };
    });

    const end = (e) => {
      const d = this.drag;
      if (!d || e.pointerId !== d.id) return;
      this.drag = null;
      if (d.kind === 'stock') {
        if (e.type === 'pointerup' && Math.hypot(e.clientX - d.x, e.clientY - d.y) < TAP_SLOP * 2) this.emit('draw');
        return;
      }
      d.cards.forEach((c) => this.cards[c].classList.remove('dragging'));
      if (!d.moving) {
        if (e.type === 'pointerup') this.emit('tap', d.from);
        return;
      }
      const to = e.type === 'pointerup' ? this.dropTarget(d) : null;
      const done = to ? this.emit('move', d.from, to) : false;
      if (!done) {
        this.render();
        if (to) this.emit('invalid');
      }
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  // Ziel unter der gezogenen Karte: zuerst eine Ablage, dann die nächstgelegene passende Spalte
  dropTarget(d) {
    if (!d.pos) return null;
    const { W, H } = this.g;
    const cx = d.pos.x + W / 2;
    const cy = d.pos.y + H / 2;
    if (d.cards.length === 1) {
      const suit = suitOf(d.cards[0]);
      const f = this.g.found[suit];
      const near = this.g.found.some((p) => Math.abs(cx - (p.x + W / 2)) < W * 0.8 && Math.abs(cy - (p.y + H / 2)) < H * 0.8);
      if (near && Math.abs(cx - (f.x + W / 2)) < W * 3 && this.game.canMove(d.from, { pile: 'foundation' })) return { pile: 'foundation' };
    }
    const options = this.g.colX
      .map((x, col) => ({ col, dist: Math.abs(cx - (x + W / 2)) }))
      .filter((o) => o.dist < W * 0.9)
      .sort((a, b) => a.dist - b.dist);
    for (const o of options) {
      if (this.game.canMove(d.from, { pile: 'tableau', col: o.col })) return { pile: 'tableau', col: o.col };
    }
    return options.length ? { pile: 'none' } : null;
  }
}
