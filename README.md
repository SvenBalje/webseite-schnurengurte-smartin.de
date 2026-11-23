# Webseiten-Vorlage

Vorlage für neue Kundenwebseiten: Astro, statisch, ohne Drittanbieter vor Einwilligung.

**Ablauf:** lokal prüfen → `staging.<domain>` (Kunde testet) → Freigabe → `<domain>`.
Der Upload läuft über GitHub Actions per rsync/SSH, als Rückfall per FTPS.

- Neue Seite anlegen: [docs/NEUE-WEBSEITE.md](docs/NEUE-WEBSEITE.md)
- Regeln für Claude: [CLAUDE.md](CLAUDE.md) (Plan-Modus, Reviews, Go-Live-Prüfung)
- Go-Live-Prüfung: [.claude/skills/golive-pruefung/SKILL.md](.claude/skills/golive-pruefung/SKILL.md)

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Produktions-Build nach `dist/` |
| `npm run preview` | Build lokal ansehen (http://localhost:4321) |
| `npm run check` | SEO-, Link-, Rechts-, Platzhalter- und Secret-Prüfung des Builds |
| `npm run check:produktion` | wie `check`, Platzhalter sind Fehler |
| `npm run freigabe` | `staging` → `main` (Produktion) |
| `.\scripts\setup-secrets.ps1 -Umgebung staging` | Server-Zugänge als GitHub-Secrets einrichten |

| Datei | Inhalt |
|---|---|
| `src/site.config.ts` | Name, Domain, Impressum, Navigation, einwilligungspflichtige Dienste |
| `public/.htaccess` | Sicherheitsheader (CSP), HTTPS, 404, Caching |
| `deploy-ausschluss.txt` | Ordner auf dem Server, die rsync nie löscht |
| `.github/workflows/deploy.yml` | Build, Prüfung, Upload (rsync → FTPS) |
| `.github/workflows/freigabe.yml` | Schaltfläche „Freigabe für Produktion“ |
