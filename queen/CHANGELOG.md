# Changelog

All notable changes to QUEEN. [Deutsch](CHANGELOG.de.md)

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
