# Spielregeln

[English version](../en/gameplay.md) · [Übersicht](README.md)

## Ziel

Steine fallen von oben in einen Kasten mit 10 Spalten und 20 Reihen. Wer sie so legt, dass eine Reihe ganz voll ist, räumt diese Reihe ab. Alles darüber rutscht nach. Das Spiel endet, wenn für den nächsten Stein kein Platz mehr ist.

## Die Steine

Es gibt die sieben klassischen Formen aus je vier Feldern: I, O, T, S, Z, J und L. Jede Form hat ihre feste Farbe.

| Form | Farbe |
|---|---|
| I | Elfenbein |
| O | Ocker |
| T | Taubenblau |
| S | Salbei |
| Z | Terrakotta |
| J | Kobalt |
| L | Rosé |

**Reihenfolge:** Die Steine kommen in Beuteln zu sieben. In jedem Beutel ist jede Form genau einmal, in zufälliger Reihenfolge. So wartet man nie ewig auf das lange I.

## Bewegung

| Aktion | Wirkung |
|---|---|
| Verschieben | Ein Feld nach links oder rechts |
| Drehen | Um 90 Grad, im oder gegen den Uhrzeigersinn. Passt der Stein nicht, probiert FUGE wie im Standard SRS bis zu vier Ausweichstellen (Wandsprünge) |
| Schneller fallen | Der Stein fällt sofort Reihe für Reihe, ein Punkt pro Reihe |
| Fallen lassen | Der Stein fällt ganz nach unten und liegt sofort fest, zwei Punkte pro Reihe |
| Halten | Legt den Stein ins Fach. Liegt dort schon einer, kommt dieser ins Spiel. Einmal pro Stein |

**Frist am Boden:** Ein Stein, der aufliegt, kann noch 0,5 Sekunden bewegt werden. Jede Bewegung verlängert die Frist, höchstens 15 Mal pro Stein. Erreicht der Stein eine tiefere Reihe, beginnt die Zählung neu.

**Geisterstein:** Ein feiner Umriss zeigt, wo der Stein landen wird. Abschaltbar in den Einstellungen.

## Punkte

Alle Punkte für Reihen werden mit der aktuellen Stufe multipliziert.

| Ereignis | Punkte |
|---|---|
| Einzel (1 Reihe) | 100 |
| Doppel (2 Reihen) | 300 |
| Dreier (3 Reihen) | 500 |
| **Quart** (4 Reihen) | 800 |
| T-Dreh ohne Reihe | 400 |
| T-Dreh Einzel, Doppel, Dreier | 800, 1200, 1600 |
| T-Dreh Mini ohne Reihe, mit 1, mit 2 Reihen | 100, 200, 400 |
| **Folge** (Back-to-Back) | Quart oder T-Dreh mit Reihe direkt nach einem ebensolchen: mal 1,5 |
| **Serie** | Reihen mit mehreren Steinen hintereinander: 50 mal Serienlänge |
| **Leer geräumt** | Der Kasten ist danach ganz leer: 800, 1200, 1800 oder 2000 zusätzlich |
| Schneller fallen | 1 pro Reihe |
| Fallen lassen | 2 pro Reihe |

**T-Dreh:** Der T-Stein wurde zuletzt gedreht, nicht verschoben, und mindestens drei der vier Ecken um seine Mitte sind belegt. Sind beide Ecken auf der Seite der Spitze belegt, ist es ein voller T-Dreh, sonst ein Mini (außer nach dem letzten Wandsprung, der zählt immer voll).

## Stufen und Geschwindigkeit

Alle 10 Reihen steigt die Stufe um eins. Die Zeit pro Reihe folgt der Kurve der Guideline: auf Stufe 1 eine Sekunde, auf Stufe 10 etwa 0,13 Sekunden, ab Stufe 20 fallen die Steine sofort.

## Modi

| Modus | Regel | Ende | Sterne |
|---|---|---|---|
| **Klassisch** | Stufe steigt alle 10 Reihen | Kasten voll | ★ ab 30 Reihen, ★★ ab 80, ★★★ ab 150 |
| **Sprint** | Gleichbleibend auf Stufe 1 | Nach 40 Reihen, die Zeit zählt | ★ geschafft, ★★ unter 3:00, ★★★ unter 1:45 |
| **3 Minuten** | Stufe steigt alle 10 Reihen | Nach 180 Sekunden | ★ ab 6 000 Punkten, ★★ ab 18 000, ★★★ ab 40 000 |
| **Ruhe** | Langsam, 1,25 Sekunden pro Reihe | Nie. Ist der Kasten voll, löst er sich auf und es geht weiter | keine |

Bestwerte und Sterne werden je Modus auf dem Gerät gespeichert und in der Modusauswahl angezeigt.

## Pause und Fortsetzen

* **Pause** über die Schaltfläche, P oder Escape. Die Karte im Kasten zeigt die Bedienung.
* Beim Öffnen von Modi oder Einstellungen und beim Verlassen der App pausiert FUGE von selbst.
* Das Spiel wird gespeichert. Beim nächsten Start geht es pausiert genau dort weiter.
* **Neu** beginnt sofort ein neues Spiel im aktuellen Modus.

## Bedienung

| iPhone und iPad | Rechner | Wirkung |
|---|---|---|
| Ziehen links oder rechts | ← → oder A D | verschieben, gedrückt halten wiederholt nach 170 ms alle 50 ms |
| Tippen, rechte Hälfte | ↑, X, W oder E | drehen im Uhrzeigersinn |
| Tippen, linke Hälfte | Z, Y, Q oder Strg | drehen gegen den Uhrzeigersinn |
| Langsam nach unten ziehen | ↓ oder S | schneller fallen |
| Schnell nach unten wischen | Leertaste | fallen lassen |
| Nach oben wischen, Fach antippen oder **Halten** | C oder Shift | halten |
| **Pause** oder Tipp auf den Kasten | P, Escape, Enter, Leertaste | Pause und Fortsetzen |

Die Gesten funktionieren auf der ganzen Fläche um den Kasten, der Daumen muss den Stein nicht verdecken. Beim Ziehen bewegt sich der Stein ungefähr so weit wie der Finger, ein Feld pro Zellbreite.

### Daumensteuerung

Für das iPad quer in beiden Händen gibt es in den Einstellungen die **Daumensteuerung** (anfangs aus). Sie wirkt nur, wenn der Kasten breit liegt, und macht die Flächen links und rechts neben der Wanne zu großen Tippzonen:

| Zone | Wirkung |
|---|---|
| Links, äußere Hälfte | nach links verschieben, Liegenlassen wiederholt |
| Links, innere Hälfte | nach rechts verschieben, Liegenlassen wiederholt |
| Rechts, innere Hälfte antippen | gegen den Uhrzeigersinn drehen |
| Rechts, äußere Hälfte antippen | im Uhrzeigersinn drehen |
| Rechts nach unten wischen | fallen lassen |
| Rechts nach oben wischen | halten |

Beide Daumen können gleichzeitig wirken. Das Fach Halten und alle Schaltflächen bleiben wie gewohnt antippbar, die Gesten auf der Wanne bleiben ebenfalls.
