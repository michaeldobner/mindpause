# Deployment

[English version](../en/deployment.md) · [Übersicht](README.md)

## Überblick

SPRING läuft auf **GitHub Pages** unter

**https://michaeldobner.github.io/solohalma/**

```
Push auf main
   │
   ├─► GitHub Pages veröffentlicht main direkt (Workflow „pages build and deployment“)
   │
   └─► GitHub Actions: Workflow „Tests“ prüft die Logik (.github/workflows/tests.yml)
```

Es gibt keinen Build-Schritt. Die Dateien aus `main` werden unverändert ausgeliefert. Änderungen deshalb immer auf einem eigenen Branch entwickeln, dort testen lassen und erst dann in `main` übernehmen.

## Einstellungen im Repository

| Einstellung | Wert |
|---|---|
| Sichtbarkeit | Public (GitHub Pages ist für private Repos nur mit einem kostenpflichtigen Konto verfügbar) |
| Settings > Pages > Source | Deploy from a branch |
| Branch | `main`, Ordner `/ (root)` |

Die Datei `.nojekyll` sorgt dafür, dass GitHub die Dateien unverändert ausliefert.

## Eine neue Version veröffentlichen

1. Änderungen auf einem Branch machen und prüfen (siehe [Entwicklung](entwicklung.md#checkliste-vor-dem-veröffentlichen)).
2. Neue Versionsnummer überall setzen: `node scripts/release.mjs 2.1.0`. Das Skript ändert `package.json`, `js/main.js`, `sw.js` und alle `?v=` Verweise. Neue JavaScript-Dateien zusätzlich in die Liste in `sw.js` eintragen (der Test meldet es sonst).
3. `npm test` ausführen.
4. Beide Changelogs ergänzen.
5. Branch in `main` übernehmen. Nach ein bis zwei Minuten ist die neue Version live.

Den Stand zeigt der Reiter **Actions** im Repository.

## Wie Updates auf die Geräte kommen

Der Service Worker fragt immer zuerst das Netz, am Browser-Cache vorbei. Weil jede Version eigene Adressen für CSS und JavaScript nutzt, kann ein Gerät nie alte und neue Dateien mischen. Übernimmt eine neue Version, lädt die Seite einmal neu, alte Caches werden gelöscht. Ohne Internet startet die zuletzt geladene Version vollständig.

Spielstände liegen im `localStorage` der Adresse `michaeldobner.github.io` und bleiben bei Updates erhalten.

## Umbenennen des Repositorys

Wird das Repository umbenannt, ändert sich die Adresse (zum Beispiel `/spring/`). GitHub Pages leitet die alte Adresse **nicht** weiter. Installierte Home-Bildschirm-Apps müssen dann neu angelegt werden. Spielstände bleiben erhalten, weil sie an `michaeldobner.github.io` hängen und nicht am Pfad.

## Fehlerbehebung

| Problem | Lösung |
|---|---|
| Seite zeigt 404 | Unter Settings > Pages prüfen, ob `main` und `/ (root)` eingestellt sind und „pages build and deployment“ erfolgreich war |
| Workflow „Tests“ ist rot | `npm test` lokal ausführen, Fehler beheben, erneut pushen |
| iPhone zeigt alte Version oder ein zerschossenes Layout | App ganz schließen (nach oben wischen) und neu öffnen. Seit Version 2.0.1 kann das nicht mehr vorkommen, nur der Wechsel von älteren Versionen kann einmalig betroffen sein. Notfalls: Einstellungen > Apps > Safari > Erweitert > Website-Daten, Eintrag `michaeldobner.github.io` löschen (löscht auch Spielstände) |
| Kein Ton | Lautlos-Schalter prüfen, Ton in den Einstellungen prüfen, einmal aufs Brett tippen (iOS gibt Ton erst nach einer Berührung frei) |
| Neigen reagiert nicht | Neigen in den Einstellungen aus- und wieder einschalten und die Frage nach dem Bewegungssensor erlauben. Funktioniert nur über HTTPS |
| App-Symbol fehlt | Prüfen, ob `icons/apple-touch-icon.png` erreichbar ist, dann neu zum Home-Bildschirm hinzufügen |
