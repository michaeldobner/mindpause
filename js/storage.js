// Speichern auf dem Gerät. Funktioniert auch, wenn localStorage gesperrt ist (dann ohne Speicherung).

const PREFIX = 'spring:';
const OLD_PREFIX = 'solohalma:';

export function load(name, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + name);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(name, value) {
  try {
    localStorage.setItem(PREFIX + name, JSON.stringify(value));
  } catch {
    // Speicher nicht verfügbar, Spiel läuft trotzdem weiter
  }
}

// Übernimmt Spielstand und Statistik aus Version 1 (damals nur das klassische Brett)
export function migrate() {
  try {
    if (localStorage.getItem(PREFIX + 'migrated')) return;
    const read = (k) => {
      const raw = localStorage.getItem(OLD_PREFIX + k);
      return raw === null ? null : JSON.parse(raw);
    };
    const game = read('game:englisch');
    const stats = read('stats');
    const sound = read('sound');
    if (game) save('game:klassisch', game);
    if (stats) {
      const stars = stats.perfect > 0 ? 3 : stats.best === 1 ? 2 : stats.best !== null && stats.best <= 3 ? 1 : 0;
      save('stats', { klassisch: { ...stats, stars } });
    }
    if (sound !== null) save('sound', sound);
    save('migrated', true);
  } catch {
    // Ohne Speicher gibt es nichts zu übernehmen
  }
}
