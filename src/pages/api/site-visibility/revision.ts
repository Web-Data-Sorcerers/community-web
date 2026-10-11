import {
  loadVisibility,
  visibilityHeaders,
  visibilityUnavailable,
} from '../../../../server/site-visibility.mjs';
export const prerender = false;
export async function GET() {
  try {
    const config = await loadVisibility();
    return new Response(JSON.stringify({ revision: config.revision }), {
      headers: { ...visibilityHeaders, 'Content-Type': 'application/json' },
    });
  } catch {
    return visibilityUnavailable();
  }
}
