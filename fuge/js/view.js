// Darstellung von FUGE: ein lackierter Kasten mit eingelassener Wanne und einer Leiste mit Fächern.
// Gezeichnet auf zwei Canvas-Ebenen:
//   base   Kasten, Wanne, Punktraster, liegende Steine, Fächer, Zahlen (nur bei Änderungen neu)
//   fx     fallender Stein, Geisterstein, Spuren, Aufleuchten, Schriftzüge (jedes Bild)
//
// Jeder Stein ist ein zusammenhängendes Werkstück: außen gerundete Ecken, zwischen seinen Zellen nur
// eine hauchfeine Naht, zu anderen Steinen eine sichtbare Fuge. Zellen werden als kleine Bilder
// (Sprites) einmal je Form, Nachbarschaft und Größe gezeichnet und danach nur noch kopiert.

import { cellsOf, sizeOf } from './pieces.js?v=1.0.0';
import { WIDTH, HEIGHT, HIDDEN, typeOf } from './game.js?v=1.0.0';

const ROWS = HEIGHT - HIDDEN;

// Matt lackierte Holzsteine, bewusst gedämpft und auf dem Nachtblau der Wanne geprüft
export const COLORS = {
  I: '#ece2cc', // Elfenbein
  O: '#dca544', // Ocker
  T: '#8f96d8', // Taubenblau
  S: '#8db898', // Salbei
  Z: '#d4673f', // Terrakotta
  J: '#4f7cf0', // Kobalt
  L: '#e6a39b', // Rosé
  X: '#4a4e80', // Tinte, für den vollen Kasten am Ende
};

// Der Kasten sieht in Hell und Dunkel gleich aus
const BOX = {
  frameTop: '#2b307c',
  frameBottom: '#171a50',
  wellTop: '#0b0d31',
  wellBottom: '#181b50',
  ivory: '#ece2cc',
  label: 'rgba(236, 226, 204, 0.58)',
  dot: 'rgba(236, 226, 204, 0.10)',
};

const DISPLAY = "Didot, 'Bodoni 72', 'Playfair Display', Georgia, 'Times New Roman', serif";
const SANS = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif";

// Zeichen der Formen für die Einstellung „Muster auf den Steinen“
const MARKS = {
  I: 'dash',
  O: 'ring',
  T: 'dot',
  S: 'slash',
  Z: 'backslash',
  J: 'square',
  L: 'plus',
};

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeIn = (t) => t * t * t;
const easeOutBack = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a, b, t) {
  const x = rgb(a);
  const y = rgb(b);
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`;
}
function rgba(hex, a) {
  return `rgba(${rgb(hex).join(',')},${a})`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Umriss einer Zelle als Teil eines Werkstücks.
// nb: Nachbarn desselben Steins (u, r, d, l und die Diagonalen ur, dr, dl, ul)
function cellPath(ctx, px, py, s, nb, gap, radius) {
  const L = px + (nb.l ? 0 : gap);
  const R = px + s - (nb.r ? 0 : gap);
  const T = py + (nb.u ? 0 : gap);
  const B = py + s - (nb.d ? 0 : gap);
  const corner = (a, b, diag) => {
    if (!a && !b) return 'round';
    if (a && b && !diag) return 'notch';
    return 'square';
  };
  const tl = corner(nb.u, nb.l, nb.ul);
  const tr = corner(nb.u, nb.r, nb.ur);
  const br = corner(nb.d, nb.r, nb.dr);
  const bl = corner(nb.d, nb.l, nb.dl);
  const n = gap;
  const r = radius;
  ctx.beginPath();
  if (tl === 'round') ctx.moveTo(L + r, T);
  else if (tl === 'notch') ctx.moveTo(L + n, T);
  else ctx.moveTo(L, T);
  if (tr === 'round') ctx.arcTo(R, T, R, T + r, r);
  else if (tr === 'notch') { ctx.lineTo(R - n, T); ctx.lineTo(R - n, T + n); ctx.lineTo(R, T + n); }
  else ctx.lineTo(R, T);
  if (br === 'round') ctx.arcTo(R, B, R - r, B, r);
  else if (br === 'notch') { ctx.lineTo(R, B - n); ctx.lineTo(R - n, B - n); ctx.lineTo(R - n, B); }
  else ctx.lineTo(R, B);
  if (bl === 'round') ctx.arcTo(L, B, L, B - r, r);
  else if (bl === 'notch') { ctx.lineTo(L + n, B); ctx.lineTo(L + n, B - n); ctx.lineTo(L, B - n); }
  else ctx.lineTo(L, B);
  if (tl === 'round') ctx.arcTo(L, T, L + r, T, r);
  else if (tl === 'notch') { ctx.lineTo(L, T + n); ctx.lineTo(L + n, T + n); ctx.lineTo(L + n, T); }
  else ctx.lineTo(L, T);
  ctx.closePath();
  return { L, R, T, B };
}

const NB_KEYS = ['u', 'r', 'd', 'l', 'ur', 'dr', 'dl', 'ul'];
const NB_OFFSETS = { u: [0, -1], r: [1, 0], d: [0, 1], l: [-1, 0], ur: [1, -1], dr: [1, 1], dl: [-1, 1], ul: [-1, -1] };
const maskOf = (nb) => NB_KEYS.reduce((m, k, i) => m | (nb[k] ? 1 << i : 0), 0);

// Nachbarschaft für eine Menge von Zellen desselben Steins
function neighborsInSet(set, x, y) {
  const nb = {};
  for (const k of NB_KEYS) nb[k] = set.has(`${x + NB_OFFSETS[k][0]},${y + NB_OFFSETS[k][1]}`);
  return nb;
}

export class FugeView {
  constructor(stage, events = {}) {
    this.events = events;
    this.game = null;
    this.settings = { ghost: true, patterns: false };
    this.reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this.sprites = new Map();
    this.spriteSize = 0;
    this.baseDirty = true;
    this.vis = null; // sichtbare Lage des fallenden Steins (weich nachgeführt)
    this.anim = { clear: null, gray: null, calm: null, queue: null, hold: null, wave: null };
    this.fx = { trail: null, flash: null, labels: [] };
    this.overlay = null;

    this.el = document.createElement('div');
    this.el.className = 'fuge';
    this.base = document.createElement('canvas');
    this.top = document.createElement('canvas');
    this.base.className = 'fuge-base';
    this.top.className = 'fuge-fx';
    this.card = document.createElement('div');
    this.card.className = 'fuge-overlay';
    this.card.hidden = true;
    this.el.append(this.base, this.top, this.card);
    stage.prepend(this.el);
    this.bctx = this.base.getContext('2d');
    this.fctx = this.top.getContext('2d');

    new ResizeObserver(() => this.layout()).observe(this.el);
    this.layout();
  }

  setGame(game) {
    this.game = game;
    this.vis = null;
    this.anim = { clear: null, gray: null, calm: null, queue: null, hold: null, wave: null };
    this.fx = { trail: null, flash: null, labels: [] };
    if (game.active) this.resetVis(game.active, false);
    this.baseDirty = true;
  }

  setSettings(settings) {
    this.settings = { ...this.settings, ...settings };
    this.sprites.clear();
    this.baseDirty = true;
  }

  // ---------- Geometrie ----------

  layout() {
    const w = this.el.clientWidth;
    const h = this.el.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    this.dpr = dpr;
    for (const cv of [this.base, this.top]) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.style.width = `${w}px`;
      cv.style.height = `${h}px`;
    }
    // Einheiten in Zellen: Rand 0,42, Wanne 10 × 20, Abstand 0,42, Leiste 3,3
    const pad = 0.42;
    const gapX = 0.42;
    const side = 3.3;
    const unitsW = 2 * pad + WIDTH + gapX + side;
    const unitsH = 2 * pad + ROWS;
    // Etwas Rand, damit der Schatten des Kastens nicht abgeschnitten wird
    let c = Math.min((w - 8) / unitsW, (h - 18) / unitsH, 44);
    c = Math.max(8, Math.floor(c * dpr) / dpr); // ganze Gerätepixel: scharfe Kanten
    const W = unitsW * c;
    const H = unitsH * c;
    const snap = (v) => Math.round(v * dpr) / dpr;
    const ox = snap((w - W) / 2);
    const oy = snap((h - H) / 2 - 4);
    const well = { x: snap(ox + pad * c), y: snap(oy + pad * c), w: WIDTH * c, h: ROWS * c };
    const sx = well.x + well.w + gapX * c;
    const sw = side * c;
    const holdBox = { x: sx, y: well.y + 0.62 * c, w: sw, h: 2.3 * c };
    const nextLabelY = holdBox.y + holdBox.h + 0.42 * c;
    const nextBox = { x: sx, y: nextLabelY + 0.4 * c, w: sw, h: 6.5 * c };
    this.g = { w, h, c, ox, oy, W, H, well, side: { x: sx, w: sw }, holdBox, nextBox, nextLabelY };

    this.card.style.left = `${well.x}px`;
    this.card.style.top = `${well.y}px`;
    this.card.style.width = `${well.w}px`;
    this.card.style.height = `${well.h}px`;
    this.card.style.setProperty('--c', `${c}px`);

    if (this.spriteSize !== c * dpr) {
      this.sprites.clear();
      this.spriteSize = c * dpr;
    }
    this.baseDirty = true;
    this.draw(0);
  }

  // Bildschirmlage für die Bedienung
  metrics() {
    const r = this.el.getBoundingClientRect();
    const { well, holdBox, c } = this.g;
    return {
      cell: c,
      well: { left: r.left + well.x, top: r.top + well.y, right: r.left + well.x + well.w, bottom: r.top + well.y + well.h },
      hold: { left: r.left + holdBox.x, top: r.top + holdBox.y, right: r.left + holdBox.x + holdBox.w, bottom: r.top + holdBox.y + holdBox.h },
    };
  }

  // ---------- Sprites ----------

  // Eine Zelle mit Lack, Fase, Naht und optionalem Zeichen, einmal gezeichnet je Form und Nachbarschaft
  sprite(type, nb) {
    const key = `${type}|${maskOf(nb)}`;
    let cv = this.sprites.get(key);
    if (cv) return cv;
    const s = Math.max(1, Math.round(this.spriteSize));
    cv = document.createElement('canvas');
    cv.width = s;
    cv.height = s;
    const ctx = cv.getContext('2d');
    const base = COLORS[type];
    const gap = Math.max(1, s * 0.05);
    const rad = s * 0.17;
    const { L, R, T, B } = cellPath(ctx, 0, 0, s, nb, gap, rad);
    ctx.fillStyle = base;
    ctx.fill();
    ctx.save();
    ctx.clip();
    // Matter Lack: oben ein Hauch heller, unten ein Hauch dunkler
    const sheen = ctx.createLinearGradient(0, 0, 0, s);
    sheen.addColorStop(0, 'rgba(255,255,255,0.14)');
    sheen.addColorStop(0.45, 'rgba(255,255,255,0.02)');
    sheen.addColorStop(1, 'rgba(12,12,40,0.10)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, s, s);
    // Fase an den Außenkanten: Licht von oben links
    const lw = Math.max(1, s * 0.06);
    const light = mix(base, '#ffffff', 0.55);
    const dark = mix(base, '#0a0b2a', 0.45);
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = light;
    if (!nb.u) ctx.fillRect(L, T, R - L, lw);
    ctx.globalAlpha = 0.4;
    if (!nb.l) ctx.fillRect(L, T, lw, B - T);
    ctx.fillStyle = dark;
    ctx.globalAlpha = 0.5;
    if (!nb.d) ctx.fillRect(L, B - lw, R - L, lw);
    ctx.globalAlpha = 0.32;
    if (!nb.r) ctx.fillRect(R - lw, T, lw, B - T);
    // Naht zwischen den Zellen eines Steins
    const seam = Math.max(1, s * 0.022);
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = dark;
    if (nb.r) ctx.fillRect(s - seam, T, seam, B - T);
    if (nb.d) ctx.fillRect(L, s - seam, R - L, seam);
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = light;
    if (nb.l) ctx.fillRect(0, T, seam, B - T);
    if (nb.u) ctx.fillRect(L, 0, R - L, seam);
    ctx.globalAlpha = 1;
    if (this.settings.patterns && MARKS[type]) this.mark(ctx, MARKS[type], s, dark);
    ctx.restore();
    this.sprites.set(key, cv);
    return cv;
  }

  // Eingeprägtes Zeichen in der Mitte einer Zelle
  mark(ctx, kind, s, color) {
    const m = s / 2;
    const k = s * 0.13;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(1, s * 0.055);
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (kind === 'dot') ctx.arc(m, m, k * 0.7, 0, Math.PI * 2), ctx.fill();
    else if (kind === 'ring') ctx.arc(m, m, k, 0, Math.PI * 2), ctx.stroke();
    else if (kind === 'dash') ctx.moveTo(m - k, m), ctx.lineTo(m + k, m), ctx.stroke();
    else if (kind === 'slash') ctx.moveTo(m - k, m + k), ctx.lineTo(m + k, m - k), ctx.stroke();
    else if (kind === 'backslash') ctx.moveTo(m - k, m - k), ctx.lineTo(m + k, m + k), ctx.stroke();
    else if (kind === 'square') ctx.rect(m - k * 0.8, m - k * 0.8, k * 1.6, k * 1.6), ctx.stroke();
    else if (kind === 'plus') ctx.moveTo(m - k, m), ctx.lineTo(m + k, m), ctx.moveTo(m, m - k), ctx.lineTo(m, m + k), ctx.stroke();
    ctx.restore();
  }

  // ---------- Zeichnen: Grundlagen ----------

  // Gruppe von Zellen eines Steins an einer Stelle. size: Zellgröße, cells: [[x, y]]
  drawGroup(ctx, type, cells, ox, oy, size, { alpha = 1, shadow = false } = {}) {
    const set = new Set(cells.map(([x, y]) => `${x},${y}`));
    ctx.save();
    ctx.globalAlpha = alpha;
    if (shadow) this.shadowPass(ctx, cells.map(([x, y]) => [ox + x * size, oy + y * size]), size);
    for (const [x, y] of cells) {
      ctx.drawImage(this.sprite(type, neighborsInSet(set, x, y)), ox + x * size, oy + y * size, size, size);
    }
    ctx.restore();
  }

  // Weicher Schatten unter Steinen auf die Wanne
  shadowPass(ctx, points, size) {
    const d = this.dpr;
    const gap = size * 0.05;
    ctx.save();
    ctx.shadowColor = 'rgba(2, 3, 18, 0.6)';
    ctx.shadowBlur = size * 0.22 * d;
    ctx.shadowOffsetY = size * 0.09 * d;
    ctx.fillStyle = '#0a0b2c';
    ctx.beginPath();
    for (const [px, py] of points) ctx.rect(px + gap, py + gap, size - 2 * gap, size - 2 * gap);
    ctx.fill();
    ctx.restore();
  }

  // Kleiner Stein, mittig in einem Punkt (Fächer)
  drawMini(ctx, type, cx, cy, size, opts = {}) {
    const cells = cellsOf(opts.shape || type, 0);
    const xs = cells.map(([x]) => x);
    const ys = cells.map(([, y]) => y);
    const w = (Math.max(...xs) - Math.min(...xs) + 1) * size;
    const h = (Math.max(...ys) - Math.min(...ys) + 1) * size;
    const ox = cx - w / 2 - Math.min(...xs) * size;
    const oy = cy - h / 2 - Math.min(...ys) * size;
    this.drawGroup(ctx, type, cells, ox, oy, size, opts);
  }

  spaced(ctx, text, x, y, spacing, align = 'left') {
    const chars = [...text];
    const widths = chars.map((ch) => ctx.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
    let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    chars.forEach((ch, i) => {
      ctx.fillText(ch, cx, y);
      cx += widths[i] + spacing;
    });
  }

  // ---------- Kasten ----------

  drawBox(ctx) {
    const { c, ox, oy, W, H, well } = this.g;
    const d = this.dpr;
    // Kasten mit Schatten auf den Tisch
    ctx.save();
    ctx.shadowColor = 'rgba(10, 12, 40, 0.32)';
    ctx.shadowBlur = Math.min(c * 0.6, 14) * d;
    ctx.shadowOffsetY = Math.min(c * 0.18, 5) * d;
    const frame = ctx.createLinearGradient(0, oy, 0, oy + H);
    frame.addColorStop(0, BOX.frameTop);
    frame.addColorStop(1, BOX.frameBottom);
    ctx.fillStyle = frame;
    roundRect(ctx, ox, oy, W, H, c * 0.62);
    ctx.fill();
    ctx.restore();
    // Lichtkante und Inlay in Elfenbein
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    roundRect(ctx, ox + 0.5, oy + 0.5, W - 1, H - 1, c * 0.62);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(236, 226, 204, 0.16)';
    roundRect(ctx, ox + c * 0.15, oy + c * 0.15, W - c * 0.3, H - c * 0.3, c * 0.5);
    ctx.stroke();

    this.drawRecess(ctx, well.x, well.y, well.w, well.h, c * 0.24);
    this.drawRecess(ctx, this.g.holdBox.x, this.g.holdBox.y, this.g.holdBox.w, this.g.holdBox.h, c * 0.3, true);
    this.drawRecess(ctx, this.g.nextBox.x, this.g.nextBox.y, this.g.nextBox.w, this.g.nextBox.h, c * 0.3, true);
  }

  // Eingelassene Fläche: dunkler Grund, Schatten an der oberen Kante, Licht an der unteren
  drawRecess(ctx, x, y, w, h, r, shallow = false) {
    const c = this.g.c;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, shallow ? '#12153f' : BOX.wellTop);
    g.addColorStop(1, shallow ? '#1b1f57' : BOX.wellBottom);
    ctx.fillStyle = g;
    roundRect(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.save();
    roundRect(ctx, x, y, w, h, r);
    ctx.clip();
    const top = ctx.createLinearGradient(0, y, 0, y + c * 0.7);
    top.addColorStop(0, 'rgba(0,0,10,0.45)');
    top.addColorStop(1, 'rgba(0,0,10,0)');
    ctx.fillStyle = top;
    ctx.fillRect(x, y, w, c * 0.7);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + r, y + h - 0.5);
    ctx.lineTo(x + w - r, y + h - 0.5);
    ctx.stroke();
  }

  // Punktraster an den Kreuzungen der Zellen, beim Stufenwechsel als Welle von oben nach unten
  drawDots(ctx) {
    const { c, well } = this.g;
    const r = Math.max(0.7, c * 0.045);
    const wave = this.anim.wave;
    for (let y = 1; y < ROWS; y++) {
      let a = 0.13;
      if (wave) {
        const p = wave.t / wave.dur;
        a += 0.45 * Math.max(0, 1 - Math.abs(p * (ROWS + 6) - y - 3) / 3);
      }
      ctx.fillStyle = `rgba(236, 226, 204, ${a})`;
      ctx.beginPath();
      for (let x = 1; x < WIDTH; x++) {
        ctx.moveTo(well.x + x * c + r, well.y + y * c);
        ctx.arc(well.x + x * c, well.y + y * c, r, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  }

  // ---------- Stapel ----------

  // Liegende Steine aus einem Brett, mit Nachbarschaft über gleiche Codes
  boardCells(board) {
    const out = [];
    for (let y = HIDDEN; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const code = board[y][x];
        if (!code) continue;
        const same = (dx, dy) => {
          const yy = y + dy;
          const xx = x + dx;
          return yy >= HIDDEN && yy < HEIGHT && xx >= 0 && xx < WIDTH && board[yy][xx] === code;
        };
        const nb = {};
        for (const k of NB_KEYS) nb[k] = same(...NB_OFFSETS[k]);
        out.push({ x, y, code, type: typeOf(code), nb });
      }
    }
    return out;
  }

  drawStack(ctx) {
    const { c, well } = this.g;
    const game = this.game;
    const px = (x) => well.x + x * c;
    const py = (y) => well.y + (y - HIDDEN) * c;
    ctx.save();
    roundRect(ctx, well.x, well.y, well.w, well.h, c * 0.24);
    ctx.clip();

    const clear = this.anim.clear;
    if (clear && clear.t < clear.vanish) {
      // Erst verschwinden die vollen Reihen: aufhellen, dann von der Mitte aus Zelle für Zelle
      const cells = this.boardCells(clear.before);
      const p = clear.t / clear.vanish;
      this.shadowPass(ctx, cells.filter((k) => !clear.rows.includes(k.y)).map((k) => [px(k.x), py(k.y)]), c);
      for (const k of cells) {
        const img = this.sprite(k.type, k.nb);
        if (!clear.rows.includes(k.y)) {
          ctx.drawImage(img, px(k.x), py(k.y), c, c);
          continue;
        }
        const dist = Math.abs(k.x - 4.5) / 4.5;
        const local = clamp((p - 0.25 - dist * 0.35) / 0.4);
        const s = 1 - easeIn(local) * 0.9;
        ctx.save();
        ctx.globalAlpha = 1 - local;
        const cx = px(k.x) + c / 2;
        const cy = py(k.y) + c / 2;
        ctx.translate(cx, cy);
        ctx.scale(s, s);
        ctx.drawImage(img, -c / 2, -c / 2, c, c);
        ctx.globalAlpha = (1 - local) * clamp(p / 0.25) * 0.6;
        ctx.fillStyle = BOX.ivory;
        roundRect(ctx, -c / 2 + 1, -c / 2 + 1, c - 2, c - 2, c * 0.15);
        ctx.fill();
        ctx.restore();
      }
    } else if (clear) {
      // Dann rutscht alles darüber nach, mit leichter Beschleunigung wie unter Schwerkraft
      const p = clamp((clear.t - clear.vanish) / (clear.dur - clear.vanish));
      const e = easeIn(p);
      const cells = this.boardCells(game.board);
      const shift = (y) => (clear.map[y] === undefined ? 0 : (clear.map[y] - y) * c * (1 - e));
      this.shadowPass(ctx, cells.map((k) => [px(k.x), py(k.y) + shift(k.y)]), c);
      for (const k of cells) ctx.drawImage(this.sprite(k.type, k.nb), px(k.x), py(k.y) + shift(k.y), c, c);
    } else if (this.anim.calm) {
      // Modus Ruhe: der volle Kasten löst sich von oben nach unten auf
      const a = this.anim.calm;
      const p = a.t / a.dur;
      const board = Array.from({ length: HEIGHT }, () => new Array(WIDTH).fill(0));
      for (const k of a.cells) board[k.y][k.x] = k.code;
      for (const k of this.boardCells(board)) {
        const local = clamp((p - ((k.y - HIDDEN) / ROWS) * 0.5) / 0.5);
        if (local >= 1) continue;
        ctx.save();
        ctx.globalAlpha = 1 - local;
        ctx.drawImage(this.sprite(k.type, k.nb), px(k.x), py(k.y) + local * c * 0.3, c, c);
        ctx.restore();
      }
    } else {
      const cells = this.boardCells(game.board);
      this.shadowPass(ctx, cells.map((k) => [px(k.x), py(k.y)]), c);
      const gray = this.anim.gray;
      for (const k of cells) {
        ctx.drawImage(this.sprite(k.type, k.nb), px(k.x), py(k.y), c, c);
        if (gray) {
          // Ende: Reihe für Reihe von unten nach oben in Tinte
          const f = clamp((gray.t / gray.dur) * (ROWS + 4) - (HEIGHT - 1 - k.y));
          if (f > 0) {
            ctx.save();
            ctx.globalAlpha = f;
            ctx.drawImage(this.sprite('X', k.nb), px(k.x), py(k.y), c, c);
            ctx.restore();
          }
        }
      }
    }
    ctx.restore();
  }

  // ---------- Leiste ----------

  drawSide(ctx, stats) {
    const { c, holdBox, nextBox, nextLabelY, side, well } = this.g;
    const game = this.game;
    // Beschriftungen so groß wie möglich, aber nie breiter als die Leiste
    let labelSize = Math.max(8.5, c * 0.32);
    ctx.textBaseline = 'alphabetic';
    ctx.font = `600 ${labelSize}px ${SANS}`;
    const words = [stats.labels.hold, stats.labels.next, ...stats.values.map((v) => v.label)];
    const widest = Math.max(...words.map((w) => ctx.measureText(w).width * 1.0 + labelSize * 0.14 * (w.length - 1)));
    if (widest > side.w - 4) {
      labelSize = Math.max(6.5, labelSize * ((side.w - 4) / widest));
      ctx.font = `600 ${labelSize}px ${SANS}`;
    }
    ctx.fillStyle = BOX.label;
    const spacing = labelSize * 0.14;
    this.spaced(ctx, stats.labels.hold, side.x + 2, holdBox.y - c * 0.2, spacing);
    this.spaced(ctx, stats.labels.next, side.x + 2, nextLabelY + c * 0.2, spacing);

    // Gehaltener Stein
    if (game.hold) {
      const pop = this.anim.hold ? easeOutBack(clamp(this.anim.hold.t / this.anim.hold.dur)) : 1;
      const size = c * 0.6 * (0.82 + 0.18 * pop);
      // Bereits gehalten: in Tinte, bis der nächste Stein liegt
      this.drawMini(ctx, game.holdUsed ? 'X' : game.hold, holdBox.x + holdBox.w / 2, holdBox.y + holdBox.h / 2, size, {
        shape: game.hold,
        shadow: true,
      });
    }

    // Die nächsten drei Steine, der erste größer
    const q = this.anim.queue ? easeOut(clamp(this.anim.queue.t / this.anim.queue.dur)) : 1;
    const slots = [
      { y: nextBox.y + 1.3 * c, s: 0.6 },
      { y: nextBox.y + 3.45 * c, s: 0.46 },
      { y: nextBox.y + 5.2 * c, s: 0.46 },
    ];
    game.queue.slice(0, 3).forEach((type, i) => {
      const slot = slots[i];
      this.drawMini(ctx, type, nextBox.x + nextBox.w / 2, slot.y + (1 - q) * c * 0.9, c * slot.s, {
        alpha: i === 2 ? q : 1,
        shadow: true,
      });
    });

    // Zwei Werte unten, bündig mit dem Boden der Wanne
    const bottom = well.y + well.h;
    const numSize = Math.max(16, c * 0.92);
    stats.values.forEach((stat, i) => {
      const baseY = bottom - (1 - i) * 2.05 * c;
      ctx.font = `600 ${labelSize}px ${SANS}`;
      ctx.fillStyle = BOX.label;
      this.spaced(ctx, stat.label, side.x + 2, baseY - numSize * 1.02, spacing);
      ctx.font = `${numSize}px ${DISPLAY}`;
      ctx.fillStyle = BOX.ivory;
      ctx.fillText(stat.value, side.x + 1, baseY - c * 0.05);
    });
  }

  // ---------- Fallender Stein und Effekte ----------

  resetVis(a, fadeIn = true) {
    this.vis = { id: a.id, x: a.x, y: fadeIn ? a.y - 0.45 : a.y, angle: 0, alpha: fadeIn && !this.reduced ? 0 : 1 };
  }

  drawActive(ctx) {
    const game = this.game;
    const a = game.active;
    if (!a || !this.vis) return;
    const { c, well } = this.g;
    const cells = cellsOf(a.type, a.rot);
    const ox = well.x + this.vis.x * c;
    const oy = well.y + (this.vis.y - HIDDEN) * c;

    ctx.save();
    roundRect(ctx, well.x, well.y, well.w, well.h, c * 0.24);
    ctx.clip();

    // Geisterstein: feiner Umriss mit einem Hauch Farbe, wo der Stein landen wird
    if (this.settings.ghost && game.state === 'playing') {
      const d = game.dropDistance();
      if (d > 0) this.drawGhost(ctx, a.type, cells, well.x + a.x * c, well.y + (a.y + d - HIDDEN) * c, c);
    }

    ctx.globalAlpha = this.vis.alpha;
    if (this.vis.angle && a.type !== 'O') {
      const n = sizeOf(a.type);
      const px = ox + (n / 2) * c;
      const py = oy + (n / 2) * c;
      ctx.translate(px, py);
      ctx.rotate(this.vis.angle);
      ctx.translate(-px, -py);
    }
    this.drawGroup(ctx, a.type, cells, ox, oy, c, { shadow: true, alpha: this.vis.alpha });
    ctx.restore();
  }

  drawGhost(ctx, type, cells, ox, oy, c) {
    const set = new Set(cells.map(([x, y]) => `${x},${y}`));
    const col = COLORS[type];
    const gap = c * 0.07;
    ctx.save();
    ctx.fillStyle = rgba(col, 0.1);
    ctx.strokeStyle = rgba(col, 0.55);
    ctx.lineWidth = Math.max(1, c * 0.05);
    ctx.lineCap = 'round';
    for (const [x, y] of cells) {
      const nb = neighborsInSet(set, x, y);
      const r = cellPath(ctx, ox + x * c, oy + y * c, c, nb, gap, c * 0.15);
      ctx.fill();
      ctx.beginPath();
      if (!nb.u) ctx.moveTo(r.L + c * 0.12, r.T), ctx.lineTo(r.R - c * 0.12, r.T);
      if (!nb.d) ctx.moveTo(r.L + c * 0.12, r.B), ctx.lineTo(r.R - c * 0.12, r.B);
      if (!nb.l) ctx.moveTo(r.L, r.T + c * 0.12), ctx.lineTo(r.L, r.B - c * 0.12);
      if (!nb.r) ctx.moveTo(r.R, r.T + c * 0.12), ctx.lineTo(r.R, r.B - c * 0.12);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawEffects(ctx) {
    const { c, well } = this.g;
    const { trail, flash, labels } = this.fx;
    ctx.save();
    roundRect(ctx, well.x, well.y, well.w, well.h, c * 0.24);
    ctx.clip();
    // Spur des harten Falls: ein Lichtband, das schnell verblasst
    if (trail) {
      const p = trail.t / trail.dur;
      const a = 0.22 * (1 - p);
      const cols = new Map();
      for (const [x, y] of trail.cells) cols.set(x, Math.min(cols.get(x) ?? 99, y));
      const col = COLORS[trail.type];
      for (const [x, top] of cols) {
        const y0 = well.y + (trail.fromY + top - HIDDEN) * c;
        const y1 = well.y + (trail.toY + top - HIDDEN) * c;
        const g = ctx.createLinearGradient(0, y0, 0, y1);
        g.addColorStop(0, rgba(col, 0));
        g.addColorStop(1, rgba(col, a));
        ctx.fillStyle = g;
        ctx.fillRect(well.x + x * c + c * 0.18, y0, c * 0.64, y1 - y0);
      }
    }
    // Abgelegter Stein leuchtet kurz auf, wie Lack im Licht
    if (flash) {
      const a = 0.32 * (1 - easeOut(flash.t / flash.dur));
      ctx.fillStyle = `rgba(255, 250, 238, ${a})`;
      const set = new Set(flash.cells.map(([x, y]) => `${x},${y}`));
      for (const [x, y] of flash.cells) {
        if (y < HIDDEN) continue;
        cellPath(ctx, well.x + x * c, well.y + (y - HIDDEN) * c, c, neighborsInSet(set, x, y), c * 0.05, c * 0.17);
        ctx.fill();
      }
    }
    ctx.restore();

    // Schriftzüge: ruhig einblenden, leicht steigen, ausblenden
    let stack = 0;
    for (const l of labels) {
      const p = l.t / l.dur;
      const a = Math.min(clamp(p / 0.12), clamp((1 - p) / 0.35));
      const y = well.y + well.h * 0.3 - p * c * 0.6 + stack;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.shadowColor = 'rgba(5, 6, 30, 0.6)';
      ctx.shadowBlur = c * 0.4 * this.dpr;
      ctx.fillStyle = BOX.ivory;
      ctx.font = `${Math.max(18, c * (l.big ? 1.25 : 0.95))}px ${DISPLAY}`;
      ctx.fillText(l.text, well.x + well.w / 2, y);
      if (l.sub) {
        const size = Math.max(9, c * 0.36);
        ctx.font = `600 ${size}px ${SANS}`;
        ctx.fillStyle = BOX.label;
        this.spaced(ctx, l.sub.toUpperCase(), well.x + well.w / 2, y + size * 1.7, size * 0.16, 'center');
      }
      ctx.restore();
      stack += c * (l.sub ? 2.2 : 1.5);
    }

    // Abdunkeln unter der Karte für Start und Pause
    if (this.overlay) {
      ctx.save();
      roundRect(ctx, well.x, well.y, well.w, well.h, c * 0.24);
      ctx.fillStyle = 'rgba(10, 12, 44, 0.74)';
      ctx.fill();
      ctx.restore();
    }
  }

  // ---------- Ereignisse aus dem Spiel ----------

  handle(e) {
    const game = this.game;
    switch (e.type) {
      case 'spawn':
        this.resetVis(e.piece);
        this.anim.queue = { t: 0, dur: 0.18 };
        this.baseDirty = true;
        break;
      case 'rotate':
        if (this.vis && !this.reduced) this.vis.angle = clamp(this.vis.angle - e.dir * (Math.PI / 2), -Math.PI, Math.PI);
        break;
      case 'hardDrop':
        if (this.vis) this.vis.y = e.piece.y;
        if (e.dist > 1 && !this.reduced) {
          this.fx.trail = { cells: cellsOf(e.piece.type, e.piece.rot), fromY: e.from.y, toY: e.piece.y, type: e.piece.type, t: 0, dur: 0.2 };
          this.bump(Math.min(3.2, 1 + e.dist * 0.12));
        }
        break;
      case 'lock': {
        this.vis = null;
        this.fx.flash = { cells: e.cells, t: 0, dur: 0.24 };
        if (e.rows && e.rows.length) this.startClear(e);
        this.baseDirty = true;
        break;
      }
      case 'hold':
        this.anim.hold = { t: 0, dur: 0.28 };
        this.baseDirty = true;
        break;
      case 'levelUp':
        this.anim.wave = { t: 0, dur: 0.9 };
        break;
      case 'calmClear':
        this.anim.calm = { cells: e.cells, t: 0, dur: 0.85 };
        this.vis = null;
        break;
      case 'gameOver':
        this.vis = null;
        this.anim.gray = { t: 0, dur: this.reduced ? 0.01 : 0.75 };
        break;
      case 'finish':
        this.vis = null;
        break;
      default:
        break;
    }
    if (game) this.baseDirty = true;
  }

  startClear(e) {
    const after = this.game.board;
    const k = e.rows.length;
    const before = new Array(HEIGHT);
    let ai = k;
    for (let y = 0; y < HEIGHT; y++) {
      const ri = e.rows.indexOf(y);
      before[y] = ri >= 0 ? e.removed[ri] : after[ai++];
    }
    // Zu jeder Reihe danach die Reihe davor, für das Nachrutschen
    const kept = [];
    for (let y = 0; y < HEIGHT; y++) if (!e.rows.includes(y)) kept.push(y);
    const map = {};
    for (let ya = k; ya < HEIGHT; ya++) map[ya] = kept[ya - k];
    const fast = this.reduced;
    this.anim.clear = { rows: e.rows, before, map, t: 0, vanish: fast ? 0.01 : 0.22, dur: fast ? 0.02 : 0.34 };
  }

  // Der ganze Kasten gibt beim harten Aufsetzen kurz nach
  bump(px) {
    if (!this.el.animate) return;
    this.el.animate(
      [{ transform: 'translateY(0)' }, { transform: `translateY(${px}px)`, offset: 0.25 }, { transform: 'translateY(0)' }],
      { duration: 200, easing: 'cubic-bezier(0.3, 0.7, 0.3, 1)' },
    );
  }

  label(text, sub = '', { big = false, dur = 1.15 } = {}) {
    this.fx.labels.push({ text, sub, big, t: 0, dur });
    if (this.fx.labels.length > 2) this.fx.labels.shift();
  }

  // ---------- Overlay für Start und Pause ----------

  setOverlay(content) {
    this.overlay = content;
    if (!content) {
      this.card.hidden = true;
      this.card.classList.remove('show');
      return;
    }
    const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
    this.card.innerHTML = `
      <div class="fo-card">
        ${content.kicker ? `<p class="fo-kicker">${esc(content.kicker)}</p>` : ''}
        <h2 class="fo-title">${esc(content.title)}</h2>
        ${content.text ? `<p class="fo-text">${esc(content.text)}</p>` : ''}
        ${content.help ? `<dl class="fo-help">${content.help.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
        ${content.best ? `<p class="fo-best">${esc(content.best)}</p>` : ''}
      </div>`;
    this.card.hidden = false;
    requestAnimationFrame(() => this.card.classList.add('show'));
  }

  // ---------- Bild für Bild ----------

  update(dt) {
    const game = this.game;
    if (!game) return;
    const a = game.active;
    if (a && this.vis && this.vis.id === a.id) {
      const k = (tau) => (this.reduced ? 1 : 1 - Math.exp(-dt / tau));
      this.vis.x += (a.x - this.vis.x) * k(0.028);
      this.vis.y += (a.y - this.vis.y) * k(0.035);
      if (Math.abs(a.x - this.vis.x) > 3) this.vis.x = a.x;
      if (Math.abs(a.y - this.vis.y) > 4) this.vis.y = a.y;
      this.vis.angle *= 1 - k(0.045);
      if (Math.abs(this.vis.angle) < 0.002) this.vis.angle = 0;
      this.vis.alpha = Math.min(1, this.vis.alpha + dt / 0.12);
    } else if (a) {
      this.resetVis(a, false);
    }
    for (const name of Object.keys(this.anim)) {
      const an = this.anim[name];
      if (!an) continue;
      an.t += dt;
      this.baseDirty = true;
      if (an.t >= an.dur && name !== 'gray') this.anim[name] = null;
      else if (name === 'gray' && an.t >= an.dur) an.t = an.dur;
    }
    if (this.anim.gray && this.anim.gray.t >= this.anim.gray.dur && !this.anim.gray.done) {
      this.anim.gray.done = true;
      this.baseDirty = true;
    }
    const { trail, flash, labels } = this.fx;
    if (trail && (trail.t += dt) >= trail.dur) this.fx.trail = null;
    if (flash && (flash.t += dt) >= flash.dur) this.fx.flash = null;
    for (const l of labels) l.t += dt;
    this.fx.labels = labels.filter((l) => l.t < l.dur);
  }

  draw(dt = 0, stats = null) {
    if (!this.game || !this.g) return;
    if (stats) this.stats = stats;
    const d = this.dpr;
    if (this.baseDirty && this.stats) {
      const ctx = this.bctx;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.base.width, this.base.height);
      ctx.setTransform(d, 0, 0, d, 0, 0);
      this.drawBox(ctx);
      this.drawDots(ctx);
      this.drawStack(ctx);
      this.drawSide(ctx, this.stats);
      this.baseDirty = false;
    }
    const f = this.fctx;
    f.setTransform(1, 0, 0, 1, 0, 0);
    f.clearRect(0, 0, this.top.width, this.top.height);
    f.setTransform(d, 0, 0, d, 0, 0);
    if (!this.anim.calm) this.drawActive(f);
    this.drawEffects(f);
  }

  // Werte der Leiste haben sich geändert
  invalidate() {
    this.baseDirty = true;
  }
}

// Kleine Vorschau für die Moduskarten der Hülle: ein paar liegende Steine als SVG
export function previewSvg(layout) {
  const s = 12;
  const cells = layout.map(([type, x, y]) => {
    const col = COLORS[type];
    return `<rect x="${x * s + 1}" y="${y * s + 1}" width="${s - 2}" height="${s - 2}" rx="2.4" fill="${col}"/>`;
  }).join('');
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <rect x="14" y="4" width="72" height="92" rx="12" fill="#22266a"/>
    <rect x="20" y="10" width="60" height="80" rx="7" fill="#11143f"/>
    <g transform="translate(20 10)">${cells}</g>
  </svg>`;
}
