// Central site origin and canonical URL helpers for Data Sorcerers.
// Target production canonical origin: https://community.data-sorcerers.com

import { pageForPath } from './site-visibility-registry.mjs';

export const DEFAULT_SITE_URL = 'https://community.data-sorcerers.com';
export const LEGACY_PUBLIC_HOST = 'data-sorcerers-community-sigma.vercel.app';
export const CANONICAL_HOST = 'community.data-sorcerers.com';

/**
 * Evaluates whether a request should be redirected from the legacy public host.
 * Strictly excludes preview deployments, localhost, admin, api, and internal routes.
 * @param {URL | string} url
 * @returns {string | null} Target URL if redirect is required, null otherwise.
 */
export function getLegacyHostRedirect(url) {
  const parsed = typeof url === 'string' ? new URL(url) : url;
  if (
    parsed.hostname === LEGACY_PUBLIC_HOST &&
    !parsed.pathname.startsWith('/admin') &&
    !parsed.pathname.startsWith('/api') &&
    !parsed.pathname.startsWith('/_')
  ) {
    return new URL(parsed.pathname + parsed.search, DEFAULT_SITE_URL).href;
  }
  return null;
}

/**
 * Returns the configured public site origin without trailing slash.
 */
export function getSiteOrigin(env = process.env) {
  const raw = env.SITE_URL || DEFAULT_SITE_URL;
  return raw.replace(/\/+$/, '');
}

/**
 * Builds a query-free canonical URL matching the registry path slash policy.
 * @param {string} pathOrUrl
 * @param {string | URL} [site]
 * @returns {string}
 */
export function canonicalUrl(pathOrUrl, site = DEFAULT_SITE_URL) {
  const origin = typeof site === 'string' ? site.replace(/\/+$/, '') : site.origin;
  let pathname = pathOrUrl;
  let hash = '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    try {
      const u = new URL(pathOrUrl);
      pathname = u.pathname;
      hash = u.hash;
    } catch {
      pathname = pathOrUrl;
    }
  } else if (pathOrUrl.includes('#')) {
    const parts = pathOrUrl.split('#');
    pathname = parts[0] || '/';
    hash = '#' + parts[1];
  }

  // Ensure query strings are stripped for query-free canonical URLs
  if (pathname.includes('?')) {
    pathname = pathname.split('?')[0];
  }

  // Registry paths always have leading and trailing slashes (e.g. '/', '/about/', '/recruitment/roles/data/').
  const matched = pageForPath(pathname);
  if (matched) {
    return `${origin}${matched.path}${hash}`;
  }

  // Files with extensions (e.g. .xml, .txt, .json, .png) should not have a trailing slash
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) {
    const cleanPath = '/' + pathname.replace(/^\/+/, '');
    return `${origin}${cleanPath}${hash}`;
  }

  const normalizedPath = pathname === '/' ? '/' : '/' + pathname.replace(/^\/+/, '').replace(/\/+$/, '') + '/';
  return `${origin}${normalizedPath}${hash}`;
}
