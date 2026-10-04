# Erweitern

[English version](../en/extending.md) · [Übersicht](README.md)

SPRING ist so gebaut, dass neue Inhalte möglichst ohne Eingriff in die Spiellogik entstehen.

## Neue Figur hinzufügen

1. Eintrag in `FIGURES` in `js/figures.js` ergänzen, an der passenden Stelle nach Schwierigkeit:

```js
{
  id: 'doppelkreuz',
  name: { de: 'Doppelkreuz', en: 'Double cross' },
  difficulty: 3,
  layout: [
    '  .o.  ',
    '  .o.  ',
    '..ooo..',
    '...o...',
    '..ooo..',
    '  .o.  ',
    '  ...  ',
  ],
},
```

2. `npm test` ausführen. `tests/figures.test.js` prüft automatisch, ob die neue Figur bis auf eine Murmel in der Mitte lösbar ist. **Eine unlösbare Figur fällt hier durch.** Das Beispiel oben (10 Murmeln) ist geprüft und lösbar.

Regeln für das Layout:

* Sieben Zeilen mit je sieben Zeichen.
* `o` für eine Murmel, `.` für ein leeres Feld, Leerzeichen außerhalb des Kreuzes.
* Schwierigkeit von 1 bis 5. Die Liste muss danach aufsteigend sortiert sein, Klassisch bleibt zuletzt.

Alles andere passiert automatisch: Karte in der Auswahl, Vorschau, Farben der Murmeln, Statistik, Sterne, Tipps und „Nächste Figur“.

**Wichtig:** Nicht jede Form ist lösbar. Wegen einer mathematischen Eigenschaft des Bretts (Paritätsklassen der Felder) gehen viele Figuren nicht bis auf eine Murmel in der Mitte auf. So waren bei der Entwicklung zum Beispiel alle getesteten treppenförmigen Figuren aus 9 Murmeln nicht lösbar.

## Neue Sprache hinzufügen

1. In `js/i18n.js` einen Block mit denselben Schlüsseln wie `de` und `en` anlegen, zum Beispiel `fr`.
2. `detectLanguage()` so erweitern, dass sie `fr` erkennt.
3. Jeder Figur in `js/figures.js` einen Namen `name.fr` geben.
4. `npm test` prüft, dass alle Sprachen dieselben Schlüssel haben.

## Neue Klangfarbe

1. Eintrag in `SOUND_STYLES` in `js/sound.js` (Anteile für Holz, Keramik, Raum und Tiefpass).
2. Knopf mit `data-style` in der Segmentauswahl in `index.html`.
3. Übersetzung unter `styles` in `js/i18n.js`.

## Farbthema

Die Brettfarben stehen als Verläufe in `BoardView.build()` in `js/view.js`, die Oberflächenfarben als CSS-Variablen in `css/style.css`. Ein Farbthema besteht aus einem Satz Verlaufsfarben (Brett, Rinne, Spielfläche, beide Murmelfarben) und einem Satz CSS-Variablen. Empfohlener Weg: Verlaufsfarben in ein Objekt `THEMES` auslagern, beim Aufbau des SVG einsetzen und die Wahl wie die Klangfarbe speichern.

## Roadmap

| Version | Inhalt | Status |
|---|---|---|
| 1.0 | Klassisches Brett, Bedienung, Bewertung, Offline, Installation | Fertig |
| 2.0 | SPRING: 7 Figuren, Wechsel im Spiel, Tipps, Sterne, lebendiger Rand, Neigen, Klangdesign, zweisprachig | Fertig |
| 2.x | Farbthemen, weitere Figuren, Aufgaben mit anderem Start- und Zielfeld | Geplant |
| 3.0 | Tagesaufgabe, App-Store-Version mit Vibrationsrückmeldung | Idee |

Hinweis zu 3.0: Safari auf iPhone und iPad bietet Web-Apps keine Vibration. Spürbare Rückmeldung gibt es erst in einer App-Store-Version, zum Beispiel über Capacitor mit derselben Codebasis.
