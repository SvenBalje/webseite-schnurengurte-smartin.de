#!/usr/bin/env bash
# Richtet die GitHub-Secrets für den Upload ein (Mac/Linux-Variante von setup-secrets.ps1).
#   scripts/setup-secrets.sh staging
#   scripts/setup-secrets.sh production
# - SSH: eigener Deploy-Schlüssel, Passwort nur im ssh-Prompt (wird nicht gespeichert)
# - ermittelt den Zielordner selbst (Prüfdatei + Abruf über https://<domain>/)
# - FTPS als Rückfall, Zugangsdaten für curl nur in einer temporären netrc-Datei
# Benötigt bash ≥ 4 (macOS: "brew install bash", dann mit "bash scripts/setup-secrets.sh …" starten).
set -euo pipefail
[ "${BASH_VERSINFO[0]}" -ge 4 ] || { echo 'Bitte bash ≥ 4 verwenden (macOS: brew install bash).' >&2; exit 1; }

UMGEBUNG="${1:-}"
case "$UMGEBUNG" in staging|production) ;; *) echo "Aufruf: $0 staging|production" >&2; exit 1 ;; esac

schritt() { printf '\n\033[36m== %s\033[0m\n' "$1"; }
ok()      { printf '   \033[32mOK\033[0m  %s\n' "$1"; }
warn()    { printf '   \033[33m!\033[0m   %s\n' "$1"; }
frage()   { local a; read -r -p "$1${2:+ [$2]}: " a; printf '%s' "${a:-${2:-}}"; }
janein()  { local a; read -r -p "$1 (${2:-J/n}) " a; a=$(printf '%s' "$a" | tr '[:upper:]' '[:lower:]'); [ -z "$a" ] && [ "${2:-J/n}" = "J/n" ] && return 0; [[ "$a" =~ ^(j|ja|y|yes)$ ]]; }
shq()     { printf "'%s'" "$(printf '%s' "$1" | sed "s/'/'\\\\''/g")"; }

for c in gh ssh ssh-keygen ssh-keyscan curl; do command -v "$c" >/dev/null || { echo "$c fehlt" >&2; exit 1; }; done
gh auth status >/dev/null 2>&1 || { echo 'GitHub CLI nicht angemeldet: gh auth login' >&2; exit 1; }
REPO=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
ok "Repo: $REPO"

DOMAIN=$(frage "Domain der Umgebung '$UMGEBUNG' (z. B. staging.kunde.de)")
DOMAIN=$(printf '%s' "$DOMAIN" | sed -E 's#^[a-z]+://##; s#/.*$##' | tr '[:upper:]' '[:lower:]')
[[ "$DOMAIN" =~ ^[a-z0-9.-]+\.[a-z]{2,}$ ]] || { echo "Ungültige Domain: $DOMAIN" >&2; exit 1; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
declare -A SECRETS=()
REIHENFOLGE=()
setze() { SECRETS[$1]="$2"; REIHENFOLGE+=("$1"); }

http_marker() { # $1 Datei, $2 Token
  local s; for s in https http; do
    [ "$(curl -s -k -L --max-time 15 "$s://$DOMAIN/$1" 2>/dev/null | tr -d '\r\n')" = "$2" ] && return 0
  done; return 1
}

gh api -X PUT "repos/$REPO/environments/$UMGEBUNG" --silent
ok "Environment '$UMGEBUNG' vorhanden"

# ---------------------------------------------------------------- SSH
if janein 'SSH/rsync einrichten (empfohlen)?'; then
  schritt 'SSH-Zugang'
  SSH_HOST=$(frage 'SSH-Host'); SSH_PORT=$(frage 'SSH-Port' 22); SSH_USER=$(frage 'SSH-Benutzer')
  PFAD=$(frage 'Pfad wie beim Hoster angezeigt (leer = automatisch suchen)')
  [[ "$SSH_HOST" =~ ^[A-Za-z0-9.-]+$ && "$SSH_PORT" =~ ^[0-9]+$ && "$SSH_USER" =~ ^[A-Za-z0-9._-]+$ ]] || { echo 'Ungültige Angaben' >&2; exit 1; }

  ssh-keyscan -q -p "$SSH_PORT" "$SSH_HOST" > "$TMP/known_hosts" 2>/dev/null
  [ -s "$TMP/known_hosts" ] || { echo "ssh-keyscan erreicht $SSH_HOST nicht" >&2; exit 1; }
  echo '   Fingerprints des Servers:'; ssh-keygen -lf "$TMP/known_hosts" | sed 's/^/     /'
  janein 'Ist das der richtige Server?' || exit 1

  BASIS=(-p "$SSH_PORT" -o "UserKnownHostsFile=$TMP/known_hosts" -o StrictHostKeyChecking=yes -o ConnectTimeout=20 -o LogLevel=ERROR)
  ZIEL="$SSH_USER@$SSH_HOST"
  KOMMENTAR="github-deploy-${REPO//[^A-Za-z0-9._-]/-}-$UMGEBUNG"
  ssh-keygen -q -t ed25519 -N '' -C "$KOMMENTAR" -f "$TMP/deploy_key"
  EINTRAG="no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty $(cat "$TMP/deploy_key.pub")"

  schritt 'Deploy-Schlüssel auf dem Server hinterlegen (ssh fragt nach dem Passwort)'
  ssh "${BASIS[@]}" -o PubkeyAuthentication=no "$ZIEL" \
    "umask 077; mkdir -p ~/.ssh && touch ~/.ssh/authorized_keys && k=$(shq "$EINTRAG") && { grep -qxF \"\$k\" ~/.ssh/authorized_keys || printf '%s\n' \"\$k\" >> ~/.ssh/authorized_keys; }"
  KEY=(-i "$TMP/deploy_key" -o BatchMode=yes -o IdentitiesOnly=yes "${BASIS[@]}")
  TEST=$(ssh "${KEY[@]}" "$ZIEL" 'echo deploy-ok; command -v rsync >/dev/null && echo rsync-ok' || true)
  [[ "$TEST" == *deploy-ok* ]] || { echo 'Anmeldung mit neuem Schlüssel schlägt fehl' >&2; exit 1; }
  ok 'Anmeldung mit Deploy-Schlüssel funktioniert'
  [[ "$TEST" == *rsync-ok* ]] || warn 'rsync fehlt auf dem Server – der Workflow fällt auf FTPS zurück.'

  schritt 'Zielordner ermitteln'
  P=$(shq "${PFAD%/}"); D=$(shq "$DOMAIN")
  mapfile -t KANDIDATEN < <(ssh "${KEY[@]}" "$ZIEL" "P=$P; D=$D; H=\$HOME
for b in '' \"\$H\" \"\$H/html\" \"\$H/htdocs\" \"\$H/www\" \"\$H/public_html\" \"\$H/httpdocs\" \"\$H/web\" \"\$H/domains\"; do
  for s in \"\$P\" \"\$D\" \"\$D/public_html\" \"\$D/htdocs\" ''; do
    c=\"\$b/\$s\"; [ -z \"\$b\" ] && c=\"\$s\"
    [ -n \"\$c\" ] && [ -d \"\$c\" ] && [ -w \"\$c\" ] && (cd \"\$c\" && pwd -P)
  done
done | awk '!x[\$0]++'" | grep '^/' || true)

  MARKER="deploy-check-$(openssl rand -hex 6 2>/dev/null || date +%s).txt"; TOKEN=$(openssl rand -hex 16 2>/dev/null || date +%s%N)
  SSH_PATH=''
  for k in "${KANDIDATEN[@]}"; do
    kq=$(shq "$k")
    ssh "${KEY[@]}" "$ZIEL" "printf '%s' '$TOKEN' > $kq/$MARKER" 2>/dev/null || continue
    if http_marker "$MARKER" "$TOKEN"; then treffer=1; else treffer=0; fi
    ssh "${KEY[@]}" "$ZIEL" "rm -f $kq/$MARKER" 2>/dev/null || true
    [ "$treffer" = 1 ] && { SSH_PATH="$k"; break; }
  done
  if [ -n "$SSH_PATH" ]; then ok "Webroot von $DOMAIN ist $SSH_PATH"
  else
    warn "Kein Ordner war unter https://$DOMAIN/ erreichbar."
    i=1; for k in "${KANDIDATEN[@]}"; do echo "     [$i] $k"; i=$((i+1)); done
    W=$(frage 'Nummer wählen oder absoluten Pfad eintippen')
    if [[ "$W" =~ ^[0-9]+$ ]] && [ "$W" -ge 1 ] && [ "$W" -le "${#KANDIDATEN[@]}" ]; then SSH_PATH="${KANDIDATEN[$((W-1))]}"
    elif [[ "$W" == /* ]]; then SSH_PATH="${W%/}"; else echo 'Kein Zielordner' >&2; exit 1; fi
    warn "ACHTUNG: rsync ersetzt bei jedem Upload den GESAMTEN Inhalt von $SSH_PATH."
    [ "$UMGEBUNG" = staging ] && warn 'Bei Staging darf das auf keinen Fall der Ordner der Live-Seite sein.'
    B=$(frage 'Zur Bestätigung den Pfad noch einmal vollständig eintippen')
    [ "${B%/}" = "$SSH_PATH" ] || { echo 'Pfad nicht bestätigt – abgebrochen.' >&2; exit 1; }
    warn "Ungeprüft übernommen: $SSH_PATH"
  fi

  SSH_AKTIV=1
  HOMEDIR=$(ssh "${KEY[@]}" "$ZIEL" 'cd ~ && pwd -P' || true)
  if [ "$SSH_PATH" = / ] || [ "$SSH_PATH" = "$HOMEDIR" ]; then
    warn "Der Webroot ist das Home-Verzeichnis ($SSH_PATH) – rsync ist dort gesperrt. Es werden keine SSH-Secrets gespeichert, bitte FTPS einrichten."
    SSH_AKTIV=0
  fi

  if [ "$SSH_AKTIV" = 1 ]; then
    # Fremde Ordner/Dateien im Zielordner vor rsync --delete schützen
    AUSSCHLUSS="$(dirname "$0")/../deploy-ausschluss.txt"
    mapfile -t EINTRAEGE < <(ssh "${KEY[@]}" "$ZIEL" "cd $(shq "$SSH_PATH") && for e in * .[!.]*; do [ -e \"\$e\" ] || continue; if [ -d \"\$e\" ]; then printf '/%s/\n' \"\$e\"; else printf '/%s\n' \"\$e\"; fi; done" || true)
    FREMD=()
    for e in "${EINTRAEGE[@]}"; do
      case "$e" in /_astro/|/impressum/|/datenschutz/|/index.html|/404.html|/robots.txt|/sitemap-index.xml|/sitemap-0.xml|/favicon.svg|/.htaccess|'') continue ;; esac
      grep -qxF "$e" "$AUSSCHLUSS" 2>/dev/null || FREMD+=("$e")
    done
    if [ "${#FREMD[@]}" -gt 0 ]; then
      warn 'Im Zielordner liegt Inhalt, der nicht aus diesem Build stammt:'; printf '     %s\n' "${FREMD[@]}"
      echo '   Schützen: z. B. Staging-Ordner, Verifizierungsdateien. Nicht schützen: Reste einer alten Seite.'
      if janein 'Alle aufgeführten Einträge in deploy-ausschluss.txt eintragen (schützen)?' 'j/N'; then
        printf '%s\n' "${FREMD[@]}" >> "$AUSSCHLUSS"; ok 'deploy-ausschluss.txt ergänzt – bitte committen und pushen.'
      fi
    fi
    setze SSH_HOST "$SSH_HOST"; setze SSH_PORT "$SSH_PORT"; setze SSH_USER "$SSH_USER"
    setze SSH_KEY "$(cat "$TMP/deploy_key")"; setze SSH_KNOWN_HOSTS "$(cat "$TMP/known_hosts")"; setze SSH_PATH "$SSH_PATH"
  fi
fi

# ---------------------------------------------------------------- FTPS
if janein 'FTPS als Rückfall einrichten?'; then
  schritt 'FTPS-Zugang'
  FTP_HOST=$(frage 'FTP-Host' "${SECRETS[SSH_HOST]:-}"); FTP_PORT=$(frage 'FTP-Port' 21); FTP_USER=$(frage 'FTP-Benutzer')
  read -r -s -p 'FTP-Passwort: ' FTP_PASS; echo
  FPFAD=$(frage 'Pfad wie beim Hoster angezeigt (leer = automatisch suchen)')
  [[ "$FTP_HOST" =~ ^[A-Za-z0-9.-]+$ && "$FTP_PORT" =~ ^[0-9]+$ && -n "$FTP_USER" ]] || { echo 'Ungültige Angaben' >&2; exit 1; }
  ( umask 077; printf 'machine %s login %s password %s\n' "$FTP_HOST" "$FTP_USER" "$FTP_PASS" > "$TMP/netrc" )
  CURL=(-s --ssl-reqd --netrc-file "$TMP/netrc" --max-time 30)
  FTP_SECURITY=strict
  rc=0; curl "${CURL[@]}" --list-only "ftp://$FTP_HOST:$FTP_PORT/" -o /dev/null || rc=$?
  if [ "$rc" = 60 ] || [ "$rc" = 35 ]; then
    warn 'TLS-Zertifikat passt nicht zum Hostnamen (typisch bei Shared Hosting).'
    janein 'Trotzdem fortfahren (verschlüsselt, Zertifikat ungeprüft)?' 'j/N' || exit 1
    CURL+=(-k); FTP_SECURITY=loose; rc=0; curl "${CURL[@]}" --list-only "ftp://$FTP_HOST:$FTP_PORT/" -o /dev/null || rc=$?
  fi
  [ "$rc" = 0 ] || { echo "FTPS-Anmeldung fehlgeschlagen (curl $rc)" >&2; exit 1; }
  ok 'FTPS-Anmeldung funktioniert'

  schritt 'FTP-Zielordner ermitteln'
  ROH="${FPFAD#/}"; ROH="${ROH%/}"
  KAND=(); [ -n "$ROH" ] && KAND+=("/$ROH")
  for b in '' html htdocs www public_html httpdocs web; do for t in "$ROH" "$DOMAIN" ''; do
    k="/$(printf '%s\n' "$b" "$t" | grep -v '^$' | paste -sd/ -)"; [[ " ${KAND[*]} " == *" $k "* ]] || KAND+=("$k")
  done; done
  MARKER="deploy-check-$(openssl rand -hex 6 2>/dev/null || date +%s).txt"; TOKEN=$(openssl rand -hex 16 2>/dev/null || date +%s%N)
  printf '%s' "$TOKEN" > "$TMP/marker"
  FTP_PATH=''
  for k in "${KAND[@]}"; do
    url="ftp://$FTP_HOST:$FTP_PORT${k%/}/"
    curl "${CURL[@]}" -T "$TMP/marker" "$url$MARKER" 2>/dev/null || continue
    if http_marker "$MARKER" "$TOKEN"; then treffer=1; else treffer=0; fi
    curl "${CURL[@]}" "$url" --list-only -o /dev/null -Q "-DELE $MARKER" 2>/dev/null || true
    [ "$treffer" = 1 ] && { FTP_PATH="$k"; break; }
  done
  if [ -n "$FTP_PATH" ]; then ok "FTP-Pfad für $DOMAIN ist $FTP_PATH"
  else FTP_PATH=$(frage 'Kein Treffer – FTP-Pfad manuell eintippen (z. B. /staging)'); [ -n "$FTP_PATH" ] || exit 1; warn "Ungeprüft: $FTP_PATH"; fi

  setze FTP_HOST "$FTP_HOST"; setze FTP_PORT "$FTP_PORT"; setze FTP_USER "$FTP_USER"
  setze FTP_PASSWORD "$FTP_PASS"; setze FTP_PATH "${FTP_PATH%/}/"
  unset FTP_PASS
fi

[ "${#REIHENFOLGE[@]}" -gt 0 ] || { echo 'Nichts eingerichtet.' >&2; exit 1; }

schritt "Secrets im Environment '$UMGEBUNG' speichern"
for n in "${REIHENFOLGE[@]}"; do printf '%s' "${SECRETS[$n]}" | gh secret set "$n" --env "$UMGEBUNG" --repo "$REPO" >/dev/null; ok "Secret $n gesetzt"; done
gh variable set SITE_URL --env "$UMGEBUNG" --repo "$REPO" --body "https://$DOMAIN" >/dev/null
ok "Variable SITE_URL = https://$DOMAIN"
if [ -n "${FTP_SECURITY:-}" ]; then
  gh variable set FTP_SECURITY --env "$UMGEBUNG" --repo "$REPO" --body "$FTP_SECURITY" >/dev/null
  ok "Variable FTP_SECURITY = $FTP_SECURITY"
fi
printf '\n\033[32mFertig.\033[0m Probelauf: GitHub → Actions → Deploy → Run workflow mit „Probelauf“.\n'
[ -n "${KOMMENTAR:-}" ] && echo "Schlüssel widerrufen: Zeile mit '$KOMMENTAR' aus ~/.ssh/authorized_keys auf dem Server löschen."
exit 0
