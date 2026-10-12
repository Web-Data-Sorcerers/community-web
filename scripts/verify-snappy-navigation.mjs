// Generated SSR harness only. Observe requests without interception so the
// browser's HTTP cache remains enabled during the prefetch reuse experiment.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from '@playwright/test';
const base = new URL(process.env.PREVIEW_URL || 'http://127.0.0.1:4362');
assert.ok(['127.0.0.1', 'localhost'].includes(base.hostname));
const phase = process.env.SNAPPY_PHASE || 'after';
const verifyFinal =
  phase === 'after' || process.env.SNAPPY_VERIFY_FINAL === '1';
const expectedFade = process.env.SNAPPY_ANIMATION === '80ms' ? 80 : 0;
const dir = `artifacts/snappy-navigation/${phase}`;
await fs.mkdir(dir, { recursive: true });
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
const experiments = [];
const rows = [],
  errors = [];
try {
  for (const width of [390, 1440])
    for (const motion of ['no-preference', 'reduce']) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        reducedMotion: motion,
        hasTouch: width === 390,
      });
      await context.addInitScript(() => {
        sessionStorage.setItem('ds:splash', '1');
        localStorage.setItem('ds:sound', 'off');
        window.__snappy = { events: [], animations: [], click: 0 };
        document.addEventListener(
          'click',
          (e) => {
            if (!e.target.closest('a')) return;
            window.__snappy = {
              events: [],
              animations: [],
              click: performance.now(),
            };
          },
          true,
        );
        for (const name of [
          'astro:before-preparation',
          'astro:after-preparation',
          'astro:after-swap',
          'astro:page-load',
        ])
          document.addEventListener(name, () => {
            const n = window.__snappy;
            n.events.push({ name, ms: performance.now() - n.click });
            if (name === 'astro:after-swap')
              requestAnimationFrame(() => {
                n.animations = document
                  .getAnimations()
                  .filter((a) => a.animationName?.startsWith('astroFade'))
                  .map((a) => ({
                    name: a.animationName,
                    duration: a.effect.getTiming().duration,
                  }));
                requestAnimationFrame(() =>
                  n.events.push({
                    name: 'destination-frame',
                    ms: performance.now() - n.click,
                  }),
                );
              });
          });
      });
      const page = await context.newPage();
      page.on('pageerror', (e) => errors.push(e.message));
      const requests = [];
      page.on('request', (r) =>
        requests.push({
          path: new URL(r.url()).pathname,
          type: r.resourceType(),
          time: Date.now(),
        }),
      );
      await page.goto(base.href, { waitUntil: 'load' });
      await page.locator('.navbar.is-ready').waitFor();
      // Give both hover/viewport candidates time to finish before activation.
      if (width === 390) await page.locator('.mobile-menu summary').tap();
      else await page.locator('.desktop-nav a[href="/partners"]').hover();
      await page.waitForTimeout(1200);
      const prefetch = requests.filter((r) => r.path === '/partners');
      const start = requests.length;
      for (const target of [
        '/partners',
        '/contact',
        '/recruitment',
        '/',
        '/contact',
        '/',
      ]) {
        if (width === 390) {
          if (!(await page.locator('.mobile-menu').evaluate((el) => el.open)))
            await page.locator('.mobile-menu summary').tap();
        }
        const link = page
          .locator(`.navbar a.nav-link[href="${target}"]:visible`)
          .first();
        if (width === 390) await link.tap();
        else await link.click();
        await page.waitForFunction(
          (target) =>
            location.pathname.replace(/\/$/, '') ===
              target.replace(/\/$/, '') &&
            window.__snappy.events.some(
              (e) => e.name === 'destination-frame',
            ) &&
            window.__snappy.events.some((e) => e.name === 'astro:page-load'),
          target,
        );
        const sample = await page.evaluate(() => ({
          ...window.__snappy,
          revision: document.querySelector(
            'meta[name="ds-visibility-revision"]',
          )?.content,
          pending:
            document.documentElement.classList.contains('navigation-pending'),
          overflow: document.documentElement.scrollWidth > innerWidth,
        }));
        assert.equal(sample.pending, false);
        assert.equal(sample.overflow, false);
        if (verifyFinal && motion === 'no-preference') {
          if (expectedFade === 0) assert.equal(sample.animations.length, 0);
          else {
            assert.ok(sample.animations.length >= 2);
            assert.ok(
              sample.animations.every((a) => a.duration === expectedFade),
            );
          }
        }
        rows.push({ width, motion, target, ...sample });
      }
      const clickRequests = requests
        .slice(start)
        .filter((r) => r.path === '/partners');
      console.log(JSON.stringify({ width, motion, prefetch, clickRequests }));
      if (verifyFinal) {
        assert.equal(prefetch.length, 0);
        assert.equal(clickRequests.length, 1);
      }
      // Hold an enabled CTA down and inspect the first painted pressed state.
      await page.goto(new URL('/contact', base).href, { waitUntil: 'load' });
      const cta = page.locator('.form-submit');
      await cta.scrollIntoViewIfNeeded();
      const box = await cta.boundingBox();
      const x = box.x + box.width / 2,
        y = box.y + box.height / 2;
      const cdp = await context.newCDPSession(page);
      if (width === 390)
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ x, y }],
        });
      else {
        await page.mouse.move(x, y);
        await page.mouse.down();
      }
      const pressed = await cta.evaluate(
        (el) =>
          new Promise((resolve) =>
            requestAnimationFrame(() => {
              const s = getComputedStyle(el);
              resolve({
                scale: s.scale,
                opacity: s.opacity,
                transition: s.transitionDuration,
              });
            }),
          ),
      );
      // Cancel rather than release over the submit button; no form is submitted.
      if (width === 390)
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchCancel',
          touchPoints: [],
        });
      else {
        await page.mouse.move(0, 0);
        await page.mouse.up();
      }
      if (verifyFinal) {
        assert.equal(pressed.opacity, '0.88');
        assert.equal(pressed.scale, motion === 'reduce' ? 'none' : '0.98');
      }
      console.log(JSON.stringify({ width, motion, pressed }));
      experiments.push({ width, motion, prefetch, clickRequests, pressed });
      assert.equal(await page.locator('[data-pressed]').count(), 0);
      if (verifyFinal) {
        assert.equal(
          await cta.evaluate((el) => getComputedStyle(el).opacity),
          '1',
        );
        await cta.evaluate((el) => {
          el.disabled = true;
        });
        if (width === 390)
          await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [{ x, y }],
          });
        else {
          await page.mouse.move(x, y);
          await page.mouse.down();
        }
        assert.equal(await page.locator('[data-pressed]').count(), 0);
        if (width === 390)
          await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchCancel',
            touchPoints: [],
          });
        else {
          await page.mouse.move(0, 0);
          await page.mouse.up();
        }
      }
      await context.close();
    }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  await fs.writeFile(
    `${dir}/proof.json`,
    JSON.stringify({ phase, rows, experiments, errors }, null, 2),
  );
}
for (const motion of ['no-preference', 'reduce']) {
  const samples = rows
    .filter((r) => r.motion === motion)
    .map((r) => r.events.find((e) => e.name === 'destination-frame').ms)
    .sort((a, b) => a - b);
  console.log(
    JSON.stringify({
      motion,
      samples: samples.length,
      median: (samples[5] + samples[6]) / 2,
      p95: samples[11],
    }),
  );
}
