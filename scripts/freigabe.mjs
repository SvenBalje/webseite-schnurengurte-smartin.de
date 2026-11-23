#!/usr/bin/env node
// Freigabe für Produktion: main per Fast-Forward auf origin/staging setzen und pushen.
// Der Push auf main startet den Workflow "Deploy" für die Umgebung production.
// Alternative ohne Terminal: GitHub → Actions → "Freigabe für Produktion" → Run workflow.
import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const abbruch = (text) => {
  console.error(`\n❌ ${text}`);
  process.exit(1);
};

if (git('status', '--porcelain')) abbruch('Es gibt nicht committete Änderungen. Bitte erst committen oder verwerfen.');

console.log('Hole aktuellen Stand von GitHub …');
git('fetch', 'origin', '--prune');

const staging = git('rev-parse', 'origin/staging');
let main;
try {
  main = git('rev-parse', 'origin/main');
} catch {
  main = null;
}

if (main === staging) abbruch('main ist bereits auf dem Stand von staging – nichts freizugeben.');
if (main) {
  try {
    git('merge-base', '--is-ancestor', 'origin/main', 'origin/staging');
  } catch {
    abbruch('main enthält Commits, die nicht in staging sind. Bitte zuerst main in staging übernehmen.');
  }
}

const neu = git('log', '--oneline', main ? `${main}..${staging}` : staging);
console.log(`\nDiese Änderungen gehen live:\n${neu}\n`);

const rl = createInterface({ input: process.stdin, output: process.stdout });
const antwort = (await rl.question('Hat der Kunde die Staging-Version freigegeben? Jetzt live schalten? (ja/nein) ')).trim().toLowerCase();
rl.close();
if (antwort !== 'ja' && antwort !== 'j') abbruch('Abgebrochen.');

// Fast-Forward-Push direkt von origin/staging auf main (ohne lokalen Checkout)
git('push', 'origin', `${staging}:refs/heads/main`);
console.log('\n✅ main aktualisiert. GitHub Actions lädt jetzt auf Produktion hoch:');
try {
  const repo = git('remote', 'get-url', 'origin').replace(/\.git$/, '').replace(/^git@github\.com:/, 'https://github.com/');
  console.log(`   ${repo}/actions`);
} catch {
  /* egal */
}
