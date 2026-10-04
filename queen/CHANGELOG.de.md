# Changelog

Alle wichtigen Änderungen an QUEEN. [English](CHANGELOG.md)

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
