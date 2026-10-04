# Design system

[Deutsche Version](../de/design.md) · [Overview](README.md)

## Concept

**What would the classic falling block game look like if it had been made as a high quality physical designer game?**

FUGE is a lacquered navy wooden box with a recessed well. Matte lacquered pieces fall into it and fit together precisely. On the right sits a strip with two compartments for the held piece and the next pieces. A fine ivory line runs around the box like an inlay. The box looks the same in light and dark mode, like the boards of SPRING and QUEEN and the mat of KARO.

Fonts, interface colours, spacing and all interface building blocks (header, control bar, sheets, result card) come from the [shell](../../../shared/README.md). This document describes only what is specific to FUGE.

| Principle | Meaning |
|---|---|
| **The playing field is the decoration** | Nothing sits on top. Box, grid and pieces carry the whole design |
| **Workpieces, not pixels** | Every piece is one solid object with a bevel, lacquer and shadow |
| **Calm** | Short, soft motion, no explosions, no particles, no flashing |
| **Precision** | Fast input is never swallowed. Animation follows the logic, never the other way round |

## Research: physical designer games

The model was the idea of high quality board games as design objects, as shaped for example by the Swedish brand Printworks. Principles were adopted, no products, logos or patterns.

| Observation | In FUGE |
|---|---|
| Two-tone pairings: a muted ground with a neutral or pastel partner (emerald and beige, rose and grey, grey and blue) | Navy and ivory as the base pair, pieces in muted, curated tones |
| Palette of beiges, greys, pastels, deep navies and greens | Ivory, ochre, periwinkle, sage, terracotta, cobalt, rose |
| Gloss (acrylic, lacquer) against matte paper | Lacquered box with a light edge, matte pieces with a hint of sheen on top |
| Packaging like a coffee table book, the game stays on display | The box reads as an object even when nobody plays, the typography recalls a book cover |
| Strict square grid, the playing field itself is the graphic | Dots at the grid crossings instead of lines, no ornaments |

**Why is such a game instantly recognised as a design object?** Because it is proportioned like a book rather than a toy, because two colours are enough, and because the function itself is the decoration.

## Name

MIND PAUSE games have short names in capitals, taken from an element of the game: SPRING (to jump), QUEEN, KARO (diamonds and check pattern). Candidates included FUGE, QUART, FALL, STRATA, LINEA, TAKT, LOT, RIEGEL, KANTE and MOSAIK.

**FUGE** won: the joint between two stones that you close in the game, and the musical fugue, in which one voice enters after another like the falling pieces. Four letters, readable internationally, set in Didot it stands as an equal next to KARO and QUEEN. QUART lives on as the name for four lines at once.

## Colours

### Pieces (same in light and dark)

| Shape | Colour | Hex | Contrast to the well |
|---|---|---|---|
| I | Ivory | `#ece2cc` | very high |
| O | Ochre | `#dca544` | high |
| T | Periwinkle | `#8f96d8` | high |
| S | Sage | `#8db898` | high |
| Z | Terracotta | `#d4673f` | medium to high |
| J | Cobalt | `#4f7cf0` | medium, the collection's blue |
| L | Rose | `#e6a39b` | high |
| End | Ink | `#4a4e80` | colour of the full box after game over |

The colours differ in hue and lightness. The game itself never depends on colour, every shape is recognisable by its form. Players can also switch on **patterns on the pieces**: dash (I), ring (O), dot (T), slash (S), backslash (Z), square (J), cross (L).

### Box

| Element | Colour |
|---|---|
| Frame | gradient `#2b307c` to `#171a50`, light edge at 8 % white |
| Inlay | ivory line, 16 % opacity |
| Well | gradient `#0b0d31` to `#181b50`, shadow along the top edge |
| Compartments | gradient `#12153f` to `#1b1f57`, shallower than the well |
| Dot grid | ivory, 13 % |
| Labels | ivory, 58 %, letterspaced capitals |
| Numbers | ivory, Didot |

## The pieces

Each cell is drawn once per shape, neighbourhood and size as a small image:

| Layer | Design |
|---|---|
| Outline | rounded outer corners (17 % of the cell), straight towards cells of the same piece, a clean notch at inner corners |
| Joint | 5 % of the cell as gap to other pieces and to the well |
| Lacquer | a touch lighter at the top, a touch darker at the bottom |
| Bevel | light edge top and left, shadow edge bottom and right, only on outer edges |
| Seam | hairline between the four cells of a piece, so cells can be counted |
| Shadow | soft, downwards into the well |

A held piece that cannot be swapped right now appears in ink. The ghost piece is a fine outline in the piece's colour with a hint of fill.

## Geometry

| Size | Value in cells |
|---|---|
| Well | 10 × 20 visible, plus 2 hidden rows above |
| Box margin | 0.42 |
| Gap well to strip | 0.42 |
| Strip | 3.3 wide |
| Hold compartment | 2.3 high |
| Next compartment | 6.5 high, first piece at 0.6 cell size, the other two at 0.46 |

The cell size follows the available space and is rounded to whole device pixels so that every edge stays sharp. At most 44 points per cell.

## Layouts

| Device | Arrangement |
|---|---|
| iPhone portrait | Wordmark, mode and score on top, box in the centre, control bar at the bottom: Hold, Pause, New, Modes, More |
| iPhone landscape | Wordmark and score on the left, box in the centre, control bar on the right. The controls help is hidden in the pause card |
| iPhone SE | As iPhone portrait, slightly smaller cells |
| iPad and computer landscape | Fixed sidebar with all modes, box and control bar on the right |

The box is always the largest element. Gestures work on the whole stage.

## Motion

| Moment | Design | Duration |
|---|---|---|
| New piece | Fades in and settles half a cell from above | 120 ms |
| Move | Glides softly (time constant 28 ms) | felt at once |
| Rotate | Visibly turns around the centre of its box, kicks included | about 100 ms |
| Fall faster | Glides row by row (35 ms) | |
| Drop | Light trail in the piece's columns, the whole box gives by up to 3 points | 200 ms |
| Lock | The piece gleams briefly like lacquer in the light | 240 ms |
| Lines | Brighten, dissolve cell by cell from the centre outwards, then everything above slides down with slight acceleration | 340 ms |
| Special clears | Didot caption, for example “Quart”, “T-spin double”, below it “Back to back · Combo 2” | 1.15 s |
| Level up | A wave runs down through the dot grid, “Level 4” | 0.9 s |
| Calm, box full | Pieces dissolve from top to bottom, “A fresh start” | 0.85 s |
| Game over | Row by row from the bottom up into ink, like a curtain | 0.75 s |

With “Reduce motion” pieces jump to their target without gliding and turning, lines vanish at once.

## Sound

Wood on wood, built on the shell's sound engine. All sounds respect sound off, sound style and the mute switch.

| Sound | Construction |
|---|---|
| Move | a very soft, bright wooden click, at most every 28 ms |
| Rotate | two short clacks, like a piece turned in the hand |
| Blocked | a barely audible, muffled knock |
| Fall faster | a fine slide |
| Lock | muffled wood with a soft ceramic tone, a short glide first on a hard drop |
| Lines | one ceramic tone per line, rising, higher with the combo. A Quart ends with a bell |
| Hold | lift and set down |
| Level up | three calm, bright tones |
| Game over | two calm, falling tones |
| Calm, box full | a slowly descending run |
| Goal reached | the collection's triad, with a bell for a new best |

On devices with vibration there is a short pulse on hard drops and cleared lines.

## App icon

Four resting pieces on walnut, a T hovering above its gap. Same form language as in the game, but without frame and well so the icon matches the other games of the collection: one strong colour per game, motif large in the middle. Source is `icons/icon.svg`, generated by `tools/icons.mjs`, which also writes PNG files at 180, 192 and 512 pixels.
