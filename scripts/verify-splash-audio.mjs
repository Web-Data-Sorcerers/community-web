import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const base = new URL(process.env.PREVIEW_URL || 'http://127.0.0.1:4368');
assert(['localhost', '127.0.0.1'].includes(base.hostname));
const proof = [],
  errors = [];
for (const policy of [
  'no-user-gesture-required',
  'document-user-activation-required',
]) {
  const b = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: [`--autoplay-policy=${policy}`],
  });
  try {
    for (const width of [390, 1440]) {
      const c = await b.newContext({
        viewport: { width, height: 900 },
        reducedMotion: 'no-preference',
      });
      const p = await c.newPage();
      p.on('pageerror', (e) => errors.push(e.message));
      await p.goto(new URL('/', base).href, { waitUntil: 'domcontentloaded' });
      await p.waitForFunction(() => !!window.__dsSound);
      assert.equal(await p.locator('.sound-toggle').count(), 0);
      if (policy === 'no-user-gesture-required') {
        await p.waitForFunction(
          () =>
            window.__dsSound.ctx?.state === 'running' &&
            !!window.__dsSound.splashGain,
        );
        assert(
          await p.evaluate(() =>
            document.documentElement.classList.contains('splash-armed'),
          ),
        );
      } else {
        assert.equal(
          await p.evaluate(() => window.__dsSound.ctx.state),
          'suspended',
        );
        assert.equal(await p.evaluate(() => window.__dsSound.splashGain), null);
        // A tap anywhere on the still-visible seal unlocks; no audio button needed.
        await p.mouse.click(width / 2, 240);
        await p.waitForFunction(
          () =>
            window.__dsSound.ctx.state === 'running' &&
            !!window.__dsSound.splashGain,
        );
      }
      await p.waitForFunction(
        () => document.documentElement.classList.contains('splash-done'),
        null,
        { timeout: 10000 },
      );
      assert.equal(await p.evaluate(() => window.__dsSound.splashGain), null);
      await p.waitForFunction(() => !!window.__dsSound.ambientSource);
      await p.waitForFunction(() => !document.querySelector('#splash'), null, {
        timeout: 10000,
      });
      await p.locator('.hero a.button[href="/recruitment"]').first().click();
      await p.waitForURL(
        (u) => u.pathname.replace(/\/$/, '') === '/recruitment',
      );
      assert.equal(await p.evaluate(() => window.__dsSound.splashGain), null);
      proof.push({
        width,
        policy,
        splashAudio: true,
        stoppedOnFinish: true,
        ambientContinues: true,
      });
      await c.close();
    }
    // Blocked until after splash: the loading sound must never replay late.
    if (policy === 'document-user-activation-required') {
      const c = await b.newContext({ reducedMotion: 'no-preference' });
      const p = await c.newPage();
      p.on('pageerror', (e) => errors.push(e.message));
      await p.goto(new URL('/', base).href);
      await p.waitForFunction(() =>
        document.documentElement.classList.contains('splash-done'),
      );
      await p.mouse.click(20, 280);
      await p.waitForFunction(() => window.__dsSound.ctx.state === 'running');
      assert.equal(await p.evaluate(() => window.__dsSound.splashGain), null);
      proof.push({ policy, lateGestureSkippedSplash: true });
      await c.close();
    }
    const c = await b.newContext({ reducedMotion: 'reduce' });
    const p = await c.newPage();
    await p.goto(new URL('/', base).href);
    await p.waitForFunction(() => !!window.__dsSound);
    assert.equal(await p.evaluate(() => window.__dsSound.ctx), null);
    assert.equal(await p.locator('.sound-toggle').count(), 0);
    await c.close();
    console.log(`Splash audio PASS ${policy}`);
  } finally {
    await b.close();
  }
}
assert.deepEqual(errors, []);
await mkdir('artifacts/magical-ambient', { recursive: true });
await writeFile(
  'artifacts/magical-ambient/splash-audio.json',
  JSON.stringify({ proof, errors }, null, 2),
);
