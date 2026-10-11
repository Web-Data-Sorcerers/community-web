import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createCmsAuth } from '../server/cms-auth.mjs';
import { createVisibilityAdmin } from '../server/site-visibility-admin.mjs';
import { defaultVisibility } from '../src/data/site-visibility-registry.mjs';
const origin = 'https://admin.example.test';
test('visibility uses the existing encrypted session, Origin, CSRF, rotation and permission recheck', async () => {
  let allowed = true,
    time = 100000,
    reads = 0,
    writes = 0;
  const env = {
    NODE_ENV: 'production',
    CMS_ADMIN_ORIGIN: origin,
    CMS_ADMIN_SESSION_SECRET: Buffer.alloc(32, 9).toString('base64'),
    SUPABASE_URL: 'https://placeholder.supabase.co',
    SUPABASE_ANON_KEY: 'synthetic',
    SUPABASE_SERVICE_ROLE_KEY: 'synthetic',
  };
  const auth = createCmsAuth({
    env,
    clock: () => time,
    fetchImpl: async (url) => {
      if (String(url).includes('/auth/v1/token'))
        return Response.json({
          access_token: 'synthetic',
          refresh_token: 'synthetic',
          expires_in: 3600,
          user: { id: '11111111-1111-1111-1111-111111111111' },
        });
      if (String(url).includes('/auth/v1/user'))
        return Response.json({ id: '11111111-1111-1111-1111-111111111111' });
      if (String(url).includes('cms_verify_admin'))
        return Response.json({ ok: allowed, email: 'owner@example.test' });
      return Response.json({ ok: true, limited: false });
    },
  });
  const config = defaultVisibility(),
    handle = createVisibilityAdmin({
      auth,
      load: async () => {
        reads++;
        return config;
      },
      save: async () => {
        writes++;
        return { ok: true, data: config };
      },
    });
  const response = await auth.login(
    new Request(origin + '/api/admin/auth/login', {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'owner@example.test',
        password: 'synthetic',
      }),
    }),
  );
  assert.equal(response.status, 200);
  const cookie = response.headers
      .getSetCookie()
      .map((v) => v.split(';')[0])
      .join('; '),
    csrf = (await response.json()).csrf;
  const body = JSON.stringify({
    operation: 'save',
    payload: {
      expectedRevision: config.revision,
      requestId: randomUUID(),
      changes: [{ pageId: 'home', sectionId: 'projects', enabled: false }],
    },
  });
  const req = (method = 'GET', headers = {}) =>
    new Request(origin + '/api/admin/site-visibility', {
      method,
      headers: {
        Cookie: cookie,
        Origin: origin,
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrf,
        ...headers,
      },
      ...(method === 'POST' ? { body } : {}),
    });
  assert.equal(
    (await handle(new Request(origin + '/api/admin/site-visibility'))).status,
    401,
  );
  assert.equal((await handle(req())).status, 200);
  assert.equal(reads, 1);
  assert.equal(
    (await handle(req('POST', { Origin: 'https://evil.invalid' }))).status,
    403,
  );
  assert.equal(
    (await handle(req('POST', { 'X-CSRF-Token': 'bad' }))).status,
    403,
  );
  assert.equal(writes, 0);
  assert.equal((await handle(req('POST'))).status, 200);
  assert.equal(writes, 1);
  time += 3600001;
  const rotated = await handle(req());
  assert.equal(rotated.status, 200);
  assert.ok(rotated.headers.get('set-cookie'));
  allowed = false;
  assert.equal((await handle(req('POST'))).status, 403);
  assert.equal(writes, 1);
});
