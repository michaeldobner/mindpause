// Klänge von BLOCKS: Keramiksteine auf dem Nachtblau der Sammlung.
// Anheben wie bei SPRING, Ablegen mit dem Keramikton der Sammlung, der mit der Füllung des
// Bretts steigt. Verschwindende Linien klingen aufsteigend, mit der Serie höher.
// Baut auf der Klang-Engine der Hülle auf.

import { SoundEngine, stepFrequency } from '../../shared/js/sound-engine.js?shell=1.5.0';

export class BlocksSound extends SoundEngine {
  // Höchstens ein Klang dieser Art alle ms Millisekunden
  limit(name, ms) {
    const now = performance.now();
    this.lastAt = this.lastAt || {};
    if (now - (this.lastAt[name] || 0) < ms) return false;
    this.lastAt[name] = now;
    return true;
  }

  // Stein vom Tablett anheben: fast unhörbares, weiches Tippen
  lift() {
    if (!this.ready()) return;
    const t = this.ctx.currentTime;
    this.transient(t, 0.1 * this.vary(0.2), 5000);
    this.ceramic(t, 0.07, stepFrequency(14) * this.vary(0.02), 0.4, 1);
  }

  // Der Stein rastet über einem neuen Platz ein: sehr leiser, heller Klick
  snap() {
    if (!this.ready() || !this.limit('snap', 40)) return;
    const t = this.ctx.currentTime;
    this.transient(t, 0.04 * this.vary(0.2), 6500);
    this.wood(t, 0.05 * this.preset.wood, 520 * this.vary(0.04), 0.02);
  }

  // Stein liegt. progress von 0 bis 1: wie voll das Brett ist
  place(progress = 0, size = 4) {
    this.tap(Math.min(1, progress), { soft: size <= 2 });
  }

  // Kein Platz: der Stein gleitet zurück aufs Tablett
  back() {
    this.invalid();
  }

  // Linien verschwinden: je Linie ein Keramikton, aufsteigend, mit der Serie höher.
  // Ab drei Linien und bei Leer geräumt schließt eine Glocke.
  clear(lines, { streak = 1, perfect = false } = {}) {
    if (!this.ready() || !lines) return;
    const p = this.preset;
    const t = this.ctx.currentTime + 0.04;
    const base = 2 + Math.min(Math.max(streak - 1, 0), 7);
    const n = Math.min(lines, 6);
    for (let i = 0; i < n; i++) {
      const at = t + i * 0.07;
      this.wood(at, 0.12 * p.wood, 210, 0.05);
      this.ceramic(at, 0.26 * p.ceramic * this.vary(0.05), stepFrequency(base + i * 2), 1.5);
    }
    if (lines >= 3 || perfect) this.ceramic(t + n * 0.07 + 0.05, 0.12 + 0.05 * p.ceramic, stepFrequency(base + 10), 3.2, 2);
  }

  // Drei neue Steine: drei leise Tipps
  refill() {
    if (!this.ready()) return;
    const t = this.ctx.currentTime + 0.08;
    [0, 1, 2].forEach((i) => {
      this.transient(t + i * 0.07, 0.05, 5200);
      this.ceramic(t + i * 0.07, 0.04, stepFrequency(11 + i) * this.vary(0.02), 0.35, 1);
    });
  }

  // Kein Stein passt mehr: zwei ruhige, absteigende Töne
  lose() {
    if (!this.ready()) return;
    const t = this.ctx.currentTime + 0.05;
    [4, 1].forEach((step, i) => {
      this.wood(t + i * 0.22, 0.12 * this.preset.wood, 150, 0.09);
      this.ceramic(t + i * 0.22, 0.12 * this.preset.ceramic, stepFrequency(step), 1.8);
    });
  }

  // Modus Ruhe: das Brett räumt sich mit einem langsam absteigenden Lauf auf
  calmClear() {
    if (!this.ready()) return;
    const t = this.ctx.currentTime + 0.05;
    [9, 7, 5, 4, 2].forEach((step, i) => {
      this.ceramic(t + i * 0.12, 0.09 * this.preset.ceramic + 0.02, stepFrequency(step), 2.2, 2);
    });
  }
}
