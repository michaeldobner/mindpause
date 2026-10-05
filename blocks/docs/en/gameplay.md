# Gameplay

[Deutsche Version](../de/spielregeln.md) · [Overview](README.md)

## Goal

Keep placing pieces on a square board for as long as possible while filling rows and columns. A full row or column clears. The game ends when none of the pieces on the tray fits on the board any more.

## Flow

1. Three pieces lie on the tray. Each one is dragged onto the board once, in any order.
2. Pieces **cannot be rotated**. Every orientation is a piece of its own.
3. Once all three are placed, three new ones arrive.
4. After every piece, all full rows and columns are removed **at the same time**. A cell in both a full row and a full column counts once.
5. When none of the remaining pieces fits, the game is over. Pieces that no longer fit appear faded on the tray.

## The shapes

13 shapes in 37 orientations, drawn with weights so small and medium pieces come more often. The weight of a shape is shared by its orientations, so shapes with many orientations do not appear more often.

| Shape | Cells | Orientations | Weight |
|---|---|---|---|
| Dot | 1 | 1 | 3 |
| Straight two, three, four, five | 2 to 5 | 2 each | 6, 6, 5, 3 |
| Small corner | 3 | 4 | 6 |
| Square 2 × 2 | 4 | 1 | 6 |
| Square 3 × 3 | 9 | 1 | 2 |
| Rectangle 2 × 3 | 6 | 2 | 3 |
| T | 4 | 4 | 4 |
| S and Z | 4 | 4 | 4 |
| L and J | 4 | 8 | 6 |
| Big corner | 5 | 4 | 4 |

## Points

| Event | Points |
|---|---|
| Place a piece | 1 per cell |
| 1, 2, 3, 4, 5 … lines at once | 20, 60, 120, 200, 300 … (10 × n × (n + 1)), times the streak |
| All clear | 300 extra when the board is completely empty afterwards |

**Streak:** every piece that clears something raises the streak by one, and line points are multiplied by it. The streak only breaks after **three pieces in a row** clear nothing. Three dots next to the streak above the board show how many pieces remain.

**Example:** streak 3, a straight four clears two rows: 4 + 60 × 3 = 184 points.

## Modes

| Mode | Board | Tray | End | Stars |
|---|---|---|---|---|
| **Classic** | 8 × 8 | At least one new piece fits | No piece fits | ★ from 1,500, ★★ from 5,000, ★★★ from 12,000 |
| **Wide** | 10 × 10 | At least one new piece fits | No piece fits | ★ from 2,500, ★★ from 8,000, ★★★ from 20,000 |
| **Calm** | 8 × 8 | All three pieces fit in some order | Never. If nothing fits, the board clears itself | none |

The star limits come from games of a simple computer player (`tools/bot.mjs`) that always follows the hint. In Classic it scores about 4,000 points on average.

Best scores and stars are saved per mode on the device and shown in the mode picker.

## Undo, hint and new game

* **Undo** takes back the last piece, one step. This also works after the end ("Undo last move" on the result card). The pieces that follow stay the same, so undo never brings new pieces.
* **Hint** shows a good spot as a golden outline and lights up the slot of the piece. It prefers lines, contact with the edge and other pieces, few enclosed holes, and spots after which the remaining pieces still fit.
* **New** starts a new game at once. Undo right afterwards brings the old game back.
* The game is saved after every piece and continues there on the next start.

## Controls

| iPhone and iPad | Computer | Effect |
|---|---|---|
| Drag a piece from the tray | Drag with the mouse or 1, 2, 3 | choose a piece |
| Release over the board | Arrows, then Enter or Space | place the piece |
| Release elsewhere | Escape | piece goes back to the tray |
| **Undo** | Z, Backspace or Ctrl+Z | take back the last piece |
| **Hint** | H | show a good spot |

When dragging with a finger, the piece floats just under one cell above the finger so it stays visible. It snaps to the nearest spot where it fits if that spot is at most three quarters of a cell away. Rows and columns that would clear light up in advance (can be turned off under **More > Show lines in advance**).
