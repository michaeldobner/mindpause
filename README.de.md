<div align="center">

# MIND PAUSE

**Ruhige, sorgfältig gestaltete Denkspiele für iPhone und iPad.**

Klassische Brettspiele, neu gedacht, mit fast greifbarem Design und handgemachtem Klang. Kostenlos, offline, ohne Werbung.

[**▶ MIND PAUSE öffnen**](https://michaeldobner.github.io/mindpause/) · [English](README.md) · [Hülle](shared/README.de.md)

[![Tests](https://github.com/michaeldobner/mindpause/actions/workflows/tests.yml/badge.svg)](https://github.com/michaeldobner/mindpause/actions/workflows/tests.yml)

</div>

## Spiele

| | Spiel | Beschreibung | Version |
|---|---|---|---|
| <img src="spring/icons/icon.svg" width="56" alt=""> | **[SPRING](spring/README.de.md)** · [spielen](https://michaeldobner.github.io/mindpause/spring/) | Solohalma auf dem klassischen Kreuzbrett. Sieben Figuren von leicht bis meisterhaft, Tipps, lebendiger Rand, Neigen | 2.1.2 |
| <img src="queen/icons/icon.svg" width="56" alt=""> | **[QUEEN](queen/README.de.md)** · [spielen](https://michaeldobner.github.io/mindpause/queen/) | Deutsche Dame gegen den Computer in vier Stufen oder zu zweit an einem Gerät. Ebenholz, Ahorn und eine gravierte Goldkrone, Schalen für geschlagene Steine, eigene Steine immer unten | 1.3.0 |
| <img src="karo/icons/icon.svg" width="56" alt=""> | **[KARO](karo/README.de.md)** · [spielen](https://michaeldobner.github.io/mindpause/karo/) | Die klassische Patience wie bei Windows. 1 oder 3 Karten, Punkte oder Vegas, sicher lösbare Stufen, Tipps | 1.0.4 |
| <img src="fuge/icons/icon.svg" width="56" alt=""> | **[FUGE](fuge/README.de.md)** · [spielen](https://michaeldobner.github.io/mindpause/fuge/) | Das klassische Spiel mit fallenden Steinen als lackierter Holzkasten. Klassisch, Sprint, 3 Minuten und Ruhe ohne Ende, Gesten statt Knöpfe, Daumensteuerung im Querformat | 1.1.0 |
| <img src="muehle/icons/icon.svg" width="56" alt=""> | **[MÜHLE](muehle/README.de.md)** · [spielen](https://michaeldobner.github.io/mindpause/muehle/) | Neun Männer Mühle gegen den Computer in drei Stufen oder zu zweit an einem Gerät. Goldlinien auf schwarzem Holz, leuchtende Mühlen, Schalen als Vorrat | 1.1.0 |
| <img src="blocks/icons/icon.svg" width="56" alt=""> | **[BLOCKS](blocks/README.de.md)** · [spielen](https://michaeldobner.github.io/mindpause/blocks/) | Das Block-Puzzle: Steine vom Tablett aufs Brett ziehen, volle Reihen und Spalten räumen ab. 30 Level mit Startsteinen und steigender Schwierigkeit, dazu Klassisch 8 × 8, Weit 10 × 10 und Ruhe ohne Ende, Serie, Vorschau beim Ziehen, Steine aus blauer Keramik | 1.1.1 |

Weitere Spiele und das Spiel auf zwei Geräten sind in Arbeit, siehe [Roadmap](#roadmap).

## Was alle Spiele teilen

Alle Spiele bauen auf einer gemeinsamen **Hülle** in [`shared/`](shared/README.de.md) auf. Wird dort etwas geändert, zum Beispiel eine Schrift, ändert es sich in allen Spielen.

| Gemeinsam | Bedeutung |
|---|---|
| **Design-Tokens** | Schriften, Farben, Abstände, Schatten und Bewegung in `shared/tokens.css` |
| **Oberfläche** | Kopfzeile, Steuerleiste, Auswahl als Blatt oder Schublade, beim ersten Start von selbst offen, Einstellungen, Ergebniskarte mit Sternen, Hinweise, Erststart-Hinweis |
| **Layouts** | Hochformat und Querformat auf iPhone und iPad, im Querformat Kopf links, Brett in voller Höhe, Steuerung rechts, Hell- und Dunkelmodus, sichere Ränder |
| **Klang-Engine** | Keramik auf Holz in vier Schichten, drei Klangfarben, respektiert den Lautlos-Schalter |
| **Lebendiger Rand** | Physik für Murmeln und Steine im Rand oder in Schalen: antippen, wischen, neigen |
| **Sprachen** | Deutsch auf deutsch eingestellten Geräten, sonst Englisch |
| **Offline** | Jedes Spiel lässt sich als eigene App auf den Home-Bildschirm legen und läuft ohne Internet |

Jedes Spiel behält seine eigenen Regeln, sein Brett, seine Klänge, README, Changelog, Dokumentation, Version und Adresse.

## Aufbau des Repositorys

```
mindpause/
├─ index.html              Startseite der Sammlung (aus games.json erzeugt)
├─ games.json              Liste aller Spiele
├─ shared/                 die Hülle, siehe shared/README.de.md
│  ├─ tokens.css           Design-Tokens
│  ├─ shell.css            Layout und Bausteine
│  ├─ js/                  Hülle, Sprachen, Speichern, Klang-Engine, Physik, Neigen
│  └─ tests/               Tests der Hülle
├─ spring/                 SPRING, siehe spring/README.de.md
├─ queen/                  QUEEN, siehe queen/README.de.md
├─ karo/                   KARO, siehe karo/README.de.md
├─ fuge/                   FUGE, siehe fuge/README.de.md
├─ muehle/                 MÜHLE, siehe muehle/README.de.md
├─ blocks/                 BLOCKS, siehe blocks/README.de.md
├─ scripts/
│  ├─ release.mjs          setzt die Version eines Spiels oder der Hülle
│  └─ e2e.mjs              Browser-Test der ganzen Sammlung
├─ tests/                  Tests über die ganze Sammlung
└─ .github/workflows/      Tests bei jedem Push
```

## Entwicklung

Voraussetzungen: Node.js ab Version 20 und ein moderner Browser. Es gibt keine Abhängigkeiten und keinen Build-Schritt.

```bash
npm start       # lokaler Server: http://localhost:3000/ (Startseite), /spring/, /queen/
npm test        # Logik-Tests aller Spiele und der Hülle
npm run e2e     # Browser-Test aller Spiele auf iPhone hoch und quer, iPhone SE und iPad quer
E2E_ENGINE=webkit npm run e2e   # dasselbe mit WebKit, der Engine von Safari
```

Der Browser-Test braucht einmalig Playwright: `npm install --no-save playwright && npx playwright install chromium`.

Bei jedem Push führt GitHub Actions beides aus. Der Browser-Test lädt Screenshots aller Spiele zum Herunterladen hoch (Artefakt „screenshots“). So lassen sich Änderungen an der Hülle in allen Spielen auf einen Blick prüfen.

## Veröffentlichung

* **Hosting:** GitHub Pages, Branch `main`, Ordner `/ (root)`. Für öffentliche Repositorys kostenlos.
* **Arbeitsweise:** Jede Änderung läuft über einen Pull Request. Sind die Tests grün, wird er in `main` übernommen und der Branch automatisch gelöscht. Ein bis zwei Minuten später ist alles live.
* **Versionen:** Jedes Spiel hat seine eigene Version, die Hülle ebenfalls.

```bash
node scripts/release.mjs spring 2.2.0   # neue Version von SPRING
node scripts/release.mjs shell 1.5.0    # neue Version der Hülle, betrifft alle Spiele
```

Jeder Verweis trägt seine Version (`?v=` für Dateien eines Spiels, `?shell=` für Dateien der Hülle). Ein Gerät mischt deshalb nach einem Update nie alte und neue Dateien. `tests/release.test.js` prüft das bei jedem Push.

## Ein Spiel hinzufügen

1. Ordner mit der Kennung des Spiels anlegen, zum Beispiel `muehle/`.
2. Denselben Aufbau wie `spring/` verwenden: `index.html`, `js/main.js`, `js/strings.js`, `css/<kennung>.css`, `sw.js`, `manifest.webmanifest`, `icons/`, `tests/`, `README.md`, `README.de.md`, `CHANGELOG.md`, `CHANGELOG.de.md`, `docs/de`, `docs/en`.
3. In `main.js` `createShell()` der Hülle aufrufen, siehe [Doku der Hülle](shared/README.de.md#ein-spiel-anbinden).
4. `window.__game` mit `history` und `e2e.move()` für den Browser-Test bereitstellen.
5. Eintrag in `games.json` ergänzen. Startseite, Release-Skript und Tests nehmen das Spiel automatisch auf.
6. Zeile in der Spieletabelle oben ergänzen.

## Roadmap

| Schritt | Inhalt | Status |
|---|---|---|
| SPRING | Solohalma, 7 Figuren, Tipps, Neigen | Fertig |
| Sammlung | Hülle, Startseite, Tests über alle Spiele | Fertig |
| QUEEN | Deutsche Dame, vier Computerstufen, zu zweit an einem Gerät | Fertig |
| KARO | Klondike-Patience, 1 oder 3 Karten, Punkte nach Windows und Vegas, sicher lösbare Stufen | Fertig |
| FUGE | Fallende Steine als Holzkasten, vier Modi, Gesten, Hülle 1.3.0 mit eigenen Schaltflächen | Fertig |
| MÜHLE | Neun Männer Mühle nach WMD-Regeln, drei Computerstufen, zu zweit, Gestaltung von QUEEN | Fertig |
| Querformat | Hülle 1.5.0: Querformat für alle Spiele, Brett in voller Höhe, eigene Steine unten, FUGE mit Daumensteuerung | Fertig |
| BLOCKS | Block-Puzzle mit drei Modi, Serie und Vorschau, Farben von SPRING und QUEEN Mitternacht | Fertig |
| BLOCKS 1.1 | 30 Level in sechs Kapiteln mit Sägezahn-Kurve, jedes auf Lösbarkeit geprüft | Fertig |
| QUEEN 1.4 | Gegeneinander auf zwei Geräten, Stufe 1: Zug per Link | Geplant |
| Später | Live mit Raumcode, weitere Spiele | Idee |

## Schreibstil

Texte und Dokumentation gibt es immer auf Deutsch und Englisch, ohne Gedankenstriche. Kommentare im Code sind auf Deutsch.
