# Changelog der Hülle

Alle wichtigen Änderungen an der Hülle von MIND PAUSE. [English](CHANGELOG.md)

## 1.2.0 (2026-10-04)

Bausteine für FUGE, die allen Spielen zur Verfügung stehen. Bestehende Spiele verhalten sich unverändert.

### Neu
* Eigene Schaltflächen in der Steuerleiste: Ein Eintrag in `buttons` kann `{ id, icon, labelKey }` sein.
* `setButton(id, { icon, labelKey })` wechselt Symbol und Beschriftung, zum Beispiel zwischen Pause und Weiter.
* `showResult({ showBack: false })` blendet „Letzten Zug zurücknehmen“ aus, für Spiele ohne Zurück.

### Tests
* Der Browser-Test prüft Zurück nur bei Spielen, die diese Schaltfläche zeigen.

## 1.1.0 (2026-10-04)

Bausteine für QUEEN, die allen Spielen zur Verfügung stehen.

### Neu
* `gutter.js`: Physik des Rands, bisher Teil von SPRING. Neu mit `arc` für gerade Schalen mit Wänden an beiden Enden und `speedScale` für Kreise mit anderem Radius.
* `tilt.js`: Bewegungssensor, bisher Teil von SPRING.
* `SoundEngine.rim()` und `SoundEngine.clack(stärke)`: Klänge des Rands, bisher Teil von SPRING.

### Verbessert
* Kopfzeile bricht nie um: Levelname und Zählerbeschriftung bleiben einzeilig, auf schmalen iPhones (unter 360 px) steht der Zähler kompakter.

## 1.0.0 (2026-10-04)

Erste Version, herausgelöst aus SPRING 2.0.3.

* Design-Tokens in `tokens.css`, Layout und Bausteine in `shell.css`
* `createShell()` mit Kopfzeile, Steuerleiste, Auswahl (Blatt, Schublade, Seitenleiste), Einstellungen, Ergebniskarte, Hinweisen und Erststart-Hinweis
* `createI18n()` für Deutsch und Englisch, `createStorage()` mit einem Präfix pro Spiel
* `SoundEngine` mit vierschichtigem Klang, drei Klangfarben und der Ton-Freigabe für iOS
* Offline-Betrieb pro Spiel mit versionierten Verweisen (`?shell=`)
