<?php
// Kontaktformular von schnurengurte-smartin.de
// Verschickt die Anfrage per mail() an eine fest eingetragene Adresse.
// Sicherheit: nur POST, fester Empfänger, keine Benutzereingaben in Mail-Kopfzeilen außer geprüftem Reply-To,
// Honigtopf-Feld und Mindest-Ausfüllzeit gegen Spam-Bots.

declare(strict_types=1);

// Keine PHP-Fehlermeldungen (Serverpfade) an Besucher ausgeben
ini_set('display_errors', '0');

// Empfänger: bei Änderung der E-Mail-Adresse auch src/site.config.ts (impressum.email) anpassen
const EMPFAENGER = 'info@schnurengurte-smartin.de';
const ABSENDER = 'info@schnurengurte-smartin.de';
const MIN_SEKUNDEN = 3;

function weiter(string $ziel): void
{
    header('Location: ' . $ziel, true, 303);
    exit;
}

function feld(string $name, int $max): string
{
    $wert = $_POST[$name] ?? '';
    if (!is_string($wert)) {
        return '';
    }
    $wert = trim($wert);
    // Steuerzeichen entfernen (Zeilenumbrüche nur in der Nachricht erlaubt)
    $wert = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $wert) ?? '';
    return mb_substr($wert, 0, $max);
}

function einzeilig(string $wert): string
{
    return trim(preg_replace('/[\r\n]+/', ' ', $wert) ?? '');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST', true, 405);
    exit;
}

// Nur Formulare von dieser Webseite annehmen (Browser senden den Origin-Header bei POST mit)
$herkunft = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($herkunft !== '' && parse_url($herkunft, PHP_URL_HOST) !== ($_SERVER['HTTP_HOST'] ?? '')) {
    weiter('/nachricht-fehler/');
}

// Spamschutz: Honigtopf muss leer sein, Formular darf nicht zu schnell abgeschickt werden
if (feld('webseite', 200) !== '') {
    weiter('/danke/');
}
// „dauer“ misst der Browser selbst (Sekunden seit Laden der Seite) – unabhängig von falsch gehenden Uhren
$dauer = feld('dauer', 10);
// Leer ist erlaubt (Besucher ohne JavaScript), alles andere als Ziffern ist manipuliert
if ($dauer !== '' && (!ctype_digit($dauer) || (int) $dauer < MIN_SEKUNDEN)) {
    weiter('/danke/');
}

$name = einzeilig(feld('name', 100));
$email = einzeilig(feld('email', 200));
$telefon = einzeilig(feld('telefon', 40));
$nachricht = feld('nachricht', 5000);
$seite = preg_replace('/[^a-z0-9-]/', '', strtolower(feld('seite', 40))) ?: 'unbekannt';

if ($name === '' || $nachricht === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    weiter('/nachricht-fehler/');
}

// Viele Links sind oft Spam – trotzdem zustellen, nur im Betreff markieren (keine echte Anfrage verlieren)
$verdacht = preg_match_all('#https?://#i', $nachricht) > 3;

$betreff = ($verdacht ? '[Spamverdacht] ' : '') . 'Anfrage über die Webseite (' . $seite . ')';
$text = "Neue Nachricht über das Kontaktformular auf schnurengurte-smartin.de\n\n"
    . "Name: {$name}\n"
    . "E-Mail: {$email}\n"
    . ($telefon !== '' ? "Telefon: {$telefon}\n" : '')
    . "Seite: {$seite}\n\n"
    . "Nachricht:\n{$nachricht}\n";

$kopf = [
    'From' => 'Webseite s.mARTin <' . ABSENDER . '>',
    'Reply-To' => $email,
    'MIME-Version' => '1.0',
    'Content-Type' => 'text/plain; charset=UTF-8',
    // quoted-printable: auch lange Absätze ohne Zeilenumbruch kommen unverändert an
    'Content-Transfer-Encoding' => 'quoted-printable',
];

$ok = mail(
    EMPFAENGER,
    mb_encode_mimeheader($betreff, 'UTF-8', 'B'),
    quoted_printable_encode($text),
    $kopf,
    '-f' . ABSENDER
);

weiter($ok ? '/danke/' : '/nachricht-fehler/');
