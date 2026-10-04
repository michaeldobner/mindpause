// Physik der Murmeln und Steine im Rand des Bretts. Jedes Teil bewegt sich nur entlang
// eines Kreises, beschrieben durch seinen Winkel. Das hält die Rechnung einfach und ruhig.
//
// Ohne arc ist der Rand eine durchgehende Rinne (SPRING). Mit arc = { center, half } ist er
// eine Schale: ein Kreisbogen mit Wänden an beiden Enden (QUEEN hat zwei solche Schalen).

const FRICTION = 2.2; // Abbremsen pro Sekunde (exponentiell)
const RESTITUTION = 0.55; // Anteil des Schwungs, der bei einem Stoß erhalten bleibt
const MAX_SPEED = 9; // rad/s
const REST_SPEED = 0.02; // darunter gilt eine Murmel als ruhend
const TILT_ACCEL = 7; // rad/s² bei voller Neigung
const TAU = Math.PI * 2;

export class Gutter {
  // speedScale: Umrechnung, wenn der Kreis viel größer ist als der Rand von SPRING (446),
  // damit sich Bewegungen gleich anfühlen. Gerade Schalen (QUEEN) nutzen einen sehr großen Kreis.
  constructor({ radius, marbleRadius, onCollide = () => {}, arc = null, speedScale = 1 }) {
    this.radius = radius;
    this.k = speedScale;
    this.arc = arc; // Schale: { center: Winkel der Mitte, half: halbe Öffnung }, sonst null
    this.rotation = 0; // Drehung des Bretts auf dem Bildschirm, für die Richtung der Neigung
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

  // Ordentlich nebeneinander, mittig unten oder mittig in der Schale (Start und nach dem Laden)
  pack(ids) {
    this.items.clear();
    const n = ids.length;
    const center = this.arc ? this.arc.center : Math.PI / 2;
    ids.forEach((id, i) => {
      this.items.set(id, { a: norm(center + (i - (n - 1) / 2) * this.gap), v: 0 });
    });
  }

  // Abstand eines Winkels von der Mitte der Schale und der äußerste erlaubte Wert
  local(a) {
    return signed(a - this.arc.center);
  }

  get limit() {
    return this.arc.half - this.gap / 2;
  }

  // Freien Platz möglichst nah an einem Wunschwinkel finden
  freeAngle(wish = Math.PI / 2) {
    if (this.arc) return this.freeAngleInArc(wish);
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

  // In einer Schale: Plätze in kleinen Schritten prüfen und den nächsten freien wählen
  freeAngleInArc(wish) {
    const lim = this.limit;
    const target = clamp(this.local(wish), -lim, lim);
    const taken = [...this.items.values()].map((it) => this.local(it.a));
    let best = null;
    for (let u = -lim; u <= lim + 1e-9; u += this.gap / 6) {
      if (taken.every((t) => Math.abs(t - u) >= this.gap)) {
        if (best === null || Math.abs(u - target) < Math.abs(best - target)) best = u;
      }
    }
    // Schale voll: trotzdem einfügen, die Nachbarn rücken beim Stoß beiseite
    return norm(this.arc.center + (best ?? target));
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
      it.v = clamp(fingerVelocity * 1.1 + dir * 0.4 * this.k, -MAX_SPEED * this.k, MAX_SPEED * this.k);
    }
    return touched;
  }

  // Kurzer Schubs beim Antippen
  nudge(angle) {
    let touched = false;
    for (const it of this.items.values()) {
      const d = signed(it.a - angle);
      if (Math.abs(d) > this.gap * 0.6) continue;
      it.v += (Math.sign(d) || (Math.random() < 0.5 ? -1 : 1)) * 2.4 * this.k;
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
        const sa = it.a + this.rotation;
        const tangential = -Math.sin(sa) * g.x + Math.cos(sa) * g.y;
        it.v += tangential * TILT_ACCEL * this.k * dt;
      }
      it.v = clamp(it.v * damp, -MAX_SPEED * this.k, MAX_SPEED * this.k);
      if (Math.abs(it.v) < REST_SPEED * this.k && !this.tiltActive) it.v = 0;
      it.a = norm(it.a + it.v * dt);
      if (this.arc) this.walls(it);
    }

    this.collide(items);
    for (const it of items) energy += Math.abs(it.v);
    // Ruhe, sobald sich (auch bei Neigung) nichts mehr nennenswert bewegt
    return energy > REST_SPEED * this.k * items.length * 2;
  }

  // Wände der Schale: abprallen und leise anschlagen
  walls(it) {
    const u = this.local(it.a);
    const lim = this.limit;
    if (Math.abs(u) <= lim) return;
    const side = Math.sign(u);
    it.a = norm(this.arc.center + side * lim);
    if (it.v * side > 0) {
      this.onCollide(Math.min(1, Math.abs(it.v) / (4 * this.k)));
      it.v = -it.v * RESTITUTION;
    }
  }

  collide(items) {
    if (items.length < 2) return;
    if (this.arc) {
      this.collideInArc(items);
      return;
    }
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
          if (pass === 0) this.onCollide(Math.min(1, rel / (4 * this.k)));
        }
      }
      if (!fixed) break;
    }
  }

  // Wie collide, aber ohne Umlauf: die Schale hat einen Anfang und ein Ende
  collideInArc(items) {
    for (let pass = 0; pass < 4; pass++) {
      items.sort((x, y) => this.local(x.a) - this.local(y.a));
      let fixed = false;
      for (let i = 0; i + 1 < items.length; i++) {
        const p = items[i];
        const q = items[i + 1];
        const dist = this.local(q.a) - this.local(p.a);
        if (dist >= this.gap) continue;
        fixed = true;
        const push = (this.gap - dist) / 2;
        p.a = norm(p.a - push);
        q.a = norm(q.a + push);
        const rel = p.v - q.v;
        if (rel > 0) {
          const pv = p.v;
          p.v = (pv * (1 - RESTITUTION) + q.v * (1 + RESTITUTION)) / 2;
          q.v = (q.v * (1 - RESTITUTION) + pv * (1 + RESTITUTION)) / 2;
          if (pass === 0) this.onCollide(Math.min(1, rel / (4 * this.k)));
        }
      }
      for (const it of items) this.walls(it);
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
