// Loopback only; no production session, mutation or recruitment submission.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const base = new URL(process.env.PREVIEW_URL || 'http://127.0.0.1:4364');
assert(['127.0.0.1', 'localhost'].includes(base.hostname));
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium' });
const proof = [],
  errors = [];
const armed = (page) =>
  page.evaluate(() =>
    document.documentElement.classList.contains('splash-armed'),
  );
const settled = (page) =>
  page.waitForFunction(
    () =>
      (!document.querySelector('#splash') ||
        getComputedStyle(document.querySelector('#splash')).display ===
          'none') &&
      !document.documentElement.classList.contains('splash-armed'),
    {},
    { timeout: 10000 },
  );
try {
  for (const width of [390, 1440])
    for (const motion of ['reduce', 'no-preference']) {
      const c = await browser.newContext({
        viewport: { width, height: 900 },
        reducedMotion: motion,
      });
      await c.addInitScript(() => localStorage.setItem('ds:sound', 'off'));
      const p = await c.newPage();
      p.on('pageerror', (e) => errors.push(e.message));
      await p.goto(new URL('/', base).href, { waitUntil: 'domcontentloaded' });
      assert.equal(await armed(p), motion === 'no-preference');
      await settled(p);
      for (let i = 0; i < 2; i++) {
        await p.reload({ waitUntil: 'domcontentloaded' });
        assert.equal(await armed(p), motion === 'no-preference');
        await settled(p);
        assert.equal(
          await p.evaluate(() => document.documentElement.style.overflow),
          '',
        );
      }
      // The reload navigation timing persists after Astro swaps; it must not rearm.
      await p.locator('.hero a.button[href="/recruitment"]').first().click();
      await p.waitForURL(
        (u) => u.pathname.replace(/\/$/, '') === '/recruitment',
      );
      assert.equal(await armed(p), false);
      await settled(p);
      await p.locator('.navbar a.brand[href="/"]').first().click();
      await p.waitForURL((u) => u.pathname === '/');
      assert.equal(await armed(p), false);
      await settled(p);
      assert.equal(
        await p.evaluate(() =>
          document.documentElement.classList.contains('nav-warm'),
        ),
        true,
      );
      await p.goBack();
      assert.equal(await armed(p), false);
      await settled(p);
      // Fresh session on a non-Home page never displays a splash.
      await p.evaluate(() => sessionStorage.removeItem('ds:splash'));
      await p.goto(new URL('/recruitment', base).href, {
        waitUntil: 'domcontentloaded',
      });
      assert.equal(await armed(p), false);
      await settled(p);
      await p.reload({ waitUntil: 'domcontentloaded' });
      assert.equal(await armed(p), false);
      await settled(p);
      await p.locator('.navbar a.brand[href="/"]').first().click();
      await p.waitForURL((u) => u.pathname === '/');
      assert.equal(await armed(p), false);
      await settled(p);
      assert.equal(
        await p.evaluate(() =>
          document.documentElement.classList.contains('nav-warm'),
        ),
        true,
      );
      await p.goto(new URL('/#domains', base).href);
      await settled(p);
      await p.reload({ waitUntil: 'domcontentloaded' });
      assert.equal(await armed(p), motion === 'no-preference');
      await settled(p);
      await p.waitForFunction(
        () =>
          Math.abs(
            document.querySelector('#domains').getBoundingClientRect().top -
              110,
          ) < 8,
      );
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      proof.push({
        width,
        motion,
        homeReloads: 3,
        otherReloadSkipped: true,
        astroHomeSkipped: true,
        backSkipped: true,
        hashRestored: true,
      });
      console.log(`Splash condition PASS ${width} ${motion}`);
      await c.close();
    }
  const c = await browser.newContext();
  await c.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', {
      get() {
        throw new Error('storage unavailable');
      },
    });
  });
  const p = await c.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(new URL('/', base).href);
  assert.equal(await armed(p), false);
  await settled(p);
  await c.close();
  assert.deepEqual(errors, []);
  await mkdir('artifacts/home-refresh-splash', { recursive: true });
  await writeFile(
    'artifacts/home-refresh-splash/proof.json',
    JSON.stringify({ proof, storageFailure: 'fail-open', errors }, null, 2),
  );
  console.log(
    'Home refresh splash PASS: four width/motion conditions, refresh/swap/Back/hash/storage',
  );
} finally {
  await browser.close();
}
