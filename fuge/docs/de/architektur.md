# Architektur

[English version](../en/architecture.md) · [Übersicht](README.md)

## Module

| Datei | Aufgabe | DOM |
|---|---|---|
| `js/pieces.js` | Sieben Formen, Drehungen, Wandsprünge nach SRS, Zufall mit Startwert, 7-Bag | nein |
| `js/modes.js` | Modi, Geschwindigkeit nach Stufe, Punkte, Sterne | nein |
| `js/game.js` | Spiellogik: Schwerkraft, Frist am Boden, Bewegen, Drehen, Halten, Reihen, Ende, Speichern | nein |
| `js/view.js` | Kasten, Steine und Animationen auf zwei Canvas-Ebenen, Karte für Start und Pause | ja |
| `js/input.js` | Tastatur mit verzögerter Wiederholung, Gesten | ja |
| `js/sound.js` | Klänge, Unterklasse der Klang-Engine der Hülle | Web Audio |
| `js/main.js` | Verbindet alles mit der Hülle: Modi, Pause, Statistik, Ergebnis, Bild für Bild | ja |

## Datenmodell

```
board      22 Reihen × 10 Spalten, Reihe 0 oben. Die Reihen 0 und 1 sind unsichtbar.
           Zelle: 0 (leer) oder nummer × 8 + form + 1. Gleiche Codes gehören zum selben Stein,
           daraus zeichnet view.js die Werkstücke mit Nähten und Fugen.
active     { type, rot, x, y, id }: der fallende Stein, x und y sind die linke obere Ecke seines Kastens
queue      die nächsten Formen, immer mindestens 7, aufgefüllt aus 7-Bags
hold       gehaltene Form oder null, holdUsed sperrt das zweite Halten pro Stein
state      ready, playing, over (Kasten voll) oder done (Ziel erreicht)
```

Der Zufall ist ein kleiner Generator mit Startwert (mulberry32). Sein Zustand wird mitgespeichert, damit ein fortgesetztes Spiel genau dieselben Steine bringt.

## Ablauf eines Bildes

`main.js` läuft mit `requestAnimationFrame`:

1. Ist ein Blatt der Hülle offen, pausiert das Spiel.
2. Läuft das Spiel: `input.update(dt)` für die Wiederholung gedrückter Tasten, dann `game.step(dt)` für Schwerkraft, Frist am Boden und den nächsten Stein.
3. `game.drainEvents()` liefert, was passiert ist: `spawn`, `move`, `rotate`, `blocked`, `softDrop`, `hardDrop`, `lock`, `hold`, `levelUp`, `calmClear`, `gameOver`, `finish`.
4. Jedes Ereignis geht an `view.handle()` (Animationen) und an den Klang, `lock` zusätzlich an Schriftzüge und Speichern.
5. Kopfzeile und Steuerleiste werden nur bei Änderungen neu gesetzt.
6. `view.update(dt)` führt Animationen weiter, `view.draw()` zeichnet.

Eingaben wirken sofort auf die Logik. Die Darstellung folgt weich nach, ein schneller Tipp geht nie verloren.

## Darstellung

| Ebene | Inhalt | Neu gezeichnet |
|---|---|---|
| `base` | Kasten, Wanne, Punktraster, liegende Steine, Fächer, Zahlen | nur wenn sich etwas ändert oder eine Animation läuft |
| `fx` | fallender Stein, Geisterstein, Spur, Aufleuchten, Schriftzüge, Abdunkeln für Start und Pause | jedes Bild |

Jede Zelle ist ein Sprite, gezeichnet einmal je Form, Nachbarschaft (8 Nachbarn als Bitmaske) und Zellgröße. Danach kopiert `drawImage` nur noch Bilder. Beim Verschwinden einer Reihe rekonstruiert `view.js` das Brett davor aus dem Brett danach und den entfernten Reihen und zeigt erst das Auflösen, dann das Nachrutschen.

## Eingabe

**Tastatur:** Taste wird gedrückt, der Stein bewegt sich sofort. Nach 170 ms (DAS) wiederholt sich die Bewegung alle 50 ms (ARR). Die zuletzt gedrückte Richtung gewinnt. Tasten wirken nicht, solange die Ergebniskarte oder ein Blatt offen ist. Die Leertaste nimmt Schaltflächen den Fokus, damit sie nicht versehentlich „Neu“ auslöst.

**Gesten:** Erkannt auf der ganzen Bühne.

| Geste | Erkennung |
|---|---|
| Tippen | weniger als 10 Punkte Bewegung, kürzer als 280 ms. Links der Wannenmitte gegen, rechts im Uhrzeigersinn. Auf dem Fach Halten: halten |
| Ziehen waagerecht | ein Feld pro 0,92 Zellbreiten des Fingers (wie eine Ratsche) |
| Ziehen nach unten | eine Reihe pro Schritt, waagerecht dann träger (1,6 Schritte), damit schräge Wische den Stein nicht verschieben |
| Wischen nach unten | Spitzengeschwindigkeit über 0,85 Punkte pro ms in den letzten 150 ms, oder lange Wische über 3 Zellen mit mehr als 0,42 Punkten pro ms im Schnitt |
| Wischen nach oben | Spitzengeschwindigkeit über 0,7 Punkte pro ms nach oben |

## Speichern

Unter dem Präfix `fuge:` im lokalen Speicher:

| Schlüssel | Inhalt |
|---|---|
| `game` | laufendes Spiel (`Game.serialize()`), nach jedem Ablegen, bei Pause und beim Verlassen |
| `mode` | zuletzt gewählter Modus |
| `stats` | je Modus: Zahl der Spiele und Bestwert (Punkte, Reihen, Stufe, Zeit) |
| `ghost`, `patterns` | Einstellungen |
| `sound`, `soundStyle`, `coachSeen` | von der Hülle |

## Hülle

FUGE nutzt die Hülle 1.2.0 mit drei kleinen, abwärtskompatiblen Erweiterungen, die allen Spielen offenstehen: eigene Schaltflächen `{ id, icon, labelKey }`, `setButton()` für Pause und Weiter und `showResult({ showBack: false })`. Das SVG-Brett der Hülle wird ausgeblendet, der Kasten liegt als eigenes Element auf der Bühne.

## Entwicklung und Tests

```bash
npm start                         # http://localhost:3000/fuge/
npm test                          # Logik-Tests, darunter fuge/tests/
npm run e2e                       # Browser-Test aller Spiele
node fuge/tools/playtest.mjs      # Spieltest mit Gesten, Tasten und Schaltflächen
node fuge/tools/screenshots.mjs   # Bilder der Dokumentation
node fuge/tools/icons.mjs         # App-Symbole
```

Die Werkzeuge mit Browser brauchen Playwright: `npm install --no-save playwright && npx playwright install chromium`.

| Test | Prüft |
|---|---|
| `tests/game.test.js` | Formen und Drehungen, 7-Bag, Erscheinen, Wände, Wandsprünge links und rechts, Drehen auf liegenden Steinen, harter und sanfter Fall, Schwerkraft, Frist am Boden, Halten, Reihen, Quart, Folge, Serie, Leer geräumt, T-Dreh, Stufen, Sprint, 3 Minuten, Game Over, Ruhe, Speichern, Sterne |
| `tools/playtest.mjs` | Start per Tipp, Ziehen, Tippen links und rechts, Wischen nach oben und unten, sanftes Ziehen, Tastenwiederholung bis zur Wand, Drehen, Leertaste, Pause hält die Zeit an, Einstellungen pausieren, Halten, Neu, Moduswechsel, Fortsetzen nach Neuladen |
| `scripts/e2e.mjs` | Hülle vollständig, nichts ragt aus dem Bild, ein Zug, keine Fehler, auf iPhone, iPhone SE, iPhone quer und iPad |

Neue Version: `node scripts/release.mjs fuge <version>`.
