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

// A single bundled listener set survives ClientRouter swaps. Each preparation
// owns its cleanup; a superseded request cannot clear the newest request's cue.
let generation = 0;
let pending;
function clearPending(id = pending?.id) {
  if (!pending || pending.id !== id) return;
  clearTimeout(pending.timer);
  pending.link?.removeAttribute('data-navigation-pending');
  pending.signal.removeEventListener('abort', pending.abort);
  document.documentElement.classList.remove('navigation-pending');
  document.querySelector('main')?.removeAttribute('aria-busy');
  pending = undefined;
}
document.addEventListener('astro:before-preparation', (event) => {
  if (
    event.from.pathname === event.to.pathname &&
    event.from.search === event.to.search
  )
    return;
  clearPending();
  const id = ++generation;
  const abort = () => clearPending(id);
  pending = {
    id,
    target: event.to.href,
    link: event.sourceElement?.closest?.('a'),
    signal: event.signal,
    abort,
    timer: setTimeout(abort, 20000),
  };
  event.signal.addEventListener('abort', abort, { once: true });
  if (event.signal.aborted) {
    clearPending(id);
    return;
  }
  pending.link?.setAttribute('data-navigation-pending', 'true');
  document.documentElement.classList.add('navigation-pending');
  document.querySelector('main')?.setAttribute('aria-busy', 'true');
  const loader = event.loader;
  event.loader = async () => {
    try {
      await loader();
    } catch (error) {
      clearPending(id);
      throw error;
    } finally {
      if (event.defaultPrevented || event.signal.aborted) clearPending(id);
    }
  };
});
document.addEventListener('astro:before-swap', (event) => {
  event.newDocument.documentElement.classList.add('nav-warm');
  if (!pending) return;
  if (pending.signal === event.signal) pending.target = event.to.href;
  event.newDocument.documentElement.classList.add('navigation-pending');
  event.newDocument.querySelector('main')?.setAttribute('aria-busy', 'true');
});
document.addEventListener('astro:page-load', () => {
  if (!pending) return;
  const target = new URL(pending.target);
  if (
    target.pathname === location.pathname &&
    target.search === location.search
  )
    clearPending(pending.id);
});
window.addEventListener('pageshow', () => clearPending());
