# Changelog

Alle wichtigen Änderungen an MÜHLE. [English](CHANGELOG.md)

## 1.1.0 (2026-10-04)

### Neu
* **Weiß immer unten:** Im Querformat wird das Brett nicht mehr gedreht. Die Platte wird breiter, die Schalen mit Vorrat und genommenen Steinen stehen links (Schwarz) und rechts (Weiß), direkt neben dem Brett.
* Das Brett wählt selbst die Form, in der es größer erscheint, auch in Split View.
* „Anderer Modus“ auf der Ergebniskarte, die Modi kommen auf dem iPad als Schublade.

### Technisch
* Braucht Hülle 1.5.0.
* Neue Prüfung „Seat“ im Browser-Test.

## 1.0.0 (2026-10-04)

Erste Version.

### Spiel
* Neun Männer Mühle nach den Turnierregeln des Weltmühlespiel-Dachverbands: Setzen, Ziehen, Springen mit drei Steinen
* Mühle schließen und einen Stein nehmen, Steine in Mühlen sind geschützt, außer alle stehen in Mühlen. Eine Doppelmühle nimmt einen Stein
* Verloren mit zwei Steinen oder ohne Zug. Remis bei dreifacher Wiederholung oder nach 20 Zügen je Seite ohne Mühle
* Vier Modi: gegen den Computer Leicht, Mittel, Schwer und zu zweit an einem Gerät
* Computergegner mit Minimax und Alpha-Beta-Schnitt, im Hintergrund gerechnet
* Tipp zeigt den besten Zug und nach einer Mühle den besten Stein zum Nehmen
* Zurück nimmt gegen den Computer bis zum eigenen Zug zurück, bei offener Mühle nur den halben Zug
* Neu mit einem Tipp, Zurück holt das vorherige Spiel zurück
* Sterne und Statistik je Stufe

### Gestaltung
* Abgeleitet von QUEEN: schwarzes Holz, Elfenbein, Ebenholz und Gold, alternativ Mitternacht in Tiefblau
* Linien als eingelegte Goldadern, Punkte als vergoldete Mulden, graviertes Mühlrad in der Mitte, Koordinaten a bis g und 1 bis 7
* Geschlossene Mühlen leuchten als Goldlinie auf, Steine zum Nehmen pulsieren
* Jede Seite hat eine Schale mit ihrem Vorrat und den genommenen Steinen, antippen, wischen, neigen
* Brett drehen beim Spiel zu zweit (Einstellung)
* App-Symbol in Petrol in der einheitlichen Bildsprache der Sammlung

### Technik
* Aufgebaut auf der Hülle von MIND PAUSE 1.4.0
* 22 Tests für Regeln, Spielstand, Remis, Computer und Brettstile, dazu eine eigene Prüfung im Browser-Test
