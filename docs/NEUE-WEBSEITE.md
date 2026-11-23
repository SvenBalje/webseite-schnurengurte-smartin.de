# Neue Webseite aus der Vorlage anlegen

## 1. Repo anlegen und klonen
```powershell
cd C:\Users\sven.balje\Desktop\Claude
gh repo create kunde-webseite --private --template SvenBalje/website-template --clone
cd kunde-webseite
git switch -c staging
git push -u origin staging
npm install
```

## 2. In Claude öffnen
Den Ordner im Claude-Code-Tab öffnen. Claude liest `CLAUDE.md` automatisch und startet im **Plan-Modus**.
Erste Aufgabe an Claude zum Beispiel: „Richte die Seite für <Kunde> ein: Name, Domain, Impressum, Farben, Startseite.“

Zuerst wird `src/site.config.ts` ausgefüllt (alles mit `PLATZHALTER`).

## 3. Server-Zugänge in GitHub hinterlegen
Je Umgebung einmal ausführen (fragt Domain, Host, Port, Benutzer, Passwort und Pfad ab):
```powershell
.\scripts\setup-secrets.ps1 -Umgebung staging
```
```powershell
.\scripts\setup-secrets.ps1 -Umgebung production
```
- Die Subdomain `staging.<domain>` muss beim Hoster angelegt sein und auf einen eigenen Ordner zeigen.
- Das Script findet den richtigen Ordner auf dem Server selbst: Es legt eine Prüfdatei ab und ruft sie über die Domain auf.
- Liegt der Staging-Ordner innerhalb des Produktions-Ordners, bietet das Script an, ihn in `deploy-ausschluss.txt` zu schützen. Danach die Datei committen.
- In GitHub landen nur ein eigener Deploy-Schlüssel und die FTP-Daten für den Rückfall, nie dein SSH-Passwort.

## 4. Täglicher Ablauf
| Was | Befehl / Ort |
|---|---|
| Lokal entwickeln | `npm run dev` |
| Lokal abnehmen (Produktions-Build) | `npm run build`, `npm run check`, `npm run preview` → http://localhost:4321 |
| Zum Kunden auf Staging | auf `staging` committen und `git push`. GitHub Actions lädt nach `https://staging.<domain>` hoch |
| Kunde hat freigegeben | GitHub → Actions → **Freigabe für Produktion** → *Run workflow*, `live` eintippen. Oder lokal `npm run freigabe` |

Vor dem Produktions-Upload läuft `check:produktion`. Es bricht ab, solange noch Platzhalter (z. B. Impressumsdaten) übrig sind.

## 5. Probelauf und Fehlersuche
- GitHub → Actions → **Deploy** → *Run workflow* (Branch wählen) mit Haken bei „Probelauf“ zeigt, was hochgeladen oder gelöscht würde.
- Die Zusammenfassung jedes Laufs zeigt, ob per rsync oder per FTPS hochgeladen wurde.
- Ohne Secrets wird nur gebaut und geprüft, dazu erscheint eine Warnung.

## Optional: `main` schützen
GitHub → Settings → Branches → Regel für `main`: „Restrict who can push“. Damit die Freigabe-Schaltfläche weiter funktioniert, muss **GitHub Actions** als Ausnahme erlaubt sein. Alternativ nur `npm run freigabe` nutzen.
