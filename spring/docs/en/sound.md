# Sound design

[Deutsche Version](../de/klang.md) · [Overview](README.md)

## Goal

A ceramic marble landing on a wooden board: warm, round, with a short bright ring and a touch of room. Like a fine object in a living room, not like a slot machine.

All sounds are synthesised live in the browser with the Web Audio API. The sound engine with mastering, sound styles and the building blocks contact, wood and ceramic belongs to the shell (`shared/js/sound-engine.js`) and is available to every game. SPRING's own sounds (lift, land, rim) live in `spring/js/sound.js`. There are no audio files, so SPRING stays small, works fully offline and every sound can be tuned precisely.

## Anatomy of a jump

| Layer | Heard as | Implementation | Length |
|---|---|---|---|
| 1. Contact | Precise touch | Noise, high frequencies only (high pass 3.5 kHz) | 4 ms |
| 2. Wood | Warm, round "tock" | Sine around 190 Hz, pitch falls slightly | 60 ms |
| 3. Ceramic | Bright, noble ring | Three partials at 1 : 2.76 : 5.4 with 100 %, 32 % and 10 % level | 160, 85, 45 ms |
| 4. Room | Space, not a reverb effect | Convolution with a synthetic 0.55 s room | Amount depends on the style |

The partial ratio 1 : 2.76 : 5.4 is that of a freely vibrating body. It sounds like ceramic or glass instead of an electronic beep.

## Tuning

* The ceramic is tuned to the **major pentatonic scale** (root C5 at 523.25 Hz). Pentatonic notes sound consonant in any order, even in quick succession.
* **The game becomes a melody:** from the first move to the last marble the pitch climbs step by step across ten degrees of the scale, almost two octaves.
* **Liveliness:** every sound varies randomly by ±2 % in pitch and ±12 % in level, so no jump sounds exactly like the one before.

## All sounds

| Moment | Sound | Peak level |
|---|---|---|
| Lift a marble | Almost inaudible, soft tap | about −40 dB |
| Jump lands | Four layers, pitch follows progress | about −12 dB |
| Undo | Like a landing, quieter and two steps lower | about −17 dB |
| Marble rolls into the rim | Deeper wood, soft ceramic click | about −21 dB |
| Marbles bump in the rim | Fine click, level follows impact | −25 to −35 dB |
| Invalid marble | Two muted, low wooden knocks | about −19 dB |
| Figure solved | Rising triad with a long decay | about −11 dB |
| Masterful | Plus a fourth note and a bell tone | about −10 dB |

Levels were measured with an `OfflineAudioContext`. The loudest sound peaks around −10 dB, which leaves headroom and avoids clipping.

## Mastering

All sounds run through the same chain:

```
sounds ─┬─► dry ───────────────┐
        └─► room (convolver) ──┴─► low pass ─► compressor ─► master ─► speaker
```

| Stage | Setting | Purpose |
|---|---|---|
| Low pass | 5.2 to 10 kHz depending on the style | Removes harshness, important on small speakers |
| Compressor | Threshold −18 dB, ratio 3 : 1, attack 3 ms, release 120 ms | Keeps peaks together, sounds fuller |
| Master | 0.8 | Headroom against clipping |

## Sound styles

| Style | Wood | Ceramic | Room | Low pass | Character |
|---|---|---|---|---|---|
| **Warm** (default) | 100 % | 55 % | 10 % | 7 kHz | Round, earthy, calm |
| **Clear** | 55 % | 100 % | 9 % | 10 kHz | Bright, precise, glassy |
| **Soft** | 75 % | 60 % | 24 % | 5.2 kHz | Muted, with more room |

Choosing a style in the settings immediately plays a short preview of three rising jumps.

## So it never gets annoying

* At most 8 clicks per second from the rim and at least 45 ms between two clicks.
* Very gentle bumps stay silent.
* No constant noise: rolling is silent, only bumps can be heard, also while tilting.
* SPRING respects the iPhone's **silent switch** (`navigator.audioSession.type = 'ambient'` where available).
* iOS only enables sound when a finger is lifted or on a complete tap, and pauses it again after switching apps. SPRING therefore checks on every such touch whether sound is running, resumes it if needed and plays a silent sound that reliably unlocks Safari.

## Tweaking

All values are at the top of `shared/js/sound-engine.js`. A change there affects every game:

| Constant | Meaning |
|---|---|
| `PENTATONIC` | Scale in semitones |
| `BASE_HZ` | Root of the ceramic |
| `CERAMIC_RATIOS`, `CERAMIC_GAINS`, `CERAMIC_DECAYS` | Ceramic partials |
| `SOUND_STYLES` | The three sound styles |

A new sound style is one more entry in `SOUND_STYLES` plus a button in the segmented control in `shared/js/shell.js` and a translation under `styles` in `shared/js/i18n.js`. It is then available in every game.
