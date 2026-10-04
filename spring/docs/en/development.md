# Development

[Deutsche Version](../de/entwicklung.md) · [Overview](README.md)

SPRING, like every MIND PAUSE game, is developed from the **main folder of the repository**. General information on requirements, the local server, tests, the browser test and publishing is in the [collection README](../../../README.md). This page only covers what concerns SPRING.

## Run locally

```bash
npm start
```

Then open SPRING at `http://localhost:3000/spring/`. The language follows the browser language: in Chrome under Settings > Languages, in Safari via the system language.

## SPRING's tests

`npm test` in the main folder runs every test of the collection. These concern SPRING:

| File | Checks |
|---|---|
| `spring/tests/game.test.js` | Starting position, first moves, no diagonals, jump and undo, save and load, full solution, rating |
| `spring/tests/figures.test.js` | Every figure uses the 33-hole board, **every figure solvable to Masterful**, ordering, navigation, detecting unsolvable positions |
| `shared/tests/gutter.test.js` | 31 marbles fit into the rim, motion comes to rest, bumps pass on momentum, tilt gathers marbles at the bottom, free spots, finger pushes |
| `shared/tests/tilt.test.js` | Gravity from device angles in portrait and landscape, tilt switch even while the permission prompt is open |
| `shared/tests/i18n.test.js` | Among others: SPRING's texts have the same keys in both languages and no dashes |
| `tests/release.test.js` | Among others: every SPRING reference carries the right version, the service worker knows every module, the folder is complete |

The browser test `npm run e2e` opens SPRING on iPhone, iPhone landscape, iPhone SE and iPad, in German and English, and plays a move including undo. For this `main.js` exposes `window.__game` (`history`, `e2e.move()`, plus `view`, `game`, `switchFigure`).

### Also check by hand

1. Switch figure, hint, undo, new, result card, next figure.
2. Tap and swipe the rim, turn tilt on and off.
3. Light and dark mode.

## Testing on iPhone or iPad

1. Run `npm start` on your computer.
2. On the iPhone, open `http://<computer IP>:3000/spring/` in Safari.

Without HTTPS the service worker and the motion sensor do not work. Test those two via the published address.

**Debugging with a Mac:** iPhone: Settings > Apps > Safari > Advanced > turn on Web Inspector, connect with a cable, then on the Mac in Safari: Develop menu > name of the iPhone > choose the page.

## Conventions for SPRING

| Topic | Rule |
|---|---|
| Texts | SPRING texts in `spring/js/strings.js`, general texts in the shell. Always in both languages |
| Interface | Never change the header, control bar, sheets or result card inside SPRING. Change them in the shell so every game benefits |
| Colours and fonts | From `shared/tokens.css`. `spring/css/spring.css` only holds values that exist only in SPRING |
| Separation | Logic modules never touch `document` |
| References | Own files always with `?v=<SPRING version>`, shell files with `?shell=<shell version>` |
| Writing style | Code comments in German, no dashes in texts and documentation |
| Documentation | Every change is reflected in `docs/de` and `docs/en` and in both changelogs |

## A new SPRING version

1. `npm test` and `npm run e2e` pass.
2. `node scripts/release.mjs spring <version>` sets the version in every SPRING file.
3. Add new JavaScript files to the list in `spring/sw.js` (the test reports it otherwise).
4. Update SPRING's `CHANGELOG.md` and `CHANGELOG.de.md`.
5. Update the documentation in both languages, for visible changes also the images in `docs/images`.
6. Pull request. Merge once the tests are green, the version is live one or two minutes later.
