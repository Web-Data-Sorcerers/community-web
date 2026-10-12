export const prerender = false;
import type { APIRoute } from 'astro';
import { handleSitemapIndexRequest } from '../../server/sitemap.mjs';

export const GET: APIRoute = async ({ site }) => {
  return handleSitemapIndexRequest({ site });
};
