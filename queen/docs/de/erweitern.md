# Erweitern

[English version](../en/extending.md) · [Übersicht](README.md)

## Neue Computerstufe

1. Eintrag in `LEVELS` in `queen/js/ai.js`:

```js
expert: { depth: 20, quiet: 10, time: 2000, noise: 0 },
```

| Wert | Bedeutung |
|---|---|
| `depth` | Höchste Suchtiefe in Halbzügen |
| `time` | Zeitbudget in Millisekunden |
| `quiet` | Wie viele Halbzüge ein laufender Schlagabtausch am Ende der Suche weitergerechnet wird |
| `noise` | Spielraum in Punkten: Gewählt wird zufällig unter Zügen, die höchstens so viel schlechter sind als der beste |
| `careless` | Optional: Anteil unaufmerksamer Züge, die wie auf Einsteiger nur den eigenen Zug ansehen |

2. Modus in `MODES` in `queen/js/main.js` ergänzen, mit `computer: true` und einer Schwierigkeit von 1 bis 5.
3. Namen unter `mode` und `modeLabel` in `queen/js/strings.js` in beiden Sprachen.
4. Mit dem Beispiel aus [Entwicklung](entwicklung.md#spielstärke-prüfen) prüfen, dass die neue Stufe die nächstschwächere deutlich schlägt, aber nicht immer. Bewährt haben sich 80 bis 90 % Siege.

## Bewertung verbessern

`evaluate()` in `queen/js/ai.js` ist bewusst einfach. Bewährte Ergänzungen aus der Damesoftware:

* **Beweglichkeit:** Zahl der eigenen Züge minus Zahl der gegnerischen. Im Endspiel mit klarem Vorsprung wird das schon genutzt.
* **Gedeckte Steine:** Steine mit einem eigenen Stein dahinter können nicht geschlagen werden.
* **Fluchtweg zur Krone:** Ein Stein mit freiem Weg zur Grundreihe ist fast eine Dame.
* **Endspielwissen:** Drei Damen gegen eine gewinnen, eine Dame gegen eine ist Remis.

Jede Änderung muss symmetrisch bleiben, der Test „Bewertung ist symmetrisch“ prüft das.

## Andere Regelvarianten

Alle Regeln stecken in `queen/js/rules.js`. Typische Varianten:

| Variante | Änderung |
|---|---|
| Internationale Dame | Brett 10×10, Mehrheitsschlag (der längste Schlag ist Pflicht). Brettgröße ist heute fest auf 8×8 ausgelegt, betrifft auch `view.js` |
| Englische Dame (Checkers) | Steine schlagen nur vorwärts, Damen ziehen nur ein Feld |
| Russische Dame | Ein Stein wird mitten im Schlag zur Dame und schlägt als Dame weiter |
| Mehrheitsschlag | In `legalMoves()` nur die Schläge mit den meisten geschlagenen Steinen behalten |

Für jede Variante zuerst Tests in `queen/tests/rules.test.js` schreiben. Eine Variante als Einstellung braucht einen Regel-Parameter für `legalMoves()` und eigene Statistiken.

## Neuer Brettstil

1. In `THEMES` in `queen/js/themes.js` einen Eintrag ergänzen, am einfachsten als Kopie von `classic`. Alle Namen der Definitionen müssen vorhanden sein (`q-plate`, `q-grain`, `q-tray`, `q-lattice`, `q-tray-edge`, `q-frame`, `q-frame-line`, `q-light`, `q-dark`, `q-sq-grain`, `q-coord` und für beide Seiten `p1`, `p2` jeweils Körper, `-ring`, `-ring2`, `-edge`, `-shine`, `-engrave`). Was nicht gebraucht wird, bekommt `empty()` oder eine durchsichtige Farbe.
2. `sides` festlegen, zum Beispiel `{ p1: 'white', p2: 'black' }`, und neue Farbnamen unter `side` in `queen/js/strings.js` ergänzen.
3. Die ID in `THEME_IDS` aufnehmen und den Namen unter `themes` in beiden Sprachen eintragen. Die Auswahl in den Einstellungen erweitert sich von selbst.
4. Farben für die Vorschau der Modi in `queen/css/queen.css` mit `body[data-theme="…"]` ergänzen.
5. Prüfen, dass die Gravur der Krone auf beiden Steinfarben lesbar ist und schwarze Steine auf den dunklen Feldern gut zu sehen sind.

## Neue Sprache

1. In `shared/js/i18n.js` (Texte der Hülle) und in `queen/js/strings.js` (Texte von QUEEN) je einen Block mit denselben Schlüsseln wie `de` und `en` anlegen.
2. `detectLanguage()` in `shared/js/i18n.js` erweitern.
3. `npm test` prüft, dass alle Sprachen dieselben Schlüssel haben.

## Neue Klangfarbe

Klangfarben gehören der Hülle und gelten für alle Spiele:

1. Eintrag in `SOUND_STYLES` in `shared/js/sound-engine.js` (Anteile für Holz, Keramik, Raum und Tiefpass).
2. Knopf mit `data-style` in der Segmentauswahl in `shared/js/shell.js`.
3. Übersetzung unter `styles` in `shared/js/i18n.js`.

## Spiel gegeneinander auf zwei Geräten

Spielen zwei Personen auf eigenen Geräten, ist geplant in zwei Stufen:

| Stufe | Ablauf | Technik |
|---|---|---|
| 1. Zug per Link | Wer zieht, teilt einen Link, zum Beispiel per Nachricht. Der Link enthält die ganze Stellung. Die andere Person öffnet ihn, zieht und schickt einen neuen Link zurück | Kein Server nötig. `Game.serialize()` liefert die Stellung, sie wird kompakt in den Teil der Adresse nach `#` geschrieben. Funktioniert mit GitHub Pages |
| 2. Live mit Raumcode | Beide geben denselben kurzen Code ein und sehen jeden Zug sofort | Braucht einen kleinen Dienst für Nachrichten in Echtzeit, zum Beispiel WebSocket oder WebRTC mit Vermittlung |

Die Spiellogik ist darauf vorbereitet: Ein Zug lässt sich mit `{ from, path }` vollständig beschreiben und mit `game.match()` auf der anderen Seite prüfen, genau wie heute die Züge des Computers.

## Roadmap

| Version | Inhalt | Status |
|---|---|---|
| 1.0 | Deutsche Dame, drei Computerstufen, Zu zweit, Krone, Schalen, Tipps, Sterne, zweisprachig | Fertig |
| 1.1 | Brettstile Klassik und Mitternacht, gravierte Königinnenkrone | Fertig |
| 1.2 | Vier Stufen mit Einsteiger, Aufgeben, ruhige Computerzüge, Markierung des letzten Zugs | Fertig |
| 1.3 | Zug per Link für das Spiel auf zwei Geräten | Geplant |
| 1.x | Bessere Bewertung, Stufe Meister, Partie nachspielen | Geplant |
| 2.0 | Live mit Raumcode | Idee |
