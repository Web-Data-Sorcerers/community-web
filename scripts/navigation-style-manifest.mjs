import { mkdir, writeFile } from 'node:fs/promises';

// Public static assets only: this manifest contains no visibility preferences.
export function navigationStyleManifest() {
  let clientDir;
  return {
    name: 'navigation-style-manifest',
    hooks: {
      'astro:config:done': ({ config }) => {
        clientDir = config.build.client;
      },
      'astro:build:ssr': async ({ manifest }) => {
        const routes = {};
        for (const { routeData, styles } of manifest.routes) {
          if (
            ![
              '/',
              '/recruitment',
              '/contact',
              '/partners',
              '/about',
              '/hall-of-frames',
            ].includes(routeData.route)
          )
            continue;
          routes[routeData.route] = styles
            .filter(
              (style) =>
                style.type === 'external' &&
                /^\/?_astro\/.+\.css$/.test(style.src),
            )
            .map((style) => `/${style.src.replace(/^\//, '')}`);
        }
        await mkdir(clientDir, { recursive: true });
        await writeFile(
          new URL('navigation-styles.json', clientDir),
          JSON.stringify(routes),
        );
      },
    },
  };
}
