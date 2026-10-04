# Architektur

[English version](../en/architecture.md) · [Übersicht](README.md)

## Überblick

MÜHLE ist aufgebaut wie [QUEEN](../../../queen/docs/de/architektur.md): Alles Gemeinsame kommt aus der Hülle in `shared/`, dieser Ordner enthält nur, was MÜHLE eigen ist. Kein Server, kein Build-Schritt.

```
muehle/index.html
 ├─ ../shared/tokens.css, ../shared/shell.css
 ├─ css/muehle.css                Zielringe, Steine zum Nehmen, Vorschau der Modi
 └─ js/main.js                    Einstieg: verbindet MÜHLE mit der Hülle
     ├─ ../shared/js/shell.js, i18n.js, storage.js, tilt.js
     ├─ js/strings.js             Texte auf Deutsch und Englisch
     ├─ js/rules.js               Regeln der Mühle (ohne Darstellung)
     ├─ js/game.js                Spielstand, Vorrat, Zurück, Spielende (ohne Darstellung)
     ├─ js/view.js                SVG-Brett, Steine, Mühlen, Schalen, Eingabe
     │   ├─ js/themes.js          Brettstile und Mühlrad
     │   └─ ../shared/js/gutter.js  Physik der Schalen
     ├─ js/sound.js               Klänge (erweitert die Klang-Engine der Hülle)
     └─ js/ai-worker.js           Web Worker für Computerzüge und Tipps
         └─ js/ai.js              Computergegner (ohne Darstellung)
```

Grundprinzip: **Regeln → Spielstand → Darstellung**. `rules.js`, `game.js` und `ai.js` greifen nicht auf das Dokument zu und sind in Node.js vollständig getestet.

## `rules.js`: Regelwerk

**Punkte.** Das Brett ist eine Liste aus 24 Zahlen. Punkt = Ring · 8 + k, Ring 0 außen, Ring 2 innen, k läuft im Uhrzeigersinn ab der Ecke oben links. Ecken haben gerade k, Mitten ungerade k. Nur Mitten sind mit dem Nachbarring verbunden.

```
 0 ───────── 1 ───────── 2
 │   8 ───── 9 ───── 10  │
 │   │  16 ─ 17 ─ 18  │  │
 7 ─ 15 ─ 23     19 ─ 11 ─ 3
 │   │  22 ─ 21 ─ 20  │  │
 │  14 ───── 13 ───── 12  │
 6 ───────── 5 ───────── 4
```

| Konstante | Inhalt |
|---|---|
| `WHITE = 1`, `BLACK = -1` | Seiten. Die untere Seite heißt im Code immer `WHITE`, der angezeigte Name kommt aus dem Brettstil |
| `GRID` | Lage jedes Punkts im 7 × 7 Raster |
| `ADJACENT` | Nachbarn jedes Punkts, 32 Verbindungen |
| `MILLS`, `MILLS_AT` | Die 16 Mühlen, für jeden Punkt seine zwei Mühlen |
| `DRAW_PLIES = 40` | Halbzüge ohne Mühle bis zum Remis |

**Zustand** `{ board, hand, turn }`: Brett, Steine im Vorrat je Seite, Seite am Zug.

**Zug** `{ from, to, remove }`: `from = -1` beim Setzen, `remove` ist der Punkt des genommenen Steins oder `-1`. Ein Zug, der eine Mühle schließt, kommt einmal je erlaubtem Stein zum Nehmen vor. Dadurch ist jeder Zug vollständig und unteilbar: Computer, Zurück, Speichern und Tests brauchen keinen Zwischenzustand.

| Funktion | Aufgabe |
|---|---|
| `legalMoves(zustand)` | Alle erlaubten Züge der Seite am Zug |
| `applyMove(zustand, zug)` | Neuer Zustand, der alte bleibt unverändert |
| `phaseOf(zustand, seite)` | `place`, `move` oder `fly` |
| `removable(brett, gegner)` | Nehmbare Steine: nie aus einer Mühle, außer alle stehen in Mühlen |
| `millsAt`, `inMill` | Mühlen eines Punkts |
| `lossReason(zustand)` | `few`, `blocked` oder `null` |
| `positionKey(zustand)` | Schlüssel für die Wiederholungsregel |
| `pointName`, `pointAt` | Notation a7 bis g1 |

## `game.js`: Klasse `Game`

| Eigenschaft oder Methode | Aufgabe |
|---|---|
| `board`, `hand`, `turn`, `moves` | Zustand und erlaubte Züge |
| `ids`, `reserve` | Nummer des Steins auf jedem Punkt, Nummern im Vorrat je Seite. 0 bis 8 schwarz, 9 bis 17 weiß |
| `history` | Einträge `{ move, mover, removedId, mills, side, before }`, `before` macht Zurück exakt |
| `quiet`, `seen` | Halbzüge ohne Mühle, Häufigkeit jeder Stellung |
| `movesTo(von, nach)`, `targetsFrom(von)`, `match(zug)` | Züge für die Eingabe und für den Computer finden |
| `apply(zug)`, `undo()` | Zug ausführen und zurücknehmen |
| `counts`, `result`, `isOver` | `result`: `null`, `{ winner, reason }` oder `{ draw: 'repetition' \| 'quiet' }` |
| `serialize()`, `restore(daten)` | Speichern und Fortsetzen |

Wo ein Stein liegt, der nicht auf dem Brett steht, folgt aus diesen Daten: Steht seine Nummer im Vorrat, liegt er in der eigenen Schale, sonst wurde er genommen und liegt in der Schale der Gegenseite.

## `ai.js`: Computergegner

Negamax mit Alpha-Beta-Schnitt, schrittweise Vertiefung bis Tiefe oder Zeit, Merkliste bekannter Stellungen, Züge mit Mühle zuerst. Zufall unter fast gleich guten Zügen.

**Bewertung** aus Sicht einer Seite, jeweils eigene minus gegnerische Werte:

| Merkmal | Punkte |
|---|---|
| Stein auf dem Brett oder im Vorrat | 100 |
| Geschlossene Mühle | 8 |
| Offener Zweier (zwei eigene Steine, dritter Punkt frei) | 14 |
| Freier Nachbarpunkt in der Zugphase | 4 |
| Eingesperrter Stein in der Zugphase | minus 6 |
| Verloren | minus 100 000 |

**Stufen** (`LEVELS`):

| Stufe | Tiefe | Zeit | Spielraum | Fehler |
|---|---|---|---|---|
| Leicht | 2 | 200 ms | 60 Punkte | 25 % zufälliger Zug, aber nie an einer Mühle vorbei |
| Mittel | 4 | 500 ms | 8 Punkte | keine |
| Schwer | bis 12 | 1000 ms | 0 | keine |

Bei der Entwicklung gewann Mittel 4:0 gegen Leicht, Schwer gegen Mittel 2 Siege und 2 Remis ohne Niederlage. Das passt dazu, dass Mühle bei gutem Spiel remis endet.

`chooseMove(zustand, stufe, { random, now, only })`: `only` beschränkt die Auswahl, der Tipp nach einer Mühle fragt damit nach dem besten Stein zum Nehmen. Der Worker nimmt `{ id, state, level, only }` und antwortet mit `{ id, move }`.

## `view.js`: Klasse `MuehleView`

Wie bei QUEEN: fester Brettraum, Drehung für Querformat und Spiel zu zweit, 18 SVG-Steine mit festen Nummern, zwei Schalen als `Gutter` der Hülle, Warteschlange `run()`.

**Mühle in zwei Schritten.** Ein eigener Zug, der eine Mühle schließt, wird erst ausgeführt, wenn der Stein zum Nehmen gewählt ist:

1. `stage(von, nach, optionen)`: Der Stein zieht sichtbar, die Mühle leuchtet, die nehmbaren Steine pulsieren. Der Spielstand bleibt unverändert, `pending` hält die Auswahl.
2. Tipp auf einen pulsierenden Stein: Ereignis `move` mit dem vollständigen Zug, `main.js` ruft `Game.apply()`, danach `playNow(record, null, true)` nur noch für das Nehmen.

Zurück, Neu oder ein Moduswechsel während der Auswahl rufen `sync()`, das `pending` löscht und den Stein zurückführt. Da der Spielstand nie halb geändert war, ist nichts weiter zu tun.

| Methode | Aufgabe |
|---|---|
| `setGame`, `sync` | Stellung ohne oder mit Animation übernehmen, auch für Steine in den Schalen |
| `play`, `playNow` | Zug animieren: Setzen, Ziehen oder Springen, Mühle zeigen, Stein nehmen |
| `stage`, `showRemovable`, `clearPending` | Auswahl des Steins zum Nehmen |
| `select`, `showHint` | Auswahl, Zielringe, Tippring |
| `setTheme`, `setFlip`, `setGravity` | Stil, Drehung, Neigung |

**Ereignisse an `main.js`:** `canMove`, `move`, `lift`, `invalid`, `land`, `mill`, `take`, `rim`, `clack`, `pending`, `done`.

## Speicherung

Präfix `muehle:` im `localStorage`: `mode`, `game`, `stats`, `theme`, `flip`, `tilt`, `sound`, `soundStyle`, `coachSeen`, `millToastSeen` (der Hinweis beim ersten Nehmen).

## Tests

| Datei | Prüft |
|---|---|
| `tests/rules.test.js` | Brett, Notation, Setzen, Mühle, Schutz, Doppelmühle, Ziehen, Springen, Verlieren |
| `tests/game.test.js` | Zurück, Steinnummern, Remis beider Arten, Speichern, Computer schließt und verhindert Mühlen, Mittel gegen Leicht, 40 Zufallspartien mit Zurück |
| `tests/themes.test.js` | Beide Stile definieren dieselben Verläufe, Namen in beiden Sprachen |
| Browser-Test | Zug und Zurück auf iPhone und iPad, dazu die Prüfung `Mill`: Mühle schließen, halben Zug zurücknehmen, Stein nehmen |

## Werkzeuge

```bash
node muehle/tools/icons.mjs         # App-Symbole aus SVG, braucht Playwright
node muehle/tools/screenshots.mjs   # Bilder der Dokumentation, braucht Playwright
```
