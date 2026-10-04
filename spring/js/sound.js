// Klänge von SPRING: Murmeln springen, rollen in den Rand und stoßen dort aneinander.
// Baut auf der Klang-Engine der Hülle auf.

import { SoundEngine, stepFrequency } from '../../shared/js/sound-engine.js?shell=1.0.0';

export class SpringSound extends SoundEngine {
  constructor(options) {
    super(options);
    this.lastClick = 0;
    this.clickTimes = [];
  }

  // Murmel anheben: fast unhörbares, weiches Tippen
  lift() {
    if (!this.ready()) return;
    const t = this.ctx.currentTime;
    this.transient(t, 0.12 * this.vary(0.2), 5000);
    this.ceramic(t, 0.08, stepFrequency(14) * this.vary(0.02), 0.4, 1);
  }

  // Sprung landet. progress von 0 (Start) bis 1 (letzte Murmel)
  land(progress = 0, options = {}) {
    this.tap(progress, options);
  }

  // Murmeln im Rand stoßen aneinander. intensity von 0 bis 1, höchstens 8 Klicks pro Sekunde
  clack(intensity) {
    if (!this.ready() || intensity < 0.06) return;
    const now = performance.now();
    this.clickTimes = this.clickTimes.filter((x) => now - x < 1000);
    if (this.clickTimes.length >= 8 || now - this.lastClick < 45) return;
    this.clickTimes.push(now);
    this.lastClick = now;
    const t = this.ctx.currentTime;
    const v = Math.min(1, intensity);
    const step = 10 + Math.floor(Math.random() * 5);
    this.transient(t, 0.3 * v, 4500);
    this.ceramic(t, 0.5 * v * this.preset.ceramic, stepFrequency(step), 0.35, 2);
  }

  // Murmel landet im Rand
  gutter() {
    if (!this.ready()) return;
    const t = this.ctx.currentTime;
    this.wood(t, 0.4 * this.preset.wood, 150, 0.08);
    this.ceramic(t, 0.16 * this.preset.ceramic, stepFrequency(12) * this.vary(0.02), 0.5, 2);
  }
}
