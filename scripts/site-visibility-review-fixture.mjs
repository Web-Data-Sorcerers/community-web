// Explicit, loopback-only review transport. Never imported by the application.
import { readFile, writeFile, rename } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import {
  exactKeys,
  parseStrictJson,
  validateSave,
  validateVisibility,
} from '../server/site-visibility-contract.mjs';

export function createReviewFixture() {
  if (process.env.SITE_VISIBILITY_REVIEW_FIXTURE !== '1') return null;
  if (
    process.env.VERCEL ||
    process.env.SITE_VISIBILITY_SOURCE !== 'local' ||
    !process.env.SITE_VISIBILITY_FILE ||
    !resolve(process.env.SITE_VISIBILITY_FILE).startsWith('/tmp/')
  )
    throw new Error('Review mode requires an explicit /tmp local fixture');
  const file = resolve(process.env.SITE_VISIBILITY_FILE),
    csrf = randomUUID(),
    receipts = new Map();
  let session = true,
    queue = Promise.resolve();
  const reply = (value, status = 200) =>
    Response.json(value, {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
        'X-Local-Review-Fixture': '1',
      },
    });
  const error = (code, status) => reply({ ok: false, error: { code } }, status);
  return async (request) => {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/admin/')) return null;
    if (request.method !== 'GET') {
      if (request.headers.get('origin') !== url.origin)
        return error('ORIGIN_REJECTED', 403);
      if (
        url.pathname !== '/api/admin/auth/login' &&
        request.headers.get('x-csrf-token') !== csrf
      )
        return error('CSRF_REJECTED', 403);
    }
    // Login/logout simulate only the isolated review session, never CMS Auth.
    if (url.pathname === '/api/admin/auth/login') {
      session = true;
      return reply({ ok: true, csrf });
    }
    if (url.pathname === '/api/admin/auth/logout') {
      session = false;
      return reply({ ok: true });
    }
    if (!session || url.pathname !== '/api/admin/site-visibility')
      return error('UNAUTHORIZED', 401);
    if (request.method === 'GET')
      return reply({
        ok: true,
        data: validateVisibility(JSON.parse(await readFile(file, 'utf8'))),
        csrf,
      });
    if (request.method !== 'POST') return error('METHOD_NOT_ALLOWED', 405);
    let payload;
    try {
      const body = parseStrictJson(await request.text());
      exactKeys(body, ['operation', 'payload']);
      if (body.operation !== 'save') throw new Error();
      payload = validateSave(body.payload);
    } catch {
      return error('INVALID_INPUT', 400);
    }
    const save = async () => {
      const fingerprint = JSON.stringify(payload);
      const receipt = receipts.get(payload.requestId);
      if (receipt)
        return receipt.fingerprint === fingerprint
          ? reply(receipt.result)
          : error('ID_CONFLICT', 409);
      const data = validateVisibility(JSON.parse(await readFile(file, 'utf8')));
      if (data.revision !== payload.expectedRevision)
        return reply(
          { ok: false, error: { code: 'CONFLICT' }, data, csrf },
          409,
        );
      let changed = false;
      for (const change of payload.changes) {
        const state = data.pages[change.pageId];
        const target = change.sectionId ? state.sections : state;
        const key = change.sectionId || 'enabled';
        changed ||= target[key] !== change.enabled;
        target[key] = change.enabled;
      }
      if (changed) {
        data.revision = randomUUID();
        validateVisibility(data);
        const temporary = file + '.' + randomUUID();
        await writeFile(temporary, JSON.stringify(data, null, 2) + '\n');
        await rename(temporary, file);
      }
      const result = { ok: true, data, csrf };
      receipts.set(payload.requestId, { fingerprint, result });
      return reply(result);
    };
    const pending = queue.then(save);
    queue = pending.catch(() => {});
    return pending;
  };
}
