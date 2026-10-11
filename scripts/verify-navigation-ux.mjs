// Generated-function UX regression; delayed/failing requests stay on loopback.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from '@playwright/test';
const base = new URL(process.env.PREVIEW_URL || 'http://127.0.0.1:4356');
assert.ok(['127.0.0.1', 'localhost'].includes(base.hostname));
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
const proof = [],
  errors = [];
try {
  for (const width of [320, 390, 768, 1440])
    for (const motion of ['reduce', 'no-preference']) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        reducedMotion: motion,
      });
      await context.addInitScript(() => {
        sessionStorage.setItem('ds:splash', '1');
        localStorage.setItem('ds:sound', 'off');
        window.__loaded = 0;
        document.addEventListener('astro:page-load', () => window.__loaded++);
      });
      const page = await context.newPage();
      page.on('pageerror', (e) => errors.push(e.message));
      const requests = [];
      await page.route('**/*', async (route) => {
        const r = route.request(),
          url = new URL(r.url());
        assert.equal(url.origin, base.origin);
        assert.ok(['GET', 'HEAD'].includes(r.method()));
        requests.push({ path: url.pathname, type: r.resourceType() });
        if (url.pathname === '/partners')
          await new Promise((r) => setTimeout(r, 1800));
        await route.continue();
      });
      await page.goto(base.href, { waitUntil: 'domcontentloaded' });
      await page.locator('.navbar.is-ready').waitFor();
      const projectCount = await page.locator('#projects').count();
      const before = await page.locator('.navbar').boundingBox();
      if (await page.locator('.mobile-menu summary').isVisible())
        await page.locator('.mobile-menu summary').click();
      const partner = page
        .locator('a.nav-link[href="/partners"]:visible')
        .first();
      await partner.click();
      await page.waitForFunction(() =>
        document.documentElement.classList.contains('navigation-pending'),
      );
      assert.equal(
        await page.locator('main').getAttribute('aria-busy'),
        'true',
      );
      assert.equal(await page.locator('.navigation-progress').count(), 0);
      assert.equal(await page.locator('.navigation-status').count(), 0);
      assert.equal(
        await page
          .locator('a.nav-link.active')
          .first()
          .textContent()
          .then((s) => s.trim()),
        'Home',
      );
      await page.screenshot({
        path: `artifacts/navigation-performance-local/pending-${width}-${motion}.png`,
      });
      // Supersede the delayed destination without waiting for it or disabling links.
      const prior = await page.evaluate(() => window.__loaded);
      await page.locator('a.nav-link[href="/contact"]:visible').first().click();
      await page.waitForFunction(
        (n) =>
          window.__loaded > n &&
          location.pathname.replace(/\/$/, '') === '/contact',
        prior,
      );
      assert.equal(
        await page
          .locator('html')
          .evaluate((e) => e.classList.contains('navigation-pending')),
        false,
      );
      assert.equal(await page.locator('main').getAttribute('aria-busy'), null);
      assert.equal(await page.locator('.navigation-status').count(), 0);
      assert.equal(
        await page
          .locator('.navbar')
          .evaluate(
            (e) =>
              e
                .getAnimations({ subtree: true })
                .filter((a) => a.animationName === 'nav-in').length,
          ),
        0,
      );
      const after = await page.locator('.navbar').boundingBox();
      assert.equal(before.width, after.width);
      assert.equal(before.height, after.height);
      // No speculative controlled/private HTML during viewport/focus/hover/scroll.
      requests.length = 0;
      await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
      await page.locator('.navbar .brand').focus();
      await page.waitForTimeout(350);
      assert.equal(
        requests.filter(
          (r) =>
            !r.path.startsWith('/api/') &&
            !r.path.startsWith('/images/') &&
            !r.path.startsWith('/_astro/') &&
            !r.path.startsWith('/fonts/') &&
            ['fetch', 'other'].includes(r.type),
        ).length,
        0,
      );
      await page.goBack();
      await page.waitForFunction(
        () =>
          location.pathname === '/' &&
          !document.documentElement.classList.contains('navigation-pending'),
      );
      assert.equal(await page.locator('#projects').count(), projectCount);
      proof.push({
        width,
        motion,
        delayedFeedback: true,
        newestNavigationWins: true,
        warmNavbar: true,
        geometry: true,
        noSpeculativeHtml: true,
        back: true,
      });
      await context.close();
    }
  // Same-page hash, keyboard, aborted loader, failure, stylesheet/script failure.
  for (const mode of [
    'hash',
    'abort',
    '503',
    'css-failure',
    'script-failure',
  ]) {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      sessionStorage.setItem('ds:splash', '1');
      localStorage.setItem('ds:sound', 'off');
    });
    await page.goto(new URL('/recruitment', base).href);
    let armed = true,
      failures = 0;
    if (mode === 'hash') {
      await page.locator('a.button[href="#available-roles"]').click();
      assert.equal(
        await page
          .locator('html')
          .evaluate((e) => e.classList.contains('navigation-pending')),
        false,
      );
    } else {
      await page.route('**/*', async (route) => {
        const r = route.request(),
          url = new URL(r.url());
        if (mode === 'css-failure' && r.resourceType() === 'stylesheet') {
          failures++;
          return route.abort();
        }
        if (mode === 'script-failure' && r.resourceType() === 'script') {
          failures++;
          return route.abort();
        }
        if (url.pathname === '/contact' && armed) {
          armed = false;
          if (mode === 'script-failure') {
            const response = await route.fetch();
            return route.fulfill({
              response,
              body: (await response.text()).replace(
                '</body>',
                '<script src="/local-simulated-script-failure.js"></script></body>',
              ),
            });
          }
          if (mode === 'abort') return route.abort();
          if (mode === '503')
            return route.fulfill({
              status: 503,
              contentType: 'text/html',
              body: '<html><body>Local simulated unavailable</body></html>',
            });
        }
        return route.continue();
      });
      await page.locator('a.nav-link[href="/contact"]:visible').first().click();
      await page.waitForFunction(
        () =>
          location.pathname.startsWith('/contact') &&
          !document.documentElement.classList.contains('navigation-pending'),
      );
    }
    if (['css-failure', 'script-failure'].includes(mode))
      assert.ok(failures > 0, mode + ' must exercise a failing resource');
    proof.push({ mode, pendingCleared: true, failures });
    await page.close();
  }
  const initialPage = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'no-preference',
  });
  await initialPage.goto(base.href, { waitUntil: 'domcontentloaded' });
  await initialPage.locator('.navbar.is-ready').waitFor();
  const firstEntrance = await initialPage.locator('.navbar').evaluate((e) => ({
    warm: document.documentElement.classList.contains('nav-warm'),
    entrances: e
      .getAnimations({ subtree: true })
      .filter((a) => a.animationName === 'nav-in').length,
  }));
  assert.equal(firstEntrance.warm, false);
  assert.ok(firstEntrance.entrances > 0);
  proof.push({ mode: 'initial entrance preserved', ...firstEntrance });
  await initialPage.close();
  const cleanupPage = await browser.newPage({ reducedMotion: 'reduce' });
  await cleanupPage.addInitScript(() =>
    sessionStorage.setItem('ds:splash', '1'),
  );
  await cleanupPage.goto(new URL('/recruitment', base).href);
  const cleanup = await cleanupPage.evaluate(async () => {
    const make = (path, controller, loader = async () => {}) => {
      const event = new Event('astro:before-preparation', { cancelable: true });
      Object.assign(event, {
        from: new URL(location.href),
        to: new URL(path, location.href),
        signal: controller.signal,
        sourceElement: document.querySelector('.navbar .brand'),
        loader,
      });
      document.dispatchEvent(event);
      return event;
    };
    const isPending = () =>
      document.documentElement.classList.contains('navigation-pending');
    const old = new AbortController(),
      latest = new AbortController();
    make('/partners', old);
    make('/contact', latest);
    old.abort();
    const oldCannotClearNew = isPending();
    latest.abort();
    const aborted = !isPending();
    const rejected = make('/contact', new AbortController(), async () => {
      throw new Error('Local simulated loader error');
    });
    try {
      await rejected.loader();
    } catch {}
    const errorCleared = !isPending();
    const cancelled = make('/contact', new AbortController());
    cancelled.preventDefault();
    await cancelled.loader();
    const cancelledCleared = !isPending();
    const nativeTimer = window.setTimeout;
    window.setTimeout = (fn, ms, ...args) =>
      nativeTimer(fn, ms === 20000 ? 25 : ms, ...args);
    make('/contact', new AbortController());
    window.setTimeout = nativeTimer;
    await new Promise((resolve) => nativeTimer(resolve, 50));
    const watchdogCleared =
      !isPending() && !document.querySelector('main').hasAttribute('aria-busy');
    return {
      oldCannotClearNew,
      aborted,
      errorCleared,
      cancelledCleared,
      watchdogCleared,
    };
  });
  for (const value of Object.values(cleanup)) assert.equal(value, true);
  proof.push({
    mode: 'synthetic lifecycle cleanup; watchdog clock shortened in test only',
    ...cleanup,
  });
  await cleanupPage.close();
  assert.equal(errors.length, 0);
} finally {
  await browser.close();
  await fs.writeFile(
    'artifacts/navigation-performance-local/ux-proof.json',
    JSON.stringify({ proof, errors }, null, 2),
  );
}
console.log(JSON.stringify({ cases: proof.length, errors }));
