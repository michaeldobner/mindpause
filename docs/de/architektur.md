# Architektur

[English version](../en/architecture.md) · [Übersicht](README.md)

## Überblick

SPRING ist eine statische Web-App ohne Server-Logik und ohne Build-Schritt. Der Browser lädt `index.html`, das Stylesheet und die JavaScript-Module direkt.

```
index.html
 ├─ css/style.css              Layout, Farben, Hell- und Dunkelmodus, alle Gerätelayouts
 └─ js/main.js                 Einstieg: Zustand, Oberfläche, Ereignisse
     ├─ js/figures.js          Die 7 Figuren als Daten
     ├─ js/game.js             Spiellogik (ohne Darstellung)
     ├─ js/view.js             SVG-Brett, Animationen, Eingabe
     │   └─ js/gutter.js       Physik der Murmeln im Rand
     ├─ js/sound.js            Klang-Engine (Web Audio)
     ├─ js/tilt.js             Bewegungssensor
     ├─ js/i18n.js             Texte auf Deutsch und Englisch
     ├─ js/storage.js          Speicherung, Übernahme aus Version 1
     └─ js/solver-worker.js    Web Worker für Tipps
         └─ js/solver.js       Löser (ohne Darstellung)

sw.js                          Service Worker für den Offline-Betrieb
manifest.webmanifest           Angaben für die Installation als App
```

Grundprinzip: **Daten → Logik → Darstellung**. `figures.js`, `game.js`, `gutter.js`, `solver.js` und `i18n.js` greifen nicht auf das Dokument zu. Sie laufen deshalb auch in Node.js und sind dort vollständig getestet.

## Module

### `figures.js`: Figuren als Daten

```js
{
  id: 'kreuz',
  name: { de: 'Kreuz', en: 'Cross' },
  difficulty: 1,
  layout: [
    '  ...  ',
    '  .o.  ',
    '..ooo..',
    '...o...',
    '...o...',
    '  ...  ',
    '  ...  ',
  ],
}
```

| Zeichen | Bedeutung |
|---|---|
| `o` | Feld mit Murmel |
| `.` | Freies Feld |
| Leerzeichen | Kein Feld |

Ziel ist bei allen Figuren eine Murmel in der Mitte (`GOAL = [3, 3]`). Hilfsfunktionen: `figureById(id)`, `nextFigure(id)`.

### `game.js`: Klasse `Game`

| Eigenschaft oder Methode | Aufgabe |
|---|---|
| `cells` | Alle Felder mit Zeile `r`, Spalte `c` und Startbelegung `start` |
| `marbles` | Für jedes Feld die ID der Murmel darauf oder `null` |
| `history` | Alle ausgeführten Züge, Grundlage für Zurück |
| `cellAt(r, c)` | Feldindex zu einer Position, `-1` außerhalb |
| `movesFrom(i)`, `allMoves()`, `findMove(from, to)` | Gültige Sprünge |
| `apply(move)`, `undo()` | Sprung ausführen und zurücknehmen |
| `count`, `isOver`, `isPerfect` | Zustand |
| `rating()` | `{ key, stars, left }`, der Text kommt aus `i18n.js` |
| `occupancy()` | Belegung als Liste aus `true` und `false` für den Löser |
| `serialize()`, `restore(data)` | Spielstand speichern und laden |

Ein **Zug** ist `{ from, over, to }` mit drei Feldindizes. In `history` kommen die IDs der springenden (`marble`) und der geschlagenen Murmel (`captured`) hinzu.

### `view.js`: Klasse `BoardView`

**Der Murmel-Pool.** Es gibt immer genau 32 SVG-Murmeln, 16 blaue und 16 schwarze. Beim Setzen einer Figur ordnet `mapFigure()` jeder Murmel der Figur eine Pool-Murmel passender Farbe zu: Felder mit gerader Summe aus Zeile und Spalte sind blau, die anderen schwarz. Alle übrigen Pool-Murmeln liegen im Rand.

| Methode | Aufgabe |
|---|---|
| `setGame(game)` | Figur ohne Animation setzen (App-Start) |
| `morph(game)` | Figur mit Animation wechseln oder neu beginnen |
| `play(move, fromPos)` | Sprung animieren, geschlagene Murmel in den Rand rollen |
| `undo()` | Letzten Zug animiert zurücknehmen |
| `select(i)`, `showHint(from, to)` | Auswahl, Zielringe, Tippring |
| `setGravity(x, y)` | Neigung an die Physik weitergeben |

**Ebenen im SVG** von unten nach oben: Schatten und Brett, Linien, Mulden, Zielringe, Murmeln.

**Eingabe** über Pointer Events (Finger, Stift und Maus gleich):

| Berührung | Verhalten |
|---|---|
| Im Rand (Abstand zur Mitte über 398) | Geht an die Physik: Tippen gibt einen Schubs, Wischen schiebt. Das Spiel bleibt unberührt |
| Auf einem Zielfeld | Sprung der ausgewählten Murmel |
| Auf einer Murmel mit Zügen | Auswahl, ab 10 px Bewegung Ziehen |
| Auf einer Murmel ohne Züge | Wackeln und Klopfen |
| Loslassen nahe einem Ziel | Sprung, sonst rollt die Murmel zurück |

**Warteschlange:** `play`, `undo` und `morph` laufen über `run()` nacheinander, nie gleichzeitig. Ein Tipp auf Zurück während einer Animation wartet, bis sie fertig ist, statt verloren zu gehen. `busy` wird in einem `finally` immer zurückgesetzt, und Fehler in Ereignissen werden abgefangen, damit das Brett nie hängen bleibt. Neue Züge auf dem Brett sind während einer Animation gesperrt, der Rand bleibt bedienbar. Meldet iOS das Loslassen eines Fingers nicht, räumt die nächste Berührung den alten Zustand auf.

**Ereignisse an `main.js`:** `move(record, phase)` mit den Phasen `jump`, `land`, `gutter`, außerdem `invalid`, `lift`, und `clack(intensität)`.

### Physik im Rand

`gutter.js` beschreibt jede Murmel im Rand nur durch ihren **Winkel** auf einem Kreis (Radius 446) und ihre **Winkelgeschwindigkeit**. Dadurch bleibt die Rechnung klein und das Verhalten ruhig und vorhersehbar.

| Größe | Wert | Wirkung |
|---|---|---|
| Reibung | 2,2 pro Sekunde (exponentiell) | Bewegung klingt nach etwa 1,5 s aus |
| Stoßzahl | 0,55 | Teilweise elastische Stöße, Schwung läuft als Welle durch eine Reihe |
| Höchstgeschwindigkeit | 9 rad/s | Kein wildes Kreisen |
| Ruhegrenze | 0,02 rad/s | Darunter steht eine Murmel still |
| Neigung | bis 7 rad/s² | Tangentialer Anteil der Schwerkraft an jeder Stelle des Kreises |

Ablauf eines Zeitschritts (`step`): Neigung als Beschleunigung, Reibung, Bewegung, dann Stoßauflösung. Stöße werden in bis zu vier Durchgängen über sortierte Nachbarn aufgelöst: Überlappung trennen, bei Annäherung Geschwindigkeiten nach der Stoßformel für gleiche Massen tauschen. Pro Bildschirmbild rechnet `view.js` drei Teilschritte. Die Schleife läuft nur, solange sich etwas bewegt, und schläft danach, das spart Akku.

`freeAngle(wunsch)` sucht die nächstgelegene Lücke für eine neue Murmel. Gibt es keine, wird trotzdem eingefügt und die Nachbarn rücken beim Stoß beiseite.

### `solver.js` und `solver-worker.js`: Tipps

Der Löser ist eine **Tiefensuche mit Merkliste** bereits als unlösbar erkannter Stellungen.

1. `prepare(cells)` berechnet einmal alle möglichen Sprünge des Bretts als Feldindizes.
2. `solve(prepared, belegung, ziel, zeitbudget)` sucht einen Weg bis zu einer Murmel auf dem Ziel. Ergebnis: Liste von Zügen, `null` (keine Lösung) oder `'timeout'`.
3. Der Web Worker rechnet im Hintergrund, die Oberfläche bleibt flüssig. Zeitbudget im Spiel: 4 Sekunden.
4. `main.js` merkt sich den gefundenen Weg. Folgt man dem Tipp, kommt der nächste sofort ohne neue Rechnung.

Alle 7 Figuren löst der Löser von der Startstellung aus in deutlich unter einer Sekunde (geprüft in `tests/figures.test.js`).

### `sound.js`: Klang-Engine

Siehe [Klangdesign](klang.md). Die Kette wird in `setup(ctx)` aufgebaut und funktioniert deshalb auch mit einem `OfflineAudioContext` für Messungen.

### `tilt.js`: Bewegungssensor

Liest `deviceorientation` (Winkel `beta` und `gamma`), rechnet daraus die Schwerkraft im Gerät und dreht sie passend zur Bildschirmausrichtung:

```
Gerät:      gx = cos(β) · sin(γ),   gy = −sin(β)
Bildschirm: (gx, −gy), gedreht um −Bildschirmwinkel
```

Die Werte werden geglättet (Faktor 0,18). Unter einer Länge von 0,07 gilt das Gerät als flach. Auf iOS holt `enable()` die Erlaubnis über `DeviceOrientationEvent.requestPermission()`, was nur nach einer Berührung erlaubt ist. `wanted` (Wunsch, angezeigt im Schalter) und `enabled` (Sensor verbunden) sind getrennt. Wird während einer offenen Erlaubnis-Abfrage ausgeschaltet, gewinnt das Ausschalten.

### `i18n.js`: Sprachen

* `detectLanguage()` liefert `de`, wenn die erste bevorzugte Sprache des Geräts mit `de` beginnt, sonst `en`.
* `t('schlüssel', { n })` holt Texte, mit Platzhaltern und Einzahl oder Mehrzahl.
* `translateDocument()` füllt alle Elemente mit `data-i18n` (Text) und `data-i18n-label` (`aria-label`).
* Figurennamen stehen direkt in `figures.js` (`name.de`, `name.en`).

### `storage.js`: Speicherung

Alle Werte liegen im `localStorage` mit dem Präfix `spring:`. Jeder Zugriff ist abgesichert, das Spiel läuft auch ohne Speicher.

| Schlüssel | Inhalt |
|---|---|
| `spring:figure` | Zuletzt gespielte Figur |
| `spring:game:<figur>` | Spielstand der aktuellen Figur (`marbles`, `history`, `counted`), wird beim Start fortgesetzt, außer das Spiel war beendet |
| `spring:stats` | Je Figur: `games`, `solved`, `perfect`, `best`, `stars` |
| `spring:sound`, `spring:soundStyle` | Ton an oder aus, Klangfarbe |
| `spring:tilt` | Neigen an oder aus |
| `spring:coachSeen` | Erststart-Hinweis bereits gezeigt |
| `spring:migrated` | Übernahme aus Version 1 erledigt |

`migrate()` übernimmt einmalig Spielstand, Statistik und Toneinstellung aus Version 1 (Präfix `solohalma:`) für die Figur Klassisch.

## Ablauf eines Zugs

```
Finger tippt Ziel
   │
   ▼
BoardView.down() ── findMove() ── gültig? ── nein ──► Auswahl aufheben
   │ ja
   ▼
BoardView.play()
   ├─ Animation: Murmel springt im Bogen
   ├─ Game.apply()                      Zustand ändert sich sofort
   ├─ move('jump')    main.js           Tipp-Weg fortschreiben, Anzeige, Speichern
   ├─ move('land')    main.js           Landeklang nach Fortschritt
   ├─ toRim()                           geschlagene Murmel rollt zur nächsten Lücke
   └─ move('gutter')  main.js           Klang, Spielende prüfen, Sterne und Statistik
```

## Ablauf eines Figurenwechsels

```
Karte angetippt
   │
   ▼
switchFigure(id)
   ├─ neues Spiel der gewählten Figur beginnen
   ├─ Anzeige und Liste aktualisieren, Figur merken
   └─ BoardView.morph(game)
        ├─ mapFigure(): Pool-Murmeln den Feldern zuordnen
        ├─ Murmeln, die aufs Brett müssen: aus dem Rand lösen, im Bogen ins Feld
        ├─ Murmeln, die nicht gebraucht werden: toRim()
        └─ Physik ruckelt den Rand zurecht
```

## Offline-Betrieb

Drei Regeln sorgen dafür, dass immer genau eine Version vollständig läuft und sich nie alte und neue Dateien mischen:

1. **Versionierte Adressen:** Jeder Verweis auf CSS und JavaScript trägt `?v=<Version>`, in `index.html`, in allen `import`-Zeilen und beim Web Worker. Eine neue Version lädt dadurch ausschließlich neue Adressen, die kein Cache kennen kann. `tests/release.test.js` prüft das bei jedem Push.
2. **Netz zuerst, am Browser-Cache vorbei:** `sw.js` holt jede Datei mit `cache: 'no-cache'` aus dem Netz. Nur ohne Netz kommt sie aus dem Offline-Speicher, der beim Installieren mit `cache: 'reload'` frisch gefüllt wird.
3. **Einmaliges Neuladen:** Übernimmt ein neuer Service Worker die Kontrolle (`controllerchange`), lädt `main.js` die Seite einmal neu.

Details: [Deployment](deployment.md).
