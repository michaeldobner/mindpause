// Bedienung von FUGE: Tastatur am Rechner, Gesten auf iPhone und iPad.
//
// Tastatur: Pfeile oder A/D verschieben (erst nach DAS Millisekunden wiederholt, dann alle ARR),
// ↓ oder S fällt schneller, Leertaste fällt ganz, ↑/X/W dreht rechts, Z/Q/Strg links, C/Shift hält,
// Escape oder P pausiert, Enter startet und setzt fort.
//
// Gesten auf der ganzen Bühne: Ziehen verschiebt Feld für Feld mit dem Finger (wie eine Ratsche),
// langsames Ziehen nach unten fällt schneller, schnelles Wischen nach unten fällt ganz,
// schnelles Wischen nach oben hält, Tippen dreht (linke Hälfte gegen, rechte im Uhrzeigersinn).
//
// Daumensteuerung (Einstellung, nur wenn der Kasten breit liegt): die ganze Fläche links und rechts
// neben der Wanne wird zu großen Tippzonen für zwei Daumen. Links verschiebt, solange der Daumen
// liegt (außen nach links, innen nach rechts). Rechts dreht ein Tipp (innen gegen, außen im
// Uhrzeigersinn), Wischen nach unten lässt fallen, nach oben hält. Beide Daumen gleichzeitig gehen.

export const DAS = 0.17;
export const ARR = 0.05;
const TAP_SLOP = 10;
const TAP_TIME = 280;
const FLICK_DOWN = 0.85; // Pixel pro Millisekunde
const FLICK_UP = 0.7;
const ZONE_SWIPE = 36; // Pixel, ab denen ein Daumen rechts als Wisch zählt

const KEYS = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowDown: 'soft', KeyS: 'soft',
  Space: 'hard',
  ArrowUp: 'cw', KeyX: 'cw', KeyW: 'cw', KeyE: 'cw',
  KeyZ: 'ccw', KeyY: 'ccw', KeyQ: 'ccw', ControlLeft: 'ccw', ControlRight: 'ccw',
  KeyC: 'hold', ShiftLeft: 'hold', ShiftRight: 'hold',
  Escape: 'pause', KeyP: 'pause',
  Enter: 'confirm', NumpadEnter: 'confirm',
};

export class Input {
  // target: Element für Gesten. actions: { move(dx), rotate(dir), soft(on), step(), hard(), hold(), pause(), confirm(), tap(), active() }
  constructor(target, actions, metrics) {
    this.target = target;
    this.actions = actions;
    this.metrics = metrics;
    this.held = { left: false, right: false };
    this.dir = 0; // zuletzt gedrückte Richtung gewinnt
    this.dasTimer = 0;
    this.arrTimer = 0;
    this.touch = null;
    this.zones = new Map(); // Daumen in den Zonen: pointerId -> { side, dir, x0, y0 }
    this.lastPointer = 'mouse';
    this.bindKeys();
    this.bindTouch();
    this.bindThumbs();
  }

  act(name, ...args) {
    const fn = this.actions[name];
    return fn ? fn(...args) : undefined;
  }

  // ---------- Tastatur ----------

  bindKeys() {
    window.addEventListener('keydown', (e) => {
      const action = KEYS[e.code];
      if (!action || e.metaKey || e.altKey) return;
      // Blätter der Hülle offen: nur Escape, das schließt die Hülle selbst
      if (document.body.classList.contains('open-settings') || document.body.classList.contains('open-levels')) return;
      // Ergebniskarte sichtbar: Tasten gehören deren Schaltflächen
      if (!this.act('keysAllowed')) return;
      e.preventDefault();
      // Fokus von Schaltflächen nehmen, damit die Leertaste nicht „Neu“ erneut auslöst
      if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
      this.lastPointer = 'keys';
      if (e.repeat && action !== 'left' && action !== 'right') return;
      if (action === 'left' || action === 'right') {
        if (e.repeat) return;
        const dx = action === 'left' ? -1 : 1;
        this.held[action] = true;
        this.dir = dx;
        this.dasTimer = 0;
        this.arrTimer = 0;
        this.act('move', dx);
      } else if (action === 'soft') this.act('soft', true);
      else if (action === 'hard') this.act('hard');
      else if (action === 'cw') this.act('rotate', 1);
      else if (action === 'ccw') this.act('rotate', -1);
      else if (action === 'hold') this.act('hold');
      else if (action === 'pause') this.act('pause');
      else if (action === 'confirm') this.act('confirm');
    }, { capture: true });

    window.addEventListener('keyup', (e) => {
      const action = KEYS[e.code];
      if (action === 'left' || action === 'right') {
        this.held[action] = false;
        this.restoreDir();
      } else if (action === 'soft') this.act('soft', false);
    });

    // Fenster verlässt den Fokus: keine Taste bleibt hängen
    window.addEventListener('blur', () => this.release());
  }

  release() {
    this.held = { left: false, right: false };
    this.zones.clear();
    this.dir = 0;
    this.act('soft', false);
  }

  // Richtung nach dem Loslassen: ein anderer Daumen oder eine Taste, die noch liegt, gewinnt
  restoreDir() {
    const thumb = [...this.zones.values()].reverse().find((z) => z.dir);
    if (thumb) this.dir = thumb.dir;
    else if (this.held.left) this.dir = -1;
    else if (this.held.right) this.dir = 1;
    else this.dir = 0;
    this.dasTimer = 0;
    this.arrTimer = 0;
  }

  // Wiederholung beim Gedrückthalten, einmal pro Bild aufgerufen
  update(dt) {
    if (!this.dir) return;
    this.dasTimer += dt;
    if (this.dasTimer < DAS) return;
    this.arrTimer += dt;
    let n = 0;
    while (this.arrTimer >= ARR && n < 10) {
      this.arrTimer -= ARR;
      n++;
      if (!this.act('move', this.dir)) {
        this.arrTimer = 0;
        break;
      }
    }
  }

  // ---------- Gesten ----------

  bindTouch() {
    const el = this.target;
    el.addEventListener('pointerdown', (e) => {
      if (e.button > 0 || this.touch) return;
      if (e.target.closest('.result, .toast')) return;
      this.lastPointer = e.pointerType === 'touch' || e.pointerType === 'pen' ? 'touch' : 'mouse';
      const m = this.metrics();
      this.touch = {
        id: e.pointerId,
        x0: e.clientX,
        y0: e.clientY,
        ax: e.clientX,
        ay: e.clientY,
        t0: performance.now(),
        mode: null,
        moved: false,
        step: Math.max(16, m.cell * 0.92),
        samples: [{ t: performance.now(), x: e.clientX, y: e.clientY }],
        onHold: e.clientX >= m.hold.left && e.clientX <= m.hold.right && e.clientY >= m.hold.top && e.clientY <= m.hold.bottom,
        mid: (m.well.left + m.well.right) / 2,
      };
      try { el.setPointerCapture(e.pointerId); } catch { /* ältere Browser */ }
    });

    el.addEventListener('pointermove', (e) => {
      const t = this.touch;
      if (!t || e.pointerId !== t.id) return;
      const now = performance.now();
      t.samples.push({ t: now, x: e.clientX, y: e.clientY });
      while (t.samples.length > 3 && now - t.samples[0].t > 300) t.samples.shift();
      if (!this.act('active')) return;
      const totalX = e.clientX - t.x0;
      const totalY = e.clientY - t.y0;
      if (!t.mode && Math.hypot(totalX, totalY) > TAP_SLOP) t.mode = Math.abs(totalX) >= Math.abs(totalY) ? 'h' : 'v';
      if (!t.mode) return;

      // Waagerecht: ein Feld pro Schritt des Fingers. Beim Ziehen nach unten etwas träger,
      // damit ein leicht schräger Wisch den Stein nicht versehentlich verschiebt.
      const hStep = t.mode === 'v' ? t.step * 1.6 : t.step;
      let dx = e.clientX - t.ax;
      while (Math.abs(dx) >= hStep) {
        const dir = Math.sign(dx);
        this.act('move', dir);
        t.ax += dir * hStep;
        dx -= dir * hStep;
        t.moved = true;
      }
      // Senkrecht nach unten: Reihe für Reihe mit dem Finger
      if (t.mode === 'h' && e.clientY - t.ay > t.step * 2.5) t.mode = 'v';
      if (t.mode === 'v') {
        let dy = e.clientY - t.ay;
        while (dy >= t.step) {
          this.act('step');
          t.ay += t.step;
          dy -= t.step;
          t.moved = true;
        }
        if (dy < -t.step) t.ay = e.clientY; // nach oben zurück: Anker nachziehen
      }
    });

    const end = (e) => {
      const t = this.touch;
      if (!t || e.pointerId !== t.id) return;
      this.touch = null;
      if (e.type !== 'pointerup') return;
      const now = performance.now();
      const dxTotal = e.clientX - t.x0;
      const dyTotal = e.clientY - t.y0;
      // Höchste Geschwindigkeit kurz vor dem Loslassen: zählt jedes Paar von Messpunkten, dessen
      // späterer Punkt in den letzten 150 ms liegt. Ein Wisch zählt, solange der Finger beim
      // Loslassen noch in Bewegung ist.
      t.samples.push({ t: now, x: e.clientX, y: e.clientY });
      let vy = 0;
      for (let i = 1; i < t.samples.length; i++) {
        const a = t.samples[i - 1];
        const b = t.samples[i];
        if (now - b.t > 150) continue;
        const v = (b.y - a.y) / Math.max(8, b.t - a.t);
        if (Math.abs(v) > Math.abs(vy)) vy = v;
      }
      // Lange, zügige Wische zählen auch, wenn einzelne Messpunkte fehlen
      const average = dyTotal / Math.max(16, now - t.t0);

      // Start und Fortsetzen: jeder Tipp genügt
      if (!this.act('active')) {
        if (Math.hypot(dxTotal, dyTotal) < TAP_SLOP * 2) this.act('confirm');
        return;
      }
      if (!t.moved && Math.hypot(dxTotal, dyTotal) < TAP_SLOP && now - t.t0 < TAP_TIME) {
        if (t.onHold) this.act('hold');
        else this.act('rotate', e.clientX < t.mid ? -1 : 1);
        return;
      }
      const vertical = Math.abs(dyTotal) > Math.abs(dxTotal) * 1.3;
      this.lastGesture = { vy, average, dy: dyTotal, dx: dxTotal }; // für den Spieltest
      if (vertical && dyTotal > t.step * 1.2 && (vy > FLICK_DOWN || (dyTotal > t.step * 3 && average > 0.42))) this.act('hard');
      else if (vertical && vy < -FLICK_UP && -dyTotal > t.step * 1.4) this.act('hold');
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  // ---------- Daumensteuerung ----------

  // Zone eines Punkts: 'left', 'right' oder null. Nur mit Einstellung und breitem Kasten.
  zoneAt(e, m) {
    if (!this.act('thumbs') || !m.wide) return null;
    if (e.target.closest('button, .panel, .sheet, .result, .scrim, .toast')) return null;
    const b = document.body.classList;
    if (b.contains('open-levels') || b.contains('open-settings')) return null;
    if (e.clientX < m.well.left) return 'left';
    if (e.clientX > m.well.right) return 'right';
    return null;
  }

  bindThumbs() {
    // In der Erfassungsphase des Dokuments, damit die Zonen vor den Gesten der Bühne entscheiden
    document.addEventListener('pointerdown', (e) => {
      if (e.button > 0) return;
      const m = this.metrics();
      const side = this.zoneAt(e, m);
      if (!side) return;
      // Feld Halten bleibt antippbar
      if (e.clientX >= m.hold.left && e.clientX <= m.hold.right && e.clientY >= m.hold.top && e.clientY <= m.hold.bottom) return;
      e.stopPropagation();
      e.preventDefault();
      this.lastPointer = 'touch';
      if (!this.act('active')) {
        this.act('confirm');
        return;
      }
      const zone = { side, dir: 0, x0: e.clientX, y0: e.clientY };
      if (side === 'left') {
        // Außen nach links, innen nach rechts
        zone.dir = e.clientX < m.well.left / 2 ? -1 : 1;
        this.dir = zone.dir;
        this.dasTimer = 0;
        this.arrTimer = 0;
        this.act('move', zone.dir);
      } else {
        zone.mid = (m.well.right + window.innerWidth) / 2;
      }
      this.zones.set(e.pointerId, zone);
    }, { capture: true });

    const end = (e) => {
      const zone = this.zones.get(e.pointerId);
      if (!zone) return;
      this.zones.delete(e.pointerId);
      if (zone.side === 'left') {
        this.restoreDir();
        return;
      }
      if (e.type !== 'pointerup' || !this.act('active')) return;
      const dx = e.clientX - zone.x0;
      const dy = e.clientY - zone.y0;
      if (Math.abs(dy) > ZONE_SWIPE && Math.abs(dy) > Math.abs(dx)) this.act(dy > 0 ? 'hard' : 'hold');
      else if (Math.hypot(dx, dy) < ZONE_SWIPE) this.act('rotate', zone.x0 < zone.mid ? -1 : 1);
    };
    document.addEventListener('pointerup', end, { capture: true });
    document.addEventListener('pointercancel', end, { capture: true });
  }
}
