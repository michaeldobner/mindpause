# Gameplay

[Deutsche Version](../de/spielregeln.md) · [Overview](README.md)

## Contents

1. [The board](#the-board)
2. [Rules](#rules)
3. [The 7 figures](#the-7-figures)
4. [Scoring and stars](#scoring-and-stars)
5. [Controls](#controls)
6. [Switching figures](#switching-figures)
7. [Hints](#hints)
8. [The living rim](#the-living-rim)
9. [Settings](#settings)
10. [Install on iPhone and iPad](#install-on-iphone-and-ipad)
11. [Strategy for beginners](#strategy-for-beginners)

## The board

SPRING uses the classic English cross-shaped board with **33 holes** in seven rows (3, 3, 7, 7, 7, 3, 3 holes). The board is round, with a groove around the cross: the **rim**.

There are always **32 marbles**, 16 blue and 16 black. On the board they sit in a checkerboard pattern. Colour is purely visual and has no meaning in the game. Marbles a figure does not need, and every captured marble, rest in the rim.

## Rules

1. A marble jumps **horizontally or vertically** over a directly neighbouring marble.
2. The hole behind it must be empty.
3. The marble jumped over is removed and rolls into the rim.
4. Diagonal jumps are not allowed.
5. The game ends as soon as no jump is possible.

**Goal:** leave as few marbles as possible. Perfect is **a single marble right in the centre**.

## The 7 figures

Each figure is a starting position on the same board. Every figure has been verified with the built-in solver: each can be solved down to one marble in the centre. They are sorted by difficulty and together form a training path.

| No. | Figure | Marbles | Difficulty |
|---|---|---|---|
| 1 | Cross | 6 | ●○○○○ |
| 2 | Plus | 9 | ●●○○○ |
| 3 | Pyramid | 16 | ●●●○○ |
| 4 | Arrow | 17 | ●●●○○ |
| 5 | Diamond | 24 | ●●●●○ |
| 6 | Fireplace | 11 | ●●●●○ |
| 7 | Classic | 32 | ●●●●● |

```
Cross          Plus           Pyramid        Arrow
    · · ·          · · ·          · · ·          · ● ·
    · ● ·          · ● ·          · ● ·          ● ● ●
· · ● ● ● · ·  · · · ● · · ·  · · ● ● ● · ·  · ● ● ● ● ● ·
· · · ● · · ·  · ● ● ● ● ● ·  · ● ● ● ● ● ·  · · · ● · · ·
· · · ● · · ·  · · · ● · · ·  ● ● ● ● ● ● ●  · · · ● · · ·
    · · ·          · ● ·          · · ·          ● ● ●
    · · ·          · · ·          · · ·          ● ● ●

Diamond        Fireplace      Classic
    · ● ·          ● ● ●          ● ● ●
    ● ● ●          ● ● ●          ● ● ●
· ● ● ● ● ● ·  · · ● ● ● · ·  ● ● ● ● ● ● ●
● ● ● · ● ● ●  · · ● · ● · ·  ● ● ● · ● ● ●
· ● ● ● ● ● ·  · · · · · · ·  ● ● ● ● ● ● ●
    ● ● ●          · · ·          ● ● ●
    · ● ·          · · ·          ● ● ●
```

The **Fireplace** has only 11 marbles but is tricky: random play almost never finishes it perfectly. That is why it comes late in the list.

## Scoring and stars

| Result | Rating | Stars |
|---|---|---|
| 1 marble in the centre | **Masterful** | ★★★ |
| 1 marble elsewhere | Excellent | ★★ |
| 2 marbles | Good | ★ |
| 3 marbles | Decent | ★ |
| 4 or more | Keep practising | none |

For every figure SPRING saves the most stars reached, the best result, the number of games and how often the figure was solved.

## Controls

### Moving a marble

* **Tap:** tap a marble. It lifts and its possible targets light up as dashed rings. Then tap the target.
* **Drag:** drag the marble onto the target with your finger and let go. On an invalid target it rolls back.

A marble without a possible jump wobbles briefly and knocks softly. Tapping an empty spot clears the selection.

### Control bar

| Button | Function |
|---|---|
| **Undo** | Takes back the last move, as often as you like. The captured marble returns from the rim. Also works in the middle of an animation, several quick taps are carried out one after another |
| **Hint** | Shows the next correct move (see [Hints](#hints)) |
| **New** | Restarts the current figure immediately, with one tap. Pressed by mistake? Right afterwards **Undo** brings the previous game back |
| **Figures** | Opens the figure picker |
| **More** | Opens the settings |

### Result card

At the end of a game a card shows the rating, stars and statistics.

* **Next figure →** moves on to the next figure on the training path (not shown for Classic).
* **Play again** restarts the figure.
* **Undo last move** returns to the game.

### Progress

Every move is saved automatically. Close the app and you continue exactly where you left off, on the figure you played last. If that game had already ended, a new one begins on the next launch, without showing the result card again.

## Switching figures

You can switch the figure **at any time during play**. The chosen figure **always starts as a new game**. Stars and statistics are of course kept.

| Device | How |
|---|---|
| iPhone portrait, iPad portrait | Tap the figure name below SPRING or **Figures**. A sheet slides up from the bottom, swipe sideways through the cards |
| iPhone landscape | **Figures** opens a drawer from the left with a vertical list |
| iPad landscape | All figures are always visible in the sidebar on the left, one tap is enough |

Each card shows a preview of the figure, the number of marbles, the stars reached and the difficulty.

When you switch, the board visibly rebuilds itself: marbles that are not needed roll into the rim, the ones that are needed jump from the rim to their holes. The sheet stays open so you can browse at your leisure. Swipe down, tap outside or tap the cross to close it.

On the very first launch a one-time hint says "Change the figure here". It disappears on the first touch or after 6 seconds.

## Hints

**Hint** computes a path from the current position to a single marble in the centre and shows the first move: the right marble lifts and its target gets a golden ring.

* If you follow the hint, further hints appear instantly because the path is already known.
* If the solver needs more than a moment, "Thinking …" appears.
* If a **perfect finish is no longer possible** from the current position, SPRING says so and suggests undoing a few moves.
* If the solver finds no path within 4 seconds (only possible in very early, highly branched positions of the classic board), a message suggests trying again after your next move.

Hints do not affect stars or statistics.

## The living rim

The marbles in the rim lie loose. You can play with them without affecting the game:

* **Tap** gives a marble a small push, its neighbours react.
* **Swipe along the rim** pushes the marbles ahead of your finger. With momentum they roll on or circle once around.
* When marbles meet they pass on their momentum and click softly.
* Everything is at rest again after about 1.5 seconds at most.

So it never gets annoying: touching the rim never changes the game and never clears a selection. Nothing moves on its own. The number of clicks is limited, very gentle bumps stay silent. There is no vibration.

### Tilt

Turn on **Tilt** in the settings and the marbles in the rim roll downhill when you tilt the device. Lying flat on a table, nothing moves.

On iPhone and iPad, iOS asks once for permission to use the motion sensor when you turn it on. After the app restarts the permission is requested again on the first touch, if iOS requires it.

## Settings

Via **More**:

| Setting | Description | Default |
|---|---|---|
| Sound | Sounds on or off | on |
| Sound style | Warm (more wood), Clear (more ceramic), Soft (more room). A short preview plays when you choose | Warm |
| Tilt | Marbles in the rim follow the tilt of the device | off |

SPRING follows the iPhone's **silent switch**: when it is set to silent, the game stays quiet.

The **language** follows the device language: German if the device is set to German, English otherwise.

## Install on iPhone and iPad

1. Open https://michaeldobner.github.io/solohalma/ in **Safari**.
2. Tap **Share**.
3. Choose **Add to Home Screen** and confirm.

SPRING then opens full screen like an app and also works without an internet connection.

## Strategy for beginners

* **Start with the Cross** and follow the training path. Each figure practises a pattern that returns on the big board.
* **Clear the corners early.** Single marbles tend to get stuck in the arms of the cross.
* **Keep marbles in groups.** Isolated marbles far away are hard to reach.
* **Think backwards.** Where must the last marble jump from to land in the centre?
* **Use Undo and Hint.** Every path can be tried without risk.
