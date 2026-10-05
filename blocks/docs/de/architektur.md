# Architektur

[English version](../en/architecture.md) · [Übersicht](README.md)

## Module

| Datei | Aufgabe | DOM |
|---|---|---|
| `js/shapes.js` | Formen als Zeichenbilder, Drehungen und Spiegelungen, Zufall mit Startwert und Gewichten | nein |
| `js/modes.js` | Freie Modi, Punkte, Serie, Sterne | nein |
| `js/levels.js` | 30 Level: Kurve der Schwierigkeit, Formen je Kapitel, Sterne nach Steinen | nein |
| `js/level-data.js` | Startbretter, Startwerte und Richtwerte, erzeugt von `tools/levels.mjs` | nein |
| `js/game.js` | Spiellogik: Legen, Abräumen, Füllen des Tabletts, Ende, Ruhe, Zurück, Tipp, Speichern | nein |
| `js/view.js` | Platte, Steine, Tablett, Vorschau und Animationen auf Canvas | ja |
| `js/input.js` | Ziehen mit Finger und Maus, Tastatur | ja |
| `js/sound.js` | Klänge, Unterklasse der Klang-Engine der Hülle | Web Audio |
| `js/main.js` | Verbindet alles mit der Hülle: Level und Modi, Fortschritt, Zurück, Tipp, Neu, Bestwerte, Ergebnis | ja |

## Datenmodell

```
mode       'classic', 'wide', 'calm' oder 'level', dazu level (1 bis 30)
board      n Reihen × n Spalten, Reihe 0 oben. Zelle: 0 (leer) oder Nummer der Form + 1
pre        nur im Level: welche Felder noch Startsteine tragen
tray       drei Schlüssel wie 'l4:3' (Form und Lage) oder null für ein leeres Fach
rng        Zufall mit Startwert (mulberry32), sein Zustand wird mitgespeichert
score, moves, lines
streak     aktuelle Serie, idle: Steine seit dem letzten Abräumen
state      playing, over (verloren) oder won (Level geschafft)
undoSnap   Zustand vor dem letzten Stein
```

Weil der Zustand des Zufalls zum Spiel gehört, bringt Zurück nach dem Nachfüllen dieselben Steine wieder. Ein Spieler kann also nicht durch Zurück neue Steine erzwingen.

## Ablauf eines Steins

1. `input.js` erkennt den Druck auf ein Fach (`view.slotAt`) und legt `view.drag` an.
2. Bei jeder Bewegung rechnet `view.dragBox()` die Lage des Steins aus, `view.dragTarget()` sucht die nächste Lage, an der er passt (höchstens 0,75 Zellen entfernt), und `game.preview()` liefert die Linien, die verschwinden würden.
3. Beim Loslassen ruft `game.place(fach, x, y)` die Logik auf. Passt der Stein nicht, gleitet er zurück.
4. `game.place` legt den Stein, entfernt volle Reihen und Spalten gleichzeitig (samt Startsteinen), rechnet Punkte und Serie, prüft das Ziel des Levels, füllt das Tablett nach, wenn es leer ist, und prüft das Ende.
5. `game.drainEvents()` liefert, was passiert ist: `place`, `clear`, `score`, `refill`, `calmClear`, `levelDone`, `gameOver`, `undo`. Jedes Ereignis geht an `view.handle()` (Animationen) und an den Klang.

Die Logik ist sofort fertig, die Darstellung folgt mit Animationen nach.

## Startbrett

* **Level:** festes Brett aus `level-data.js`, die Steinfolge kommt aus dem festen Startwert des Levels.
* **Freie Modi:** `scatter()` belegt jedes Feld mit der Wahrscheinlichkeit des Modus und gibt jeder vollen Linie danach eine Lücke.

In beiden Fällen sucht `setup()` ein erstes Tablett, bei dem alle drei Steine passen. Klappt das in 30 Versuchen nicht, beginnt das Spiel auf leerem Brett, dort passen drei Steine immer. Ein Test prüft das für 150 Startwerte je Modus und alle 30 Level.

## Level erzeugen

`tools/levels.mjs` baut jedes Level nach der Kurve in `levels.js`: ein spiegelsymmetrisches Brett mit ungefähr der gewünschten Dichte, ohne volle Linie, und einen Startwert. Dann spielt der Computerspieler das Level nach Tipps durch. Aufgenommen wird das erste Brett, das er schafft und das nicht zu schnell gelöst ist. Seine Zahl an Steinen wird zum Richtwert. Weil Startbrett und Startwert fest sind, prüft `tests/levels.test.js`, dass jedes Level noch mit genau diesem Richtwert lösbar ist. Ändert sich die Spiellogik, schlägt der Test an und die Level werden mit `node blocks/tools/levels.mjs` neu erzeugt.

## Füllen des Tabletts

`game.refill()` zieht bis zu 40 Mal drei Steine, je nach Modus:

| Regel | Modi | Bedingung |
|---|---|---|
| `one` | Klassisch, Weit, Level 21 bis 30 | Mindestens einer der drei Steine passt auf das aktuelle Brett |
| `all` | Ruhe, Level 1 bis 20 | Alle drei passen in irgendeiner Reihenfolge, mit Abräumen dazwischen |

Im Level zieht `pickShape()` nur aus den Formen des Kapitels.

Ob alle drei passen, prüft `canPlaceAll()` mit einer Tiefensuche über Reihenfolgen und Plätze. Sie ist auf 6 000 Schritte begrenzt, danach gilt die Antwort als nein und es wird neu gezogen. Auf einem leeren Brett findet sie sofort eine Lösung, auf einem vollen Brett gibt es nur wenige Plätze. Findet sich keine passende Ziehung, nimmt das Spiel die erste, in der wenigstens ein Stein passt.

## Darstellung

Ein Canvas, gezeichnet nur, wenn sich etwas ändert oder eine Animation läuft. Platte, Rand und Mulden liegen in einer eigenen Ebene, die nur bei einer neuen Größe entsteht. Jede Zelle ist ein Sprite je Farbe und Größe in Gerätepixeln.

## Speichern

Unter dem Präfix `blocks:` im lokalen Speicher:

| Schlüssel | Inhalt |
|---|---|
| `game` | laufendes Spiel (`Game.serialize()`), nach jedem Stein und beim Verlassen |
| `mode` | zuletzt gewählter Modus oder Level, zum Beispiel `level-7` |
| `progress` | höchstes freies Level und je Level Sterne, Punkte und Steine des besten Ergebnisses |
| `stats` | je freiem Modus: Zahl der Spiele und Bestwert (Punkte, Linien, Steine) |
| `preview` | Einstellung |
| `sound`, `soundStyle`, `coachSeen` | von der Hülle |

## Hülle

BLOCKS nutzt die Hülle 1.5.0 ohne Änderungen: die Steuerleiste der Hülle (Zurück, Tipp, Neu, Modi, Mehr), die Auswahl als Blatt oder Schublade, einen Schalter in den Einstellungen und die Ergebniskarte. Das SVG-Brett der Hülle wird ausgeblendet, das Canvas liegt als eigenes Element auf der Bühne.

## Entwicklung und Tests

```bash
npm start                           # http://localhost:3000/blocks/
npm test                            # Logik-Tests, darunter blocks/tests/
npm run e2e                         # Browser-Test aller Spiele
node blocks/tools/bot.mjs 40        # Computerspieler: Punkte je Modus, Zeit pro Stein
node blocks/tools/levels.mjs        # 30 Level erzeugen und durchspielen
node blocks/tools/screenshots.mjs   # Bilder der Dokumentation
node blocks/tools/icons.mjs         # App-Symbole
```

Die Werkzeuge mit Browser brauchen Playwright: `npm install --no-save playwright && npx playwright install chromium`.

| Test | Prüft |
|---|---|
| `tests/game.test.js` | Startbrett und erste drei Steine in jedem Modus, Formen und Lagen, Zufall, Modi, Legen, Reihen und Spalten gleichzeitig, Punkte, Serie, Nachfüllen, Regeln `one` und `all`, Suche mit Abräumen, Ende, Ruhe, Zurück, Tipp, Speichern, Sterne, ein ganzes Spiel |
| `tests/levels.test.js` | 30 Level, keine volle Linie, Symmetrie, Dichte, Sägezahn, Formen je Kapitel, erste drei Steine, jedes Level lösbar mit dem Richtwert, Ziel, Speichern, Zurück mit Startsteinen, Sterne |
| `scripts/e2e.mjs` | Hülle vollständig, nichts ragt aus dem Bild, ein Zug und Zurück, keine Fehler, auf iPhone, iPhone SE, iPhone quer und iPad. Dazu die Prüfungen „Drag“ (Stein mit der Maus aufs Brett ziehen) „Return“ (daneben loslassen, Stein bleibt auf dem Tablett) und „Level“ (Level 1 durchspielen, Level 2 wird frei, Ergebniskarte mit „Weiter“) |

Neue Version: `node scripts/release.mjs blocks <version>`.
