// Synthetic Auth/private transport only. Never contact a production origin.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { defaultVisibility } from '../src/data/site-visibility-registry.mjs';
const dist = 'dist/client';
const snapshot = JSON.parse(
  await readFile('src/data/cms-snapshot.json', 'utf8'),
);
const tabs = ['projects', 'team', 'recruitment', 'pages'];
const groups = [
  { id: 'leader', title: 'Leader Team', members: snapshot.team.leaderTeam },
  ...snapshot.team.hodsTeams,
];
const members = groups.flatMap((g) =>
  g.members.map((m, i) => ({ ...m, group: g.id, order: i + 1 })),
);
const out = 'artifacts/admin-shared-session';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium' });
const proof = [];
try {
  for (const width of [320, 390, 768, 1440])
    for (const source of tabs) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        reducedMotion: 'reduce',
      });
      const page = await context.newPage(),
        errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('dialog', (d) => d.accept());
      let logged = false,
        logins = 0,
        failLogin = true,
        transient = false;
      const reads = [];
      const receipt = '22345678-1234-4123-8123-123456789abc';
      const applicant = {
        receipt,
        full_name: 'Synthetic Applicant',
        email: 'qa@example.invalid',
        primary_hods: 'data',
        received_at: '2026-10-12T00:00:00Z',
        schema_version: 1,
        review: { status: 'new', version: 0, note_count: 0 },
        fields: {
          full_name: 'Synthetic Applicant',
          email: 'qa@example.invalid',
          primary_hods: 'data',
          why_join: 'Synthetic multiline\nanswer',
        },
      };
      await page.route('https://session.test/**', async (route) => {
        const req = route.request(),
          url = new URL(req.url()),
          path = url.pathname;
        const finish = (body, status = 200) =>
          route.fulfill({ status, json: body });
        if (path === '/api/admin/auth/login') {
          logins++;
          if (failLogin) {
            failLogin = false;
            return finish({ ok: false, error: { code: 'UNAUTHORIZED' } }, 401);
          }
          logged = true;
          return finish({ ok: true, csrf: 'synthetic' });
        }
        if (path === '/api/admin/auth/logout') {
          logged = false;
          return finish({ ok: true });
        }
        if (path === '/api/admin/auth/refresh')
          return finish({ ok: true, csrf: 'synthetic' });
        if (path === '/api/recruitment/application')
          return finish({ ok: true, accepting: true });
        if (path.startsWith('/api/admin/')) {
          reads.push({ path, method: req.method() });
          const hadSession = logged;
          // Anonymous prewarm can still resolve401 after another tab logs in.
          if (
            !hadSession &&
            source === 'projects' &&
            path === '/api/admin/team'
          )
            await new Promise((r) => setTimeout(r, 150));
          if (!hadSession)
            return finish({ ok: false, error: { code: 'UNAUTHORIZED' } }, 401);
          if (transient && path === '/api/admin/team') {
            transient = false;
            return finish({ ok: false, error: { code: 'SERVER_ERROR' } }, 503);
          }
          let data;
          if (path === '/api/admin/projects')
            data = {
              projects: snapshot.projects,
              revision: 'initial',
              imagePresets: snapshot.projects.map((p) => p.image),
              minProjects: 1,
              maxProjects: 8,
              publicationPending: false,
            };
          else if (path === '/api/admin/team')
            data = {
              members,
              groups: groups.map(({ id, title }) => ({ id, title })),
              revision: 'initial',
              photoPresets: [...new Set(members.map((m) => m.photo))],
              minMembers: 1,
              maxMembers: 8,
              publicationPending: false,
            };
          else if (path === '/api/admin/site-visibility')
            data = defaultVisibility();
          else if (path.endsWith('/applications'))
            data = {
              applications: [applicant],
              total_global: 1,
              filtered: 1,
              limit: 50,
              offset: 0,
              has_more: false,
              as_of: '2026-10-12T00:00:00Z',
            };
          else if (path.endsWith('/stats'))
            data = {
              total_global: 1,
              filtered: 1,
              by_status: [{ status: 'new', count: 1 }],
              by_hods: [{ hods: 'data', count: 1 }],
              as_of: '2026-10-12T00:00:00Z',
            };
          else if (path.endsWith('/application'))
            data = { ...applicant, found: true };
          else if (path.endsWith('/notes') || path.endsWith('/history'))
            data = {
              items: [],
              total: 0,
              offset: 0,
              limit: 20,
              has_more: false,
            };
          else throw Error('Unexpected private request ' + path);
          return finish({ ok: true, csrf: 'synthetic', data });
        }
        try {
          const file = path.endsWith('/') ? path + 'index.html' : path;
          const body = await readFile(dist + file);
          return route.fulfill({
            body,
            contentType:
              {
                html: 'text/html',
                js: 'text/javascript',
                css: 'text/css',
                woff2: 'font/woff2',
                svg: 'image/svg+xml',
                webp: 'image/webp',
                png: 'image/png',
              }[file.split('.').at(-1)] || 'application/octet-stream',
          });
        } catch {
          return route.fulfill({ status: 404 });
        }
      });
      await page.goto('https://session.test/admin/#' + source);
      const panel = page.locator('#panel-' + source);
      if (['projects', 'team'].includes(source)) {
        await panel.locator('#login').waitFor({ state: 'visible' });
        await panel.locator('#login').click();
      } else await panel.locator('#login-form').waitFor({ state: 'visible' });
      await panel.locator('#login-email').fill('synthetic@example.invalid');
      await panel.locator('#login-password').fill('synthetic-only');
      await panel.locator('#login-submit').click();
      await page.waitForFunction(
        () =>
          !document.querySelector(
            '#panel-' + location.hash.slice(1) + ' #login-submit',
          ).disabled,
      );
      assert.equal(logged, false);
      transient = source === 'projects';
      await panel.locator('#login-email').fill('synthetic@example.invalid');
      await panel.locator('#login-password').fill('synthetic-only');
      await panel.locator('#login-submit').click();
      await panel.locator('#workspace').waitFor({ state: 'visible' });
      for (const tab of tabs) {
        await page.locator(`[data-tab="${tab}"]`).click();
        await page
          .locator('#panel-' + tab + ' #workspace')
          .waitFor({ state: 'visible' });
        assert.equal(
          await page.locator('#panel-' + tab + ' #login-form').isVisible(),
          false,
        );
      }
      assert.equal(logins, 2); // one deliberately failed request, one success
      const drafts = { projects: 'Draft project', team: 'Draft member' };
      await page.locator('[data-tab=projects]').click();
      await page.locator('#panel-projects #title').fill(drafts.projects);
      await page.locator('[data-tab=team]').click();
      await page.locator('#panel-team #name').fill(drafts.team);
      await page.locator('[data-tab=pages]').click();
      await page.locator('#panel-pages [data-section-id=projects]').uncheck();
      await page.locator('[data-tab=recruitment]').click();
      await page.locator('#panel-recruitment .applicant-detail').click();
      await page
        .locator('#panel-recruitment #review-note')
        .fill('Draft internal note');
      const before = reads.length;
      await page.evaluate(() =>
        document.dispatchEvent(new CustomEvent('ds:admin-session-started')),
      );
      await page.waitForTimeout(150);
      assert.equal(reads.length, before);
      assert.equal(
        await page.locator('#panel-projects #title').inputValue(),
        drafts.projects,
      );
      assert.equal(
        await page.locator('#panel-team #name').inputValue(),
        drafts.team,
      );
      assert.equal(
        await page
          .locator('#panel-pages [data-section-id=projects]')
          .isChecked(),
        false,
      );
      assert.equal(
        await page.locator('#panel-recruitment #review-note').inputValue(),
        'Draft internal note',
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      // Direct entry/reload still restores the same synthetic cookie session.
      for (const path of ['/admin/', '/admin/team/', '/admin/recruitment/']) {
        await page.goto('https://session.test' + path);
        const tab = path.includes('team')
          ? 'team'
          : path.includes('recruitment')
            ? 'recruitment'
            : 'projects';
        await page
          .locator('#panel-' + tab + ' #workspace')
          .waitFor({ state: 'visible' });
      }
      await page.reload();
      await page
        .locator('#panel-recruitment #workspace')
        .waitFor({ state: 'visible' });
      assert.equal(logins, 2);
      await page.locator('#panel-recruitment #logout').click();
      await page.waitForFunction(() =>
        [...document.querySelectorAll('[data-panel] #workspace')].every(
          (e) => e.hidden,
        ),
      );
      await page.waitForTimeout(200);
      assert.equal(
        await page.locator('.admin-shell').getAttribute('data-session'),
        'expired',
      );
      assert.deepEqual(errors, []);
      proof.push({
        width,
        source,
        destinations: 4,
        logins,
        failedLogin: 1,
        draftsPreserved: true,
        reload: true,
        logout: true,
        errors,
      });
      await context.close();
      console.log('Shared session PASS', width, source);
    }
  await writeFile(
    out + '/proof.json',
    JSON.stringify({ proof, provenance: 'Synthetic transport only' }, null, 2),
  );
} finally {
  await browser.close();
}
