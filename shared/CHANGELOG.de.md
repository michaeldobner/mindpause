# Changelog der Hülle

Alle wichtigen Änderungen an der Hülle von MIND PAUSE. [English](CHANGELOG.md)

## 1.0.0 (2026-10-04)

Erste Version, herausgelöst aus SPRING 2.0.3.

* Design-Tokens in `tokens.css`, Layout und Bausteine in `shell.css`
* `createShell()` mit Kopfzeile, Steuerleiste, Auswahl (Blatt, Schublade, Seitenleiste), Einstellungen, Ergebniskarte, Hinweisen und Erststart-Hinweis
* `createI18n()` für Deutsch und Englisch, `createStorage()` mit einem Präfix pro Spiel
* `SoundEngine` mit vierschichtigem Klang, drei Klangfarben und der Ton-Freigabe für iOS
* Offline-Betrieb pro Spiel mit versionierten Verweisen (`?shell=`)
