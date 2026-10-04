# MIND PAUSE · Hülle

[English](README.md) · [Sammlung](../README.de.md) · [Changelog](CHANGELOG.de.md)

Die Hülle ist alles, was alle Spiele von MIND PAUSE teilen. Ein Spiel beschreibt nur, was es einzigartig macht: Regeln, Brett, Level und eigene Klänge. Oberfläche, Design, Klang-Engine, Sprachen, Speichern und Offline-Betrieb kommen von hier.

**Faustregel:** Soll eine Änderung in allen Spielen wirken, gehört sie hierher. Betrifft sie nur ein Spiel, gehört sie in dessen Ordner.

Aktuelle Version: **1.0.0**

## Inhalt

| Datei | Aufgabe |
|---|---|
| `tokens.css` | Design-Tokens: Schriften, Farben, Abstände, Schatten, Bewegung, Hell- und Dunkelmodus |
| `shell.css` | Layout und Bausteine, nutzt nur Werte aus `tokens.css` |
| `js/shell.js` | `createShell()`: baut die Oberfläche und gibt die Funktionen zur Steuerung zurück |
| `js/i18n.js` | `createI18n()`: Spracherkennung und Texte der Hülle, von jedem Spiel ergänzt |
| `js/storage.js` | `createStorage(präfix)`: Speichern auf dem Gerät, ein Präfix pro Spiel |
| `js/sound-engine.js` | `SoundEngine`: Keramik auf Holz, Mastering, Klangfarben, Ton-Freigabe auf iOS |
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
| Steuerleiste | Bis zu fünf runde Schaltflächen mit Beschriftung, vom Spiel gewählt: `undo`, `hint`, `restart`, `levels`, `settings` |
| Auswahl | iPhone hoch: Blatt von unten mit Karten zum Wischen. iPhone quer: Schublade von links. iPad quer: feste Seitenleiste |
| Levelkarte | Vorschau, Name, Zusatzzeile, bis zu drei Sterne, fünf Schwierigkeitspunkte, aktuelle Karte blau umrandet |
| Einstellungen | Ton an oder aus, Klangfarbe (Warm, Klar, Weich), vom Spiel definierte Schalter, ein Hinweis, Versionszeile |
| Ergebniskarte | Titel, Sterne, Text, Statistik, „Nochmal“, optional „Nächste …“, „Letzten Zug zurücknehmen“ |
| Hinweisleiste | Kurze Meldung unten im Brett |
| Erststart-Hinweis | Sprechblase unter dem Levelnamen, nur einmal pro Spiel |

Blätter schließen per Wischen nach unten, Tipp daneben, Kreuz oder Escape. Tippflächen sind nie kleiner als 44 pt. Alle Layouts berücksichtigen Notch, Dynamic Island und Home-Indikator.

## Ein Spiel anbinden

Ein Spiel ruft in seiner `main.js` `createShell()` auf:

```js
import { createShell } from '../../shared/js/shell.js?shell=1.0.0';
import { createI18n } from '../../shared/js/i18n.js?shell=1.0.0';
import { createStorage } from '../../shared/js/storage.js?shell=1.0.0';

const storage = createStorage('dame:');
const i18n = createI18n(DAME_STRINGS);          // Texte des Spiels, de und en
const sound = new DameSound({ enabled: storage.load('sound', true) });

const shell = createShell({
  title: 'DAME',
  version: '1.0.0',
  i18n,
  storage,
  sound,
  buttons: ['undo', 'hint', 'restart', 'levels', 'settings'],
  levels: { buttonKey: 'modes', titleKey: 'chooseMode', nextKey: 'nextLevel' },
  settings: [{ id: 'flip', nameKey: 'flip', textKey: 'flipText' }],
  noteKey: 'tip',
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
| `buttons` | Welche Schaltflächen die Steuerleiste zeigt, in dieser Reihenfolge |
| `levels` | Optionale Auswahl: Schlüssel für Beschriftung, Titel und die Schaltfläche „Nächste“ |
| `settings` | Zusätzliche Schalter in den Einstellungen: `id` und Schlüssel für Name und Beschreibung |
| `noteKey`, `coachKey`, `boardLabelKey` | Optionale Texte: Hinweis in den Einstellungen, Erststart-Hinweis, Beschriftung des Bretts |
| `actions` | Funktionen, die die Hülle aufruft: `undo`, `hint`, `restart`, `again`, `back`, `next`, `selectLevel(id)`, `setting(id, an)` |
| `onGesture` | Wird bei jeder Berührung aufgerufen, die iOS als Nutzergeste akzeptiert (für Erlaubnisse wie den Bewegungssensor) |

### Was die Hülle zurückgibt

| Funktion | Aufgabe |
|---|---|
| `board` | Das SVG-Element des Bretts auf der Bühne |
| `setCounter(wert, beschriftung)` | Zähler rechts in der Kopfzeile |
| `setLevelLabel(text)` | Name des aktuellen Levels, setzt auch den Browser-Tab |
| `renderLevels(items)` | Füllt die Auswahl. `items`: `{ id, name, meta, stars, difficulty, preview, current }` |
| `setDisabled(name, bool)`, `setBusy(name, bool)` | Zustand einer Schaltfläche, zum Beispiel während der Tipp rechnet |
| `showResult(opts)`, `hideResult()` | Ergebniskarte. `opts`: `{ title, text, stars, stats, highlight, showNext }` |
| `toast(text)`, `hideToast()` | Kurze Meldung |
| `showCoach()` | Erststart-Hinweis, erscheint nur einmal |
| `setSetting(id, an)` | Zeigt den Zustand eines Spielschalters |
| `openPanel(name)`, `closePanels()`, `isSidebar()` | Steuerung der Blätter |

### Texte

`createI18n(spieltexte)` verbindet die Texte der Hülle mit denen des Spiels. Beide Sprachen brauchen dieselben Schlüssel, der Test `shared/tests/i18n.test.js` prüft das für jedes Spiel. Mehrzahl: `{ one: 'Murmel', other: 'Murmeln' }`, genutzt mit `t('marbles', { n })`.

Texte der Hülle: Zurück, Tipp, Neu, Mehr, Schließen, Schwierigkeit, Spiel beendet, Nochmal, Letzten Zug zurücknehmen, die Meldung nach Neu, Denke nach, Einstellungen, Ton, Klangfarbe mit den drei Farben, Version und der Name der Sammlung.

### Klänge

`SoundEngine` bietet:

| Methode | Aufgabe |
|---|---|
| `unlock()` | Gibt Ton auf iOS frei, die Hülle ruft das bei jeder Berührung auf |
| `tap(progress, { soft })` | Ein Stein wird gesetzt: vier Schichten, Tonhöhe steigt mit `progress` von 0 bis 1 |
| `invalid()` | Zwei gedämpfte Holzklopfer |
| `win(perfect)` | Aufsteigender Dreiklang, bei `perfect` mit Glockenton |
| `preview()` | Kurze Vorschau bei der Wahl der Klangfarbe |
| `transient`, `wood`, `ceramic` | Bausteine für eigene Klänge eines Spiels |

Ein Spiel erweitert die Klasse um eigene Klänge, SPRING zum Beispiel um `land`, `gutter` und `clack`. Klangdesign im Detail: [Klangdesign von SPRING](../spring/docs/de/klang.md).

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
