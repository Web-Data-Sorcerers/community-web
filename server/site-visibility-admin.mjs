import { createCmsAuth } from './cms-auth.mjs';
import {
  exactKeys,
  validateSave,
  validateVisibility,
  parseStrictJson,
} from './site-visibility-contract.mjs';
import {
  createVisibilityLoader,
  visibilityHeaders,
  boundedText,
} from './site-visibility.mjs';
export function createVisibilityAdmin({
  env = process.env,
  fetchImpl = fetch,
  auth = createCmsAuth({ env, fetchImpl }),
  load = createVisibilityLoader({ env, fetchImpl }),
  save,
} = {}) {
  const write =
    save ||
    (async (actor, payload) => {
      // Existing Management API transport: encoded literals, constant RPC name.
      // Local PG does not ship PostgREST safeupdate; preserve proven existing path.
      if (!env.SUPABASE_ACCESS_TOKEN)
        throw new Error('Missing write configuration');
      const lit = (v) =>
        `convert_from(decode('${Buffer.from(v).toString('hex')}','hex'),'UTF8')`;
      const query = `select public.site_visibility_save(${lit(actor.id)}::uuid,${lit(payload.expectedRevision)}::uuid,${lit(payload.requestId)}::uuid,${lit(JSON.stringify(payload.changes))}::jsonb) as result`;
      const response = await fetchImpl(
        'https://api.supabase.com/v1/projects/yejrdckcmlxrkklgtrwy/database/query',
        {
          method: 'POST',
          redirect: 'error',
          signal: AbortSignal.timeout(15000),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({ query }),
        },
      );
      if (!response.ok) throw new Error('Write unavailable');
      const data = JSON.parse(await boundedText(response, 65536));
      if (!Array.isArray(data) || data.length !== 1)
        throw new Error('Invalid write result');
      return data[0].result;
    });
  return async (request) => {
    const respond = (body, status = 200, cookie) => {
      const r = Response.json(body, {
        status,
        headers: { ...visibilityHeaders, 'X-Robots-Tag': 'noindex, nofollow' },
      });
      if (cookie) r.headers.set('Set-Cookie', cookie);
      return r;
    };
    const error = (code, status, cookie) =>
      respond({ ok: false, error: { code } }, status, cookie);
    if (!['GET', 'POST'].includes(request.method)) {
      const r = error('METHOD_NOT_ALLOWED', 405);
      r.headers.set('Allow', 'GET, POST');
      return r;
    }
    const authorized = await auth.authorize(request);
    if (authorized.error) {
      for (const [key, value] of Object.entries(visibilityHeaders))
        authorized.error.headers.set(key, value);
      return authorized.error;
    }
    const { actor, session, setCookie } = authorized;
    try {
      if (request.method === 'GET')
        return respond(
          {
            ok: true,
            data: validateVisibility(await load()),
            csrf: session.csrf,
          },
          200,
          setCookie,
        );
      if (
        request.headers.get('content-type')?.split(';')[0].trim() !==
        'application/json'
      )
        return error('UNSUPPORTED_MEDIA_TYPE', 415, setCookie);
      let payload;
      try {
        const body = parseStrictJson(await boundedText(request));
        exactKeys(body, ['operation', 'payload']);
        if (body.operation !== 'save') throw new Error();
        payload = validateSave(body.payload);
      } catch {
        return error('INVALID_INPUT', 400, setCookie);
      }
      const result = await write(actor, payload);
      if (result?.ok === true)
        return respond(
          {
            ok: true,
            data: validateVisibility(result.data),
            csrf: session.csrf,
          },
          200,
          setCookie,
        );
      const status = {
        CONFLICT: 409,
        ID_CONFLICT: 409,
        FORBIDDEN: 403,
        INVALID_INPUT: 400,
        LIMIT: 409,
      }[result?.error?.code];
      if (!status) throw new Error('Invalid write result');
      return respond(
        {
          ok: false,
          error: { code: result.error.code },
          ...(result.data ? { data: validateVisibility(result.data) } : {}),
          csrf: session.csrf,
        },
        status,
        setCookie,
      );
    } catch {
      return error('VISIBILITY_UNAVAILABLE', 503, setCookie);
    }
  };
}
