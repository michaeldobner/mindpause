# Changelog of the shell

All notable changes to the MIND PAUSE shell. [Deutsch](CHANGELOG.de.md)

## 1.5.0 (2026-10-04)

Landscape rethought for every game. In landscape the height is scarce, so the header and the controls now sit beside the board instead of above and below it.

### New
* **One landscape layout for all devices:** as soon as the area is clearly wider than tall (aspect ratio from 5:4), title, level and counter sit on the left, the board uses the full height and the buttons are stacked on the right. This applies to iPhone, iPad, computer and Split View. On the iPhone it stays more compact.
* **Drawer instead of sidebar:** the fixed sidebar on the iPad is gone. The picker comes as a drawer from the left, via the level name (with its arrow again) or the button. It closes by itself after a choice.
* **First start:** the picker opens once by itself. When it is closed, the speech bubble at the level name shows where to find it again.
* **"Other …" on the result card** opens the picker. New key `levels.otherKey`, hidden with `showResult({ showOther: false })`.
* In landscape the board may grow beyond 820 px.

### Removed
* `isSidebar()` and the fixed sidebar.

### Tests
* The browser test checks the first start (picker open, then the speech bubble) and that header and controls sit beside the board in landscape and above and below it in portrait.

## 1.4.0 (2026-10-04)

### New
* `resign` button (Resign, flag icon) for the control bar. Up to six buttons; with six they get a little smaller and still fit on the iPhone SE and in landscape.
* `confirm({ title, text, ok, cancel })`: confirmation as a card on the board, returns `true` or `false`. Escape cancels.
* New texts "Resign" and "Cancel" in both languages.

## 1.3.0 (2026-10-04)

Building blocks for FUGE, available to every game. Existing games behave exactly as before.

### New
* Custom buttons in the control bar: an entry in `buttons` can be `{ id, icon, labelKey }`.
* `setButton(id, { icon, labelKey })` changes icon and label, for example between Pause and Resume.
* `showResult({ showBack: false })` hides “Undo last move”, for games without undo.

### Tests
* The browser test checks Undo only for games that show this button.

## 1.2.0 (2026-10-04)

### New
* Settings can now hold a choice besides switches: a `settings` entry with `options` appears as a segmented control at the top of the settings, for example for QUEEN's board style. `setSetting(id, value)` and the `setting(id, value)` action carry the selected value.

## 1.1.0 (2026-10-04)

Building blocks for QUEEN, available to every game.

### New
* `gutter.js`: rim physics, previously part of SPRING. New `arc` option for straight trays with walls at both ends and `speedScale` for circles of a different radius.
* `tilt.js`: motion sensor, previously part of SPRING.
* `SoundEngine.rim()` and `SoundEngine.clack(strength)`: rim sounds, previously part of SPRING.

### Improved
* The header never wraps: level name and counter label stay on one line, and on narrow iPhones (below 360 px) the counter is more compact.

## 1.0.0 (2026-10-04)

First version, extracted from SPRING 2.0.3.

* Design tokens in `tokens.css`, layout and building blocks in `shell.css`
* `createShell()` with header, control bar, picker (sheet, drawer, sidebar), settings, result card, toasts and first launch hint
* `createI18n()` for German and English, `createStorage()` with one prefix per game
* `SoundEngine` with four-layer sound, three sound styles and the iOS unlock
* Offline support per game with versioned references (`?shell=`)
