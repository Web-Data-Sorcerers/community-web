import type { APIRoute } from 'astro';
import { getSiteOrigin, canonicalUrl } from '../data/site-url.mjs';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL(getSiteOrigin());
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    '',
    `Sitemap: ${canonicalUrl('/sitemap.xml', origin)}`,
    `Sitemap: ${canonicalUrl('/sitemap-index.xml', origin)}`,
    '',
  ].join('\n');
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
