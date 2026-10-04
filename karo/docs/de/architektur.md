# Architektur

[English version](../en/architecture.md) · [Übersicht](README.md)

## Module

| Datei | Aufgabe | DOM |
|---|---|---|
| `js/cards.js` | Karten als Zahlen 0 bis 51, Zufall mit Startwert, Mischen, Geben | nein |
| `js/game.js` | Spiellogik: Züge, Regeln, Punkte, Zurück, Speichern, festgefahren erkennen | nein |
| `js/solver.js` | Löser mit Tiefensuche, Tipp für eine Stellung | nein |
| `js/solver-worker.js` | Löser im Hintergrund | Worker |
| `js/levels.js` | Stufen, nächste Spielnummer, Tagesspiel | nein |
| `js/deals.js` | eingeteilte Spielnummern, erzeugt von `tools/deals.mjs` | nein |
| `js/faces.js` | das Deck als SVG-Symbole | nein |
| `js/view.js` | Matte, Layout, Tippen und Ziehen, Animationen | ja |
| `js/celebrate.js` | Siegesfeier auf einem Canvas | ja |
| `js/sound.js` | Klänge, Unterklasse der Klang-Engine der Hülle | Web Audio |
| `js/main.js` | verbindet alles mit der Hülle: Stufen, Regeln, Statistik, Zeit | ja |

## Datenmodell

```
Karte       Zahl 0 bis 51. Farbe = karte / 13 (Pik, Herz, Kreuz, Karo), Wert = karte % 13 + 1
tableau     7 × { down: [verdeckt], up: [offen] }, letzte Karte oben
foundations [4] höchster Wert je Farbe
stock       Nachziehstapel, die nächste Karte steht vorn
waste       Ablagestapel, die oberste Karte steht hinten
fan         so viele Karten des letzten Ziehens liegen aufgefächert
```

Zurück speichert vor jedem Zug eine Momentaufnahme. Ein Spiel wird nach jedem Zug und alle 5 Sekunden gespeichert und beim nächsten Start fortgesetzt.

## Löser

Der Löser kennt alle Karten. Er betrachtet Ablage- und Nachziehstapel als **eine Reihe** mit einer Position: Ziehen schiebt die Position weiter, neu Durchlaufen setzt sie auf null. Statt einzelner Ziehzüge kennt er nur „spiele die Karte an Stelle p“. Das spart sehr viel Suche.

* **Gefahrlose Züge zuerst und allein:** Eine Karte auf eine Ablage ist gefahrlos, wenn alle Karten, die auf ihr liegen könnten, schon abgelegt sind.
* **Reihenfolge:** Ablage, Aufdecken (Spalten mit vielen verdeckten Karten zuerst), Karten vom Stapel, Teilreihen, die eine Karte für die Ablage freigeben, Spalten leeren, zurück von der Ablage.
* **Bekannte Stellungen** werden nicht zweimal untersucht. Spalten werden dafür sortiert, weil ihre Reihenfolge keine Rolle spielt.
* **Budget:** Der Tipp untersucht höchstens 60 000 Stellungen, das dauert auf dem iPhone deutlich unter einer Sekunde.

## Ablauf eines Zugs

1. `view.js` erkennt Tippen oder Ziehen und meldet `tap(from)` oder `move(from, to)`.
2. `main.js` wählt bei einem Tipp das beste Ziel (`game.bestTarget`) und führt den Zug aus.
3. `game.js` prüft, bewegt, deckt auf, rechnet Punkte und merkt sich die Stellung für Zurück.
4. `view.js` berechnet für jede Karte die Zielposition und bewegt sie per `transform`.
5. `main.js` spielt den Klang, speichert und prüft: gewonnen, automatisch beenden oder festgefahren.

## Entwicklung und Tests

```bash
npm start                        # http://localhost:3000/karo/
npm test                         # Logik-Tests, darunter karo/tests/
npm run e2e                      # Browser-Test aller Spiele
node karo/tools/deals.mjs 200    # Stufen neu einteilen
node karo/tools/icons.mjs        # App-Symbole neu erzeugen (braucht Playwright)
```

| Test | Prüft |
|---|---|
| `tests/game.test.js` | Geben, Regeln, Punkte, Vegas, Zeit, Zurück, Speichern, Ende |
| `tests/solver.test.js` | Lösungen lassen sich Zug für Zug im echten Spiel nachspielen |
| `tests/levels.test.js` | Listen eindeutig, Stichprobe lösbar, Reihenfolge, Tagesspiel |

KARO ändert nichts an der Hülle. Neue Version: `node scripts/release.mjs karo <version>`.
