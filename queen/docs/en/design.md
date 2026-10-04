# Design

[Deutsche Version](../de/design.md) · [Overview](README.md)

## Guiding idea

QUEEN is a checkerboard you would like to have on your table: deep blue lacquered wood, pieces of glazed ceramic, a golden crown for every queen. No effect distracts from the game. Every motion explains what is happening: which piece moves, which one is captured, who is crowned.

Fonts, interface colours, spacing and all interface components (header, control bar, sheets, result card) come from the [shell](../../../shared/README.md). This document only describes what is specific to QUEEN.

## Colours

The board looks the same in light and dark mode. Only the interface around it follows the device setting.

| Element | Colours | Effect |
|---|---|---|
| Board plate | Gradient from `#2a2f7a` to `#14174a` | Deep blue lacquered wood |
| Frame around the squares | `#232870` with edge `#2f3588` | Slightly raised playing area |
| Dark squares | Radial gradient from `#1b1f5a` to `#121547` | The 32 playing squares, gently domed |
| Light squares | `#2a3080` | Deliberately close to the dark squares so the board stays calm |
| Trays | Gradient from `#0b0d33` via `#121543` to `#1c2060` | Recessed channel with depth |
| Blue pieces | Gradient from `#86abff` via `#3f6ef0` to `#2142b4` | Glazed ceramic, lit from the top left |
| Black pieces | Gradient from `#5e616e` via `#1d1e26` to `#07070a` | Dark ceramic with a highlight |
| Crown | Gradient from `#ffe7a0` via `#e3b448` to `#a87a1c`, outline `#8a6414` | Gold, clearly visible on both piece colours |
| Target rings | White, dotted, pulsing | Legal targets of the selected piece |
| Hint ring | Solid ring in the hint colour of the shell (`--hint`) | The computer's suggestion |

## Geometry

Everything is drawn in a fixed board space of **1000 × 1280 units** in portrait. The rendering scales this space to the available room.

| Size | Value | Reason |
|---|---|---|
| Plate | Rounded rectangle across the whole board space | Room for the board and two trays |
| Board | 920 × 920, from position (40, 180) | Fills almost the full width |
| Square | 115 | About 45 pt on an iPhone, above the 44 pt minimum for touch targets |
| Piece | Radius 44 | Fills three quarters of a square, with a visible margin |
| Piece in a tray | Radius 34 | A little smaller so all 12 captured pieces of one side fit |
| Blue tray | Centre line at y = 1192, usable length 880 | Below the board |
| Black tray | Centre line at y = 88, usable length 880 | Above the board |

**Why not a round plate as in SPRING?** A square board inside a circle would shrink every square to about 25 pt, well below the minimum size for reliable finger input. The rounded plate echoes the shapes of SPRING and gives the squares the room they need.

## Pieces and crown

Every piece consists of a shadow, a body with a gradient, a fine inner ring, a highlight and the crown.

* The **crown** is a golden pointed crown with a band and three bright pearls. It is ready on every piece and fades in on crowning.
* Light and crown always stay upright. When the board turns (landscape or two players), an inner group turns each piece back. Light always falls from the top left, and the crown is never upside down.

## Orientation

| Situation | Rendering |
|---|---|
| Portrait | Blue at the bottom, Black at the top, trays above and below the board |
| Landscape | The board is turned by 90°: Blue on the left, Black on the right, trays left and right |
| Two players with "Turn the board" | After every move the board turns by 180° towards the player to move |

The tilt of the device is turned back into board space, so pieces in the trays slide to the side that is actually lower in every orientation.

## Motion

| Moment | Animation | Duration |
|---|---|---|
| Select a piece | Lifts slightly, targets appear | immediate |
| Move | Small arc from square to square | 260 ms |
| Capture | A slightly higher arc per jump, square by square along the path | 300 ms per jump |
| Dragged piece released | Glides into the target without an arc | 160 ms |
| Captured piece | Rolls in a flat arc into the tray and shrinks, several pieces one after another 90 ms apart | 420 ms |
| Crowning | The crown fades in, the piece lifts briefly | 520 ms |
| Piece without moves | Wiggles sideways | 260 ms |
| New game, undo, mode switch | Every piece glides to its place, pieces return from the trays | 380 ms |

Animations run one after another through a queue, so a quick tap on Undo is never lost.

## Layouts

<img src="../images/iphone-landscape-dark-en.jpg" width="520" alt="iPhone in landscape, dark mode">

| Situation | Arrangement |
|---|---|
| iPhone portrait | Wordmark, mode and counter at the top, board in the middle, five buttons at the bottom. Modes and settings as sheets from the bottom |
| iPhone landscape | Wordmark and counter on the left, turned board in the middle, buttons on the right. Modes as a drawer |
| iPhone SE | Counter on two lines and a little smaller, so the header never wraps |
| iPad portrait | Like iPhone portrait, with more room |
| iPad landscape | Fixed sidebar with all modes, board and controls on the right |

<img src="../images/ipad-en.jpg" width="700" alt="iPad in landscape">

## Header

| Element | Contents |
|---|---|
| Subtitle | Current mode, for example "Computer · Medium" or "Two players" |
| Counter | Pieces Blue to Black, for example `9:7` |
| Line below | "Blue moves", "Black moves" or "Black thinks" |

## Choosing a mode

Each card shows a small board preview, the name, the difficulty as dots and the stars. Below it is the number of wins, "Computer" while there are none yet, and "One device" for two players. The active mode has a frame in the accent colour.

## App icon

A blue piece with a golden crown in front of a black piece on a deep blue background. The source is `icons/icon.svg`, from which PNG files in 180, 192 and 512 pixels are made.
