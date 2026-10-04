# Architektur

[English version](../en/architecture.md) · [Übersicht](README.md)

## Überblick

QUEEN ist ein Spiel der Sammlung **MIND PAUSE**. Alles, was alle Spiele teilen (Kopfzeile, Steuerleiste, Blätter, Einstellungen, Ergebniskarte, Hinweise, Sprachen, Speichern, Klang-Engine, Physik der Schalen, Neigen, Offline-Betrieb), kommt aus der **Hülle** in `shared/`. Dieser Ordner enthält nur, was QUEEN eigen ist. Wie die Hülle funktioniert, steht in der [Doku der Hülle](../../../shared/README.de.md).

Es gibt keine Server-Logik und keinen Build-Schritt. Der Browser lädt `index.html`, die Stylesheets und die JavaScript-Module direkt.

```
queen/index.html
 ├─ ../shared/tokens.css          Design-Tokens der Sammlung
 ├─ ../shared/shell.css           Layout und Bausteine der Hülle
 ├─ css/queen.css                 Nur Zielringe und Vorschau der Modi
 └─ js/main.js                    Einstieg: verbindet QUEEN mit der Hülle
     ├─ ../shared/js/shell.js     Oberfläche der Hülle (createShell)
     ├─ ../shared/js/i18n.js      Sprachen der Hülle (createI18n)
     ├─ ../shared/js/storage.js   Speichern (createStorage)
     ├─ ../shared/js/tilt.js      Bewegungssensor
     ├─ js/strings.js             Texte von QUEEN auf Deutsch und Englisch
     ├─ js/rules.js               Regeln der Deutschen Dame (ohne Darstellung)
     ├─ js/game.js                Spielstand, Zurück, Spielende, Remis (ohne Darstellung)
     ├─ js/view.js                SVG-Brett, Steine, Krone, Animationen, Eingabe
     │   ├─ js/themes.js          Brettstile und Kronengravur
     │   └─ ../shared/js/gutter.js  Physik der Steine in den Schalen
     ├─ js/sound.js               Klänge von QUEEN (erweitert die Klang-Engine der Hülle)
     └─ js/ai-worker.js           Web Worker für Computerzüge und Tipps
         └─ js/ai.js              Computergegner (ohne Darstellung)

queen/sw.js                       Service Worker für den Offline-Betrieb von QUEEN
queen/manifest.webmanifest        Angaben für die Installation als eigene App
```

Grundprinzip: **Regeln → Spielstand → Darstellung**. `rules.js`, `game.js` und `ai.js` greifen nicht auf das Dokument zu. Sie laufen deshalb auch in Node.js und sind dort vollständig getestet.

### Anbindung an die Hülle

`main.js` ruft `createShell()` mit der Beschreibung von QUEEN auf:

| Angabe | Wert bei QUEEN |
|---|---|
| Titel | `QUEEN` |
| Schaltflächen | Zurück, Tipp, Neu, Modi, Mehr |
| Auswahl | Modi, mit Vorschau, Sternen und Schwierigkeit |
| Zusätzliche Einstellungen | Auswahl Brett (Klassik, Mitternacht), Schalter Brett drehen und Neigen |
| Hinweis in den Einstellungen | „Wische über die Steine in den Schalen“ |
| Aktionen | Zurück, Tipp, Neu, Nochmal, Nächste Stufe, Modus wählen, Einstellungen umschalten |

## Module

### `rules.js`: Regelwerk

Das Brett ist eine Liste aus 64 Zahlen, Index = Zeile · 8 + Spalte. Gespielt wird auf den Feldern mit ungerader Summe aus Zeile und Spalte.

| Wert | Bedeutung |
|---|---|
| `0` | Leeres Feld |
| `1`, `2` | Blauer Stein, blaue Dame |
| `-1`, `-2` | Schwarzer Stein, schwarze Dame |

Blau (`BLUE = 1`) beginnt in den Zeilen 5 bis 7 und zieht nach oben, Schwarz (`BLACK = -1`) in den Zeilen 0 bis 2. Im Code heißt die untere Seite immer `BLUE`, auch wenn sie im Stil Klassik als Weiß erscheint. Der angezeigte Name kommt aus dem Brettstil.

Ein **Zug** ist `{ from, to, path, captured, crown }`:

| Feld | Inhalt |
|---|---|
| `from`, `to` | Start- und Endfeld |
| `path` | Alle Landefelder nacheinander, bei einem einfachen Zug nur `[to]` |
| `captured` | Felder der geschlagenen Steine in Schlagreihenfolge |
| `crown` | `true`, wenn der Zug mit einer Krönung endet |

| Funktion | Aufgabe |
|---|---|
| `initialBoard()` | Startstellung |
| `legalMoves(brett, seite)` | Alle erlaubten Züge. Gibt es Schläge, nur die Schläge (Schlagpflicht), jeweils als vollständige Schlagfolge |
| `applyMove(brett, zug)` | Neues Brett nach dem Zug, das alte bleibt unverändert |
| `countPieces(brett)` | `{ blue, black }` |
| `positionKey(brett, seite)` | Schlüssel einer Stellung für die Wiederholungsregel |
| `isDark`, `sideOf`, `isKing`, `coords`, `indexOf` | Hilfsfunktionen |

Schlagfolgen entstehen durch Tiefensuche: Von jedem Landefeld aus wird weitergesucht, bereits geschlagene Steine bleiben bis zum Ende auf dem Brett stehen und sind gesperrt. Fliegende Damen prüfen jede Richtung bis zum ersten Stein und dürfen hinter einem geschlagenen Stein auf jedem freien Feld landen. Ein Stein, der die Grundreihe erreicht und weiterschlagen kann, schlägt als Stein weiter.

### `game.js`: Klasse `Game`

| Eigenschaft oder Methode | Aufgabe |
|---|---|
| `board`, `turn`, `moves` | Brett, Seite am Zug, erlaubte Züge |
| `ids` | Für jedes Feld die Nummer des Steins darauf oder `null`. Nummern 0 bis 11 sind schwarz, 12 bis 23 blau (`Game.colorOf(id)`) |
| `history` | Alle ausgeführten Züge als Einträge `{ move, mover, capturedIds, crowned, side, before }`. `before` hält den Zustand davor, Zurück ist dadurch exakt |
| `quiet`, `seen` | Zähler der Halbzüge nur mit Damen ohne Schlag, Häufigkeit jeder Stellung |
| `findMove(von, nach)` | Zug zu einer Eingabe. Führen mehrere Schlagwege zum selben Feld, gilt der längste |
| `movesFrom(feld)`, `match(zug)` | Züge eines Steins, Zug des Computers dem eigenen Zug zuordnen |
| `apply(zug)`, `undo()` | Zug ausführen und zurücknehmen |
| `resign(seite)` | Die Seite gibt auf, `null` nimmt das Aufgeben zurück. Wird mit dem Spielstand gespeichert |
| `counts`, `result`, `isOver` | Zustand. `result` ist `null`, `{ winner }`, `{ winner, resigned: true }` oder `{ draw: 'repetition' \| 'quiet' }` |
| `pieceAt(feld)` | `{ id, side, king }` oder `null` |
| `serialize()`, `restore(daten)` | Spielstand speichern und laden |

Die festen Nummern der Steine sind der Schlüssel für die Darstellung: Jeder SVG-Stein gehört zu genau einer Nummer und bleibt dieselbe Figur, egal wohin er zieht.

### `ai.js` und `ai-worker.js`: Computergegner

Der Computer sucht mit **Negamax und Alpha-Beta-Schnitt**, wie ein klassisches Schachprogramm:

| Technik | Wirkung |
|---|---|
| Schrittweise Vertiefung | Erst ein Halbzug, dann zwei und so weiter, bis Tiefe oder Zeit erreicht sind. Bei Zeitablauf gilt das Ergebnis der letzten vollständigen Tiefe |
| Merkliste (Transpositionstabelle) | Bekannte Stellungen werden nicht doppelt berechnet, der beste Zug daraus wird zuerst probiert |
| Zugsortierung | Bester bekannter Zug, dann Schläge mit vielen Steinen, dann Krönungen |
| Ruhesuche | Steht am Ende der Suchtiefe ein Pflichtschlag an, wird der Schlagabtausch weitergerechnet, je nach Stufe bis zu acht Halbzüge (`quiet`). Auf Schwer übersieht der Computer so keine Schlagfolge, niedrige Stufen sehen bewusst weniger weit |
| Zufall unter gleich guten Zügen | Partien verlaufen nicht immer gleich |

**Bewertung** einer Stellung aus Sicht einer Seite:

| Merkmal | Punkte |
|---|---|
| Stein | 100, plus 4 je Reihe Fortschritt |
| Stein auf der eigenen Grundreihe | plus 10 |
| Stein am Rand | minus 4 |
| Stein oder Dame in der Mitte (4×4 Felder) | plus 8 |
| Dame | 320 |
| Weniger als 10 Steine auf dem Brett | Alles mal 1,15, damit Abtausch bei Vorsprung lohnt |
| Klarer Vorsprung im Endspiel (höchstens 9 Steine, mindestens 150 Punkte vorne) | Damen des Stärkeren bekommen Punkte für Nähe zu den letzten gegnerischen Steinen, für die lange Diagonale und dafür, dass der Gegner wenige Züge hat. So wird ein gewonnenes Endspiel zügig beendet |

**Stufen** (`LEVELS`):

| Stufe | Tiefe | Ruhesuche | Zeit | Spielraum | Unaufmerksam |
|---|---|---|---|---|---|
| Einsteiger | 1 | 0 | 150 ms | 60 Punkte | immer |
| Leicht | 2 | 1 | 250 ms | 35 Punkte | 50 % der Züge |
| Mittel | 4 | 6 | 500 ms | 10 Punkte | 20 % der Züge |
| Schwer | bis 14 | 8 | 900 ms | 0 | nie |

* **Spielraum:** Gewählt wird zufällig unter allen Zügen, die höchstens so viele Punkte schlechter sind als der beste.
* **Unaufmerksam:** Ein solcher Zug wird wie auf Einsteiger gewählt, also nur mit Blick auf den eigenen Zug. Das bildet einen Menschen nach, der mal genau hinschaut und mal nicht. Einen absichtlich verschenkten Stein gibt es nicht, Fehler entstehen nur durch Übersehen.

**Abstimmung.** Gemessen mit vielen Partien der Stufen gegeneinander:

| Partie | Ergebnis |
|---|---|
| Einsteiger gegen zufällige Züge | etwa ausgeglichen (21:19) |
| Leicht gegen Einsteiger | 34:6 |
| Mittel gegen Leicht | 35:5 |
| Schwer gegen Mittel | 12:0 |

Die Tests prüfen bei jedem Push, dass Leicht klar gegen Einsteiger und Mittel klar gegen Leicht gewinnt.

`chooseMove(brett, seite, stufe, { random, now })` liefert den Zug. Zufall und Uhr lassen sich für Tests ersetzen. Der Web Worker nimmt `{ id, board, side, level }` entgegen und antwortet mit `{ id, move }`, die Oberfläche bleibt dabei flüssig. Tipps nutzen denselben Worker mit der Stufe Schwer.

### `view.js`: Klasse `QueenView`

**Brettraum.** Gezeichnet wird in festen Einheiten, Blau immer unten. Es gibt zwei Formen der Platte: hoch (1000 × 1280, Schalen oben und unten) und breit (1280 × 1040, Schalen links und rechts). Das Brett liegt in beiden an derselben Stelle, nur Platte und Schalen wechseln. `orient()` wählt die Form, in der das Brett auf der Bühne größer erscheint, und setzt den Ausschnitt (`viewBox`). Beim Wechsel behält jeder Stein seinen Platz entlang der Schale. Beim Spiel zu zweit dreht `orient()` die Welt um 180°, eine innere Gruppe jedes Steins dreht zurück, damit Licht und Krone aufrecht bleiben.

**Steine.** Es gibt immer 24 SVG-Steine, einer je Nummer. Jeder steht entweder auf dem Brett oder in einer Schale. Die Krone liegt als Gravur auf jedem Stein bereit und wird bei der Krönung eingeblendet.

| Methode | Aufgabe |
|---|---|
| `setGame(game)` | Stellung ohne Animation setzen (App-Start) |
| `sync(game)` | Jeden Stein animiert an seinen Platz bringen: nach Neu, Zurück, Moduswechsel |
| `play(record)` | Zug des Computers animieren: Stein hebt sich an, zieht langsam Sprung für Sprung, übersprungene Steine verblassen, dann Schale und Krönung |
| `playNow(record, vonPos, { slow })` | Derselbe Ablauf direkt, für eigene Züge schnell, mit `slow` langsam |
| `markLast(zug)` | Start- und Zielfeld des letzten Zugs dezent aufhellen (`url(#q-last)`), `null` entfernt die Markierung |
| `toTray(id)` | Stein in die Schale der schlagenden Seite rollen |
| `select(feld)`, `showHint(zug)` | Auswahl, Zielringe, Tippring |
| `setFlip(an)` | Brett für das Spiel zu zweit drehen |
| `setTheme(name)` | Brettstil wechseln: tauscht nur die Definitionen der Verläufe und Muster aus |
| `setGravity(x, y)` | Neigung in den Brettraum zurückdrehen und an beide Schalen geben |

**Schalen.** Jede Schale ist ein `Gutter` der Hülle mit einem Bogenstück (`arc`) auf einem sehr großen virtuellen Kreis (Radius 10 000). Auf diesem Kreis ist das Bogenstück praktisch gerade, die bewährte Physik von SPRING (Reibung, Stöße, Neigung) gilt unverändert. `arc` setzt Wände an beide Enden, `speedScale` rechnet die Geschwindigkeiten auf den großen Radius um.

**Eingabe** über Pointer Events:

| Berührung | Verhalten |
|---|---|
| In einer Schale | Geht an die Physik: Tippen gibt einen Schubs, Wischen schiebt |
| Auf einem Zielring | Zug des ausgewählten Steins |
| Auf einem Stein mit Zügen | Auswahl, ab 10 px Bewegung Ziehen |
| Auf einem Stein ohne Züge | Wackeln und Klopfen |
| Während der Computer am Zug ist | Brett gesperrt, Schalen bleiben bedienbar |

**Warteschlange:** `play` und `sync` laufen über `run()` nacheinander. `busy` wird in einem `finally` immer zurückgesetzt, Fehler in Ereignissen werden abgefangen.

**Ereignisse an `main.js`:** `canMove`, `move`, `lift`, `invalid`, `land`, `hop`, `crown`, `rim`, `clack`, `done`.

### `themes.js`: Brettstile und Krone

Alle Teile des Bretts verweisen auf Verläufe und Muster mit festen Namen, zum Beispiel `url(#q-plate)`, `url(#q-light)`, `url(#q-p1)` für die Steine der unteren Seite oder `url(#q-p1-engrave)` für deren Gravur. Ein Brettstil in `THEMES` ist nur eine Liste solcher Definitionen. Was ein Stil nicht braucht (Maserung, Rautengitter, Koordinaten im Stil Mitternacht), bekommt eine leere oder durchsichtige Definition. Dadurch braucht `view.js` keine Fallunterscheidung, und ein Wechsel ist augenblicklich.

| Export | Inhalt |
|---|---|
| `THEMES` | `classic` und `midnight`, je mit `defs` und den Farbnamen der Seiten (`sides`) |
| `THEME_IDS`, `DEFAULT_THEME` | Reihenfolge in der Auswahl, Standard `classic` |
| `CROWN` | Linien, Flächen, Punkte und Hermelinschwänze der Krone für einen Stein mit Radius 44 |

Maserung und Rautengitter entstehen als SVG-Muster aus Code, ohne Bilddateien.

### `main.js`: Ablauf

| Funktion | Aufgabe |
|---|---|
| `humanMove(zug)` | Zug ausführen, speichern, animieren, dann `afterMove()` |
| `afterMove()` | Anzeige, Spielende prüfen, beim Spiel zu zweit Brett drehen, sonst `computerMove()` |
| `computerMove()` | Worker fragen, mindestens 700 ms Pause, Zug ausführen und langsam zeigen. Eine Anfragenummer verwirft veraltete Antworten nach Zurück, Neu oder Moduswechsel |
| `hint()` | Besten Zug für die Seite am Zug zeigen |
| `checkEnd()` | Ergebniskarte, Statistik, Sterne, Klang |
| `newGame()` | Neues Spiel. Das alte bleibt für ein sofortiges Zurück erhalten |
| `undo()` | Gegen den Computer bis zum letzten eigenen Zug zurück, rechnender Computer wird abgebrochen |
| `switchMode(id)` | Modus wechseln, immer mit neuem Spiel |
| `resign()` | Rückfrage über `shell.confirm()`, dann `game.resign(seite)` und Ergebniskarte. Zurück nimmt das Aufgeben und den Eintrag in der Statistik zurück |
| `setTheme(id)` | Brettstil wechseln und speichern, Brett blendet weich über |
| `sideName(seite)` | Farbname einer Seite im aktuellen Stil für Kopfzeile und Ergebniskarte |

### Speicherung

Alle Werte liegen über `createStorage('queen:')` im `localStorage` mit dem Präfix `queen:`. Jeder Zugriff ist abgesichert, das Spiel läuft auch ohne Speicher.

| Schlüssel | Inhalt |
|---|---|
| `queen:mode` | Zuletzt gewählter Modus |
| `queen:game` | `{ mode, state }`, der laufende Spielstand, wird beim Start fortgesetzt |
| `queen:stats` | Je Modus: `games`, `wins`, `losses`, `draws` |
| `queen:theme` | Brettstil: `classic` oder `midnight` |
| `queen:flip`, `queen:tilt` | Brett drehen, Neigen |
| `queen:sound`, `queen:soundStyle` | Ton an oder aus, Klangfarbe |
| `queen:coachSeen` | Erststart-Hinweis bereits gezeigt |

## Ablauf eines Zugs

```
Finger tippt Ziel
   │
   ▼
QueenView ── findMove() ── gültig? ── nein ──► Auswahl aufheben
   │ ja
   ▼
main.js humanMove()
   ├─ Game.apply()                    Zustand ändert sich sofort, Speichern
   └─ QueenView.play(record)
        ├─ Sprung für Sprung entlang path      land oder hop je Sprung
        ├─ geschlagene Steine → Schale         rim, danach clack bei Stößen
        └─ Krönung                             crown
   ▼
afterMove()
   ├─ Spielende? → checkEnd()
   ├─ Zu zweit → Brett drehen
   └─ Computer → computerMove() → Worker → Game.apply() → play()
```

## Offline-Betrieb

Wie bei allen Spielen der Sammlung: versionierte Adressen (`?v=` für QUEEN, `?shell=` für die Hülle), Netz zuerst am Browser-Cache vorbei, einmaliges Neuladen bei einer neuen Version. `queen/sw.js` kennt jedes Modul von QUEEN und der Hülle, `tests/release.test.js` prüft das. Details: [Deployment](deployment.md).
