# Architecture

[Deutsche Version](../de/architektur.md) · [Overview](README.md)

## Modules

| File | Task | DOM |
|---|---|---|
| `js/pieces.js` | Seven shapes, rotations, SRS wall kicks, seeded randomness, 7-bag | no |
| `js/modes.js` | Modes, speed per level, scoring, stars | no |
| `js/game.js` | Game logic: gravity, lock delay, move, rotate, hold, lines, end, saving | no |
| `js/view.js` | Box, pieces and animations on two canvas layers, card for start and pause | yes |
| `js/input.js` | Keyboard with delayed auto repeat, gestures | yes |
| `js/sound.js` | Sounds, subclass of the shell's sound engine | Web Audio |
| `js/main.js` | Connects everything to the shell: modes, pause, statistics, result, frame loop | yes |

## Data model

```
board      22 rows × 10 columns, row 0 at the top. Rows 0 and 1 are hidden.
           Cell: 0 (empty) or id × 8 + shape + 1. Equal codes belong to the same piece,
           which lets view.js draw workpieces with seams and joints.
active     { type, rot, x, y, id }: the falling piece, x and y are the top left of its box
queue      the next shapes, always at least 7, refilled from 7-bags
hold       held shape or null, holdUsed blocks a second hold per piece
state      ready, playing, over (box full) or done (goal reached)
```

Randomness comes from a small seeded generator (mulberry32). Its state is saved too, so a resumed game brings exactly the same pieces.

## The frame loop

`main.js` runs on `requestAnimationFrame`:

1. If a shell sheet is open, the game pauses.
2. While playing: `input.update(dt)` repeats held keys, then `game.step(dt)` applies gravity, lock delay and the next piece.
3. `game.drainEvents()` returns what happened: `spawn`, `move`, `rotate`, `blocked`, `softDrop`, `hardDrop`, `lock`, `hold`, `levelUp`, `calmClear`, `gameOver`, `finish`.
4. Every event goes to `view.handle()` (animations) and to the sound, `lock` also to captions and saving.
5. Header and control bar are only updated when something changes.
6. `view.update(dt)` advances animations, `view.draw()` paints.

Input acts on the logic at once. The display follows softly, a fast tap is never lost.

## Rendering

| Layer | Contents | Redrawn |
|---|---|---|
| `base` | box, well, dot grid, resting pieces, compartments, numbers | only when something changes or an animation runs |
| `fx` | falling piece, ghost piece, trail, gleam, captions, dimming for start and pause | every frame |

Each cell is a sprite, drawn once per shape, neighbourhood (8 neighbours as a bit mask) and cell size. After that `drawImage` only copies images. When lines clear, `view.js` reconstructs the board before the clear from the board after it and the removed rows, shows the dissolve and then the slide down.

## Input

**Keyboard:** pressing a key moves the piece at once. After 170 ms (DAS) the move repeats every 50 ms (ARR). The last pressed direction wins. Keys do nothing while the result card or a sheet is open. Space takes focus away from buttons so it never triggers “New” by accident.

**Gestures:** recognised on the whole stage.

| Gesture | Recognition |
|---|---|
| Tap | less than 10 points of movement, shorter than 280 ms. Left of the well's centre counterclockwise, right clockwise. On the hold box: hold |
| Horizontal drag | one cell per 0.92 cell widths of finger travel (like a ratchet) |
| Drag down | one row per step, horizontal movement becomes stiffer (1.6 steps) so diagonal swipes do not shift the piece |
| Swipe down | peak speed above 0.85 points per ms in the last 150 ms, or long swipes over 3 cells averaging more than 0.42 points per ms |
| Swipe up | peak speed above 0.7 points per ms upwards |

## Saving

Under the prefix `fuge:` in local storage:

| Key | Contents |
|---|---|
| `game` | running game (`Game.serialize()`), after every lock, on pause and when leaving |
| `mode` | last chosen mode |
| `stats` | per mode: number of games and best result (score, lines, level, time) |
| `ghost`, `patterns` | settings |
| `sound`, `soundStyle`, `coachSeen` | from the shell |

## Shell

FUGE uses shell 1.2.0 with three small, backwards compatible additions available to every game: custom buttons `{ id, icon, labelKey }`, `setButton()` for Pause and Resume, and `showResult({ showBack: false })`. The shell's SVG board is hidden, the box sits on the stage as its own element.

## Development and tests

```bash
npm start                         # http://localhost:3000/fuge/
npm test                          # logic tests, including fuge/tests/
npm run e2e                       # browser test of all games
node fuge/tools/playtest.mjs      # play test with gestures, keys and buttons
node fuge/tools/screenshots.mjs   # documentation images
node fuge/tools/icons.mjs         # app icons
```

The browser tools need Playwright: `npm install --no-save playwright && npx playwright install chromium`.

| Test | Checks |
|---|---|
| `tests/game.test.js` | shapes and rotations, 7-bag, spawning, walls, wall kicks on the left and right, rotating on resting pieces, hard and soft drop, gravity, lock delay, hold, lines, Quart, back to back, combo, all clear, T-spin, levels, Sprint, 3 minutes, game over, Calm, saving, stars |
| `tools/playtest.mjs` | start by tap, drag, tap left and right, swipe up and down, slow drag, key repeat to the wall, rotate, space, pause stops time, settings pause, hold, new, mode switch, resume after reload |
| `scripts/e2e.mjs` | complete shell, nothing off screen, one move, no errors, on iPhone, iPhone SE, iPhone landscape and iPad |

New version: `node scripts/release.mjs fuge <version>`.
