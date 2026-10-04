# Gameplay

[Deutsche Version](../de/spielregeln.md) · [Overview](README.md)

## Goal

Pieces fall from above into a box of 10 columns and 20 rows. Fill a row completely and it is cleared, everything above slides down. The game ends when there is no room for the next piece.

## The pieces

The seven classic shapes of four cells each: I, O, T, S, Z, J and L. Every shape has its own colour.

| Shape | Colour |
|---|---|
| I | Ivory |
| O | Ochre |
| T | Periwinkle |
| S | Sage |
| Z | Terracotta |
| J | Cobalt |
| L | Rose |

**Order:** pieces come in bags of seven. Each bag holds every shape exactly once, in random order. You never wait forever for the long I.

## Movement

| Action | Effect |
|---|---|
| Move | One cell left or right |
| Rotate | 90 degrees, clockwise or counterclockwise. If the piece does not fit, FUGE tries up to four alternative positions (wall kicks) as in the SRS standard |
| Fall faster | The piece falls row by row at once, one point per row |
| Drop | The piece falls to the bottom and locks immediately, two points per row |
| Hold | Puts the piece into the hold box. If one is already there, it comes into play. Once per piece |

**Lock delay:** a piece resting on something can still be moved for 0.5 seconds. Every move extends that time, at most 15 times per piece. Reaching a lower row resets the count.

**Ghost piece:** a fine outline shows where the piece will land. Can be switched off in the settings.

## Scoring

All points for lines are multiplied by the current level.

| Event | Points |
|---|---|
| Single (1 line) | 100 |
| Double (2 lines) | 300 |
| Triple (3 lines) | 500 |
| **Quart** (4 lines) | 800 |
| T-spin without lines | 400 |
| T-spin single, double, triple | 800, 1200, 1600 |
| T-spin mini without, with 1, with 2 lines | 100, 200, 400 |
| **Back to back** | Quart or T-spin with lines right after another one: times 1.5 |
| **Combo** | Lines with several pieces in a row: 50 times combo length |
| **All clear** | The box is empty afterwards: 800, 1200, 1800 or 2000 extra |
| Fall faster | 1 per row |
| Drop | 2 per row |

**T-spin:** the T piece was last rotated, not moved, and at least three of the four corners around its centre are occupied. If both corners on the side it points to are occupied, it is a full T-spin, otherwise a mini (except after the last wall kick, which always counts as full).

## Levels and speed

Every 10 lines the level rises by one. The time per row follows the guideline curve: one second at level 1, about 0.13 seconds at level 10, pieces drop instantly from level 20.

## Modes

| Mode | Rule | End | Stars |
|---|---|---|---|
| **Classic** | Level rises every 10 lines | Box full | ★ from 30 lines, ★★ from 80, ★★★ from 150 |
| **Sprint** | Constant at level 1 | After 40 lines, time counts | ★ finished, ★★ under 3:00, ★★★ under 1:45 |
| **3 minutes** | Level rises every 10 lines | After 180 seconds | ★ from 6,000 points, ★★ from 18,000, ★★★ from 40,000 |
| **Calm** | Slow, 1.25 seconds per row | Never. When the box is full it dissolves and play goes on | none |

Best results and stars are stored per mode on the device and shown in the mode picker.

## Pause and resume

* **Pause** with the button, P or Escape. The card in the box shows the controls.
* FUGE pauses by itself when modes or settings open and when you leave the app.
* The game is saved. Next time it continues, paused, exactly where you left it.
* **New** starts a new game in the current mode at once.

## Controls

| iPhone and iPad | Computer | Action |
|---|---|---|
| Drag left or right | ← → or A D | move, holding repeats every 50 ms after 170 ms |
| Tap, right half | ↑, X, W or E | rotate clockwise |
| Tap, left half | Z, Y, Q or Ctrl | rotate counterclockwise |
| Drag down slowly | ↓ or S | fall faster |
| Swipe down quickly | Space | drop |
| Swipe up, tap the hold box or **Hold** | C or Shift | hold |
| **Pause** or tap on the box | P, Escape, Enter, Space | pause and resume |

Gestures work on the whole area around the box, so your thumb never has to cover the piece. When dragging, the piece moves roughly as far as your finger, one cell per cell width.
