// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// A SITE_URL és BASE_PATH értékeket a GitHub-os közzététel automatikusan beállítja.
// Saját domain esetén: SITE_URL=https://www.sajatdomain.hu, BASE_PATH=/
const site = process.env.SITE_URL || 'http://localhost:4321';
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  integrations: [sitemap()],
});
