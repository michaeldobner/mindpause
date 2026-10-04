# Entwicklung

[English version](../en/development.md) · [Übersicht](README.md)

SPRING wird wie alle Spiele von MIND PAUSE aus dem **Hauptordner des Repositorys** entwickelt. Allgemeines zu Voraussetzungen, lokalem Server, Tests, Browser-Test und Veröffentlichung steht in der [README der Sammlung](../../../README.de.md). Hier steht nur, was SPRING betrifft.

## Lokal starten

```bash
npm start
```

Danach SPRING unter `http://localhost:3000/spring/` öffnen. Die Sprache folgt der Browsersprache: in Chrome unter Einstellungen > Sprachen, in Safari über die Systemsprache.

## Tests von SPRING

`npm test` im Hauptordner führt alle Tests der Sammlung aus. Diese betreffen SPRING:

| Datei | Prüft |
|---|---|
| `spring/tests/game.test.js` | Startstellung, erste Züge, keine Diagonalen, Sprung und Zurück, Speichern und Laden, vollständige Lösung, Bewertung |
| `spring/tests/figures.test.js` | Alle Figuren auf dem 33er-Brett, **jede Figur lösbar bis Meisterhaft**, Sortierung, Navigation, Erkennen unlösbarer Stellungen |
| `spring/tests/gutter.test.js` | 31 Murmeln passen in den Rand, Bewegung kommt zur Ruhe, Stöße geben Schwung weiter, Neigung sammelt Murmeln unten, freie Plätze, Finger schiebt |
| `spring/tests/tilt.test.js` | Schwerkraft aus Gerätewinkeln in Hoch- und Querformat, Schalter für Neigen auch während der Erlaubnis-Abfrage |
| `shared/tests/i18n.test.js` | Unter anderem: Texte von SPRING haben in beiden Sprachen dieselben Schlüssel und keine Gedankenstriche |
| `tests/release.test.js` | Unter anderem: Jeder Verweis von SPRING trägt die richtige Version, der Service Worker kennt jedes Modul, der Ordner ist vollständig |

Der Browser-Test `npm run e2e` öffnet SPRING auf iPhone, iPhone quer, iPhone SE und iPad, auf Deutsch und Englisch, und spielt einen Zug samt Zurück. Dafür stellt `main.js` das Objekt `window.__game` bereit (`history`, `e2e.move()`, außerdem `view`, `game`, `switchFigure`).

### Zusätzlich von Hand prüfen

1. Figur wechseln, Tipp, Zurück, Neu, Ergebniskarte, Nächste Figur.
2. Rand antippen und wischen, Neigen ein- und ausschalten.
3. Hell- und Dunkelmodus.

## Auf iPhone oder iPad testen

1. `npm start` auf dem Rechner ausführen.
2. Auf dem iPhone in Safari `http://<IP-des-Rechners>:3000/spring/` öffnen.

Ohne HTTPS funktionieren Service Worker und Bewegungssensor nicht. Für diese beiden Punkte über die veröffentlichte Adresse testen.

**Fehlersuche mit dem Mac:** iPhone: Einstellungen > Apps > Safari > Erweitert > Web-Inspektor einschalten, per Kabel verbinden, am Mac in Safari: Menü Entwickler > Name des iPhones > Seite auswählen.

## Konventionen für SPRING

| Thema | Regel |
|---|---|
| Texte | Texte von SPRING in `spring/js/strings.js`, allgemeine Texte in der Hülle. Immer in beiden Sprachen |
| Oberfläche | Nichts an Kopfzeile, Steuerleiste, Blättern oder Ergebniskarte in SPRING selbst ändern, sondern in der Hülle, damit alle Spiele profitieren |
| Farben und Schriften | Aus `shared/tokens.css`. In `spring/css/spring.css` nur Werte, die es ausschließlich bei SPRING gibt |
| Trennung | Logikmodule greifen nie auf `document` zu |
| Verweise | Eigene Dateien immer mit `?v=<Version von SPRING>`, Dateien der Hülle mit `?shell=<Version der Hülle>` |
| Schreibstil | Kommentare auf Deutsch, keine Gedankenstriche in Texten und Dokumentation |
| Dokumentation | Jede Änderung in `docs/de` und `docs/en` sowie in beiden Changelogs nachziehen |

## Neue Version von SPRING

1. `npm test` und `npm run e2e` ohne Fehler.
2. `node scripts/release.mjs spring <version>` setzt die Version in allen Dateien von SPRING.
3. Neue JavaScript-Dateien in die Liste in `spring/sw.js` eintragen (der Test meldet es sonst).
4. `CHANGELOG.md` und `CHANGELOG.de.md` von SPRING ergänzen.
5. Dokumentation in beiden Sprachen aktualisieren, bei sichtbaren Änderungen auch die Bilder in `docs/images`.
6. Pull Request. Nach grünen Tests zusammenführen, ein bis zwei Minuten später ist die Version live.
