// Die Siegesfeier: eine ruhige Hommage an Windows. Die Karten springen nacheinander von den
// Ablagen, hüpfen über die Matte und ziehen eine Spur, die langsam verblasst.
// Ein Tipp auf die Matte beendet die Feier.

import { cardSvg } from './faces.js?v=1.0.0';

export class Celebration {
  constructor(table, lang) {
    this.table = table;
    this.lang = lang;
    this.images = null;
    this.running = false;
  }

  // Bilder aller Karten einmal vorbereiten
  async prepare() {
    if (this.images) return this.images;
    this.images = await Promise.all(Array.from({ length: 52 }, (_, c) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cardSvg(c, this.lang))}`;
    })));
    return this.images;
  }

  stop() {
    this.running = false;
  }

  // rectFor(suit) liefert die Lage einer Ablage, onLaunch(card) blendet die Karte dort aus
  async run({ rectFor, onLaunch, interval = 240 }) {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const images = await this.prepare();
    const canvas = document.createElement('canvas');
    canvas.className = 'celebration';
    this.table.appendChild(canvas);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const tw = this.table.clientWidth;
    const th = this.table.clientHeight;
    canvas.width = tw * dpr;
    canvas.height = th * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const order = [];
    for (let rank = 13; rank >= 1; rank--) for (let suit = 0; suit < 4; suit++) order.push(suit * 13 + rank - 1);

    const stopOnTap = () => this.stop();
    canvas.addEventListener('pointerdown', stopOnTap);
    this.running = true;
    const flying = [];
    let next = 0;
    let lastLaunch = -Infinity;
    const scale = rectFor(0).w / 60;

    await new Promise((resolve) => {
      const frame = (now) => {
        if (!this.running) return resolve();
        if (next < order.length && now - lastLaunch > interval) {
          const card = order[next++];
          const r = rectFor(Math.floor(card / 13));
          const dir = r.x + r.w / 2 > tw / 2 ? -1 : 1;
          flying.push({
            card, x: r.x, y: r.y, w: r.w, h: r.h,
            vx: dir * (1.4 + Math.random() * 2.6) * scale,
            vy: -(Math.random() * 4) * scale,
          });
          onLaunch(card);
          lastLaunch = now;
        }
        // Spuren verblassen lassen
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,0.035)';
        ctx.fillRect(0, 0, tw, th);
        ctx.globalCompositeOperation = 'source-over';
        for (let i = flying.length - 1; i >= 0; i--) {
          const f = flying[i];
          f.vy += 0.42 * scale;
          f.x += f.vx;
          f.y += f.vy;
          if (f.y + f.h > th) {
            f.y = th - f.h;
            f.vy = -f.vy * 0.78;
          }
          const img = images[f.card];
          if (img) ctx.drawImage(img, f.x, f.y, f.w, f.h);
          if (f.x + f.w < 0 || f.x > tw) flying.splice(i, 1);
        }
        if (next >= order.length && flying.length === 0) return resolve();
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });

    this.running = false;
    canvas.removeEventListener('pointerdown', stopOnTap);
    canvas.classList.add('fade');
    setTimeout(() => canvas.remove(), 600);
  }
}
