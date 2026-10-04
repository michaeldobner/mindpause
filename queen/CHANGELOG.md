# Changelog

All notable changes to QUEEN. [Deutsch](CHANGELOG.de.md)

## 1.2.0 (2026-10-04)

### New
* **Four computer levels:** new **Beginner** level that only looks at its own move and falls for simple capture traps. **Easy** is clearly easier than before. The low levels overlook things like a person instead of suddenly giving pieces away. Each level beats the next weaker one in about 85 to 90 % of test games.
* **Resign** as a button of its own, with confirmation. Against the computer it counts as a loss, with two players the side to move resigns. Undo takes back the resignation and its statistics entry.
* **Calm computer moves:** thinking pause of at least 0.7 seconds, the piece visibly lifts and moves slowly, in a multiple capture jump by jump. Jumped pieces fade at once.
* **Last move marker:** start and target squares stay subtly lighter.

### Improved
* The computer finishes won endgames faster: its queens close in on the last pieces, hold the long diagonal and restrict the opponent.
* On the very first start Easy is now selected.

### Technical
* New `quiet` and `careless` values for the levels in `js/ai.js`, resigning in `Game` (saved with the game).
* Requires shell 1.4.0 for the Resign button and the confirmation.
* New tests for resigning and the level ladder, now 22 tests for QUEEN.

## 1.1.1 (2026-10-04)

### Design
* **New app icon** in the shared style of the collection: a section of the board from above on oxblood red, with a king carrying the engraved crown in the middle. The black icon got lost on the dark start page.

### Technical
* New script `tools/icons.mjs` generates the icon and the PNG files.

## 1.1.0 (2026-10-04)

### New
* **Classic board style** (new default): black wood with grain, squares of maple and ebony, a fine gold line around the board, coordinates A to H and 1 to 8 in gold, trays with a diamond lattice. The pieces are ivory and ebony, and the sides are called White and Black.
* **Midnight board style**: the previous blue board with ceramic pieces, sides Blue and Black.
* Choose the style under More > Board. Switching fades smoothly and the game carries on.
* **New crown** as a fine gold engraving modelled on a queen's crown: cross, orb, arches with pearls, fleurs-de-lis, a band with stones and ermine. It grows in slightly on crowning.
* New app icon in the Classic style.

### Fixed
* In the mode picker some preview pieces stood on light squares.

### Technical
* New module `js/themes.js` with the board styles and the crown engraving.
* Requires shell 1.2.0 for the choice in the settings.
* Two new tests for the board styles, now 20 tests for QUEEN.

## 1.0.0 (2026-10-04)

First version.

### Game
* German checkers on 8×8: pieces capture forwards and backwards, flying queens, mandatory capture, multiple captures, crowning on the far row
* Draw after the same position three times or after 30 moves with queens only and no capture
* Four modes: against the computer on Easy, Medium, Hard and two players on one device
* Computer opponent with minimax and alpha-beta pruning, computed in the background
* Hint shows the best move, Undo against the computer goes back to your own last move
* New with one tap, Undo brings the previous game back
* Stars and statistics per level

### Design
* Deep blue board with ceramic pieces in blue and black
* Golden crown for every queen, with a bell tone
* Two trays for captured pieces: top and bottom in portrait, left and right in landscape
* Pieces in the trays react to taps, swipes and optionally to tilt
* Turn the board when playing with two players (setting)

### Technical
* Built on the MIND PAUSE shell 1.1.0
* 18 tests for rules, game state, draws and the computer, plus the collection's browser test
