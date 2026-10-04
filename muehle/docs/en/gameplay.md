# Gameplay

[Deutsche Version](../de/spielregeln.md) · [Overview](README.md)

MÜHLE follows the tournament rules of the World Mill Federation (Weltmühlespiel-Dachverband, WMD). The rules were researched before development, the sources are listed at the end.

## The board

Three nested squares, joined by lines through the middle of each side. Corners and side middles give **24 points**. Three points on one line form a **mill**, there are 16: four sides on each square and four cross lines. In the Classic style the coordinates are printed on the edge, columns a to g from the left, rows 1 to 7 from the bottom.

## Phases

| Phase | Rule |
|---|---|
| **Place** | Each side has 9 pieces. White (Blue in the Midnight style) begins, then the sides take turns placing a piece from their own tray on a free point |
| **Move** | Once a side has placed all pieces, it moves one piece along a line to a free neighbouring point. There is no jumping over pieces |
| **Fly** | A side with only 3 pieces left may move a piece to any free point |

The phases apply to each side on its own: one side may fly while the other still moves.

## Mills and taking

* Bringing three of your own pieces into one line closes a **mill**, and you immediately take one opposing piece.
* Pieces in a closed mill are **protected**. Only if all opposing pieces are in mills may one of them be taken.
* A move that closes **two mills at once** (double mill) still takes only **one** piece.
* A mill may be opened and closed again on the next move. Two mills arranged so that one piece closes one of them with every move are called a **running mill** (German "Zwickmühle").
* Taken pieces leave the game and roll into the tray of the side that took them.

## End of the game

| Result | Condition |
|---|---|
| Loss | A side has only **two pieces** left (board and tray together) |
| Loss | A side is to move and **cannot move**, because all its pieces are blocked |
| Draw | The same position with the same side to move occurs **three times** |
| Draw | **20 moves each** (40 half moves) without a mill, once both sides have placed all pieces |

Good to know: the game is solved. Ralph Gasser showed at ETH Zurich in 1993 that perfect play by both sides ends in a **draw**. A draw against Hard is therefore a good result.

## Modes

| Mode | Description |
|---|---|
| Easy | Looks two half moves ahead and sometimes makes a human mistake, but never misses a mill |
| Medium | Four half moves ahead, hardly any mistakes |
| Hard | Searches as deep as one second allows, usually eight to twelve half moves |
| Two players | Two people on one device, optionally the board turns towards the player to move |

Against the computer you play White and begin. Switching modes always starts a new game.

## Stars

One star for 1 win, two for 3 wins, three for 10 wins on a level.

## Controls

| Action | How |
|---|---|
| Place | Tap a free point. The piece flies from your tray onto the board |
| Move | Tap your piece, then a target. Or drag the piece onto the target |
| Fly | Like moving, with three pieces every free point is a target |
| Take | After a mill it lights up and the pieces you may take pulse. Tap one of them |
| Hint | Shows the best move. With a mill already closed it shows the best piece to take |
| Undo | Takes back your last move and the computer's answer. With an open mill only the half move |
| New | Starts a new game at once. Tapping Undo brings the old one back |

## Trays

Each side has a tray, White at the bottom, Black at the top. In landscape White stays at the bottom, the trays then stand on the left (Black) and on the right (White). It holds your pieces still to be placed and the pieces you have taken. The pieces react to tapping and swiping, and with **Tilt** switched on to the angle of the device.

## Settings

Under **More**: board style (Classic or Midnight), sound and sound style, **Turn the board** for two players, **Tilt**.

## Research sources

* [Mühle Spielregeln, muehle-tricks.de](https://xn--mhle-tricks-thb.de/muehle-spielregeln/)
* [Mühle Lehrbuch, Dr. Rainer Rosenberger, muehlespieler.de](https://muehlespieler.de/download/muehle_lehrbuch.pdf)
* [Mühle Spielregeln, deep-muehle.de](https://deep-muehle.de/muehle-spielregeln)
* [Nine men's morris, Wikipedia](https://en.wikipedia.org/wiki/Nine_men%27s_morris)
* [Nine Men's Morris, Chessprogramming Wiki](https://www.chessprogramming.org/Nine_Men%E2%80%99s_Morris)
* [Calculating Ultra-Strong and Extended Solutions for Nine Men's Morris, arXiv](https://arxiv.org/pdf/1408.0032)
