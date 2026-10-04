# Spielregeln und Bedienung

[English version](../en/gameplay.md) · [Übersicht](README.md)

## Inhalt

* [Das Brett](#das-brett)
* [Regeln der Deutschen Dame](#regeln-der-deutschen-dame)
* [Spielende und Remis](#spielende-und-remis)
* [Modi](#modi)
* [Sterne und Statistik](#sterne-und-statistik)
* [Bedienung](#bedienung)
* [Die Schalen](#die-schalen)
* [Einstellungen](#einstellungen)
* [Installation auf iPhone und iPad](#installation-auf-iphone-und-ipad)
* [Tipps für Einsteiger](#tipps-für-einsteiger)

## Das Brett

Gespielt wird auf einem Brett mit 8×8 Feldern, aber nur auf den 32 dunklen Feldern. Jede Seite beginnt mit 12 Steinen auf den dunklen Feldern ihrer ersten drei Reihen. **Weiß** sitzt unten und beginnt, **Schwarz** sitzt oben. Im Brettstil Mitternacht heißt die untere Seite **Blau**. Die beiden mittleren Reihen sind zu Beginn frei.

Gegen den Computer spielst du immer die untere Seite, also Weiß oder Blau.

## Regeln der Deutschen Dame

| Regel | Bedeutung |
|---|---|
| Ziehen | Ein Stein zieht ein Feld diagonal **vorwärts** auf ein freies Feld |
| Schlagen | Ein Stein springt diagonal über einen gegnerischen Stein auf das freie Feld direkt dahinter. Steine schlagen **vorwärts und rückwärts** |
| Schlagpflicht | Kann eine Seite schlagen, **muss** sie schlagen. Gibt es mehrere Schlagmöglichkeiten, ist die Wahl frei. Es muss nicht der längste Schlag sein |
| Mehrfachschlag | Kann der Stein nach einem Sprung weiterschlagen, muss er weiterspringen, bis kein Schlag mehr möglich ist. Ein Stein darf dabei nicht zweimal übersprungen werden. Geschlagene Steine verschwinden erst am Ende des Zugs |
| Dame | Endet der Zug eines Steins auf der gegnerischen Grundreihe, wird er zur **Dame** und trägt eine gravierte goldene Krone. Erreicht ein Stein die Grundreihe mitten in einem Mehrfachschlag und kann weiterschlagen, springt er als einfacher Stein weiter und wird nicht gekrönt |
| Fliegende Dame | Eine Dame zieht diagonal vorwärts und rückwärts über **beliebig viele freie Felder**. Sie schlägt einen gegnerischen Stein aus der Ferne und darf auf jedem freien Feld dahinter landen |

QUEEN prüft alle Regeln selbst. Du kannst keinen ungültigen Zug machen, und das Spiel zeigt dir beim Antippen eines Steins alle erlaubten Ziele.

## Spielende und Remis

| Ergebnis | Wann |
|---|---|
| Sieg | Die Gegenseite kann nicht mehr ziehen, weil sie keine Steine mehr hat oder alle blockiert sind |
| Remis durch Wiederholung | Dieselbe Stellung mit derselben Seite am Zug entsteht zum dritten Mal |
| Remis durch Stillstand | 30 Halbzüge in Folge, in denen nur Damen ziehen und nichts geschlagen wird |
| Aufgeben | Eine Seite gibt auf, die andere gewinnt |

Ein Halbzug ist der Zug einer Seite. 30 Halbzüge sind also 15 Züge je Seite.

## Modi

| Modus | Gegner | Spielweise |
|---|---|---|
| **Einsteiger** | Computer | Schaut nur auf den eigenen Zug, nie auf deine Antwort. Lässt Steine ungeschützt stehen und fällt auf einfache Schlagfallen herein. Zum Lernen der Regeln |
| **Leicht** | Computer | Schaut zwei Halbzüge voraus, übersieht aber oft, was nach einem Schlag folgt, und ist jeden zweiten Zug unaufmerksam. Für Gelegenheitsspiele |
| **Mittel** | Computer | Rechnet vier Halbzüge voraus und Schlagabtausch meist zu Ende, ist aber ab und zu unaufmerksam. Ein ernsthafter Gegner |
| **Schwer** | Computer | Rechnet so tief, wie es in knapp einer Sekunde geht, und spielt immer den besten gefundenen Zug |
| **Zu zweit** | Mensch | Zwei Personen spielen abwechselnd an einem Gerät |

Den Modus wählst du jederzeit über die Schaltfläche **Modi** (auf dem iPad quer in der Seitenleiste). Ein Wechsel beginnt immer ein neues Spiel. Jeder Modus hat eine eigene Statistik.

<img src="../images/iphone-modes-de.jpg" width="260" alt="Modus wählen">

Die Stufen sind so abgestimmt, dass jede die nächstschwächere klar schlägt, in Testpartien in rund 85 bis 90 % der Spiele. Die Fehler der niedrigen Stufen sollen menschlich wirken: Der Computer übersieht Dinge, er verschenkt nicht plötzlich absichtlich einen Stein.

### Der Zug des Computers

Während der Computer rechnet, steht oben „Schwarz denkt“, mindestens 0,7 Sekunden lang. Dann hebt sich der Stein, der ziehen wird, sichtbar an und zieht ruhig ins Ziel, bei einem Mehrfachschlag Sprung für Sprung. Jeder übersprungene Stein verblasst sofort und rollt danach in die Schale. Start- und Zielfeld des letzten Zugs bleiben dezent aufgehellt, bis wieder gezogen wird. So lässt sich jeder Zug auch nach einem kurzen Wegschauen nachvollziehen.

## Sterne und Statistik

Sterne gibt es für Siege gegen den Computer, je Stufe getrennt:

| Sterne | Siege in dieser Stufe |
|---|---|
| ★ | 1 |
| ★★ | 3 |
| ★★★ | 10 |

Zu jedem Modus zählt QUEEN Spiele, Siege, Niederlagen und Remis. Beim Spiel zu zweit gibt es keine Sterne, die Ergebniskarte nennt die Siegerfarbe.

Gewinnst du gegen Einsteiger, Leicht oder Mittel, bietet die Ergebniskarte **Nächste Stufe** an.

<img src="../images/iphone-result-de.jpg" width="260" alt="Ergebniskarte nach einem Sieg">

## Bedienung

### Stein ziehen

| Geste | Wirkung |
|---|---|
| Stein antippen | Stein hebt sich, alle erlaubten Ziele erscheinen als Ringe |
| Ziel antippen | Der Stein zieht dorthin. Bei einem Mehrfachschlag reicht das Endfeld, QUEEN springt den ganzen Weg |
| Stein ziehen und loslassen | Funktioniert ebenso. Loslassen neben einem Ziel lässt den Stein zurückgleiten |
| Stein ohne erlaubten Zug antippen | Der Stein wackelt kurz. Besteht Schlagpflicht, dürfen nur Steine ziehen, die schlagen können |

Führen zwei verschiedene Schlagwege zum selben Endfeld, wählt QUEEN den Weg, der mehr Steine schlägt.

### Steuerleiste

| Schaltfläche | Wirkung |
|---|---|
| **Zurück** | Nimmt den letzten eigenen Zug zurück, gegen den Computer samt seiner Antwort. Rechnet der Computer gerade, bricht Zurück die Rechnung ab |
| **Tipp** | Der Computer rechnet auf der Stufe Schwer den besten Zug für die Seite am Zug und zeigt ihn mit einem goldenen Ring |
| **Neu** | Beginnt sofort ein neues Spiel im selben Modus. Wer sich vertippt hat, holt mit Zurück das alte Spiel wieder |
| **Aufgeben** | Beendet die Partie nach einer Rückfrage. Gegen den Computer zählt das als Niederlage, zu zweit gibt die Seite am Zug auf. Zurück auf der Ergebniskarte nimmt das Aufgeben zurück, samt Eintrag in der Statistik |
| **Modi** | Öffnet die Auswahl der Modi |
| **Mehr** | Öffnet die Einstellungen |

### Spielstand

QUEEN speichert jeden Zug. Schließt du die App mitten im Spiel, geht es beim nächsten Öffnen an derselben Stelle weiter, im selben Modus. Zurück reicht danach bis zu dieser fortgesetzten Stellung. Beim allerersten Start ist der Modus Leicht gewählt.

## Die Schalen

Geschlagene Steine rollen in eine Schale am Brettrand: im Hochformat oben und unten, im Querformat links und rechts. Jede Seite sammelt ihre Beute auf ihrer eigenen Seite, die untere Seite also die geschlagenen schwarzen Steine.

Die Steine in den Schalen sind lebendig, aber sie stören nie das Spiel:

* **Antippen** gibt einem Stein einen kleinen Schubs.
* **Wischen** schiebt die Steine vor sich her, sie stoßen sich gegenseitig an und klicken leise.
* **Neigen** lässt sie, wenn eingeschaltet, zur tiefer liegenden Seite der Schale rutschen.

## Einstellungen

Unter **Mehr**:

| Einstellung | Wirkung |
|---|---|
| Brett | Klassik (Ebenholz, Ahorn, Elfenbein, Gold) oder Mitternacht (Tiefblau, Keramik). Der Wechsel geht jederzeit, auch mitten im Spiel |
| Ton | Klänge an oder aus |
| Klangfarbe | Warm, Klar oder Weich. Gilt für alle Spiele von MIND PAUSE |
| Brett drehen | Beim Spiel zu zweit dreht sich das Brett nach jedem Zug zur Person am Zug. So kann ein iPad flach zwischen zwei Personen liegen |
| Neigen | Geschlagene Steine folgen der Neigung des Geräts. iOS fragt beim ersten Einschalten nach dem Bewegungssensor |

Die Einstellungen werden gespeichert.

<img src="../images/iphone-settings-de.jpg" width="260" alt="Einstellungen">

## Installation auf iPhone und iPad

1. **https://michaeldobner.github.io/mindpause/queen/** in **Safari** öffnen.
2. Auf **Teilen** tippen, dann **Zum Home-Bildschirm**.
3. QUEEN startet danach im Vollbild wie eine App und funktioniert auch ohne Internet.

## Tipps für Einsteiger

1. **Die Grundreihe halten.** Steine auf der eigenen Grundreihe verhindern, dass der Gegner dort eine Dame bekommt. Lass sie so lange wie möglich stehen.
2. **Die Mitte besetzen.** Steine in der Mitte haben mehr Zugmöglichkeiten als Steine am Rand.
3. **Schlagpflicht nutzen.** Biete einen Stein an, den der Gegner nehmen muss, wenn du danach selbst zwei schlagen kannst.
4. **In Gruppen ziehen.** Ein Stein mit einem Nachbarn dahinter kann nicht übersprungen werden.
5. **Damen sind viel wert.** Eine fliegende Dame ist etwa so stark wie drei einfache Steine. Der Weg zur Krone lohnt sich.
6. **Mit Vorsprung tauschen.** Wer mehr Steine hat, gewinnt durch Abtausch leichter.
