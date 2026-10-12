// Loopback-only asset reuse/guard verification; no production mutations.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const base = new URL(process.env.PREVIEW_URL || 'http://127.0.0.1:4364');
assert.ok(['127.0.0.1', 'localhost'].includes(base.hostname));
fs.mkdirSync('artifacts/navigation-next/local', { recursive: true });
(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const results = [],
    errors = [];
  for (const width of [390, 1440])
    for (const variant of ['baseline', 'warm']) {
      const ctx = await browser.newContext({
        viewport: { width, height: 900 },
        reducedMotion: 'reduce',
      });
      await ctx.addInitScript(
        ({ variant }) => {
          sessionStorage.setItem('ds:splash', '1');
          localStorage.setItem('ds:sound', 'off');
          if (variant === 'baseline') {
            const native = window.fetch;
            window.fetch = (url, ...args) =>
              String(url).includes('/navigation-styles.json')
                ? Promise.resolve(new Response('{}'))
                : native(url, ...args);
          }
          window.__events = [];
          for (const name of [
            'astro:before-preparation',
            'astro:after-preparation',
            'astro:after-swap',
            'astro:page-load',
          ])
            document.addEventListener(name, () => {
              window.__events.push({ name, t: performance.now() });
              if (name === 'astro:after-swap')
                requestAnimationFrame(() =>
                  requestAnimationFrame(() =>
                    window.__events.push({
                      name: 'frame',
                      t: performance.now(),
                    }),
                  ),
                );
            });
        },
        { variant },
      );
      const p = await ctx.newPage();
      p.on('pageerror', (e) => errors.push(e.message));
      const requests = [];
      p.on('request', (r) => {
        assert.equal(r.method(), 'GET');
        requests.push({
          url: new URL(r.url()).pathname,
          type: r.resourceType(),
        });
      });
      const cdp = await ctx.newCDPSession(p);
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 80,
        downloadThroughput: 250000,
        uploadThroughput: 250000,
      });
      await p.goto(base.href);
      await p.locator('.navbar.is-ready').waitFor();
      await p.waitForTimeout(3000);
      const idleRequests = requests.slice();
      assert.equal(
        idleRequests.filter(
          (r) =>
            r.url.startsWith('/api/admin/') ||
            [
              '/recruitment',
              '/contact',
              '/partners',
              '/about',
              '/hall-of-frames',
            ].includes(r.url),
        ).length,
        0,
      );
      const manifestIndex = idleRequests.findIndex(
        (r) => r.url === '/navigation-styles.json',
      );
      if (manifestIndex >= 0)
        assert.ok(
          idleRequests
            .slice(manifestIndex)
            .filter((r) => r.url.endsWith('.css')).length <= 6,
        );
      assert.equal(
        idleRequests.filter(
          (r) =>
            r.type === 'fetch' &&
            !['/navigation-styles.json', '/api/cms/content'].includes(r.url),
        ).length,
        0,
      );
      const rows = [];
      for (const target of [
        '/recruitment',
        '/contact',
        '/partners',
        '/about',
        '/hall-of-frames',
        '/',
        '/recruitment',
      ]) {
        await p.evaluate(() => {
          performance.clearResourceTimings();
          window.__events = [];
        });
        if (
          target !== '/' &&
          (await p.locator('.mobile-menu summary').isVisible())
        )
          await p.locator('.mobile-menu summary').click();
        const start = await p.evaluate(() => performance.now());
        await (
          target === '/'
            ? p.locator('a.brand:visible').first()
            : p.locator(`a.nav-link[href="${target}"]:visible`).first()
        ).click();
        await p.waitForFunction(() =>
          window.__events.some((e) => e.name === 'frame'),
        );
        const row = await p.evaluate(
          (start) => ({
            frame: window.__events.find((e) => e.name === 'frame').t - start,
            events: window.__events,
            resources: performance.getEntriesByType('resource').map((r) => ({
              path: new URL(r.name).pathname,
              duration: r.duration,
              bytes: r.transferSize,
              server: r.serverTiming,
            })),
          }),
          start,
        );
        rows.push({ target, ...row });
      }
      results.push({ width, variant, idleRequests, rows });
      if (variant === 'warm')
        assert.ok(
          rows
            .slice(0, 5)
            .every((row) =>
              row.resources
                .filter((r) => r.path.endsWith('.css'))
                .every((r) => r.bytes === 0),
            ),
          'Warmed destination CSS must not transfer again on first activation',
        );
      await ctx.close();
    }
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    'artifacts/navigation-next/local/comparison.json',
    JSON.stringify({ results, errors }, null, 2),
  );
  await browser.close();
  console.log(
    JSON.stringify(
      results.map((r) => ({
        width: r.width,
        variant: r.variant,
        rows: r.rows.map((x) => ({
          target: x.target,
          frame: Math.round(x.frame),
          css: x.resources
            .filter((s) => s.path.endsWith('.css'))
            .map((s) => ({ duration: Math.round(s.duration), bytes: s.bytes })),
        })),
      })),
    ),
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
