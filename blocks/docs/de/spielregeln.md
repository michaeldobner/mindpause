# Spielregeln

[English version](../en/gameplay.md) · [Übersicht](README.md)

## Ziel

Steine vom Tablett aufs Brett legen und dabei Reihen und Spalten füllen. Eine volle Reihe oder Spalte verschwindet.

* **Im Level:** alle schwarzen Startsteine abräumen und das Punkteziel erreichen.
* **In den freien Modi:** möglichst viele Punkte, bis kein Stein mehr passt.

Das Spiel endet, wenn keiner der Steine auf dem Tablett mehr aufs Brett passt.

## Ablauf

1. Auf dem Tablett liegen drei Steine. Jeder wird einmal aufs Brett gezogen, in beliebiger Reihenfolge.
2. Steine lassen sich **nicht drehen**. Jede Lage ist ein eigener Stein.
3. Sind alle drei gelegt, kommen drei neue.
4. Nach jedem Stein werden alle vollen Reihen und Spalten **gleichzeitig** entfernt. Ein Feld, das in einer vollen Reihe und einer vollen Spalte liegt, zählt nur einmal.
5. Passt keiner der übrigen Steine mehr, ist das Spiel vorbei. Steine, die nicht mehr passen, erscheinen auf dem Tablett blass.

## Level

30 Level in sechs Kapiteln zu je fünf. Jedes Level hat ein festes Startbrett aus **schwarzen Startsteinen** und eine feste Steinfolge, gleiches Level heißt also immer gleiche Aufgabe.

| | |
|---|---|
| Ziel | Alle Startsteine abräumen **und** das Punkteziel erreichen. Beides zusammen beendet das Level sofort |
| Startsteine | Liegen wie normale Steine und verschwinden, sobald ihre Reihe oder Spalte voll ist |
| Anzeige | Über dem Brett: Punkte von Ziel, daneben ein schwarzer Stein mit der Zahl der übrigen Startsteine |
| Sterne | ★ geschafft, ★★ mit höchstens anderthalb mal so vielen Steinen wie der Richtwert, ★★★ mit höchstens so vielen Steinen |
| Freischalten | Ein geschafftes Level schaltet das nächste frei. Geschaffte Level lassen sich jederzeit wiederholen, gespeichert wird das beste Ergebnis |
| Fairness | Die ersten drei Steine passen immer. In den Kapiteln 1 bis 4 passen alle drei Steine jedes Tabletts in irgendeiner Reihenfolge, in Kapitel 5 und 6 mindestens einer |

**Richtwert:** Jedes Level wurde beim Erzeugen vom Computerspieler durchgespielt, der immer dem Tipp folgt. Jedes Level ist also lösbar. Seine Zahl an Steinen ist der Richtwert für drei Sterne. Die Ergebniskarte nennt ihn, solange drei Sterne fehlen.

### Schwierigkeit

Die Kurve folgt dem Sägezahn, wie er sich bei Denkspielen bewährt hat: Innerhalb eines Kapitels wird es schwerer, zu Beginn des nächsten Kapitels etwas leichter, damit neue Formen in Ruhe ankommen, danach steigt es höher als zuvor.

| Kapitel | Level | Startbrett belegt | Punkteziel | Neue Formen |
|---|---|---|---|---|
| 1 | 1 bis 5 | 22 bis 32 % | 150 bis 350 | Punkt, Zweier, Dreier, kleine Ecke, Quadrat 2 × 2 |
| 2 | 6 bis 10 | 27 bis 37 % | 350 bis 550 | Vierer, L und J, T |
| 3 | 11 bis 15 | 32 bis 42 % | 600 bis 800 | S und Z, Fünfer |
| 4 | 16 bis 20 | 36 bis 46 % | 900 bis 1 100 | Große Ecke, Rechteck 2 × 3 |
| 5 | 21 bis 25 | 40 bis 50 % | 1 250 bis 1 450 | Quadrat 3 × 3, alle Formen |
| 6 | 26 bis 30 | 44 bis 54 % | 1 650 bis 1 850 | alle Formen |

Die Startbretter sind spiegelsymmetrisch und haben nie eine volle Reihe oder Spalte.

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

## Freie Modi

Neben den Leveln gibt es drei freie Modi ohne Ziel, nur mit Punkten:

| Modus | Brett | Start | Tablett | Ende | Sterne |
|---|---|---|---|---|---|
| **Klassisch** | 8 × 8 | 15 % belegt | Mindestens ein neuer Stein passt | Kein Stein passt mehr | ★ ab 1 500, ★★ ab 5 000, ★★★ ab 12 000 |
| **Weit** | 10 × 10 | 15 % belegt | Mindestens ein neuer Stein passt | Kein Stein passt mehr | ★ ab 2 500, ★★ ab 8 000, ★★★ ab 20 000 |
| **Ruhe** | 8 × 8 | 20 % belegt | Alle drei Steine passen in irgendeiner Reihenfolge | Nie. Passt nichts mehr, räumt sich das Brett auf | keine |

In jedem Modus passen die ersten drei Steine sicher. Das Startbrett ist zufällig, aber nie mit voller Linie.

Die Grenzen der Sterne stammen aus Spielen eines einfachen Computerspielers (`tools/bot.mjs`), der immer dem Tipp folgt. Er erreicht im Modus Klassisch im Mittel etwa 3 700 Punkte.

Bestwerte, Sterne und der Fortschritt der Level werden auf dem Gerät gespeichert und in der Auswahl angezeigt. Wer BLOCKS auf den Home-Bildschirm legt, behält seinen Stand dauerhaft.

## Zurück, Tipp und Neu

* **Zurück** nimmt den letzten Stein zurück, ein Schritt. Ein geschafftes Level bleibt geschafft. Nach einem verlorenen Spiel geht Zurück auch nach dem Ende („Letzten Zug zurücknehmen“ auf der Ergebniskarte). Die Steine danach bleiben dieselben, Zurück bringt also keine neuen Steine.
* **Tipp** zeigt einen guten Platz als goldenen Umriss und lässt das Fach des Steins leuchten. Der Tipp bevorzugt Linien, im Level abgeräumte Startsteine, Kontakt zu Rand und Steinen, wenig eingeschlossene Lücken und Plätze, nach denen die übrigen Steine noch passen.
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
