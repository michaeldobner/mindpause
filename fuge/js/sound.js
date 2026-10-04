// Klänge von FUGE: lackierte Holzsteine in einem Holzkasten.
// Verschieben klickt leise, Drehen klackt, Ablegen setzt sich mit dumpfem Holz.
// Verschwindende Reihen klingen mit dem Keramikton der Sammlung, der mit der Serie steigt.
// Baut auf der Klang-Engine der Hülle auf.

import { SoundEngine, stepFrequency } from '../../shared/js/sound-engine.js?shell=1.5.0';

export class FugeSound extends SoundEngine {
  // Höchstens ein Klang dieser Art alle ms Millisekunden, damit schnelle Eingaben nicht rattern
  limit(name, ms) {
    const now = performance.now();
    this.lastAt = this.lastAt || {};
    if (now - (this.lastAt[name] || 0) < ms) return false;
    this.lastAt[name] = now;
    return true;
  }

  // Gefiltertes Rauschen: Gleiten, Rutschen
  hiss(t, { gain = 0.1, freq = 1200, to = null, q = 0.7, attack = 0.004, length = 0.05, type = 'bandpass' } = {}) {
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

  // Ein Feld zur Seite: sehr leiser, heller Holzklick
  move() {
    if (!this.ready() || !this.limit('move', 28)) return;
    const t = this.ctx.currentTime;
    this.transient(t, 0.05 * this.vary(0.2), 6500);
    this.wood(t, 0.07 * this.preset.wood * this.vary(0.1), 460 * this.vary(0.04), 0.022);
  }

  // Drehen: zwei kurze Klacks, wie ein Stein, der in der Hand gewendet wird
  rotate(dir = 1) {
    if (!this.ready() || !this.limit('rotate', 30)) return;
    const t = this.ctx.currentTime;
    const p = this.preset;
    this.transient(t, 0.09 * this.vary(0.15), 4200);
    this.wood(t, 0.11 * p.wood, dir > 0 ? 330 : 300, 0.03);
    this.wood(t + 0.019, 0.06 * p.wood, dir > 0 ? 390 : 350, 0.024);
  }

  // Wand oder Stein im Weg: kaum hörbares, dumpfes Klopfen
  blocked() {
    if (!this.ready() || !this.limit('blocked', 90)) return;
    const t = this.ctx.currentTime;
    this.wood(t, 0.05 * this.preset.wood + 0.02, 140, 0.035);
  }

  // Schneller fallen: feines Rutschen
  slide() {
    if (!this.ready() || !this.limit('slide', 55)) return;
    this.hiss(this.ctx.currentTime, { gain: 0.025, freq: 2600, length: 0.035 });
  }

  // Stein setzt sich. progress von 0 bis 1 (Höhe des Stapels) färbt den Ton leicht
  lock({ hard = false, progress = 0 } = {}) {
    if (!this.ready()) return;
    const p = this.preset;
    let t = this.ctx.currentTime;
    if (hard) {
      // Kurzes Gleiten, dann das Aufsetzen
      this.hiss(t, { gain: 0.06, freq: 700, to: 2600, length: 0.045, attack: 0.012 });
      t += 0.03;
    }
    const v = (hard ? 1 : 0.62) * this.vary(0.1);
    this.transient(t, 0.2 * v, 2400);
    this.wood(t, 0.75 * p.wood * v, (hard ? 140 : 160) * this.vary(0.04), hard ? 0.09 : 0.07);
    this.wood(t + 0.004, 0.25 * p.wood * v, 290, 0.035);
    const step = Math.round(Math.min(1, Math.max(0, progress)) * 4);
    this.ceramic(t + 0.002, 0.07 * p.ceramic * v, stepFrequency(step - 5), 0.6, 2);
  }

  // Reihen verschwinden: je Reihe ein Keramikton, aufsteigend, mit der Serie höher.
  // Ein Quart schließt mit einer Glocke.
  clear(lines, { combo = 0, special = false } = {}) {
    if (!this.ready() || !lines) return;
    const p = this.preset;
    const t = this.ctx.currentTime + 0.02;
    const base = 2 + Math.min(Math.max(combo, 0), 7);
    this.hiss(t, { gain: 0.05, freq: 900, to: 300, length: 0.22, attack: 0.03, type: 'lowpass', q: 0.4 });
    for (let i = 0; i < lines; i++) {
      const at = t + i * 0.065;
      this.wood(at, 0.12 * p.wood, 210, 0.05);
      this.ceramic(at, 0.26 * p.ceramic * this.vary(0.05), stepFrequency(base + i * 2), 1.5);
    }
    if (lines === 4 || special) this.ceramic(t + lines * 0.065 + 0.05, 0.12 + 0.05 * p.ceramic, stepFrequency(base + 10), 3.2, 2);
  }

  // Halten: Stein wird angehoben und zur Seite gelegt
  hold() {
    if (!this.ready()) return;
    const t = this.ctx.currentTime;
    this.transient(t, 0.08, 5200);
    this.ceramic(t, 0.06, stepFrequency(13) * this.vary(0.02), 0.45, 1);
    this.wood(t + 0.06, 0.12 * this.preset.wood, 240, 0.04);
  }

  // Neue Stufe: drei ruhige, helle Töne
  levelUp() {
    if (!this.ready()) return;
    const t = this.ctx.currentTime + 0.12;
    [7, 9, 12].forEach((step, i) => {
      this.ceramic(t + i * 0.1, 0.1 * this.preset.ceramic + 0.04, stepFrequency(step), 2.4, 2);
    });
  }

  // Spielbeginn: ein weiches Setzen
  start() {
    this.tap(0.2, { soft: true });
  }

  // Kasten voll: zwei ruhige, absteigende Töne
  lose() {
    if (!this.ready()) return;
    const t = this.ctx.currentTime + 0.05;
    [4, 1].forEach((step, i) => {
      this.wood(t + i * 0.22, 0.12 * this.preset.wood, 150, 0.09);
      this.ceramic(t + i * 0.22, 0.12 * this.preset.ceramic, stepFrequency(step), 1.8);
    });
  }

  // Modus Ruhe: der Kasten leert sich mit einem langsam absteigenden Lauf
  calmClear() {
    if (!this.ready()) return;
    const t = this.ctx.currentTime + 0.05;
    [9, 7, 5, 4, 2].forEach((step, i) => {
      this.ceramic(t + i * 0.12, 0.09 * this.preset.ceramic + 0.02, stepFrequency(step), 2.2, 2);
    });
    this.hiss(t, { gain: 0.05, freq: 1800, to: 400, length: 0.7, attack: 0.15, q: 0.5 });
  }
}
