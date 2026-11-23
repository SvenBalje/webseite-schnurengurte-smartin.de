#!/usr/bin/env node
// Prüft den Build in dist/ vor jedem Upload.
//   npm run check              → Platzhalter sind Warnungen (lokal, Staging)
//   npm run check:produktion   → Platzhalter sind Fehler (vor jedem Produktions-Upload)
// Keine Abhängigkeiten, damit es überall gleich läuft.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, sep, extname } from 'node:path';

const PRODUKTION = process.argv.includes('--produktion');
const DIST = 'dist';

const fehler = [];
const warnungen = [];
const melde = (liste, datei, text) => liste.push(`${datei}: ${text}`);

if (!existsSync(DIST)) {
  console.error('dist/ fehlt – zuerst "npm run build" ausführen.');
  process.exit(1);
}

function* dateien(ordner) {
  for (const eintrag of readdirSync(ordner, { withFileTypes: true })) {
    const pfad = join(ordner, eintrag.name);
    if (eintrag.isDirectory()) yield* dateien(pfad);
    else yield pfad;
  }
}

const alle = [...dateien(DIST)];
const rel = (p) => relative(DIST, p).split(sep).join('/');
const htmlDateien = alle.filter((p) => p.endsWith('.html'));
const textDateien = alle.filter((p) =>
  ['.html', '.js', '.css', '.xml', '.txt', '.json', '.svg', '.webmanifest'].includes(extname(p)) ||
  p.endsWith('.htaccess'),
);

// --- Hilfen ---------------------------------------------------------------
const entschaerfen = (s) =>
  s
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))?.slice(1).find((v) => v !== undefined);
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((m) => m[0]);

// URL → Datei in dist/ auflösen
const vorhanden = new Set(alle.map(rel));
function zielExistiert(pfad) {
  let p = decodeURI(pfad.split('#')[0].split('?')[0]).replace(/^\//, '');
  if (p === '') return vorhanden.has('index.html');
  if (vorhanden.has(p)) return true;
  if (p.endsWith('/')) return vorhanden.has(`${p}index.html`);
  return vorhanden.has(`${p}/index.html`) || vorhanden.has(`${p}.html`);
}

// --- 1. Je HTML-Seite -----------------------------------------------------
const titel = new Map();
const beschreibungen = new Map();

for (const datei of htmlDateien) {
  const name = rel(datei);
  const roh = readFileSync(datei, 'utf8');
  const html = entschaerfen(roh);
  const ist404 = name === '404.html';

  const t = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  if (!t) melde(fehler, name, 'kein <title>');
  else {
    if (titel.has(t) && !ist404) melde(fehler, name, `title doppelt (auch in ${titel.get(t)})`);
    titel.set(t, name);
    if (t.length > 65) melde(warnungen, name, `title ist ${t.length} Zeichen lang (empfohlen ≤ 60)`);
  }

  const desc = tags(html, 'meta').find((m) => attr(m, 'name')?.toLowerCase() === 'description');
  const d = desc && attr(desc, 'content')?.trim();
  if (!d) melde(fehler, name, 'keine Meta-Description');
  else {
    if (beschreibungen.has(d) && !ist404) melde(warnungen, name, `Meta-Description doppelt (auch in ${beschreibungen.get(d)})`);
    beschreibungen.set(d, name);
    if (d.length < 50 || d.length > 170) melde(warnungen, name, `Meta-Description ist ${d.length} Zeichen lang (empfohlen 50–160)`);
  }

  const h1 = tags(html, 'h1').length;
  if (h1 !== 1) melde(fehler, name, `${h1} <h1> statt genau einer`);

  if (!/<html[^>]*\slang=/i.test(html)) melde(fehler, name, '<html> ohne lang-Attribut');

  const canon = tags(html, 'link').filter((l) => attr(l, 'rel')?.toLowerCase() === 'canonical');
  if (!ist404) {
    if (canon.length !== 1) melde(fehler, name, `${canon.length} Canonical-Links statt einem`);
    else if (!/^https:\/\//.test(attr(canon[0], 'href') || '')) melde(fehler, name, 'Canonical ist keine absolute https-URL');
  }

  for (const img of tags(html, 'img')) {
    if (attr(img, 'alt') === undefined) melde(fehler, name, `Bild ohne alt-Attribut: ${attr(img, 'src')}`);
  }

  if (!ist404) {
    if (!/href="\/impressum\/?"/.test(html)) melde(fehler, name, 'kein Link zum Impressum');
    if (!/href="\/datenschutz\/?"/.test(html)) melde(fehler, name, 'kein Link zur Datenschutzerklärung');
  }

  // Links (a, canonical …) dürfen extern sein; Ressourcen, die der Browser sofort lädt, nicht.
  const srcset = (t) => (attr(t, 'srcset') || '').split(',').map((s) => s.trim().split(/\s+/)[0]).filter(Boolean);
  const links = [
    ...tags(html, 'a').map((a) => attr(a, 'href')),
    ...tags(html, 'link').filter((l) => /^(canonical|alternate|sitemap)$/i.test(attr(l, 'rel') || '')).map((l) => attr(l, 'href')),
  ].filter(Boolean);
  const ressourcen = [
    ...tags(html, 'link').filter((l) => !/^(canonical|alternate|sitemap)$/i.test(attr(l, 'rel') || '')).map((l) => attr(l, 'href')),
    ...tags(roh, 'script').map((s) => attr(s, 'src')),
    ...['img', 'source', 'iframe', 'video', 'audio', 'track', 'embed', 'object', 'input'].flatMap((n) =>
      tags(html, n).flatMap((t) => [attr(t, 'src'), attr(t, 'data'), attr(t, 'poster'), ...srcset(t)]),
    ),
    ...[...roh.matchAll(/style\s*=\s*"([^"]*)"/gi)].flatMap((m) => [...m[1].matchAll(/url\(\s*['"]?([^'")]+)/gi)].map((u) => u[1])),
  ].filter(Boolean);

  for (const [ziel, istRessource] of [...links.map((l) => [l, false]), ...ressourcen.map((r) => [r, true])]) {
    if (/^(mailto:|tel:|#|data:|javascript:|blob:)/i.test(ziel)) continue;
    if (/^(https?:)?\/\//i.test(ziel)) {
      if (istRessource) melde(fehler, name, `lädt externe Ressource (vor Einwilligung verboten): ${ziel}`);
      continue;
    }
    let absolut;
    try {
      absolut = ziel.startsWith('/') ? ziel : new URL(ziel, `https://x/${name}`).pathname;
      if (!zielExistiert(absolut)) melde(fehler, name, `defekter interner Link: ${ziel}`);
    } catch {
      melde(fehler, name, `ungültige URL: ${ziel}`);
    }
  }
}

// --- 1b. CSS: externe url() und @import ------------------------------------
for (const datei of alle.filter((p) => p.endsWith('.css'))) {
  const css = readFileSync(datei, 'utf8');
  for (const m of css.matchAll(/(?:@import\s+(?:url\()?|url\()\s*['"]?((?:https?:)?\/\/[^'")\s]+)/gi)) {
    melde(fehler, rel(datei), `lädt externe Ressource (vor Einwilligung verboten): ${m[1]}`);
  }
}

// --- 2. Pflichtdateien ----------------------------------------------------
for (const pflicht of ['404.html', 'robots.txt', 'sitemap-index.xml', '.htaccess', 'impressum/index.html', 'datenschutz/index.html']) {
  if (!vorhanden.has(pflicht)) melde(fehler, pflicht, 'fehlt im Build');
}
if (vorhanden.has('robots.txt') && !/Sitemap:\s*https:\/\//.test(readFileSync(join(DIST, 'robots.txt'), 'utf8')) &&
    !/Disallow:\s*\/\s*$/m.test(readFileSync(join(DIST, 'robots.txt'), 'utf8'))) {
  melde(warnungen, 'robots.txt', 'kein Sitemap-Verweis');
}

// --- 3. Platzhalter und Zugangsdaten in allen Textdateien ----------------
const PLATZHALTER = [
  [/PLATZHALTER/i, 'PLATZHALTER'],
  [/lorem ipsum|\blorem\b/i, 'Lorem ipsum'],
  [/\bTODO\b|\bFIXME\b/, 'TODO/FIXME'],
  [/\bexample\.(com|org|net)\b/i, 'example.com'],
];
const GEHEIMNISSE = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'privater Schlüssel'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS-Zugangsschlüssel'],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}\b/, 'GitHub-Token'],
  [/\bgithub_pat_[A-Za-z0-9_]{40,}\b/, 'GitHub-Token'],
  [/\bsk-(live|proj|ant)-[A-Za-z0-9_-]{20,}/, 'API-Schlüssel'],
  [/\bsk_live_[A-Za-z0-9]{20,}\b/, 'Stripe-Live-Schlüssel'],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, 'Google-API-Schlüssel'],
  [/\bxox[abpr]-[A-Za-z0-9-]{10,}/, 'Slack-Token'],
  [/(passw(or)?d|pwd|secret|api[_-]?key|access[_-]?token)\s*["']?\s*[:=]\s*["'][^"'\s]{6,}["']/i, 'Zugangsdaten-Zuweisung'],
];

for (const datei of textDateien) {
  const name = rel(datei);
  if (statSync(datei).size > 5_000_000) continue;
  const inhalt = readFileSync(datei, 'utf8');
  const sichtbar = name.endsWith('.html') ? entschaerfen(inhalt) : name.endsWith('.htaccess') ? '' : inhalt;
  for (const [muster, label] of PLATZHALTER) {
    if (muster.test(sichtbar)) melde(PRODUKTION ? fehler : warnungen, name, `Platzhalter gefunden: ${label}`);
  }
  for (const [muster, label] of GEHEIMNISSE) {
    if (muster.test(inhalt)) melde(fehler, name, `mögliche Zugangsdaten: ${label}`);
  }
}

// --- Ergebnis -------------------------------------------------------------
console.log(`Geprüft: ${htmlDateien.length} Seiten, ${textDateien.length} Textdateien${PRODUKTION ? ' (Produktionsmodus)' : ''}`);
if (warnungen.length) {
  console.log(`\n⚠️  ${warnungen.length} Warnung(en):`);
  for (const w of warnungen) console.log(`   - ${w}`);
}
if (fehler.length) {
  console.log(`\n❌ ${fehler.length} Fehler:`);
  for (const f of fehler) console.log(`   - ${f}`);
  process.exit(1);
}
console.log('\n✅ Keine Fehler.');
