// Klänge von MÜHLE: Steine setzen und ziehen, Mühle schließen, Steine nehmen.
// Baut auf der Klang-Engine der Hülle auf, die auch die Klänge der Schalen (rim, clack) liefert.

import { SoundEngine, stepFrequency } from '../../shared/js/sound-engine.js?shell=1.5.0';

export class MuehleSound extends SoundEngine {
  // Stein anheben: weiches Tippen
  lift() {
    if (!this.ready()) return;
    const t = this.ctx.currentTime;
    this.transient(t, 0.1 * this.vary(0.2), 5000);
    this.ceramic(t, 0.06, stepFrequency(13) * this.vary(0.02), 0.4, 1);
  }

  // Stein landet auf einem Punkt. progress von 0 (Anfang) bis 1 (wenige Steine übrig)
  place(progress = 0, options = {}) {
    this.tap(progress, options);
  }

  // Mühle geschlossen: zwei helle Glockentöne, bei einer Doppelmühle ein dritter darüber
  mill(count = 1) {
    if (!this.ready()) return;
    const t = this.ctx.currentTime + 0.02;
    const steps = count > 1 ? [8, 12, 15] : [8, 12];
    steps.forEach((step, i) => {
      this.ceramic(t + i * 0.08, 0.12 * this.preset.ceramic + 0.04, stepFrequency(step), 2.4, 2);
    });
  }

  // Stein wird genommen: kräftiges Holz, Keramik etwas tiefer
  take() {
    if (!this.ready()) return;
    const p = this.preset;
    const t = this.ctx.currentTime;
    this.transient(t, 0.3 * this.vary(0.1));
    this.wood(t, 0.85 * p.wood * this.vary(0.08), 165, 0.07);
    this.ceramic(t + 0.002, 0.36 * p.ceramic, stepFrequency(3) * this.vary(0.015), 1.1);
  }

  // Verloren: zwei ruhige, absteigende Töne
  lose() {
    if (!this.ready()) return;
    const t = this.ctx.currentTime + 0.05;
    [4, 1].forEach((step, i) => {
      this.wood(t + i * 0.2, 0.12 * this.preset.wood, 160, 0.08);
      this.ceramic(t + i * 0.2, 0.12 * this.preset.ceramic, stepFrequency(step), 1.8);
    });
  }
}
