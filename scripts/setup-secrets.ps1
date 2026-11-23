<#
.SYNOPSIS
  Richtet die GitHub-Secrets für den Upload auf staging oder production ein.

.DESCRIPTION
  - SSH/rsync: erzeugt einen eigenen Deploy-Schlüssel und hinterlegt ihn auf dem Server.
    Dein Server-Passwort tippst du nur in den ssh-Prompt – das Script sieht und speichert es nicht.
  - Ermittelt den richtigen Zielordner auf dem Server selbst: legt eine Prüfdatei in möglichen
    Ordnern ab und schaut nach, unter welchem Ordner sie über https://<domain>/ erreichbar ist.
  - FTPS (Rückfall): fragt Host, Port, Benutzer, Passwort ab und ermittelt den FTP-Pfad genauso.
  - Schreibt alles per "gh secret set --env <umgebung>" ins GitHub-Environment (Werte über stdin).

.EXAMPLE
  .\scripts\setup-secrets.ps1 -Umgebung staging
  .\scripts\setup-secrets.ps1 -Umgebung production
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('staging', 'production')]
  [string]$Umgebung
)

# Nicht 'Stop': Windows PowerShell 5.1 macht sonst jede stderr-Zeile nativer Programme (ssh, curl,
# ssh-keyscan) zum abbrechenden Fehler. Fehler werden über $LASTEXITCODE und throw behandelt.
$ErrorActionPreference = 'Continue'
Set-StrictMode -Version 3
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)

function Write-Schritt([string]$Text) { Write-Host "`n== $Text" -ForegroundColor Cyan }
function Write-Ok([string]$Text) { Write-Host "   OK  $Text" -ForegroundColor Green }
function Write-Warnung([string]$Text) { Write-Host "   !   $Text" -ForegroundColor Yellow }

function Read-Wert([string]$Frage, [string]$Standard = '') {
  $hinweis = if ($Standard) { " [$Standard]" } else { '' }
  $antwort = Read-Host "$Frage$hinweis"
  if ([string]::IsNullOrWhiteSpace($antwort)) { return $Standard }
  return $antwort.Trim()
}

function Read-JaNein([string]$Frage, [bool]$Standard = $true) {
  $hinweis = if ($Standard) { 'J/n' } else { 'j/N' }
  $antwort = (Read-Host "$Frage ($hinweis)").Trim().ToLower()
  if ($antwort -eq '') { return $Standard }
  return $antwort -in @('j', 'ja', 'y', 'yes')
}

function ConvertTo-ShellString([string]$Wert) {
  # Für die Übergabe an eine entfernte POSIX-Shell in einfachen Anführungszeichen
  return "'" + ($Wert -replace "'", "'\''") + "'"
}

function Set-GhSecret([string]$Name, [string]$Wert) {
  # Wert über stdin, damit er nicht in der Prozessliste/Historie auftaucht
  $Wert | gh secret set $Name --env $Umgebung --repo $script:Repo | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "gh secret set $Name fehlgeschlagen" }
  Write-Ok "Secret $Name gesetzt"
}

function Invoke-Remote([string[]]$SshArgs, [string]$Ziel, [string]$Skript) {
  # Skript base64-kodiert übertragen: Windows PowerShell 5.1 verstümmelt Anführungszeichen in
  # Argumenten für native Programme, base64 enthält keine.
  $b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes(($Skript -replace "`r`n", "`n")))
  & ssh @SshArgs $Ziel "echo $b64 | base64 -d | sh"
}

function Test-HttpMarker([string]$Domain, [string]$Datei, [string]$Token) {
  foreach ($schema in @('https', 'http')) {
    # -k nur zum Wiederfinden des Zufallstokens (Zertifikat für Staging evtl. noch nicht ausgestellt)
    $inhalt = & curl.exe -s -k -L --max-time 15 "${schema}://$Domain/$Datei" 2>$null
    if ($LASTEXITCODE -eq 0 -and ($inhalt -join '').Trim() -eq $Token) { return $true }
  }
  return $false
}

# ---------------------------------------------------------------- Vorbereitung
Write-Schritt "Vorbereitung ($Umgebung)"
foreach ($cmd in @('gh', 'ssh', 'ssh-keygen', 'ssh-keyscan', 'curl.exe')) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) { throw "$cmd wurde nicht gefunden. Bitte installieren (OpenSSH-Client, GitHub CLI)." }
}
gh auth status 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'GitHub CLI ist nicht angemeldet. Bitte zuerst "gh auth login" ausführen.' }

$script:Repo = (gh repo view --json nameWithOwner --jq .nameWithOwner)
if (-not $script:Repo) { throw 'Kein GitHub-Repo gefunden. Script im Projektordner ausführen.' }
Write-Ok "Repo: $script:Repo"

$domainStandard = if ($Umgebung -eq 'staging') { 'staging.' } else { 'www.' }
$Domain = Read-Wert "Domain der Umgebung '$Umgebung' (z. B. ${domainStandard}kunde.de)"
$Domain = ($Domain -replace '^[a-z]+://', '' -replace '/.*$', '').ToLower()
if ($Domain -notmatch '^[a-z0-9.-]+\.[a-z]{2,}$') { throw "Ungültige Domain: $Domain" }

$tmp = Join-Path ([System.IO.Path]::GetTempPath()) ("deploy-setup-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp | Out-Null

$secrets = [ordered]@{}

try {
  # ---------------------------------------------------------------- GitHub-Environment
  gh api -X PUT "repos/$script:Repo/environments/$Umgebung" --silent
  if ($LASTEXITCODE -ne 0) { throw "Environment $Umgebung konnte nicht angelegt werden." }
  Write-Ok "Environment '$Umgebung' vorhanden"

  # ---------------------------------------------------------------- SSH / rsync
  if (Read-JaNein 'SSH/rsync einrichten (empfohlen)?') {
    Write-Schritt 'SSH-Zugang'
    $sshHost = Read-Wert 'SSH-Host'
    $sshPort = Read-Wert 'SSH-Port' '22'
    $sshUser = Read-Wert 'SSH-Benutzer'
    $pfadAngabe = Read-Wert 'Pfad wie beim Hoster angezeigt (leer = automatisch suchen)'
    if (-not $sshHost -or -not $sshUser) { throw 'Host und Benutzer sind Pflicht.' }
    if ($sshPort -notmatch '^\d+$') { throw "Ungültiger Port: $sshPort" }
    if ($sshHost -notmatch '^[A-Za-z0-9.-]+$') { throw "Ungültiger Host: $sshHost" }
    if ($sshUser -notmatch '^[A-Za-z0-9._-]+$') { throw "Ungültiger Benutzer: $sshUser" }

    # Host-Schlüssel holen und bestätigen lassen
    $knownHosts = Join-Path $tmp 'known_hosts'
    $scan = & ssh-keyscan -q -p $sshPort $sshHost 2>$null
    if (-not $scan) { throw "ssh-keyscan erreicht $sshHost`:$sshPort nicht." }
    $scan | Set-Content -Path $knownHosts -Encoding ascii
    Write-Host '   Fingerprints des Servers:'
    & ssh-keygen -lf $knownHosts | ForEach-Object { Write-Host "     $_" }
    if (-not (Read-JaNein 'Stimmen diese mit den Angaben des Hosters überein bzw. ist das der richtige Server?')) { throw 'Abgebrochen.' }

    $sshBasis = @('-p', $sshPort, '-o', "UserKnownHostsFile=$knownHosts", '-o', 'StrictHostKeyChecking=yes', '-o', 'ConnectTimeout=20', '-o', 'LogLevel=ERROR')
    $ziel = "$sshUser@$sshHost"

    # Deploy-Schlüssel erzeugen (ohne Passphrase, nur temporär lokal)
    $keyDatei = Join-Path $tmp 'deploy_key'
    $kommentar = "github-deploy-$($script:Repo -replace '[^A-Za-z0-9._-]', '-')-$Umgebung"
    cmd /c "ssh-keygen -q -t ed25519 -N `"`" -C $kommentar -f `"$keyDatei`"" | Out-Null
    if (-not (Test-Path $keyDatei)) { throw 'Schlüssel konnte nicht erzeugt werden.' }
    # Windows-OpenSSH verlangt, dass nur der eigene Benutzer den privaten Schlüssel lesen darf
    icacls $keyDatei /inheritance:r /grant:r "$($env:USERNAME):(R,W)" | Out-Null
    $pubKey = (Get-Content "$keyDatei.pub" -Raw).Trim()
    $eintrag = "no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty $pubKey"

    Write-Schritt 'Deploy-Schlüssel auf dem Server hinterlegen'
    Write-Host '   Gleich fragt ssh nach deinem Server-Passwort (Eingabe bleibt unsichtbar).'
    $remote = "umask 077; mkdir -p ~/.ssh && touch ~/.ssh/authorized_keys && k=$(ConvertTo-ShellString $eintrag) && { grep -qxF `"`$k`" ~/.ssh/authorized_keys || printf '%s\n' `"`$k`" >> ~/.ssh/authorized_keys; }"
    Invoke-Remote ($sshBasis + @('-o', 'PubkeyAuthentication=no')) $ziel $remote
    if ($LASTEXITCODE -ne 0) { throw 'Schlüssel konnte nicht auf dem Server hinterlegt werden (Passwort falsch oder SSH nicht freigeschaltet?).' }

    $sshKey = @('-i', $keyDatei, '-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes') + $sshBasis
    $test = Invoke-Remote $sshKey $ziel 'echo deploy-ok; command -v rsync >/dev/null && echo rsync-ok'
    if (($test -join ' ') -notmatch 'deploy-ok') { throw 'Anmeldung mit dem neuen Schlüssel schlägt fehl.' }
    Write-Ok 'Anmeldung mit Deploy-Schlüssel funktioniert'
    if (($test -join ' ') -notmatch 'rsync-ok') { Write-Warnung 'rsync ist auf dem Server nicht installiert – der Workflow fällt dann auf FTPS zurück.' }

    # Zielordner ermitteln
    Write-Schritt 'Zielordner auf dem Server ermitteln'
    $p = ConvertTo-ShellString ($pfadAngabe.Trim().TrimEnd('/'))
    $d = ConvertTo-ShellString $Domain
    $suche = @"
P=$p; D=$d; H=`$HOME
for b in "" "`$H" "`$H/html" "`$H/htdocs" "`$H/www" "`$H/public_html" "`$H/httpdocs" "`$H/web" "`$H/domains"; do
  for s in "`$P" "`$D" "`$D/public_html" "`$D/htdocs" ""; do
    c="`$b/`$s"; [ -z "`$b" ] && c="`$s"
    [ -n "`$c" ] && [ -d "`$c" ] && [ -w "`$c" ] && (cd "`$c" && pwd -P)
  done
done | awk '!x[`$0]++'
"@
    $kandidaten = @(Invoke-Remote $sshKey $ziel $suche | Where-Object { $_ -match '^/' })
    if ($kandidaten.Count -eq 0) { Write-Warnung 'Keine beschreibbaren Kandidaten gefunden.' }

    $sshPath = $null
    $marker = 'deploy-check-' + [guid]::NewGuid().ToString('N').Substring(0, 12) + '.txt'
    $token = [guid]::NewGuid().ToString('N')
    foreach ($k in $kandidaten) {
      $kq = ConvertTo-ShellString $k
      Invoke-Remote $sshKey $ziel "printf '%s' '$token' > $kq/$marker" 2>$null
      if ($LASTEXITCODE -ne 0) { continue }
      $treffer = Test-HttpMarker $Domain $marker $token
      Invoke-Remote $sshKey $ziel "rm -f $kq/$marker" 2>$null
      if ($treffer) { $sshPath = $k; break }
    }

    if ($sshPath) {
      Write-Ok "Webroot von $Domain ist $sshPath"
    } else {
      Write-Warnung "Kein Ordner war unter https://$Domain/ erreichbar (Domain zeigt evtl. noch nicht auf den Server)."
      if ($kandidaten.Count -gt 0) {
        Write-Host '   Gefundene Ordner:'
        for ($i = 0; $i -lt $kandidaten.Count; $i++) { Write-Host "     [$($i + 1)] $($kandidaten[$i])" }
      }
      $wahl = Read-Wert 'Nummer wählen oder absoluten Pfad eintippen'
      if ($wahl -match '^\d+$' -and [int]$wahl -ge 1 -and [int]$wahl -le $kandidaten.Count) { $sshPath = $kandidaten[[int]$wahl - 1] }
      elseif ($wahl -match '^/') { $sshPath = $wahl.TrimEnd('/') }
      else { throw 'Kein Zielordner gewählt.' }
      # Ungeprüfte Wahl doppelt bestätigen: ein falscher Ordner (z. B. der Live-Webroot bei Staging)
      # würde bei jedem Upload per rsync --delete überschrieben
      Write-Warnung "ACHTUNG: rsync ersetzt bei jedem Upload den GESAMTEN Inhalt von $sshPath."
      if ($Umgebung -eq 'staging') { Write-Warnung 'Bei Staging darf das auf keinen Fall der Ordner der Live-Seite sein.' }
      $bestaetigung = Read-Wert 'Zur Bestätigung den Pfad noch einmal vollständig eintippen'
      if ($bestaetigung.TrimEnd('/') -ne $sshPath) { throw 'Pfad nicht bestätigt – abgebrochen.' }
      Write-Warnung "Ungeprüft übernommen: $sshPath"
    }

    # rsync in das Home-Verzeichnis ist gesperrt (der Workflow bricht dort ab, --delete würde .ssh usw. löschen)
    $homeDir = (@(Invoke-Remote $sshKey $ziel 'cd ~ && pwd -P') | Select-Object -First 1)
    $sshAktiv = $true
    if ($sshPath -eq '/' -or $sshPath -eq $homeDir) {
      Write-Warnung "Der Webroot ist das Home-Verzeichnis ($sshPath). rsync ist dort aus Sicherheitsgründen gesperrt."
      Write-Warnung 'Es werden keine SSH-Secrets gespeichert – bitte unten FTPS einrichten. (Besser: beim Hoster einen eigenen Unterordner als Webroot einstellen.)'
      $sshAktiv = $false
    }

    if ($sshAktiv) {
      # Fremde Ordner/Dateien im Zielordner (z. B. staging/ im Live-Webroot, Google-Verifizierung) vor rsync --delete schützen
      $ausschlussDatei = Join-Path (Split-Path $PSScriptRoot -Parent) 'deploy-ausschluss.txt'
      $bekannt = @('/_astro/', '/impressum/', '/datenschutz/', '/index.html', '/404.html', '/robots.txt',
        '/sitemap-index.xml', '/sitemap-0.xml', '/favicon.svg', '/.htaccess')
      if (Test-Path $ausschlussDatei) {
        $bekannt += Get-Content $ausschlussDatei | Where-Object { $_ -match '^/' } | ForEach-Object { $_.Trim() }
      }
      $sq = ConvertTo-ShellString $sshPath
      $listeSkript = "cd $sq && for e in * .[!.]*; do [ -e `"`$e`" ] || continue; if [ -d `"`$e`" ]; then printf '/%s/\n' `"`$e`"; else printf '/%s\n' `"`$e`"; fi; done"
      $fremd = @(Invoke-Remote $sshKey $ziel $listeSkript | Where-Object { $_ -match '^/' -and $_ -notin $bekannt })
      if ($fremd.Count -gt 0) {
        Write-Warnung "Im Zielordner liegt bereits Inhalt, der nicht aus diesem Build stammt:"
        $fremd | ForEach-Object { Write-Host "     $_" }
        Write-Host '   rsync löscht beim Upload alles, was nicht im Build ist – außer Einträgen in deploy-ausschluss.txt.'
        Write-Host '   Schützen: z. B. Staging-Ordner, Google-/Bing-Verifizierungsdateien. Nicht schützen: Reste einer alten Seite.'
        if (Read-JaNein 'Alle aufgeführten Einträge in deploy-ausschluss.txt eintragen (schützen)?' $false) {
          # LF-Zeilenenden, ohne BOM (rsync liest die Datei auf Linux)
          [IO.File]::AppendAllText($ausschlussDatei, ($fremd -join "`n") + "`n", [Text.UTF8Encoding]::new($false))
          Write-Ok 'deploy-ausschluss.txt ergänzt – bitte committen und pushen, bevor der nächste Upload läuft.'
        } else {
          Write-Host '   Einzelne Einträge kannst du auch von Hand in deploy-ausschluss.txt ergänzen.'
        }
      }
    }
  }

  if ((Get-Variable sshAktiv -ErrorAction SilentlyContinue) -and $sshAktiv) {
    $secrets['SSH_HOST'] = $sshHost
    $secrets['SSH_PORT'] = $sshPort
    $secrets['SSH_USER'] = $sshUser
    $secrets['SSH_KEY'] = (Get-Content $keyDatei -Raw)
    $secrets['SSH_KNOWN_HOSTS'] = (Get-Content $knownHosts -Raw)
    $secrets['SSH_PATH'] = $sshPath
  }

  # ---------------------------------------------------------------- FTPS (Rückfall)
  if (Read-JaNein 'FTPS als Rückfall einrichten?') {
    Write-Schritt 'FTPS-Zugang'
    $ftpStandard = if ($secrets.Contains('SSH_HOST')) { $secrets['SSH_HOST'] } else { '' }
    $ftpHost = Read-Wert 'FTP-Host' $ftpStandard
    $ftpPort = Read-Wert 'FTP-Port' '21'
    $ftpUser = Read-Wert 'FTP-Benutzer'
    $ftpPassSecure = Read-Host 'FTP-Passwort' -AsSecureString
    $ftpPfadAngabe = Read-Wert 'Pfad wie beim Hoster angezeigt (leer = automatisch suchen)'
    if ($ftpHost -notmatch '^[A-Za-z0-9.-]+$') { throw "Ungültiger Host: $ftpHost" }
    if ($ftpPort -notmatch '^\d+$') { throw "Ungültiger Port: $ftpPort" }
    if (-not $ftpUser) { throw 'FTP-Benutzer ist Pflicht.' }

    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($ftpPassSecure)
    try { $ftpPass = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
    if ($ftpPass -match '\s|"') { Write-Warnung 'Passwort enthält Leer- oder Anführungszeichen – die automatische Pfadsuche kann daran scheitern.' }

    # Zugangsdaten für curl in einer temporären netrc-Datei (nicht in der Kommandozeile)
    $netrc = Join-Path $tmp 'netrc'
    # ohne BOM – sonst erkennt curl das erste Wort "machine" nicht
    [IO.File]::WriteAllText($netrc, "machine $ftpHost login $ftpUser password $ftpPass`n", [Text.UTF8Encoding]::new($false))
    icacls $netrc /inheritance:r /grant:r "$($env:USERNAME):(R,W)" | Out-Null

    $ftpSecurity = 'strict'
    $curlBasis = @('-s', '--ssl-reqd', '--netrc-file', $netrc, '--max-time', '30')
    & curl.exe @curlBasis --list-only "ftp://${ftpHost}:$ftpPort/" -o NUL
    if ($LASTEXITCODE -eq 60 -or $LASTEXITCODE -eq 35) {
      Write-Warnung 'Das TLS-Zertifikat des FTP-Servers passt nicht zum Hostnamen (typisch bei Shared Hosting).'
      if (-not (Read-JaNein 'Trotzdem fortfahren (Verbindung bleibt verschlüsselt, Zertifikat wird nicht geprüft)?' $false)) { throw 'Abgebrochen.' }
      $curlBasis += '-k'
      $ftpSecurity = 'loose'
      & curl.exe @curlBasis --list-only "ftp://${ftpHost}:$ftpPort/" -o NUL
    }
    if ($LASTEXITCODE -ne 0) { throw "FTPS-Anmeldung fehlgeschlagen (curl-Code $LASTEXITCODE)." }
    Write-Ok 'FTPS-Anmeldung funktioniert'

    Write-Schritt 'FTP-Zielordner ermitteln'
    $roh = $ftpPfadAngabe.Trim().Trim('/')
    $kandidatenFtp = [System.Collections.Generic.List[string]]::new()
    $basen = @('', 'html', 'htdocs', 'www', 'public_html', 'httpdocs', 'web')
    $teile = @($roh, $Domain, '') | Select-Object -Unique
    foreach ($b in $basen) { foreach ($t in $teile) {
      $k = (@($b, $t) | Where-Object { $_ }) -join '/'
      $k = '/' + $k
      if (-not $kandidatenFtp.Contains($k)) { $kandidatenFtp.Add($k) }
    } }
    if ($roh -and -not $kandidatenFtp.Contains($roh)) { $kandidatenFtp.Insert(0, $roh) }

    $markerDatei = Join-Path $tmp 'marker.txt'
    $marker = 'deploy-check-' + [guid]::NewGuid().ToString('N').Substring(0, 12) + '.txt'
    $token = [guid]::NewGuid().ToString('N')
    [IO.File]::WriteAllText($markerDatei, $token)
    $ftpPath = $null
    foreach ($k in $kandidatenFtp) {
      $url = "ftp://${ftpHost}:$ftpPort" + ('/' + $k.TrimStart('/')).TrimEnd('/') + '/'
      & curl.exe @curlBasis -T $markerDatei "$url$marker" 2>$null
      if ($LASTEXITCODE -ne 0) { continue }
      $treffer = Test-HttpMarker $Domain $marker $token
      & curl.exe @curlBasis $url --list-only -o NUL -Q "-DELE $marker" 2>$null
      if ($treffer) { $ftpPath = $k; break }
    }
    if ($ftpPath) {
      Write-Ok "FTP-Pfad für $Domain ist $ftpPath"
    } else {
      Write-Warnung "Kein FTP-Ordner war unter https://$Domain/ erreichbar."
      $ftpPath = Read-Wert 'FTP-Pfad manuell eintippen (relativ zum FTP-Stammordner, z. B. /staging)'
      if (-not $ftpPath) { throw 'Kein FTP-Pfad angegeben.' }
      Write-Warnung "Ungeprüft übernommen: $ftpPath"
    }

    $secrets['FTP_HOST'] = $ftpHost
    $secrets['FTP_PORT'] = $ftpPort
    $secrets['FTP_USER'] = $ftpUser
    $secrets['FTP_PASSWORD'] = $ftpPass
    # FTP-Deploy-Action erwartet einen Ordner mit abschließendem Schrägstrich
    $secrets['FTP_PATH'] = ($ftpPath.TrimEnd('/') + '/')
    $ftpPass = $null
  }

  if ($secrets.Count -eq 0) { throw 'Weder SSH noch FTPS eingerichtet – nichts zu speichern.' }

  # ---------------------------------------------------------------- In GitHub speichern
  Write-Schritt "Secrets im GitHub-Environment '$Umgebung' speichern"
  foreach ($name in $secrets.Keys) { Set-GhSecret $name $secrets[$name] }
  gh variable set SITE_URL --env $Umgebung --repo $script:Repo --body "https://$Domain" | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'gh variable set SITE_URL fehlgeschlagen' }
  Write-Ok "Variable SITE_URL = https://$Domain"
  if ($secrets.Contains('FTP_HOST')) {
    gh variable set FTP_SECURITY --env $Umgebung --repo $script:Repo --body $ftpSecurity | Out-Null
    Write-Ok "Variable FTP_SECURITY = $ftpSecurity (Zertifikatsprüfung beim FTPS-Upload)"
  }

  Write-Host "`nFertig. Der nächste Push auf '$(if ($Umgebung -eq 'production') { 'main (über die Freigabe)' } else { 'staging' })' lädt nach https://$Domain hoch." -ForegroundColor Green
  Write-Host 'Tipp: GitHub → Actions → Deploy → Run workflow mit "Probelauf" zeigt vorher, was passieren würde.'
  if ($secrets.Contains('SSH_KEY')) {
    Write-Host "Deploy-Schlüssel widerrufen: auf dem Server die Zeile mit '$kommentar' aus ~/.ssh/authorized_keys löschen."
  }
}
finally {
  $secrets.Clear()
  # Privaten Schlüssel, netrc und Hilfsdateien lokal wieder löschen
  if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }
}
