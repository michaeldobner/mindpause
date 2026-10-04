// Zweisprachigkeit: Deutsch, wenn das Gerät auf Deutsch eingestellt ist, sonst Englisch.

const STRINGS = {
  de: {
    subtitle: 'Solohalma',
    boardLabel: 'Spielbrett',
    marbles: { one: 'Murmel', other: 'Murmeln' },
    undo: 'Zurück',
    hint: 'Tipp',
    restart: 'Neu',
    restartUndo: 'Neues Spiel. Mit Zurück holst du das alte zurück.',
    figures: 'Figuren',
    settings: 'Mehr',
    close: 'Schließen',
    chooseFigure: 'Figur wählen',
    difficulty: 'Schwierigkeit {n} von 5',
    coach: 'Hier wechselst du die Figur',
    // Ergebnis
    gameOver: 'Spiel beendet',
    rating: {
      perfect: ['Meisterhaft', 'Eine Murmel, genau in der Mitte.'],
      one: ['Sehr gut', 'Nur noch eine Murmel übrig.'],
      two: ['Gut', 'Zwei Murmeln übrig.'],
      three: ['Ordentlich', 'Drei Murmeln übrig.'],
      more: ['Weiter üben', '{n} Murmeln übrig.'],
    },
    best: { one: 'Bestes Ergebnis: {n} Murmel', other: 'Bestes Ergebnis: {n} Murmeln' },
    solved: 'Gelöst: {n}×',
    nextFigure: 'Nächste Figur',
    again: 'Nochmal',
    undoLast: 'Letzten Zug zurücknehmen',
    // Tipp
    thinking: 'Denke nach …',
    noSolution: 'Von hier aus geht es nicht mehr perfekt auf. Nimm ein paar Züge zurück.',
    hintTimeout: 'Gerade kein Tipp gefunden. Versuch es nach dem nächsten Zug noch einmal.',
    hintDone: 'Kein Zug mehr möglich.',
    // Einstellungen
    settingsTitle: 'Einstellungen',
    sound: 'Ton',
    soundOn: 'Klänge beim Spielen',
    soundStyle: 'Klangfarbe',
    styles: { warm: 'Warm', clear: 'Klar', soft: 'Weich' },
    tilt: 'Neigen',
    tiltText: 'Murmeln im Rand rollen, wenn du das Gerät neigst',
    tiltDenied: 'Zugriff auf den Bewegungssensor wurde nicht erlaubt.',
    tiltUnsupported: 'Dieses Gerät hat keinen Bewegungssensor.',
    rimHint: 'Tipp: Wische über die Murmeln im Rand.',
    version: 'Version {v}',
  },
  en: {
    subtitle: 'Peg Solitaire',
    boardLabel: 'Game board',
    marbles: { one: 'marble', other: 'marbles' },
    undo: 'Undo',
    hint: 'Hint',
    restart: 'New',
    restartUndo: 'New game. Tap Undo to get the previous one back.',
    figures: 'Figures',
    settings: 'More',
    close: 'Close',
    chooseFigure: 'Choose a figure',
    difficulty: 'Difficulty {n} of 5',
    coach: 'Change the figure here',
    gameOver: 'Game over',
    rating: {
      perfect: ['Masterful', 'One marble, right in the centre.'],
      one: ['Excellent', 'Only one marble left.'],
      two: ['Good', 'Two marbles left.'],
      three: ['Decent', 'Three marbles left.'],
      more: ['Keep practising', '{n} marbles left.'],
    },
    best: { one: 'Best result: {n} marble', other: 'Best result: {n} marbles' },
    solved: 'Solved: {n}×',
    nextFigure: 'Next figure',
    again: 'Play again',
    undoLast: 'Undo last move',
    thinking: 'Thinking …',
    noSolution: 'From here a perfect finish is no longer possible. Undo a few moves.',
    hintTimeout: 'No hint found right now. Try again after your next move.',
    hintDone: 'No more moves possible.',
    settingsTitle: 'Settings',
    sound: 'Sound',
    soundOn: 'Sounds while playing',
    soundStyle: 'Sound style',
    styles: { warm: 'Warm', clear: 'Clear', soft: 'Soft' },
    tilt: 'Tilt',
    tiltText: 'Marbles in the rim roll when you tilt your device',
    tiltDenied: 'Access to the motion sensor was not allowed.',
    tiltUnsupported: 'This device has no motion sensor.',
    rimHint: 'Tip: swipe across the marbles in the rim.',
    version: 'Version {v}',
  },
};

export function detectLanguage(languages = navigator.languages || [navigator.language]) {
  const first = (languages && languages[0]) || 'en';
  return first.toLowerCase().startsWith('de') ? 'de' : 'en';
}

export const lang = typeof navigator !== 'undefined' ? detectLanguage() : 'en';

export function strings(language = lang) {
  return STRINGS[language];
}

// Text holen: t('undo'), t('marbles', { n: 3 }), t('rating.perfect')
export function t(path, params = {}, language = lang) {
  let value = path.split('.').reduce((obj, k) => (obj == null ? obj : obj[k]), STRINGS[language]);
  if (value && typeof value === 'object' && !Array.isArray(value) && 'other' in value) {
    value = params.n === 1 ? value.one : value.other;
  }
  if (typeof value === 'string') return format(value, params);
  if (Array.isArray(value)) return value.map((v) => format(v, params));
  return path;
}

function format(text, params) {
  return text.replace(/\{(\w+)\}/g, (_, k) => (k in params ? params[k] : `{${k}}`));
}

// Alle Elemente mit data-i18n="schlüssel" (Text) oder data-i18n-label (aria-label) füllen
export function translateDocument(root = document) {
  document.documentElement.lang = lang;
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-label]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nLabel));
  });
}

export const LANGUAGES = Object.keys(STRINGS);
