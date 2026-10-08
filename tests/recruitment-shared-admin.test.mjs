import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecruitmentAdminHandler } from '../server/recruitment-admin.mjs';
import { createCmsAuth } from '../server/cms-auth.mjs';

const origin = 'https://admin.example.test';
const uid = '11111111-1111-1111-1111-111111111111';
const receipt = '22345678-1234-4123-8123-123456789abc';
const env = {
  NODE_ENV: 'production',
  CMS_ADMIN_ORIGIN: origin,
  CMS_ADMIN_SESSION_SECRET: Buffer.alloc(32, 9).toString('base64'),
  SUPABASE_URL: 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY: 'anon',
  SUPABASE_SERVICE_ROLE_KEY: 'service',
};
const req = (route, options = {}) =>
  new Request(origin + '/api/admin/recruitment/' + route, options);
const cookieOf = (response) =>
  response.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');

function harness() {
  let now = Date.now();
  const state = {
    cms: true,
    recruitment: true,
    user: true,
    limited: false,
    limitFailure: false,
    badLogin: false,
    fail: '',
    missing: false,
  };
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    const path = String(url);
    const body = options.body ? JSON.parse(options.body) : {};
    calls.push({ path, body });
    if (state.fail && path.includes(state.fail))
      throw new Error('PRIVATE-UPSTREAM');
    if (path.includes('/auth/v1/token')) {
      if (state.badLogin)
        return Response.json({ message: 'PRIVATE-UPSTREAM' }, { status: 400 });
      return Response.json({
        access_token: 'test-access',
        refresh_token: 'test-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: uid },
      });
    }
    if (path.includes('/auth/v1/user'))
      return Response.json({ id: uid }, { status: state.user ? 200 : 401 });
    if (path.includes('cms_rate_limit_check')) {
      if (state.limitFailure)
        return Response.json({ message: 'PRIVATE-UPSTREAM' }, { status: 500 });
      return Response.json({ ok: true, limited: state.limited });
    }
    if (path.includes('cms_verify_admin'))
      return Response.json({ ok: state.cms, email: 'owner@example.test' });
    if (path.includes('admin_verify_identity')) {
      assert.equal(body.p_auth_id, uid);
      return Response.json({ ok: state.recruitment });
    }
    if (path.includes('admin_list_applications'))
      return Response.json({
        applications: [
          { receipt, full_name: 'Test', email: 'test@example.invalid' },
        ],
        total: 1,
        filtered: 1,
      });
    if (path.includes('admin_get_application'))
      return Response.json(
        state.missing
          ? { found: false }
          : {
              found: true,
              receipt,
              fields: {
                full_name: 'Test',
                portfolio_link: 'https://example.invalid/',
              },
            },
      );
    if (path.includes('admin_get_stats'))
      return Response.json({ total: 1, by_hods: [{ hods: 'data', count: 1 }] });
    return Response.json({ ok: true });
  };
  const clock = () => now;
  const handle = createRecruitmentAdminHandler({ env, fetchImpl, clock });
  const auth = createCmsAuth({ env, fetchImpl, clock });
  let cookie = '',
    csrf = '';
  return {
    handle,
    state,
    calls,
    advance: (n) => (now += n),
    get cookie() {
      return cookie;
    },
    get csrf() {
      return csrf;
    },
    async login() {
      const response = await auth.login(
        new Request(origin + '/api/admin/auth/login', {
          method: 'POST',
          headers: { Origin: origin, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'owner@example.test',
            password: 'test-only',
          }),
        }),
      );
      if (response.ok) {
        cookie = cookieOf(response);
        csrf = (await response.clone().json()).csrf;
      }
      return response;
    },
    read(route, query = '', options = {}) {
      return handle(
        req(route + query, { headers: { Cookie: cookie }, ...options }),
        route,
      );
    },
    post(route, extraHeaders = {}) {
      return handle(
        req(route, {
          method: 'POST',
          headers: {
            Cookie: cookie,
            Origin: origin,
            'X-CSRF-Token': csrf,
            ...extraHeaders,
          },
        }),
        route,
      );
    },
    cmsRead() {
      return auth.authorize(
        new Request(origin + '/api/admin/projects', {
          headers: { Cookie: cookie },
        }),
      );
    },
  };
}

test('all applicant reads deny anonymous and old recruitment cookies without upstream', async () => {
  const h = harness();
  for (const cookie of [
    '',
    'sb-access-token=old; sb-refresh-token=old',
    '__Host-ds-admin-session=invalid',
  ])
    for (const route of ['list', 'detail', 'stats'])
      assert.equal(
        (await h.handle(req(route, { headers: { Cookie: cookie } }), route))
          .status,
        401,
      );
  assert.equal(h.calls.length, 0);
});
test('one CMS login allows authorized recruitment and CMS reads with the same sealed cookie', async () => {
  const h = harness();
  assert.equal((await h.login()).status, 200);
  assert(h.cookie.startsWith('__Host-ds-admin-session='));
  assert(!h.cookie.includes('sb-access'));
  assert(!(await h.cmsRead()).error);
  for (const route of ['list', 'stats']) {
    const response = await h.read(route);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).csrf, h.csrf);
  }
});
test('CMS permission does not implicitly grant applicant access', async () => {
  const h = harness();
  await h.login();
  h.state.recruitment = false;
  assert.equal((await h.read('stats')).status, 403);
  assert(!(await h.cmsRead()).error);
  assert(!h.calls.some((c) => c.path.includes('admin_get_stats')));
});
test('revoked CMS permission denies recruitment before applicant permission and data calls', async () => {
  const h = harness();
  await h.login();
  h.state.cms = false;
  h.calls.length = 0;
  assert.equal((await h.read('list')).status, 403);
  assert(!h.calls.some((c) => c.path.includes('admin_verify_identity')));
});
test('revoked trusted Auth identity denies applicant reads', async () => {
  const h = harness();
  await h.login();
  h.state.user = false;
  assert.equal((await h.read('stats')).status, 401);
});
test('search/domain/date filters use existing RPC; only trusted UID authorizes access', async () => {
  const h = harness();
  await h.login();
  assert.equal(
    (
      await h.read(
        'list',
        '?search=Test&primary_hods=data&since=2026-01-01&until=2026-12-31&limit=50&offset=0',
      )
    ).status,
    200,
  );
  assert.deepEqual(
    h.calls.find((c) => c.path.includes('admin_list_applications')).body
      .p_filters,
    {
      search: 'Test',
      primary_hods: 'data',
      since: '2026-01-01',
      until: '2026-12-31',
      limit: 50,
      offset: 0,
    },
  );
});
test('detail includes canonical answers and missing receipt returns404', async () => {
  const h = harness();
  await h.login();
  let response = await h.read('detail', '?receipt=' + receipt);
  assert.equal(response.status, 200);
  assert.equal(
    (await response.json()).data.fields.portfolio_link,
    'https://example.invalid/',
  );
  h.state.missing = true;
  assert.equal((await h.read('detail', '?receipt=' + receipt)).status, 404);
});
test('invalid receipt never invokes detail RPC', async () => {
  const h = harness();
  await h.login();
  assert.equal((await h.read('detail', '?receipt=invalid')).status, 400);
  assert(!h.calls.some((c) => c.path.includes('admin_get_application')));
});
test('stats and read audit use owner identity without storing applicant answers', async () => {
  const h = harness();
  await h.login();
  const response = await h.read('stats');
  assert.equal((await response.json()).data.total, 1);
  const audit = h.calls.find((c) => c.path.includes('admin_audit_write'));
  assert.equal(audit.body.p_actor_id, uid);
  assert.deepEqual(audit.body.p_details, {});
});
test('permission and data RPC failures are sanitized and fail closed', async () => {
  for (const fail of ['admin_verify_identity', 'admin_get_stats']) {
    const h = harness();
    await h.login();
    h.state.fail = fail;
    const r = await h.read('stats');
    assert.equal(r.status, 502);
    assert(!(await r.text()).includes('PRIVATE-UPSTREAM'));
  }
});
test('audit failure preserves successful read', async () => {
  const h = harness();
  await h.login();
  h.state.fail = 'admin_audit_write';
  assert.equal((await h.read('stats')).status, 200);
});
test('POST reads enforce Origin/CSRF before privileged calls', async () => {
  const h = harness();
  await h.login();
  h.calls.length = 0;
  for (const headers of [
    { Origin: 'https://evil.test' },
    { 'X-CSRF-Token': 'wrong' },
  ])
    assert.equal((await h.post('stats', headers)).status, 403);
  assert.equal(h.calls.length, 0);
});
test('explicit shared refresh rotates cookie and preserves CSRF across modules', async () => {
  const h = harness();
  await h.login();
  const response = await h.post('refresh');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).csrf, h.csrf);
  assert(cookieOf(response).startsWith('__Host-ds-admin-session='));
});
test('expired access refreshes on recruitment read and forwards renewed cookie', async () => {
  const h = harness();
  await h.login();
  h.advance(3601000);
  const response = await h.read('stats');
  assert.equal(response.status, 200);
  assert(cookieOf(response).startsWith('__Host-ds-admin-session='));
  assert(h.calls.some((c) => c.path.includes('grant_type=refresh_token')));
});
test('expired shared session cannot read recruitment', async () => {
  const h = harness();
  await h.login();
  h.advance(31 * 24 * 3600000);
  assert.equal((await h.read('stats')).status, 401);
});
test('shared logout requires POST CSRF and clears shared and legacy cookies', async () => {
  const h = harness();
  await h.login();
  assert.equal((await h.read('logout')).status, 405);
  assert.equal(
    (await h.post('logout', { 'X-CSRF-Token': 'wrong' })).status,
    403,
  );
  const response = await h.post('logout');
  assert.equal(response.status, 200);
  const cookies = response.headers.getSetCookie();
  for (const name of [
    '__Host-ds-admin-session',
    'sb-access-token',
    'sb-refresh-token',
  ])
    assert(
      cookies.some((c) => c.startsWith(name + '=;') && c.includes('Max-Age=0')),
    );
  assert.equal((await h.handle(req('stats'), 'stats')).status, 401);
});
test('legacy login adapter uses sealed CMS session and fail-closed CMS rate limit', async () => {
  for (const [setting, status] of [
    ['limited', 429],
    ['limitFailure', 502],
    ['badLogin', 401],
  ]) {
    const h = harness();
    h.state[setting] = true;
    const r = await h.handle(
      req('login', {
        method: 'POST',
        headers: { Origin: origin, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'owner@example.test',
          password: 'test-only',
        }),
      }),
      'login',
    );
    assert.equal(r.status, status);
    assert(!(await r.text()).includes('PRIVATE-UPSTREAM'));
  }
});
test('legacy GET login redirects to central admin, GET refresh does not refresh', async () => {
  const h = harness();
  const response = await h.read('login');
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), origin + '/admin/');
  assert.equal((await h.read('refresh')).status, 405);
});
test('methods and unknown routes are rejected without content access', async () => {
  const h = harness();
  assert.equal(
    (await h.handle(req('stats', { method: 'DELETE' }), 'stats')).status,
    405,
  );
  assert.equal((await h.read('unknown')).status, 404);
  assert.equal(h.calls.length, 0);
});
test('missing configuration gives sanitized error', async () => {
  const handle = createRecruitmentAdminHandler({ env: {} });
  const r = await handle(req('stats'), 'stats');
  assert.equal(r.status, 503);
  assert.deepEqual(await r.json(), {
    ok: false,
    error: { code: 'CONFIGURATION' },
  });
});

test('malformed POST filter bodies are400 and never call applicant list RPC', async () => {
  const h = harness();
  await h.login();
  for (const body of ['null', '[]', 'not-json']) {
    const response = await h.handle(
      req('list', {
        method: 'POST',
        headers: {
          Cookie: h.cookie,
          Origin: origin,
          'X-CSRF-Token': h.csrf,
          'Content-Type': 'application/json',
        },
        body,
      }),
      'list',
    );
    assert.equal(response.status, 400);
  }
  assert(!h.calls.some((c) => c.path.includes('admin_list_applications')));
});
