---
name: golive-pruefung
description: Go-Live-Prüfung der Webseite (Build, alle Unterseiten, Lighthouse mobil, SEO-Grundlagen, Responsive, Links/404, Drittanbieter vor Consent, Impressum/Datenschutz/Cookie-Banner, npm audit, Secret- und Platzhalter-Scan). Verwenden vor jeder Meldung "Seite lokal ansehen", vor jedem Staging-Upload zur Kundenabnahme und vor der Freigabe für Produktion.
---

# Go-Live-Prüfung

Prüfe diese Webseite vor dem Go-Live. Sie ist noch nicht online. Arbeite die Punkte der Reihe nach ab, **behebe Fehler direkt** und wiederhole danach die betroffenen Punkte. Am Ende steht ein kurzer Bericht.

1. **Produktions-Build lokal starten**: `npm run build`, dann `npm run check`, dann den Preview-Server starten (`preview_start` mit Name `preview` aus `.claude/launch.json`, sonst `npm run preview` im Hintergrund). Adresse: http://localhost:4321
2. **Alle Unterseiten im eingebauten Browser öffnen**. Die Liste der Seiten steht in `dist/sitemap-0.xml` bzw. ergibt sich aus `dist/**/index.html`. Auf Konsolenfehler achten (`read_console_messages`).
3. **Lighthouse mobil** für die Startseite und zwei Unterseiten:
   `npx lighthouse <url> --form-factor=mobile --output=json --output-path=./.lighthouse/<name>.json --chrome-flags="--headless=new" --quiet`
   Ziel: Performance, Barrierefreiheit, Best Practices und SEO jeweils ≥ 90. Ergebnisse aus dem JSON auslesen (`categories.*.score`). Der Ordner `.lighthouse/` ist in `.gitignore`.
4. **Je Seite prüfen**: `title`, Meta-Description, genau eine `<h1>`, Alt-Texte an allen Bildern, Canonical; außerdem `dist/sitemap-index.xml` und `dist/robots.txt`. (`npm run check` deckt das maschinell ab – trotzdem stichprobenartig im Browser ansehen.)
5. **Darstellung** bei 375 px, 768 px und 1440 px Breite (`resize_window`, Screenshot je Breite): kein horizontales Scrollen, Navigation bedienbar, Texte lesbar. Danach `resize_window` mit `preset: "desktop"` zurücksetzen.
6. **Interne Links und 404-Seite**: alle internen Links (prüft `npm run check`) und eine nicht vorhandene URL aufrufen, z. B. http://localhost:4321/gibt-es-nicht – die eigene 404-Seite muss erscheinen.
7. **Netzwerk vor Einwilligung**: Seite frisch laden (vorher `localStorage.clear()`), dann `read_network_requests` – vor einem Klick im Cookie-Banner darf **keine** fremde Domain geladen werden (Google Fonts, Analytics, CDNs, YouTube, Maps …). Nur `localhost`.
8. **Rechtliches**: Impressum und Datenschutz von jeder Seite aus verlinkt (Footer). Cookie-Banner – falls Dienste mit Einwilligung eingebunden sind – hat ein **gleichwertiges „Ablehnen“** (gleiche Größe, Farbe, Ebene, kein Verstecken in Einstellungen). Ohne einwilligungspflichtige Dienste darf kein Banner erscheinen.
9. **Sicherheit**: `npm audit` ausführen (High/Critical beheben). Build nach Zugangsdaten und API-Schlüsseln durchsuchen (macht `npm run check`; zusätzlich `git grep -nE "(password|passwort|secret|api[_-]?key|token)\s*[:=]"` im Quellcode ansehen).
10. **Platzhalter**: nach `Lorem`, `TODO`, `FIXME`, `example.com`, `PLATZHALTER` suchen – im Build (macht `npm run check`) und im Quellcode (`git grep -nIiE "lorem|todo|fixme|example\.com|PLATZHALTER" -- src public`).

## Bericht
Tabelle mit den 10 Punkten: Status (✅ / ⚠️ / ❌), Befund, was behoben wurde. Lighthouse-Werte je Seite angeben. Offene Punkte klar benennen (z. B. Impressumsdaten fehlen noch vom Kunden).
