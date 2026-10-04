# Development

[Deutsche Version](../de/entwicklung.md) · [Overview](README.md)

Like every game in MIND PAUSE, QUEEN is developed from the **root folder of the repository**. General information on requirements, the local server, tests, the browser test and publishing is in the [collection README](../../../README.md). This page only covers what concerns QUEEN.

## Running locally

```bash
npm start
```

Then open QUEEN at `http://localhost:3000/queen/`. The language follows the browser language: in Chrome under Settings > Languages, in Safari through the system language.

## QUEEN tests

`npm test` in the root folder runs every test of the collection. These concern QUEEN:

| File | Checks |
|---|---|
| `queen/tests/rules.test.js` | Starting position, moving forwards only, capturing backwards too, mandatory capture, complete multiple capture, no double jump, flying queen with free landing, crowning, no crowning when the capture continues, end of game without moves |
| `queen/tests/game.test.js` | Move and undo restore everything, piece numbers, draw by standstill and repetition, save and resume, longest capture path on tap, computer takes a winning capture, symmetric evaluation, **Medium clearly beats Easy** |
| `queen/tests/themes.test.js` | Every board style defines the same gradients and patterns, names and side colours in both languages |
| `shared/tests/gutter.test.js` | Among others the trays: walls, rest, 12 pieces fit, tilt pushes to the wall |
| `shared/tests/tilt.test.js` | Gravity from device angles, the tilt switch |
| `shared/tests/i18n.test.js` | Among others: QUEEN texts have the same keys in both languages and no dashes |
| `tests/release.test.js` | Among others: every QUEEN reference carries the right version, the service worker lists every module, the folder is complete |

The browser test `npm run e2e` opens QUEEN on iPhone, iPhone landscape, iPhone SE and iPad landscape, in German and English, checks that nothing overflows and plays one move plus undo. For this `main.js` provides the object `window.__game` (`history`, `e2e.move()`, plus `view`, `game`, `mode`, `switchMode`, `refresh`).

### Also check by hand

1. All four modes, hint, undo while the computer is thinking, New followed by an immediate Undo.
2. Multiple capture, crowning, flying queen.
3. Two players with and without "Turn the board".
4. Portrait and landscape, tapping and swiping the trays, tilt.
5. Both board styles, switching mid-game, crown on ivory, ebony and ceramic.
6. Light and dark mode.

## Testing on an iPhone or iPad

1. Run `npm start` on the computer.
2. On the iPhone open `http://<computer-ip>:3000/queen/` in Safari.

Without HTTPS the service worker and the motion sensor do not work. Test these two through the published address.

**Debugging with a Mac:** on the iPhone turn on Settings > Apps > Safari > Advanced > Web Inspector, connect with a cable, then on the Mac in Safari: Develop menu > name of the iPhone > choose the page.

## Checking playing strength

New evaluations or levels can play each other in Node.js:

```js
import { Game } from './queen/js/game.js';
import { chooseMove } from './queen/js/ai.js';

const g = new Game();
while (!g.isOver) {
  const level = g.turn === 1 ? 'medium' : 'easy';
  g.apply(g.match(chooseMove(g.board, g.turn, level)));
}
console.log(g.result);
```

## Conventions for QUEEN

| Topic | Rule |
|---|---|
| Texts | QUEEN texts in `queen/js/strings.js`, general texts in the shell. Always in both languages |
| Interface | Never change the header, control bar, sheets or result card inside QUEEN, change them in the shell so every game benefits |
| Colours and fonts | From `shared/tokens.css`. `queen/css/queen.css` only holds values that exist only in QUEEN |
| Separation | `rules.js`, `game.js` and `ai.js` never touch `document` |
| Rules | Every rule change starts as a test in `queen/tests/rules.test.js` |
| References | Own files always with `?v=<QUEEN version>`, shell files with `?shell=<shell version>` |
| Writing style | Code comments in German, no dashes in texts and documentation |
| Documentation | Update `docs/de` and `docs/en` and both changelogs with every change |

## New QUEEN version

1. `npm test` and `npm run e2e` without errors.
2. `node scripts/release.mjs queen <version>` sets the version in every QUEEN file.
3. Add new JavaScript files to the list in `queen/sw.js` (the test reports it otherwise).
4. Update QUEEN's `CHANGELOG.md` and `CHANGELOG.de.md`.
5. Update the documentation in both languages, and for visible changes the images in `docs/images`.
6. Pull request. Merge after green tests, the version is live a minute or two later.
