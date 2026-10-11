import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { defaultVisibility } from '../src/data/site-visibility-registry.mjs';
import {
  createVisibilityLoader,
  visibilityUnavailable,
} from '../server/site-visibility.mjs';
import { createVisibilityAdmin } from '../server/site-visibility-admin.mjs';
const config = defaultVisibility();
const payload = {
  expectedRevision: config.revision,
  requestId: randomUUID(),
  changes: [{ pageId: 'home', sectionId: 'projects', enabled: false }],
};
const request = (body, method = 'POST', type = 'application/json') =>
  new Request('https://site.invalid/api/admin/site-visibility', {
    method,
    headers: { 'content-type': type },
    ...(method === 'POST'
      ? { body: typeof body === 'string' ? body : JSON.stringify(body) }
      : {}),
  });
const auth = {
  authorize: async () => ({
    actor: { id: randomUUID() },
    session: { csrf: 'synthetic' },
    setCookie: 'rotated=synthetic',
  }),
};
test('loader explicit local, no shared cache, remote failures fail closed', async () => {
  let reads = 0;
  const load = createVisibilityLoader({
    env: { SITE_VISIBILITY_SOURCE: 'local', SITE_VISIBILITY_FILE: 'fixture' },
    readFileImpl: async () => {
      reads++;
      return JSON.stringify({ ...config, revision: randomUUID() });
    },
  });
  assert.notEqual((await load()).revision, (await load()).revision);
  assert.equal(reads, 2);
  for (const env of [{}, { SITE_VISIBILITY_SOURCE: 'local', VERCEL: '1' }])
    await assert.rejects(createVisibilityLoader({ env })());
  for (const result of [
    Response.json(null),
    Response.json(config, { status: 500 }),
    Response.json({ ...config, revision: 'bad' }),
  ])
    await assert.rejects(
      createVisibilityLoader({
        env: {
          SUPABASE_URL: 'https://service.invalid',
          SUPABASE_SERVICE_ROLE_KEY: 'synthetic',
        },
        fetchImpl: async () => result,
      })(),
    );
  assert.equal(visibilityUnavailable().status, 503);
});
test('API strict method/media/body/targets and rotated cookie no hook', async () => {
  let writes = 0;
  const handle = createVisibilityAdmin({
    auth,
    load: async () => config,
    save: async () => {
      writes++;
      return { ok: true, data: config };
    },
  });
  const get = await handle(request(null, 'GET'));
  assert.equal(get.status, 200);
  assert.equal(get.headers.get('set-cookie'), 'rotated=synthetic');
  assert.equal((await get.json()).csrf, 'synthetic');
  assert.equal((await handle(request(null, 'DELETE'))).status, 405);
  assert.equal((await handle(request('{}', 'POST', 'text/plain'))).status, 415);
  for (const body of [
    { operation: 'retry', payload },
    { operation: 'save', payload: { ...payload, x: 1 } },
    '{"operation":"save","operation":"save","payload":{}}',
    'x'.repeat(32769),
  ])
    assert.equal((await handle(request(body))).status, 400);
  assert.equal(writes, 0);
  const r = await handle(request({ operation: 'save', payload }));
  assert.equal(r.status, 200);
  assert.equal(writes, 1);
  assert.equal((await r.json()).publicationPending, undefined);
});
test('API authorization failure precedes privileged work and propagates conflict/failure', async () => {
  for (const status of [401, 403]) {
    let called = false;
    const h = createVisibilityAdmin({
      auth: {
        authorize: async () => ({
          error: Response.json({ ok: false }, { status }),
        }),
      },
      load: async () => {
        called = true;
      },
    });
    assert.equal((await h(request(null, 'GET'))).status, status);
    assert.equal(called, false);
  }
  for (const code of ['CONFLICT', 'ID_CONFLICT']) {
    const h = createVisibilityAdmin({
      auth,
      save: async () => ({ ok: false, error: { code }, data: config }),
    });
    const r = await h(request({ operation: 'save', payload }));
    assert.equal(r.status, 409);
    assert.deepEqual((await r.json()).data, config);
  }
  const h = createVisibilityAdmin({
    auth,
    load: async () => {
      throw new Error('secret upstream body');
    },
  });
  const r = await h(request(null, 'GET'));
  assert.equal(r.status, 503);
  assert.doesNotMatch(await r.text(), /secret/);
});

test('bounded response cancels oversized body; remote loader never caches revisions', async () => {
  const { boundedText } = await import('../server/site-visibility.mjs');
  let cancelled = false;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(32769));
    },
    cancel() {
      cancelled = true;
    },
  });
  await assert.rejects(boundedText(new Response(stream)));
  assert.equal(cancelled, true);
  let calls = 0;
  const load = createVisibilityLoader({
    env: {
      SUPABASE_URL: 'https://service.invalid',
      SUPABASE_SERVICE_ROLE_KEY: 'synthetic',
    },
    fetchImpl: async (url, options) => {
      calls++;
      assert.equal(new URL(url).pathname, '/rest/v1/rpc/site_visibility_load');
      assert.equal(options.cache, 'no-store');
      assert.equal(options.body, '{}');
      return Response.json({ ...config, revision: randomUUID() });
    },
  });
  assert.notEqual((await load()).revision, (await load()).revision);
  assert.equal(calls, 2);
});

test('native fetch aborts a stalled upstream response body within the configured deadline', async () => {
  const { createServer } = await import('node:http');
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.write('{');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const start = performance.now();
    await assert.rejects(
      createVisibilityLoader({
        env: {
          SUPABASE_URL: `http://127.0.0.1:${server.address().port}`,
          SUPABASE_SERVICE_ROLE_KEY: 'synthetic',
        },
      })(),
    );
    assert.ok(performance.now() - start < 7000);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
