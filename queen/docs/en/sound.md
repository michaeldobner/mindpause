# Sound design

[Deutsche Version](../de/klang.md) · [Overview](README.md)

## Goal

A ceramic piece is set down on a lacquered wooden board: warm, round, with a short bright ring. A capture sounds stronger, a crowning like a small bell. Nothing beeps, nothing blares.

QUEEN uses the sound engine of the shell (`shared/js/sound-engine.js`) with its mastering, sound styles and the building blocks contact, wood and ceramic. How these building blocks are built and tuned is described in detail in the [sound design of SPRING](../../../spring/docs/en/sound.md). QUEEN's own sounds live in `queen/js/sound.js` in the class `QueenSound`. There are no audio files.

## All sounds

| Moment | Method | Structure |
|---|---|---|
| Lift a piece | `lift()` | An almost inaudible tap: a soft contact and a very short high ceramic tone |
| Move lands | `place(progress)` | The landing sound of the engine (`tap`): contact, wood, ceramic, room. The pitch rises as the game goes on |
| Capture | `hop(k)` | A strong contact, deeper wood around 175 Hz and a bright ceramic tone. In a multiple capture each further jump rises by two steps of the scale |
| Captured piece reaches the tray | `rim()` from the engine | Deeper wood, a soft ceramic click |
| Pieces bump in the tray | `clack(strength)` from the engine | A fine click scaled by the impact, at most eight per second |
| Crowning | `crown()` | Three bell tones on steps 10, 12 and 15 of the scale, 90 ms apart, with a long decay |
| Piece without moves | `invalid()` from the engine | Two muted, low wooden knocks |
| Undo | `place(…, { soft: true })` | Like a landing, softer and lower |
| Win | `win(true)` from the engine | Rising triad with a bell tone |
| Loss | `lose()` | Two calm, falling tones of wood and ceramic |
| Draw | No sound of its own | The result card is enough |

## The game as a melody

As in SPRING, the course of the game can be heard. Progress is the number of captured pieces divided by 22: early moves land low, and the fewer pieces remain on the board, the higher they sound. Because the ceramic is tuned to the major pentatonic scale, every tone fits every other, even in fast multiple captures.

## Never annoying

* Every sound varies slightly in pitch and volume, no move sounds exactly like the one before.
* Bumps in the trays are throttled: at most eight clicks per second, at least 45 ms apart.
* There is no constant noise. Rolling pieces are silent, only impacts are heard.
* Sound can be turned off under **More**, and the sound style applies to every game.

## iOS

Safari only allows sound after a touch. The engine unlocks audio again on every first touch, click and key press, also after the app restarts.

## Customising

| Goal | Place |
|---|---|
| A sound of QUEEN | Method in `queen/js/sound.js` |
| Tray sounds, landing sound, win | Sound engine of the shell, which then applies to every game |
| New sound style | `SOUND_STYLES` in `shared/js/sound-engine.js`, see [Extending](extending.md) |
