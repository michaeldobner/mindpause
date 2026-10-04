# Entwicklung

[English version](../en/development.md) · [Übersicht](README.md)

QUEEN wird wie alle Spiele von MIND PAUSE aus dem **Hauptordner des Repositorys** entwickelt. Allgemeines zu Voraussetzungen, lokalem Server, Tests, Browser-Test und Veröffentlichung steht in der [README der Sammlung](../../../README.de.md). Hier steht nur, was QUEEN betrifft.

## Lokal starten

```bash
npm start
```

Danach QUEEN unter `http://localhost:3000/queen/` öffnen. Die Sprache folgt der Browsersprache: in Chrome unter Einstellungen > Sprachen, in Safari über die Systemsprache.

## Tests von QUEEN

`npm test` im Hauptordner führt alle Tests der Sammlung aus. Diese betreffen QUEEN:

| Datei | Prüft |
|---|---|
| `queen/tests/rules.test.js` | Startstellung, Ziehen nur vorwärts, Schlagen auch rückwärts, Schlagpflicht, vollständiger Mehrfachschlag, kein doppeltes Überspringen, fliegende Dame mit freier Landung, Krönung, kein Krönen bei weiterem Schlag, Spielende ohne Züge |
| `queen/tests/game.test.js` | Zug und Zurück stellen alles wieder her, Steinnummern, Remis durch Stillstand und Wiederholung, Speichern und Fortsetzen, längster Schlagweg beim Antippen, Computer nimmt gewinnbringenden Schlag, symmetrische Bewertung, **Mittel gewinnt deutlich gegen Leicht** |
| `shared/tests/gutter.test.js` | Unter anderem die Schalen: Wände, Ruhe, 12 Steine passen hinein, Neigen schiebt zur Wand |
| `shared/tests/tilt.test.js` | Schwerkraft aus Gerätewinkeln, Schalter für Neigen |
| `shared/tests/i18n.test.js` | Unter anderem: Texte von QUEEN haben in beiden Sprachen dieselben Schlüssel und keine Gedankenstriche |
| `tests/release.test.js` | Unter anderem: Jeder Verweis von QUEEN trägt die richtige Version, der Service Worker kennt jedes Modul, der Ordner ist vollständig |

Der Browser-Test `npm run e2e` öffnet QUEEN auf iPhone, iPhone quer, iPhone SE und iPad quer, auf Deutsch und Englisch, prüft, dass nichts überläuft, und spielt einen Zug samt Zurück. Dafür stellt `main.js` das Objekt `window.__game` bereit (`history`, `e2e.move()`, außerdem `view`, `game`, `mode`, `switchMode`, `refresh`).

### Zusätzlich von Hand prüfen

1. Alle vier Modi, Tipp, Zurück während der Computer rechnet, Neu und sofort Zurück.
2. Mehrfachschlag, Krönung, fliegende Dame.
3. Zu zweit mit und ohne „Brett drehen“.
4. Hoch- und Querformat, Schalen antippen und wischen, Neigen.
5. Hell- und Dunkelmodus.

## Auf iPhone oder iPad testen

1. `npm start` auf dem Rechner ausführen.
2. Auf dem iPhone in Safari `http://<IP-des-Rechners>:3000/queen/` öffnen.

Ohne HTTPS funktionieren Service Worker und Bewegungssensor nicht. Für diese beiden Punkte über die veröffentlichte Adresse testen.

**Fehlersuche mit dem Mac:** iPhone: Einstellungen > Apps > Safari > Erweitert > Web-Inspektor einschalten, per Kabel verbinden, am Mac in Safari: Menü Entwickler > Name des iPhones > Seite auswählen.

## Spielstärke prüfen

Neue Bewertungen oder Stufen lassen sich in Node.js gegeneinander spielen:

```js
import { Game } from './queen/js/game.js';
import { chooseMove } from './queen/js/ai.js';

const g = new Game();
while (!g.isOver) {
  const level = g.turn === 1 ? 'medium' : 'easy';
  g.apply(g.match(chooseMove(g.board, g.turn, level)));
}
console.log(g.result);
```

## Konventionen für QUEEN

| Thema | Regel |
|---|---|
| Texte | Texte von QUEEN in `queen/js/strings.js`, allgemeine Texte in der Hülle. Immer in beiden Sprachen |
| Oberfläche | Nichts an Kopfzeile, Steuerleiste, Blättern oder Ergebniskarte in QUEEN selbst ändern, sondern in der Hülle, damit alle Spiele profitieren |
| Farben und Schriften | Aus `shared/tokens.css`. In `queen/css/queen.css` nur Werte, die es ausschließlich bei QUEEN gibt |
| Trennung | `rules.js`, `game.js` und `ai.js` greifen nie auf `document` zu |
| Regeln | Jede Regeländerung zuerst als Test in `queen/tests/rules.test.js` |
| Verweise | Eigene Dateien immer mit `?v=<Version von QUEEN>`, Dateien der Hülle mit `?shell=<Version der Hülle>` |
| Schreibstil | Kommentare auf Deutsch, keine Gedankenstriche in Texten und Dokumentation |
| Dokumentation | Jede Änderung in `docs/de` und `docs/en` sowie in beiden Changelogs nachziehen |

## Neue Version von QUEEN

1. `npm test` und `npm run e2e` ohne Fehler.
2. `node scripts/release.mjs queen <version>` setzt die Version in allen Dateien von QUEEN.
3. Neue JavaScript-Dateien in die Liste in `queen/sw.js` eintragen (der Test meldet es sonst).
4. `CHANGELOG.md` und `CHANGELOG.de.md` von QUEEN ergänzen.
5. Dokumentation in beiden Sprachen aktualisieren, bei sichtbaren Änderungen auch die Bilder in `docs/images`.
6. Pull Request. Nach grünen Tests zusammenführen, ein bis zwei Minuten später ist die Version live.
