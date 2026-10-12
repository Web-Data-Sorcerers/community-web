import {
  mount as mountProjects,
  getInstance as getProjects,
} from './cms-admin-editor.js';
import {
  mount as mountTeam,
  getInstance as getTeam,
} from './cms-team-editor.js';
import {
  mount as mountRecruitment,
  getInstance as getRecruitment,
} from './recruitment-admin.js';

import {
  mount as mountPages,
  getInstance as getPages,
} from './site-visibility-editor.js';
const TABS = ['projects', 'team', 'recruitment', 'pages'];
let initializedRoot;
let shellListeners;
let sessionState = 'checking';
let sessionGeneration = 0;
let resumeQueue = Promise.resolve();
let resumeCount = 0;
let kickWarm = () => {};

function setSessionState(state) {
  sessionState = state;
  initializedRoot?.closest('.admin-shell')?.setAttribute('data-session', state);
}
function resumePanels(tabs) {
  const mine = sessionGeneration;
  resumeCount++;
  resumeQueue = resumeQueue
    .catch(() => {})
    .then(async () => {
      for (const tab of tabs) {
        if (
          mine !== sessionGeneration ||
          sessionState !== 'authenticated' ||
          !initializedRoot?.isConnected
        )
          break;
        try {
          await getModule(tab).get(tab)?.ensureSession?.();
        } catch {
          /* Explicit retry remains available. */
        }
      }
    })
    .finally(() => {
      resumeCount--;
      kickWarm();
    });
  return resumeQueue;
}
const PANEL_ID = {
  pages: 'panel-pages',
  projects: 'panel-projects',
  team: 'panel-team',
  recruitment: 'panel-recruitment',
};
let activeTab = 'projects';
let mounted = {};

function getPanelRoot(tab) {
  return document.getElementById(PANEL_ID[tab]);
}

function getModule(tab) {
  switch (tab) {
    case 'pages':
      return { mount: mountPages, get: getPages };
    case 'projects':
      return { mount: mountProjects, get: getProjects };
    case 'team':
      return { mount: mountTeam, get: getTeam };
    case 'recruitment':
      return { mount: mountRecruitment, get: getRecruitment };
  }
}

function isAnyDirty() {
  for (const tab of TABS) {
    const mod = getModule(tab);
    const inst = mod.get(tab);
    if (inst && inst.isDirty()) return true;
  }
  return false;
}

function showTab(tab) {
  if (tab === activeTab) return;
  if (
    isAnyDirty() &&
    !confirm(
      'Ada perubahan yang belum disimpan. Tetap pindah tab? Draft tetap tersedia.',
    )
  ) {
    return;
  }
  for (const t of TABS) {
    const panel = getPanelRoot(t);
    if (!panel) continue;
    panel.hidden = t !== tab;
  }
  activeTab = tab;
  updateNav(tab);
  const hash = tab === 'projects' ? '' : tab;
  history.replaceState({ tab }, '', hash ? '/admin/#' + hash : '/admin/');
  mountIfNeeded(tab);
  if (sessionState === 'authenticated') void resumePanels([tab]);
}

function mountIfNeeded(tab, isPrewarm = false) {
  if (mounted[tab]) return;
  const root = getPanelRoot(tab);
  if (!root) return;
  const link = document.querySelector(`.admin-module-link[data-tab="${tab}"]`);
  if (link && !isPrewarm) link.classList.add('is-loading');
  const mod = getModule(tab);
  mod.mount(root);
  mounted[tab] = true;
  const ws = root.querySelector('#workspace');
  const loginForm = root.querySelector('#login-form');
  const loginButton = root.querySelector('#login');
  if (link) {
    const isReady = () =>
      (ws && !ws.hidden) ||
      (loginForm && !loginForm.hidden) ||
      (loginButton && !loginButton.hidden);
    if (isReady()) {
      link.classList.remove('is-loading');
    } else {
      const observer = new MutationObserver(() => {
        if (isReady()) {
          link.classList.remove('is-loading');
          observer.disconnect();
        }
      });
      if (ws)
        observer.observe(ws, { attributes: true, attributeFilter: ['hidden'] });
      if (loginButton)
        observer.observe(loginButton, {
          attributes: true,
          attributeFilter: ['hidden'],
        });
      if (loginForm)
        observer.observe(loginForm, {
          attributes: true,
          attributeFilter: ['hidden'],
        });
    }
  }
}

function updateNav(tab) {
  document.querySelectorAll('.admin-module-link').forEach((link) => {
    const isActive = link.dataset.tab === tab;
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
    link.classList.toggle('active', isActive);
  });
}

function getTabFromPath() {
  const path = location.pathname;
  const hash = location.hash.replace('#', '');
  if (hash === 'pages') return 'pages';
  if (path.endsWith('/team/') || hash === 'team') return 'team';
  if (path.endsWith('/recruitment/') || hash === 'recruitment')
    return 'recruitment';
  return 'projects';
}

function initShell(initialTab) {
  const root = getPanelRoot('projects');
  if (initializedRoot === root) return;
  shellListeners?.abort();
  shellListeners = new AbortController();
  initializedRoot = root;
  sessionGeneration++;
  setSessionState('checking');
  mounted = {};
  document.addEventListener(
    'ds:admin-session-started',
    () => {
      setSessionState('authenticated');
      void resumePanels([
        activeTab,
        ...TABS.filter((t) => t !== activeTab && mounted[t]),
      ]);
    },
    { signal: shellListeners.signal },
  );
  document.addEventListener(
    'ds:admin-session-ended',
    () => {
      sessionGeneration++;
      setSessionState('expired');
      for (const tab of TABS) getModule(tab).get(tab)?.expireSession?.();
    },
    { signal: shellListeners.signal },
  );
  const tab =
    location.hash === '#pages' ? 'pages' : initialTab || getTabFromPath();
  activeTab = tab;
  for (const t of TABS) {
    const panel = getPanelRoot(t);
    if (panel) panel.hidden = t !== tab;
  }
  updateNav(tab);
  mountIfNeeded(tab);

  // Do not compete with the active panel's bootstrap. Warm one panel at a
  // time after its predecessor reaches workspace/login readiness.
  let warming;
  let queued = false;
  const ready = (target) => {
    const panel = getPanelRoot(target);
    const workspace = panel?.querySelector('#workspace');
    const login = panel?.querySelector('#login-form');
    const loginButton = panel?.querySelector('#login');
    return (
      (workspace && !workspace.hidden) ||
      (login && !login.hidden) ||
      (loginButton && !loginButton.hidden)
    );
  };
  const observer = new MutationObserver(() => {
    if (
      TABS.some((t) => {
        const workspace = getPanelRoot(t)?.querySelector('#workspace');
        return workspace && !workspace.hidden;
      })
    )
      setSessionState('authenticated');
    else if (sessionState === 'checking' && ready(activeTab))
      setSessionState('anonymous');
    scheduleWarm();
  });
  shellListeners.signal.addEventListener('abort', () => observer.disconnect(), {
    once: true,
  });
  for (const t of TABS) {
    const panel = getPanelRoot(t);
    if (panel)
      observer.observe(panel, {
        subtree: true,
        attributes: true,
        attributeFilter: ['hidden'],
      });
  }
  function scheduleWarm() {
    if (
      queued ||
      resumeCount > 0 ||
      !root?.isConnected ||
      !ready(activeTab) ||
      (warming && !ready(warming))
    )
      return;
    const next = TABS.find((t) => !mounted[t]);
    if (!next) return;
    queued = true;
    const run = () => {
      queued = false;
      if (!root.isConnected) {
        observer.disconnect();
        return;
      }
      if (resumeCount > 0 || !ready(activeTab) || (warming && !ready(warming)))
        return;
      const target = TABS.find((t) => !mounted[t]);
      if (target) {
        warming = target;
        mountIfNeeded(target, true);
      }
      scheduleWarm();
    };
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(run, { timeout: 1200 });
    } else setTimeout(run, 400);
  }
  kickWarm = scheduleWarm;
  scheduleWarm();

  document.querySelectorAll('.admin-module-link').forEach((link) => {
    link.addEventListener(
      'click',
      (e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        showTab(link.dataset.tab);
      },
      { signal: shellListeners.signal },
    );
  });
  window.addEventListener(
    'beforeunload',
    (e) => {
      if (isAnyDirty()) {
        e.preventDefault();
        e.returnValue = '';
      }
    },
    { signal: shellListeners.signal },
  );
  window.addEventListener(
    'popstate',
    () => {
      const t = getTabFromPath();
      if (t !== activeTab) showTab(t);
    },
    { signal: shellListeners.signal },
  );
}

export { initShell, showTab, mountIfNeeded, isAnyDirty };
