import type { APIRoute } from 'astro';
import media from '../../../../../api/media.js';
export const prerender = false;
export const ALL: APIRoute = ({ request, params }) => {
  const url = new URL('/api/media', request.url);
  url.searchParams.set('collection', params.collection || '');
  url.searchParams.set('hash', params.hash || '');
  return media.fetch(new Request(url, request));
};
