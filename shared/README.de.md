# MIND PAUSE · Hülle

[English](README.md) · [Sammlung](../README.de.md) · [Changelog](CHANGELOG.de.md)

Die Hülle ist alles, was alle Spiele von MIND PAUSE teilen. Ein Spiel beschreibt nur, was es einzigartig macht: Regeln, Brett, Level und eigene Klänge. Oberfläche, Design, Klang-Engine, Physik des Rands, Neigen, Sprachen, Speichern und Offline-Betrieb kommen von hier.

**Faustregel:** Soll eine Änderung in allen Spielen wirken, gehört sie hierher. Betrifft sie nur ein Spiel, gehört sie in dessen Ordner.

Aktuelle Version: **1.4.0**

## Inhalt

| Datei | Aufgabe |
|---|---|
| `tokens.css` | Design-Tokens: Schriften, Farben, Abstände, Schatten, Bewegung, Hell- und Dunkelmodus |
| `shell.css` | Layout und Bausteine, nutzt nur Werte aus `tokens.css` |
| `js/shell.js` | `createShell()`: baut die Oberfläche und gibt die Funktionen zur Steuerung zurück |
| `js/i18n.js` | `createI18n()`: Spracherkennung und Texte der Hülle, von jedem Spiel ergänzt |
| `js/storage.js` | `createStorage(präfix)`: Speichern auf dem Gerät, ein Präfix pro Spiel |
| `js/sound-engine.js` | `SoundEngine`: Keramik auf Holz, Mastering, Klangfarben, Ton-Freigabe auf iOS, Klänge des Rands |
| `js/gutter.js` | `Gutter`: Physik für Teile in einem runden Rand (SPRING) oder einer geraden Schale (QUEEN) |
| `js/tilt.js` | `Tilt`: Bewegungssensor mit Erlaubnis-Abfrage auf iOS, liefert die Schwerkraft auf dem Bildschirm |
| `tests/` | Tests der Hülle |

## Design-Tokens

Alle Werte stehen als CSS-Variablen in `tokens.css`. Spiele nutzen für Farben und Schriften nie feste Werte, nur diese Variablen.

| Variable | Hell | Dunkel | Verwendung |
|---|---|---|---|
| `--bg`, `--bg-edge` | `#ece8e1`, `#e2ddd4` | `#141519`, `#0d0e11` | Hintergrund mit Vignette |
| `--ink`, `--ink-soft` | `#1a1d4e`, `#6b6d85` | `#e9e7f2`, `#8f91a6` | Text und Symbole, Nebentexte |
| `--btn`, `--btn-border` | `#f7f4ef`, 12 % Tinte | `#1e2027`, 8 % Weiß | Schaltflächen |
| `--card`, `--sheet` | `#faf8f4`, `#f6f3ee` | `#1e2027`, `#1b1d23` | Karten, Blätter, Seitenleiste |
| `--accent` | `#3f6ef0` | `#3f6ef0` | Aktuelle Auswahl, Schalter, Hervorhebung |
| `--star`, `--hint` | `#e0a526`, `#ffd36b` | gleich | Sterne, Tippring |
| `--shadow` | weich | kräftiger | Schaltflächen und Karten |
| `--font` | San Francisco (Systemschrift) | | Text und Beschriftungen |
| `--font-display` | Didot, Bodoni 72, Ersatz Georgia | | Titel, Zahlen, Überschriften |
| `--ease` | `cubic-bezier(0.32, 0.72, 0, 1)` | | Blätter und Schalter |

**Beispiel: Schrift in allen Spielen ändern.** `--font-display` in `tokens.css` ändern, `node scripts/release.mjs shell <neue Version>` ausführen, die Screenshots des Browser-Tests prüfen, zusammenführen. Alle Spiele zeigen die neue Schrift.

## Bausteine der Oberfläche

| Baustein | Verhalten |
|---|---|
| Kopfzeile | Titel des Spiels, Name des aktuellen Levels mit Pfeil, Zähler rechts |
| Steuerleiste | Bis zu sechs runde Schaltflächen mit Beschriftung, vom Spiel gewählt: `undo`, `hint`, `restart`, `resign`, `levels`, `settings` oder eigene des Spiels (zum Beispiel Halten und Pause bei FUGE). Bei sechs werden sie etwas kleiner, damit sie auch auf das iPhone SE passen |
| Auswahl | iPhone hoch: Blatt von unten mit Karten zum Wischen. iPhone quer: Schublade von links. iPad quer: feste Seitenleiste |
| Levelkarte | Vorschau, Name, Zusatzzeile, bis zu drei Sterne, fünf Schwierigkeitspunkte, aktuelle Karte blau umrandet |
| Einstellungen | Vom Spiel definierte Auswahl (zum Beispiel der Brettstil), Ton an oder aus, Klangfarbe (Warm, Klar, Weich), vom Spiel definierte Schalter, ein Hinweis, Versionszeile |
| Ergebniskarte | Titel, Sterne, Text, Statistik, „Nochmal“, optional „Nächste …“, „Letzten Zug zurücknehmen“ |
| Rückfrage | Karte auf dem Brett mit Titel, Text und zwei Schaltflächen, zum Beispiel vor dem Aufgeben. Escape bricht ab |
| Hinweisleiste | Kurze Meldung unten im Brett |
| Erststart-Hinweis | Sprechblase unter dem Levelnamen, nur einmal pro Spiel |

Blätter schließen per Wischen nach unten, Tipp daneben, Kreuz oder Escape. Tippflächen sind nie kleiner als 44 pt. Alle Layouts berücksichtigen Notch, Dynamic Island und Home-Indikator.

## Ein Spiel anbinden

Ein Spiel ruft in seiner `main.js` `createShell()` auf:

```js
import { createShell } from '../../shared/js/shell.js?shell=1.4.0';
import { createI18n } from '../../shared/js/i18n.js?shell=1.4.0';
import { createStorage } from '../../shared/js/storage.js?shell=1.4.0';

const storage = createStorage('queen:');
const i18n = createI18n(QUEEN_STRINGS);         // Texte des Spiels, de und en
const sound = new QueenSound({ enabled: storage.load('sound', true) });

const shell = createShell({
  title: 'QUEEN',
  version: '1.1.0',
  i18n,
  storage,
  sound,
  buttons: ['undo', 'hint', 'restart', 'levels', 'settings'],
  levels: { buttonKey: 'modes', titleKey: 'chooseMode', nextKey: 'nextLevel' },
  settings: [
    { id: 'theme', nameKey: 'theme', options: [{ value: 'classic', labelKey: 'themes.classic' }, { value: 'midnight', labelKey: 'themes.midnight' }] },
    { id: 'flip', nameKey: 'flip', textKey: 'flipText' },
  ],
  noteKey: 'trayHint',
  coachKey: 'coach',
  boardLabelKey: 'boardLabel',
  actions: { undo, hint, restart, again, back, next, selectLevel, setting },
  onGesture: () => {},
});
```

### Angaben

| Angabe | Bedeutung |
|---|---|
| `title` | Titel in Großbuchstaben, erscheint in Kopfzeile, Browser-Tab und Versionszeile |
| `version` | Version des Spiels |
| `i18n`, `storage`, `sound` | Erzeugt mit `createI18n`, `createStorage` und einer Unterklasse von `SoundEngine` |
| `buttons` | Welche Schaltflächen die Steuerleiste zeigt, in dieser Reihenfolge. Ein Eintrag ist ein Name der Hülle oder eine eigene Schaltfläche `{ id, icon, labelKey }`: `icon` ist SVG-Inhalt im Feld 24 × 24, ein Tipp ruft `actions[id]` auf |
| `levels` | Optionale Auswahl: Schlüssel für Beschriftung, Titel und die Schaltfläche „Nächste“ |
| `settings` | Zusätzliche Einstellungen. Ein Schalter hat `id`, `nameKey` und `textKey`. Eine Auswahl hat `id`, `nameKey` und `options` mit `value` und `labelKey`, sie erscheint als Segmentauswahl oben in den Einstellungen |
| `noteKey`, `coachKey`, `boardLabelKey` | Optionale Texte: Hinweis in den Einstellungen, Erststart-Hinweis, Beschriftung des Bretts |
| `actions` | Funktionen, die die Hülle aufruft: `undo`, `hint`, `restart`, `again`, `back`, `next`, `selectLevel(id)`, `setting(id, wert)`. Bei einem Schalter ist `wert` der neue Zustand, bei einer Auswahl der gewählte `value` |
| `onGesture` | Wird bei jeder Berührung aufgerufen, die iOS als Nutzergeste akzeptiert (für Erlaubnisse wie den Bewegungssensor) |

### Was die Hülle zurückgibt

| Funktion | Aufgabe |
|---|---|
| `board` | Das SVG-Element des Bretts auf der Bühne |
| `setCounter(wert, beschriftung)` | Zähler rechts in der Kopfzeile |
| `setLevelLabel(text)` | Name des aktuellen Levels, setzt auch den Browser-Tab |
| `renderLevels(items)` | Füllt die Auswahl. `items`: `{ id, name, meta, stars, difficulty, preview, current }` |
| `setDisabled(name, bool)`, `setBusy(name, bool)` | Zustand einer Schaltfläche, zum Beispiel während der Tipp rechnet |
| `setButton(id, { icon, labelKey })` | Symbol und Beschriftung einer Schaltfläche wechseln, zum Beispiel Pause und Weiter |
| `showResult(opts)`, `hideResult()` | Ergebniskarte. `opts`: `{ title, text, stars, stats, highlight, showNext, showBack }`. `showBack: false` blendet „Letzten Zug zurücknehmen“ aus, für Spiele ohne Zurück |
| `confirm({ title, text, ok, cancel })` | Rückfrage. Liefert ein Promise mit `true` (ok) oder `false` (abbrechen). `cancel` ist optional, Standard „Abbrechen“ |
| `toast(text)`, `hideToast()` | Kurze Meldung |
| `showCoach()` | Erststart-Hinweis, erscheint nur einmal |
| `setSetting(id, wert)` | Zeigt den Zustand eines Schalters (`true` oder `false`) oder den gewählten Wert einer Auswahl |
| `openPanel(name)`, `closePanels()`, `isSidebar()` | Steuerung der Blätter |

### Texte

`createI18n(spieltexte)` verbindet die Texte der Hülle mit denen des Spiels. Beide Sprachen brauchen dieselben Schlüssel, der Test `shared/tests/i18n.test.js` prüft das für jedes Spiel. Mehrzahl: `{ one: 'Murmel', other: 'Murmeln' }`, genutzt mit `t('marbles', { n })`.

Texte der Hülle: Zurück, Tipp, Neu, Aufgeben, Abbrechen, Mehr, Schließen, Schwierigkeit, Spiel beendet, Nochmal, Letzten Zug zurücknehmen, die Meldung nach Neu, Denke nach, Einstellungen, Ton, Klangfarbe mit den drei Farben, Version und der Name der Sammlung.

### Klänge

`SoundEngine` bietet:

| Methode | Aufgabe |
|---|---|
| `unlock()` | Gibt Ton auf iOS frei, die Hülle ruft das bei jeder Berührung auf |
| `tap(progress, { soft })` | Ein Stein wird gesetzt: vier Schichten, Tonhöhe steigt mit `progress` von 0 bis 1 |
| `invalid()` | Zwei gedämpfte Holzklopfer |
| `win(perfect)` | Aufsteigender Dreiklang, bei `perfect` mit Glockenton |
| `preview()` | Kurze Vorschau bei der Wahl der Klangfarbe |
| `rim()` | Ein Teil rollt in den Rand oder die Schale |
| `clack(stärke)` | Teile stoßen im Rand aneinander, höchstens acht Klicks pro Sekunde |
| `transient`, `wood`, `ceramic` | Bausteine für eigene Klänge eines Spiels |

Ein Spiel erweitert die Klasse um eigene Klänge, SPRING zum Beispiel um `lift`, `land` und `gutter`, QUEEN um `lift`, `place`, `hop`, `crown` und `lose`. Klangdesign im Detail: [Klangdesign von SPRING](../spring/docs/de/klang.md).

### Rand und Schalen

`Gutter` beschreibt jedes Teil nur durch seinen **Winkel** auf einem Kreis und seine Winkelgeschwindigkeit. Reibung, Stöße, Neigung und Fingerbewegungen sind für alle Spiele gleich.

```js
import { Gutter } from '../../shared/js/gutter.js?shell=1.4.0';

// Runder Rand wie bei SPRING
const rim = new Gutter({ radius: 446, marbleRadius: 37, onCollide: (i) => sound.clack(i) });

// Gerade Schale wie bei QUEEN: Bogenstück auf einem sehr großen Kreis
const R = 10000;
const tray = new Gutter({
  radius: R,
  marbleRadius: 34,
  arc: { center: Math.PI / 2, half: 440 / R },  // Mitte und halbe Länge als Winkel
  speedScale: 446 / R,                          // Bewegung fühlt sich an wie bei SPRING
  onCollide: (i) => sound.clack(i),
});
```

| Methode | Aufgabe |
|---|---|
| `add(id, winkel, v)`, `remove(id)`, `has(id)`, `size` | Teile verwalten |
| `freeAngle(wunsch)` | Nächste freie Stelle, in einer Schale nur zwischen den Wänden |
| `pack(ids)` | Teile dicht nebeneinander legen, in einer Schale um die Mitte |
| `angleOf(id)`, `position(winkel)` | Winkel eines Teils, Punkt auf dem Kreis |
| `push(winkel, v)`, `nudge(winkel)` | Wischen und Antippen |
| `gravity`, `rotation` | Neigung in Bildschirmrichtung, Drehung des Bretts auf dem Bildschirm |
| `step(dt)` | Ein Zeitschritt, gibt `true` zurück, solange sich etwas bewegt |

Mit `arc` bekommt der Rand Wände an beiden Enden: Teile prallen ab, es gibt keinen Übergang von einem Ende zum anderen. `speedScale` rechnet Höchstgeschwindigkeit, Ruhegrenze, Neigung und Stoßstärke auf einen anderen Radius um.

### Neigen

```js
import { Tilt } from '../../shared/js/tilt.js?shell=1.4.0';

const tilt = new Tilt((x, y) => view.setGravity(x, y), storage.load('tilt', false));
const result = await tilt.enable();   // 'ok', 'off', 'denied' oder 'unsupported'
tilt.disable();
```

`enable()` muss auf iOS aus einer Berührung heraus aufgerufen werden (`onGesture` oder die Aktion `setting`). `wanted` ist der Wunsch im Schalter, `enabled` der verbundene Sensor. Wird während der Erlaubnis-Abfrage ausgeschaltet, gewinnt das Ausschalten.

### Test-Anschluss

Für den Browser-Test stellt jedes Spiel `window.__game` bereit, mindestens mit:

* `history`: Zahl der bisherigen Züge
* `e2e.move()`: spielt einen gültigen Zug (zum Beispiel den Tipp)

## Offline und Versionen

* Jedes Spiel hat eigene `sw.js` und `manifest.webmanifest` und lässt sich als eigene App installieren.
* Dateien der Hülle werden mit `?shell=<Version der Hülle>` eingebunden, Dateien des Spiels mit `?v=<Version des Spiels>`.
* `node scripts/release.mjs shell <version>` ändert jeden `?shell=` Verweis in allen Spielen und die Konstante `SHELL` in jedem Service Worker. Jedes Spiel lädt die neue Hülle dann genau einmal und mischt nie Versionen.
* Der Service Worker eines Spiels speichert auch die Dateien der Hülle für den Offline-Betrieb.

## Checkliste für Änderungen an der Hülle

1. Änderung in `shared/` gemacht, nie in einem Spiel.
2. `npm test` und `npm run e2e` ohne Fehler.
3. Screenshots des Browser-Tests für jedes Spiel geprüft.
4. `node scripts/release.mjs shell <version>`.
5. `CHANGELOG.md` und `CHANGELOG.de.md` der Hülle ergänzt. Spiele nennen die Änderung in ihrem Changelog, wenn Spielende sie bemerken.
6. Diese README in beiden Sprachen aktualisiert.
