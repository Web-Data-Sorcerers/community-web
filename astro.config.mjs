import { VISIBILITY_PAGES } from './src/data/site-visibility-registry.mjs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// Canonical origin used for absolute URLs (canonical, Open Graph, sitemap).
// Override with SITE_URL in the deploy environment if the domain changes.
const site =
  process.env.SITE_URL ?? 'https://data-sorcerers-community-sigma.vercel.app';

export default defineConfig({
  site,
  output: 'static',
  adapter: vercel(),
  devToolbar: { enabled: false },
  // Public Navbar links opt out of prefetch so navigation reads current visibility.
  // Keep the existing integration available for explicitly opted-in internal links.
  prefetch: { defaultStrategy: 'viewport' },
  // Keep the internal sound audition page out of the public sitemap.
  integrations: [
    sitemap({
      customPages: VISIBILITY_PAGES.map(
        (page) => new URL(page.path, site).href,
      ),
      filter: (page) => !page.includes('/lab/') && !page.includes('/admin/'),
    }),
  ],
  // Keep both `backdrop-filter` and `-webkit-backdrop-filter` in the built CSS
  // (the default Lightning CSS pass dropped the unprefixed one, so the navbar
  // blur disappeared in Firefox on the deployed site).
  vite: {
    build: {
      cssMinify: 'esbuild',
    },
  },
});
