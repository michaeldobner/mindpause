# Design system

[Deutsche Version](../de/design.md) · [Overview](README.md)

## Concept

**BLOCKS is a sibling of SPRING and QUEEN Midnight.** The plate wears the night blue of SPRING, the empty cells are the same hollows as the empty holes of the peg solitaire board, and the pieces are made of the blue ceramic of the QUEEN pieces in the Midnight style. BLOCKS therefore looks like part of the collection at first sight, although it is a very different game.

Fonts, surface colours, spacing and all building blocks of the interface (header, control bar, sheets, result card) come from the [shell](../../../shared/README.md). This document only describes what is specific to BLOCKS.

| Principle | Meaning |
|---|---|
| **One colour** | All pieces are alike. You read the shape, not the colour, and the board stays calm |
| **Tactile** | Every piece is a small piece of ceramic with a bevel, a light edge and a highlight |
| **Calm** | No fire, no particles, no flashing. Lines dissolve, numbers rise gently |
| **Preview, no surprise** | While dragging you see what is going to happen |

## Name

The games of the collection have short names in capitals. **BLOCKS** says what the game is about without explanation, reads internationally and sits in Didot as an equal next to SPRING, QUEEN, KARO, FUGE and MÜHLE.

## Colours (the same in light and dark)

| Element | Colour | Origin |
|---|---|---|
| Plate | Gradient `#2a2f7a` to `#14174a` | Board of SPRING, plate of QUEEN Midnight |
| Playing area | Gradient `#0b0d33` via `#121543` to `#1c2060` | Groove of SPRING, tray of QUEEN Midnight |
| Edge of the playing area | `#2f3588` | Light edge of SPRING |
| Hollows | Gradient `#05061c` to `#11143f` | Empty holes of SPRING |
| Piece | Highlight `#86abff`, body `#3f6ef0`, shadow `#2142b4` | Blue pieces of QUEEN Midnight, marbles of SPRING |
| Piece at the end | `#5e616e`, `#1d1e26`, `#07070a` | Black pieces of QUEEN Midnight |
| Hint | `#ffd36b` | Hint ring of the collection |
| Line preview | Light blue `#c8d4ff`, 18 to 28 %, pulsing | |

The line above the board (best score and streak) sits on the background of the shell and therefore uses `--ink` and `--ink-soft`, which change with light and dark mode.

## The pieces

Every cell is drawn once per colour and size as a small image:

| Layer | Design |
|---|---|
| Body | Rounded square (radius 20 %), radial gradient lit from the top left like the pieces of QUEEN |
| Bevel | Inner, flatter face, inset by 14 %, with a fine light edge |
| Edges | Light edge at the top, shadow edge at the bottom |
| Gloss | Soft highlight at the top left |
| Shadow | Soft and downwards, larger and further while dragging, as if the piece were floating |

A joint of 6 % of the cell stays between pieces, the hollows underneath are inset by 7 %. The grid always stays readable.

## Geometry

| Size | Value in cells |
|---|---|
| Board | 8 × 8 (Wide: 10 × 10) |
| Plate border | 0.34 |
| Line above the board | 0.95 |
| Gap to the tray | 0.5 |
| Tray | 3.3 deep, takes spare room up to 4.7 |
| Cell on the tray | slot divided by 5.4, at most 0.62 |

The cell size follows from the available space and is rounded to whole device pixels.

## Layouts

| Device | Arrangement |
|---|---|
| iPhone portrait | Title, mode and points at the top, best score and streak above the board, tray below, control bar at the bottom: Undo, Hint, New, Modes, More |
| iPhone landscape | Title, mode and points on the left, full height board, tray as a column to its right, control bar on the right |
| iPad and computer | As in landscape, with a much larger board. Modes as a drawer from the left |

The tray goes below or beside the board, whichever makes the board larger.

## Motion

| Moment | Design | Duration |
|---|---|---|
| Lift a piece | Grows from tray size to board size, the shadow softens | 120 ms |
| Drag | Floats just under one cell above the finger, a translucent outline at the target | |
| Preview | Rows and columns that would clear pulse softly | |
| Place | Pieces settle with a small bounce and light up briefly | 260 ms |
| Lines | Brighten, shrink and fade, outwards from where the piece landed | 500 ms |
| Points | "+24" in Didot rises above the spot | 0.95 s |
| Captions | "Double", "Streak 4", "All clear" in the middle of the board | 1.15 s |
| Released elsewhere | The piece glides back into its slot | 220 ms |
| New pieces | Rise into the tray one after another with a small bounce | 420 ms |
| End | Row by row from bottom to top into black ceramic | 0.75 s |
| Calm, board full | Pieces dissolve from top to bottom, "A fresh start" | 0.85 s |

With "Reduce motion" growing, bouncing and dissolving are left out.

## Sound

Ceramic on wood as in the whole collection, built on the sound engine of the shell. All sounds respect sound off, the sound style and the silent switch.

| Sound | Structure |
|---|---|
| Lift | Almost inaudible soft tap, like a marble in SPRING |
| Snap | Very quiet, bright click when the piece is over a new spot |
| Place | The placing sound of the collection, the pitch rises as the board fills. Small pieces softer |
| Released elsewhere | Two muted wooden knocks |
| Lines | One ceramic tone per line, rising, higher with the streak. From three lines on and for all clear a bell closes |
| New pieces | Three quiet taps |
| End | Two calm, falling tones, for a new best followed by the triad with a bell |
| Calm, board full | Slowly falling run |

On devices with vibration there is a short pulse for lines.

## App icon

Pieces of blue ceramic on the night blue of the collection. At the bottom a grid is almost full, one piece floats above its gap. The source is `icons/icon.svg`, created by `tools/icons.mjs`, which also renders PNG files at 180, 192 and 512 pixels.
