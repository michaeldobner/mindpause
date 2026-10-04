# Klangdesign

[English version](../en/sound.md) · [Übersicht](README.md)

## Ziel

Eine Keramikmurmel landet auf einem Holzbrett: warm, rund, mit einem kurzen hellen Klingen und einem Hauch Raum. Wie ein gutes Objekt im Wohnzimmer, nicht wie ein Spielautomat.

Alle Klänge entstehen live im Browser mit der Web Audio API. Die Klang-Engine mit Mastering, Klangfarben und den Bausteinen Anschlag, Holz und Keramik gehört der Hülle (`shared/js/sound-engine.js`) und steht allen Spielen zur Verfügung. Die Klänge von SPRING (Anheben, Landen, Rand) stehen in `spring/js/sound.js`. Es gibt keine Audiodateien, dadurch ist SPRING klein, offline vollständig und jeder Klang lässt sich genau stimmen.

## Aufbau eines Sprungklangs

| Schicht | Hörbar als | Umsetzung | Dauer |
|---|---|---|---|
| 1. Anschlag | Präziser Kontakt | Rauschen, nur hohe Frequenzen (Hochpass 3,5 kHz) | 4 ms |
| 2. Holz | Warmes, rundes „Tock“ | Sinuston um 190 Hz, Tonhöhe fällt leicht ab | 60 ms |
| 3. Keramik | Helles, edles Klingen | Drei Teiltöne im Verhältnis 1 : 2,76 : 5,4 mit 100 %, 32 % und 10 % Lautstärke | 160, 85, 45 ms |
| 4. Raum | Weite, kein Hall-Effekt | Faltungshall mit künstlich erzeugtem Raum von 0,55 s | Anteil je nach Klangfarbe |

Das Teiltonverhältnis 1 : 2,76 : 5,4 entspricht einem frei schwingenden Klangkörper. Es klingt nach Keramik oder Glas statt nach elektronischem Piepen.

## Stimmung

* Die Keramik ist auf die **Dur-Pentatonik** gestimmt (Grundton c'' bei 523,25 Hz). Pentatonische Töne klingen in jeder Reihenfolge harmonisch, auch schnell hintereinander.
* **Das Spiel wird zur Melodie:** Vom ersten Zug bis zur letzten Murmel steigt der Ton schrittweise über zehn Stufen der Leiter, also knapp zwei Oktaven.
* **Lebendigkeit:** Jeder Klang variiert zufällig um ±2 % in der Tonhöhe und ±12 % in der Lautstärke. So klingt kein Sprung exakt wie der vorige.

## Alle Klänge

| Moment | Klang | Spitzenpegel |
|---|---|---|
| Murmel anheben | Fast unhörbares, weiches Tippen | etwa −40 dB |
| Sprung landet | Vier Schichten, Tonhöhe nach Fortschritt | etwa −12 dB |
| Zurück | Wie Landung, leiser und zwei Stufen tiefer | etwa −17 dB |
| Murmel rollt in den Rand | Tieferes Holz, sanftes Keramik-Klicken | etwa −21 dB |
| Murmeln stoßen im Rand an | Feiner Klick, Lautstärke nach Aufprall | −25 bis −35 dB |
| Ungültige Murmel | Zwei gedämpfte, tiefe Holzklopfer | etwa −19 dB |
| Figur gelöst | Aufsteigender Dreiklang mit langem Ausklang | etwa −11 dB |
| Meisterhaft | Zusätzlich ein vierter Ton und ein Glockenton | etwa −10 dB |

Die Pegel wurden mit einem `OfflineAudioContext` gemessen. Der lauteste Klang liegt bei etwa −10 dB, es gibt also genug Reserve und keine Übersteuerung.

## Mastering

Alle Klänge laufen durch dieselbe Kette:

```
Klänge ─┬─► trocken ──────────┐
        └─► Raum (Faltung) ───┴─► Tiefpass ─► Kompressor ─► Gesamtlautstärke ─► Lautsprecher
```

| Stufe | Einstellung | Zweck |
|---|---|---|
| Tiefpass | 5,2 bis 10 kHz je nach Klangfarbe | Nimmt Schärfe aus den Höhen, wichtig für kleine Lautsprecher |
| Kompressor | Schwelle −18 dB, Verhältnis 3 : 1, Attack 3 ms, Release 120 ms | Hält Spitzen zusammen, klingt voller |
| Gesamtlautstärke | 0,8 | Reserve gegen Übersteuerung |

## Klangfarben

| Klangfarbe | Holz | Keramik | Raum | Tiefpass | Charakter |
|---|---|---|---|---|---|
| **Warm** (Standard) | 100 % | 55 % | 10 % | 7 kHz | Rund, erdig, ruhig |
| **Klar** | 55 % | 100 % | 9 % | 10 kHz | Hell, präzise, glasig |
| **Weich** | 75 % | 60 % | 24 % | 5,2 kHz | Gedämpft, mit mehr Raum |

Die Auswahl in den Einstellungen spielt sofort eine kurze Vorschau aus drei aufsteigenden Sprüngen.

## Damit es nicht nervt

* Höchstens 8 Klicks pro Sekunde aus dem Rand und mindestens 45 ms Abstand zwischen zwei Klicks.
* Sehr sanfte Stöße bleiben stumm.
* Kein Dauergeräusch: Rollen ist lautlos, nur Stöße sind zu hören, auch beim Neigen.
* SPRING respektiert den **Lautlos-Schalter** des iPhones (`navigator.audioSession.type = 'ambient'`, wo verfügbar).
* iOS gibt Ton nur beim Loslassen des Fingers oder bei einem vollständigen Tipp frei und hält ihn nach einem App-Wechsel wieder an. SPRING prüft deshalb bei jeder solchen Berührung, ob der Ton läuft, setzt ihn bei Bedarf fort und spielt dazu einen stillen Klang, der Safari zuverlässig freischaltet.

## Anpassen

Alle Werte stehen am Anfang von `shared/js/sound-engine.js`. Eine Änderung dort wirkt in allen Spielen:

| Konstante | Bedeutung |
|---|---|
| `PENTATONIC` | Tonleiter in Halbtönen |
| `BASE_HZ` | Grundton der Keramik |
| `CERAMIC_RATIOS`, `CERAMIC_GAINS`, `CERAMIC_DECAYS` | Teiltöne der Keramik |
| `SOUND_STYLES` | Die drei Klangfarben |

Eine neue Klangfarbe ist ein weiterer Eintrag in `SOUND_STYLES` plus ein Knopf in der Segmentauswahl in `shared/js/shell.js` und eine Übersetzung unter `styles` in `shared/js/i18n.js`. Sie steht dann in allen Spielen zur Wahl.
