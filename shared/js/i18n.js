// Zweisprachigkeit für alle Spiele: Deutsch, wenn das Gerät auf Deutsch eingestellt ist, sonst Englisch.
// Die Hülle bringt ihre eigenen Texte mit, jedes Spiel ergänzt seine.

export const SHELL_STRINGS = {
  de: {
    collection: 'MIND PAUSE',
    undo: 'Zurück',
    hint: 'Tipp',
    restart: 'Neu',
    settings: 'Mehr',
    close: 'Schließen',
    difficulty: 'Schwierigkeit {n} von 5',
    gameOver: 'Spiel beendet',
    again: 'Nochmal',
    undoLast: 'Letzten Zug zurücknehmen',
    restartUndo: 'Neues Spiel. Mit Zurück holst du das alte zurück.',
    thinking: 'Denke nach …',
    settingsTitle: 'Einstellungen',
    sound: 'Ton',
    soundOn: 'Klänge beim Spielen',
    soundStyle: 'Klangfarbe',
    styles: { warm: 'Warm', clear: 'Klar', soft: 'Weich' },
    version: 'Version {v}',
  },
  en: {
    collection: 'MIND PAUSE',
    undo: 'Undo',
    hint: 'Hint',
    restart: 'New',
    settings: 'More',
    close: 'Close',
    difficulty: 'Difficulty {n} of 5',
    gameOver: 'Game over',
    again: 'Play again',
    undoLast: 'Undo last move',
    restartUndo: 'New game. Tap Undo to get the previous one back.',
    thinking: 'Thinking …',
    settingsTitle: 'Settings',
    sound: 'Sound',
    soundOn: 'Sounds while playing',
    soundStyle: 'Sound style',
    styles: { warm: 'Warm', clear: 'Clear', soft: 'Soft' },
    version: 'Version {v}',
  },
};

export const LANGUAGES = Object.keys(SHELL_STRINGS);

export function detectLanguage(languages = typeof navigator !== 'undefined' ? navigator.languages || [navigator.language] : []) {
  const first = (languages && languages[0]) || 'en';
  return first.toLowerCase().startsWith('de') ? 'de' : 'en';
}

// Erzeugt die Übersetzung für ein Spiel: Texte der Hülle plus Texte des Spiels
export function createI18n(gameStrings = {}, language = detectLanguage()) {
  const table = {};
  for (const l of LANGUAGES) table[l] = { ...SHELL_STRINGS[l], ...(gameStrings[l] || {}) };

  // Text holen: t('undo'), t('marbles', { n: 3 }), t('rating.perfect')
  function t(path, params = {}, lang = language) {
    let value = path.split('.').reduce((obj, k) => (obj == null ? obj : obj[k]), table[lang]);
    if (value && typeof value === 'object' && !Array.isArray(value) && 'other' in value) {
      value = params.n === 1 ? value.one : value.other;
    }
    if (typeof value === 'string') return format(value, params);
    if (Array.isArray(value)) return value.map((v) => format(v, params));
    return path;
  }

  // Alle Elemente mit data-i18n (Text) oder data-i18n-label (aria-label) füllen
  function translateDocument(root = document) {
    document.documentElement.lang = language;
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    root.querySelectorAll('[data-i18n-label]').forEach((el) => {
      el.setAttribute('aria-label', t(el.dataset.i18nLabel));
    });
  }

  return { lang: language, t, translateDocument, strings: (l = language) => table[l] };
}

function format(text, params) {
  return text.replace(/\{(\w+)\}/g, (_, k) => (k in params ? params[k] : `{${k}}`));
}
