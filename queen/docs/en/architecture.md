# Architecture

[Deutsche Version](../de/architektur.md) · [Overview](README.md)

## Overview

QUEEN is a game in the **MIND PAUSE** collection. Everything all games share (header, control bar, sheets, settings, result card, notices, languages, storage, sound engine, tray physics, tilt, offline support) comes from the **shell** in `shared/`. This folder only contains what is specific to QUEEN. How the shell works is described in the [shell documentation](../../../shared/README.md).

There is no server logic and no build step. The browser loads `index.html`, the stylesheets and the JavaScript modules directly.

```
queen/index.html
 ├─ ../shared/tokens.css          Design tokens of the collection
 ├─ ../shared/shell.css           Layout and components of the shell
 ├─ css/queen.css                 Only target rings and mode previews
 └─ js/main.js                    Entry point: connects QUEEN to the shell
     ├─ ../shared/js/shell.js     Interface of the shell (createShell)
     ├─ ../shared/js/i18n.js      Languages of the shell (createI18n)
     ├─ ../shared/js/storage.js   Storage (createStorage)
     ├─ ../shared/js/tilt.js      Motion sensor
     ├─ js/strings.js             QUEEN texts in German and English
     ├─ js/rules.js               Rules of German checkers (no rendering)
     ├─ js/game.js                Game state, undo, end of game, draws (no rendering)
     ├─ js/view.js                SVG board, pieces, crown, animations, input
     │   └─ ../shared/js/gutter.js  Physics of the pieces in the trays
     ├─ js/sound.js               QUEEN sounds (extends the shell's sound engine)
     └─ js/ai-worker.js           Web Worker for computer moves and hints
         └─ js/ai.js              Computer opponent (no rendering)

queen/sw.js                       Service worker for QUEEN offline support
queen/manifest.webmanifest        Details for installing as a standalone app
```

Core principle: **rules → game state → rendering**. `rules.js`, `game.js` and `ai.js` never touch the document. They therefore also run in Node.js and are fully tested there.

### Connection to the shell

`main.js` calls `createShell()` with the description of QUEEN:

| Option | Value for QUEEN |
|---|---|
| Title | `QUEEN` |
| Buttons | Undo, Hint, New, Modes, More |
| Selection | Modes, with preview, stars and difficulty |
| Extra settings | Turn the board, Tilt |
| Note in the settings | "Swipe across the pieces in the trays" |
| Actions | Undo, hint, new, play again, next level, select mode, toggle settings |

## Modules

### `rules.js`: rules engine

The board is a list of 64 numbers, index = row · 8 + column. Play happens on squares where row plus column is odd.

| Value | Meaning |
|---|---|
| `0` | Empty square |
| `1`, `2` | Blue piece, blue queen |
| `-1`, `-2` | Black piece, black queen |

Blue (`BLUE = 1`) starts in rows 5 to 7 and moves up, Black (`BLACK = -1`) in rows 0 to 2.

A **move** is `{ from, to, path, captured, crown }`:

| Field | Contents |
|---|---|
| `from`, `to` | Start and final square |
| `path` | Every landing square in order, just `[to]` for a simple move |
| `captured` | Squares of the captured pieces in capture order |
| `crown` | `true` if the move ends with a crowning |

| Function | Purpose |
|---|---|
| `initialBoard()` | Starting position |
| `legalMoves(board, side)` | All legal moves. If there are captures, only captures (mandatory capture), each as a complete capture sequence |
| `applyMove(board, move)` | New board after the move, the old one stays unchanged |
| `countPieces(board)` | `{ blue, black }` |
| `positionKey(board, side)` | Key of a position for the repetition rule |
| `isDark`, `sideOf`, `isKing`, `coords`, `indexOf` | Helpers |

Capture sequences are found by depth-first search: the search continues from every landing square, captured pieces stay on the board until the end and are blocked. Flying queens scan each direction up to the first piece and may land on any empty square behind a captured piece. A piece that reaches the back row and can capture again continues as a piece.

### `game.js`: class `Game`

| Property or method | Purpose |
|---|---|
| `board`, `turn`, `moves` | Board, side to move, legal moves |
| `ids` | For every square the number of the piece on it, or `null`. Numbers 0 to 11 are black, 12 to 23 blue (`Game.colorOf(id)`) |
| `history` | Every move played as entries `{ move, mover, capturedIds, crowned, side, before }`. `before` holds the previous state, which makes undo exact |
| `quiet`, `seen` | Counter of plies with only queens and no capture, frequency of each position |
| `findMove(from, to)` | Move for an input. If several capture paths lead to the same square, the longest wins |
| `movesFrom(square)`, `match(move)` | Moves of a piece, map the computer's move onto an own legal move |
| `apply(move)`, `undo()` | Play and take back a move |
| `counts`, `result`, `isOver` | State. `result` is `null`, `{ winner }` or `{ draw: 'repetition' \| 'quiet' }` |
| `pieceAt(square)` | `{ id, side, king }` or `null` |
| `serialize()`, `restore(data)` | Save and load the game |

The fixed piece numbers are the key for rendering: every SVG piece belongs to exactly one number and stays the same object wherever it moves.

### `ai.js` and `ai-worker.js`: computer opponent

The computer searches with **negamax and alpha-beta pruning**, like a classic chess program:

| Technique | Effect |
|---|---|
| Iterative deepening | First one ply, then two and so on, until depth or time is reached. When time runs out, the result of the last complete depth counts |
| Transposition table | Known positions are not calculated twice, and their best move is tried first |
| Move ordering | Best known move, then captures of many pieces, then crownings |
| Quiescence search | If a mandatory capture is pending at the end of the search depth, the search goes on for up to eight more plies. The computer never misses a capture sequence |
| Randomness among equal moves | Games do not always go the same way |

**Evaluation** of a position from the point of view of one side:

| Feature | Points |
|---|---|
| Piece | 100, plus 4 per row advanced |
| Piece on its own back row | plus 10 |
| Piece on the edge | minus 4 |
| Piece or queen in the centre (4×4 squares) | plus 8 |
| Queen | 320 |
| Fewer than 10 pieces on the board | Everything times 1.15, so trading pays off when ahead |

**Levels** (`LEVELS`):

| Level | Depth | Time | Margin | Mistakes |
|---|---|---|---|---|
| Easy | 2 | 200 ms | 90 points | 22 % random move |
| Medium | 5 | 500 ms | 12 points | none |
| Hard | up to 14 | 900 ms | 0 | none |

Margin means: the move is chosen at random among all moves at most that many points worse than the best. Checked in the tests: Medium clearly beats Easy. During development Medium won 10:0 against Easy and Hard 4:0 against Medium.

`chooseMove(board, side, level, { random, now })` returns the move. Randomness and clock can be replaced in tests. The Web Worker receives `{ id, board, side, level }` and answers with `{ id, move }`, so the interface stays smooth. Hints use the same worker at Hard level.

### `view.js`: class `QueenView`

**Board space.** Drawing happens in fixed units (1000 × 1280, portrait, Blue at the bottom). `orient()` turns the whole world by 90° for landscape and by another 180° for two players. An inner group of every piece turns back, so light and crown stay upright.

**Pieces.** There are always 24 SVG pieces, one per number. Each is either on the board or in a tray.

| Method | Purpose |
|---|---|
| `setGame(game)` | Set a position without animation (app start) |
| `sync(game)` | Bring every piece to its place with animation: after New, Undo, mode switch |
| `play(record)` | Animate a move: jump the path square by square, captured pieces into the tray, crowning |
| `toTray(id)` | Roll a piece into the tray of the capturing side |
| `select(square)`, `showHint(move)` | Selection, target rings, hint ring |
| `setFlip(on)` | Turn the board for two players |
| `setGravity(x, y)` | Turn the tilt back into board space and pass it to both trays |

**Trays.** Each tray is a `Gutter` of the shell with an arc section (`arc`) on a very large virtual circle (radius 10,000). On that circle the arc is practically straight, and the proven physics of SPRING (friction, collisions, tilt) applies unchanged. `arc` puts walls at both ends, `speedScale` converts speeds for the large radius.

**Input** through pointer events:

| Touch | Behaviour |
|---|---|
| In a tray | Goes to the physics: a tap nudges, a swipe pushes |
| On a target ring | Move of the selected piece |
| On a piece with moves | Selection, dragging after 10 px of movement |
| On a piece without moves | Wiggle and knock |
| While the computer is to move | Board locked, trays stay usable |

**Queue:** `play` and `sync` run one after another through `run()`. `busy` is always reset in a `finally`, and errors in events are caught.

**Events to `main.js`:** `canMove`, `move`, `lift`, `invalid`, `land`, `hop`, `crown`, `rim`, `clack`, `done`.

### `main.js`: flow

| Function | Purpose |
|---|---|
| `humanMove(move)` | Play the move, save, animate, then `afterMove()` |
| `afterMove()` | Update the display, check for the end, turn the board for two players, otherwise `computerMove()` |
| `computerMove()` | Ask the worker, pause at least 450 ms, play the move. A request number discards stale answers after Undo, New or a mode switch |
| `hint()` | Show the best move for the side to move |
| `checkEnd()` | Result card, statistics, stars, sound |
| `newGame()` | New game. The old one is kept for an immediate Undo |
| `undo()` | Against the computer back to your own last move, a thinking computer is cancelled |
| `switchMode(id)` | Switch mode, always with a new game |

### Storage

All values live in `localStorage` through `createStorage('queen:')` with the prefix `queen:`. Every access is guarded, the game also runs without storage.

| Key | Contents |
|---|---|
| `queen:mode` | Last chosen mode |
| `queen:game` | `{ mode, state }`, the running game, resumed on start |
| `queen:stats` | Per mode: `games`, `wins`, `losses`, `draws` |
| `queen:flip`, `queen:tilt` | Turn the board, tilt |
| `queen:sound`, `queen:soundStyle` | Sound on or off, sound style |
| `queen:coachSeen` | First-run hint already shown |

## Flow of a move

```
Finger taps a target
   │
   ▼
QueenView ── findMove() ── legal? ── no ──► clear selection
   │ yes
   ▼
main.js humanMove()
   ├─ Game.apply()                    State changes at once, save
   └─ QueenView.play(record)
        ├─ jump by jump along path             land or hop per jump
        ├─ captured pieces → tray              rim, then clack on impacts
        └─ crowning                            crown
   ▼
afterMove()
   ├─ Game over? → checkEnd()
   ├─ Two players → turn the board
   └─ Computer → computerMove() → worker → Game.apply() → play()
```

## Offline support

As for every game in the collection: versioned addresses (`?v=` for QUEEN, `?shell=` for the shell), network first bypassing the browser cache, a single reload when a new version takes over. `queen/sw.js` lists every module of QUEEN and the shell, and `tests/release.test.js` checks this. Details: [Deployment](deployment.md).
