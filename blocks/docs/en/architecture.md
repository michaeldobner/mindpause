# Architecture

[Deutsche Version](../de/architektur.md) · [Overview](README.md)

## Modules

| File | Task | DOM |
|---|---|---|
| `js/shapes.js` | Shapes as pictures, rotations and mirror images, seeded weighted random | no |
| `js/modes.js` | Free modes, points, streak, stars | no |
| `js/levels.js` | 30 levels: difficulty curve, shapes per chapter, stars by pieces | no |
| `js/level-data.js` | Starting boards, seeds and par values, created by `tools/levels.mjs` | no |
| `js/game.js` | Game logic: placing, clearing, filling the tray, end, calm, undo, hint, saving | no |
| `js/view.js` | Plate, pieces, tray, preview and animations on canvas | yes |
| `js/input.js` | Dragging with finger and mouse, keyboard | yes |
| `js/sound.js` | Sounds, subclass of the sound engine of the shell | Web Audio |
| `js/main.js` | Connects everything to the shell: levels and modes, progress, undo, hint, new game, best scores, result | yes |

## Data model

```
mode       'classic', 'wide', 'calm' or 'level', plus level (1 to 30)
board      n rows × n columns, row 0 at the top. Cell: 0 (empty) or shape number + 1
pre        levels only: which cells still hold starting blocks
tray       three keys such as 'l4:3' (shape and orientation) or null for an empty slot
rng        seeded random (mulberry32), its state is saved with the game
score, moves, lines
streak     current streak, idle: pieces since the last clear
state      playing, over (lost) or won (level complete)
undoSnap   state before the last piece
```

Because the state of the random generator belongs to the game, undo after a refill brings back the same pieces. A player cannot force new pieces by undoing.

## Life of a piece

1. `input.js` detects a press on a slot (`view.slotAt`) and creates `view.drag`.
2. On every move `view.dragBox()` computes where the piece is, `view.dragTarget()` looks for the nearest spot where it fits (at most 0.75 cells away), and `game.preview()` returns the lines that would clear.
3. On release `game.place(slot, x, y)` runs the logic. If the piece does not fit, it glides back.
4. `game.place` places the piece, removes full rows and columns at the same time (starting blocks included), computes points and streak, checks the level goal, refills the tray when it is empty and checks for the end.
5. `game.drainEvents()` returns what happened: `place`, `clear`, `score`, `refill`, `calmClear`, `levelDone`, `gameOver`, `undo`. Every event goes to `view.handle()` (animations) and to the sound.

The logic finishes at once, the view follows with animations.

## Starting board

* **Levels:** a fixed board from `level-data.js`, the piece order comes from the fixed seed of the level.
* **Free modes:** `scatter()` fills every cell with the probability of the mode and then gives every full line a gap.

In both cases `setup()` looks for a first tray in which all three pieces fit. If 30 attempts fail, the game starts on an empty board, where three pieces always fit. A test checks this for 150 seeds per mode and all 30 levels.

## Creating the levels

`tools/levels.mjs` builds each level along the curve in `levels.js`: a mirror symmetric board with about the wanted density and no full line, plus a seed. The computer player then plays the level by following the hint. The first board it completes, and that is not solved too quickly, is taken. Its number of pieces becomes the par. Because board and seed are fixed, `tests/levels.test.js` checks that every level can still be solved with exactly this par. If the game logic changes, the test fails and the levels are created again with `node blocks/tools/levels.mjs`.

## Filling the tray

`game.refill()` draws three pieces up to 40 times, depending on the mode:

| Rule | Modes | Condition |
|---|---|---|
| `one` | Classic, Wide, levels 21 to 30 | At least one of the three pieces fits on the current board |
| `all` | Calm, levels 1 to 20 | All three fit in some order, with clears in between |

In a level `pickShape()` only draws from the shapes of the chapter.

Whether all three fit is checked by `canPlaceAll()` with a depth first search over orders and spots. It is limited to 6,000 steps, after that the answer counts as no and the game draws again. On an empty board it finds a solution at once, on a full board there are only few spots. If no draw matches, the game takes the first one in which at least one piece fits.

## Rendering

One canvas, drawn only when something changes or an animation runs. Plate, border and hollows live in a separate layer that is only rebuilt for a new size. Every cell is a sprite per colour and size in device pixels.

## Saving

Under the prefix `blocks:` in local storage:

| Key | Contents |
|---|---|
| `game` | running game (`Game.serialize()`), after every piece and when leaving |
| `mode` | last chosen mode or level, for example `level-7` |
| `progress` | highest unlocked level and per level the stars, points and pieces of the best result |
| `stats` | per free mode: number of games and best result (points, lines, pieces) |
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
node blocks/tools/levels.mjs        # create and play through the 30 levels
node blocks/tools/screenshots.mjs   # images of the documentation
node blocks/tools/icons.mjs         # app icons
```

The browser tools need Playwright: `npm install --no-save playwright && npx playwright install chromium`.

| Test | Checks |
|---|---|
| `tests/game.test.js` | Starting board and first three pieces in every mode, shapes and orientations, random, modes, placing, rows and columns at once, points, streak, refill, rules `one` and `all`, search with clears, end, calm, undo, hint, saving, stars, a whole game |
| `tests/levels.test.js` | 30 levels, no full line, symmetry, density, sawtooth, shapes per chapter, first three pieces, every level solvable with its par, goal, saving, undo with starting blocks, stars |
| `scripts/e2e.mjs` | Shell complete, nothing sticks out of the screen, one move and undo, no errors, on iPhone, iPhone SE, iPhone landscape and iPad. Plus the checks "Drag" (drag a piece onto the board with the mouse) "Return" (release elsewhere, the piece stays on the tray) and "Level" (play through level 1, level 2 unlocks, result card with "Next level") |

New version: `node scripts/release.mjs blocks <version>`.
