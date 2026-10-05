# Architecture

[Deutsche Version](../de/architektur.md) · [Overview](README.md)

## Modules

| File | Task | DOM |
|---|---|---|
| `js/shapes.js` | Shapes as pictures, rotations and mirror images, seeded weighted random | no |
| `js/modes.js` | Modes, points, streak, stars | no |
| `js/game.js` | Game logic: placing, clearing, filling the tray, end, calm, undo, hint, saving | no |
| `js/view.js` | Plate, pieces, tray, preview and animations on canvas | yes |
| `js/input.js` | Dragging with finger and mouse, keyboard | yes |
| `js/sound.js` | Sounds, subclass of the sound engine of the shell | Web Audio |
| `js/main.js` | Connects everything to the shell: modes, undo, hint, new game, best scores, result | yes |

## Data model

```
board      n rows × n columns, row 0 at the top. Cell: 0 (empty) or shape number + 1
tray       three keys such as 'l4:3' (shape and orientation) or null for an empty slot
rng        seeded random (mulberry32), its state is saved with the game
score, moves, lines
streak     current streak, idle: pieces since the last clear
state      playing or over
undoSnap   state before the last piece
```

Because the state of the random generator belongs to the game, undo after a refill brings back the same pieces. A player cannot force new pieces by undoing.

## Life of a piece

1. `input.js` detects a press on a slot (`view.slotAt`) and creates `view.drag`.
2. On every move `view.dragBox()` computes where the piece is, `view.dragTarget()` looks for the nearest spot where it fits (at most 0.75 cells away), and `game.preview()` returns the lines that would clear.
3. On release `game.place(slot, x, y)` runs the logic. If the piece does not fit, it glides back.
4. `game.place` places the piece, removes full rows and columns at the same time, computes points and streak, refills the tray when it is empty and checks for the end.
5. `game.drainEvents()` returns what happened: `place`, `clear`, `score`, `refill`, `calmClear`, `gameOver`, `undo`. Every event goes to `view.handle()` (animations) and to the sound.

The logic finishes at once, the view follows with animations.

## Filling the tray

`game.refill()` draws three pieces up to 40 times, depending on the mode:

| Rule | Modes | Condition |
|---|---|---|
| `one` | Classic, Wide | At least one of the three pieces fits on the current board |
| `all` | Calm | All three fit in some order, with clears in between |

Whether all three fit is checked by `canPlaceAll()` with a depth first search over orders and spots. It is limited to 6,000 steps, after that the answer counts as no and the game draws again. On an empty board it finds a solution at once, on a full board there are only few spots. If no draw matches, the game takes the first one in which at least one piece fits.

## Rendering

One canvas, drawn only when something changes or an animation runs. Plate, border and hollows live in a separate layer that is only rebuilt for a new size. Every cell is a sprite per colour and size in device pixels.

## Saving

Under the prefix `blocks:` in local storage:

| Key | Contents |
|---|---|
| `game` | running game (`Game.serialize()`), after every piece and when leaving |
| `mode` | last chosen mode |
| `stats` | per mode: number of games and best result (points, lines, pieces) |
| `preview` | setting |
| `sound`, `soundStyle`, `coachSeen` | from the shell |

## Shell

BLOCKS uses shell 1.5.0 without changes: the control bar of the shell (Undo, Hint, New, Modes, More), the picker as sheet or drawer, one switch in the settings and the result card. The SVG board of the shell is hidden, the canvas sits on the stage as its own element.

## Development and tests

```bash
npm start                           # http://localhost:3000/blocks/
npm test                            # logic tests, including blocks/tests/
npm run e2e                         # browser test of all games
node blocks/tools/bot.mjs 40        # computer player: points per mode, time per piece
node blocks/tools/screenshots.mjs   # images of the documentation
node blocks/tools/icons.mjs         # app icons
```

The browser tools need Playwright: `npm install --no-save playwright && npx playwright install chromium`.

| Test | Checks |
|---|---|
| `tests/game.test.js` | Shapes and orientations, random, modes, placing, rows and columns at once, points, streak, refill, rules `one` and `all`, search with clears, end, calm, undo, hint, saving, stars, a whole game |
| `scripts/e2e.mjs` | Shell complete, nothing sticks out of the screen, one move and undo, no errors, on iPhone, iPhone SE, iPhone landscape and iPad. Plus the checks "Drag" (drag a piece onto the board with the mouse) and "Return" (release elsewhere, the piece stays on the tray) |

New version: `node scripts/release.mjs blocks <version>`.
