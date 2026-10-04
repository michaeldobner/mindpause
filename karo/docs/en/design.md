# Design system

[Deutsche Version](../de/design.md) · [Overview](README.md)

## Guiding idea

A **fine deck of cards lying on a linen mat.** The model is classic designer playing cards: pure white paper, delicate Didot indices, large diagonal court cards with patterned bands, harlequin diamonds on the back. Everything is flat and graphic. The deck is drawn especially for KARO.

| Principle | Meaning |
|---|---|
| **Legibility first** | The index in the top left is large enough to read even in the narrow strip visible in the columns |
| **Tangibility** | Soft shadows, the card turns over when revealed, cards fly over the others |
| **Calm** | Short, soft motion. The celebration is a slow homage, not fireworks |
| **Reliability** | One tap is enough. Undo reverts anything done by accident |

## Colours

### Deck and mat (the same in light and dark mode)

| Role | Hex |
|---|---|
| Mat | `#26343a` → `#172025`, linen texture, gold line at the edge |
| Mat embossing | `#c9a961` |
| Paper | `#fdfcf9` |
| Cream | `#f4ecdc` |
| Back | petrol `#1e5c52`, orange `#e39a4a`, sky blue `#4aa0d8`, cream `#f2e8d6` |
| Red suits | vermilion `#c8382b` |
| Black suits | ink `#1b1c26` |
| Court cards | periwinkle `#6f78b8` with navy `#2b3070`, rust `#c0652f` with vermilion, petrol `#2f6b5c` with ochre, ochre `#d9a441` with orange |

The interface around the mat uses the collection's design tokens from `shared/tokens.css`.

## Typography

| Role | Typeface |
|---|---|
| KARO wordmark, score | Didot, Bodoni 72, fallback Georgia (from the shell) |
| Card index | Didot regular with a hairline outline, rank above suit, top left and turned bottom right. German B, D, K, English J, Q, K |

## The deck

| Part | Design |
|---|---|
| **Paper** | pure white, no frames, plenty of white space |
| **Back** | elongated diamonds in diagonal bands: petrol, with cream and orange and cream and sky blue between, a narrow white border |
| **Index** | rank above suit, top left and turned bottom right, legible in a strip of a third of the card height |
| **Suit symbols** | classic, slightly softened, filled on the cards, as a gold outline on empty foundations |
| **Number cards** | classic layout, lower half turned |
| **Aces** | a single symbol on white. The ace of spades carries the court card patterns as the deck's signature: sawtooth ring, dot row, wavy line |
| **Court cards** | large figures across the whole card, tilted 28° diagonally: one head top right, the mirrored one bottom left |

### Shape system of the court cards

Every figure wears a gown shaped as a long hexagon with stripes in cream and the accent colour along the edges. Collar and patterns tell the ranks apart:

| Element | King | Queen | Jack |
|---|---|---|---|
| Gown | wide and angular | narrow at the shoulders | slender |
| Collar | black band with zigzag on both sides | black band with sawtooth | black band with pennants |
| Pattern band | checkerboard | dot row with white cores | cord |
| Sides | round discs of arcs | black lenses with a wavy line | herringbone |
| Centre | hexagon with ochre | diamond | circle |
| Head | stepped crown, beard | hood in the gown colour, small crown to the side | tall cap with dot band |
| Attribute | sceptre | flower | sword |

| Suit | Gown | Accent |
|---|---|---|
| Spades | periwinkle | navy |
| Hearts | rust | vermilion |
| Clubs | petrol | ochre |
| Diamonds | ochre | orange |

The faces are fine line drawings: half-open eyes with a lowered gaze, slender brows, a long nose, small red lips. Calm and inward, the signature of the deck.

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
| Reveal | 0.3 s, flat: the card narrows, changes sides halfway and widens again. Deliberately without 3D, because Safari now and then shows the wrong side of a 3D turn |
| Deal | card by card, 32 ms apart |
| Automatic finish | one card every 120 ms |
| Celebration | one card every 240 ms, gravity, bounces, fading trails |

With "Reduce motion", moves arrive instantly. The celebration stays, but calmer: one card every 420 ms, slower, without trails. The celebration's card images are prepared in the background during play. If one is still missing at the win, that card bounces as a plain card with rank and suit.

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
