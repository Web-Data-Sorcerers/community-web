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
  if (link) {
    const isReady = () =>
      (ws && !ws.hidden) || (loginForm && !loginForm.hidden);
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
  initializedRoot = root;
  mounted = {};
  document.addEventListener('ds:admin-session-ended', () => {
    for (const tab of TABS) getModule(tab).get(tab)?.expireSession?.();
  });
  const tab =
    location.hash === '#pages' ? 'pages' : initialTab || getTabFromPath();
  activeTab = tab;
  for (const t of TABS) {
    const panel = getPanelRoot(t);
    if (panel) panel.hidden = t !== tab;
  }
  updateNav(tab);
  mountIfNeeded(tab);

  const prewarmRemainingTabs = () => {
    TABS.filter((t) => t !== activeTab).forEach((t) => {
      mountIfNeeded(t, true);
    });
  };

  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(prewarmRemainingTabs, { timeout: 1200 });
  } else {
    setTimeout(prewarmRemainingTabs, 400);
  }

  document.querySelectorAll('.admin-module-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      showTab(link.dataset.tab);
    });
  });
  window.addEventListener('beforeunload', (e) => {
    if (isAnyDirty()) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
  window.addEventListener('popstate', () => {
    const t = getTabFromPath();
    if (t !== activeTab) showTab(t);
  });
}

export { initShell, showTab, mountIfNeeded, isAnyDirty };
