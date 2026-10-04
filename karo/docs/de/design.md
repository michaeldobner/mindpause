# Design-System

[English version](../en/design.md) · [Übersicht](README.md)

## Leitidee

Ein **hochwertiges Kartenspiel, das auf einer Leinenmatte liegt.** Vorbild sind klassische Designer-Kartendecks: reinweißes Papier, feine Didot-Indizes, große, diagonal liegende Bildkarten mit Musterbändern, Harlekin-Rauten auf der Rückseite. Alles ist flach und grafisch. Das Deck ist eigens für KARO gezeichnet.

| Grundsatz | Bedeutung |
|---|---|
| **Lesbarkeit zuerst** | Der Index oben links ist groß genug, um auch im schmalen Streifen der Spalten lesbar zu sein |
| **Greifbarkeit** | Weiche Schatten, Drehung beim Aufdecken, Karten fliegen über die anderen |
| **Ruhe** | Kurze, weiche Bewegungen. Die Siegesfeier ist eine langsame Hommage, kein Feuerwerk |
| **Verlässlichkeit** | Ein Tipp genügt. Was versehentlich passiert, macht Zurück rückgängig |

## Farben

### Deck und Matte (gleich in Hell und Dunkel)

| Rolle | Hex |
|---|---|
| Matte | `#26343a` → `#172025`, Leinenstruktur, Goldlinie am Rand |
| Prägung der Matte | `#c9a961` |
| Papier | `#fdfcf9` |
| Creme | `#f4ecdc` |
| Rückseite | Petrol `#1e5c52`, Orange `#e39a4a`, Himmelblau `#4aa0d8`, Creme `#f2e8d6` |
| Rote Farben | Zinnober `#c8382b` |
| Schwarze Farben | Tinte `#1b1c26` |
| Bildkarten | Taubenblau `#6f78b8` mit Marine `#2b3070`, Rost `#c0652f` mit Zinnober, Petrol `#2f6b5c` mit Ocker, Ocker `#d9a441` mit Orange |

Die Oberfläche um die Matte nutzt die Design-Tokens der Sammlung aus `shared/tokens.css`.

## Typografie

| Rolle | Schrift |
|---|---|
| Schriftzug KARO, Punkte | Didot, Bodoni 72, Ersatz Georgia (aus der Hülle) |
| Index auf den Karten | Didot regulär mit hauchdünner Kontur, Wert über der Farbe, oben links und gedreht unten rechts. Auf Deutsch B, D, K, auf Englisch J, Q, K |

## Das Deck

| Teil | Gestaltung |
|---|---|
| **Papier** | reinweiß, ohne Rahmen, viel Weißraum |
| **Rückseite** | längliche Rauten in diagonalen Bahnen: Petrol, dazwischen Creme mit Orange und Creme mit Himmelblau, schmaler weißer Rand |
| **Index** | Wert über der Farbe, oben links und gedreht unten rechts, lesbar im Streifen von einem Drittel der Kartenhöhe |
| **Farbsymbole** | klassisch, leicht weich gezeichnet, gefüllt auf den Karten, als Goldkontur auf leeren Ablagen |
| **Zahlkarten** | klassische Anordnung, untere Hälfte gedreht |
| **Asse** | ein einzelnes Symbol auf weißem Grund. Das Pik-Ass trägt als Signatur die Muster der Bildkarten: Sägezahnkranz, Punktreihe, Wellenlinie |
| **Bildkarten** | große Figuren über die ganze Karte, um 28° diagonal gelegt: ein Kopf oben rechts, der gespiegelte unten links |

### Formensystem der Bildkarten

Jede Figur trägt ein Gewand als langes Sechseck mit Streifen in Creme und der Akzentfarbe entlang der Kanten. Kragen und Muster unterscheiden die Ränge:

| Element | König | Dame | Bube |
|---|---|---|---|
| Gewand | breit und kantig | schmal an den Schultern | schlank |
| Kragen | schwarzes Band mit Zickzack nach beiden Seiten | schwarzes Band mit Sägezahn | schwarzes Band mit Wimpeln |
| Musterband | Schachbrett | Punktreihe mit weißem Kern | Kordel |
| Seiten | runde Scheiben aus Bögen | schwarze Linsen mit Wellenlinie | Fischgrät |
| Mitte | Sechseck mit Ocker | Raute | Kreis |
| Kopf | Krone mit Stufen, Bart | Haube in der Gewandfarbe, kleine Krone seitlich | hohe Kappe mit Punktband |
| Attribut | Zepter | Blüte | Schwert |

| Farbe | Gewand | Akzent |
|---|---|---|
| Pik | Taubenblau | Marine |
| Herz | Rost | Zinnober |
| Kreuz | Petrol | Ocker |
| Karo | Ocker | Orange |

Die Gesichter sind feine Linienzeichnungen: halb geöffnete Augen mit gesenktem Blick, schmale Brauen, lange Nase, kleiner roter Mund. Ruhig und in sich gekehrt, das Erkennungszeichen des Decks.

## Layouts

| Gerät | Anordnung |
|---|---|
| iPhone hoch, iPad hoch | Stapel und Ablagestapel oben links, Ablagen oben rechts, sieben Spalten darunter |
| iPhone quer, iPad quer | Stapel links mit Ablagestapel darunter, sieben Spalten in der Mitte, Ablagen rechts untereinander |

Die Kartengröße ergibt sich aus dem Platz. Wird eine Spalte zu lang, rücken ihre Karten enger zusammen.

## Bewegung

| Vorgang | Dauer |
|---|---|
| Karte bewegen | 0,3 s, fliegt über den anderen |
| Aufdecken | 0,32 s, Drehung in 3D |
| Geben | Karte für Karte im Abstand von 32 ms |
| Automatisch beenden | eine Karte alle 120 ms |
| Siegesfeier | eine Karte alle 240 ms, Schwerkraft, Abprallen, verblassende Spuren |

Bei „Bewegung reduzieren“ entfällt die Siegesfeier und Bewegungen sind sofort am Ziel.

## Klang

Papier statt Keramik, gebaut auf der Klang-Engine der Hülle:

| Klang | Aufbau |
|---|---|
| Ziehen | kurzes, helles Rauschen, nach oben gleitend |
| Ablegen | tiefes, weiches Rauschen mit leisem Holzanschlag |
| Aufdecken | zwei kurze Papierlaute |
| Ablage | Ablegen plus Keramikton der Sammlung, der mit dem Fortschritt steigt |
| Neu durchlaufen | gleitendes Rauschen |
| Neues Spiel | Riffeln aus 14 kurzen Lauten |
| Sieg | Dreiklang der Sammlung |
