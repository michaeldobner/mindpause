# Changelog

All notable changes to MÜHLE. [Deutsch](CHANGELOG.de.md)

## 1.0.0 (2026-10-04)

First version.

### Game
* Nine men's morris following the tournament rules of the World Mill Federation: placing, moving, flying with three pieces
* Close a mill and take a piece, pieces in mills are protected unless all of them are in mills. A double mill takes one piece
* Lose with two pieces or with no move. Draw after the same position three times or 20 moves each without a mill
* Four modes: against the computer Easy, Medium, Hard, and two players on one device
* Computer opponent with minimax and alpha-beta pruning, computed in the background
* Hint shows the best move, and after a mill the best piece to take
* Undo goes back to your own move against the computer, with an open mill only the half move
* New with one tap, Undo brings the previous game back
* Stars and statistics per level

### Design
* Derived from QUEEN: black wood, ivory, ebony and gold, or Midnight in deep blue
* Lines as inlaid gold, points as gilded hollows, engraved mill wheel in the middle, coordinates a to g and 1 to 7
* Closed mills light up as a line of gold, pieces you may take pulse
* Each side has a tray with its supply and the pieces it has taken: tap, swipe, tilt
* Turn the board for two players (setting)

### Technical
* Built on the MIND PAUSE shell 1.3.0
* 22 tests for rules, game state, draws, computer and board styles, plus a check of its own in the browser test
