# Entwicklung

[English version](../en/development.md) · [Übersicht](README.md)

## Voraussetzungen

* Node.js ab Version 20 (für Tests und den lokalen Server)
* Ein moderner Browser

Es gibt keine Abhängigkeiten und keinen Build-Schritt.

## Lokal starten

```bash
npm start
```

Startet einen lokalen Server, die Adresse steht in der Ausgabe (meist `http://localhost:3000`). Ein Server ist nötig, weil Browser ES-Module, Web Worker und Service Worker nicht direkt aus Dateien laden.

Sprache testen: Die Sprache folgt der Browsersprache. In Chrome unter Einstellungen > Sprachen, in Safari über die Systemsprache.

## Tests

```bash
npm test
```

30 Tests mit dem eingebauten Test-Runner von Node.js. Sie laufen außerdem bei jedem Push über GitHub Actions (`.github/workflows/tests.yml`).

| Datei | Prüft |
|---|---|
| `tests/game.test.js` | Startstellung, erste Züge, keine Diagonalen, Sprung und Zurück, Speichern und Laden, vollständige Lösung, Bewertung |
| `tests/figures.test.js` | Alle Figuren auf dem 33er-Brett, **jede Figur lösbar bis Meisterhaft**, Sortierung, Navigation, Erkennen unlösbarer Stellungen |
| `tests/gutter.test.js` | 31 Murmeln passen in den Rand, Bewegung kommt zur Ruhe, Stöße geben Schwung weiter, Neigung sammelt Murmeln unten, freie Plätze, Finger schiebt |
| `tests/tilt.test.js` | Schwerkraft aus Gerätewinkeln in Hoch- und Querformat, Schalter für Neigen auch während der Erlaubnis-Abfrage |
| `tests/i18n.test.js` | Spracherkennung, Einzahl und Mehrzahl, gleiche Schlüssel in beiden Sprachen, keine Gedankenstriche |
| `tests/release.test.js` | Alle Verweise tragen die aktuelle Version, Versionsnummern stimmen überein, der Service Worker kennt jedes Modul |

### Im Browser prüfen

Vor einer Veröffentlichung im Browser durchspielen:

1. iPhone hoch, iPhone quer, iPad quer (Entwicklerwerkzeuge des Browsers, Geräteansicht).
2. Hell- und Dunkelmodus.
3. Deutsch und Englisch.
4. Figur wechseln, Tipp, Zurück, Neu, Ergebniskarte, Nächste Figur.
5. Rand antippen und wischen.
6. Konsole ohne Fehler.

Für automatische Browsertests stellt `main.js` ein kleines Objekt `window.__spring` bereit (`view`, `game`, `switchFigure`, `figures`).

## Auf iPhone oder iPad testen

**Im lokalen Netz:**

1. `npm start` auf dem Rechner ausführen.
2. Auf dem iPhone in Safari `http://<IP-des-Rechners>:3000` öffnen.

Ohne HTTPS funktionieren Service Worker und Bewegungssensor nicht. Für diese beiden Punkte über die veröffentlichte Adresse testen.

**Fehlersuche mit dem Mac:**

1. iPhone: Einstellungen > Apps > Safari > Erweitert > Web-Inspektor einschalten.
2. iPhone per Kabel verbinden.
3. Mac, Safari: Menü Entwickler > Name des iPhones > Seite auswählen.

## Konventionen

| Thema | Regel |
|---|---|
| Sprache im Code | Kommentare auf Deutsch |
| Texte | Alle sichtbaren Texte in `js/i18n.js`, immer in beiden Sprachen |
| Schreibstil | Keine Gedankenstriche in Texten und Dokumentation, stattdessen Komma, Punkt, Doppelpunkt oder ein umformulierter Satz |
| JavaScript | ES-Module, `const` und `let`, Klassen für Teile mit Zustand, kleine reine Hilfsfunktionen |
| Trennung | Logikmodule greifen nie auf `document` zu |
| Farben | Neue Oberflächenfarben als CSS-Variable in `:root` und im Dunkelmodus |
| Tippflächen | Mindestens 44 pt |
| Dokumentation | Jede Änderung in `docs/de` und `docs/en` sowie in beiden Changelogs nachziehen |

## Checkliste vor dem Veröffentlichen

1. `npm test` ohne Fehler.
2. Im Browser geprüft wie oben beschrieben.
3. Version gesetzt mit `node scripts/release.mjs <version>`, neue Dateien in der Liste in `sw.js` eingetragen.
4. Neue Verweise auf eigene Dateien immer mit `?v=<version>` schreiben, wie alle anderen.
5. `CHANGELOG.md` und `CHANGELOG.de.md` ergänzt.
6. Dokumentation in beiden Sprachen aktualisiert, bei sichtbaren Änderungen auch die Bilder in `docs/images`.
