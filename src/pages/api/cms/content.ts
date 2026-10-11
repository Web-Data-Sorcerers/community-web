import content from '../../../../api/cms/content.js';
import type { APIRoute } from 'astro';
export const prerender = false;
export const ALL: APIRoute = ({ request }) => content.fetch(request);
