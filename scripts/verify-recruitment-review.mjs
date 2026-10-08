// Synthetic browser-only transport. No owner session or live applicant data.
import { chromium } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  STATUSES,
  TRANSITIONS,
} from '../server/recruitment-review-contract.mjs';
import { APPLICATION_FIELDS } from '../server/recruitment-contract.mjs';
const out = 'artifacts/recruitment-review';
await mkdir(out, { recursive: true });
const html = await readFile('dist/admin/recruitment/index.html', 'utf8');
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  headless: true,
});
const report = [];
try {
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
    });
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    let accept = false;
    page.on('dialog', (d) => (accept ? d.accept() : d.dismiss()));
    let missing = false;
    let failLogout = false;
    let authorized = true,
      deny = false,
      failList = false,
      failHistory = false,
      lost = false,
      forceConflict = false,
      delayList = false,
      delayDetail = false,
      delayStats = false;
    const requests = [],
      mutations = [],
      dedupe = new Map();
    const apps = Array.from({ length: 201 }, (_, i) => ({
      receipt: randomUUID(),
      full_name: `Synthetic applicant ${String(i).padStart(3, '0')}`,
      email: `qa${i}@example.invalid`,
      primary_hods: i % 2 ? 'data' : 'core',
      received_at: '2026-01-01T17:00:00Z',
      schema_version: 1,
      review: {
        status: 'new',
        version: 0,
        note_count: 0,
        updated_at: null,
        updated_by: null,
        reviewer_label: null,
      },
      fields: {
        ...Object.fromEntries(
          APPLICATION_FIELDS.map((k) => [k, 'Synthetic ' + k]),
        ),
        full_name: `Synthetic applicant ${String(i).padStart(3, '0')}`,
        email: `qa${i}@example.invalid`,
        primary_hods: i % 2 ? 'data' : 'core',
        portfolio_link: '<script>window.piiUnsafe=true</script>',
      },
      notes: [],
      events: [],
    }));
    const matching = (f) =>
      apps.filter(
        (a) =>
          (!f.search ||
            a.full_name.toLowerCase().includes(f.search.toLowerCase()) ||
            a.email.includes(f.search)) &&
          (!f.primary_hods || a.primary_hods === f.primary_hods) &&
          (!f.status || a.review.status === f.status),
      );
    const stats = (f) => {
      const m = matching(f);
      return {
        total_global: apps.length,
        filtered: m.length,
        by_status: Object.keys(STATUSES).map((status) => ({
          status,
          count: m.filter((a) => a.review.status === status).length,
        })),
        by_hods: [
          'data',
          'core',
          'language',
          'vision',
          'product',
          'growth',
        ].map((hods) => ({
          hods,
          count: m.filter((a) => a.primary_hods === hods).length,
        })),
        as_of: f.as_of || '2026-10-08T00:00:00Z',
      };
    };
    await page.route('https://review.test/**', async (route) => {
      const req = route.request(),
        url = new URL(req.url());
      if (url.pathname.startsWith('/api/')) {
        const f =
          req.method() === 'POST'
            ? JSON.parse(req.postData() || '{}')
            : Object.fromEntries(url.searchParams);
        requests.push({
          path: url.pathname,
          method: req.method(),
          body: f,
          csrf: req.headers()['x-csrf-token'],
        });
        const finish = (body, status = 200) =>
          route.fulfill({
            status,
            contentType: 'application/json',
            body: JSON.stringify(body),
          });
        if (url.pathname === '/api/recruitment/application')
          return finish({ ok: true, accepting: true });
        if (url.pathname === '/api/admin/auth/logout') {
          assert.equal(req.headers()['x-csrf-token'], 'synthetic-csrf');
          if (failLogout)
            return finish({ ok: false, error: { code: 'FORBIDDEN' } }, 403);
          authorized = false;
          return finish({ ok: true });
        }
        if (url.pathname === '/api/admin/auth/login') {
          authorized = true;
          deny = false;
          return finish({ ok: true, csrf: 'synthetic-csrf' });
        }
        if (url.pathname === '/api/admin/auth/refresh')
          return finish({ ok: true, csrf: 'synthetic-csrf' });
        if (!authorized)
          return finish({ ok: false, error: { code: 'UNAUTHORIZED' } }, 401);
        if (deny)
          return finish({ ok: false, error: { code: 'FORBIDDEN' } }, 403);
        const name = url.pathname.split('/').at(-1);
        let data;
        if (name === 'applications') {
          if (failList) {
            failList = false;
            return finish({ ok: false, error: { code: 'SERVER_ERROR' } }, 502);
          }
          const m = matching(f),
            offset = Number(f.offset || 0),
            limit = Number(f.limit || 50);
          data = {
            applications: structuredClone(m.slice(offset, offset + limit)).map(
              ({ fields, notes, events, ...a }) => a,
            ),
            total_global: apps.length,
            filtered: m.length,
            limit,
            offset,
            has_more: offset + limit < m.length,
            as_of: f.as_of || '2026-10-08T00:00:00Z',
          };
          if (delayList) {
            delayList = false;
            await new Promise((r) => setTimeout(r, 300));
          }
        } else if (name === 'stats') {
          data = stats(f);
          if (delayStats) {
            delayStats = false;
            await new Promise((r) => setTimeout(r, 300));
          }
        } else if (name === 'application') {
          const a = apps.find((a) => a.receipt === f.receipt);
          if (!a || missing)
            return finish({ ok: false, error: { code: 'NOT_FOUND' } }, 404);
          data = structuredClone({
            found: true,
            receipt: a.receipt,
            fields: a.fields,
            received_at: a.received_at,
            schema_version: a.schema_version,
            review: a.review,
          });
          if (delayDetail) {
            delayDetail = false;
            await new Promise((r) => setTimeout(r, 300));
          }
        } else if (name === 'notes' || name === 'history') {
          if (failHistory) {
            failHistory = false;
            return finish({ ok: false, error: { code: 'SERVER_ERROR' } }, 502);
          }
          const a = apps.find((a) => a.receipt === f.receipt),
            items = a[name === 'notes' ? 'notes' : 'events'],
            offset = Number(f.offset || 0);
          data = {
            items: items.slice(offset, offset + 20),
            total: items.length,
            limit: 20,
            offset,
            has_more: offset + 20 < items.length,
          };
        } else if (name === 'review-status' || name === 'review-note') {
          mutations.push(structuredClone({ name, body: f }));
          const a = apps.find((a) => a.receipt === f.receipt);
          if (dedupe.has(f.request_id)) {
            assert.deepEqual(dedupe.get(f.request_id).input, f);
            return finish({
              ok: true,
              csrf: 'synthetic-csrf',
              data: { ...dedupe.get(f.request_id).result, replayed: true },
            });
          }
          if (forceConflict) {
            forceConflict = false;
            a.review.version++;
            a.review.status = 'reviewing';
            return finish({ ok: false, error: { code: 'CONFLICT' } }, 409);
          }
          if (f.expected_version !== a.review.version)
            return finish({ ok: false, error: { code: 'CONFLICT' } }, 409);
          const from = a.review.status;
          let note_id = null;
          if (name === 'review-status') {
            if (!TRANSITIONS[from].includes(f.status))
              return finish(
                { ok: false, error: { code: 'INVALID_TRANSITION' } },
                409,
              );
            a.review.status = f.status;
          } else {
            note_id = randomUUID();
            a.notes.push({
              id: note_id,
              body: f.body,
              created_by: 'synthetic-actor',
              author_label: 'Synthetic reviewer',
              created_at: '2026-10-08T00:00:00Z',
            });
            a.review.note_count++;
          }
          a.review.version++;
          a.review.updated_at = '2026-10-08T00:00:00Z';
          a.review.reviewer_label = 'Synthetic reviewer';
          const event_id = randomUUID();
          a.events.push({
            id: event_id,
            action: name === 'review-note' ? 'note_added' : 'status_changed',
            from_status: from,
            to_status: a.review.status,
            reason: f.reason || '',
            note_id,
            actor_label: 'Synthetic reviewer',
            created_at: '2026-10-08T00:00:00Z',
            before_version: a.review.version - 1,
            after_version: a.review.version,
          });
          data = {
            ok: true,
            receipt: a.receipt,
            status: a.review.status,
            version: a.review.version,
            event_id,
            note_id,
            replayed: false,
          };
          dedupe.set(f.request_id, { input: structuredClone(f), result: data });
          if (lost) {
            lost = false;
            return route.abort('failed');
          }
        }
        return finish({ ok: true, csrf: 'synthetic-csrf', data });
      }
      if (url.pathname === '/admin/recruitment/')
        return route.fulfill({ contentType: 'text/html', body: html });
      try {
        const body = await readFile('dist' + url.pathname);
        return route.fulfill({
          body,
          contentType:
            { js: 'text/javascript', css: 'text/css', woff2: 'font/woff2' }[
              url.pathname.split('.').at(-1)
            ] || 'application/octet-stream',
        });
      } catch {
        return route.fulfill({ status: 404 });
      }
    });
    const waitList = () =>
      page.waitForFunction(
        () =>
          document.getElementById('status').textContent.includes('pendaftar') &&
          !document.getElementById('pagination').hidden,
      );
    const waitDetail = () =>
      page.waitForFunction(
        () =>
          !document.getElementById('detail-area').hidden &&
          document.getElementById('notes-list').textContent !==
            'Memuat catatan…' &&
          document.getElementById('history-list').textContent !==
            'Memuat aktivitas…',
      );
    const settled = async () => {
      await page.waitForFunction(
        () => !document.getElementById('save-note').disabled,
      );
    };
    const checkOverflow = async () =>
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
    console.log('start ' + width);
    await page.goto('https://review.test/admin/recruitment/');
    await waitList();
    console.log('list ready ' + width);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('.applicant-detail').count(), 50);
    assert.equal(
      await page.locator('#page-info').textContent(),
      'Halaman 1 dari 5',
    );
    await page.screenshot({ path: `${out}/list-${width}.png`, fullPage: true });
    await checkOverflow();
    for (let i = 0; i < 4; i++) {
      await page.locator('#next-page').click();
      await page.waitForFunction(
        (i) =>
          document
            .getElementById('page-info')
            .textContent.startsWith(`Halaman ${i + 2}`),
        i,
      );
    }
    assert.equal(await page.locator('.applicant-detail').count(), 1);
    assert(await page.locator('#next-page').isDisabled());
    const lists = requests.filter((r) => r.path.endsWith('/applications'));
    assert.deepEqual(
      lists.slice(0, 5).map((r) => r.body.offset),
      [0, 50, 100, 150, 200],
    );
    assert(
      lists.every(
        (r) =>
          r.method === 'POST' &&
          !r.path.includes('?') &&
          r.csrf === 'synthetic-csrf',
      ),
    );
    assert(
      lists
        .slice(1, 5)
        .every(
          (r) =>
            r.body.as_of === lists[0].body.as_of ||
            r.body.as_of === '2026-10-08T00:00:00Z',
        ),
    );
    await page.locator('#search').fill('not-present');
    await page.locator('#filter-btn').click();
    await page.waitForFunction(() =>
      document
        .getElementById('applications-body')
        .textContent.includes('Tidak ada'),
    );
    await page.locator('#reset-filter').click();
    await waitList();
    // Stale filter list/stats must not overwrite latest filter.
    delayList = true;
    await page.locator('#search').fill('001');
    await page.locator('#filter-btn').click();
    await page.locator('#search').fill('002');
    await page.locator('#filter-btn').click();
    await page.waitForFunction(() =>
      document.querySelector('.applicant-detail')?.textContent.endsWith('002'),
    );
    await page.waitForTimeout(350);
    assert(
      (await page.locator('.applicant-detail').textContent()).endsWith('002'),
    );
    await page.locator('#reset-filter').click();
    await waitList();
    // Stale detail response cannot replace a newer applicant.
    delayDetail = true;
    await page.locator('.applicant-detail').nth(0).click();
    await page.locator('.applicant-detail').nth(1).click();
    await waitDetail();
    await page.waitForTimeout(350);
    assert(
      (await page.locator('#detail-summary').textContent()).includes('001'),
    );
    assert.equal(await page.locator('#detail-panel .field').count(), 38);
    assert.equal(await page.evaluate(() => window.piiUnsafe), undefined);
    assert(
      (await page.locator('#detail-summary').textContent()).includes('WIB'),
    );
    await checkOverflow();
    await page.screenshot({
      path: `${out}/detail-${width}.png`,
      fullPage: true,
    });
    await page.screenshot({ path: `${out}/detail-viewport-${width}.png` });
    const fixture = apps[1];
    const original = JSON.stringify(fixture.fields);
    // Draft changes alone do not mutate, keyboard submit can change status.
    await page.locator('#review-status').selectOption('reviewing');
    assert.equal(mutations.length, 0);
    await page.locator('#save-status').focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() =>
      document
        .getElementById('review-feedback')
        .textContent.includes('tersimpan'),
    );
    await settled();
    assert.equal(fixture.review.status, 'reviewing');
    forceConflict = true;
    await page.locator('#review-note').fill('draft preserved');
    await page.locator('#save-note').click();
    await page.waitForFunction(() =>
      document
        .getElementById('review-feedback')
        .textContent.includes('Konflik:'),
    );
    await settled();
    assert.equal(
      await page.locator('#review-note').inputValue(),
      'draft preserved',
    );
    assert.equal(fixture.notes.length, 0);
    await page.locator('#save-note').click();
    await page.waitForFunction(() =>
      document
        .getElementById('review-feedback')
        .textContent.includes('tersimpan'),
    );
    await settled();
    assert.equal(fixture.notes.length, 1);
    // Lost successful response + exact retry = one note/event.
    lost = true;
    await page
      .locator('#review-note')
      .fill('<img src=x onerror=alert(1)>\nSynthetic retry');
    await page.locator('#save-note').click();
    await page.waitForFunction(() =>
      document
        .getElementById('review-feedback')
        .textContent.includes('belum dikonfirmasi'),
    );
    assert.equal(fixture.notes.length, 2);
    assert(await page.locator('#review-note').isDisabled());
    await page.locator('#retry-mutation').click();
    await page.waitForFunction(() =>
      document
        .getElementById('review-feedback')
        .textContent.includes('Tidak ada duplikasi'),
    );
    await settled();
    assert.equal(fixture.notes.length, 2);
    assert.deepEqual(mutations.at(-1), mutations.at(-2));
    assert.equal(await page.locator('#notes-list img').count(), 0);
    await page.locator('#review-status').selectOption('rejected');
    await page.locator('#review-reason').fill('Synthetic decision reason');
    await page.locator('#save-status').click();
    await page.waitForFunction(() =>
      document
        .getElementById('review-feedback')
        .textContent.includes('Konfirmasikan'),
    );
    assert.equal(fixture.review.status, 'reviewing');
    await page.locator('#confirm-status').check();
    await page.locator('#save-status').click();
    await page.waitForFunction(() =>
      document
        .getElementById('review-feedback')
        .textContent.includes('tersimpan'),
    );
    await settled();
    assert.equal(fixture.review.status, 'rejected');
    assert.equal(await page.locator('#review-status option').count(), 2);
    await page.locator('#review-status').selectOption('reviewing');
    await page.locator('#review-reason').fill('Synthetic reopen reason');
    await page.locator('#confirm-status').check();
    await page.locator('#save-status').click();
    await page.waitForFunction(() =>
      document
        .getElementById('review-feedback')
        .textContent.includes('tersimpan'),
    );
    await settled();
    assert.equal(fixture.review.status, 'reviewing');
    assert.equal(JSON.stringify(fixture.fields), original);
    // Bounded notes/activity UI, long body wraps and pages request only20.
    for (let i = 0; i < 21; i++) {
      fixture.notes.push({
        id: randomUUID(),
        body: i === 0 ? 'a'.repeat(4000) : 'Synthetic paged note ' + i,
        author_label: 'Synthetic reviewer',
        created_at: '2026-10-08T00:00:00Z',
      });
      fixture.events.push({
        id: randomUUID(),
        action: 'note_added',
        from_status: 'reviewing',
        to_status: 'reviewing',
        reason: '',
        actor_label: 'Synthetic reviewer',
        created_at: '2026-10-08T00:00:00Z',
        before_version: fixture.review.version,
        after_version: fixture.review.version + 1,
      });
    }
    fixture.review.note_count = fixture.notes.length;
    await page.locator('#reload-detail').click();
    await waitDetail();
    assert.equal(await page.locator('#notes-list .field').count(), 20);
    assert.equal(await page.locator('#history-list .field').count(), 20);
    await checkOverflow();
    for (const kind of ['notes', 'history']) {
      await page.locator('#' + kind + '-next').click();
      await page.waitForFunction(
        (kind) =>
          document
            .getElementById(kind + '-page')
            .textContent.includes('halaman 2'),
        kind,
      );
      assert(await page.locator('#' + kind + '-next').isDisabled());
      await page.locator('#' + kind + '-prev').click();
      await page.waitForFunction(
        (kind) =>
          document
            .getElementById(kind + '-page')
            .textContent.includes('halaman 1'),
        kind,
      );
    }
    assert(
      requests
        .filter((r) => r.path.endsWith('/notes') || r.path.endsWith('/history'))
        .every((r) => Number(r.body.limit) === 20),
    );
    await page.locator('#review-note').fill('dirty draft');
    await page.locator('#back-list').click();
    assert(await page.locator('#detail-area').isVisible());
    await page
      .locator('.admin-navigation a')
      .filter({ hasText: 'Team' })
      .click();
    assert(page.url().endsWith('/admin/recruitment/'));
    accept = true;
    await page.locator('#back-list').click();
    await waitList();
    accept = false;
    failList = true;
    await page.locator('#reload-list').click();
    await page.waitForFunction(() =>
      document.getElementById('list-error').textContent.includes('Data belum'),
    );
    await page.locator('#reload-list').click();
    await waitList();
    await page.locator('.applicant-detail').nth(1).click();
    await waitDetail();
    failHistory = true;
    await page.locator('#reload-detail').click();
    await page.waitForFunction(() =>
      document.getElementById('notes-list').textContent.includes('Data belum'),
    );
    await page.locator('#reload-detail').click();
    await waitDetail();
    // Unauthorized/forbidden must discard all applicant data and drafts.
    await page.locator('#review-note').fill('private draft');
    deny = true;
    await page.locator('#reload-detail').click();
    await page.waitForFunction(
      () => document.getElementById('workspace').hidden,
    );
    assert.equal(await page.locator('#review-note').inputValue(), '');
    assert.equal(await page.locator('#notes-list').textContent(), '');
    assert.equal(await page.locator('#detail-panel').textContent(), '');
    assert.equal(await page.locator('#confirm-label').textContent(), '');
    assert.equal(await page.locator('#applications-body').textContent(), '');
    await page.locator('#logout').click();
    await page.waitForFunction(
      () =>
        document.getElementById('status').textContent ===
        'Sudah keluar dari admin.',
    );
    deny = false;
    authorized = false;
    await page.reload();
    await page.waitForFunction(
      () => !document.getElementById('login-form').hidden,
    );
    await page.locator('#login-email').fill('synthetic@example.invalid');
    await page.locator('#login-password').fill('synthetic-only');
    await page.locator('#login-submit').click();
    await waitList();
    assert.equal(await page.locator('#login-password').inputValue(), '');
    missing = true;
    await page.locator('.applicant-detail').nth(2).click();
    await page.waitForFunction(
      () =>
        document.getElementById('status').textContent ===
        'Data tidak ditemukan.',
    );
    missing = false;
    apps.splice(0);
    await page.locator('#reload-list').click();
    await page.waitForFunction(() =>
      document
        .getElementById('applications-body')
        .textContent.includes('Belum ada pendaftar.'),
    );
    delayList = true;
    await page.locator('#reload-list').click();
    await page.waitForTimeout(50);
    failLogout = true;
    await page.locator('#logout').click();
    await page.waitForFunction(() =>
      document
        .getElementById('status')
        .textContent.includes('Belum berhasil keluar.'),
    );
    assert(await page.locator('#workspace').isHidden());
    failLogout = false;
    await page.locator('#logout').click();
    await page.waitForFunction(
      () => document.getElementById('workspace').hidden,
    );
    await page.waitForTimeout(350);
    assert.equal(await page.locator('#stats').textContent(), '');
    assert.equal(await page.locator('#applications-body').textContent(), '');
    await checkOverflow();
    assert.deepEqual(errors, []);
    report.push({
      width,
      passed: true,
      pageerrors: errors,
      documentOverflow: false,
      serverPages: 5,
      canonicalFields: 38,
      mutationRequests: mutations.length,
      notes: fixture.notes.length,
      proof: 'synthetic transport only',
    });
    await page.close();
    console.log('Workflow browser PASS ' + width);
  }
  await writeFile(
    out + '/browser-proof.json',
    JSON.stringify({ passed: true, report }, null, 2),
  );
} finally {
  await browser.close();
}
