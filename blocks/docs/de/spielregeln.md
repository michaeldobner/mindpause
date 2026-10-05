# Spielregeln

[English version](../en/gameplay.md) · [Übersicht](README.md)

## Ziel

Auf einem quadratischen Brett möglichst lange Steine legen und dabei Reihen und Spalten füllen. Eine volle Reihe oder Spalte verschwindet. Das Spiel endet, wenn keiner der Steine auf dem Tablett mehr aufs Brett passt.

## Ablauf

1. Auf dem Tablett liegen drei Steine. Jeder wird einmal aufs Brett gezogen, in beliebiger Reihenfolge.
2. Steine lassen sich **nicht drehen**. Jede Lage ist ein eigener Stein.
3. Sind alle drei gelegt, kommen drei neue.
4. Nach jedem Stein werden alle vollen Reihen und Spalten **gleichzeitig** entfernt. Ein Feld, das in einer vollen Reihe und einer vollen Spalte liegt, zählt nur einmal.
5. Passt keiner der übrigen Steine mehr, ist das Spiel vorbei. Steine, die nicht mehr passen, erscheinen auf dem Tablett blass.

## Die Formen

13 Formen in 37 Lagen. Gezogen wird mit Gewichten, kleine und mittlere Steine kommen häufiger. Das Gewicht einer Form verteilt sich auf ihre Lagen, damit Formen mit vielen Lagen nicht öfter erscheinen.

| Form | Felder | Lagen | Gewicht |
|---|---|---|---|
| Punkt | 1 | 1 | 3 |
| Zweier, Dreier, Vierer, Fünfer gerade | 2 bis 5 | je 2 | 6, 6, 5, 3 |
| Kleine Ecke | 3 | 4 | 6 |
| Quadrat 2 × 2 | 4 | 1 | 6 |
| Quadrat 3 × 3 | 9 | 1 | 2 |
| Rechteck 2 × 3 | 6 | 2 | 3 |
| T | 4 | 4 | 4 |
| S und Z | 4 | 4 | 4 |
| L und J | 4 | 8 | 6 |
| Große Ecke | 5 | 4 | 4 |

## Punkte

| Ereignis | Punkte |
|---|---|
| Stein legen | 1 je Feld |
| 1, 2, 3, 4, 5 … Linien auf einmal | 20, 60, 120, 200, 300 … (10 × n × (n + 1)), mal Serie |
| Leer geräumt | 300 zusätzlich, wenn das Brett danach ganz leer ist |

**Serie:** Jeder Stein, der etwas abräumt, erhöht die Serie um eins, die Punkte für Linien werden mit ihr multipliziert. Die Serie reißt erst, wenn **drei Steine nacheinander** nichts abräumen. Drei Punkte neben der Serie über dem Brett zeigen, wie viele Steine noch bleiben.

**Beispiel:** Serie 3, ein Vierer räumt zwei Reihen ab: 4 + 60 × 3 = 184 Punkte.

## Modi

| Modus | Brett | Tablett | Ende | Sterne |
|---|---|---|---|---|
| **Klassisch** | 8 × 8 | Mindestens ein neuer Stein passt | Kein Stein passt mehr | ★ ab 1 500, ★★ ab 5 000, ★★★ ab 12 000 |
| **Weit** | 10 × 10 | Mindestens ein neuer Stein passt | Kein Stein passt mehr | ★ ab 2 500, ★★ ab 8 000, ★★★ ab 20 000 |
| **Ruhe** | 8 × 8 | Alle drei Steine passen in irgendeiner Reihenfolge | Nie. Passt nichts mehr, räumt sich das Brett auf | keine |

Die Grenzen der Sterne stammen aus Spielen eines einfachen Computerspielers (`tools/bot.mjs`), der immer dem Tipp folgt. Er erreicht im Modus Klassisch im Mittel etwa 4 000 Punkte.

Bestwerte und Sterne werden je Modus auf dem Gerät gespeichert und in der Modusauswahl angezeigt.

## Zurück, Tipp und Neu

* **Zurück** nimmt den letzten Stein zurück, ein Schritt. Das geht auch nach dem Ende („Letzten Zug zurücknehmen“ auf der Ergebniskarte). Die Steine danach bleiben dieselben, Zurück bringt also keine neuen Steine.
* **Tipp** zeigt einen guten Platz als goldenen Umriss und lässt das Fach des Steins leuchten. Der Tipp bevorzugt Linien, Kontakt zu Rand und Steinen, wenig eingeschlossene Lücken und Plätze, nach denen die übrigen Steine noch passen.
* **Neu** beginnt sofort ein neues Spiel. Ein Zurück direkt danach holt das alte Spiel zurück.
* Das Spiel wird nach jedem Stein gespeichert und geht beim nächsten Start dort weiter.

## Bedienung

| iPhone und iPad | Rechner | Wirkung |
|---|---|---|
| Stein vom Tablett ziehen | Ziehen mit der Maus oder 1, 2, 3 | Stein wählen |
| Loslassen über dem Brett | Pfeile, dann Enter oder Leertaste | Stein legen |
| Loslassen daneben | Escape | Stein zurück aufs Tablett |
| **Zurück** | Z, Rücktaste oder Strg+Z | letzten Stein zurücknehmen |
| **Tipp** | H | guten Platz zeigen |

Beim Ziehen mit dem Finger schwebt der Stein knapp eine Zelle über dem Finger, damit er sichtbar bleibt. Er rastet auf dem nächsten Platz ein, an dem er passt, wenn dieser höchstens eine dreiviertel Zelle entfernt ist. Reihen und Spalten, die verschwinden würden, leuchten vorab auf (abschaltbar unter **Mehr > Linien vorab zeigen**).
