# Changelog

Alle wichtigen Änderungen an QUEEN. [English](CHANGELOG.md)

## 1.2.0 (2026-10-04)

### Neu
* **Vier Computerstufen:** neue Stufe **Einsteiger**, die nur auf den eigenen Zug schaut und auf einfache Schlagfallen hereinfällt. **Leicht** ist deutlich leichter als bisher. Die niedrigen Stufen übersehen Dinge wie ein Mensch, statt plötzlich Steine zu verschenken. Jede Stufe schlägt die nächstschwächere in Testpartien in rund 85 bis 90 % der Spiele.
* **Aufgeben** als eigene Schaltfläche mit Rückfrage. Gegen den Computer zählt es als Niederlage, zu zweit gibt die Seite am Zug auf. Zurück nimmt das Aufgeben samt Statistik zurück.
* **Ruhige Computerzüge:** Denkpause mindestens 0,7 Sekunden, der Stein hebt sich sichtbar an und zieht langsam, bei Mehrfachschlag Sprung für Sprung. Übersprungene Steine verblassen sofort.
* **Markierung des letzten Zugs:** Start- und Zielfeld bleiben dezent aufgehellt.

### Verbessert
* Der Computer beendet gewonnene Endspiele schneller: Seine Damen rücken an die letzten Steine heran, halten die lange Diagonale und engen den Gegner ein.
* Beim allerersten Start ist jetzt Leicht gewählt.

### Technik
* Neue Werte `quiet` und `careless` für die Stufen in `js/ai.js`, Aufgeben in `Game` (wird gespeichert).
* Braucht die Hülle 1.4.0 für die Schaltfläche Aufgeben und die Rückfrage.
* Neue Tests für Aufgeben und die Abstufung, jetzt 22 Tests für QUEEN.

## 1.1.1 (2026-10-04)

### Gestaltung
* **Neues App-Symbol** im gemeinsamen Stil der Sammlung: ein Ausschnitt des Bretts von oben auf Ochsenblut-Rot, in der Mitte eine Dame mit der gravierten Krone. Das schwarze Symbol ging auf der dunklen Startseite unter.

### Technik
* Neues Skript `tools/icons.mjs` erzeugt das Symbol und die PNG-Dateien.

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
