# Gameplay

[Deutsche Version](../de/spielregeln.md) · [Overview](README.md)

## Layout

| Area | Position | At the start |
|---|---|---|
| **Stock** | top left (landscape: left) | 24 face-down cards |
| **Waste** | next to it | empty, drawn cards land here |
| **Foundations** | top right (landscape: right) | empty, one per suit: spades, hearts, clubs, diamonds |
| **Columns** | below (landscape: centre) | 7 columns with 1 to 7 cards, only the top one face up |

## Rules

1. In the columns, build **down** in **alternating colours**.
2. An ordered run of face-up cards can be moved **as a whole**.
3. Only a **king** (with everything on it) fits on an **empty column**.
4. On the **foundations**, collect each suit from **ace to king**.
5. When the top face-up card of a column is moved, **the next face-down card turns over by itself**.
6. Tapping the **stock** draws cards. When it is empty, the waste is **passed through again**.
7. Cards may go **back** from a foundation to a column, which costs points with Windows scoring.

**Goal:** all 52 cards on the foundations. When every card is face up and the stock is empty, the remaining cards move to the foundations **by themselves**.

## Draw mode

| Mode | Rule | Feel |
|---|---|---|
| **Draw one** | Each stock card is turned one by one | relaxed, easy to plan |
| **Draw three** | Three cards are fanned, only the top one is playable | much harder, order matters |

Switch under **More** → **Draw three**. A running game then ends, **Undo** brings it back.

## Scoring

### Windows (standard)

| Event | Points |
|---|---|
| Card from the waste to a column | +5 |
| Card to a foundation | +10 |
| Face-down card turned | +5 |
| Card back from a foundation to a column | −15 |
| Pass through the stock again, draw one | −100 |
| Pass through the stock again, draw three | −20 from the 4th pass |
| Time | −2 per 10 seconds |
| Time bonus on a win | 700,000 ÷ seconds (from 30 seconds) |

The score never drops below zero. Time only runs while playing: not before the first move, not in the background, not after the end.

### Vegas

| | |
|---|---|
| Stake | −52 at the start of every game |
| Win | +5 per card on a foundation |
| Passes | Draw one: a single pass. Draw three: three passes |
| Bank | Every game counts towards the **Vegas bank** once it is won or left |

A full win earns +208. Turn on under **More** → **Vegas**. With Vegas, the solvability guarantee of the levels applies only without the pass limit.

## Levels

| Level | Meaning | Dots in the picker (draw 1 / 3) |
|---|---|---|
| **Easy** | An obvious path leads to the win | 1 / 2 |
| **Medium** | Some planning needed | 2 / 3 |
| **Hard** | Thinking ahead needed | 3 / 4 |
| **Masterful** | A narrow path, few solutions | 4 / 5 |
| **Daily deal** | One deal from "Medium" each day, the same for everyone | 2 / 3 |
| **Random** | Truly random, no guarantee. If you get stuck, KARO tells you whether the deal was solvable | |

Every level except Random **can be solved**. How this works: [Levels](levels.md).

## Stars

| Stars | Condition |
|---|---|
| ★★★ Flawless | solved without undo and without hints |
| ★★ Excellent | solved without hints |
| ★ Solved | solved |

The picker shows the best stars per level for the current draw mode. Games, wins and the best score are stored as well.

## Controls

| Gesture | Effect |
|---|---|
| **Tap** a face-up card | It jumps to the best place: a foundation first, otherwise a matching column. If nothing fits, it shakes briefly |
| **Tap** a card in the middle of a column | The run from this card on is moved |
| **Drag** | Drag a card or run onto a target and let go |
| **Tap the stock** | Draw cards or pass through again |
| **Hint** | The next right move glows gold |
| **Undo** | Any number of moves back. Right after **New**, Undo brings back the previous game |
| **New** | Next deal of the same level |
| Tap during the celebration | ends the celebration |

When you are stuck, **No moves left** appears with the choice between undoing and a new game.
