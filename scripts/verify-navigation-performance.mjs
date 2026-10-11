// Serial browser timing. Production mode blocks every non-GET/HEAD request.
import fs from 'node:fs/promises';
import { chromium } from '@playwright/test';
const base = new URL(process.env.PREVIEW_URL || 'http://127.0.0.1:4356');
const local = ['127.0.0.1', 'localhost'].includes(base.hostname);
if (
  !local &&
  base.origin !== 'https://data-sorcerers-community-sigma.vercel.app'
)
  throw Error('Unapproved read target');
const dir =
  process.env.NAV_ARTIFACT_DIR ||
  'artifacts/navigation-performance-local/baseline';
await fs.mkdir(dir, { recursive: true });
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
const rows = [],
  errors = [],
  blocked = [];
try {
  for (const width of (process.env.NAV_WIDTHS || '320,390,768,1440')
    .split(',')
    .map(Number))
    for (const motion of ['no-preference', 'reduce']) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        reducedMotion: motion,
      });
      await context.addInitScript(() => {
        sessionStorage.setItem('ds:splash', '1');
        localStorage.setItem('ds:sound', 'off');
        window.__nav = { click: 0, events: [], tasks: [], shifts: [] };
        document.addEventListener(
          'click',
          (e) => {
            if (e.target.closest('a')) {
              window.__nav.click = performance.now();
              window.__nav.events = [];
            }
          },
          true,
        );
        for (const name of [
          'astro:before-preparation',
          'astro:after-preparation',
          'astro:before-swap',
          'astro:after-swap',
          'astro:page-load',
        ])
          document.addEventListener(name, () => {
            window.__nav.events.push({
              name,
              time: performance.now(),
              path: location.pathname,
            });
            if (name === 'astro:before-preparation')
              requestAnimationFrame(() =>
                window.__nav.events.push({
                  name: 'feedback-frame',
                  time: performance.now(),
                  pending:
                    document.documentElement.classList.contains(
                      'navigation-pending',
                    ),
                  path: location.pathname,
                }),
              );
            if (name === 'astro:page-load')
              requestAnimationFrame(() =>
                requestAnimationFrame(() =>
                  window.__nav.events.push({
                    name: 'destination-frame',
                    time: performance.now(),
                    path: location.pathname,
                  }),
                ),
              );
          });
        for (const type of ['longtask', 'layout-shift'])
          try {
            new PerformanceObserver((list) =>
              window.__nav[type === 'longtask' ? 'tasks' : 'shifts'].push(
                ...list.getEntries().map((e) => ({
                  time: e.startTime,
                  duration: e.duration,
                  value: e.value,
                  input: e.hadRecentInput,
                })),
              ),
            ).observe({ type, buffered: true });
          } catch {}
      });
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      await page.route('**/*', (route) => {
        const req = route.request(),
          url = new URL(req.url());
        if (
          !['GET', 'HEAD'].includes(req.method()) ||
          url.origin !== base.origin
        ) {
          blocked.push({ path: url.pathname, method: req.method() });
          return route.abort();
        }
        return route.continue();
      });
      page.on('pageerror', (e) =>
        errors.push({ width, motion, message: e.message }),
      );
      await page.goto(base.href, { waitUntil: 'domcontentloaded' });
      await page.locator('.navbar.is-ready').waitFor();
      for (
        let round = 0;
        round < Number(process.env.NAV_ROUNDS || 2);
        round++
      ) {
        const targets = [
          '/recruitment',
          '/partners',
          '/contact',
          '/about',
          '/hall-of-frames',
          '/',
          '/recruitment',
          '/contact',
          '/partners',
          '/',
        ];
        for (const target of targets) {
          await page.evaluate(() => {
            performance.clearResourceTimings();
            window.__nav.tasks = [];
            window.__nav.shifts = [];
          });
          if (
            target !== '/' &&
            (await page.locator('.mobile-menu summary').isVisible())
          )
            await page.locator('.mobile-menu summary').click();
          await (
            target === '/'
              ? page.locator('a.brand:visible').first()
              : page.locator(`a.nav-link[href="${target}"]:visible`).first()
          ).click();
          await page.waitForFunction(
            (target) =>
              window.__nav.events.some(
                (e) =>
                  e.name === 'destination-frame' &&
                  e.path.replace(/\/$/, '') === target.replace(/\/$/, ''),
              ),
            target,
          );
          const sample = await page.evaluate(() => {
            const n = window.__nav,
              click = n.click;
            return {
              events: n.events.map((e) => ({
                ...e,
                ms: +(e.time - click).toFixed(2),
              })),
              resources: performance.getEntriesByType('resource').map((r) => ({
                path: new URL(r.name).pathname,
                type: r.initiatorType,
                start: r.startTime - click,
                response: r.responseEnd - click,
                duration: r.duration,
                bytes: r.transferSize,
              })),
              tasks: n.tasks.filter((e) => e.time >= click),
              shifts: n.shifts.filter((e) => e.time >= click),
              pending:
                document.documentElement.classList.contains(
                  'navigation-pending',
                ),
              htmlResponseMs:
                performance
                  .getEntriesByType('resource')
                  .find(
                    (r) =>
                      r.initiatorType === 'fetch' &&
                      new URL(r.name).pathname === location.pathname,
                  )?.responseEnd - click,
              cssReadyMs: Math.max(
                0,
                ...performance
                  .getEntriesByType('resource')
                  .filter((r) => new URL(r.name).pathname.endsWith('.css'))
                  .map((r) => r.responseEnd - click),
              ),
              navbarSettlingRemainingMs: Math.max(
                0,
                ...document
                  .querySelector('.navbar')
                  .getAnimations({ subtree: true })
                  .filter((a) => a.animationName === 'nav-in')
                  .map((a) =>
                    Math.max(
                      0,
                      a.effect.getComputedTiming().endTime -
                        (a.currentTime || 0),
                    ),
                  ),
              ),
              navbarAnimations: document
                .querySelector('.navbar')
                .getAnimations({ subtree: true })
                .map((a) => a.animationName),
              revision: document.querySelector(
                'meta[name="ds-visibility-revision"]',
              )?.content,
              overflow: document.documentElement.scrollWidth > innerWidth,
            };
          });
          rows.push({ width, motion, round, target, ...sample });
        }
      }
      await page.screenshot({ path: `${dir}/${width}-${motion}.png` });
      await context.close();
    }
} finally {
  await browser.close();
  await fs.writeFile(
    `${dir}/timing.json`,
    JSON.stringify(
      {
        time: new Date().toISOString(),
        origin: base.origin,
        provenance:
          'Agent-host Chromium; serial navigation, splash seen, network included, function cold/warm uncontrolled; no networkidle readiness',
        rows,
        errors,
        blocked,
      },
      null,
      2,
    ),
  );
}
const values = rows
  .map((r) => r.events.find((e) => e.name === 'destination-frame').ms)
  .sort((a, b) => a - b);
const stats = (samples) => {
  const sorted = samples
    .map((r) => r.events.find((e) => e.name === 'destination-frame').ms)
    .sort((a, b) => a - b);
  return {
    samples: sorted.length,
    median:
      (sorted[Math.floor((sorted.length - 1) / 2)] +
        sorted[Math.floor(sorted.length / 2)]) /
      2,
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
    range: [sorted[0], sorted.at(-1)],
  };
};
const conditions = [...new Set(rows.map((r) => `${r.width}/${r.motion}`))].map(
  (condition) => ({
    condition,
    ...stats(rows.filter((r) => `${r.width}/${r.motion}` === condition)),
  }),
);
await fs.writeFile(
  `${dir}/summary.json`,
  JSON.stringify(
    {
      time: new Date().toISOString(),
      origin: base.origin,
      ...stats(rows),
      conditions,
      errors,
      blocked,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    samples: rows.length,
    median:
      (values[Math.floor((values.length - 1) / 2)] +
        values[Math.floor(values.length / 2)]) /
      2,
    range: [values[0], values.at(-1)],
    p95: values[Math.ceil(values.length * 0.95) - 1],
    conditions,
    errors,
    pending: rows.filter((r) => r.pending).length,
    overflow: rows.filter((r) => r.overflow).length,
    blocked,
  }),
);
if (
  errors.length ||
  blocked.length ||
  rows.some((r) => r.pending || r.overflow)
)
  process.exitCode = 1;
