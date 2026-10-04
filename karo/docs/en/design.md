# Design system

[Deutsche Version](../de/design.md) · [Overview](README.md)

## Guiding idea

A **fine deck of cards lying on a linen mat.** The mood follows classic designer playing cards: slate, gold foil, harlequin diamonds, Art Deco. Everything is flat and graphic, yet feels like paper. The deck is drawn especially for KARO.

| Principle | Meaning |
|---|---|
| **Legibility first** | Every card has a header with a large rank and suit symbol. In the columns, often only this strip is visible |
| **Tangibility** | Soft shadows, a 3D turn when revealing, cards fly over the others |
| **Calm** | Short, soft motion. The celebration is a slow homage, not fireworks |
| **Reliability** | One tap is enough. Undo reverts anything done by accident |

## Colours

### Deck and mat (the same in light and dark mode)

| Role | Hex |
|---|---|
| Mat | `#26343a` → `#172025`, linen texture, gold line at the edge |
| Embossing, frames | `#c9a961` |
| Paper | `#fbf8f2` |
| Cream | `#f4ecdc` |
| Back | petrol `#1f5a50`, orange `#e08a3c`, sky blue `#3e9ad3`, cream |
| Red suits | vermilion `#c63b2c` |
| Black suits | ink `#1c1d2a` |
| Court cards | rust `#b5532a`, indigo `#454c96`, ochre `#d9a441`, petrol |

The interface around the mat uses the collection's design tokens from `shared/tokens.css`.

## Typography

| Role | Typeface |
|---|---|
| KARO wordmark, score | Didot, Bodoni 72, fallback Georgia (from the shell) |
| Ranks on the cards | Didot bold. German B, D, K, English J, Q, K |

## The deck

| Part | Design |
|---|---|
| **Back** | Harlequin diamonds: petrol in a checkerboard, with bands of cream, orange and blue between, and a cream border |
| **Header** | large rank on the left, suit on the right, legible at 14 % of the card height |
| **Suit symbols** | drawn for KARO, softer and rounder than usual, filled on the cards, as a gold outline on empty foundations |
| **Number cards** | classic layout, lower half turned, plenty of white space |
| **Aces** | a large symbol in a double gold diamond frame. The ace of spades carries a ray wreath as the deck's signature |
| **Court cards** | mirrored figures in a gold frame on cream with a dot grid |

### Shape system of the court cards

| Element | King | Queen | Jack |
|---|---|---|---|
| Head | stepped crown, beard | arched crown with pearls, long hair | beret with feather |
| Attribute | sceptre | flower | key |

| Suit | Gown | Pattern |
|---|---|---|
| Spades | indigo | chevrons |
| Hearts | rust | half circles |
| Clubs | petrol | dots |
| Diamonds | ochre | diamonds |

All figures have **closed eyes**: calm and meditative, the signature of the deck.

## Layouts

| Device | Arrangement |
|---|---|
| iPhone portrait, iPad portrait | stock and waste top left, foundations top right, seven columns below |
| iPhone landscape, iPad landscape | stock on the left with the waste below, seven columns in the centre, foundations on the right |

Card size follows the available space. When a column gets long, its cards move closer together.

## Motion

| Action | Duration |
|---|---|
| Move a card | 0.3 s, flying over the others |
| Reveal | 0.32 s, 3D turn |
| Deal | card by card, 32 ms apart |
| Automatic finish | one card every 120 ms |
| Celebration | one card every 240 ms, gravity, bounces, fading trails |

With "Reduce motion", the celebration is skipped and moves arrive instantly.

## Sound

Paper instead of ceramic, built on the shell's sound engine:

| Sound | Construction |
|---|---|
| Draw | short, bright noise sliding upwards |
| Place | low, soft noise with a quiet wooden knock |
| Reveal | two short paper sounds |
| Foundation | place plus the collection's ceramic tone, rising with progress |
| Pass again | sliding noise |
| New game | a riffle of 14 short sounds |
| Win | the collection's triad |
