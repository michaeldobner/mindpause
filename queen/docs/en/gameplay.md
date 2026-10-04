# Gameplay and controls

[Deutsche Version](../de/spielregeln.md) · [Overview](README.md)

## Contents

* [The board](#the-board)
* [Rules of German checkers](#rules-of-german-checkers)
* [End of the game and draws](#end-of-the-game-and-draws)
* [Modes](#modes)
* [Stars and statistics](#stars-and-statistics)
* [Controls](#controls)
* [The trays](#the-trays)
* [Settings](#settings)
* [Installing on iPhone and iPad](#installing-on-iphone-and-ipad)
* [Tips for beginners](#tips-for-beginners)

## The board

The game is played on a board of 8×8 squares, but only on the 32 dark squares. Each side starts with 12 pieces on the dark squares of its first three rows. **White** sits at the bottom and moves first, **Black** sits at the top. In the Midnight board style the bottom side is called **Blue**. The two middle rows start empty.

Against the computer you always play the bottom side, White or Blue.

## Rules of German checkers

| Rule | Meaning |
|---|---|
| Moving | A piece moves one square diagonally **forwards** to an empty square |
| Capturing | A piece jumps diagonally over an opposing piece to the empty square directly behind it. Pieces capture **forwards and backwards** |
| Mandatory capture | If a side can capture, it **must** capture. If there are several captures, the choice is free. It does not have to be the longest one |
| Multiple capture | If the piece can capture again after a jump, it must keep jumping until no capture is left. A piece may not be jumped twice. Captured pieces are removed only at the end of the move |
| Queen | If a piece ends its move on the opponent's back row, it becomes a **queen** and wears an engraved golden crown. If a piece reaches the back row in the middle of a multiple capture and can capture again, it continues as a plain piece and is not crowned |
| Flying queen | A queen moves diagonally forwards and backwards across **any number of empty squares**. She captures an opposing piece from a distance and may land on any empty square behind it |

QUEEN checks every rule itself. You cannot make an illegal move, and when you tap a piece the game shows all its legal targets.

## End of the game and draws

| Result | When |
|---|---|
| Win | The other side cannot move, because it has no pieces left or all of them are blocked |
| Draw by repetition | The same position with the same side to move occurs for the third time |
| Draw by standstill | 30 plies in a row in which only queens move and nothing is captured |
| Resignation | One side resigns, the other wins |

A ply is the move of one side, so 30 plies are 15 moves per side.

## Modes

| Mode | Opponent | Playing style |
|---|---|---|
| **Beginner** | Computer | Only looks at its own move, never at your reply. Leaves pieces unprotected and falls for simple capture traps. For learning the rules |
| **Easy** | Computer | Looks two plies ahead, but often misses what follows a capture and is careless every other move. For casual games |
| **Medium** | Computer | Looks four plies ahead and usually calculates exchanges to the end, but is careless now and then. A serious opponent |
| **Hard** | Computer | Looks as deep as it can in just under a second and always plays the best move it finds |
| **Two players** | Human | Two people take turns on one device |

Choose the mode at any time with the **Modes** button (or by tapping the mode name, and after a game via "Other mode"). Switching always starts a new game. Each mode keeps its own statistics.

<img src="../images/iphone-modes-en.jpg" width="260" alt="Choose a mode">

The levels are balanced so that each clearly beats the next weaker one, in about 85 to 90 % of test games. The mistakes of the low levels are meant to feel human: the computer overlooks things, it never suddenly gives a piece away on purpose.

### The computer's move

While the computer is thinking, the header shows "Black thinks", for at least 0.7 seconds. Then the piece that will move lifts visibly and moves calmly to its target, in a multiple capture jump by jump. Every jumped piece fades at once and then rolls into the tray. The start and target squares of the last move stay subtly lighter until the next move. Every move can be followed even after looking away for a moment.

## Stars and statistics

Stars are awarded for wins against the computer, separately for each level:

| Stars | Wins at this level |
|---|---|
| ★ | 1 |
| ★★ | 3 |
| ★★★ | 10 |

For every mode QUEEN counts games, wins, losses and draws. With two players there are no stars, and the result card names the winning colour.

After a win against Beginner, Easy or Medium the result card offers **Next level**.

<img src="../images/iphone-result-en.jpg" width="260" alt="Result card after a win">

## Controls

### Moving a piece

| Gesture | Effect |
|---|---|
| Tap a piece | The piece lifts and all legal targets appear as rings |
| Tap a target | The piece moves there. For a multiple capture the final square is enough, QUEEN jumps the whole way |
| Drag a piece and release | Works the same way. Releasing away from a target lets the piece slide back |
| Tap a piece without a legal move | The piece wiggles briefly. When a capture is mandatory, only pieces that can capture may move |

If two different capture paths lead to the same final square, QUEEN takes the one that captures more pieces.

### Control bar

| Button | Effect |
|---|---|
| **Undo** | Takes back your last move, against the computer together with its reply. If the computer is thinking, Undo cancels it |
| **Hint** | The computer calculates the best move for the side to move at Hard level and marks it with a golden ring |
| **New** | Starts a new game in the same mode at once. If you tapped it by mistake, Undo brings the old game back |
| **Resign** | Ends the game after a confirmation. Against the computer it counts as a loss, with two players the side to move resigns. Undo on the result card takes the resignation back, including the statistics entry |
| **Modes** | Opens the choice of modes |
| **More** | Opens the settings |

### Progress

QUEEN saves every move. If you close the app in the middle of a game, it continues at the same point in the same mode the next time you open it. Undo then reaches back to that resumed position. On the very first start the mode is Easy.

## The trays

Captured pieces roll into a tray at the edge of the board: at the top and bottom in portrait, on the left and right in landscape. Your own pieces are always at the bottom. Each side collects its spoils in its own tray, so the bottom side keeps the captured black pieces (in landscape on the right, filled from the bottom).

The pieces in the trays are alive, but they never get in the way of the game:

* **Tap** gives a piece a small nudge.
* **Swipe** pushes the pieces along, they bump into each other and click softly.
* **Tilt**, when turned on, lets them slide to the lower end of the tray.

## Settings

Under **More**:

| Setting | Effect |
|---|---|
| Board | Classic (ebony, maple, ivory, gold) or Midnight (deep blue, ceramic). Switch at any time, even in the middle of a game |
| Sound | Sounds on or off |
| Sound style | Warm, Clear or Soft. Applies to every game in MIND PAUSE |
| Turn the board | With two players the board turns towards the player to move after every move. An iPad can lie flat between two people |
| Tilt | Captured pieces follow the tilt of the device. iOS asks for the motion sensor the first time |

Settings are saved.

<img src="../images/iphone-settings-en.jpg" width="260" alt="Settings">

## Installing on iPhone and iPad

1. Open **https://michaeldobner.github.io/mindpause/queen/** in **Safari**.
2. Tap **Share**, then **Add to Home Screen**.
3. QUEEN then starts full screen like an app and also works without internet.

## Tips for beginners

1. **Hold the back row.** Pieces on your own back row stop the opponent from getting a queen there. Keep them as long as you can.
2. **Take the centre.** Pieces in the middle have more moves than pieces on the edge.
3. **Use mandatory capture.** Offer a piece the opponent must take when you can capture two in return.
4. **Move in groups.** A piece with a neighbour behind it cannot be jumped.
5. **Queens are worth a lot.** A flying queen is about as strong as three plain pieces. The way to the crown pays off.
6. **Trade when ahead.** The side with more pieces wins more easily by exchanging.
