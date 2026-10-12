import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const base = new URL(process.env.PREVIEW_URL || 'http://127.0.0.1:4368');
assert(['127.0.0.1', 'localhost'].includes(base.hostname));
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium' });
const results = [],
  errors = [];
try {
  for (const width of [390, 1440])
    for (const motion of ['no-preference', 'reduce']) {
      const c = await browser.newContext({
        viewport: { width, height: 900 },
        reducedMotion: motion,
      });
      const p = await c.newPage();
      p.on('pageerror', (e) => errors.push(e.message));
      await p.goto(new URL('/lab/sound', base).href);
      await p.waitForFunction(() => !!window.__dsSound);
      assert.equal(
        await p.evaluate(() => window.__dsSound.ambientPreset),
        'waltz',
      );
      if (motion === 'reduce')
        assert.equal(await p.evaluate(() => window.__dsSound.ctx), null);
      assert.equal(await p.locator('.sound-toggle').count(), 0);
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      await p.locator('[data-ambient="library"]').click();
      await p.waitForFunction(() => window.__dsSound.ctx?.state === 'running');
      const scores = [];
      for (const profile of ['library', 'castle', 'waltz']) {
        await p.locator(`[data-ambient="${profile}"]`).click();
        if (motion === 'reduce') {
          assert.equal(
            await p.evaluate(() => window.__dsSound.ambientSource),
            null,
          );
          continue;
        }
        await p.waitForFunction(
          (profile) =>
            window.__dsSound.ambientPreset === profile &&
            !!window.__dsSound.ambientSource,
          profile,
        );
        const metrics = await p.evaluate(() => {
          const b = window.__dsSound.ambientSource.buffer;
          let peak = 0,
            square = 0,
            seam = 0;
          for (let ch = 0; ch < b.numberOfChannels; ch++) {
            const d = b.getChannelData(ch);
            seam = Math.max(seam, Math.abs(d[0] - d[d.length - 1]));
            for (const v of d) {
              peak = Math.max(peak, Math.abs(v));
              square += v * v;
            }
          }
          window.__audioContextToken = window.__dsSound.ctx;
          window.__ambientSourceToken = window.__dsSound.ambientSource;
          return {
            duration: b.duration,
            peak,
            rms: Math.sqrt(square / (b.length * b.numberOfChannels)),
            seam,
          };
        });
        assert(
          profile === 'waltz'
            ? metrics.duration === 54
            : metrics.duration > 28 && metrics.duration <= 30,
        );
        assert(metrics.peak < 0.5);
        assert(metrics.rms > 0.005);
        assert(metrics.seam < 0.015);
        scores.push({ profile, ...metrics });
      }
      if (motion !== 'reduce') {
        // Rapid switches while cached buffers resolve must settle on one latest source.
        await p.evaluate(() => {
          for (let i = 0; i < 20; i++)
            window.__dsSound.setAmbientProfile(i % 2 ? 'castle' : 'library');
        });
        await p.waitForFunction(
          () =>
            window.__dsSound.ambientPreset === 'castle' &&
            !!window.__dsSound.ambientSource,
        );
        await p.evaluate(() => {
          window.__audioContextToken = window.__dsSound.ctx;
          window.__ambientSourceToken = window.__dsSound.ambientSource;
        });
        await p.locator('a[href="/"]').click();
        await p.waitForURL((u) => u.pathname === '/');
        assert(
          await p.evaluate(
            () =>
              window.__dsSound.ctx === window.__audioContextToken &&
              window.__dsSound.ambientSource === window.__ambientSourceToken,
          ),
        );
        await p.goBack();
        await p.waitForURL((u) => u.pathname.startsWith('/lab/sound'));
        assert.equal(
          await p
            .locator('[data-ambient="castle"]')
            .getAttribute('aria-pressed'),
          'true',
        );
        await p.evaluate(() => {
          Object.defineProperty(document, 'hidden', {
            configurable: true,
            value: true,
          });
          document.dispatchEvent(new Event('visibilitychange'));
        });
        await p.waitForFunction(
          () => window.__dsSound.ctx.state === 'suspended',
          null,
          { timeout: 10000 },
        );
        const pausedAt = await p.evaluate(
          () => window.__dsSound.ctx.currentTime,
        );
        await p.waitForTimeout(120);
        assert.equal(
          await p.evaluate(() => window.__dsSound.ctx.currentTime),
          pausedAt,
        );
        await p.evaluate(() => {
          Object.defineProperty(document, 'hidden', {
            configurable: true,
            value: false,
          });
          document.dispatchEvent(new Event('visibilitychange'));
        });
        await p.waitForFunction(
          () =>
            window.__dsSound.ctx.state === 'running' &&
            window.__dsSound.ambientGain.gain.value > 0.05,
        );
        assert(
          await p.evaluate(
            () =>
              window.__dsSound.ctx === window.__audioContextToken &&
              window.__dsSound.ambientSource === window.__ambientSourceToken,
          ),
        );
      }
      // Internal mute gate remains testable, but no public control or stored
      // mute preference is used: owner explicitly requested always-on audio.
      await p.evaluate(() => {
        window.__dsSound.setMuted(true);
        localStorage.setItem('ds:sound', 'off');
      });
      assert.equal(await p.evaluate(() => window.__dsSound.isMuted), true);
      await p.reload();
      await p.waitForFunction(() => !!window.__dsSound);
      assert.equal(await p.evaluate(() => window.__dsSound.isMuted), false);
      await p.locator('[data-ambient="library"]').click();
      if (motion !== 'reduce')
        await p.waitForFunction(() => !!window.__dsSound.ambientSource);
      else
        assert.equal(
          await p.evaluate(() => window.__dsSound.ambientSource),
          null,
        );
      results.push({
        width,
        motion,
        scores,
        contextPersisted: motion === 'no-preference',
        alwaysOnReload: true,
        visibilityGate:
          motion === 'no-preference'
            ? 'simulated hidden/resume PASS'
            : 'silent',
      });
      console.log(`Ambient PASS ${width} ${motion}`);
      await c.close();
    }
  assert.deepEqual(errors, []);
  await writeFile(
    'artifacts/magical-ambient/proof.json',
    JSON.stringify({ results, errors }, null, 2),
  );
  console.log('Magical ambient QA PASS');
} finally {
  await browser.close();
}
