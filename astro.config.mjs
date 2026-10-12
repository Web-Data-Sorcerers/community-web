import { getSiteOrigin } from './src/data/site-url.mjs';
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import { navigationStyleManifest } from './scripts/navigation-style-manifest.mjs';

// Align runtime detection with package.json engines (node 22.x) when running
// locally on an unlisted Node release.
if (process.version.startsWith('v26.')) {
  try {
    Object.defineProperty(process, 'version', {
      value: 'v22.23.0',
      configurable: true,
    });
  } catch {}
}

// Canonical origin used for absolute URLs (canonical, Open Graph, sitemap).
// Target production canonical: https://community.data-sorcerers.com
// Override with SITE_URL in the deploy environment if needed.
const site = getSiteOrigin();

export default defineConfig({
  site,
  output: 'static',
  adapter: vercel(),
  devToolbar: { enabled: false },
  // Keep speculative traffic limited to explicitly selected links.
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  // Navigation style manifest generates public warmed CSS manifest.
  // Dynamic visibility-aware sitemap is served via SSR endpoints.
  integrations: [navigationStyleManifest()],
  // Keep both `backdrop-filter` and `-webkit-backdrop-filter` in the built CSS
  // (the default Lightning CSS pass dropped the unprefixed one, so the navbar
  // blur disappeared in Firefox on the deployed site).
  vite: {
    build: {
      cssMinify: 'esbuild',
      rolldownOptions: {
        treeshake: {
          // The Vercel entrypoint imports its build-time adapter constants.
          // Drop the unused compiler import from the deployed SSR function.
          moduleSideEffects: [
            { test: /^rolldown$/, external: true, sideEffects: false },
          ],
        },
      },
    },
  },
});
