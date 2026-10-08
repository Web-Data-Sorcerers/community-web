import { createCmsAuth } from './cms-auth.mjs';
import {
  filters,
  mutation,
  receipt,
  page,
  queryInput,
  project,
} from './recruitment-review-contract.mjs';

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
      throw Object.assign(new Error('BODY_TOO_LARGE'), {
        code: 'BODY_TOO_LARGE',
        status: 413,
      });
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
    const data = await boundedJson(response, 1024 * 1024).catch(() => {
      throw new Error('INVALID_UPSTREAM');
    });
    if (!response.ok) {
      if (['FORBIDDEN', 'NOT_FOUND', 'INVALID_INPUT'].includes(data?.message))
        throw Object.assign(new Error(data.message), {
          code: data.message,
          status: { FORBIDDEN: 403, NOT_FOUND: 404, INVALID_INPUT: 400 }[
            data.message
          ],
        });
      throw new Error();
    }
    return data;
  }

  async function writeRpc(name, actorId, body) {
    if (!env.SUPABASE_ACCESS_TOKEN) throw new Error();
    // Function names are dispatch constants. Hex UTF-8 literals cannot become SQL.
    const literal = (value) =>
      `convert_from(decode('${Buffer.from(value).toString('hex')}','hex'),'UTF8')`;
    const query = `select public.${name}(${literal(actorId)},${literal(JSON.stringify(body))}::jsonb) as result`;
    const response = await fetchImpl(
      'https://api.supabase.com/v1/projects/yejrdckcmlxrkklgtrwy/database/query',
      {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(30000),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ query }),
      },
    );
    if (!response.ok) throw new Error();
    const data = await boundedJson(response, 1024 * 1024).catch(() => {
      throw new Error('INVALID_UPSTREAM');
    });
    if (!Array.isArray(data) || data.length !== 1) throw new Error();
    return data[0].result;
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
    if (
      ![
        'list',
        'detail',
        'stats',
        'notes',
        'history',
        'status',
        'note',
      ].includes(route)
    )
      return error('NOT_FOUND', 404);
    if (
      !(
        ['list', 'stats'].includes(route)
          ? ['GET', 'POST']
          : ['status', 'note'].includes(route)
            ? ['POST']
            : ['GET']
      ).includes(request.method)
    )
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
      const url = new URL(request.url);
      const actorParams = { p_actor_id: actor.id };
      let result, input;
      if (['status', 'note'].includes(route)) {
        if (
          !request.headers.get('content-type')?.startsWith('application/json')
        )
          return finish({ ok: false, error: { code: 'INVALID_INPUT' } }, 400);
        input = mutation(await boundedJson(request, 32768), route);
        result = project(
          await writeRpc(
            route === 'status'
              ? 'admin_update_application_status'
              : 'admin_add_review_note',
            actor.id,
            input,
          ),
          route,
        );
        if (!result.ok)
          return finish(
            result,
            {
              FORBIDDEN: 403,
              NOT_FOUND: 404,
              INVALID_INPUT: 400,
              CONFLICT: 409,
              ID_CONFLICT: 409,
              INVALID_TRANSITION: 409,
            }[result.error.code],
          );
        return finish({ ok: true, data: result });
      }
      if (['list', 'stats'].includes(route)) {
        if (request.method === 'POST') {
          if (
            !request.headers.get('content-type')?.startsWith('application/json')
          )
            return finish({ ok: false, error: { code: 'INVALID_INPUT' } }, 400);
          input = await boundedJson(request, 32768);
        } else
          input = queryInput(url, [
            'search',
            'primary_hods',
            'status',
            'since',
            'until',
            'sort',
            'limit',
            'offset',
            'as_of',
          ]);
        input = filters(input);
        result = project(
          await callRpc(
            route === 'list'
              ? 'admin_list_applications_v2'
              : 'admin_get_stats_v2',
            { ...actorParams, p_filters: input },
          ),
          route,
          input,
        );
        await audit(
          route === 'list' ? 'admin_read_list' : 'admin_stats',
          actor,
          null,
          {
            search_applied: Boolean(input.search),
            domain: input.primary_hods || '',
            status: input.status || '',
            date_applied: Boolean(input.since || input.until),
            offset: input.offset,
            limit: input.limit,
          },
        );
      } else {
        input = queryInput(
          url,
          route === 'detail' ? ['receipt'] : ['receipt', 'limit', 'offset'],
        );
        const id = receipt(input.receipt);
        if (route === 'detail') {
          result = project(
            await callRpc('admin_get_application_v2', {
              ...actorParams,
              p_receipt: id,
            }),
            route,
          );
          if (!result.found)
            return finish({ ok: false, error: { code: 'NOT_FOUND' } }, 404);
        } else {
          delete input.receipt;
          input = page(input);
          result = project(
            await callRpc(
              route === 'notes'
                ? 'admin_list_review_notes'
                : 'admin_list_review_events',
              { ...actorParams, p_receipt: id, p_page: input },
            ),
            route,
            input,
          );
        }
        await audit('admin_read_detail', actor, id, { surface: route });
      }
      return finish({ ok: true, data: result });
    } catch (cause) {
      if (
        ['INVALID_INPUT', 'BODY_TOO_LARGE', 'FORBIDDEN', 'NOT_FOUND'].includes(
          cause.code,
        )
      )
        return finish({ ok: false, error: { code: cause.code } }, cause.status);
      if (cause instanceof SyntaxError)
        return finish({ ok: false, error: { code: 'INVALID_INPUT' } }, 400);
      return finish({ ok: false, error: { code: 'SERVER_ERROR' } }, 502);
    }
  };
}
