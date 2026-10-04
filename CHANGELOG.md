# Changelog

All notable changes to SPRING. [Deutsch](CHANGELOG.de.md)

## 2.0.3 (2026-10-04)

### Fixed
* **Sound after restarting the app** works again right away. iOS only enables sound when a finger is lifted or on a complete tap, not on the first touch, and pauses it after switching apps. SPRING now resumes sound on every such touch.
* **Tilt after restarting the app** reconnects reliably for the same reason and no longer switches itself off.

### Changed
* **New needs only one tap.** If it was a mistake, Undo right afterwards brings the previous game back. The "Sure?" confirmation is gone.

## 2.0.2 (2026-10-04)

### Fixed
* **Undo** no longer gets lost: a tap during an animation (for example while the captured marble is still rolling) waits until it has finished. Several quick taps are carried out one after another. The board can no longer get stuck after an error or a lost touch.
* **Tilt switch**: right after launch it could turn itself back on instead of off while iOS was still asking for permission. The switch now always shows what you chose.
* **No constant noise**: the rolling sound in the rim has been removed, it was audible all the time while tilting. Bumps still click softly.
* **End screen** no longer reappears: switching figures always starts a new game, and a finished game starts fresh on the next launch.

### Changed
* The "in progress" badge on figure cards has been removed, since every switch starts a new game.

## 2.0.1 (2026-10-04)

### Fixed
* On devices that had already loaded an earlier version, new and old files could mix after an update. The result was an empty field below SPRING, missing button labels, a layout that spilled over to the right and buttons that did not work. Every version now loads only its own files (`?v=` on every reference), the service worker bypasses the browser cache and the page reloads once when a new version takes over.
* On very narrow iPhones (SE, 1st generation) the five buttons now fit on screen.

### Technical
* New `scripts/release.mjs` sets a version number everywhere.
* New `tests/release.test.js` checks versioned references, so the error cannot return. 29 tests in total.

## 2.0.0 (2026-10-04)

The game is now called **SPRING**.

### New
* **7 figures** sorted by difficulty: Cross, Plus, Pyramid, Arrow, Diamond, Fireplace, Classic. Every figure is verified as solvable to a single marble in the centre.
* **Switch figures during play** via the figure name in the header, the Figures button, or the sidebar on iPad in landscape. The board rebuilds itself with an animation.
* **Separate progress per figure**: switching never loses a game.
* **Stars** per figure (up to three) and per figure statistics.
* **Next figure** button on the result card.
* **Hints**: a solver in a Web Worker shows the next correct move.
* **Living rim**: captured marbles and unused marbles lie loose in the rim and react to taps and swipes with physics, collisions and sound.
* **Tilt** (optional): marbles in the rim roll when the device is tilted.
* **New sound design** in four layers (contact, wood, ceramic, room), tuned to a pentatonic scale and rising with progress. Three sound styles: Warm, Clear, Soft.
* **Bilingual**: German on German devices, English everywhere else.
* **Settings sheet** with sound, sound style and tilt.
* One time hint on first launch showing where to change the figure.

### Changed
* All 32 marbles are always present. Marbles a figure does not need rest in the rim.
* Controls: Undo, Hint, New, Figures, More.
* The iPhone respects the silent switch.
* Saved games and statistics from version 1 are carried over automatically.

### Technical
* New modules: `figures.js`, `gutter.js`, `solver.js`, `solver-worker.js`, `tilt.js`, `i18n.js`.
* 26 automated tests, run on every push via GitHub Actions.
* Documentation fully available in German and English.

## 1.0.0 (2026-10-04)

First version, still called Solohalma.

* Classic English board with 33 holes and 32 marbles
* Tap or drag, unlimited undo, rating at the end of a game
* Round dark blue board, captured marbles roll into the rim
* Light and dark mode, portrait and landscape
* Progressive web app, works offline
