# Changelog

Alle wichtigen Änderungen an SPRING. [English](CHANGELOG.md)

## 2.1.1 (2026-10-04)

### Technik
* Physik des Rands, Neigen und die Klänge des Rands kommen jetzt aus der Hülle 1.1.0 und werden mit QUEEN geteilt. Für Spielende ändert sich nichts.
* Die Kopfzeile bricht auf schmalen iPhones nicht mehr um.

## 2.1.0 (2026-10-04)

SPRING gehört jetzt zur Sammlung **MIND PAUSE**.

### Geändert
* Neue Adresse: **https://michaeldobner.github.io/mindpause/spring/**. Die alte Adresse leitet hierher weiter, Spielstände und Sterne bleiben erhalten.
* Oberfläche (Kopfzeile, Steuerleiste, Blätter, Einstellungen, Ergebniskarte, Hinweise), Design-Tokens, Klang-Engine, Sprachen und Speicherung kommen jetzt aus der gemeinsamen Hülle von MIND PAUSE. Für Spielende ändert sich nichts.
* Die Einstellungen zeigen neben der Version den Namen der Sammlung.

### Technik
* SPRING liegt in einem eigenen Ordner `spring/` mit eigenem Service Worker, Manifest, Tests und Dokumentation.
* Verweise auf Dateien von SPRING tragen `?v=`, Verweise auf die Hülle `?shell=`.
* Neuer Browser-Test auf iPhone, iPhone SE und iPad in GitHub Actions, Screenshots zum Herunterladen.

## 2.0.3 (2026-10-04)

### Behoben
* **Ton nach dem Neustart der App** funktioniert wieder sofort. iOS gibt Ton nur beim Loslassen des Fingers oder bei einem vollständigen Tipp frei, nicht beim ersten Aufsetzen, und hält ihn nach einem App-Wechsel an. SPRING setzt den Ton jetzt bei jeder solchen Berührung fort.
* **Neigen nach dem Neustart der App** verbindet sich aus demselben Grund zuverlässig und schaltet sich nicht mehr selbst aus.

### Geändert
* **Neu braucht nur noch einen Tipp.** War es ein Versehen, holt Zurück direkt danach das vorherige Spiel zurück. Die Rückfrage „Sicher?“ entfällt.

## 2.0.2 (2026-10-04)

### Behoben
* **Zurück** geht nicht mehr verloren: Ein Tipp während einer Animation (zum Beispiel solange die geschlagene Murmel noch rollt) wartet, bis sie fertig ist. Mehrere schnelle Tipps werden nacheinander ausgeführt. Das Brett kann nach einem Fehler oder einer verlorenen Berührung nicht mehr hängen bleiben.
* **Schalter für Neigen**: Direkt nach dem Start konnte er sich wieder einschalten statt aus, solange iOS noch nach der Erlaubnis fragte. Der Schalter zeigt jetzt immer, was du gewählt hast.
* **Kein Dauerrauschen** mehr: Das Rollgeräusch im Rand ist entfernt, es war beim Neigen ständig zu hören. Stöße klicken weiterhin leise.
* **Endbildschirm** erscheint nicht mehr erneut: Ein Figurenwechsel startet immer ein neues Spiel, und ein beendetes Spiel beginnt beim nächsten Öffnen neu.

### Geändert
* Das Abzeichen „läuft“ auf den Figurenkarten ist entfernt, weil jeder Wechsel ein neues Spiel beginnt.

## 2.0.1 (2026-10-04)

### Behoben
* Auf Geräten, die schon eine frühere Version geladen hatten, konnten sich nach einem Update neue und alte Dateien mischen. Folge: ein leeres Feld unter SPRING, fehlende Beschriftungen der Schaltflächen, ein nach rechts verrutschtes Layout und Schaltflächen ohne Funktion. Jetzt lädt jede Version nur ihre eigenen Dateien (`?v=` an jedem Verweis), der Service Worker umgeht den Browser-Cache und die Seite lädt bei einer neuen Version einmal neu.
* Auf sehr schmalen iPhones (SE 1. Generation) passen die fünf Schaltflächen jetzt auf den Bildschirm.

### Technik
* Neues Skript `scripts/release.mjs` setzt eine Versionsnummer überall.
* Neuer Test `tests/release.test.js` prüft die versionierten Verweise, damit der Fehler nicht wiederkommt. Insgesamt 29 Tests.

## 2.0.0 (2026-10-04)

Das Spiel heißt jetzt **SPRING**.

### Neu
* **7 Figuren**, sortiert nach Schwierigkeit: Kreuz, Plus, Pyramide, Pfeil, Raute, Kamin, Klassisch. Jede Figur ist bis auf eine Murmel in der Mitte lösbar, geprüft mit dem Löser.
* **Figur im Spiel wechseln** über den Figurennamen im Kopf, die Schaltfläche Figuren oder die Seitenleiste auf dem iPad quer. Das Brett baut sich animiert um.
* **Eigener Spielstand pro Figur**: Beim Wechseln geht nie ein Spiel verloren.
* **Sterne** pro Figur (bis zu drei) und Statistik pro Figur.
* Schaltfläche **Nächste Figur** auf der Ergebniskarte.
* **Tipps**: Ein Löser in einem Web Worker zeigt den nächsten richtigen Zug.
* **Lebendiger Rand**: Geschlagene und ungenutzte Murmeln liegen lose im Rand und reagieren auf Antippen und Wischen mit Physik, Stößen und Klang.
* **Neigen** (optional): Murmeln im Rand rollen, wenn das Gerät geneigt wird.
* **Neues Klangdesign** in vier Schichten (Anschlag, Holz, Keramik, Raum), gestimmt auf eine pentatonische Tonleiter, steigt mit dem Fortschritt. Drei Klangfarben: Warm, Klar, Weich.
* **Zweisprachig**: Deutsch auf deutsch eingestellten Geräten, sonst Englisch.
* **Einstellungen** mit Ton, Klangfarbe und Neigen.
* Einmaliger Hinweis beim ersten Start, wo die Figur gewechselt wird.

### Geändert
* Es gibt immer alle 32 Murmeln. Murmeln, die eine Figur nicht braucht, liegen im Rand.
* Steuerung: Zurück, Tipp, Neu, Figuren, Mehr.
* Das iPhone respektiert den Lautlos-Schalter.
* Spielstand und Statistik aus Version 1 werden automatisch übernommen.

### Technik
* Neue Module: `figures.js`, `gutter.js`, `solver.js`, `solver-worker.js`, `tilt.js`, `i18n.js`.
* 26 automatische Tests, bei jedem Push über GitHub Actions.
* Dokumentation vollständig auf Deutsch und Englisch.

## 1.0.0 (2026-10-04)

Erste Version, damals noch unter dem Namen Solohalma.

* Klassisches englisches Brett mit 33 Feldern und 32 Murmeln
* Tippen oder Ziehen, Rückgängig ohne Begrenzung, Bewertung am Spielende
* Rundes dunkelblaues Brett, geschlagene Murmeln rollen in den Rand
* Hell- und Dunkelmodus, Hoch- und Querformat
* Progressive Web App, offline spielbar
