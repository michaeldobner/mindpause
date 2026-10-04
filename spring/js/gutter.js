// Physik der Murmeln im Rand. Jede Murmel bewegt sich nur entlang eines Kreises,
// beschrieben durch ihren Winkel. Das hält die Rechnung einfach und das Verhalten ruhig.

const FRICTION = 2.2; // Abbremsen pro Sekunde (exponentiell)
const RESTITUTION = 0.55; // Anteil des Schwungs, der bei einem Stoß erhalten bleibt
const MAX_SPEED = 9; // rad/s
const REST_SPEED = 0.02; // darunter gilt eine Murmel als ruhend
const TILT_ACCEL = 7; // rad/s² bei voller Neigung
const TAU = Math.PI * 2;

export class Gutter {
  constructor({ radius, marbleRadius, onCollide = () => {} }) {
    this.radius = radius;
    this.gap = (2 * marbleRadius + 1.5) / radius; // kleinster Winkelabstand zweier Murmeln
    this.items = new Map(); // id -> { a: Winkel, v: Winkelgeschwindigkeit }
    this.gravity = { x: 0, y: 0 }; // Neigung in Bildschirmrichtung, Länge bis 1
    this.onCollide = onCollide;
  }

  has(id) {
    return this.items.has(id);
  }

  get size() {
    return this.items.size;
  }

  angleOf(id) {
    return this.items.get(id)?.a;
  }

  position(a) {
    return { x: Math.cos(a) * this.radius, y: Math.sin(a) * this.radius };
  }

  // Ordentlich nebeneinander, mittig unten (für den Start und nach dem Laden)
  pack(ids) {
    this.items.clear();
    const n = ids.length;
    ids.forEach((id, i) => {
      this.items.set(id, { a: norm(Math.PI / 2 + (i - (n - 1) / 2) * this.gap), v: 0 });
    });
  }

  // Freien Platz möglichst nah an einem Wunschwinkel finden
  freeAngle(wish = Math.PI / 2) {
    const angles = [...this.items.values()].map((it) => it.a).sort((x, y) => x - y);
    if (angles.length === 0) return wish;
    let best = null;
    let bestDist = Infinity;
    for (let i = 0; i < angles.length; i++) {
      const a0 = angles[i];
      const a1 = i + 1 < angles.length ? angles[i + 1] : angles[0] + TAU;
      const space = a1 - a0;
      if (space < 2 * this.gap) continue;
      // Wunschwinkel in die Lücke legen, wenn er hineinpasst, sonst an den nächstgelegenen Rand
      const lo = a0 + this.gap;
      const hi = a1 - this.gap;
      let w = wish;
      while (w < lo) w += TAU;
      while (w > lo + TAU) w -= TAU;
      const cand = w <= hi ? w : angDist(w, lo) < angDist(w, hi) ? lo : hi;
      const d = angDist(cand, wish);
      if (d < bestDist) {
        bestDist = d;
        best = cand;
      }
    }
    // Kein Platz frei: trotzdem einfügen, die Nachbarn rücken beim Stoß beiseite
    return norm(best ?? wish);
  }

  add(id, angle, velocity = 0) {
    this.items.set(id, { a: norm(angle), v: velocity });
  }

  remove(id) {
    this.items.delete(id);
  }

  // Finger schiebt Murmeln: Winkel des Fingers und seine Winkelgeschwindigkeit
  push(angle, fingerVelocity, reach = this.gap * 0.9) {
    let touched = false;
    for (const it of this.items.values()) {
      const d = signed(it.a - angle);
      if (Math.abs(d) > reach) continue;
      touched = true;
      const dir = fingerVelocity !== 0 ? Math.sign(fingerVelocity) : Math.sign(d) || 1;
      // Murmeln hinter dem Finger bleiben liegen, nur die davor werden geschoben
      if (fingerVelocity !== 0 && Math.sign(d) === -dir && Math.abs(d) > reach * 0.3) continue;
      // Murmel aus dem Finger heraus schieben und Schwung mitgeben
      it.a = norm(angle + dir * reach);
      it.v = clamp(fingerVelocity * 1.1 + dir * 0.4, -MAX_SPEED, MAX_SPEED);
    }
    return touched;
  }

  // Kurzer Schubs beim Antippen
  nudge(angle) {
    let touched = false;
    for (const it of this.items.values()) {
      const d = signed(it.a - angle);
      if (Math.abs(d) > this.gap * 0.6) continue;
      it.v += (Math.sign(d) || (Math.random() < 0.5 ? -1 : 1)) * 2.4;
      touched = true;
    }
    return touched;
  }

  get tiltActive() {
    return Math.hypot(this.gravity.x, this.gravity.y) > 0.04;
  }

  // Ein Zeitschritt. Gibt true zurück, solange sich etwas bewegt.
  step(dt) {
    const items = [...this.items.values()];
    if (items.length === 0) return false;
    const damp = Math.exp(-FRICTION * dt);
    const g = this.gravity;
    let energy = 0;

    for (const it of items) {
      if (this.tiltActive) {
        // Tangentialer Anteil der Schwerkraft an dieser Stelle des Kreises
        const tangential = -Math.sin(it.a) * g.x + Math.cos(it.a) * g.y;
        it.v += tangential * TILT_ACCEL * dt;
      }
      it.v = clamp(it.v * damp, -MAX_SPEED, MAX_SPEED);
      if (Math.abs(it.v) < REST_SPEED && !this.tiltActive) it.v = 0;
      it.a = norm(it.a + it.v * dt);
    }

    this.collide(items);
    for (const it of items) energy += Math.abs(it.v);
    // Ruhe, sobald sich (auch bei Neigung) nichts mehr nennenswert bewegt
    return energy > REST_SPEED * items.length * 2;
  }

  collide(items) {
    if (items.length < 2) return;
    for (let pass = 0; pass < 4; pass++) {
      items.sort((x, y) => x.a - y.a);
      let fixed = false;
      for (let i = 0; i < items.length; i++) {
        const p = items[i];
        const q = items[(i + 1) % items.length];
        const dist = i + 1 < items.length ? q.a - p.a : q.a + TAU - p.a;
        if (dist >= this.gap) continue;
        fixed = true;
        // Überlappung auflösen
        const push = (this.gap - dist) / 2;
        p.a = norm(p.a - push);
        q.a = norm(q.a + push);
        // Stoß nur, wenn sich beide aufeinander zubewegen
        const rel = p.v - q.v;
        if (rel > 0) {
          const pv = p.v;
          p.v = (pv * (1 - RESTITUTION) + q.v * (1 + RESTITUTION)) / 2;
          q.v = (q.v * (1 - RESTITUTION) + pv * (1 + RESTITUTION)) / 2;
          if (pass === 0) this.onCollide(Math.min(1, rel / 4));
        }
      }
      if (!fixed) break;
    }
  }
}

function norm(a) {
  a %= TAU;
  return a < 0 ? a + TAU : a;
}

function signed(a) {
  a = norm(a);
  return a > Math.PI ? a - TAU : a;
}

function angDist(a, b) {
  return Math.abs(signed(a - b));
}

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

export const _internal = { norm, signed };
