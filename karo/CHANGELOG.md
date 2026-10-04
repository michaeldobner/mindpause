# Changelog

All notable changes to KARO. [Deutsch](CHANGELOG.de.md)

## 1.0.1 (2026-10-04)

### Fixed
* **Win celebration on iPhone:** cards now reliably bounce off the foundations after a win. Until now the celebration waited for Safari to finish all 52 card images and sometimes never started. The images are now prepared in the background during play. If one is still missing at the win, that card bounces as a plain card with rank and suit.
* **Reduce motion:** the win celebration is no longer skipped. The cards fall more calmly instead: slower and without trails.

### Technical
* The browser test checks the win celebration and also runs in WebKit, the engine of Safari on iPhone and iPad.

## 1.0.0 (2026-10-04)

First version of KARO, the second game of the MIND PAUSE collection.

### New
* **Klondike** with seven columns, four foundations and a stock.
* **Draw one or three**, switchable in the settings.
* **Windows scoring**: +5 from the stock to a column, +10 to a foundation, +5 for turning a card, −15 back from a foundation, deductions for passes and time, time bonus on a win.
* **Vegas**: 52 stake, 5 per card on a foundation, 1 pass (draw one) or 3 passes (draw three), running bank.
* **Six levels**: Easy, Medium, Hard, Masterful (200 pre-checked, solvable deals each per draw mode), Daily deal and Random.
* **A deck of its own** in the style of classic designer decks: pure white paper, delicate Didot indices, large diagonal court cards with a pattern of their own per rank and a lowered gaze, harlequin back.
* **Tap or drag**, unlimited undo, hints from the solver, automatic finish.
* **Win celebration** with bouncing cards and fading trails.
* **Sounds** of paper and linen, with the collection's ceramic tone on the foundations.
* Stars, statistics per level and draw mode, playable offline, German and English.
