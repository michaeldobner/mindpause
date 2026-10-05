// Die Siegesfeier: eine ruhige Hommage an Windows. Die Karten springen nacheinander von den
// Ablagen, hüpfen über die Matte und ziehen eine Spur, die langsam verblasst.
// Ein Tipp auf die Matte beendet die Feier.
//
// Es fliegen die echten Karten des Tischs (onMove bewegt sie), deshalb wartet die Feier nie auf
// Bilder. Nur die Spur dahinter wird auf eine Zeichenfläche gestempelt: mit Kartenbildern, die
// während des Spiels in Ruhe im Hintergrund vorbereitet werden, sonst als schlichte Karte.
// Safari braucht für jedes SVG-Bild spürbar Zeit, darum immer nur ein Bild mit Pausen dazwischen,
// und nie während die Feier läuft. Bei „Bewegung reduzieren“ fallen die Karten ruhiger:
// langsamer und ohne Spuren.

import { cardSvg, suitColor, RANK_LABELS, COLORS } from './faces.js?v=1.0.5';

const SUIT_CHARS = ['♠', '♥', '♣', '♦'];

// Ein Fehler in einem Ereignis darf die Feier nie anhalten
const safely = (fn) => {
  try {
    fn();
  } catch (err) {
    console.error(err);
  }
};
const DISPLAY = "Didot, 'Bodoni 72', Georgia, serif";

export class Celebration {
  constructor(table, lang) {
    this.table = table;
    this.lang = lang;
    this.bitmaps = new Array(52).fill(null);
    this.size = null;
    this.preparing = false;
    this.running = false;
  }

  // Kartenbilder im Hintergrund vorbereiten, eines nach dem anderen, ohne das Spiel zu bremsen.
  // width: Kartenbreite in Pixeln auf dem Bildschirm
  prepare(width) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(20, Math.round(width * dpr));
    const h = Math.round(w * 1.4);
    if (this.size && this.size.w === w) return;
    this.size = { w, h };
    this.bitmaps = new Array(52).fill(null);
    if (this.preparing) return;
    this.preparing = true;
    let card = 0;
    const next = () => {
      if (card >= 52) {
        this.preparing = false;
        return;
      }
      // Während der Feier keine Rechenzeit wegnehmen
      if (this.running) {
        setTimeout(next, 500);
        return;
      }
      const c = card++;
      const size = this.size;
      const img = new Image();
      const done = () => {
        img.onload = img.onerror = null;
        setTimeout(next, 150);
      };
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = size.w;
          canvas.height = size.h;
          canvas.getContext('2d').drawImage(img, 0, 0, size.w, size.h);
          if (this.size === size) this.bitmaps[c] = canvas;
        } catch {
          // Dieser Browser kann das SVG nicht zeichnen: die Karte springt als schlichte Karte
        }
        done();
      };
      img.onerror = done;
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cardSvg(c, this.lang))}`;
    };
    next();
  }

  stop() {
    this.running = false;
  }

  // Schlichte Karte: Papier, Wert und Farbe. Für Karten, deren Bild (noch) fehlt.
  plain(ctx, card, x, y, w, h) {
    const r = w * 0.064;
    ctx.fillStyle = COLORS.paper;
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.stroke();
    const suit = Math.floor(card / 13);
    ctx.fillStyle = suitColor(suit);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `${Math.round(w * 0.3)}px ${DISPLAY}`;
    ctx.fillText(RANK_LABELS[this.lang]?.[card % 13] ?? '', x + w * 0.16, y + w * 0.32);
    ctx.font = `${Math.round(w * 0.16)}px ${DISPLAY}`;
    ctx.fillText(SUIT_CHARS[suit], x + w * 0.16, y + w * 0.48);
    ctx.font = `${Math.round(w * 0.5)}px ${DISPLAY}`;
    ctx.fillText(SUIT_CHARS[suit], x + w / 2, y + h * 0.62);
  }

  draw(ctx, card, x, y, w, h) {
    const bitmap = this.bitmaps[card];
    if (bitmap) {
      try {
        ctx.drawImage(bitmap, x, y, w, h);
        return;
      } catch {
        this.bitmaps[card] = null;
      }
    }
    this.plain(ctx, card, x, y, w, h);
  }

  // rectFor(suit) liefert die Lage einer Ablage, onMove(card, x, y) bewegt die echte Karte,
  // onLand(card) blendet sie aus, sobald sie die Matte verlassen hat.
  // Liefert ein Versprechen, das endet, wenn alle Karten die Matte verlassen haben oder getippt wurde.
  async run({ rectFor, onMove, onLand }) {
    const calm = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    const interval = calm ? 420 : 240;
    const speed = calm ? 0.55 : 1;
    const canvas = document.createElement('canvas');
    canvas.className = 'celebration';
    this.table.appendChild(canvas);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const tw = this.table.clientWidth;
    const th = this.table.clientHeight;
    canvas.width = Math.round(tw * dpr);
    canvas.height = Math.round(th * dpr);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const order = [];
    for (let rank = 13; rank >= 1; rank--) for (let suit = 0; suit < 4; suit++) order.push(suit * 13 + rank - 1);

    const stopOnTap = () => this.stop();
    canvas.addEventListener('pointerdown', stopOnTap);
    this.running = true;
    this.launched = 0;
    this.leftover = [];
    const flying = [];
    let next = 0;
    let start = null;
    let lastFrame = null;
    const scale = rectFor(0).w / 60;

    await new Promise((resolve) => {
      const frame = (now) => {
        if (!this.running) return resolve();
        // Gleich schnell bei 60 und 120 Bildern pro Sekunde
        const step = lastFrame === null ? 1 : Math.min(3, (now - lastFrame) / 16.7);
        lastFrame = now;
        // Starts nach der Uhr: dauert ein Bild länger (langsames Gerät), starten mehrere Karten
        // auf einmal, statt dass die Feier ins Stocken gerät
        if (start === null) start = now - interval;
        while (next < order.length && now - start >= (next + 1) * interval) {
          const card = order[next++];
          const r = rectFor(Math.floor(card / 13));
          const dir = r.x + r.w / 2 > tw / 2 ? -1 : 1;
          flying.push({
            card, x: r.x, y: r.y, w: r.w, h: r.h,
            vx: dir * (1.4 + Math.random() * 2.6) * scale * speed,
            vy: -(Math.random() * 4) * scale * speed,
          });
          this.launched += 1;
        }
        if (calm) {
          ctx.clearRect(0, 0, tw, th);
        } else {
          // Spuren langsam verblassen lassen
          ctx.globalCompositeOperation = 'destination-out';
          ctx.fillStyle = `rgba(0,0,0,${Math.min(1, 0.035 * step)})`;
          ctx.fillRect(0, 0, tw, th);
          ctx.globalCompositeOperation = 'source-over';
        }
        for (let i = flying.length - 1; i >= 0; i--) {
          const f = flying[i];
          f.vy += 0.42 * scale * speed * speed * step;
          f.x += f.vx * step;
          f.y += f.vy * step;
          if (f.y + f.h > th) {
            f.y = th - f.h;
            f.vy = -f.vy * (calm ? 0.6 : 0.78);
          }
          // Die echte Karte fliegt, dahinter bleibt ihr Abdruck als Spur
          if (!calm) this.draw(ctx, f.card, f.x, f.y, f.w, f.h);
          safely(() => onMove(f.card, f.x, f.y));
          if (f.x + f.w < 0 || f.x > tw) {
            flying.splice(i, 1);
            safely(() => onLand(f.card));
          }
        }
        if (next >= order.length && flying.length === 0) return resolve();
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });

    this.running = false;
    // Abgebrochen: Karten, die noch unterwegs sind, ruft die Feier bewusst nicht mehr an.
    // Ob sie verschwinden, entscheidet der Aufrufer, denn inzwischen kann ein neues Spiel liegen.
    this.leftover = flying.map((f) => f.card);
    canvas.removeEventListener('pointerdown', stopOnTap);
    canvas.classList.add('fade');
    setTimeout(() => canvas.remove(), 600);
  }
}
