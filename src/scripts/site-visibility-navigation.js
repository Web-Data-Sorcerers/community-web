let probing = false;
window.addEventListener('pageshow', async (event) => {
  if (!event.persisted || probing) return;
  const revision = document.querySelector(
    'meta[name="ds-visibility-revision"]',
  )?.content;
  if (!revision) return;
  probing = true;
  try {
    const response = await fetch('/api/site-visibility/revision', {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok || (await response.json()).revision !== revision)
      location.reload();
  } catch {
    location.reload();
  } finally {
    probing = false;
  }
});
document.addEventListener('astro:page-load', () => {
  if (
    !document.querySelector('meta[name="ds-visibility-revision"]') ||
    !location.hash
  )
    return;
  try {
    if (!document.getElementById(decodeURIComponent(location.hash.slice(1))))
      window.scrollTo(0, 0);
  } catch {
    window.scrollTo(0, 0);
  }
});
