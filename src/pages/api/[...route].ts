import type { APIRoute } from 'astro';
import visibility from '../../../server/site-visibility-api.mjs';
import projects from '../../../api/admin/projects.js';
import team from '../../../api/admin/team.js';
import media from '../../../api/admin/media.js';
import login from '../../../api/admin/auth/login.js';
import logout from '../../../api/admin/auth/logout.js';
import refresh from '../../../api/admin/auth/refresh.js';
import callback from '../../../api/admin/auth/callback.js';
import recruitmentAdmin from '../../../api/admin/recruitment/[...route].js';
import recruitment from '../../../api/recruitment/application.js';
import publicMedia from '../../../api/media.js';
export const prerender = false;
const handlers = new Map([
  ['admin/site-visibility', visibility],
  ['admin/projects', projects],
  ['admin/team', team],
  ['admin/media', media],
  ['admin/auth/login', login],
  ['admin/auth/logout', logout],
  ['admin/auth/refresh', refresh],
  ['admin/auth/callback', callback],
  ['recruitment/application', recruitment],
  ['media', publicMedia],
]);
export const ALL: APIRoute = ({ request, params }) => {
  const route = params.route || '';
  const handler =
    handlers.get(route) ||
    (route.startsWith('admin/recruitment/') ? recruitmentAdmin : null);
  return handler
    ? handler.fetch(request)
    : new Response('Not Found', { status: 404 });
};
