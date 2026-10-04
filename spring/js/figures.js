// Figuren als Daten, sortiert nach Schwierigkeit.
// "o" = Feld mit Murmel, "." = freies Feld, " " = kein Feld.
// Alle Figuren nutzen das englische Kreuzbrett mit 33 Feldern.
// Jede Figur ist mit dem Löser auf Lösbarkeit geprüft (siehe tests/figures.test.js).

export const FIGURES = [
  {
    id: 'kreuz',
    name: { de: 'Kreuz', en: 'Cross' },
    difficulty: 1,
    layout: [
      '  ...  ',
      '  .o.  ',
      '..ooo..',
      '...o...',
      '...o...',
      '  ...  ',
      '  ...  ',
    ],
  },
  {
    id: 'plus',
    name: { de: 'Plus', en: 'Plus' },
    difficulty: 2,
    layout: [
      '  ...  ',
      '  .o.  ',
      '...o...',
      '.ooooo.',
      '...o...',
      '  .o.  ',
      '  ...  ',
    ],
  },
  {
    id: 'pyramide',
    name: { de: 'Pyramide', en: 'Pyramid' },
    difficulty: 3,
    layout: [
      '  ...  ',
      '  .o.  ',
      '..ooo..',
      '.ooooo.',
      'ooooooo',
      '  ...  ',
      '  ...  ',
    ],
  },
  {
    id: 'pfeil',
    name: { de: 'Pfeil', en: 'Arrow' },
    difficulty: 3,
    layout: [
      '  .o.  ',
      '  ooo  ',
      '.ooooo.',
      '...o...',
      '...o...',
      '  ooo  ',
      '  ooo  ',
    ],
  },
  {
    id: 'raute',
    name: { de: 'Raute', en: 'Diamond' },
    difficulty: 4,
    layout: [
      '  .o.  ',
      '  ooo  ',
      '.ooooo.',
      'ooo.ooo',
      '.ooooo.',
      '  ooo  ',
      '  .o.  ',
    ],
  },
  {
    id: 'kamin',
    name: { de: 'Kamin', en: 'Fireplace' },
    difficulty: 4,
    layout: [
      '  ooo  ',
      '  ooo  ',
      '..ooo..',
      '..o.o..',
      '.......',
      '  ...  ',
      '  ...  ',
    ],
  },
  {
    id: 'klassisch',
    name: { de: 'Klassisch', en: 'Classic' },
    difficulty: 5,
    layout: [
      '  ooo  ',
      '  ooo  ',
      'ooooooo',
      'ooo.ooo',
      'ooooooo',
      '  ooo  ',
      '  ooo  ',
    ],
  },
];

// Ziel ist bei allen Figuren eine einzelne Murmel in der Mitte
export const GOAL = [3, 3];

export const DEFAULT_FIGURE = 'kreuz';

export function figureById(id) {
  return FIGURES.find((f) => f.id === id) || null;
}

export function nextFigure(id) {
  const i = FIGURES.findIndex((f) => f.id === id);
  return i >= 0 && i < FIGURES.length - 1 ? FIGURES[i + 1] : null;
}
