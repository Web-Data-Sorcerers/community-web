export const prerender = false;
import type { APIRoute } from 'astro';
import { handleSitemapRequest } from '../../server/sitemap.mjs';

export const GET: APIRoute = async ({ site }) => {
  return handleSitemapRequest({ site });
};
