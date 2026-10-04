# Design-System

[English version](../en/design.md) · [Übersicht](README.md)

## Leitidee

Ein **hochwertiges Kartenspiel, das auf einer Leinenmatte liegt.** Vorbild ist die Stimmung klassischer Designer-Kartendecks: Schiefer, Goldprägung, Harlekin-Rauten, Art déco. Alles ist flach und grafisch, aber mit Papiergefühl. Das Deck ist eigens für KARO gezeichnet.

| Grundsatz | Bedeutung |
|---|---|
| **Lesbarkeit zuerst** | Jede Karte hat eine Kopfzeile mit großem Wert und Farbsymbol. In den Spalten sieht man oft nur diesen Streifen |
| **Greifbarkeit** | Weiche Schatten, Drehung beim Aufdecken, Karten fliegen über die anderen |
| **Ruhe** | Kurze, weiche Bewegungen. Die Siegesfeier ist eine langsame Hommage, kein Feuerwerk |
| **Verlässlichkeit** | Ein Tipp genügt. Was versehentlich passiert, macht Zurück rückgängig |

## Farben

### Deck und Matte (gleich in Hell und Dunkel)

| Rolle | Hex |
|---|---|
| Matte | `#26343a` → `#172025`, Leinenstruktur, Goldlinie am Rand |
| Prägung, Rahmen | `#c9a961` |
| Papier | `#fbf8f2` |
| Creme | `#f4ecdc` |
| Rückseite | Petrol `#1f5a50`, Orange `#e08a3c`, Himmelblau `#3e9ad3`, Creme |
| Rote Farben | Zinnober `#c63b2c` |
| Schwarze Farben | Tinte `#1c1d2a` |
| Bildkarten | Rost `#b5532a`, Indigo `#454c96`, Ocker `#d9a441`, Petrol |

Die Oberfläche um die Matte nutzt die Design-Tokens der Sammlung aus `shared/tokens.css`.

## Typografie

| Rolle | Schrift |
|---|---|
| Schriftzug KARO, Punkte | Didot, Bodoni 72, Ersatz Georgia (aus der Hülle) |
| Werte auf den Karten | Didot fett. Auf Deutsch B, D, K, auf Englisch J, Q, K |

## Das Deck

| Teil | Gestaltung |
|---|---|
| **Rückseite** | Rauten im Harlekin-Muster: Petrol im Schachbrett, dazwischen Bahnen aus Creme, Orange und Blau, mit cremefarbenem Rand |
| **Kopfzeile** | links groß der Wert, rechts das Farbsymbol, lesbar schon bei 14 % der Kartenhöhe |
| **Farbsymbole** | eigene Zeichnung, weicher und runder als üblich, gefüllt auf den Karten, als Goldkontur auf leeren Ablagen |
| **Zahlkarten** | klassische Anordnung, untere Hälfte gedreht, viel Weißraum |
| **Asse** | großes Symbol im doppelten Rautenrahmen aus Gold. Das Pik-Ass trägt als Signatur einen Strahlenkranz |
| **Bildkarten** | gespiegelte Figuren in einem Goldrahmen auf Creme mit Punktraster |

### Formensystem der Bildkarten

| Element | König | Dame | Bube |
|---|---|---|---|
| Kopf | Krone mit Stufen, Bart | Bogenkrone mit Perlen, langes Haar | Barett mit Feder |
| Attribut | Zepter | Blüte | Schlüssel |

| Farbe | Gewand | Muster |
|---|---|---|
| Pik | Indigo | Winkel |
| Herz | Rost | Halbkreise |
| Kreuz | Petrol | Punkte |
| Karo | Ocker | Rauten |

Alle Figuren haben **geschlossene Augen**: ruhig und meditativ, das Erkennungszeichen des Decks.

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
