# Development

[Deutsche Version](../de/entwicklung.md) · [Overview](README.md)

## Requirements

* Node.js 20 or newer (for tests and the local server)
* A modern browser

There are no dependencies and no build step.

## Run locally

```bash
npm start
```

Starts a local server, the address is printed in the output (usually `http://localhost:3000`). A server is needed because browsers do not load ES modules, Web Workers or service workers straight from files.

Testing the language: it follows the browser language. In Chrome under Settings > Languages, in Safari via the system language.

## Tests

```bash
npm test
```

30 tests using the built-in Node.js test runner. They also run on every push via GitHub Actions (`.github/workflows/tests.yml`).

| File | Checks |
|---|---|
| `tests/game.test.js` | Starting position, first moves, no diagonals, jump and undo, save and load, full solution, rating |
| `tests/figures.test.js` | Every figure uses the 33-hole board, **every figure solvable to Masterful**, ordering, navigation, detecting unsolvable positions |
| `tests/gutter.test.js` | 31 marbles fit into the rim, motion comes to rest, bumps pass on momentum, tilt gathers marbles at the bottom, free spots, finger pushes |
| `tests/tilt.test.js` | Gravity from device angles in portrait and landscape, tilt switch even while the permission prompt is open |
| `tests/i18n.test.js` | Language detection, singular and plural, same keys in both languages, no dashes |
| `tests/release.test.js` | Every reference carries the current version, version numbers match, the service worker knows every module |

### Checking in the browser

Play through in the browser before publishing:

1. iPhone portrait, iPhone landscape, iPad landscape (browser developer tools, device mode).
2. Light and dark mode.
3. German and English.
4. Switch figure, hint, undo, new, result card, next figure.
5. Tap and swipe the rim.
6. Console without errors.

For automated browser tests `main.js` exposes a small object `window.__spring` (`view`, `game`, `switchFigure`, `figures`).

## Testing on iPhone or iPad

**On the local network:**

1. Run `npm start` on your computer.
2. On the iPhone, open `http://<computer IP>:3000` in Safari.

Without HTTPS the service worker and the motion sensor do not work. Test those two via the published address.

**Debugging with a Mac:**

1. iPhone: Settings > Apps > Safari > Advanced > turn on Web Inspector.
2. Connect the iPhone with a cable.
3. Mac, Safari: Develop menu > name of the iPhone > choose the page.

## Conventions

| Topic | Rule |
|---|---|
| Code comments | German |
| Texts | Every visible text lives in `js/i18n.js`, always in both languages |
| Writing style | No dashes in texts and documentation, use a comma, full stop, colon or rephrase |
| JavaScript | ES modules, `const` and `let`, classes for stateful parts, small pure helpers |
| Separation | Logic modules never touch `document` |
| Colours | New interface colours as CSS variables in `:root` and in dark mode |
| Touch targets | At least 44 pt |
| Documentation | Every change is reflected in `docs/de` and `docs/en` and in both changelogs |

## Release checklist

1. `npm test` passes.
2. Checked in the browser as described above.
3. Version set with `node scripts/release.mjs <version>`, new files added to the list in `sw.js`.
4. New references to project files always written with `?v=<version>`, like all others.
5. `CHANGELOG.md` and `CHANGELOG.de.md` updated.
6. Documentation updated in both languages, for visible changes also the images in `docs/images`.
