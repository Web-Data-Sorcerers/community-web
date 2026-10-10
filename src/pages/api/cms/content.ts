import snapshot from '../../../data/cms-snapshot.json';

export const prerender = true;

export async function GET() {
  return Response.json(
    {
      ok: true,
      source: 'snapshot',
      data: {
        projects: snapshot.projects,
        team: snapshot.team,
        revision: 'snapshot',
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
}
