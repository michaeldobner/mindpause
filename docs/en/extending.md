# Extending

[Deutsche Version](../de/erweitern.md) · [Overview](README.md)

SPRING is built so that new content can be added with as little change to the game logic as possible.

## Adding a figure

1. Add an entry to `FIGURES` in `js/figures.js`, at the right place by difficulty:

```js
{
  id: 'doppelkreuz',
  name: { de: 'Doppelkreuz', en: 'Double cross' },
  difficulty: 3,
  layout: [
    '  .o.  ',
    '  .o.  ',
    '..ooo..',
    '...o...',
    '..ooo..',
    '  .o.  ',
    '  ...  ',
  ],
},
```

2. Run `npm test`. `tests/figures.test.js` automatically checks that the new figure can be solved to a single marble in the centre. **An unsolvable figure fails here.** The example above (10 marbles) has been checked and is solvable.

Layout rules:

* Seven lines of seven characters each.
* `o` for a marble, `.` for an empty hole, spaces outside the cross.
* Difficulty from 1 to 5. The list must stay sorted by it, Classic stays last.

Everything else happens automatically: card in the picker, preview, marble colours, statistics, stars, hints and "Next figure".

**Important:** not every shape is solvable. Because of a mathematical property of the board (parity classes of the holes) many figures cannot be reduced to one marble in the centre. During development, for example, every staircase shaped figure of 9 marbles that was tested turned out to be unsolvable.

## Adding a language

1. In `js/i18n.js` add a block with the same keys as `de` and `en`, for example `fr`.
2. Extend `detectLanguage()` to recognise `fr`.
3. Give every figure in `js/figures.js` a `name.fr`.
4. `npm test` checks that all languages have the same keys.

## Adding a sound style

1. An entry in `SOUND_STYLES` in `js/sound.js` (amounts of wood, ceramic, room and low pass).
2. A button with `data-style` in the segmented control in `index.html`.
3. A translation under `styles` in `js/i18n.js`.

## Colour themes

The board colours are gradients in `BoardView.build()` in `js/view.js`, the interface colours are CSS variables in `css/style.css`. A colour theme consists of a set of gradient colours (board, rim, playing surface, both marble colours) and a set of CSS variables. Recommended approach: move the gradient colours into a `THEMES` object, apply it when building the SVG and save the choice like the sound style.

## Roadmap

| Version | Contents | Status |
|---|---|---|
| 1.0 | Classic board, controls, rating, offline, installation | Done |
| 2.0 | SPRING: 7 figures, switching during play, hints, stars, living rim, tilt, sound design, bilingual | Done |
| 2.x | Colour themes, more figures, puzzles with other start and goal holes | Planned |
| 3.0 | Daily puzzle, App Store version with haptic feedback | Idea |

Note on 3.0: Safari on iPhone and iPad offers no vibration to web apps. Haptic feedback requires an App Store version, for example via Capacitor using the same code base.
