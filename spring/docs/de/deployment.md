# Deployment

[English version](../en/deployment.md) · [Übersicht](README.md)

SPRING wird zusammen mit der ganzen Sammlung MIND PAUSE über **GitHub Pages** veröffentlicht. Wie das funktioniert, steht in der [README der Sammlung](../../../README.de.md#veröffentlichung).

| | |
|---|---|
| Adresse | **https://michaeldobner.github.io/mindpause/spring/** |
| Frühere Adresse | `https://michaeldobner.github.io/solohalma/` leitet automatisch hierher weiter |
| Offline-Speicher | Eigener Service Worker in `spring/sw.js`, Cache-Name `spring-v<Version>-shell<Version der Hülle>` |
| Spielstände | Im `localStorage` von `michaeldobner.github.io` mit dem Präfix `spring:`. Sie bleiben bei Updates und beim Umzug von `solohalma` erhalten |

## Wie Updates auf die Geräte kommen

Der Service Worker fragt immer zuerst das Netz, am Browser-Cache vorbei. Weil jede Version eigene Adressen für ihre Dateien nutzt (`?v=` für SPRING, `?shell=` für die Hülle), kann ein Gerät nie alte und neue Dateien mischen. Übernimmt eine neue Version, lädt die Seite einmal neu. Ohne Internet startet die zuletzt geladene Version vollständig.

## Fehlerbehebung

| Problem | Lösung |
|---|---|
| iPhone zeigt alte Version oder ein zerschossenes Layout | App ganz schließen (nach oben wischen) und neu öffnen. Notfalls: Einstellungen > Apps > Safari > Erweitert > Website-Daten, Eintrag `michaeldobner.github.io` löschen (löscht auch Spielstände) |
| Kein Ton | Lautlos-Schalter prüfen, Ton in den Einstellungen prüfen, einmal aufs Brett tippen (iOS gibt Ton erst nach einer Berührung frei) |
| Neigen reagiert nicht | Neigen in den Einstellungen aus- und wieder einschalten und die Frage nach dem Bewegungssensor erlauben. Funktioniert nur über HTTPS |
| App-Symbol fehlt | Prüfen, ob `spring/icons/apple-touch-icon.png` erreichbar ist, dann neu zum Home-Bildschirm hinzufügen |
| Alte Home-Bildschirm-App von `solohalma` | Funktioniert weiter über die Weiterleitung. Für die schönste Darstellung einmal löschen und unter der neuen Adresse neu hinzufügen |
