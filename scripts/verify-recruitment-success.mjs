import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const base = new URL(process.env.PREVIEW_URL || 'http://127.0.0.1:4369');
assert(['127.0.0.1', 'localhost'].includes(base.hostname));
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium' });
const proof = [],
  errors = [];
await mkdir('artifacts/recruitment-success', { recursive: true });
try {
  for (const motion of ['reduce', 'no-preference']) {
    const c = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: motion,
    });
    const p = await c.newPage();
    p.on('pageerror', (e) => errors.push(e.message));
    let posts = 0,
      receipt = '';
    await c.route('**/api/recruitment/application', (route) => {
      if (route.request().method() === 'GET')
        return route.fulfill({ json: { ok: true, accepting: true } });
      const body = route.request().postDataJSON();
      posts++;
      receipt = body.id;
      return route.fulfill({ json: { ok: true, receipt: body.id } });
    });
    await p.goto(new URL('/recruitment/apply?role=data', base).href);
    await p.waitForFunction(
      () => !document.querySelector('#btn-submit-application').disabled,
    );
    for (let step = 1; step <= 4; step++) {
      await p.evaluate((step) => {
        const panel = document.querySelector(`[data-step-panel="${step}"]`);
        const names = new Set();
        for (const input of panel.querySelectorAll('input,textarea')) {
          if (input.type === 'radio' || input.type === 'checkbox') {
            if (
              input.type === 'checkbox' &&
              input.name.startsWith('agreement_')
            )
              input.checked = true;
            else if (!names.has(input.name)) {
              input.checked = true;
              names.add(input.name);
            } else continue;
          } else if (input.required)
            input.value =
              input.type === 'email'
                ? 'fixture@example.test'
                : input.type === 'tel'
                  ? '+628123456789'
                  : 'Local QA applicant';
          else continue;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, step);
      if (step < 4) {
        await p
          .locator(`[data-step-panel="${step}"] [data-action="next-step"]`)
          .click();
        await p.waitForFunction(
          (s) =>
            document.querySelector('.form-step.is-active').dataset.stepPanel ===
            String(s),
          step + 1,
        );
      }
    }
    await p.locator('#btn-submit-application').click();
    await p.locator('#success-screen').waitFor({ state: 'visible' });
    assert.equal(posts, 1);
    assert.equal(
      await p.locator('#application-receipt').textContent(),
      `Nomor pendaftaran: ${receipt}`,
    );
    assert.equal(
      await p.evaluate(() => document.activeElement.id),
      'success-screen',
    );
    assert(await p.locator('#recruitment-apply-form').isHidden());
    assert(await p.locator('.stepper-nav').isHidden());
    for (const width of [320, 360, 375, 390, 414, 768, 820, 1024, 1440]) {
      await p.setViewportSize({ width, height: 844 });
      await p
        .locator('#success-screen')
        .evaluate((el) =>
          el.scrollIntoView({ block: 'start', behavior: 'instant' }),
        );
      const metrics = await p.locator('#success-screen').evaluate((el) => {
        const rects = [
          ...el.querySelectorAll(
            'h2,p,a,.success-card,.success-body,.success-actions',
          ),
        ].map((node) => {
          const r = node.getBoundingClientRect();
          return {
            tag: node.tagName,
            left: r.left,
            right: r.right,
            top: r.top,
            bottom: r.bottom,
            scroll: node.scrollWidth,
            width: node.clientWidth,
          };
        });
        return {
          overflow: document.documentElement.scrollWidth - innerWidth,
          rects,
          cardDirection: getComputedStyle(el.querySelector('.success-card'))
            .flexDirection,
        };
      });
      assert.equal(metrics.cardDirection, 'column');
      assert(metrics.overflow <= 1);
      for (const r of metrics.rects) {
        assert(
          r.left >= -1 && r.right <= width + 1,
          JSON.stringify({ width, r }),
        );
        assert(r.scroll <= r.width + 1, JSON.stringify({ width, r }));
      }
      assert(metrics.rects[0].top >= 112, JSON.stringify(metrics));
      if ([390, 1440].includes(width))
        await p.screenshot({
          path: `artifacts/recruitment-success/success-${width}-${motion}.png`,
        });
      proof.push({
        width,
        motion,
        receiptExact: true,
        contained: true,
        headingBelowNavbar: true,
      });
    }
    // Enlarged type must retain wrapping instead of expanding the card.
    await p.setViewportSize({ width: 390, height: 844 });
    await p.addStyleTag({
      content:
        '.success-body{font-size:32px!important;line-height:1.5!important}.success-title{font-size:48px!important}#application-receipt{font-size:28px!important}',
    });
    assert(
      await p
        .locator('#success-screen')
        .evaluate((el) =>
          [...el.querySelectorAll('h2,p')].every(
            (n) => n.scrollWidth <= n.clientWidth + 1,
          ),
        ),
    );
    await c.close();
    console.log(`Recruitment success PASS ${motion}`);
  }
  assert.deepEqual(errors, []);
  await writeFile(
    'artifacts/recruitment-success/proof.json',
    JSON.stringify({ proof, errors }, null, 2),
  );
} finally {
  await browser.close();
}
