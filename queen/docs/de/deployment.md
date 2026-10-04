# Deployment

[English version](../en/deployment.md) · [Übersicht](README.md)

QUEEN wird zusammen mit der ganzen Sammlung MIND PAUSE über **GitHub Pages** veröffentlicht. Wie das funktioniert, steht in der [README der Sammlung](../../../README.de.md#veröffentlichung).

| | |
|---|---|
| Adresse | **https://michaeldobner.github.io/mindpause/queen/** |
| Offline-Speicher | Eigener Service Worker in `queen/sw.js`, Cache-Name `queen-v<Version>-shell<Version der Hülle>` |
| Spielstände | Im `localStorage` von `michaeldobner.github.io` mit dem Präfix `queen:`. Sie bleiben bei Updates erhalten |
| Computergegner | Läuft vollständig auf dem Gerät, auch offline |

## Wie Updates auf die Geräte kommen

Der Service Worker fragt immer zuerst das Netz, am Browser-Cache vorbei. Weil jede Version eigene Adressen für ihre Dateien nutzt (`?v=` für QUEEN, `?shell=` für die Hülle), kann ein Gerät nie alte und neue Dateien mischen. Übernimmt eine neue Version, lädt die Seite einmal neu. Ohne Internet startet die zuletzt geladene Version vollständig.

## Fehlerbehebung

| Problem | Lösung |
|---|---|
| iPhone zeigt alte Version oder ein zerschossenes Layout | App ganz schließen (nach oben wischen) und neu öffnen. Notfalls: Einstellungen > Apps > Safari > Erweitert > Website-Daten, Eintrag `michaeldobner.github.io` löschen (löscht auch Spielstände aller Spiele) |
| Computer zieht nicht | Zurück oder Neu antippen. Bleibt es so, App neu öffnen. Der Web Worker braucht einen aktuellen Browser |
| Kein Ton | Lautlos-Schalter prüfen, Ton in den Einstellungen prüfen, einmal aufs Brett tippen (iOS gibt Ton erst nach einer Berührung frei) |
| Neigen reagiert nicht | Neigen in den Einstellungen aus- und wieder einschalten und die Frage nach dem Bewegungssensor erlauben. Funktioniert nur über HTTPS |
| App-Symbol fehlt | Prüfen, ob `queen/icons/apple-touch-icon.png` erreichbar ist, dann neu zum Home-Bildschirm hinzufügen |
