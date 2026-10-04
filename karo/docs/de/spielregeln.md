# Spielregeln

[English version](../en/gameplay.md) · [Übersicht](README.md)

## Aufbau

| Bereich | Lage | Inhalt zu Beginn |
|---|---|---|
| **Stapel** | oben links (quer: links) | 24 verdeckte Karten |
| **Ablagestapel** | daneben | leer, hier landen gezogene Karten |
| **Ablagen** | oben rechts (quer: rechts) | leer, eine je Farbe: Pik, Herz, Kreuz, Karo |
| **Spalten** | darunter (quer: Mitte) | 7 Spalten mit 1 bis 7 Karten, nur die oberste liegt offen |

## Regeln

1. In den Spalten wird **absteigend** und **abwechselnd rot und schwarz** angelegt.
2. Eine geordnete Reihe offener Karten lässt sich **als Ganzes** verschieben.
3. Auf eine **leere Spalte** passt nur ein **König** (mit allem, was auf ihm liegt).
4. Auf den **Ablagen** wird je Farbe vom **Ass bis zum König** gesammelt.
5. Wird die oberste offene Karte einer Spalte bewegt, **dreht sich die nächste verdeckte Karte von allein um**.
6. Ein Tipp auf den **Stapel** zieht Karten. Ist er leer, wird der Ablagestapel **neu durchlaufen**.
7. Karten dürfen von den Ablagen **zurück** in eine Spalte, das kostet bei Windows Punkte.

**Ziel:** alle 52 Karten auf die Ablagen. Liegen alle Karten offen und ist der Stapel leer, wandern die restlichen Karten **von allein** auf die Ablagen.

## Ziehmodus

| Modus | Regel | Gefühl |
|---|---|---|
| **1 Karte** | Jede Karte im Stapel wird einzeln aufgedeckt | entspannt, gut planbar |
| **3 Karten** | Drei Karten werden aufgefächert, nur die oberste ist spielbar | deutlich schwerer, die Reihenfolge zählt |

Umschalten unter **Mehr** → **Drei Karten ziehen**. Ein laufendes Spiel endet dann, mit **Zurück** kommt es wieder.

## Punkte

### Windows (Standard)

| Ereignis | Punkte |
|---|---|
| Karte vom Ablagestapel auf eine Spalte | +5 |
| Karte auf eine Ablage | +10 |
| Verdeckte Karte aufgedeckt | +5 |
| Karte von der Ablage zurück in eine Spalte | −15 |
| Stapel neu durchlaufen, 1 Karte | −100 |
| Stapel neu durchlaufen, 3 Karten | ab dem 4. Durchgang −20 |
| Zeit | −2 je 10 Sekunden |
| Zeitbonus beim Sieg | 700 000 ÷ Sekunden (ab 30 Sekunden) |

Der Punktestand fällt nie unter null. Die Zeit läuft nur, solange gespielt wird: nicht vor dem ersten Zug, nicht im Hintergrund, nicht nach dem Ende.

### Vegas

| | |
|---|---|
| Einsatz | −52 zu Beginn jedes Spiels |
| Gewinn | +5 je Karte auf einer Ablage |
| Durchgänge | 1 Karte: nur ein Durchgang. 3 Karten: drei Durchgänge |
| Konto | Jedes Spiel zählt fürs **Vegas-Konto**, sobald es gewonnen oder verlassen wird |

Ein voller Sieg bringt +208. Einschalten unter **Mehr** → **Vegas**. Bei Vegas gilt die Lösbarkeitsgarantie der Stufen nur ohne die Grenze der Durchgänge.

## Stufen

| Stufe | Bedeutung | Punkte in der Auswahl (1 / 3 Karten) |
|---|---|---|
| **Leicht** | Ein naheliegender Weg führt zum Sieg | 1 / 2 |
| **Mittel** | Etwas Planung nötig | 2 / 3 |
| **Schwer** | Vorausdenken nötig | 3 / 4 |
| **Meisterhaft** | Ein schmaler Pfad, wenige Lösungen | 4 / 5 |
| **Tagesspiel** | Jeden Tag ein Spiel aus „Mittel“, für alle gleich | 2 / 3 |
| **Zufall** | Echt zufällig, ohne Garantie. Steckt man fest, verrät KARO, ob das Spiel lösbar war | |

Alle Stufen außer Zufall sind **sicher lösbar**. Wie das funktioniert: [Stufen](stufen.md).

## Sterne

| Sterne | Bedingung |
|---|---|
| ★★★ Makellos | gelöst ohne Zurück und ohne Tipp |
| ★★ Sehr gut | gelöst ohne Tipp |
| ★ Gelöst | gelöst |

Die Auswahl zeigt die besten Sterne je Stufe für den aktuellen Ziehmodus. Gespeichert werden außerdem Spiele, Siege und der beste Punktestand.

## Bedienung

| Geste | Wirkung |
|---|---|
| **Tippen** auf eine offene Karte | Sie springt an den besten Platz: zuerst auf eine Ablage, sonst auf eine passende Spalte. Geht nichts, wackelt sie kurz |
| **Tippen** auf eine Karte mitten in einer Spalte | Die Reihe ab dieser Karte wird verschoben |
| **Ziehen** | Karte oder Reihe auf ein Ziel ziehen und loslassen |
| **Tippen auf den Stapel** | Karten ziehen oder neu durchlaufen |
| **Tipp** | Der nächste richtige Zug leuchtet golden auf |
| **Zurück** | Beliebig viele Züge zurück. Direkt nach **Neu** holt Zurück das vorherige Spiel |
| **Neu** | Nächstes Spiel derselben Stufe |
| Tippen während der Siegesfeier | beendet die Feier |

Steckt man fest, erscheint **Keine Züge mehr** mit der Wahl zwischen Zurücknehmen und neuem Spiel.
