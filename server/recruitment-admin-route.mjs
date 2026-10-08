const ROUTES = {
  applications: 'list',
  application: 'detail',
  stats: 'stats',
  notes: 'notes',
  history: 'history',
  'review-status': 'status',
  'review-note': 'note',
  login: 'login',
  refresh: 'refresh',
  callback: 'callback',
  logout: 'logout',
};

export function recruitmentAdminRoute(request) {
  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const name = segments.at(-1);
  const route = ROUTES[name] || 'notfound';
  // Vercel's filesystem rewrite adds the literal [...route] parameter name.
  // It is routing metadata only when its single value matches the actual path.
  const routed = url.searchParams.getAll('...route');
  if (
    route !== 'notfound' &&
    segments.length === 4 &&
    segments.slice(0, 3).join('/') === 'api/admin/recruitment' &&
    routed.length === 1 &&
    routed[0] === name
  ) {
    url.searchParams.delete('...route');
    request = new Request(url, request);
  }
  return { request, route };
}
