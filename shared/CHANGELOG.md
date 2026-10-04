# Changelog of the shell

All notable changes to the MIND PAUSE shell. [Deutsch](CHANGELOG.de.md)

## 1.0.0 (2026-10-04)

First version, extracted from SPRING 2.0.3.

* Design tokens in `tokens.css`, layout and building blocks in `shell.css`
* `createShell()` with header, control bar, picker (sheet, drawer, sidebar), settings, result card, toasts and first launch hint
* `createI18n()` for German and English, `createStorage()` with one prefix per game
* `SoundEngine` with four-layer sound, three sound styles and the iOS unlock
* Offline support per game with versioned references (`?shell=`)
