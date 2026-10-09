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

const TABS = ['projects', 'team', 'recruitment'];
const PANEL_ID = {
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
      'Ada perubahan yang belum disimpan. Pindah tab dan abaikan perubahan?',
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

function mountIfNeeded(tab) {
  if (mounted[tab]) return;
  const root = getPanelRoot(tab);
  if (!root) return;
  const link = document.querySelector(`.admin-module-link[data-tab="${tab}"]`);
  if (link) link.classList.add('is-loading');
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
    link.setAttribute('aria-current', isActive ? 'page' : undefined);
    link.classList.toggle('active', isActive);
  });
}

function getTabFromPath() {
  const path = location.pathname;
  const hash = location.hash.replace('#', '');
  if (path.endsWith('/team/') || hash === 'team') return 'team';
  if (path.endsWith('/recruitment/') || hash === 'recruitment')
    return 'recruitment';
  return 'projects';
}

function initShell(initialTab) {
  const tab = initialTab || getTabFromPath();
  activeTab = tab;
  for (const t of TABS) {
    const panel = getPanelRoot(t);
    if (panel) panel.hidden = t !== tab;
  }
  updateNav(tab);
  mountIfNeeded(tab);
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
