// Klang-Engine für alle Spiele: Keramik auf Holz, live im Browser erzeugt.
// Spiele erweitern die Klasse SoundEngine um ihre eigenen Klänge.
//
// Ein Setzklang (tap) besteht aus vier Schichten:
//   1. Anschlag   sehr kurzes, helles Rauschen (Kontakt)
//   2. Holz       tiefer, schnell abklingender Ton (Wärme)
//   3. Keramik    drei leicht unharmonische Obertöne (Klingen)
//   4. Raum       kurzer, künstlicher Raumklang (Weite)
// Die Keramik ist auf eine pentatonische Tonleiter gestimmt und steigt mit dem Fortschritt.

const PENTATONIC = [0, 2, 4, 7, 9]; // Dur-Pentatonik in Halbtönen
const BASE_HZ = 523.25; // c''
const CERAMIC_RATIOS = [1, 2.76, 5.4];
const CERAMIC_GAINS = [1, 0.32, 0.1];
const CERAMIC_DECAYS = [0.16, 0.085, 0.045];

export const SOUND_STYLES = {
  warm: { wood: 1.0, ceramic: 0.55, room: 0.1, tone: 7000 },
  clear: { wood: 0.55, ceramic: 1.0, room: 0.09, tone: 10000 },
  soft: { wood: 0.75, ceramic: 0.6, room: 0.24, tone: 5200 },
};

export const DEFAULT_STYLE = 'warm';

// Tonhöhe einer Stufe auf der pentatonischen Leiter
export function stepFrequency(step) {
  const octave = Math.floor(step / PENTATONIC.length);
  const semis = 12 * octave + PENTATONIC[((step % 5) + 5) % 5];
  return BASE_HZ * Math.pow(2, semis / 12);
}

export class SoundEngine {
  constructor({ enabled = true, style = DEFAULT_STYLE } = {}) {
    this.enabled = enabled;
    this.style = SOUND_STYLES[style] ? style : DEFAULT_STYLE;
    this.ctx = null;
  }

  get preset() {
    return SOUND_STYLES[this.style];
  }

  setStyle(style) {
    if (!SOUND_STYLES[style]) return;
    this.style = style;
    if (this.ctx) this.applyStyle();
  }

  // iOS gibt Ton nur bei bestimmten Berührungen frei (Loslassen des Fingers, vollständiger Tipp),
  // und hält ihn nach einem App-Wechsel wieder an. Deshalb wird bei jeder solchen Berührung
  // geprüft und bei Bedarf fortgesetzt. Der Lautlos-Schalter wird respektiert.
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        if (navigator.audioSession) navigator.audioSession.type = 'ambient';
      } catch {
        // Ältere Systeme kennen audioSession nicht
      }
      this.setup(new AC());
    }
    if (this.ctx.state !== 'running') {
      try {
        this.ctx.resume();
        // Ein stiller, sofort gestarteter Klang schaltet Safari zuverlässig frei
        const buf = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        src.connect(this.ctx.destination);
        src.start(0);
      } catch {
        // Nächste Berührung versucht es erneut
      }
    }
  }

  // Aufbau der Signalkette, auch für Tests mit OfflineAudioContext nutzbar
  setup(ctx) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.8;

    this.tone = ctx.createBiquadFilter();
    this.tone.type = 'lowpass';
    this.tone.Q.value = 0.5;

    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -18;
    this.comp.knee.value = 12;
    this.comp.ratio.value = 3;
    this.comp.attack.value = 0.003;
    this.comp.release.value = 0.12;

    this.dry = ctx.createGain();
    this.wet = ctx.createGain();
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.impulse(0.55);

    this.bus = ctx.createGain(); // alle Klänge laufen hier hinein
    this.bus.connect(this.dry).connect(this.tone);
    this.bus.connect(this.reverb).connect(this.wet).connect(this.tone);
    this.tone.connect(this.comp).connect(this.master).connect(ctx.destination);

    this.noise = this.noiseBuffer(1);
    this.applyStyle();
  }

  applyStyle() {
    const p = this.preset;
    const t = this.ctx.currentTime;
    this.wet.gain.setTargetAtTime(p.room, t, 0.05);
    this.dry.gain.setTargetAtTime(1 - p.room * 0.5, t, 0.05);
    this.tone.frequency.setTargetAtTime(p.tone, t, 0.05);
  }

  // Künstlicher kleiner Raum: abklingendes, nach oben weicher werdendes Rauschen in Stereo
  impulse(seconds) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const x = i / len;
        lp += ((Math.random() * 2 - 1) - lp) * (0.6 - 0.45 * x);
        d[i] = lp * Math.pow(1 - x, 3.2) * (i < ctx.sampleRate * 0.004 ? i / (ctx.sampleRate * 0.004) : 1);
      }
    }
    return buf;
  }

  noiseBuffer(seconds) {
    const ctx = this.ctx;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  ready() {
    return this.enabled && this.ctx && this.ctx.state !== 'closed';
  }

  // ---------- Bausteine ----------

  // Kurzer Anschlag
  transient(t, gain, freq = 3500) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.004);
    src.connect(hp).connect(g).connect(this.bus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + 0.01);
  }

  // Warmer Holzkörper
  wood(t, gain, freq = 190, decay = 0.06) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.15, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.85, t + decay);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    osc.connect(g).connect(this.bus);
    osc.start(t);
    osc.stop(t + decay + 0.02);
  }

  // Klingende Keramik mit drei Teiltönen
  ceramic(t, gain, freq, length = 1, partials = 3) {
    const ctx = this.ctx;
    for (let k = 0; k < partials; k++) {
      const f = freq * CERAMIC_RATIOS[k];
      if (f > 16000) continue;
      const decay = CERAMIC_DECAYS[k] * length;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain * CERAMIC_GAINS[k], t + 0.0015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      osc.connect(g).connect(this.bus);
      osc.start(t);
      osc.stop(t + decay + 0.02);
    }
  }

  vary(amount) {
    return 1 + (Math.random() * 2 - 1) * amount;
  }

  // ---------- Klänge für alle Spiele ----------

  // Ein Stein oder eine Murmel wird gesetzt. progress von 0 (Start) bis 1 (Ende) hebt die Tonhöhe.
  tap(progress = 0, { soft = false } = {}) {
    if (!this.ready()) return;
    const p = this.preset;
    const t = this.ctx.currentTime;
    const level = (soft ? 0.55 : 1) * this.vary(0.12);
    const step = Math.round(Math.min(1, Math.max(0, progress)) * 9);
    const pitch = stepFrequency(soft ? step - 2 : step) * this.vary(0.02);
    this.transient(t, 0.34 * level);
    this.wood(t, 0.9 * p.wood * level, 190 * this.vary(0.03));
    this.ceramic(t + 0.001, 0.45 * p.ceramic * level, pitch, soft ? 0.7 : 1);
  }

  // Teile im Rand stoßen aneinander. intensity von 0 bis 1, höchstens 8 Klicks pro Sekunde
  clack(intensity) {
    if (!this.ready() || intensity < 0.06) return;
    const now = performance.now();
    this.clickTimes = (this.clickTimes || []).filter((x) => now - x < 1000);
    if (this.clickTimes.length >= 8 || now - (this.lastClick || 0) < 45) return;
    this.clickTimes.push(now);
    this.lastClick = now;
    const t = this.ctx.currentTime;
    const v = Math.min(1, intensity);
    const step = 10 + Math.floor(Math.random() * 5);
    this.transient(t, 0.3 * v, 4500);
    this.ceramic(t, 0.5 * v * this.preset.ceramic, stepFrequency(step), 0.35, 2);
  }

  // Ein Teil landet im Rand
  rim() {
    if (!this.ready()) return;
    const t = this.ctx.currentTime;
    this.wood(t, 0.4 * this.preset.wood, 150, 0.08);
    this.ceramic(t, 0.16 * this.preset.ceramic, stepFrequency(12) * this.vary(0.02), 0.5, 2);
  }

  // Ungültiger Zug: zwei gedämpfte Holzklopfer
  invalid() {
    if (!this.ready()) return;
    const t = this.ctx.currentTime;
    this.wood(t, 0.1 * this.preset.wood + 0.04, 135, 0.05);
    this.wood(t + 0.09, 0.075 * this.preset.wood + 0.03, 125, 0.05);
  }

  // Gelöst: aufsteigender Dreiklang, bei perfekter Lösung mit Glockenton
  win(perfect = false) {
    if (!this.ready()) return;
    const t = this.ctx.currentTime + 0.05;
    [0, 2, 3, 5].forEach((step, i) => {
      if (i === 3 && !perfect) return;
      const at = t + i * 0.13;
      this.wood(at, 0.13 * this.preset.wood, 190, 0.06);
      this.ceramic(at, 0.16 * this.preset.ceramic, stepFrequency(step + 5), 2.2);
    });
    if (perfect) this.ceramic(t + 0.55, 0.1, stepFrequency(15), 4, 2);
  }

  // Kurze Vorschau einer Klangfarbe in den Einstellungen
  preview() {
    if (!this.ready()) return;
    [0, 0.33, 0.66].forEach((p, i) => setTimeout(() => this.tap(p), i * 190));
  }
}
