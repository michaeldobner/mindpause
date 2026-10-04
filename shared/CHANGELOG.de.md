# Changelog der Hülle

Alle wichtigen Änderungen an der Hülle von MIND PAUSE. [English](CHANGELOG.md)

## 1.5.0 (2026-10-04)

Querformat für alle Spiele neu gedacht. Im Querformat ist die Höhe knapp, deshalb liegen Kopfzeile und Steuerung jetzt neben dem Brett statt darüber und darunter.

### Neu
* **Ein Querformat für alle Geräte:** Sobald die Fläche deutlich breiter als hoch ist (Seitenverhältnis ab 5:4), stehen Titel, Stufe und Zähler links, das Brett nutzt die volle Höhe, die Schaltflächen stehen rechts übereinander. Das gilt für iPhone, iPad, Rechner und Split View. Auf dem iPhone bleibt es kompakter.
* **Schublade statt Seitenleiste:** Die feste Seitenleiste auf dem iPad entfällt. Die Auswahl kommt als Schublade von links, über den Namen der Stufe (wieder mit Pfeil) oder die Schaltfläche. Nach einer Wahl schließt sie sich von selbst.
* **Erster Start:** Die Auswahl öffnet sich einmal von selbst. Wird sie geschlossen, zeigt die Sprechblase am Namen der Stufe, wo man sie wiederfindet.
* **„Andere …“ auf der Ergebniskarte** öffnet die Auswahl. Neuer Schlüssel `levels.otherKey`, ausblendbar mit `showResult({ showOther: false })`.
* Im Querformat darf das Brett größer werden als 820 px.

### Entfernt
* `isSidebar()` und die feste Seitenleiste.

### Tests
* Der Browser-Test prüft den ersten Start (Auswahl offen, danach Sprechblase) und dass Kopf und Steuerung im Querformat neben, im Hochformat über und unter dem Brett liegen.

## 1.4.0 (2026-10-04)

### Neu
* Schaltfläche `resign` (Aufgeben, Symbol Fahne) für die Steuerleiste. Bis zu sechs Schaltflächen, bei sechs werden sie etwas kleiner und passen auch auf das iPhone SE und ins Querformat.
* `confirm({ title, text, ok, cancel })`: Rückfrage als Karte auf dem Brett, liefert `true` oder `false`. Escape bricht ab.
* Neue Texte „Aufgeben“ und „Abbrechen“ in beiden Sprachen.

## 1.3.0 (2026-10-04)

Bausteine für FUGE, die allen Spielen zur Verfügung stehen. Bestehende Spiele verhalten sich unverändert.

### Neu
* Eigene Schaltflächen in der Steuerleiste: Ein Eintrag in `buttons` kann `{ id, icon, labelKey }` sein.
* `setButton(id, { icon, labelKey })` wechselt Symbol und Beschriftung, zum Beispiel zwischen Pause und Weiter.
* `showResult({ showBack: false })` blendet „Letzten Zug zurücknehmen“ aus, für Spiele ohne Zurück.

### Tests
* Der Browser-Test prüft Zurück nur bei Spielen, die diese Schaltfläche zeigen.

## 1.2.0 (2026-10-04)

### Neu
* Einstellungen können neben Schaltern jetzt auch eine Auswahl enthalten: `settings` mit `options` erscheint als Segmentauswahl oben in den Einstellungen, zum Beispiel für den Brettstil von QUEEN. `setSetting(id, wert)` und die Aktion `setting(id, wert)` liefern den gewählten Wert.

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
