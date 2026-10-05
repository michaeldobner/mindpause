# Design-System

[English version](../en/design.md) · [Übersicht](README.md)

## Leitidee

**BLOCKS ist ein Geschwister von SPRING und QUEEN Mitternacht.** Die Platte trägt das Nachtblau von SPRING, die freien Felder sind dieselben Mulden wie die freien Löcher des Solohalma-Bretts, und die Steine sind aus der blauen Keramik, aus der in QUEEN die Steine im Stil Mitternacht gemacht sind. So wirkt BLOCKS sofort wie ein Teil der Sammlung, obwohl es ein ganz anderes Spiel ist.

Schriften, Oberflächenfarben, Abstände und alle Bausteine der Oberfläche (Kopfzeile, Steuerleiste, Blätter, Ergebniskarte) kommen aus der [Hülle](../../../shared/README.de.md). Dieses Dokument beschreibt nur, was BLOCKS eigen ist.

| Grundsatz | Bedeutung |
|---|---|
| **Zwei Farben** | Alle eigenen Steine sind blau, die Startsteine eines Levels schwarz, wie die beiden Seiten von QUEEN Mitternacht. Gelesen wird die Form, und das Brett bleibt ruhig |
| **Greifbar** | Jeder Stein ist ein kleines Keramikstück mit Fase, Lichtkante und Glanzpunkt |
| **Ruhe** | Kein Feuer, keine Partikel, kein Blinken. Linien lösen sich auf, Zahlen steigen sanft auf |
| **Vorschau statt Überraschung** | Beim Ziehen sieht man, was passieren wird |

## Name

Die Spiele der Sammlung heißen kurz und in Versalien. **BLOCKS** sagt ohne Erklärung, worum es geht, ist international lesbar und steht in Didot gleichwertig neben SPRING, QUEEN, KARO, FUGE und MÜHLE.

## Farben (gleich in Hell und Dunkel)

| Element | Farbe | Herkunft |
|---|---|---|
| Platte | Verlauf `#2a2f7a` nach `#14174a` | Brett von SPRING, Platte von QUEEN Mitternacht |
| Spielfläche | Verlauf `#0b0d33` über `#121543` nach `#1c2060` | Rinne von SPRING, Schale von QUEEN Mitternacht |
| Kante Spielfläche | `#2f3588` | Lichtkante von SPRING |
| Mulden | Verlauf `#05061c` nach `#11143f` | Freie Felder von SPRING |
| Stein | Lichtpunkt `#86abff`, Körper `#3f6ef0`, Schatten `#2142b4` | Blaue Steine von QUEEN Mitternacht, Murmeln von SPRING |
| Startstein im Level | `#5e616e`, `#1d1e26`, `#07070a` | Schwarze Steine von QUEEN Mitternacht |
| Steine am Ende | Nachtblau `#05061a`, 55 % darüber | Das Licht geht aus |
| Tipp | `#ffd36b` | Tippring der Sammlung |
| Vorschau der Linien | Helles Blau `#c8d4ff`, 18 bis 28 %, pulsierend | |

Die Zeile über dem Brett (im Level Ziel und Startsteine, sonst Bestwert, rechts die Serie) steht auf dem Hintergrund der Hülle und nutzt deshalb `--ink` und `--ink-soft`, die mit Hell und Dunkel wechseln.

## Die Steine

Jede Zelle wird einmal je Farbe und Größe als kleines Bild gezeichnet:

| Schicht | Gestaltung |
|---|---|
| Körper | Abgerundetes Quadrat (Radius 20 %), radialer Verlauf mit Licht oben links wie bei den Steinen von QUEEN |
| Fase | Innere, flachere Fläche, 14 % eingerückt, mit feiner heller Kante |
| Kanten | Lichtkante oben, Schattenkante unten |
| Glanz | Weicher Lichtpunkt oben links |
| Schatten | Weich nach unten, beim Ziehen größer und weiter, als schwebe der Stein |

Zwischen den Steinen bleibt eine Fuge von 6 % der Zelle, die Mulden darunter sind 7 % eingerückt. So bleibt das Raster immer lesbar.

## Geometrie

| Größe | Wert in Zellen |
|---|---|
| Brett | 8 × 8 (Weit: 10 × 10) |
| Rand der Platte | 0,34 |
| Zeile über dem Brett | 0,95 |
| Abstand zum Tablett | 0,5 |
| Tablett | 3,3 tief, bekommt übrigen Platz bis 4,7 |
| Zelle auf dem Tablett | Fach geteilt durch 5,4, höchstens 0,62 |

Die Zellgröße ergibt sich aus dem Platz und wird auf ganze Gerätepixel gerundet.

## Layouts

| Gerät | Anordnung |
|---|---|
| iPhone hoch | Schriftzug, Level oder Modus und Punkte oben, Ziel oder Bestwert und Serie über dem Brett, Tablett darunter, Steuerleiste unten: Zurück, Tipp, Neu, Level, Mehr |
| iPhone quer | Schriftzug, Modus und Punkte links, Brett in voller Höhe, Tablett als Spalte rechts daneben, Steuerleiste rechts |
| iPad und Rechner | Wie quer, das Brett wird deutlich größer. Level und Modi als Schublade von links |

**Auswahl:** erst die 30 Level, jede Karte mit Vorschau des Startbretts (Startsteine grau), Ziel oder bester Zahl an Steinen, Sternen und fünf Punkten für die Schwierigkeit. Gesperrte Level sind gedämpft. Danach folgen die freien Modi.

Das Layout mit dem Tablett unten oder daneben wird gewählt, je nachdem, was das Brett größer macht.

## Bewegung

| Moment | Gestaltung | Dauer |
|---|---|---|
| Stein anheben | Wächst von der Größe auf dem Tablett zur Größe auf dem Brett, Schatten wird weicher | 120 ms |
| Ziehen | Schwebt knapp eine Zelle über dem Finger, Umriss am Ziel halb durchsichtig | |
| Vorschau | Reihen und Spalten, die verschwinden würden, pulsieren hell | |
| Ablegen | Steine setzen sich mit kleinem Nachfedern, leuchten kurz auf | 260 ms |
| Linien | Hellen auf, werden kleiner und verblassen, von der Ablagestelle aus nach außen | 500 ms |
| Punkte | „+24“ in Didot steigt über der Ablagestelle auf | 0,95 s |
| Schriftzüge | „Doppel“, „Serie 4“, „Leer geräumt“ mitten auf dem Brett | 1,15 s |
| Daneben losgelassen | Stein gleitet zurück in sein Fach | 220 ms |
| Neue Steine | Steigen nacheinander ins Tablett, mit leichtem Nachfedern | 420 ms |
| Ende | Reihe für Reihe von unten nach oben dunkler, wie wenn das Licht ausgeht | 0,75 s |
| Level geschafft | Dreiklang, bei drei Sternen mit Glocke, dann die Ergebniskarte mit „Weiter“ | 0,9 s |
| Ruhe, Brett voll | Steine lösen sich von oben nach unten auf, „Neu geordnet“ | 0,85 s |

Bei „Bewegung reduzieren“ entfallen Wachsen, Nachfedern und Auflösen.

## Klang

Keramik auf Holz wie in der ganzen Sammlung, gebaut auf der Klang-Engine der Hülle. Alle Klänge respektieren Ton aus, Klangfarbe und den Lautlos-Schalter.

| Klang | Aufbau |
|---|---|
| Anheben | Fast unhörbares, weiches Tippen, wie eine Murmel in SPRING |
| Einrasten | Sehr leiser, heller Klick, wenn der Stein über einem neuen Platz liegt |
| Ablegen | Der Setzklang der Sammlung, die Tonhöhe steigt mit der Füllung des Bretts. Kleine Steine leiser |
| Daneben | Zwei gedämpfte Holzklopfer |
| Linien | Je Linie ein Keramikton, aufsteigend, mit der Serie höher. Ab drei Linien und bei Leer geräumt schließt eine Glocke |
| Neue Steine | Drei leise Tipps |
| Ende | Zwei ruhige, absteigende Töne, bei neuem Bestwert danach der Dreiklang mit Glocke |
| Ruhe, Brett voll | Langsam absteigender Lauf |

Auf Geräten mit Vibration gibt es einen kurzen Impuls bei Linien.

## App-Symbol

Steine aus blauer Keramik auf dem Nachtblau der Sammlung. Unten ist ein Raster fast gefüllt, ein Stein schwebt über seiner Lücke. Quelle ist `icons/icon.svg`, erzeugt von `tools/icons.mjs`, daraus entstehen PNG-Dateien in 180, 192 und 512 Pixeln.
