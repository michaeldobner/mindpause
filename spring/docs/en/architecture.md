# Architecture

[Deutsche Version](../de/architektur.md) · [Overview](README.md)

## Overview

SPRING is one game of the **MIND PAUSE** collection. Everything all games share (header, control bar, sheets, settings, result card, toasts, languages, storage, sound engine, offline support) comes from the **shell** in `shared/`. This folder only contains what is specific to SPRING. How the shell works is described in the [shell documentation](../../../shared/README.md).

There is no server logic and no build step. The browser loads `index.html`, the stylesheets and the JavaScript modules directly.

```
spring/index.html
 ├─ ../shared/tokens.css          design tokens of the collection (fonts, colours, spacing)
 ├─ ../shared/shell.css           layout and building blocks of the shell
 ├─ css/spring.css                only the board and the figure previews
 └─ js/main.js                    entry point: connects SPRING to the shell
     ├─ ../shared/js/shell.js     shell interface (createShell)
     ├─ ../shared/js/i18n.js      shell languages (createI18n)
     ├─ ../shared/js/storage.js   storage (createStorage)
     ├─ ../shared/js/tilt.js      motion sensor
     ├─ js/strings.js             SPRING texts in German and English
     ├─ js/figures.js             the 7 figures as data
     ├─ js/game.js                game logic (no rendering)
     ├─ js/view.js                SVG board, animations, input
     │   └─ ../shared/js/gutter.js  physics of the marbles in the rim
     ├─ js/sound.js               SPRING sounds (extends the shell's sound engine)
     └─ js/solver-worker.js       Web Worker for hints
         └─ js/solver.js          solver (no rendering)

spring/sw.js                      service worker for SPRING's offline support
spring/manifest.webmanifest       metadata for installing as its own app
```

Core principle: **data → logic → rendering**. `figures.js`, `game.js`, `solver.js`, the shell's physics and the language modules never touch the document. They therefore also run in Node.js, where they are fully tested.

### Connecting to the shell

`main.js` calls `createShell()` with SPRING's description:

| Option | Value for SPRING |
|---|---|
| Title | `SPRING` |
| Buttons | Undo, Hint, New, Figures, More |
| Picker | Figures, with preview, stars and difficulty |
| Extra setting | Tilt |
| Note in the settings | "Swipe across the marbles in the rim" |
| Actions | Undo, Hint, New, Play again, Next figure, Choose figure, Toggle tilt |

In return the shell provides the stage with the SVG board and functions such as `setCounter`, `showResult`, `toast` or `renderLevels`.

## Modules

### `figures.js`: figures as data

```js
{
  id: 'kreuz',
  name: { de: 'Kreuz', en: 'Cross' },
  difficulty: 1,
  layout: [
    '  ...  ',
    '  .o.  ',
    '..ooo..',
    '...o...',
    '...o...',
    '  ...  ',
    '  ...  ',
  ],
}
```

| Character | Meaning |
|---|---|
| `o` | Hole with a marble |
| `.` | Empty hole |
| space | No hole |

The goal for every figure is one marble in the centre (`GOAL = [3, 3]`). Helpers: `figureById(id)`, `nextFigure(id)`. The figure ids are German words and stay stable as storage keys.

### `game.js`: class `Game`

| Property or method | Purpose |
|---|---|
| `cells` | All holes with row `r`, column `c` and starting state `start` |
| `marbles` | For each hole the id of the marble on it, or `null` |
| `history` | Every move made, the basis for undo |
| `cellAt(r, c)` | Hole index for a position, `-1` outside |
| `movesFrom(i)`, `allMoves()`, `findMove(from, to)` | Valid jumps |
| `apply(move)`, `undo()` | Make and take back a jump |
| `count`, `isOver`, `isPerfect` | State |
| `rating()` | `{ key, stars, left }`, the text comes from `i18n.js` |
| `occupancy()` | Occupancy as a list of `true` and `false` for the solver |
| `serialize()`, `restore(data)` | Save and load progress |

A **move** is `{ from, over, to }` with three hole indices. In `history` the ids of the jumping marble (`marble`) and the captured marble (`captured`) are added.

### `view.js`: class `BoardView`

**The marble pool.** There are always exactly 32 SVG marbles, 16 blue and 16 black. When a figure is set, `mapFigure()` assigns a pool marble of the right colour to every marble of the figure: holes whose row plus column is even are blue, the others black. All remaining pool marbles rest in the rim.

| Method | Purpose |
|---|---|
| `setGame(game)` | Set a figure without animation (app start) |
| `morph(game)` | Switch or restart a figure with animation |
| `play(move, fromPos)` | Animate a jump, roll the captured marble into the rim |
| `undo()` | Animate taking back the last move |
| `select(i)`, `showHint(from, to)` | Selection, target rings, hint ring |
| `setGravity(x, y)` | Pass the tilt on to the physics |

**SVG layers** from bottom to top: shadow and board, lines, holes, target rings, marbles.

**Input** via Pointer Events (finger, pen and mouse alike):

| Touch | Behaviour |
|---|---|
| In the rim (distance from centre above 398) | Goes to the physics: a tap pushes, a swipe shoves. The game is untouched |
| On a target hole | Jump of the selected marble |
| On a marble with moves | Select, drag after 10 px of movement |
| On a marble without moves | Wobble and knock |
| Release near a target | Jump, otherwise the marble rolls back |

**Queue:** `play`, `undo` and `morph` run one after another through `run()`, never at the same time. A tap on Undo during an animation waits until it has finished instead of getting lost. `busy` is always reset in a `finally` and errors in events are caught, so the board can never get stuck. New moves on the board are locked during an animation, the rim stays interactive. If iOS does not report a finger being lifted, the next touch clears the old state.

**Events to `main.js`:** `move(record, phase)` with the phases `jump`, `land`, `gutter`, plus `invalid`, `lift`, and `clack(intensity)`.

### Rim physics

`shared/js/gutter.js` (part of the shell since 1.1.0 and shared with QUEEN) describes each marble in the rim only by its **angle** on a circle (radius 446) and its **angular velocity**. This keeps the maths small and the behaviour calm and predictable.

| Quantity | Value | Effect |
|---|---|---|
| Friction | 2.2 per second (exponential) | Motion fades after about 1.5 s |
| Restitution | 0.55 | Partly elastic bumps, momentum travels through a row as a wave |
| Maximum speed | 9 rad/s | No wild spinning |
| Rest threshold | 0.02 rad/s | Below this a marble stops |
| Tilt | up to 7 rad/s² | Tangential component of gravity at each point of the circle |

One time step (`step`): tilt as acceleration, friction, motion, then collision resolution. Collisions are resolved in up to four passes over sorted neighbours: separate overlaps and, when approaching, exchange velocities using the collision formula for equal masses. `view.js` runs three sub-steps per frame. The loop only runs while something moves and then sleeps, which saves battery.

`freeAngle(wish)` finds the nearest gap for a new marble. If there is none it is inserted anyway and the neighbours make room on impact.

### `solver.js` and `solver-worker.js`: hints

The solver is a **depth first search with a memo** of positions already known to be unsolvable.

1. `prepare(cells)` computes all possible jumps on the board once, as hole indices.
2. `solve(prepared, occupancy, goal, budget)` searches for a path to a single marble on the goal. Result: a list of moves, `null` (no solution) or `'timeout'`.
3. The Web Worker computes in the background so the interface stays smooth. Time budget in the game: 4 seconds.
4. `main.js` remembers the path found. Following the hint, the next one appears instantly without a new search.

The solver solves all 7 figures from their starting positions in well under a second (verified in `spring/tests/figures.test.js`).

### `sound.js`: sounds

`SpringSound` extends the shell's `SoundEngine` (`shared/js/sound-engine.js`) with SPRING's sounds: lift (`lift`), land (`land`) and rolling into the rim (`gutter`, using the engine's `rim`). Bumps in the rim (`clack`) come from the sound engine itself since shell 1.1.0. See [Sound design](sound.md).

### `shared/js/tilt.js`: motion sensor

Part of the shell since 1.1.0. Reads `deviceorientation` (angles `beta` and `gamma`), derives gravity in device coordinates and rotates it to match the screen orientation:

```
device: gx = cos(β) · sin(γ),   gy = −sin(β)
screen: (gx, −gy), rotated by −screen angle
```

Values are smoothed (factor 0.18). Below a length of 0.07 the device counts as flat. On iOS `enable()` asks for permission via `DeviceOrientationEvent.requestPermission()`, which is only allowed after a touch. `wanted` (the wish, shown in the switch) and `enabled` (sensor connected) are kept separate. Turning it off while the permission prompt is open wins.

### Languages

* The shell detects the language and provides the general texts (`shared/js/i18n.js`).
* `js/strings.js` adds SPRING's texts, always in German and English.
* Figure names live directly in `figures.js` (`name.de`, `name.en`).

### Storage

All values live in `localStorage` with the prefix `spring:`, via the shell's `createStorage('spring:')`. Every access is guarded, the game also runs without storage.

| Key | Contents |
|---|---|
| `spring:figure` | Figure played last |
| `spring:game:<figure>` | Progress of the current figure (`marbles`, `history`, `counted`), resumed on launch unless the game had ended |
| `spring:stats` | Per figure: `games`, `solved`, `perfect`, `best`, `stars` |
| `spring:sound`, `spring:soundStyle` | Sound on or off, sound style |
| `spring:tilt` | Tilt on or off |
| `spring:coachSeen` | First launch hint already shown |
| `spring:migrated` | Migration from version 1 done |

`migrateFromVersion1()` in `main.js` carries over progress, statistics and the sound setting from version 1 (prefix `solohalma:`) to the Classic figure, once.

## Flow of a move

```
finger taps target
   │
   ▼
BoardView.down() ── findMove() ── valid? ── no ──► clear selection
   │ yes
   ▼
BoardView.play()
   ├─ animation: marble jumps in an arc
   ├─ Game.apply()                      state changes immediately
   ├─ move('jump')    main.js           advance hint path, display, save
   ├─ move('land')    main.js           landing sound by progress
   ├─ toRim()                           captured marble rolls to the nearest gap
   └─ move('gutter')  main.js           sound, check end, stars and statistics
```

## Flow of a figure switch

```
card tapped
   │
   ▼
switchFigure(id)
   ├─ start a new game of the chosen figure
   ├─ update display and list, remember the figure
   └─ BoardView.morph(game)
        ├─ mapFigure(): assign pool marbles to holes
        ├─ marbles needed on the board: leave the rim, arc into their hole
        ├─ marbles not needed: toRim()
        └─ physics settles the rim
```

## Offline

Three rules make sure exactly one version always runs completely and old and new files never mix:

1. **Versioned URLs:** every reference to a SPRING file carries `?v=<SPRING version>`, every reference to the shell `?shell=<shell version>`. A new version therefore only loads new URLs that no cache can know. `tests/release.test.js` in the main folder checks this on every push.
2. **Network first, bypassing the browser cache:** `sw.js` fetches every file with `cache: 'no-cache'`. Only without a network does it come from the offline store, which is filled fresh with `cache: 'reload'` on install. It also contains the shell's files.
3. **One reload:** when a new service worker takes control (`controllerchange`), the shell reloads the page once.

Details: [Deployment](deployment.md).
