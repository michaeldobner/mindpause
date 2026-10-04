# MIND PAUSE · Shell

[Deutsch](README.de.md) · [Collection](../README.md) · [Changelog](CHANGELOG.md)

The shell is everything every MIND PAUSE game shares. A game only describes what makes it unique: rules, board, levels and its own sounds. Interface, design, sound engine, rim physics, tilt, languages, storage and offline support come from here.

**Rule of thumb:** if a change should affect every game, it belongs here. If it only concerns one game, it belongs in that game's folder.

Current version: **1.5.0**

## Contents

| File | Purpose |
|---|---|
| `tokens.css` | Design tokens: fonts, colours, spacing, shadows, motion, light and dark mode |
| `shell.css` | Layout and building blocks, uses only values from `tokens.css` |
| `js/shell.js` | `createShell()`: builds the interface and returns the functions to control it |
| `js/i18n.js` | `createI18n()`: language detection and texts of the shell, extended by each game |
| `js/storage.js` | `createStorage(prefix)`: saving on the device, one prefix per game |
| `js/sound-engine.js` | `SoundEngine`: ceramic on wood, mastering, sound styles, iOS unlock, rim sounds |
| `js/gutter.js` | `Gutter`: physics for pieces in a round rim (SPRING) or a straight tray (QUEEN) |
| `js/tilt.js` | `Tilt`: motion sensor with the iOS permission request, provides gravity in screen space |
| `tests/` | Tests of the shell |

## Design tokens

All values live as CSS variables in `tokens.css`. Games never use fixed values for colours or fonts, only these variables.

| Variable | Light | Dark | Use |
|---|---|---|---|
| `--bg`, `--bg-edge` | `#ece8e1`, `#e2ddd4` | `#141519`, `#0d0e11` | Background with vignette |
| `--ink`, `--ink-soft` | `#1a1d4e`, `#6b6d85` | `#e9e7f2`, `#8f91a6` | Text and icons, secondary text |
| `--btn`, `--btn-border` | `#f7f4ef`, 12 % ink | `#1e2027`, 8 % white | Buttons |
| `--card`, `--sheet` | `#faf8f4`, `#f6f3ee` | `#1e2027`, `#1b1d23` | Cards, sheets, drawer |
| `--accent` | `#3f6ef0` | `#3f6ef0` | Current selection, switches, highlight |
| `--star`, `--hint` | `#e0a526`, `#ffd36b` | same | Stars, hint ring |
| `--shadow` | soft | stronger | Buttons and cards |
| `--font` | San Francisco (system font) | | Text and labels |
| `--font-display` | Didot, Bodoni 72, fallback Georgia | | Titles, numbers, headings |
| `--ease` | `cubic-bezier(0.32, 0.72, 0, 1)` | | Sheets and switches |

**Example: changing the font of every game.** Change `--font-display` in `tokens.css`, run `node scripts/release.mjs shell <new version>`, check the screenshots of the browser test, merge. Every game shows the new font.

## Building blocks of the interface

| Building block | Behaviour |
|---|---|
| Header | Title of the game, name of the current level with a chevron, counter on the right |
| Control bar | Up to six round buttons with labels, chosen by the game: `undo`, `hint`, `restart`, `resign`, `levels`, `settings` or the game's own (for example Hold and Pause in FUGE). With six they get a little smaller so they fit on the iPhone SE too |
| Picker | Portrait: sheet from the bottom with cards to swipe. Landscape (iPhone, iPad, computer): drawer from the left. Opens by itself on the first start and closes after a choice |
| Landscape | As soon as the area is clearly wider than tall (aspect ratio from 5:4): title, level and counter on the left, full height board, controls stacked on the right. More compact on the iPhone |
| Level card | Preview, name, meta line, up to three stars, five difficulty dots, current card outlined in blue |
| Settings | Choices defined by the game (for example the board style), sound on or off, sound style (Warm, Clear, Soft), switches defined by the game, a note, version line |
| Result card | Title, stars, text, statistics, "Play again", optional "Next …", "Undo last move" and "Other …" (opens the picker) |
| Confirmation | Card on the board with title, text and two buttons, for example before resigning. Escape cancels |
| Toast | Short message at the bottom of the board |
| First start | The picker opens by itself. Once it is closed, a speech bubble at the level name shows where to find it again. Only once per game |

Sheets close on swipe down, tap outside, the cross or Escape. Touch targets are never below 44 pt. All layouts respect the notch, Dynamic Island and home indicator.

## Connecting a game

A game calls `createShell()` in its `main.js`:

```js
import { createShell } from '../../shared/js/shell.js?shell=1.5.0';
import { createI18n } from '../../shared/js/i18n.js?shell=1.5.0';
import { createStorage } from '../../shared/js/storage.js?shell=1.5.0';

const storage = createStorage('queen:');
const i18n = createI18n(QUEEN_STRINGS);         // texts of the game, de and en
const sound = new QueenSound({ enabled: storage.load('sound', true) });

const shell = createShell({
  title: 'QUEEN',
  version: '1.1.0',
  i18n,
  storage,
  sound,
  buttons: ['undo', 'hint', 'restart', 'levels', 'settings'],
  levels: { buttonKey: 'modes', titleKey: 'chooseMode', nextKey: 'nextLevel', otherKey: 'otherMode' },
  settings: [
    { id: 'theme', nameKey: 'theme', options: [{ value: 'classic', labelKey: 'themes.classic' }, { value: 'midnight', labelKey: 'themes.midnight' }] },
    { id: 'flip', nameKey: 'flip', textKey: 'flipText' },
  ],
  noteKey: 'trayHint',
  coachKey: 'coach',
  boardLabelKey: 'boardLabel',
  actions: { undo, hint, restart, again, back, next, selectLevel, setting },
  onGesture: () => {},
});
```

### Options

| Option | Meaning |
|---|---|
| `title` | Title in capitals, appears in the header, browser tab and version line |
| `version` | Version of the game |
| `i18n`, `storage`, `sound` | Created with `createI18n`, `createStorage` and a subclass of `SoundEngine` |
| `buttons` | Which buttons the control bar shows, in this order. An entry is a shell name or a custom button `{ id, icon, labelKey }`: `icon` is SVG content in a 24 × 24 box, a tap calls `actions[id]` |
| `levels` | Optional picker: keys for the button label, the title, the "Next" button and the "Other …" link on the result card |
| `settings` | Additional settings. A switch has `id`, `nameKey` and `textKey`. A choice has `id`, `nameKey` and `options` with `value` and `labelKey`, and appears as a segmented control at the top of the settings |
| `noteKey`, `coachKey`, `boardLabelKey` | Optional texts: note in the settings, first launch hint, label of the board |
| `actions` | Functions the shell calls: `undo`, `hint`, `restart`, `again`, `back`, `next`, `selectLevel(id)`, `setting(id, value)`. For a switch `value` is the new state, for a choice the selected `value` |
| `onGesture` | Called on every touch that iOS accepts as a user gesture (for permissions such as the motion sensor) |

### What the shell returns

| Function | Purpose |
|---|---|
| `board` | The SVG element of the board inside the stage |
| `setCounter(value, label)` | Counter on the right of the header |
| `setLevelLabel(text)` | Name of the current level, also sets the browser tab |
| `renderLevels(items)` | Fills the picker. `items`: `{ id, name, meta, stars, difficulty, preview, current }` |
| `setDisabled(name, bool)`, `setBusy(name, bool)` | State of a button, for example while the hint is computing |
| `setButton(id, { icon, labelKey })` | Change a button's icon and label, for example Pause and Resume |
| `showResult(opts)`, `hideResult()` | Result card. `opts`: `{ title, text, stars, stats, highlight, showNext, showBack, showOther }`. `showBack: false` hides “Undo last move”, for games without undo. `showOther: false` hides “Other …” |
| `confirm({ title, text, ok, cancel })` | Confirmation. Returns a promise with `true` (ok) or `false` (cancel). `cancel` is optional, default "Cancel" |
| `toast(text)`, `hideToast()` | Short message |
| `showCoach()` | First start: opens the picker, the speech bubble follows when it closes. Only once per game |
| `setSetting(id, value)` | Shows the state of a switch (`true` or `false`) or the selected value of a choice |
| `openPanel(name)`, `closePanels()` | Control the sheets |

### Texts

`createI18n(gameStrings)` merges the shell's texts with the game's. Both languages need the same keys, the test `shared/tests/i18n.test.js` checks this for every game. Plural: `{ one: 'marble', other: 'marbles' }`, used with `t('marbles', { n })`.

Texts of the shell: undo, hint, new, resign, cancel, more, close, difficulty, game over, play again, undo last move, the restart message, thinking, settings, sound, sound style with the three styles, version and the collection name.

### Sounds

`SoundEngine` provides:

| Method | Purpose |
|---|---|
| `unlock()` | Unlocks sound on iOS, called by the shell on every touch |
| `tap(progress, { soft })` | A piece is placed: four layers, pitch rises with `progress` from 0 to 1 |
| `invalid()` | Two muted wooden knocks |
| `win(perfect)` | Rising triad, with a bell tone when `perfect` |
| `preview()` | Short preview when choosing a sound style |
| `rim()` | A piece rolls into the rim or the tray |
| `clack(strength)` | Pieces bump into each other in the rim, at most eight clicks per second |
| `transient`, `wood`, `ceramic` | Building blocks for a game's own sounds |

A game extends the class with its own sounds, for example SPRING with `lift`, `land` and `gutter`, QUEEN with `lift`, `place`, `hop`, `crown` and `lose`. Sound design in detail: [SPRING sound design](../spring/docs/en/sound.md).

### Rim and trays

`Gutter` describes every piece only by its **angle** on a circle and its angular velocity. Friction, collisions, tilt and finger input are the same for every game.

```js
import { Gutter } from '../../shared/js/gutter.js?shell=1.5.0';

// Round rim as in SPRING
const rim = new Gutter({ radius: 446, marbleRadius: 37, onCollide: (i) => sound.clack(i) });

// Straight tray as in QUEEN: an arc section on a very large circle
const R = 10000;
const tray = new Gutter({
  radius: R,
  marbleRadius: 34,
  arc: { center: Math.PI / 2, half: 440 / R },  // centre and half length as angles
  speedScale: 446 / R,                          // motion feels the same as in SPRING
  onCollide: (i) => sound.clack(i),
});
```

| Method | Purpose |
|---|---|
| `add(id, angle, v)`, `remove(id)`, `has(id)`, `size` | Manage pieces |
| `freeAngle(wish)` | Nearest free spot, in a tray only between the walls |
| `pack(ids)` | Lay pieces side by side, in a tray around the centre |
| `angleOf(id)`, `position(angle)` | Angle of a piece, point on the circle |
| `push(angle, v)`, `nudge(angle)` | Swipe and tap |
| `gravity`, `rotation` | Tilt in screen space, rotation of the board on screen |
| `step(dt)` | One time step, returns `true` while anything moves |

With `arc` the rim gets walls at both ends: pieces bounce off, and there is no passage from one end to the other. `speedScale` converts maximum speed, rest threshold, tilt and impact strength for a different radius.

### Tilt

```js
import { Tilt } from '../../shared/js/tilt.js?shell=1.5.0';

const tilt = new Tilt((x, y) => view.setGravity(x, y), storage.load('tilt', false));
const result = await tilt.enable();   // 'ok', 'off', 'denied' or 'unsupported'
tilt.disable();
```

On iOS `enable()` must be called from a touch (`onGesture` or the `setting` action). `wanted` is the wish shown in the switch, `enabled` the connected sensor. If tilt is turned off during the permission request, turning off wins.

### Test hook

For the browser test every game provides `window.__game` with at least:

* `history`: number of moves made so far
* `e2e.move()`: plays one valid move (for example the hint)

## Offline and versions

* Every game has its own `sw.js` and `manifest.webmanifest` and installs as its own app.
* Shell files are referenced with `?shell=<shell version>`, game files with `?v=<game version>`.
* `node scripts/release.mjs shell <version>` updates every `?shell=` reference in every game and the `SHELL` constant in every service worker. Each game then loads the new shell exactly once and never mixes versions.
* The service worker of a game also caches the shell files.

## Checklist for changes to the shell

1. Change made in `shared/`, never inside a game.
2. `npm test` and `npm run e2e` pass.
3. Screenshots of the browser test checked for every game.
4. `node scripts/release.mjs shell <version>`.
5. `CHANGELOG.md` and `CHANGELOG.de.md` of the shell updated. Games mention the change in their changelog when players notice it.
6. This README updated in both languages.
