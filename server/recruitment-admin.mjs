import { createCmsAuth } from './cms-auth.mjs';

const headers = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'no-referrer',
};
const json = (body, status = 200) => Response.json(body, { status, headers });
const error = (code, status) => json({ ok: false, error: { code } }, status);

async function boundedJson(request, limit) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error();
  let size = 0;
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new Error();
    }
    chunks.push(Buffer.from(value));
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function config(env) {
  const url = new URL(env.SUPABASE_URL || '');
  if (
    url.protocol !== 'https:' ||
    !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname)
  )
    throw new Error();
  return {
    rpc: url.origin + '/rest/v1/rpc',
    key: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function createRecruitmentAdminHandler({
  env = process.env,
  fetchImpl = fetch,
  clock = Date.now,
} = {}) {
  const auth = createCmsAuth({ env, fetchImpl, clock });
  async function callRpc(name, params) {
    const cfg = config(env);
    const response = await fetchImpl(`${cfg.rpc}/${name}`, {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(30000),
      headers: {
        'Content-Type': 'application/json',
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
      },
      body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error();
    return boundedJson(response, 1024 * 1024);
  }

  async function audit(action, actor, targetId, details) {
    try {
      await callRpc('admin_audit_write', {
        p_action: action,
        p_actor_id: actor.id,
        p_actor_email: actor.email,
        p_target_id: targetId || null,
        p_details: details || {},
      });
    } catch {
      // Audit failure must not block the response.
    }
  }

  return async (request, route) => {
    try {
      config(env);
    } catch {
      return error('CONFIGURATION', 503);
    }

    // Compatibility routes share the same sealed admin lifecycle. No sb-* fallback.
    if (route === 'login') return auth.login(request);
    if (route === 'refresh') return auth.refresh(request);
    if (route === 'logout') return auth.logout(request);
    if (!['list', 'detail', 'stats'].includes(route))
      return error('NOT_FOUND', 404);
    if (!['GET', 'POST'].includes(request.method))
      return error('METHOD_NOT_ALLOWED', 405);

    let finish = json;
    try {
      const authorized = await auth.authorize(request);
      if (authorized.error) return authorized.error;
      finish = (body, status = 200) => {
        const response = json(
          { ...body, csrf: authorized.session.csrf },
          status,
        );
        if (authorized.setCookie)
          response.headers.append('Set-Cookie', authorized.setCookie);
        return response;
      };
      const identity = await callRpc('admin_verify_identity', {
        p_auth_id: authorized.actor.id,
      });
      if (identity?.ok !== true)
        return finish({ ok: false, error: { code: 'FORBIDDEN' } }, 403);
      const actor = authorized.actor;
      if (route === 'list') {
        let filters = {};
        if (
          request.method === 'POST' &&
          request.headers.get('content-type')?.startsWith('application/json')
        ) {
          filters = await boundedJson(request, 32768).catch(() => null);
          if (!filters || typeof filters !== 'object' || Array.isArray(filters))
            return finish({ ok: false, error: { code: 'INVALID_INPUT' } }, 400);
        } else if (request.method === 'GET') {
          const url = new URL(request.url);
          const search = url.searchParams.get('search');
          const hods = url.searchParams.get('primary_hods');
          const since = url.searchParams.get('since');
          const until = url.searchParams.get('until');
          const limit = url.searchParams.get('limit');
          const offset = url.searchParams.get('offset');
          if (search) filters.search = search;
          if (hods) filters.primary_hods = hods;
          if (since) filters.since = since;
          if (until) filters.until = until;
          if (limit) filters.limit = parseInt(limit, 10);
          if (offset) filters.offset = parseInt(offset, 10);
        }
        const result = await callRpc('admin_list_applications', {
          p_filters: filters,
        });
        await audit('admin_read_list', actor, null, { filters });
        return finish({ ok: true, data: result });
      }

      if (route === 'detail') {
        const url = new URL(request.url);
        const receipt = url.searchParams.get('receipt');
        if (
          !receipt ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            receipt,
          )
        )
          return finish({ ok: false, error: { code: 'INVALID_INPUT' } }, 400);
        const result = await callRpc('admin_get_application', {
          p_receipt: receipt,
        });
        if (!result?.found)
          return finish({ ok: false, error: { code: 'NOT_FOUND' } }, 404);
        await audit('admin_read_detail', actor, receipt, {});
        return finish({ ok: true, data: result });
      }

      if (route === 'stats') {
        const result = await callRpc('admin_get_stats', {});
        await audit('admin_stats', actor, null, {});
        return finish({ ok: true, data: result });
      }

      return error('NOT_FOUND', 404);
    } catch {
      return finish({ ok: false, error: { code: 'SERVER_ERROR' } }, 502);
    }
  };
}
