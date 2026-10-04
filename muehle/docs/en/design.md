# Design

[Deutsche Version](../de/design.md) · [Overview](README.md)

## Idea

MÜHLE is a sibling of [QUEEN](../../../queen/docs/en/design.md): same workshop, same materials. Black wood, ivory, ebony and fine gold, and gold is never a surface, only a line. That suits a morris board perfectly, because the board **is** lines: the three squares and four cross lines are gold inlaid in the wood.

Fonts, interface colours and all interface building blocks come from the [shell](../../../shared/README.md). This document only describes what is specific to MÜHLE.

## Board styles

| | Classic (default) | Midnight |
|---|---|---|
| Feel | Black wood with gold inlay | Calm, deep blue lacquer |
| Sides | White (ivory) at the bottom, Black (ebony) at the top | Blue at the bottom, Black at the top |
| Lines | Gold with a fine shadow line | Light blue |
| Coordinates | a to g and 1 to 7 in gold | none |

## Colours in the Classic style

| Element | Colours |
|---|---|
| Plate | `#1d1a17` to `#0f0d0c`, fine grain |
| Field | `#2a241e` to `#1d1915`, warm grain |
| Lines | `#e3c06a` to `#b68a2e` with a shadow line |
| Points | hollow `#0b0a09` to `#2a241e`, gold ring `#d9b45a` |
| Mill wheel | gold `#c9a24a` at half opacity |
| Glowing mill | `#fff1c4` to `#e8c25c` with a wide glow |
| Pieces | ivory and ebony as in QUEEN |

## Mill wheel

In the middle of the inner square, where no piece ever stands, lies an engraved **mill wheel**: hub, eight spokes and a rim with sixteen paddles. It is the counterpart of QUEEN's crown, generated in `millWheel()` in `js/themes.js`.

## Geometry

Board space 1000 × 1280 units in portrait, as in QUEEN. Grid of 7 × 7 lines, spacing 130, margin 70. Piece radius 50, tap area radius 64, piece radius in a tray 38.

**Why never more than 9 pieces per tray?** Each of your moves takes one piece from the supply and adds at most one taken piece. After placing the supply is empty, and nobody can take more than 7 pieces.

## Trays

Each side has a tray with a double purpose: it holds **your pieces still to be placed** and **the pieces you have taken**. When placing, a piece flies from the tray onto the board in an arc and grows to full size.

## Motion

| Moment | Animation | Duration |
|---|---|---|
| Select | Lifts slightly, targets appear as dotted rings | instant |
| Place | Arc from the tray to the point | 380 ms |
| Move | Small arc to the neighbouring point | 260 ms |
| Fly | Higher arc | 380 ms |
| Mill | Gold line draws itself from one end to the other | 320 ms |
| Pieces to take | Dashed coral ring `#ff8a6b`, pulsing | until chosen |
| Taken | Lifts and rolls into the tray of the taking side | 160 ms and 420 ms |
| New, Undo, mode switch | Every piece glides to its place | 380 ms |

## Sounds

Lift: soft tap. Place and move: ceramic on wood, brighter as the game goes on. Mill: two bright bell tones, a third for a double mill. Take: strong wood with low ceramic. Trays: rolling and clicking.

## App icon

The morris board in gold on black wood, a closed mill of three ivory pieces at the top with a glowing line, two ebony pieces. Generated with `node muehle/tools/icons.mjs`.
