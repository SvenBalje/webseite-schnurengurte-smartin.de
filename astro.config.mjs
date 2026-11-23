import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';

// Produktions-URL aus src/site.config.ts lesen (ohne TS-Import im Config-Kontext)
const konfig = readFileSync(new URL('./src/site.config.ts', import.meta.url), 'utf8');
const standardUrl = konfig.match(/url:\s*'([^']+)'/)?.[1];

// Der Workflow setzt SITE_URL je Umgebung (staging/production)
const site = process.env.SITE_URL || standardUrl;

export default defineConfig({
  site,
  trailingSlash: 'ignore',
  // Keine Inline-Skripte/-Styles: die CSP in public/.htaccess erlaubt nur 'self'
  build: { format: 'directory', inlineStylesheets: 'never' },
  vite: { build: { assetsInlineLimit: 0 } },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
    }),
  ],
});
