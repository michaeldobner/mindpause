# Stufen

[English version](../en/levels.md) · [Übersicht](README.md)

## Das Problem

Bei Klondike entscheidet das Mischen über alles. Manche Verteilungen fallen fast von allein auf, andere verlangen genaues Vorausdenken, und etwa jede fünfte ist gar nicht zu gewinnen, egal wie gut man spielt. Eine Stufe „Schwer“ nur über strengere Regeln würde daran nichts ändern.

## Die Lösung: ausgewählte statt zufällige Verteilungen

Jedes Spiel hat eine **Spielnummer**. Dieselbe Nummer ergibt auf jedem Gerät dieselbe Verteilung (Zufallsgenerator mit Startwert, wie die Spielnummern von FreeCell unter Windows). KARO teilt Nummern **vorab auf dem Rechner** in Stufen ein und liefert nur die fertigen Listen aus.

Für jede Nummer und jeden Ziehmodus:

1. **Ein einfacher Spieler** (`tools/player.mjs`) spielt sie 24 Mal. Er sieht nur, was auch ein Mensch sieht, denkt nicht voraus und macht immer den naheliegenden Zug, mit etwas Zufall. Seine **Gewinnquote** zeigt, wie naheliegend der Weg ist. Gewinnt er auch nur einmal, ist das Spiel sicher lösbar.
2. Gewinnt er nie, sucht der **Löser** (`js/solver.js`) mit Kenntnis aller Karten einen Weg. Wie viele Stellungen er dafür untersucht, zeigt, **wie schmal** der Weg ist.

| Stufe | Bedingung |
|---|---|
| Leicht | Gewinnquote ab 50 % |
| Mittel | Gewinnquote 10 bis 50 % |
| Schwer | Gewinnquote unter 10 %, oder 0 % und der Löser findet den Weg schnell |
| Meisterhaft | Gewinnquote 0 % und der Löser braucht lange |

Verteilungen, für die der Löser keinen Weg findet, kommen in keine Liste. Je Stufe und Ziehmodus gibt es 200 Spiele.

## Welche Nummer als Nächstes kommt

Jedes Gerät beginnt an einer zufälligen Stelle der Liste und geht sie der Reihe nach durch. So wiederholt sich lange nichts. Das **Tagesspiel** wählt aus der Liste „Mittel“ anhand des Datums, für alle gleich. **Zufall** nimmt eine beliebige Nummer ohne Prüfung.

## Listen neu erzeugen

```bash
node karo/tools/deals.mjs 200    # 200 Spiele je Stufe, dauert einige Minuten
```

Das Skript schreibt `karo/js/deals.js`. Danach Version erhöhen, damit Geräte die neue Liste laden.
