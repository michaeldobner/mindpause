# Architecture

[Deutsche Version](../de/architektur.md) · [Overview](README.md)

## Overview

MÜHLE is built like [QUEEN](../../../queen/docs/en/architecture.md): everything shared comes from the shell in `shared/`, this folder only holds what is specific to MÜHLE. No server, no build step. Principle: **rules → game state → view**. `rules.js`, `game.js` and `ai.js` never touch the document and are fully tested in Node.js.

## `rules.js`

The board is a list of 24 numbers. Point = ring · 8 + k, ring 0 outside, ring 2 inside, k runs clockwise from the top left corner. Corners have even k, side middles odd k, and only middles connect to the neighbouring ring. `ADJACENT` holds 32 connections, `MILLS` the 16 mills.

A **state** is `{ board, hand, turn }`. A **move** is `{ from, to, remove }`: `from = -1` when placing, `remove` is the point of the taken piece or `-1`. A move that closes a mill exists once per piece that may be taken, so every move is complete and indivisible.

Main functions: `legalMoves`, `applyMove`, `phaseOf` (`place`, `move`, `fly`), `removable`, `lossReason` (`few`, `blocked`), `positionKey`, `pointName`, `pointAt`.

## `game.js`

Class `Game` with board, supply, turn, piece numbers (`ids`, 0 to 8 black, 9 to 17 white), the numbers still in the supply (`reserve`), history for exact undo, the counter of half moves without a mill and the repetition table. `result` is `null`, `{ winner, reason }` or `{ draw: 'repetition' | 'quiet' }`.

## `ai.js`

Negamax with alpha-beta pruning, iterative deepening, a transposition table and mill moves first. Evaluation per side: 100 per piece on the board or in the supply, 8 per closed mill, 14 per open pair, 4 per free neighbour in the moving phase, minus 6 per blocked piece.

| Level | Depth | Time | Margin | Mistakes |
|---|---|---|---|---|
| Easy | 2 | 200 ms | 60 | 25 % random move, but never past a mill |
| Medium | 4 | 500 ms | 8 | none |
| Hard | up to 12 | 1000 ms | 0 | none |

`chooseMove(state, level, { random, now, only })`, where `only` restricts the choice; the hint after a mill uses it to find the best piece to take.

## `view.js`

Class `MuehleView`, structured like QUEEN's view. A move of your own that closes a mill happens in two steps: `stage()` moves the piece visibly, lights up the mill and pulses the pieces that may be taken while the game state stays untouched; tapping one sends the complete move, which `main.js` applies before `playNow(record, null, true)` animates the taking. Undo, New or a mode switch during the choice simply call `sync()`.

Events to `main.js`: `canMove`, `move`, `lift`, `invalid`, `land`, `mill`, `take`, `rim`, `clack`, `pending`, `done`.

## Storage

Prefix `muehle:` in `localStorage`: `mode`, `game`, `stats`, `theme`, `flip`, `tilt`, `sound`, `soundStyle`, `coachSeen`, `millToastSeen`.

## Tests

`tests/rules.test.js`, `tests/game.test.js` and `tests/themes.test.js` with 22 tests, plus the browser test with the extra check `Mill`.

## Tools

```bash
node muehle/tools/icons.mjs         # app icons, needs Playwright
node muehle/tools/screenshots.mjs   # documentation images, needs Playwright
```
