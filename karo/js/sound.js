// Klänge von KARO: Papier statt Keramik. Karten schnippen, gleiten und landen auf der Leinenmatte.
// Auf den Ablagen klingt zusätzlich der Keramikton der Sammlung, der mit dem Fortschritt steigt.
// Baut auf der Klang-Engine der Hülle auf.

import { SoundEngine, stepFrequency } from '../../shared/js/sound-engine.js?shell=1.5.0';

export class KaroSound extends SoundEngine {
  // Gefiltertes Rauschen mit Hüllkurve: der Grundbaustein für Papier
  paper(t, { gain = 0.2, freq = 3000, to = null, q = 0.8, attack = 0.003, length = 0.05, type = 'bandpass' } = {}) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(freq, t);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + length);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + length);
    src.connect(f).connect(g).connect(this.bus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + length + 0.02);
  }

  // Karte vom Stapel ziehen: kurzes, helles Schnippen
  draw(count = 1) {
    if (!this.ready()) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < count; i++) {
      this.paper(t + i * 0.045, { gain: 0.16 * this.vary(0.2), freq: 2600 * this.vary(0.1), to: 5200, length: 0.06 });
    }
  }

  // Karte landet auf der Matte: weicher, tiefer Anschlag
  place({ soft = false } = {}) {
    if (!this.ready()) return;
    const t = this.ctx.currentTime;
    const v = (soft ? 0.5 : 1) * this.vary(0.15);
    this.paper(t, { gain: 0.32 * v, freq: 700 * this.vary(0.1), type: 'lowpass', q: 0.5, length: 0.07 });
    this.paper(t, { gain: 0.07 * v, freq: 4200, length: 0.025 });
    this.wood(t, 0.12 * this.preset.wood * v, 160 * this.vary(0.05), 0.04);
  }

  // Verdeckte Karte umdrehen
  flip() {
    if (!this.ready()) return;
    const t = this.ctx.currentTime;
    this.paper(t, { gain: 0.1, freq: 1800, to: 3600, length: 0.05 });
    this.paper(t + 0.06, { gain: 0.12, freq: 900, type: 'lowpass', length: 0.05 });
  }

  // Karte auf die Ablage: Anschlag plus Keramikton. progress von 0 bis 1 hebt die Tonhöhe.
  found(progress = 0) {
    if (!this.ready()) return;
    this.place({ soft: true });
    const t = this.ctx.currentTime + 0.01;
    const step = Math.round(Math.min(1, Math.max(0, progress)) * 9);
    this.ceramic(t, 0.3 * this.preset.ceramic * this.vary(0.08), stepFrequency(step) * this.vary(0.01), 0.9);
  }

  // Stapel neu durchlaufen: die Karten gleiten zurück
  recycle() {
    if (!this.ready()) return;
    const t = this.ctx.currentTime;
    this.paper(t, { gain: 0.14, freq: 600, to: 2400, length: 0.28, attack: 0.08, q: 0.6 });
    this.place({ soft: true });
  }

  // Neues Spiel: Mischen wie beim Riffeln, dann Geben
  shuffle() {
    if (!this.ready()) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 14; i++) {
      this.paper(t + i * 0.028 * this.vary(0.2), { gain: 0.07 * this.vary(0.3), freq: 2200 * this.vary(0.25), length: 0.03 });
    }
    this.paper(t + 0.42, { gain: 0.22, freq: 600, type: 'lowpass', length: 0.08 });
  }
}
