# Changelog

All notable changes to KARO. [Deutsch](CHANGELOG.de.md)

## 1.0.5 (2026-10-05)

### Fixed
* **Invisible cards after "Next deal".** Tapping "Next deal" during the win celebration gave a new game in which some cards were invisible. You saw through them to the face-down card below, which looked like a face-up card showing its back. Cause: when stopping, the celebration still hid the cards that were in the air, and by then they belonged to the new game. The celebration now belongs firmly to its game, and a new game always starts with a clean table. The same applied to "Undo" during the celebration.
* Note on 1.0.4: the cause assumed there (3D turn in Safari) was not the reason. The switch to a flat reveal stays anyway, as it makes rendering more robust.

### Technical
* Two new checks in the browser test: "Next deal" and "Undo" during the win celebration. Both fail on the old code and pass on the new.

## 1.0.4 (2026-10-05)

### Fixed
* **Face-up cards now and then showed their back** (iPhone and iPad). The cause was the 3D turn when revealing a card: Safari does not always hide the hidden side reliably. Revealing is now a flat animation, and only one side is ever visible.

### Improved
* Only cards that are moving get their own graphics layer. This saves graphics memory.
* The table is redrawn once when returning to the app and when the device is rotated.

### Technical
* New visual check in the browser test: on the screenshot, every face-up number card must show light paper, not the diamond pattern.

## 1.0.3 (2026-10-04)

### Improved
* Landscape on the iPad: without the fixed sidebar and with header and controls beside the table, the cards get clearly larger. The levels come as a drawer.
* "Other level" on the result card.

### Technical
* Requires shell 1.5.0.

## 1.0.2 (2026-10-04)

### Design
* **New app icon** in the shared style of the collection: rich felt green without a frame, two card backs fanned out and the ace of diamonds with a large diamond in front.

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
