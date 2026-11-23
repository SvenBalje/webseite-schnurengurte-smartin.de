# Regeln für dieses Webseiten-Projekt

Dieses Repo ist aus `SvenBalje/website-template` entstanden. Die folgenden Regeln gelten für jede Arbeit daran.

## Arbeitsweise mit Claude
- **Immer im Plan-Modus starten** (ist in `.claude/settings.json` als Standard gesetzt). Erst planen, Plan freigeben lassen, dann umsetzen.
- Sprache in Texten, Commits und Kommentaren: Deutsch.
- Konfiguration der Seite (Name, Domain, Impressumsdaten) steht zentral in `src/site.config.ts`. Platzhalter sind mit `PLATZHALTER` markiert – `npm run check` warnt, `npm run check:produktion` (läuft vor jedem Produktions-Upload) bricht ab, solange welche übrig sind.

## Ablauf: lokal → Staging → Produktion
| Schritt | Wo | Wie |
|---|---|---|
| 1. Entwickeln & prüfen | lokal | `npm run dev` beim Arbeiten, vor jeder Abnahme `npm run build && npm run preview` (http://localhost:4321) |
| 2. Kunde testet | `https://staging.<domain>` | Push auf Branch **`staging`** → GitHub Actions baut und lädt hoch |
| 3. Live schalten | `https://<domain>` | Nach Kunden-OK: GitHub → Actions → **„Freigabe für Produktion“** → *Run workflow* – oder lokal `npm run freigabe` |

- Gearbeitet wird **nur auf `staging`**. Auf `main` wird **nie direkt** committet oder gepusht; `main` bekommt Änderungen ausschließlich über die Freigabe (Fast-Forward von `staging`).
- Upload: rsync über SSH (Deploy-Schlüssel). Fehlen die SSH-Secrets oder schlägt rsync fehl, lädt der Workflow automatisch per FTPS hoch.
- Secrets je Umgebung einrichten: `.\scripts\setup-secrets.ps1 -Umgebung staging` bzw. `-Umgebung production` (Mac/Linux: `scripts/setup-secrets.sh staging`). Niemals Zugangsdaten ins Repo schreiben.

## Pflicht vor der Meldung „Seite kann lokal angesehen werden“
Bevor du dem Nutzer sagst, dass er sich die Seite lokal ansehen kann, **immer** in dieser Reihenfolge:
1. `npm run build` und `npm run check` – beides muss grün sein.
2. **Security-Review** (`/security-review` bzw. gleichwertige Prüfung): Secrets, XSS, externe Ressourcen, Header in `public/.htaccess`, Workflows (Shell-Injection, Secret-Ausgabe).
3. **Code-Review** (`/code-review`): Korrektheit, Barrierefreiheit, unnötiger Code.
4. **Go-Live-Prüfung** mit dem Skill `golive-pruefung` (`.claude/skills/golive-pruefung/SKILL.md`).
5. **Gefundene Fehler direkt beheben**, danach betroffene Prüfungen wiederholen. In der Meldung kurz auflisten, was gefunden und behoben wurde und was offen ist.

## Technische Leitplanken
- Astro, statischer Build nach `dist/`. Kein Server-Code ohne ausdrückliche Absprache.
- **Keine fremden Domains vor der Einwilligung**: Schriften über `@fontsource/*` lokal einbinden, keine Google Fonts/CDNs. Externe Dienste (Analytics, Karten, Videos) nur über `src/components/CookieBanner.astro` (`data-consent`-Mechanismus) laden.
- Cookie-Banner: „Ablehnen“ immer gleichwertig zu „Akzeptieren“ (gleiche Größe, Farbe, Ebene).
- Jede Seite: eindeutiger `title`, Meta-Description, genau eine `<h1>`, Alt-Texte, Canonical (macht `src/layouts/Base.astro`).
- Impressum und Datenschutz sind von jeder Seite aus verlinkt (Footer).
- Sicherheitsheader stehen in `public/.htaccess`; neue externe Quellen müssen dort in der CSP ergänzt werden.
