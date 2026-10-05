// Darstellung von BLOCKS auf Canvas: eine nachtblaue Platte wie bei SPRING, darin die Mulden des
// Rasters, darauf Steine aus blauer Keramik wie im Stil Mitternacht von QUEEN. Darunter (im
// Querformat daneben) das Tablett mit drei Steinen. Platte und Steine sehen in Hell und Dunkel
// gleich aus, nur die Schrift über dem Brett folgt den Farben der Hülle.
//
// Jede Zelle ist ein kleines Bild (Sprite), einmal je Farbe und Größe gezeichnet, danach nur kopiert.
// Gezeichnet wird nur, wenn sich etwas ändert oder eine Animation läuft.

import { shapeOf } from './shapes.js?v=1.0.0';
import { TRAY } from './game.js?v=1.0.0';

// Farben aus SPRING und QUEEN Mitternacht
export const COLORS = {
  plateTop: '#2a2f7a',
  plateBottom: '#14174a',
  frameLine: '#2f3588',
  wellTop: '#0b0d33',
  wellBottom: '#1c2060',
  slotTop: '#05061c',
  slotBottom: '#11143f',
  blueLight: '#86abff',
  blue: '#3f6ef0',
  blueDark: '#2142b4',
  blackLight: '#5e616e',
  black: '#1d1e26',
  blackDark: '#07070a',
  hint: '#ffd36b',
};

const DISPLAY = "Didot, 'Bodoni 72', 'Playfair Display', Georgia, 'Times New Roman', serif";
const SANS = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif";

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeIn = (t) => t * t * t;
const easeOutBack = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Einheiten in Zellen
const PAD = 0.34; // Rand der Platte
const HEAD = 0.95; // Zeile über dem Brett: Bestwert und Serie
const GAP = 0.5; // Abstand Brett zu Tablett
const TRAY_DEPTH = 3.3; // Höhe (oder im Querformat Breite) des Tabletts

export class BlocksView {
  constructor(stage) {
    this.game = null;
    this.reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this.sprites = new Map();
    this.dirty = true;
    this.anim = { place: null, clear: null, calm: null, over: null, refill: null, back: null };
    this.fx = { pops: [], labels: [] };
    this.drag = null; // { slot, x, y, touch, grow, target, preview }
    this.hint = null; // { slot, x, y, t }
    this.hud = { best: '', bestLabel: '', streak: 0, keep: 0, streakLabel: '' };
    this.pulse = 0;

    this.el = document.createElement('div');
    this.el.className = 'blocks';
    this.canvas = document.createElement('canvas');
    this.el.append(this.canvas);
    stage.prepend(this.el);
    this.ctx = this.canvas.getContext('2d');

    // Schrift über dem Brett in den Farben der Hülle, auch nach einem Wechsel von Hell und Dunkel
    this.readInk();
    window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
      this.readInk();
      this.dirty = true;
    });
    new ResizeObserver(() => this.layout()).observe(this.el);
  }

  readInk() {
    const css = getComputedStyle(document.documentElement);
    this.ink = css.getPropertyValue('--ink').trim() || '#1a1d4e';
    this.inkSoft = css.getPropertyValue('--ink-soft').trim() || '#6b6d85';
  }

  setGame(game) {
    const resize = !this.game || this.game.size !== game.size;
    this.game = game;
    this.anim = { place: null, clear: null, calm: null, over: game.isOver ? { t: 1, dur: 1 } : null, refill: null, back: null };
    this.fx = { pops: [], labels: [] };
    this.drag = null;
    this.hint = null;
    if (resize) this.layout();
    this.dirty = true;
  }

  setHud(hud) {
    const key = JSON.stringify(hud);
    if (key === this.hudKey) return;
    this.hudKey = key;
    this.hud = hud;
    this.dirty = true;
  }

  // ---------- Geometrie ----------

  layout() {
    const w = this.el.clientWidth;
    const h = this.el.clientHeight;
    if (!w || !h || !this.game) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    const n = this.game.size;
    const plate = n + 2 * PAD;
    // Hochformat: Tablett unter dem Brett. Querformat: Tablett rechts daneben.
    // Gewählt wird, was das Brett größer macht.
    const cap = (84 * 8) / n;
    const fit = (uw, uh) => Math.min((w - 8) / uw, (h - 10) / uh, cap);
    const below = fit(plate, HEAD + plate + GAP + TRAY_DEPTH);
    const beside = fit(plate + GAP + TRAY_DEPTH, HEAD + plate);
    const side = beside > below * 1.02;
    let c = side ? beside : below;
    c = Math.max(10, Math.floor(c * dpr) / dpr); // ganze Gerätepixel: scharfe Kanten
    // Bleibt Platz übrig, bekommt ihn das Tablett: größere Steine lassen sich leichter greifen
    const room = side ? (w - 8) / c - plate - GAP : (h - 10) / c - HEAD - plate - GAP;
    const depth = Math.min(TRAY_DEPTH + 1.4, Math.max(TRAY_DEPTH, room));
    const unitsW = side ? plate + GAP + depth : plate;
    const unitsH = side ? HEAD + plate : HEAD + plate + GAP + depth;
    const snap = (v) => Math.round(v * dpr) / dpr;
    const ox = snap((w - unitsW * c) / 2);
    const oy = snap((h - unitsH * c) / 2);
    const frame = { x: ox, y: oy + HEAD * c, w: plate * c, h: plate * c };
    const grid = { x: snap(frame.x + PAD * c), y: snap(frame.y + PAD * c), size: n * c };
    const tray = side
      ? { x: frame.x + frame.w + GAP * c, y: frame.y, w: depth * c, h: frame.h }
      : { x: frame.x, y: frame.y + frame.h + GAP * c, w: frame.w, h: depth * c };
    const slots = [];
    for (let i = 0; i < TRAY; i++) {
      slots.push(side
        ? { x: tray.x, y: tray.y + (i * tray.h) / TRAY, w: tray.w, h: tray.h / TRAY }
        : { x: tray.x + (i * tray.w) / TRAY, y: tray.y, w: tray.w / TRAY, h: tray.h });
    }
    // Zellgröße auf dem Tablett: der größte Stein (5 Zellen) passt mit Luft in sein Fach
    const tc = Math.min(Math.min(slots[0].w, slots[0].h) / 5.4, c * 0.62);
    this.g = { w, h, c, n, side, ox, oy, frame, grid, tray, slots, tc };
    this.sprites.clear();
    this.plate = null;
    this.dirty = true;
    this.draw();
  }

  // Lage für die Bedienung, in Punkten relativ zur Bühne
  metrics() {
    return this.g;
  }

  // Punkt relativ zum Element
  local(clientX, clientY) {
    const r = this.el.getBoundingClientRect();
    return [clientX - r.left, clientY - r.top];
  }

  slotAt(x, y) {
    if (!this.g) return -1;
    return this.g.slots.findIndex((s) => x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h);
  }

  // Mitte eines Fachs auf dem Bildschirm (für Tests und Rückflug)
  slotCenter(slot) {
    const s = this.g.slots[slot];
    return [s.x + s.w / 2, s.y + s.h / 2];
  }

  cellCenter(x, y) {
    const { grid, c } = this.g;
    return [grid.x + (x + 0.5) * c, grid.y + (y + 0.5) * c];
  }

  // ---------- Ziehen ----------

  dragShape(slot) {
    return shapeOf(this.game.tray[slot]);
  }

  // Lage des gezogenen Steins in Punkten: links oben und Zellgröße
  dragBox() {
    const d = this.drag;
    if (!d) return null;
    const s = shapeOf(this.game.tray[d.slot]);
    if (!s) return null;
    const { c, tc, grid } = this.g;
    if (d.keys) {
      return { x: grid.x + d.kx * c, y: grid.y + d.ky * c, size: c, shape: s };
    }
    const size = tc + (c - tc) * easeOut(d.grow);
    const lift = d.touch ? c * 0.9 * easeOut(d.grow) : 0;
    const x = d.x - (s.w * size) / 2;
    const y = d.touch ? d.y - s.h * size - lift : d.y - (s.h * size) / 2;
    return { x, y, size, shape: s };
  }

  // Zielzelle für den gezogenen Stein: die nächste Lage, an der er passt, höchstens eine
  // dreiviertel Zelle entfernt. So rastet der Stein leicht ein.
  dragTarget(canPlace) {
    const b = this.dragBox();
    if (!b) return null;
    const { grid, c } = this.g;
    const fx = (b.x - grid.x) / c;
    const fy = (b.y - grid.y) / c;
    let best = null;
    for (let y = Math.round(fy) - 1; y <= Math.round(fy) + 1; y++) {
      for (let x = Math.round(fx) - 1; x <= Math.round(fx) + 1; x++) {
        const dist = Math.hypot(x - fx, y - fy);
        if (dist > 0.75 || !canPlace(x, y)) continue;
        if (!best || dist < best.dist) best = { x, y, dist };
      }
    }
    return best && { x: best.x, y: best.y };
  }

  // Kein Platz: der Stein gleitet zurück in sein Fach
  dragCancel() {
    const b = this.dragBox();
    if (b && !this.reduced) this.anim.back = { slot: this.drag.slot, from: b, t: 0, dur: 0.22 };
    this.drag = null;
    this.dirty = true;
  }

  // ---------- Sprites ----------

  // Keramikstein mit Lichtkante, Glanz und Schatten. kind: 'blue' oder 'black'
  sprite(kind, size) {
    const s = Math.max(4, Math.round(size * this.dpr));
    const key = `${kind}|${s}`;
    let cv = this.sprites.get(key);
    if (cv) return cv;
    cv = document.createElement('canvas');
    cv.width = s;
    cv.height = s;
    const ctx = cv.getContext('2d');
    const [light, body, dark] = kind === 'black'
      ? [COLORS.blackLight, COLORS.black, COLORS.blackDark]
      : [COLORS.blueLight, COLORS.blue, COLORS.blueDark];
    const g = Math.max(1, s * 0.06);
    const r = s * 0.2;
    const w = s - 2 * g;
    // Körper: Licht von oben links wie bei den Steinen von QUEEN
    const fill = ctx.createRadialGradient(g + w * 0.32, g + w * 0.26, w * 0.05, g + w * 0.5, g + w * 0.5, w * 0.82);
    fill.addColorStop(0, light);
    fill.addColorStop(0.5, body);
    fill.addColorStop(1, dark);
    roundRect(ctx, g, g, w, w, r);
    ctx.fillStyle = fill;
    ctx.fill();
    // Fase: innen eine zweite, flachere Fläche
    const inset = s * 0.14;
    ctx.save();
    roundRect(ctx, g + inset, g + inset, w - 2 * inset, w - 2 * inset, r * 0.6);
    const face = ctx.createLinearGradient(0, g + inset, 0, s - g - inset);
    face.addColorStop(0, 'rgba(255,255,255,0.10)');
    face.addColorStop(1, 'rgba(0,0,20,0.12)');
    ctx.fillStyle = face;
    ctx.fill();
    ctx.lineWidth = Math.max(0.6, s * 0.018);
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.stroke();
    ctx.restore();
    // Lichtkante oben, Schattenkante unten
    ctx.save();
    roundRect(ctx, g, g, w, w, r);
    ctx.clip();
    ctx.lineWidth = Math.max(1, s * 0.045);
    ctx.strokeStyle = 'rgba(255,255,255,0.32)';
    ctx.beginPath();
    ctx.moveTo(g + r, g + ctx.lineWidth / 2);
    ctx.lineTo(s - g - r, g + ctx.lineWidth / 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,15,0.35)';
    ctx.beginPath();
    ctx.moveTo(g + r, s - g - ctx.lineWidth / 2);
    ctx.lineTo(s - g - r, s - g - ctx.lineWidth / 2);
    ctx.stroke();
    // Glanzpunkt
    const shine = ctx.createRadialGradient(g + w * 0.3, g + w * 0.24, 0, g + w * 0.3, g + w * 0.24, w * 0.3);
    shine.addColorStop(0, 'rgba(255,255,255,0.5)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(0, 0, s, s);
    ctx.restore();
    this.sprites.set(key, cv);
    return cv;
  }

  // ---------- Platte ----------

  // Platte, Rand und Mulden ändern sich nur mit der Größe: einmal zeichnen, dann kopieren
  plateLayer() {
    if (this.plate) return this.plate;
    const { frame, grid, c, n } = this.g;
    const d = this.dpr;
    const cv = document.createElement('canvas');
    cv.width = this.canvas.width;
    cv.height = this.canvas.height;
    const ctx = cv.getContext('2d');
    ctx.setTransform(d, 0, 0, d, 0, 0);
    // Platte mit Schatten auf den Tisch
    ctx.save();
    ctx.shadowColor = 'rgba(10, 12, 40, 0.32)';
    ctx.shadowBlur = Math.min(c * 0.5, 16) * d;
    ctx.shadowOffsetY = Math.min(c * 0.15, 6) * d;
    const plate = ctx.createLinearGradient(0, frame.y, 0, frame.y + frame.h);
    plate.addColorStop(0, COLORS.plateTop);
    plate.addColorStop(1, COLORS.plateBottom);
    ctx.fillStyle = plate;
    roundRect(ctx, frame.x, frame.y, frame.w, frame.h, c * 0.42);
    ctx.fill();
    ctx.restore();
    // Lichtkante
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    roundRect(ctx, frame.x + 0.5, frame.y + 0.5, frame.w - 1, frame.h - 1, c * 0.42);
    ctx.stroke();
    // Eingelassene Spielfläche wie die Rinne von SPRING
    const inner = 0.12 * c;
    const well = ctx.createLinearGradient(0, grid.y, 0, grid.y + grid.size);
    well.addColorStop(0, COLORS.wellTop);
    well.addColorStop(0.6, '#121543');
    well.addColorStop(1, COLORS.wellBottom);
    ctx.fillStyle = well;
    roundRect(ctx, grid.x - inner, grid.y - inner, grid.size + 2 * inner, grid.size + 2 * inner, c * 0.26);
    ctx.fill();
    ctx.strokeStyle = COLORS.frameLine;
    ctx.stroke();
    // Mulden: jedes Feld eine kleine Vertiefung
    const gap = Math.max(1, c * 0.07);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const px = grid.x + x * c + gap;
        const py = grid.y + y * c + gap;
        const s = c - 2 * gap;
        const m = ctx.createLinearGradient(0, py, 0, py + s);
        m.addColorStop(0, COLORS.slotTop);
        m.addColorStop(1, COLORS.slotBottom);
        ctx.fillStyle = m;
        roundRect(ctx, px, py, s, s, c * 0.16);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath();
        ctx.moveTo(px + c * 0.16, py + s - 0.5);
        ctx.lineTo(px + s - c * 0.16, py + s - 0.5);
        ctx.stroke();
      }
    }
    this.plate = cv;
    return cv;
  }

  // ---------- Zeichnen ----------

  cell(ctx, kind, px, py, size, { alpha = 1, scale = 1 } = {}) {
    const img = this.sprite(kind, size);
    ctx.globalAlpha = alpha;
    if (scale === 1) ctx.drawImage(img, px, py, size, size);
    else {
      const s = size * scale;
      ctx.drawImage(img, px + (size - s) / 2, py + (size - s) / 2, s, s);
    }
    ctx.globalAlpha = 1;
  }

  // Schatten unter einer Gruppe von Steinen
  shadow(ctx, cells, size, lift = 0) {
    const d = this.dpr;
    ctx.save();
    ctx.shadowColor = 'rgba(2, 3, 18, 0.55)';
    ctx.shadowBlur = size * (0.2 + lift * 0.3) * d;
    ctx.shadowOffsetY = size * (0.08 + lift * 0.2) * d;
    ctx.fillStyle = '#0a0b2c';
    ctx.beginPath();
    const g = size * 0.1;
    for (const [px, py] of cells) ctx.rect(px + g, py + g, size - 2 * g, size - 2 * g);
    ctx.fill();
    ctx.restore();
  }

  drawBoard(ctx) {
    const { grid, c, n } = this.g;
    const board = this.game.board;
    const place = this.anim.place;
    const over = this.anim.over;
    const placed = new Set(place ? place.cells.map(([x, y]) => `${x},${y}`) : []);
    const filled = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (board[y][x]) filled.push([x, y]);
    this.shadow(ctx, filled.map(([x, y]) => [grid.x + x * c, grid.y + y * c]), c);
    for (const [x, y] of filled) {
      const px = grid.x + x * c;
      const py = grid.y + y * c;
      let scale = 1;
      if (placed.has(`${x},${y}`)) scale = 1 + 0.08 * (1 - easeOut(clamp(place.t / place.dur)));
      this.cell(ctx, 'blue', px, py, c, { scale });
      if (over) {
        // Ende: Reihe für Reihe von unten nach oben zu schwarzer Keramik
        const f = clamp((over.t / over.dur) * (n + 3) - (n - 1 - y));
        if (f > 0) this.cell(ctx, 'black', px, py, c, { alpha: f });
      }
    }
    // Abgelegter Stein leuchtet kurz auf
    if (place) {
      const a = 0.3 * (1 - easeOut(clamp(place.t / place.dur)));
      ctx.fillStyle = `rgba(230, 238, 255, ${a})`;
      for (const [x, y] of place.cells) {
        if (!board[y]?.[x]) continue;
        roundRect(ctx, grid.x + x * c + c * 0.06, grid.y + y * c + c * 0.06, c * 0.88, c * 0.88, c * 0.2);
        ctx.fill();
      }
    }
  }

  // Linien verschwinden von der Ablagestelle aus nach außen: aufhellen, kleiner werden, verblassen
  drawClear(ctx) {
    const a = this.anim.clear;
    if (!a) return;
    const { grid, c } = this.g;
    const p = a.t / a.dur;
    for (const k of a.cells) {
      const dist = Math.hypot(k.x + 0.5 - a.at[0], k.y + 0.5 - a.at[1]) / this.g.n;
      const local = clamp((p - 0.15 - dist * 0.45) / 0.4);
      if (local >= 1) continue;
      const px = grid.x + k.x * c;
      const py = grid.y + k.y * c;
      this.cell(ctx, 'blue', px, py, c, { alpha: 1 - local, scale: 1 - easeIn(local) * 0.6 });
      ctx.fillStyle = `rgba(255, 255, 255, ${(1 - local) * clamp(p / 0.15) * 0.45})`;
      const s = c * (1 - easeIn(local) * 0.6) * 0.86;
      roundRect(ctx, px + (c - s) / 2, py + (c - s) / 2, s, s, s * 0.22);
      ctx.fill();
    }
  }

  // Modus Ruhe: das volle Brett löst sich von oben nach unten auf
  drawCalm(ctx) {
    const a = this.anim.calm;
    if (!a) return;
    const { grid, c, n } = this.g;
    const p = a.t / a.dur;
    for (const k of a.cells) {
      const local = clamp((p - (k.y / n) * 0.5) / 0.5);
      if (local >= 1) continue;
      this.cell(ctx, 'blue', grid.x + k.x * c, grid.y + k.y * c + local * c * 0.3, c, { alpha: 1 - local });
    }
  }

  // Vorschau beim Ziehen: wo der Stein landet und welche Linien verschwinden würden
  drawPreview(ctx) {
    const d = this.drag;
    const { grid, c, n } = this.g;
    if (d && d.target) {
      const s = shapeOf(this.game.tray[d.slot]);
      for (const [cx, cy] of s.cells) {
        this.cell(ctx, 'blue', grid.x + (d.target.x + cx) * c, grid.y + (d.target.y + cy) * c, c, { alpha: 0.32 });
      }
      if (d.preview) {
        const glow = 0.18 + 0.1 * Math.sin(this.pulse * 6);
        ctx.fillStyle = `rgba(200, 216, 255, ${glow})`;
        for (let i = 0; i < n; i++) {
          for (const r of d.preview.rows) {
            roundRect(ctx, grid.x + i * c + c * 0.05, grid.y + r * c + c * 0.05, c * 0.9, c * 0.9, c * 0.2);
            ctx.fill();
          }
          for (const col of d.preview.cols) {
            roundRect(ctx, grid.x + col * c + c * 0.05, grid.y + i * c + c * 0.05, c * 0.9, c * 0.9, c * 0.2);
            ctx.fill();
          }
        }
      }
    }
    // Tipp: goldener Umriss, der sanft pulsiert
    const h = this.hint;
    if (h && this.game.tray[h.slot] && (!d || d.slot === h.slot)) {
      const s = shapeOf(this.game.tray[h.slot]);
      const a = 0.55 + 0.35 * Math.sin(this.pulse * 4);
      ctx.save();
      ctx.strokeStyle = COLORS.hint;
      ctx.globalAlpha = a;
      ctx.lineWidth = Math.max(1.5, c * 0.07);
      for (const [cx, cy] of s.cells) {
        roundRect(ctx, grid.x + (h.x + cx) * c + c * 0.1, grid.y + (h.y + cy) * c + c * 0.1, c * 0.8, c * 0.8, c * 0.18);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Stein mittig in einem Fach
  piecePos(slot, size) {
    const s = shapeOf(this.game.tray[slot]);
    const r = this.g.slots[slot];
    return { x: r.x + (r.w - s.w * size) / 2, y: r.y + (r.h - s.h * size) / 2, shape: s };
  }

  drawPiece(ctx, shape, x, y, size, { alpha = 1, lift = 0, kind = 'blue' } = {}) {
    const pts = shape.cells.map(([cx, cy]) => [x + cx * size, y + cy * size]);
    ctx.save();
    ctx.globalAlpha = alpha;
    this.shadow(ctx, pts, size, lift);
    ctx.restore();
    for (const [px, py] of pts) this.cell(ctx, kind, px, py, size, { alpha });
  }

  drawTray(ctx) {
    const { tc } = this.g;
    const game = this.game;
    const refill = this.anim.refill;
    const back = this.anim.back;
    for (let slot = 0; slot < TRAY; slot++) {
      if (!game.tray[slot]) continue;
      if (this.drag && this.drag.slot === slot) continue;
      if (back && back.slot === slot) continue;
      const { x, y, shape } = this.piecePos(slot, tc);
      let alpha = game.isOver || !game.fits(slot) ? 0.32 : 1;
      let dy = 0;
      if (refill) {
        const local = clamp((refill.t - slot * 0.06) / (refill.dur - 0.12));
        dy = (1 - easeOutBack(local)) * tc * 2.2;
        alpha *= clamp(local * 2);
      }
      this.drawPiece(ctx, shape, x, y + dy, tc, { alpha, kind: game.isOver ? 'black' : 'blue' });
      // Tipp: das Fach leuchtet golden
      if (this.hint && this.hint.slot === slot && !this.drag) {
        const r = this.g.slots[slot];
        ctx.save();
        ctx.globalAlpha = 0.35 + 0.25 * Math.sin(this.pulse * 4);
        ctx.strokeStyle = COLORS.hint;
        ctx.lineWidth = 1.5;
        roundRect(ctx, r.x + 4, r.y + 4, r.w - 8, r.h - 8, tc * 0.8);
        ctx.stroke();
        ctx.restore();
      }
    }
    if (back && game.tray[back.slot]) {
      const p = easeOut(clamp(back.t / back.dur));
      const to = this.piecePos(back.slot, tc);
      const size = back.from.size + (tc - back.from.size) * p;
      this.drawPiece(ctx, to.shape, back.from.x + (to.x - back.from.x) * p, back.from.y + (to.y - back.from.y) * p, size, { lift: 1 - p });
    }
  }

  drawDrag(ctx) {
    const b = this.dragBox();
    if (!b || this.drag.keys) return;
    this.drawPiece(ctx, b.shape, b.x, b.y, b.size, { lift: this.drag.grow });
  }

  // Zeile über dem Brett: Bestwert links, Serie rechts, in den Farben der Hülle
  drawHead(ctx) {
    const { frame, c } = this.g;
    const hud = this.hud;
    const base = frame.y - c * 0.28;
    const label = Math.max(9, Math.min(13, c * 0.24));
    const num = Math.max(15, Math.min(30, c * 0.5));
    ctx.textBaseline = 'alphabetic';
    if (hud.best) {
      ctx.textAlign = 'left';
      ctx.font = `600 ${label}px ${SANS}`;
      ctx.fillStyle = this.inkSoft;
      const lw = this.spaced(ctx, hud.bestLabel.toUpperCase(), frame.x + 2, base - num * 0.18, label * 0.14);
      ctx.font = `${num}px ${DISPLAY}`;
      ctx.fillStyle = this.ink;
      ctx.fillText(hud.best, frame.x + 2 + lw + label * 0.7, base);
    }
    if (hud.streak > 0) {
      // Serie mit Punkten: so viele Steine bleiben, bis sie reißt
      const right = frame.x + frame.w - 2;
      const r = Math.max(2.2, c * 0.06);
      const dotsW = hud.keepMax * r * 3;
      for (let i = 0; i < hud.keepMax; i++) {
        ctx.beginPath();
        ctx.arc(right - dotsW + r + i * r * 3, base - num * 0.28, r, 0, Math.PI * 2);
        ctx.fillStyle = i < hud.keep ? COLORS.blue : this.inkSoft;
        ctx.globalAlpha = i < hud.keep ? 1 : 0.35;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.textAlign = 'right';
      ctx.font = `${num}px ${DISPLAY}`;
      ctx.fillStyle = this.ink;
      const nx = right - dotsW - r * 2;
      ctx.fillText(`×${hud.streak}`, nx, base);
      const nw = ctx.measureText(`×${hud.streak}`).width;
      ctx.font = `600 ${label}px ${SANS}`;
      ctx.fillStyle = this.inkSoft;
      ctx.textAlign = 'left';
      const text = hud.streakLabel.toUpperCase();
      const tw = this.spacedWidth(ctx, text, label * 0.14);
      this.spaced(ctx, text, nx - nw - label * 0.7 - tw, base - num * 0.18, label * 0.14);
    }
  }

  spacedWidth(ctx, text, spacing) {
    return [...text].reduce((s, ch) => s + ctx.measureText(ch).width, 0) + spacing * Math.max(0, text.length - 1);
  }

  spaced(ctx, text, x, y, spacing) {
    let cx = x;
    for (const ch of text) {
      ctx.fillText(ch, cx, y);
      cx += ctx.measureText(ch).width + spacing;
    }
    return cx - x - spacing;
  }

  // Aufsteigende Punkte und Schriftzüge in Didot
  drawFx(ctx) {
    const { grid, c } = this.g;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const p of this.fx.pops) {
      const k = p.t / p.dur;
      const [x, y] = this.cellCenter(p.at[0] - 0.5, p.at[1] - 0.5);
      ctx.globalAlpha = Math.min(clamp(k / 0.1), clamp((1 - k) / 0.4));
      ctx.font = `${Math.max(14, c * (p.big ? 0.62 : 0.46))}px ${DISPLAY}`;
      ctx.shadowColor = 'rgba(5, 6, 30, 0.7)';
      ctx.shadowBlur = c * 0.25 * this.dpr;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(p.text, x, y - easeOut(k) * c * 0.9);
    }
    let stack = 0;
    for (const l of this.fx.labels) {
      const k = l.t / l.dur;
      ctx.globalAlpha = Math.min(clamp(k / 0.12), clamp((1 - k) / 0.35));
      ctx.font = `${Math.max(20, c * (l.big ? 0.9 : 0.7))}px ${DISPLAY}`;
      ctx.shadowColor = 'rgba(5, 6, 30, 0.75)';
      ctx.shadowBlur = c * 0.35 * this.dpr;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(l.text, grid.x + grid.size / 2, grid.y + grid.size * 0.38 - k * c * 0.5 + stack);
      stack += c * 1.05;
    }
    ctx.restore();
  }

  draw() {
    if (!this.game || !this.g || !this.dirty) return;
    this.dirty = false;
    const ctx = this.ctx;
    const d = this.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(this.plateLayer(), 0, 0);
    ctx.setTransform(d, 0, 0, d, 0, 0);
    this.drawBoard(ctx);
    this.drawClear(ctx);
    this.drawCalm(ctx);
    this.drawPreview(ctx);
    this.drawTray(ctx);
    this.drawHead(ctx);
    this.drawFx(ctx);
    this.drawDrag(ctx);
    // Tastatur: der gewählte Stein liegt halb durchsichtig auf dem Brett
    if (this.drag && this.drag.keys) {
      const b = this.dragBox();
      const ok = Boolean(this.drag.target);
      this.drawPiece(ctx, b.shape, b.x, b.y, b.size, { alpha: ok ? 0.85 : 0.45, lift: 0.4 });
    }
  }

  // ---------- Ereignisse aus dem Spiel ----------

  handle(e) {
    const fast = this.reduced;
    switch (e.type) {
      case 'place':
        this.anim.place = { cells: e.cells, t: 0, dur: fast ? 0.01 : 0.26 };
        this.hint = null;
        break;
      case 'clear':
        this.anim.clear = { cells: e.cells, at: e.at, t: 0, dur: fast ? 0.01 : 0.5 };
        break;
      case 'score':
        if (e.points > 0) this.fx.pops.push({ text: `+${e.points}`, at: e.at, big: e.points >= 100, t: 0, dur: 0.95 });
        if (this.fx.pops.length > 3) this.fx.pops.shift();
        break;
      case 'refill':
        this.anim.refill = { t: 0, dur: fast ? 0.01 : 0.42 };
        break;
      case 'calmClear':
        this.anim.calm = { cells: e.cells, t: 0, dur: fast ? 0.01 : 0.85 };
        break;
      case 'gameOver':
        this.anim.over = { t: 0, dur: fast ? 0.01 : 0.75, keep: true };
        break;
      case 'undo':
        this.anim = { place: null, clear: null, calm: null, over: null, refill: null, back: null };
        this.fx = { pops: [], labels: [] };
        this.hint = null;
        break;
      default:
        break;
    }
    this.dirty = true;
  }

  label(text, { big = false, dur = 1.15 } = {}) {
    this.fx.labels.push({ text, big, t: 0, dur });
    if (this.fx.labels.length > 2) this.fx.labels.shift();
    this.dirty = true;
  }

  showHint(h) {
    this.hint = h ? { ...h } : null;
    this.dirty = true;
  }

  // ---------- Bild für Bild ----------

  update(dt) {
    let busy = false;
    for (const name of Object.keys(this.anim)) {
      const a = this.anim[name];
      if (!a) continue;
      if (a.t >= a.dur) {
        if (!a.keep) this.anim[name] = null;
        continue;
      }
      a.t = Math.min(a.dur, a.t + dt);
      busy = true;
    }
    for (const list of [this.fx.pops, this.fx.labels]) for (const p of list) p.t += dt;
    this.fx.pops = this.fx.pops.filter((p) => p.t < p.dur);
    this.fx.labels = this.fx.labels.filter((l) => l.t < l.dur);
    if (this.fx.pops.length || this.fx.labels.length) busy = true;
    if (this.drag && !this.drag.keys && this.drag.grow < 1) {
      this.drag.grow = this.reduced ? 1 : Math.min(1, this.drag.grow + dt / 0.12);
      busy = true;
    }
    // Pulsieren für Tipp und Vorschau
    if (this.hint || this.drag?.preview) {
      this.pulse += dt;
      busy = true;
    }
    if (busy) this.dirty = true;
  }
}

// Kleine Vorschau für die Moduskarten der Hülle: Platte mit ein paar Steinen als SVG
export function previewSvg(n, cells) {
  const s = 72 / n;
  const rects = cells.map(([x, y]) => `<rect x="${(x * s + s * 0.08).toFixed(2)}" y="${(y * s + s * 0.08).toFixed(2)}" width="${(s * 0.84).toFixed(2)}" height="${(s * 0.84).toFixed(2)}" rx="${(s * 0.2).toFixed(2)}" fill="${COLORS.blue}"/>`).join('');
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <rect x="8" y="8" width="84" height="84" rx="12" fill="${COLORS.plateTop}"/>
    <rect x="14" y="14" width="72" height="72" rx="6" fill="${COLORS.slotTop}"/>
    <g transform="translate(14 14)">${rects}</g>
  </svg>`;
}
