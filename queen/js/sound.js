// Klänge von QUEEN: Steine setzen, schlagen und gekrönt werden.
// Baut auf der Klang-Engine der Hülle auf, die auch die Klänge der Schalen (rim, clack) liefert.

import { SoundEngine, stepFrequency } from '../../shared/js/sound-engine.js?shell=1.4.0';

export class QueenSound extends SoundEngine {
  // Stein anheben: weiches Tippen
  lift() {
    if (!this.ready()) return;
    const t = this.ctx.currentTime;
    this.transient(t, 0.1 * this.vary(0.2), 5000);
    this.ceramic(t, 0.06, stepFrequency(13) * this.vary(0.02), 0.4, 1);
  }

  // Stein landet. progress von 0 (Anfang) bis 1 (wenige Steine übrig)
  place(progress = 0, options = {}) {
    this.tap(progress, options);
  }

  // Ein Schlag im Sprung: kräftigeres Holz, Keramik etwas höher, steigt bei Mehrfachschlag
  hop(index = 0) {
    if (!this.ready()) return;
    const p = this.preset;
    const t = this.ctx.currentTime;
    this.transient(t, 0.38 * this.vary(0.1));
    this.wood(t, 0.95 * p.wood * this.vary(0.08), 175, 0.07);
    this.ceramic(t + 0.002, 0.42 * p.ceramic, stepFrequency(5 + index * 2) * this.vary(0.015), 1.1);
  }

  // Krönung: heller Glockenklang mit zwei Obertönen
  crown() {
    if (!this.ready()) return;
    const t = this.ctx.currentTime + 0.04;
    [10, 12, 15].forEach((step, i) => {
      this.ceramic(t + i * 0.09, 0.13 * this.preset.ceramic + 0.04, stepFrequency(step), 2.6, 2);
    });
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
