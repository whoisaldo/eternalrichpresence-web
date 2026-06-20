// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Static output (SSG). Deploy target is Vercel; keep it server-runtime-free.
// `site` is the canonical origin used for absolute OG/canonical URLs and the
// sitemap. Update it to the production domain when DNS is wired up.
export default defineConfig({
  site: 'https://eternalrichpresence.dev',
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  integrations: [sitemap()],
  devToolbar: { enabled: false },
});
