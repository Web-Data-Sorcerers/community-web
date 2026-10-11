// Server-only request loader. No process-wide configuration/revision cache.
import snapshot from '../src/data/site-visibility-snapshot.json' with { type: 'json' };
import { readFile } from 'node:fs/promises';
import {
  validateVisibility,
  parseStrictJson,
} from './site-visibility-contract.mjs';
export const visibilityHeaders = {
  'Cache-Control': 'no-store',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};
export function visibilityUnavailable() {
  return new Response(
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><meta name="viewport" content="width=device-width"><title>Temporarily unavailable — Data Sorcerers</title></head><body><main><h1>Page temporarily unavailable</h1><p>Please try again shortly.</p><a href="">Try again</a></main></body></html>',
    {
      status: 503,
      headers: {
        ...visibilityHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Retry-After': '5',
      },
    },
  );
}
export async function boundedText(response, limit = 32768) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Missing body');
  let length = 0;
  const chunks = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) throw new Error('Response too large');
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks).toString('utf8');
  } finally {
    await reader.cancel().catch(() => {});
  }
}
export function createVisibilityLoader({
  env = process.env,
  fetchImpl = fetch,
  readFileImpl = readFile,
} = {}) {
  return async function load() {
    if (env.SITE_VISIBILITY_SOURCE === 'local' && !env.VERCEL) {
      if (!env.SITE_VISIBILITY_FILE)
        return validateVisibility(structuredClone(snapshot));
      const text = await readFileImpl(env.SITE_VISIBILITY_FILE, 'utf8');
      return validateVisibility(parseStrictJson(text));
    }
    if (env.SITE_VISIBILITY_SOURCE && env.SITE_VISIBILITY_SOURCE !== 'supabase')
      throw new Error('Visibility configuration unavailable');
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)
      throw new Error('Visibility configuration unavailable');
    const url = new URL('/rest/v1/rpc/site_visibility_load', env.SUPABASE_URL);
    const response = await fetchImpl(url, {
      method: 'POST',
      redirect: 'error',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
      headers: {
        'Content-Type': 'application/json',
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: '{}',
    });
    if (!response.ok) throw new Error('Visibility upstream unavailable');
    return validateVisibility(parseStrictJson(await boundedText(response)));
  };
}
export const loadVisibility = createVisibilityLoader();
