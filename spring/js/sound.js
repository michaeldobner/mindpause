// Klänge von SPRING: Murmeln heben sich, springen und rollen in den Rand.
// Baut auf der Klang-Engine der Hülle auf, die auch die Klänge im Rand (rim, clack) liefert.

import { SoundEngine, stepFrequency } from '../../shared/js/sound-engine.js?shell=1.4.0';

export class SpringSound extends SoundEngine {
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

  // Murmel landet im Rand
  gutter() {
    this.rim();
  }
}
