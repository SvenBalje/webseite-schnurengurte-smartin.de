#!/usr/bin/env node
// Macht den Build in dist/ zur Staging-Version:
//  - robots.txt sperrt alle Suchmaschinen
//  - .htaccess: X-Robots-Tag noindex, kein HSTS (Staging soll nicht für die Hauptdomain festnageln)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

if (!existsSync('dist')) {
  console.error('dist/ fehlt – zuerst "npm run build" ausführen.');
  process.exit(1);
}

writeFileSync('dist/robots.txt', 'User-agent: *\nDisallow: /\n');

const pfad = 'dist/.htaccess';
let ht = readFileSync(pfad, 'utf8');
const vorher = ht;
ht = ht.replace(/^[ \t]*# HSTS-START[\s\S]*?# HSTS-ENDE[^\n]*\n/m, '');
if (ht === vorher) {
  console.error('HSTS-Markierung in .htaccess nicht gefunden – Staging-Anpassung abgebrochen.');
  process.exit(1);
}
ht = ht.replace(
  /<IfModule mod_headers\.c>\n/,
  '<IfModule mod_headers.c>\n  # Staging: nicht indexieren\n  Header always set X-Robots-Tag "noindex, nofollow"\n',
);
writeFileSync(pfad, ht);

console.log('Staging vorbereitet: robots.txt gesperrt, X-Robots-Tag gesetzt, HSTS entfernt.');
