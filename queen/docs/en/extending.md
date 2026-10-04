# Extending

[Deutsche Version](../de/erweitern.md) · [Overview](README.md)

## New computer level

1. Add an entry to `LEVELS` in `queen/js/ai.js`:

```js
expert: { depth: 20, quiet: 10, time: 2000, noise: 0 },
```

| Value | Meaning |
|---|---|
| `depth` | Maximum search depth in plies |
| `time` | Time budget in milliseconds |
| `quiet` | How many plies a running exchange is calculated further at the end of the search |
| `noise` | Margin in points: the move is chosen at random among moves at most that much worse than the best |
| `careless` | Optional: share of careless moves that, as at Beginner, only look at the own move |

2. Add the mode to `MODES` in `queen/js/main.js`, with `computer: true` and a difficulty from 1 to 5.
3. Names under `mode` and `modeLabel` in `queen/js/strings.js` in both languages.
4. Use the example from [Development](development.md#checking-playing-strength) to check that the new level clearly beats the next weaker one, but not always. 80 to 90 % wins have proven right.

## Better evaluation

`evaluate()` in `queen/js/ai.js` is deliberately simple. Proven additions from checkers software:

* **Mobility:** number of own moves minus number of opposing moves. It is already used in endgames with a clear lead.
* **Protected pieces:** pieces with an own piece behind them cannot be captured.
* **Runaway to the crown:** a piece with a free path to the back row is almost a queen.
* **Endgame knowledge:** three queens beat one, one queen against one is a draw.

Every change must stay symmetric, which the test "Bewertung ist symmetrisch" (evaluation is symmetric) checks.

## Other rule variants

All rules live in `queen/js/rules.js`. Typical variants:

| Variant | Change |
|---|---|
| International draughts | 10×10 board, majority capture (the longest capture is mandatory). The board size is fixed at 8×8 today, which also affects `view.js` |
| English draughts (checkers) | Pieces capture forwards only, kings move one square only |
| Russian draughts | A piece becomes a queen in the middle of a capture and continues as a queen |
| Majority capture | In `legalMoves()` keep only the captures with the most captured pieces |

For every variant write the tests in `queen/tests/rules.test.js` first. A variant as a setting needs a rules parameter for `legalMoves()` and separate statistics.

## New board style

1. Add an entry to `THEMES` in `queen/js/themes.js`, most easily as a copy of `classic`. Every definition name must be present (`q-plate`, `q-grain`, `q-tray`, `q-lattice`, `q-tray-edge`, `q-frame`, `q-frame-line`, `q-light`, `q-dark`, `q-sq-grain`, `q-coord` and for both sides `p1`, `p2` the body plus `-ring`, `-ring2`, `-edge`, `-shine`, `-engrave`). Anything not needed gets `empty()` or a transparent colour.
2. Set `sides`, for example `{ p1: 'white', p2: 'black' }`, and add new colour names under `side` in `queen/js/strings.js`.
3. Add the id to `THEME_IDS` and the name under `themes` in both languages. The choice in the settings grows by itself.
4. Add colours for the mode previews in `queen/css/queen.css` with `body[data-theme="…"]`.
5. Check that the crown engraving is legible on both piece colours and that black pieces are clearly visible on the dark squares.

## New language

1. Add a block with the same keys as `de` and `en` to `shared/js/i18n.js` (shell texts) and to `queen/js/strings.js` (QUEEN texts).
2. Extend `detectLanguage()` in `shared/js/i18n.js`.
3. `npm test` checks that all languages have the same keys.

## New sound style

Sound styles belong to the shell and apply to every game:

1. Entry in `SOUND_STYLES` in `shared/js/sound-engine.js` (shares of wood, ceramic, room and low-pass).
2. Button with `data-style` in the segmented control in `shared/js/shell.js`.
3. Translation under `styles` in `shared/js/i18n.js`.

## Playing each other on two devices

Two people on their own devices is planned in two stages:

| Stage | Flow | Technology |
|---|---|---|
| 1. Move by link | Whoever moves shares a link, for example in a message. The link holds the whole position. The other person opens it, moves and sends a new link back | No server needed. `Game.serialize()` provides the position, written compactly into the part of the address after `#`. Works with GitHub Pages |
| 2. Live with a room code | Both enter the same short code and see every move at once | Needs a small real-time messaging service, for example WebSocket or WebRTC with signalling |

The game logic is ready for this: a move is fully described by `{ from, path }` and can be checked on the other side with `game.match()`, exactly like the computer's moves today.

## Roadmap

| Version | Contents | Status |
|---|---|---|
| 1.0 | German checkers, three computer levels, two players, crown, trays, hints, stars, bilingual | Done |
| 1.1 | Classic and Midnight board styles, engraved queen's crown | Done |
| 1.2 | Four levels with Beginner, resign, calm computer moves, last move marker | Done |
| 1.3 | Move by link for playing on two devices | Planned |
| 1.x | Better evaluation, Master level, replaying a game | Planned |
| 2.0 | Live with a room code | Idea |
