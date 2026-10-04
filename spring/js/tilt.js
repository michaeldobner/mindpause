// Neigung des Geräts als Schwerkraft in Bildschirmrichtung (x nach rechts, y nach unten).
// iOS verlangt dafür einmalig eine Erlaubnis, die nur nach einer Berührung abgefragt werden darf.
//
// "wanted" ist der Wunsch der Person (Schalter), "enabled" der tatsächliche Zustand des Sensors.
// Beide getrennt zu halten verhindert, dass ein laufender Erlaubnis-Dialog den Schalter verstellt.

const SMOOTHING = 0.18; // Glättung der Sensorwerte
const DEADZONE = 0.07; // flach liegend soll nichts rollen

export class Tilt {
  constructor(onChange, wanted = false) {
    this.onChange = onChange;
    this.wanted = wanted;
    this.enabled = false;
    this.pending = null;
    this.gx = 0;
    this.gy = 0;
    this.handler = (e) => this.read(e);
  }

  // Ergebnis: 'ok', 'off' (inzwischen wieder ausgeschaltet), 'denied' oder 'unsupported'
  async enable() {
    this.wanted = true;
    if (this.enabled) return 'ok';
    if (!this.pending) this.pending = this.attach().finally(() => (this.pending = null));
    const result = await this.pending;
    if (result !== 'ok') this.wanted = false;
    if (!this.wanted) {
      this.detach();
      return result === 'ok' ? 'off' : result;
    }
    return result;
  }

  disable() {
    this.wanted = false;
    this.detach();
  }

  async attach() {
    if (typeof window === 'undefined' || typeof DeviceOrientationEvent === 'undefined') return 'unsupported';
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const answer = await DeviceOrientationEvent.requestPermission();
        if (answer !== 'granted') return 'denied';
      } catch {
        return 'denied';
      }
    }
    window.addEventListener('deviceorientation', this.handler);
    this.enabled = true;
    return 'ok';
  }

  detach() {
    if (typeof window !== 'undefined') window.removeEventListener('deviceorientation', this.handler);
    this.enabled = false;
    this.gx = 0;
    this.gy = 0;
    this.onChange(0, 0);
  }

  read(e) {
    if (!this.wanted || e.beta === null || e.gamma === null) return;
    const [x, y] = gravityFromOrientation(e.beta, e.gamma, screenAngle());
    this.gx += (x - this.gx) * SMOOTHING;
    this.gy += (y - this.gy) * SMOOTHING;
    const len = Math.hypot(this.gx, this.gy);
    if (len < DEADZONE) this.onChange(0, 0);
    else this.onChange(this.gx, this.gy);
  }
}

function screenAngle() {
  if (screen.orientation && typeof screen.orientation.angle === 'number') return screen.orientation.angle;
  return typeof window.orientation === 'number' ? window.orientation : 0;
}

// Schwerkraft im Gerät aus den Winkeln beta (vorne/hinten) und gamma (links/rechts),
// danach in Bildschirmkoordinaten gedreht. Ergebnis: Vektor mit Länge bis 1.
export function gravityFromOrientation(beta, gamma, angle = 0) {
  const b = (beta * Math.PI) / 180;
  const g = (gamma * Math.PI) / 180;
  // Gerätekoordinaten: x nach rechts, y nach oben
  const dx = Math.cos(b) * Math.sin(g);
  const dy = -Math.sin(b);
  // In Bildschirmkoordinaten (y nach unten) und um die Bildschirmdrehung korrigieren
  const sx = dx;
  const sy = -dy;
  const a = (-angle * Math.PI) / 180;
  return [sx * Math.cos(a) - sy * Math.sin(a), sx * Math.sin(a) + sy * Math.cos(a)];
}
