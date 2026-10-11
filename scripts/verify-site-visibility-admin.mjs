import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { defaultVisibility } from '../src/data/site-visibility-registry.mjs';
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4350';
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
const proof = [];
try {
  for (const path of ['/admin/', '/admin/team/', '/admin/recruitment/'])
    for (const width of [320, 390, 768, 1440]) {
      console.log('CASE', path, width);
      const context = await browser.newContext({
          viewport: { width, height: 903 },
          reducedMotion: 'reduce',
        }),
        page = await context.newPage();
      page.setDefaultTimeout(10000);
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      let state = defaultVisibility(),
        reads = 0,
        posts = [],
        mode = 'ok',
        logged = true;
      await page.route('**/api/**', async (route) => {
        const req = route.request(),
          url = new URL(req.url());
        let status = 200,
          body = { ok: true };
        if (url.pathname === '/api/admin/site-visibility') {
          if (!logged) {
            status = 401;
            body = { ok: false, error: { code: 'UNAUTHORIZED' } };
          } else if (req.method() === 'GET') {
            reads++;
            body = { ok: true, data: state, csrf: 'synthetic' };
          } else {
            const p = req.postDataJSON();
            posts.push(p);
            if (mode === 'network') {
              mode = 'ok';
              await route.abort();
              return;
            }
            if (mode === 'conflict') {
              mode = 'ok';
              state.revision = randomUUID();
              status = 409;
              body = {
                ok: false,
                error: { code: 'CONFLICT' },
                data: state,
                csrf: 'synthetic',
              };
            } else {
              for (const c of p.payload.changes) {
                if (c.sectionId)
                  state.pages[c.pageId].sections[c.sectionId] = c.enabled;
                else state.pages[c.pageId].enabled = c.enabled;
              }
              state.revision = randomUUID();
              body = { ok: true, data: state, csrf: 'synthetic' };
            }
          }
        } else if (url.pathname === '/api/admin/auth/logout') {
          logged = false;
          body = { ok: true };
        } else if (url.pathname === '/api/admin/auth/login') {
          logged = true;
          body = { ok: true, csrf: 'synthetic' };
        } else if (url.pathname.includes('/admin/')) {
          status = 401;
          body = { ok: false, error: { code: 'UNAUTHORIZED' } };
        } else body = { ok: true, accepting: false };
        await route.fulfill({
          status,
          contentType: 'application/json',
          body: JSON.stringify(body),
        });
      });
      await page.goto(base + path + '#pages', {
        waitUntil: 'domcontentloaded',
      });
      const panel = page.locator('#panel-pages');
      await panel.locator('#workspace').waitFor({ state: 'visible' });
      assert.equal(reads, 1);
      assert.equal(
        await panel
          .locator('[role=switch][data-page-id=home]:not([data-section-id])')
          .first()
          .isDisabled(),
        true,
      );
      await panel.locator('[data-section-id=projects]').uncheck();
      assert.equal(posts.length, 0);
      assert.match(
        await panel.locator('#pending-count').textContent(),
        /1 perubahan/,
      );
      const dialog = (e) => e.dismiss();
      page.on('dialog', dialog);
      await page.locator('[data-tab=team]').click();
      assert.equal(await panel.isVisible(), true);
      page.off('dialog', dialog);
      await panel.locator('#cancel').click();
      assert.equal(
        await panel.locator('[data-section-id=projects]').isChecked(),
        true,
      );
      await panel.locator('[data-section-id=projects]').uncheck();
      await panel.locator('#save').click();
      await page.waitForFunction(() =>
        document
          .querySelector('#panel-pages #status')
          .textContent.includes('Perubahan tersimpan'),
      );
      assert.equal(state.pages.home.sections.projects, false);
      assert.equal(posts.length, 1);
      await page.locator('[data-tab=team]').click();
      await page.locator('[data-tab=pages]').click();
      assert.equal(reads, 1);
      await panel.locator('[data-section-id=projects]').check();
      mode = 'conflict';
      await panel.locator('#save').click();
      await panel.locator('#conflict').waitFor({ state: 'visible' });
      assert.equal(
        await panel.locator('[data-section-id=projects]').isChecked(),
        true,
      );
      await panel.locator('#conflict-reapply').click();
      mode = 'network';
      await panel.locator('#save').click();
      await panel.locator('#uncertain').waitFor({ state: 'visible' });
      const attempted = posts.at(-1);
      await panel.locator('#retry').click();
      await panel.locator('#uncertain').waitFor({ state: 'hidden' });
      assert.deepEqual(posts.at(-1), attempted);
      assert.equal(state.pages.home.sections.projects, true);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: `artifacts/site-visibility/admin-${path.includes('/team') ? 'team' : path.includes('/recruitment') ? 'recruitment' : 'index'}-${width}.png`,
      });
      await panel.locator('#logout').click();
      await panel.locator('#login-form').waitFor({ state: 'visible' });
      assert.equal(await panel.locator('#page-list').textContent(), '');
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      assert.deepEqual(errors, []);

      proof.push({ path, width, reads, posts: posts.length, errors });
      await context.close();
    }
  await mkdir('artifacts/site-visibility', { recursive: true });
  await writeFile(
    'artifacts/site-visibility/admin-proof.json',
    JSON.stringify(proof, null, 2),
  );
  console.log('ADMIN PASS ' + proof.length);
} finally {
  await browser.close();
}
