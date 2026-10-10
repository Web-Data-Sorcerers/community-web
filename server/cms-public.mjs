import { readFile } from 'node:fs/promises';

const HASH_RE = /^[a-f0-9]{64}$/;
const COLLECTIONS = new Set(['projects', 'team']);

export function createPublicMediaHandler({
  env = process.env,
  fetchImpl = fetch,
} = {}) {
  return async function handleMedia(request) {
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const url = new URL(request.url);
    const collection = url.searchParams.get('collection');
    const hash = url.searchParams.get('hash');

    if (!collection || !COLLECTIONS.has(collection)) {
      return new Response('Invalid collection', { status: 400 });
    }
    if (!hash || !HASH_RE.test(hash)) {
      return new Response('Invalid image hash', { status: 400 });
    }

    const supabaseUrl = env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new Response('Media service unavailable', { status: 503 });
    }

    const storageUrl = `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/cms-media/${collection}/${hash}.webp`;

    try {
      const res = await fetchImpl(storageUrl, {
        headers: {
          Authorization: 'Bearer ' + supabaseKey,
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        return new Response('Not Found', { status: 404 });
      }

      const bytes = await res.arrayBuffer();
      return new Response(bytes, {
        status: 200,
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control':
            'public, max-age=31536000, s-maxage=31536000, immutable',
          'CDN-Cache-Control':
            'public, max-age=31536000, s-maxage=31536000, immutable',
          'Vercel-CDN-Cache-Control':
            'public, max-age=31536000, s-maxage=31536000, immutable',
        },
      });
    } catch {
      return new Response('Media fetch failed', { status: 502 });
    }
  };
}

export function createPublicContentHandler({
  env = process.env,
  fetchImpl = fetch,
  snapshotPath = new URL('../src/data/cms-snapshot.json', import.meta.url),
} = {}) {
  return async function handleContent(request) {
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const loadFallback = async () => {
      try {
        const text = await readFile(snapshotPath, 'utf8');
        const snapshot = JSON.parse(text);
        return {
          ok: true,
          source: 'snapshot',
          data: {
            projects: snapshot.projects,
            team: snapshot.team,
            revision: snapshot.revision || 'snapshot',
          },
        };
      } catch {
        return { ok: false, error: 'SNAPSHOT_UNAVAILABLE' };
      }
    };

    const supabaseUrl = env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey || env.CMS_DATA_SOURCE === 'local') {
      const fallback = await loadFallback();
      return Response.json(fallback, {
        status: fallback.ok ? 200 : 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59',
        },
      });
    }

    const baseUrl = supabaseUrl.replace(/\/+$/, '');

    try {
      const rpc = async (fn) => {
        const url = `${baseUrl}/rest/v1/rpc/${fn}`;
        const res = await fetchImpl(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseKey,
            Authorization: 'Bearer ' + supabaseKey,
          },
          body: '{}',
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) throw new Error('RPC_FAILED');
        return res.json();
      };

      const [projectsData, teamData] = await Promise.all([
        rpc('cms_load_projects'),
        rpc('cms_load_team'),
      ]);

      const members = teamData.members || [];
      const groups = teamData.groups || [];

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

      return Response.json(
        {
          ok: true,
          source: 'supabase',
          data: {
            projects: projectsData.projects,
            team: {
              leaderTeam: leaderMembers,
              hodsTeams,
            },
            revision: `${projectsData.revision}:${teamData.revision}`,
          },
        },
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59',
            'CDN-Cache-Control':
              'public, s-maxage=10, stale-while-revalidate=59',
          },
        },
      );
    } catch {
      const fallback = await loadFallback();
      return Response.json(fallback, {
        status: fallback.ok ? 200 : 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=30',
        },
      });
    }
  };
}
