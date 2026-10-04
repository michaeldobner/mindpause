# Spielregeln

[English version](../en/gameplay.md) · [Übersicht](README.md)

MÜHLE folgt den Turnierregeln des Weltmühlespiel-Dachverbands (WMD). Die Regeln wurden vor der Entwicklung recherchiert, die Quellen stehen am Ende.

## Das Brett

Drei ineinanderliegende Quadrate, in der Mitte jeder Seite durch Linien verbunden. Die Ecken und Mitten der Seiten ergeben **24 Punkte**. Drei Punkte auf einer Linie heißen **Mühle**, es gibt 16 davon: je vier Seiten auf jedem Quadrat und vier Querlinien. Im Stil Klassik stehen die Koordinaten am Rand, Spalten a bis g von links, Zeilen 1 bis 7 von unten. Der Punkt oben links heißt also a7, die Mitte des inneren Quadrats unten d3.

## Ablauf

| Phase | Regel |
|---|---|
| **Setzen** | Jede Seite hat 9 Steine. Weiß (im Stil Mitternacht Blau) beginnt, dann wird abwechselnd ein Stein aus der eigenen Schale auf einen freien Punkt gesetzt |
| **Ziehen** | Hat eine Seite alle Steine gesetzt, zieht sie einen eigenen Stein entlang einer Linie auf einen freien Nachbarpunkt. Springen über andere Steine gibt es nicht |
| **Springen** | Hat eine Seite nur noch 3 Steine, darf sie mit einem Stein auf jeden freien Punkt springen |

Die Phasen gelten für jede Seite einzeln: Es kann also eine Seite springen, während die andere noch zieht.

## Mühle und Nehmen

* Wer mit einem Zug drei eigene Steine in eine Linie bringt, schließt eine **Mühle** und nimmt der Gegenseite sofort einen Stein.
* Steine, die in einer geschlossenen Mühle stehen, sind **geschützt**. Nur wenn alle gegnerischen Steine in Mühlen stehen, darf auch einer davon genommen werden.
* Schließt ein Zug **zwei Mühlen zugleich** (Doppelmühle), wird trotzdem nur **ein** Stein genommen.
* Eine Mühle darf geöffnet und mit dem nächsten Zug wieder geschlossen werden. Das ist die berühmte **Zwickmühle**: Zwei Mühlen liegen so, dass ein Stein bei jedem Zug eine von beiden schließt.
* Genommene Steine sind aus dem Spiel und rollen in die Schale der Seite, die sie genommen hat.

## Spielende

| Ergebnis | Bedingung |
|---|---|
| Verloren | Eine Seite hat nur noch **zwei Steine** (auf dem Brett und in der Schale zusammen) |
| Verloren | Eine Seite ist am Zug und **kann nicht ziehen**, weil alle ihre Steine eingesperrt sind |
| Remis | Dieselbe Stellung mit derselben Seite am Zug kommt **dreimal** vor |
| Remis | **20 Züge je Seite** (40 Halbzüge) ohne Mühle, sobald beide Seiten alle Steine gesetzt haben |

Gut zu wissen: Mühle ist mathematisch gelöst. Ralph Gasser hat 1993 an der ETH Zürich gezeigt, dass das Spiel bei fehlerfreiem Spiel beider Seiten **remis** endet. Gegen die Stufe Schwer ist ein Remis deshalb ein gutes Ergebnis.

## Modi

| Modus | Beschreibung |
|---|---|
| Leicht | Der Computer rechnet zwei Halbzüge voraus und macht gelegentlich einen menschlichen Fehler. Eine Mühle lässt er trotzdem nicht liegen |
| Mittel | Vier Halbzüge voraus, kaum Fehler |
| Schwer | Rechnet so tief, wie es in einer Sekunde geht, meist acht bis zwölf Halbzüge |
| Zu zweit | Zwei Personen an einem Gerät, auf Wunsch dreht sich das Brett zur Person am Zug |

Gegen den Computer spielst du Weiß und beginnst. Ein Moduswechsel startet immer ein neues Spiel.

## Sterne

| Sterne | Siege in der Stufe |
|---|---|
| ★ | 1 |
| ★★ | 3 |
| ★★★ | 10 |

## Bedienung

| Aktion | So geht es |
|---|---|
| Stein setzen | Freien Punkt antippen. Der Stein fliegt aus deiner Schale aufs Brett |
| Stein ziehen | Eigenen Stein antippen, dann ein Ziel. Oder den Stein direkt auf das Ziel ziehen |
| Springen | Wie Ziehen, mit drei Steinen sind alle freien Punkte Ziele |
| Stein nehmen | Nach einer Mühle leuchtet sie auf, die Steine zum Nehmen pulsieren. Einen davon antippen |
| Tipp | Zeigt den besten Zug. Ist eine Mühle schon geschlossen, zeigt er den besten Stein zum Nehmen |
| Zurück | Nimmt deinen letzten Zug und die Antwort des Computers zurück. Bei offener Mühle nur den halben Zug |
| Neu | Startet sofort ein neues Spiel. Ein Tipp auf Zurück holt das alte zurück |

Kopfzeile: links der Modus, rechts die Steine beider Seiten (auf dem Brett und in der Schale) und wer gerade setzt, zieht, springt oder nimmt.

## Schalen

Jede Seite hat eine Schale, Weiß unten, Schwarz oben. Im Querformat bleibt Weiß unten, die Schalen stehen dann links (Schwarz) und rechts (Weiß). Darin liegen die eigenen Steine, die noch zu setzen sind, und die Steine, die man der Gegenseite genommen hat. Die Steine reagieren auf Antippen und Wischen und mit dem Schalter **Neigen** auf die Lage des Geräts.

## Einstellungen

Unter **Mehr**: Brettstil (Klassik oder Mitternacht), Ton und Klangfarbe, **Brett drehen** beim Spiel zu zweit, **Neigen**.

## Quellen der Recherche

* [Mühle Spielregeln, muehle-tricks.de](https://xn--mhle-tricks-thb.de/muehle-spielregeln/)
* [Mühle Lehrbuch, Dr. Rainer Rosenberger, muehlespieler.de](https://muehlespieler.de/download/muehle_lehrbuch.pdf)
* [Mühle Spielregeln, deep-muehle.de](https://deep-muehle.de/muehle-spielregeln)
* [Nine men's morris, Wikipedia](https://en.wikipedia.org/wiki/Nine_men%27s_morris)
* [Nine Men's Morris, Chessprogramming Wiki](https://www.chessprogramming.org/Nine_Men%E2%80%99s_Morris)
* [Calculating Ultra-Strong and Extended Solutions for Nine Men's Morris, arXiv](https://arxiv.org/pdf/1408.0032)
