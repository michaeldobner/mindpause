# Design-System

[English version](../en/design.md) · [Übersicht](README.md)

## Leitidee

**Wie sähe das klassische Spiel mit fallenden Steinen aus, wenn es als hochwertiges physisches Designerspiel entstanden wäre?**

FUGE ist ein lackierter Holzkasten in Nachtblau mit eingelassener Wanne. Darin fallen matt lackierte Steine, die passgenau ineinandergreifen. Rechts liegt eine Leiste mit zwei Fächern für den gehaltenen und die nächsten Steine. Eine feine Linie in Elfenbein umläuft den Kasten wie ein Inlay. Der Kasten sieht in Hell und Dunkel gleich aus, wie die Bretter von SPRING und QUEEN und die Matte von KARO.

Schriften, Oberflächenfarben, Abstände und alle Bausteine der Oberfläche (Kopfzeile, Steuerleiste, Blätter, Ergebniskarte) kommen aus der [Hülle](../../../shared/README.de.md). Dieses Dokument beschreibt nur, was FUGE eigen ist.

| Grundsatz | Bedeutung |
|---|---|
| **Das Spielfeld ist die Dekoration** | Nichts liegt obendrauf. Kasten, Raster und Steine tragen die ganze Gestaltung |
| **Werkstücke statt Pixel** | Jeder Stein ist ein zusammenhängendes Objekt mit Fase, Lack und Schatten |
| **Ruhe** | Kurze, weiche Bewegungen, keine Explosionen, keine Partikel, kein Blinken |
| **Präzision** | Schnelle Eingaben werden nie verschluckt. Die Animation folgt der Logik, nie umgekehrt |

## Recherche: physische Designerspiele

Vorbild war die Idee hochwertiger Gesellschaftsspiele als Designobjekte, wie sie zum Beispiel die schwedische Marke Printworks prägt. Übernommen wurden Prinzipien, keine Produkte, Logos oder Muster.

| Beobachtung | Umsetzung in FUGE |
|---|---|
| Zweiton-Paarungen: ein gedämpfter Grund mit einem neutralen oder pastelligen Partner (Smaragd und Beige, Rosé und Grau, Grau und Blau) | Nachtblau und Elfenbein als Grundpaar, Steine in gedämpften, kuratierten Tönen |
| Palette aus Beige, Grau, Pastell, tiefem Marineblau und Grün | Elfenbein, Ocker, Taubenblau, Salbei, Terrakotta, Kobalt, Rosé |
| Glanz (Acryl, Lack) gegen mattes Papier | Lackierter Kasten mit Lichtkante, Steine matt mit hauchfeinem Glanz oben |
| Verpackung wie ein Bildband für den Couchtisch, das Spiel bleibt sichtbar liegen | Der Kasten wirkt auch ohne Spiel wie ein Objekt, die Typografie erinnert an einen Buchumschlag |
| Strenges quadratisches Raster, das Spielfeld selbst ist die Grafik | Punktraster an den Kreuzungen statt Linien, keine Zierelemente |

**Warum erkennt man ein solches Spiel sofort als Designobjekt?** Weil es wie ein Buch proportioniert ist und nicht wie ein Spielzeug, weil zwei Farben genügen, und weil die Funktion selbst die Dekoration ist.

## Name

Die Spiele von MIND PAUSE heißen kurz, in Versalien und nach einem Element des Spiels: SPRING (springen), QUEEN (Dame), KARO (Spielfarbe und Muster). Geprüft wurden unter anderem FUGE, QUART, FALL, STRATA, LINEA, TAKT, LOT, RIEGEL, KANTE und MOSAIK.

**FUGE** gewann: Die Fuge ist der Spalt zwischen zwei Steinen, den man im Spiel schließt, und die musikalische Fuge, in der eine Stimme nach der anderen einsetzt wie die fallenden Steine. Vier Buchstaben, international lesbar, in Didot gesetzt gleichwertig neben KARO und QUEEN. QUART lebt als Name für vier Reihen auf einmal weiter.

## Farben

### Steine (gleich in Hell und Dunkel)

| Form | Farbe | Hex | Kontrast zur Wanne |
|---|---|---|---|
| I | Elfenbein | `#ece2cc` | sehr hoch |
| O | Ocker | `#dca544` | hoch |
| T | Taubenblau | `#8f96d8` | hoch |
| S | Salbei | `#8db898` | hoch |
| Z | Terrakotta | `#d4673f` | mittel bis hoch |
| J | Kobalt | `#4f7cf0` | mittel, das Blau der Sammlung |
| L | Rosé | `#e6a39b` | hoch |
| Ende | Tinte | `#4a4e80` | Farbe des vollen Kastens nach Game Over |

Die Farben unterscheiden sich in Farbton und Helligkeit. Für das Spiel selbst ist Farbe nie nötig, denn jede Form ist an ihrer Gestalt erkennbar. Wer möchte, schaltet zusätzlich **Muster auf den Steinen** ein: Strich (I), Ring (O), Punkt (T), Schrägstrich (S), Gegenschrägstrich (Z), Quadrat (J), Kreuz (L).

### Kasten

| Element | Farbe |
|---|---|
| Rahmen | Verlauf `#2b307c` nach `#171a50`, Lichtkante mit 8 % Weiß |
| Inlay | Linie in Elfenbein, 16 % Deckkraft |
| Wanne | Verlauf `#0b0d31` nach `#181b50`, Schatten an der oberen Kante |
| Fächer | Verlauf `#12153f` nach `#1b1f57`, flacher als die Wanne |
| Punktraster | Elfenbein, 13 % |
| Beschriftungen | Elfenbein, 58 %, Versalien mit Laufweite |
| Zahlen | Elfenbein, Didot |

## Die Steine

Jede Zelle wird einmal je Form, Nachbarschaft und Größe als kleines Bild gezeichnet:

| Schicht | Gestaltung |
|---|---|
| Umriss | Außen gerundete Ecken (17 % der Zelle), zu Nachbarn desselben Steins gerade, an inneren Ecken eine saubere Kehle |
| Fuge | 5 % der Zelle Abstand zu anderen Steinen und zur Wanne |
| Lack | Oben ein Hauch heller, unten ein Hauch dunkler |
| Fase | Lichtkante oben und links, Schattenkante unten und rechts, nur an Außenkanten |
| Naht | Hauchfeine Linie zwischen den vier Zellen eines Steins, damit sich Felder zählen lassen |
| Schatten | Weich nach unten in die Wanne |

Gehaltene Steine, die gerade nicht getauscht werden dürfen, erscheinen in Tinte. Der Geisterstein ist ein feiner Umriss in der Farbe des Steins mit einem Hauch Füllung.

## Geometrie

| Größe | Wert in Zellen |
|---|---|
| Wanne | 10 × 20 sichtbar, darüber 2 unsichtbare Reihen |
| Rand des Kastens | 0,42 |
| Abstand Wanne zu Leiste | 0,42 |
| Leiste | 3,3 breit |
| Fach Halten | 2,3 hoch |
| Fach Nächste | 6,5 hoch, erster Stein in 0,6 Zellgröße, die beiden weiteren in 0,46 |

Die Zellgröße ergibt sich aus dem Platz und wird auf ganze Gerätepixel gerundet, damit alle Kanten scharf bleiben. Höchstens 44 Punkte pro Zelle.

## Layouts

| Gerät | Anordnung |
|---|---|
| iPhone hoch | Schriftzug, Modus und Punkte oben, Kasten mittig, Steuerleiste unten: Halten, Pause, Neu, Modi, Mehr |
| iPhone quer | Schriftzug und Punkte links, Kasten mittig, Steuerleiste rechts. Die Bedienhilfe in der Pause entfällt |
| iPhone SE | Wie iPhone hoch, etwas kleinere Zellen |
| iPad und Rechner quer | Feste Seitenleiste mit allen Modi, Kasten und Steuerleiste rechts |

Der Kasten ist immer das größte Element. Die Gesten wirken auf der ganzen Bühne.

## Bewegung

| Moment | Gestaltung | Dauer |
|---|---|---|
| Neuer Stein | Blendet ein und setzt sich eine halbe Zelle von oben | 120 ms |
| Verschieben | Gleitet weich nach (Zeitkonstante 28 ms) | sofort spürbar |
| Drehen | Dreht sichtbar um die Mitte seines Kastens, auch mit Wandsprung | etwa 100 ms |
| Schneller fallen | Gleitet Reihe für Reihe nach (35 ms) | |
| Fallen lassen | Lichtband in den Spalten des Steins, der ganze Kasten gibt um bis zu 3 Punkte nach | 200 ms |
| Ablegen | Der Stein leuchtet kurz auf wie Lack im Licht | 240 ms |
| Reihen | Hellen auf, lösen sich von der Mitte nach außen Zelle für Zelle auf, dann rutscht alles darüber mit leichter Beschleunigung nach | 340 ms |
| Besondere Reihen | Schriftzug in Didot, zum Beispiel „Quart“, „T-Dreh Doppel“, darunter „Folge · Serie 2“ | 1,15 s |
| Neue Stufe | Welle von oben nach unten durch das Punktraster, „Stufe 4“ | 0,9 s |
| Ruhe, Kasten voll | Steine lösen sich von oben nach unten auf, „Neu geordnet“ | 0,85 s |
| Game Over | Reihe für Reihe von unten nach oben in Tinte, wie ein Vorhang | 0,75 s |

Bei „Bewegung reduzieren“ springen Steine ohne Gleiten und Drehen an ihr Ziel, Reihen verschwinden sofort.

## Klang

Holz auf Holz, gebaut auf der Klang-Engine der Hülle. Alle Klänge respektieren Ton aus, Klangfarbe und den Lautlos-Schalter.

| Klang | Aufbau |
|---|---|
| Verschieben | sehr leiser, heller Holzklick, höchstens alle 28 ms |
| Drehen | zwei kurze Klacks wie ein Stein, der in der Hand gewendet wird |
| Hindernis | kaum hörbares, dumpfes Klopfen |
| Schneller fallen | feines Rutschen |
| Ablegen | dumpfes Holz mit leisem Keramikton, beim harten Fall mit kurzem Gleiten davor |
| Reihen | je Reihe ein Keramikton, aufsteigend, mit der Serie höher. Quart schließt mit einer Glocke |
| Halten | Anheben und Ablegen |
| Neue Stufe | drei ruhige, helle Töne |
| Game Over | zwei ruhige, absteigende Töne |
| Ruhe, Kasten voll | langsam absteigender Lauf |
| Ziel erreicht | Dreiklang der Sammlung, bei Bestwert mit Glocke |

Auf Geräten mit Vibration gibt es einen kurzen Impuls beim harten Fall und bei Reihen.

## App-Symbol

Vier liegende Steine in der Wanne, darüber schwebt ein T über seiner Lücke. Gleiche Formensprache wie im Spiel. Quelle ist `icons/icon.svg`, erzeugt von `tools/icons.mjs`, daraus entstehen PNG-Dateien in 180, 192 und 512 Pixeln.
