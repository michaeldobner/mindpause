// Speichern auf dem Gerät, mit eigenem Präfix je Spiel.
// Funktioniert auch, wenn localStorage gesperrt ist (dann ohne Speicherung).

export function createStorage(prefix) {
  return {
    load(name, fallback) {
      try {
        const raw = localStorage.getItem(prefix + name);
        return raw === null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    save(name, value) {
      try {
        localStorage.setItem(prefix + name, JSON.stringify(value));
      } catch {
        // Speicher nicht verfügbar, Spiel läuft trotzdem weiter
      }
    },
  };
}
