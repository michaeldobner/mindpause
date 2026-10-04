# Klangdesign

[English version](../en/sound.md) · [Übersicht](README.md)

## Ziel

Ein Keramikstein wird auf ein lackiertes Holzbrett gesetzt: warm, rund, mit einem kurzen hellen Klingen. Ein Schlag klingt kräftiger, eine Krönung wie eine kleine Glocke. Nichts piept, nichts fanfart.

QUEEN nutzt die Klang-Engine der Hülle (`shared/js/sound-engine.js`) mit ihrem Mastering, den Klangfarben und den Bausteinen Anschlag, Holz und Keramik. Wie diese Bausteine aufgebaut und gestimmt sind, beschreibt das [Klangdesign von SPRING](../../../spring/docs/de/klang.md) ausführlich. Die eigenen Klänge von QUEEN stehen in `queen/js/sound.js` in der Klasse `QueenSound`. Es gibt keine Audiodateien.

## Alle Klänge

| Moment | Methode | Aufbau |
|---|---|---|
| Stein anheben | `lift()` | Fast unhörbares Tippen: leiser Anschlag und ein sehr kurzer hoher Keramikton |
| Zug landet | `place(fortschritt)` | Der Landeklang der Engine (`tap`): Anschlag, Holz, Keramik, Raum. Die Tonhöhe steigt mit dem Spielverlauf |
| Schlag | `hop(k)` | Kräftiger Anschlag, tieferes Holz um 175 Hz und ein heller Keramikton. Bei einem Mehrfachschlag steigt jeder weitere Sprung um zwei Stufen der Leiter |
| Geschlagener Stein erreicht die Schale | `rim()` aus der Engine | Tieferes Holz, sanftes Keramik-Klicken |
| Steine stoßen in der Schale an | `clack(stärke)` aus der Engine | Feiner Klick nach Aufprall, höchstens acht pro Sekunde |
| Krönung | `crown()` | Drei Glockentöne auf den Stufen 10, 12 und 15 der Leiter im Abstand von 90 ms, langer Ausklang |
| Ungültiger Stein | `invalid()` aus der Engine | Zwei gedämpfte, tiefe Holzklopfer |
| Zurück | `place(…, { soft: true })` | Wie eine Landung, leiser und tiefer |
| Sieg | `win(true)` aus der Engine | Aufsteigender Dreiklang mit Glockenton |
| Niederlage | `lose()` | Zwei ruhige, absteigende Töne aus Holz und Keramik |
| Remis | Kein eigener Klang | Die Ergebniskarte genügt |

## Das Spiel als Melodie

Wie bei SPRING wird der Spielverlauf hörbar. Der Fortschritt ist die Zahl der geschlagenen Steine geteilt durch 22: Zu Beginn landen Züge tief, je weniger Steine auf dem Brett stehen, desto höher klingen sie. Weil die Keramik auf die Dur-Pentatonik gestimmt ist, passt jeder Ton zu jedem anderen, auch bei schnellen Mehrfachschlägen.

## Damit es nicht nervt

* Jeder Klang variiert leicht in Tonhöhe und Lautstärke, kein Zug klingt exakt wie der vorige.
* Stöße in den Schalen sind gedrosselt: höchstens acht Klicks pro Sekunde, mindestens 45 ms Abstand.
* Es gibt kein Dauergeräusch. Rollende Steine sind still, nur Stöße sind zu hören.
* Der Ton lässt sich unter **Mehr** abschalten, die Klangfarbe gilt für alle Spiele.

## iOS

Safari gibt Ton erst nach einer Berührung frei. Die Engine entsperrt den Ton bei jeder ersten Berührung, jedem Klick und jeder Taste neu, auch nach einem Neustart der App.

## Anpassen

| Ziel | Stelle |
|---|---|
| Ein Klang von QUEEN | Methode in `queen/js/sound.js` |
| Klänge der Schalen, Landeklang, Sieg | Klang-Engine der Hülle, gilt dann für alle Spiele |
| Neue Klangfarbe | `SOUND_STYLES` in `shared/js/sound-engine.js`, siehe [Erweitern](erweitern.md) |
