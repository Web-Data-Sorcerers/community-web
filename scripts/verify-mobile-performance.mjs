import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const base = new URL(process.env.PREVIEW_URL || 'http://127.0.0.1:4370');
assert(['localhost', '127.0.0.1'].includes(base.hostname));
const out = 'artifacts/mobile-performance-local';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const rows = [],
  errors = [];
try {
  for (const test of [
    { width: 360, touch: true },
    { width: 390, touch: true },
    { width: 414, touch: true },
    { width: 820, touch: true },
    { width: 1440, touch: false },
    { width: 390, touch: true, reduce: true },
    { width: 1440, touch: false, reduce: true },
  ]) {
    const context = await browser.newContext({
      viewport: { width: test.width, height: 844 },
      deviceScaleFactor: test.touch ? 3 : 1,
      hasTouch: test.touch,
      isMobile: test.touch,
      reducedMotion: test.reduce ? 'reduce' : 'no-preference',
    });
    await context.addInitScript(() => sessionStorage.setItem('ds:splash', '1'));
    await context.route('**/*', (route) =>
      ['GET', 'HEAD'].includes(route.request().method())
        ? route.continue()
        : route.abort(),
    );
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(base.href);
    await page.waitForTimeout(600);
    const phases = [];
    for (const selector of [
      '.hero',
      '.philosophy',
      '.what-we-do',
      '.recruitment',
    ]) {
      const element = page.locator(selector);
      if (!(await element.count())) continue;
      await element.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const metrics = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        infinite: document
          .getAnimations()
          .filter(
            (animation) =>
              animation.playState === 'running' &&
              animation.effect.getTiming().iterations === Infinity,
          ).length,
        desktopRuntime: performance
          .getEntriesByType('resource')
          .some((entry) =>
            new URL(entry.name).pathname.match(/\/motion\.[^/]+\.js$/),
          ),
      }));
      assert.equal(
        metrics.overflow,
        false,
        `${JSON.stringify(test)} ${selector}`,
      );
      if (test.touch || test.reduce) {
        assert.equal(
          metrics.infinite,
          0,
          `${JSON.stringify(test)} ${selector}`,
        );
        assert.equal(metrics.desktopRuntime, false);
      }
      if (test.width === 390 && !test.reduce)
        await page.screenshot({ path: `${out}/${selector.slice(1)}-390.png` });
      phases.push({ selector, ...metrics });
    }
    if (!test.touch && !test.reduce)
      assert(
        await page.evaluate(() =>
          performance
            .getEntriesByType('resource')
            .some((entry) =>
              /\/motion\.[^/]+\.js$/.test(new URL(entry.name).pathname),
            ),
        ),
      );
    if (test.reduce)
      assert.equal(await page.evaluate(() => window.__dsSound.ctx), null);
    else await page.waitForFunction(() => !!window.__dsSound.ambientSource);
    await page.evaluate(() => {
      window.__contextToken = window.__dsSound.ctx;
      window.__sourceToken = window.__dsSound.ambientSource;
    });
    await page.evaluate(() => {
      const link = document.createElement('a');
      link.id = 'mobile-qa-link';
      link.href = '/recruitment';
      link.textContent = 'QA';
      link.style.cssText = 'position:fixed;top:160px;left:24px;z-index:99999';
      document.body.append(link);
    });
    await page.locator('#mobile-qa-link').click();
    await page.waitForURL(
      (url) => url.pathname.replace(/\/$/, '') === '/recruitment',
    );
    await page.waitForTimeout(400);
    if (test.reduce) {
      // The existing unlock gesture may create a context even under reduce;
      // background/splash audio must remain absent, rather than forbid a context.
      assert.equal(
        await page.evaluate(() => window.__dsSound.ambientSource),
        null,
      );
    } else {
      assert(
        await page.evaluate(
          () =>
            window.__dsSound.ctx === window.__contextToken &&
            window.__dsSound.ambientSource === window.__sourceToken,
        ),
      );
    }
    const lines = await page
      .locator('.role-row')
      .first()
      .evaluate((element) => ({
        divider: !!element.querySelector('.role-divider'),
        underline: getComputedStyle(
          element.querySelector('.role-link'),
          '::after',
        ).backgroundImage,
      }));
    assert.equal(lines.divider, true);
    assert(lines.underline.includes('linear-gradient'));
    if (test.touch)
      assert.equal(
        await page
          .locator('.role-glow')
          .first()
          .evaluate((element) => getComputedStyle(element).animationName),
        'none',
      );
    await page.goBack();
    await page.waitForURL((url) => url.pathname === '/');
    if (!test.reduce) {
      await page.evaluate(() => {
        for (const hidden of [true, false, true, false]) {
          Object.defineProperty(document, 'hidden', {
            configurable: true,
            value: hidden,
          });
          document.dispatchEvent(new Event('visibilitychange'));
        }
      });
      await page.waitForFunction(
        () => window.__dsSound.ctx.state === 'running',
      );
      assert(
        await page.evaluate(
          () => window.__dsSound.ambientSource === window.__sourceToken,
        ),
      );
    }
    rows.push({
      ...test,
      phases,
      lines,
      navigationChecked: true,
      audioSourcePersisted: !test.reduce,
      reducedBackgroundSilent: !!test.reduce,
    });
    console.log(
      `Mobile QA PASS ${test.width} touch=${test.touch} reduce=${!!test.reduce}`,
    );
    await context.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(
    `${out}/mobile-qa.json`,
    JSON.stringify({ rows, errors }, null, 2),
  );
} finally {
  await browser.close();
}
