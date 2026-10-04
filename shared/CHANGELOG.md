# Changelog of the shell

All notable changes to the MIND PAUSE shell. [Deutsch](CHANGELOG.de.md)

## 1.2.0 (2026-10-04)

### New
* Settings can now hold a choice besides switches: a `settings` entry with `options` appears as a segmented control at the top of the settings, for example for QUEEN's board style. `setSetting(id, value)` and the `setting(id, value)` action carry the selected value.

## 1.1.0 (2026-10-04)

Building blocks for QUEEN, available to every game.

### New
* `gutter.js`: rim physics, previously part of SPRING. New `arc` option for straight trays with walls at both ends and `speedScale` for circles of a different radius.
* `tilt.js`: motion sensor, previously part of SPRING.
* `SoundEngine.rim()` and `SoundEngine.clack(strength)`: rim sounds, previously part of SPRING.

### Improved
* The header never wraps: level name and counter label stay on one line, and on narrow iPhones (below 360 px) the counter is more compact.

## 1.0.0 (2026-10-04)

First version, extracted from SPRING 2.0.3.

* Design tokens in `tokens.css`, layout and building blocks in `shell.css`
* `createShell()` with header, control bar, picker (sheet, drawer, sidebar), settings, result card, toasts and first launch hint
* `createI18n()` for German and English, `createStorage()` with one prefix per game
* `SoundEngine` with four-layer sound, three sound styles and the iOS unlock
* Offline support per game with versioned references (`?shell=`)
