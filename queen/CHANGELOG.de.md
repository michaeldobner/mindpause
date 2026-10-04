# Changelog

Alle wichtigen Änderungen an QUEEN. [English](CHANGELOG.md)

## 1.1.0 (2026-10-04)

### Neu
* **Brettstil Klassik** (neuer Standard): schwarzes Holz mit Maserung, Felder aus Ahorn und Ebenholz, feine Goldlinie um das Brett, Koordinaten A bis H und 1 bis 8 in Gold, Schalen mit Rautengitter. Die Steine sind Elfenbein und Ebenholz, die Seiten heißen Weiß und Schwarz.
* **Brettstil Mitternacht**: das bisherige blaue Brett mit Keramiksteinen, Seiten Blau und Schwarz.
* Wahl des Stils unter Mehr > Brett. Der Wechsel blendet weich über, das Spiel läuft weiter.
* **Neue Krone** als feine Goldgravur nach dem Vorbild einer Königinnenkrone: Kreuz, Reichsapfel, Bügel mit Perlen, Lilien, Reif mit Steinen und Hermelin. Bei der Krönung wächst sie leicht auf.
* Neues App-Symbol im Stil Klassik.

### Behoben
* In der Modusauswahl standen manche Steine der Vorschau auf hellen Feldern.

### Technik
* Neues Modul `js/themes.js` mit den Brettstilen und der Kronengravur.
* Braucht die Hülle 1.2.0 für die Auswahl in den Einstellungen.
* Zwei neue Tests für die Brettstile, jetzt 20 Tests für QUEEN.

## 1.0.0 (2026-10-04)

Erste Version.

### Spiel
* Deutsche Dame auf 8×8: Steine schlagen vorwärts und rückwärts, fliegende Damen, Schlagpflicht, Mehrfachschlag, Krönung auf der Grundreihe
* Remis bei dreifacher Wiederholung oder nach 30 Halbzügen nur mit Damen ohne Schlag
* Vier Modi: gegen den Computer Leicht, Mittel, Schwer und zu zweit an einem Gerät
* Computergegner mit Minimax und Alpha-Beta-Schnitt, im Hintergrund gerechnet
* Tipp zeigt den besten Zug, Zurück nimmt gegen den Computer bis zum eigenen Zug zurück
* Neu mit einem Tipp, Zurück holt das vorherige Spiel zurück
* Sterne und Statistik je Stufe

### Gestaltung
* Tiefblaues Brett mit Keramiksteinen in Blau und Schwarz
* Goldene Krone für jede Dame, mit Glockenton
* Zwei Schalen für geschlagene Steine: im Hochformat oben und unten, im Querformat links und rechts
* Steine in den Schalen reagieren auf Antippen, Wischen und optional auf Neigen
* Brett drehen beim Spiel zu zweit (Einstellung)

### Technik
* Aufgebaut auf der Hülle von MIND PAUSE 1.1.0
* 18 Tests für Regeln, Spielstand, Remis und Computer, dazu der Browser-Test der Sammlung
