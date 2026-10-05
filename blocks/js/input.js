// Eingabe von BLOCKS: Steine vom Tablett aufs Brett ziehen, mit Finger, Stift oder Maus.
// Auf dem Bildschirm schwebt der Stein über dem Finger, damit er sichtbar bleibt.
// Tastatur: 1, 2, 3 wählen einen Stein, Pfeile verschieben ihn, Enter oder Leertaste legen ihn,
// Escape bricht ab. H zeigt einen Tipp, Z oder Rücktaste nimmt den letzten Stein zurück.

export class Input {
  // handlers: { allowed(), canPlace(slot, x, y), preview(slot, x, y), place(slot, x, y),
  //             pick(slot), snap(), cancel(), hint(), undo() }
  constructor(stage, view, handlers) {
    this.view = view;
    this.h = handlers;
    this.pointer = null;
    this.lastPointer = null;

    stage.addEventListener('pointerdown', (e) => this.down(e));
    window.addEventListener('pointermove', (e) => this.move(e));
    window.addEventListener('pointerup', (e) => this.up(e));
    window.addEventListener('pointercancel', (e) => this.up(e, true));
    window.addEventListener('keydown', (e) => this.key(e));
  }

  // ---------- Finger und Maus ----------

  down(e) {
    if (this.pointer || !this.h.allowed() || e.button > 0) return;
    if (e.target.closest?.('button, .result, .toast')) return;
    const [x, y] = this.view.local(e.clientX, e.clientY);
    const slot = this.view.slotAt(x, y);
    if (slot < 0 || !this.h.pick(slot)) return;
    e.preventDefault();
    const touch = e.pointerType !== 'mouse';
    this.lastPointer = touch ? 'touch' : 'mouse';
    this.pointer = e.pointerId;
    this.view.drag = { slot, x, y, touch, grow: 0, target: null, preview: null };
    this.track();
  }

  move(e) {
    if (e.pointerId !== this.pointer || !this.view.drag) return;
    const [x, y] = this.view.local(e.clientX, e.clientY);
    this.view.drag.x = x;
    this.view.drag.y = y;
    this.track();
  }

  up(e, cancelled = false) {
    if (e.pointerId !== this.pointer) return;
    this.pointer = null;
    const d = this.view.drag;
    if (!d) return;
    if (!cancelled) {
      const [x, y] = this.view.local(e.clientX, e.clientY);
      d.x = x;
      d.y = y;
      d.grow = 1;
      this.track();
    }
    if (!cancelled && d.target && this.h.place(d.slot, d.target.x, d.target.y)) {
      this.view.drag = null;
    } else {
      this.view.dragCancel();
      this.h.cancel();
    }
  }

  // Ziel und Vorschau zum aktuellen Ort des Steins
  track() {
    const d = this.view.drag;
    const before = d.target ? `${d.target.x},${d.target.y}` : '';
    d.target = this.view.dragTarget((x, y) => this.h.canPlace(d.slot, x, y));
    d.preview = d.target ? this.h.preview(d.slot, d.target.x, d.target.y) : null;
    if (d.preview && !d.preview.rows.length && !d.preview.cols.length) d.preview = null;
    const after = d.target ? `${d.target.x},${d.target.y}` : '';
    if (after && after !== before) this.h.snap();
    this.view.dirty = true;
  }

  // Ziehen abbrechen, zum Beispiel wenn ein Blatt aufgeht
  release() {
    this.pointer = null;
    if (this.view.drag) this.view.dragCancel();
  }

  // ---------- Tastatur ----------

  key(e) {
    if (e.metaKey || e.altKey || !this.h.allowed()) return;
    if (e.target.closest?.('input, textarea')) return;
    const k = e.key;
    const d = this.view.drag;
    if (e.ctrlKey) {
      if (k === 'z' || k === 'Z') {
        e.preventDefault();
        this.h.undo();
      }
      return;
    }
    if (['1', '2', '3'].includes(k)) {
      e.preventDefault();
      this.keySelect(Number(k) - 1);
      return;
    }
    if (k === 'h' || k === 'H') {
      this.h.hint();
      return;
    }
    if (k === 'z' || k === 'Z' || k === 'Backspace') {
      if (d && d.keys) this.keyCancel();
      this.h.undo();
      return;
    }
    if (!d || !d.keys) {
      // Pfeile ohne gewählten Stein: den ersten passenden nehmen
      if (k.startsWith('Arrow')) {
        e.preventDefault();
        const slot = [0, 1, 2].find((i) => this.h.canPick(i));
        if (slot !== undefined) this.keySelect(slot);
      }
      return;
    }
    const n = this.view.game.size;
    const s = this.view.dragBox().shape;
    const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (moves[k]) {
      e.preventDefault();
      d.kx = Math.min(n - s.w, Math.max(0, d.kx + moves[k][0]));
      d.ky = Math.min(n - s.h, Math.max(0, d.ky + moves[k][1]));
      this.keyTrack();
      this.h.snap();
    } else if (k === 'Enter' || k === ' ') {
      e.preventDefault();
      if (document.activeElement?.blur) document.activeElement.blur();
      if (d.target && this.h.place(d.slot, d.kx, d.ky)) this.view.drag = null;
      else this.h.cancel();
    } else if (k === 'Escape') {
      e.stopPropagation();
      this.keyCancel();
    }
  }

  keySelect(slot) {
    if (!this.h.pick(slot)) return;
    this.lastPointer = 'keys';
    const n = this.view.game.size;
    const prev = this.view.drag;
    const s = this.view.game.tray[slot] && this.view.dragShape(slot);
    // Mitte des Bretts, oder dort, wo der vorige Stein lag
    const kx = prev?.keys ? prev.kx : Math.floor((n - s.w) / 2);
    const ky = prev?.keys ? prev.ky : Math.floor((n - s.h) / 2);
    this.view.drag = { slot, keys: true, kx: Math.min(n - s.w, kx), ky: Math.min(n - s.h, ky), grow: 1, target: null, preview: null };
    this.keyTrack();
  }

  keyTrack() {
    const d = this.view.drag;
    d.target = this.h.canPlace(d.slot, d.kx, d.ky) ? { x: d.kx, y: d.ky } : null;
    d.preview = d.target ? this.h.preview(d.slot, d.kx, d.ky) : null;
    if (d.preview && !d.preview.rows.length && !d.preview.cols.length) d.preview = null;
    this.view.dirty = true;
  }

  keyCancel() {
    this.view.drag = null;
    this.view.dirty = true;
  }
}
