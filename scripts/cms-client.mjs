import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { cmsSnapshotSchema } from '../src/data/cms-schema.mjs';
import {
  MEDIA_PATH,
  MEDIA_OUTPUT_LIMIT,
  verifyProjectMedia,
} from '../server/cms-media.mjs';

// Public content RPCs always use the anon key; Storage has a separate build key.
async function supabaseFetch(
  supabaseUrl,
  supabaseKey,
  rpcName,
  fetchImpl,
  timeoutMs,
) {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    Math.min(timeoutMs, 30000),
  );
  try {
    const response = await fetchImpl(supabaseUrl + '/rest/v1/rpc/' + rpcName, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: 'Bearer ' + supabaseKey,
      },
      body: '{}',
      redirect: 'error',
      signal: controller.signal,
    });
    if (
      !response.ok ||
      !/^application\/json(?:\s*;|$)/i.test(
        response.headers.get('content-type') || '',
      )
    ) {
      await response.body?.cancel();
      throw new Error('Invalid RPC response.');
    }
    return JSON.parse(await responseText(response));
  } catch {
    // Never expose an upstream URL, body, parser message, or credential.
    throw new Error('Supabase RPC ' + rpcName + ' failed.');
  } finally {
    clearTimeout(timer);
  }
}

function supabaseOrigin(value) {
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== '/'
    )
      throw new Error();
    return url.origin;
  } catch {
    throw new Error('Invalid SUPABASE_URL configuration.');
  }
}

export function cmsDataSource(env) {
  const flag = env.CMS_DATA_SOURCE;
  const deployed =
    env.VERCEL === '1' || ['production', 'preview'].includes(env.VERCEL_ENV);
  if (flag !== undefined && !['local', 'supabase'].includes(flag))
    throw new Error('CMS_DATA_SOURCE must be local or supabase.');
  if (deployed && flag !== 'supabase')
    throw new Error('Vercel builds require CMS_DATA_SOURCE=supabase.');
  if (flag === 'local') return 'local';
  const url = Boolean(env.SUPABASE_URL),
    key = Boolean(env.SUPABASE_ANON_KEY);
  if (url !== key || (flag === 'supabase' && !url))
    throw new Error(
      'CMS build requires SUPABASE_URL and SUPABASE_ANON_KEY together.',
    );
  return url && key ? 'supabase' : 'local';
}

export const CMS_MAX_BYTES = 1024 * 1024;
export const CMS_TIMEOUT_MS = 60000;

function rebuildTeamSnapshot(data) {
  const members = data.members;
  const groups = data.groups;
  const expected = [
    'leader',
    'data',
    'core',
    'language',
    'vision',
    'product',
    'growth',
  ];
  if (
    !Array.isArray(members) ||
    !Array.isArray(groups) ||
    groups.length !== expected.length ||
    groups.some((g, i) => !g || g.id !== expected[i])
  )
    throw new Error('Invalid Team groups.');
  const ids = new Set(),
    slots = new Set();
  for (const m of members) {
    if (
      !m ||
      !expected.includes(m.group) ||
      !Number.isInteger(m.order) ||
      m.order < 1 ||
      m.order > 8 ||
      slots.has(m.group + ':' + m.order) ||
      (m.id !== undefined && (typeof m.id !== 'string' || ids.has(m.id)))
    )
      throw new Error('Invalid Team members.');
    slots.add(m.group + ':' + m.order);
    if (m.id !== undefined) ids.add(m.id);
  }

  const leaderMembers = members
    .filter((m) => m.group === 'leader')
    .sort((a, b) => a.order - b.order)
    .map(({ name, role, photo }) => ({ name, role, photo }));

  const hodsTeams = groups
    .filter((g) => g.id !== 'leader')
    .map((g) => ({
      id: g.id,
      title: g.title,
      members: members
        .filter((m) => m.group === g.id)
        .sort((a, b) => a.order - b.order)
        .map(({ name, role, photo }) => ({ name, role, photo })),
    }));

  return { leaderTeam: leaderMembers, hodsTeams };
}

export function validateCmsSnapshot(value) {
  const result = cmsSnapshotSchema.safeParse(value);
  if (!result.success) {
    const paths = result.error.issues.map(
      (issue) => issue.path.join('.') || '<root>',
    );
    throw new Error(`Invalid CMS snapshot fields: ${paths.join(', ')}`);
  }
  return result.data;
}

function parseSnapshot(text) {
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('CMS snapshot JSON is malformed.');
  }
  return validateCmsSnapshot(value);
}

async function responseBytes(response, limit = CMS_MAX_BYTES) {
  if (Number(response.headers.get('content-length')) > limit) {
    await response.body?.cancel();
    throw new Error('CMS response exceeds the size limit.');
  }
  if (!response.body) throw new Error('CMS response is empty.');
  const reader = response.body.getReader();
  const chunks = [];
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limit)
        throw new Error('CMS response exceeds the size limit.');
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}

async function responseText(response) {
  return (await responseBytes(response)).toString('utf8');
}

export async function syncCmsSnapshot({
  snapshotPath,
  env = process.env,
  fetchImpl = fetch,
  timeoutMs = CMS_TIMEOUT_MS,
  mediaRoot = new URL('../public/', import.meta.url),
}) {
  const source = cmsDataSource(env);
  if (source === 'local') {
    const snapshot = parseSnapshot(await readFile(snapshotPath, 'utf8'));
    await cacheProjectMedia({ snapshot, mediaRoot });
    return 'local';
  }
  const supabaseUrl = supabaseOrigin(env.SUPABASE_URL);
  const snapshot = { schemaVersion: 1 };
  for (const collection of [
    'projects',
    'team',
    'roles',
    'domains',
    'hods',
    'partners',
  ]) {
    const rpcName = 'cms_load_' + collection;
    const data = await supabaseFetch(
      supabaseUrl,
      env.SUPABASE_ANON_KEY,
      rpcName,
      fetchImpl,
      timeoutMs,
    );
    try {
      snapshot[collection] =
        collection === 'team' ? rebuildTeamSnapshot(data) : data[collection];
      // Validate each content collection without spreading RPC metadata.
      cmsSnapshotSchema.shape[collection].parse(snapshot[collection]);
    } catch {
      throw new Error('Supabase RPC ' + rpcName + ' failed.');
    }
  }
  const validated = validateCmsSnapshot(snapshot);
  if (Buffer.byteLength(JSON.stringify(validated)) > CMS_MAX_BYTES)
    throw new Error('CMS snapshot exceeds the size limit.');
  await cacheProjectMedia({
    snapshot: validated,
    mediaRoot,
    fetchImpl,
    timeoutMs,
    supabaseUrl,
    supabaseMediaKey: env.SUPABASE_SERVICE_ROLE_KEY,
  });
  const target =
    snapshotPath instanceof URL
      ? snapshotPath
      : pathToFileURL(resolve(snapshotPath));
  const temp = new URL(`.cms-${randomUUID()}.tmp`, target);
  try {
    await writeFile(temp, `${JSON.stringify(validated, null, 2)}\n`, {
      flag: 'wx',
      mode: 0o600,
    });
    await rename(temp, target);
  } finally {
    await unlink(temp).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
  return 'remote';
}

export async function cacheProjectMedia({
  snapshot,
  mediaRoot,
  fetchImpl = fetch,
  timeoutMs = CMS_TIMEOUT_MS,
  supabaseUrl,
  supabaseMediaKey,
}) {
  const images = [
    ...new Set(
      [
        ...snapshot.projects.map((p) => p.image),
        ...snapshot.team.leaderTeam.map((m) => m.photo),
        ...snapshot.team.hodsTeams.flatMap((g) =>
          g.members.map((m) => m.photo),
        ),
      ]
        .map((image) => image)
        .filter((image) => MEDIA_PATH.test(image)),
    ),
  ];
  for (const image of images) {
    const target = new URL(
      image.slice(1),
      mediaRoot instanceof URL
        ? mediaRoot
        : pathToFileURL(resolve(mediaRoot) + '/'),
    );
    try {
      const bytes = await readFile(target);
      await verifyProjectMedia(
        { image, mimeType: 'image/webp', data: bytes.toString('base64') },
        image,
      );
      continue;
    } catch {
      /* Refetch a missing or corrupt cache entry; never silently use stale bytes. */
    }
    if (!supabaseUrl || !supabaseMediaKey)
      throw new Error(
        'CMS media cache is missing or invalid. Media fetch requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
      );
    const origin = supabaseOrigin(supabaseUrl);
    const storagePath = image.replace(/^\/images\/cms\//, '');
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      Math.min(timeoutMs, 15000),
    );
    let bytes;
    try {
      const response = await fetchImpl(
        origin + '/storage/v1/object/cms-media/' + storagePath,
        {
          headers: { Authorization: 'Bearer ' + supabaseMediaKey },
          redirect: 'error',
          signal: controller.signal,
        },
      );
      if (
        !response.ok ||
        !/^image\/webp(?:\s*;|$)/i.test(
          response.headers.get('content-type') || '',
        )
      ) {
        await response.body?.cancel();
        throw new Error('Invalid Storage response.');
      }
      const buffer = await responseBytes(response, MEDIA_OUTPUT_LIMIT);
      bytes = await verifyProjectMedia(
        { image, mimeType: 'image/webp', data: buffer.toString('base64') },
        image,
      );
    } catch {
      throw new Error('CMS project media fetch or validation failed.');
    } finally {
      clearTimeout(timer);
    }
    await mkdir(new URL('./', target), { recursive: true });
    const temp = new URL(`.media-${randomUUID()}.tmp`, target);
    try {
      await writeFile(temp, bytes, { flag: 'wx', mode: 0o644 });
      await rename(temp, target);
    } finally {
      await unlink(temp).catch((error) => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
  }
}
