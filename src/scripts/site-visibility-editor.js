import { createSessionResumer } from './admin-session.js';
import {
  VISIBILITY_PAGES,
  PAGE_BY_ID,
  getPageState,
  getSectionState,
} from '../data/site-visibility-registry.mjs';
import { validateVisibility } from '../../server/site-visibility-contract.mjs';
import { createTransport } from './admin-request.js';
const instances = new Map();
export function getInstance(id) {
  return instances.get(id) || instances.get('panel-' + id) || null;
}
export function mount(root, opts = {}) {
  if (instances.has(root.id)) return instances.get(root.id);
  const $ = (id) => root.querySelector('#' + id),
    send = createTransport(opts.fetchImpl || fetch),
    listeners = new AbortController();
  let saved,
    draft,
    csrf,
    selected = 'home',
    busy = false,
    generation = 0,
    readController,
    uncertain,
    conflict,
    toastTimer;
  const openedGroups = new Set(['main']);
  const groups = [
    { id: 'main', label: 'Halaman utama', pages: VISIBILITY_PAGES.slice(0, 6) },
    {
      id: 'hods',
      label: 'Detail HoDS',
      pages: VISIBILITY_PAGES.filter((p) => p.id.startsWith('hods-')),
    },
    {
      id: 'recruitment',
      label: 'Detail Recruitment',
      pages: VISIBILITY_PAGES.filter((p) => p.parent === 'recruitment'),
    },
  ];
  const changes = () =>
    !saved || !draft
      ? []
      : VISIBILITY_PAGES.flatMap((p) => [
          ...(saved.pages[p.id].enabled !== draft.pages[p.id].enabled
            ? [{ pageId: p.id, enabled: draft.pages[p.id].enabled }]
            : []),
          ...p.sections
            .filter(
              (s) =>
                saved.pages[p.id].sections[s.id] !==
                draft.pages[p.id].sections[s.id],
            )
            .map((s) => ({
              pageId: p.id,
              sectionId: s.id,
              enabled: draft.pages[p.id].sections[s.id],
            })),
        ]);
  const message = (text) => {
    $('status').textContent = text;
  };
  const toast = (text) => {
    clearTimeout(toastTimer);
    $('toast').textContent = text;
    $('toast').hidden = false;
    toastTimer = setTimeout(() => ($('toast').hidden = true), 4000);
  };
  function expireSession() {
    generation++;
    readController?.abort();
    saved = draft = csrf = uncertain = conflict = undefined;
    busy = false;
    $('workspace').hidden = true;
    $('page-list').replaceChildren();
    $('page-detail').replaceChildren();
    $('conflict-state').replaceChildren();
    $('change-list').replaceChildren();
    $('change-summary').hidden = true;
    root.classList.remove('has-pending');
    $('page-search').value = '';
    $('search-empty').hidden = $('clear-search').hidden = true;
    setPickerOpen(false);
    $('conflict').hidden = $('uncertain').hidden = $('toast').hidden = true;
    clearTimeout(toastTimer);
    $('login-form').hidden = false;
    $('bootstrap-reload').hidden = false;
    message('Masuk dengan akun owner untuk mengelola Pages & Sections.');
  }
  const el = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  function setPickerOpen(open) {
    root.classList.toggle('picker-open', open);
    $('page-picker-toggle').setAttribute('aria-expanded', String(open));
    $('page-picker-toggle').querySelector('.picker-action').textContent = open
      ? 'Tutup daftar'
      : 'Ganti halaman';
  }
  const stateLabel = (enabled, section = false) =>
    enabled ? 'Aktif' : section ? 'Nonaktif' : 'Under Development';
  const targetValue = (config, pageId, sectionId) =>
    sectionId
      ? config.pages[pageId].sections[sectionId]
      : config.pages[pageId].enabled;
  function sectionReason(pageId, sectionId) {
    if (!draft.pages[pageId].sections[sectionId])
      return 'Tidak dirender. Konten tetap tersimpan.';
    const page = PAGE_BY_ID[pageId];
    if (page.parent && !getPageState(draft, page.parent))
      return `Aktif, tetapi tidak tampil karena ${PAGE_BY_ID[page.parent].label} nonaktif.`;
    if (!getPageState(draft, pageId))
      return 'Preferensi aktif; menunggu halaman diaktifkan.';
    if (!getSectionState(draft, pageId, sectionId))
      return 'Tidak tampil karena semua halaman role nonaktif.';
    return 'Akan ditampilkan.';
  }
  function switchControl(parent, pageId, sectionId) {
    const page = PAGE_BY_ID[pageId],
      checked = targetValue(draft, pageId, sectionId),
      original = targetValue(saved, pageId, sectionId),
      label = el('label', undefined, 'visibility-switch'),
      copy = el('span', undefined, 'switch-copy');
    const text = sectionId
      ? page.sections.find((s) => s.id === sectionId).label
      : 'Halaman aktif';
    copy.append(el('span', text, 'switch-title'));
    const description = el(
      'span',
      sectionId
        ? sectionReason(pageId, sectionId)
        : page.protected
          ? 'Home selalu aktif. Hero dan navigasi dilindungi.'
          : 'Nonaktif menampilkan Page Under Development; konten tidak dihapus.',
      'switch-description',
    );
    description.id = `visibility-${pageId}-${sectionId || 'page'}-description`;
    copy.append(description);
    if (checked !== original)
      copy.append(
        el(
          'span',
          `Belum disimpan: ${stateLabel(original, !!sectionId)} menjadi ${stateLabel(checked, !!sectionId)}.`,
          'switch-description',
        ),
      );
    const input = el('input');
    input.type = 'checkbox';
    input.setAttribute('role', 'switch');
    input.setAttribute('aria-label', `${page.label}: ${text}`);
    input.setAttribute('aria-describedby', description.id);
    input.dataset.pageId = pageId;
    if (sectionId) input.dataset.sectionId = sectionId;
    input.checked = checked;
    input.disabled =
      busy || !!uncertain || !!conflict || (!sectionId && !!page.protected);
    const control = el('span', undefined, 'switch-state');
    control.append(
      input,
      el(
        'span',
        page.protected && !sectionId
          ? 'Terkunci'
          : checked
            ? 'Aktif'
            : 'Nonaktif',
      ),
    );
    label.append(copy, control);
    parent.append(label);
  }
  function renderChoices() {
    const query = $('page-search').value.trim().toLocaleLowerCase('id');
    $('page-list').replaceChildren();
    let found = 0;
    for (const group of groups) {
      const pages = group.pages.filter((p) =>
        `${p.label} ${p.path}`.toLocaleLowerCase('id').includes(query),
      );
      if (!pages.length) continue;
      found += pages.length;
      const disclosure = el('details', undefined, 'page-group');
      disclosure.dataset.group = group.id;
      disclosure.open = !!query || openedGroups.has(group.id);
      disclosure.append(el('summary', `${group.label} (${pages.length})`));
      const list = el('div', undefined, 'page-group-list');
      for (const page of pages) {
        const button = el('button', undefined, 'page-choice');
        button.type = 'button';
        button.dataset.selectPage = page.id;
        if (page.id === selected) button.setAttribute('aria-current', 'page');
        button.setAttribute('aria-controls', 'page-detail');
        button.append(
          el('span', page.label, 'page-choice-title'),
          el(
            'span',
            `${page.sections.length ? `${page.sections.length} section` : 'Halaman saja'}, ${getPageState(saved, page.id) ? 'aktif' : 'nonaktif'}`,
            'page-choice-meta',
          ),
        );
        if (changes().some((c) => c.pageId === page.id))
          button.append(el('span', 'Draft belum disimpan', 'page-choice-meta'));
        list.append(button);
      }
      disclosure.append(list);
      disclosure.addEventListener('toggle', () => {
        if (query) return;
        if (disclosure.open) openedGroups.add(group.id);
        else openedGroups.delete(group.id);
      });
      $('page-list').append(disclosure);
    }
    $('search-empty').hidden = found > 0;
    $('clear-search').hidden = !query;
  }
  function impact(change) {
    const { pageId, sectionId, enabled } = change;
    if (!sectionId) {
      if (pageId === 'recruitment')
        return enabled
          ? 'Recruitment dan halaman anak yang aktif tersedia kembali. Status penerimaan pendaftaran tetap mengikuti pengaturan existing.'
          : 'Recruitment, detail Role dan Application Form menampilkan Under Development. Preferensi halaman anak dan status penerimaan pendaftaran tetap tersimpan.';
      if (
        PAGE_BY_ID[pageId].parent &&
        !getPageState(draft, PAGE_BY_ID[pageId].parent)
      )
        return `Belum tampil karena ${PAGE_BY_ID[PAGE_BY_ID[pageId].parent].label} nonaktif. Preferensi tetap tersimpan.`;
      if (pageId.startsWith('role-'))
        return enabled
          ? 'Halaman role tersedia. Kartunya tampil jika Available Roles aktif.'
          : 'Halaman role menampilkan Under Development; kartunya dihapus dari Available Roles. Section itu tidak tampil bila semua role nonaktif.';
      if (pageId.startsWith('hods-'))
        return enabled
          ? 'Halaman HoDS tersedia. Kartunya tampil jika section Domains aktif.'
          : 'Halaman HoDS menampilkan Under Development; tujuan terkait di daftar domain disaring.';
      return enabled
        ? 'Halaman tersedia dengan preferensi section yang tersimpan. Tombol ke tujuan ini dapat ditampilkan kembali.'
        : 'Kunjungan baru menampilkan Page Under Development. Tombol CTA ke tujuan ini disaring.';
    }
    if (pageId === 'home' && sectionId === 'projects')
      return enabled
        ? 'Our Projects dan tombol Explore di hero Home tersedia kembali.'
        : 'Our Projects tidak dirender dan tombol Explore di hero Home tidak tampil.';
    if (pageId === 'home' && sectionId === 'domains')
      return 'Mengatur section Domains di Home. Status enam halaman detail HoDS tetap independen.';
    if (pageId === 'recruitment' && sectionId === 'available-roles')
      return 'Mengatur daftar role dan tombol menuju section ini. Status halaman detail Role tetap independen; sedikitnya satu role aktif diperlukan untuk menampilkan daftar.';
    if (sectionId === 'who-should-join' && pageId === 'recruitment')
      return 'Tautan kembali dari detail dapat menuju bagian atas Recruitment jika section ini tidak tersedia.';
    return sectionReason(pageId, sectionId);
  }
  function renderSummary() {
    const pending = changes();
    $('change-summary').hidden = !pending.length;
    $('change-list').replaceChildren();
    for (const change of pending) {
      const page = PAGE_BY_ID[change.pageId],
        title =
          page.label +
          (change.sectionId
            ? ` / ${page.sections.find((s) => s.id === change.sectionId).label}`
            : ''),
        item = el('li', undefined, 'change-item');
      item.append(
        el('strong', title),
        el(
          'span',
          `${stateLabel(targetValue(saved, change.pageId, change.sectionId), !!change.sectionId)} menjadi ${stateLabel(change.enabled, !!change.sectionId)}`,
        ),
        el('span', impact(change), 'change-description'),
      );
      $('change-list').append(item);
    }
    $('conflict-state').replaceChildren();
    if (!conflict) return;
    for (const page of VISIBILITY_PAGES) {
      for (const sectionId of [undefined, ...page.sections.map((s) => s.id)]) {
        const old = targetValue(saved, page.id, sectionId),
          latest = targetValue(conflict, page.id, sectionId),
          local = targetValue(draft, page.id, sectionId);
        if (old === latest && old === local) continue;
        const item = el('div', undefined, 'conflict-item');
        item.append(
          el(
            'strong',
            page.label +
              (sectionId
                ? ` / ${page.sections.find((s) => s.id === sectionId).label}`
                : ''),
          ),
          el('span', `Status terbaru: ${stateLabel(latest, !!sectionId)}`),
          el(
            'span',
            old === local
              ? 'Tanpa perubahan draft. Terapkan ulang akan menggunakan status terbaru.'
              : `Draft Anda: ${stateLabel(local, !!sectionId)}`,
          ),
        );
        $('conflict-state').append(item);
      }
    }
  }
  function render() {
    if (!saved || !draft) return;
    const focused = document.activeElement;
    const focusArea = focused?.closest('#page-detail')
      ? '#page-detail'
      : '#page-list';
    const focusSelector = focused?.dataset.pageId
      ? `[data-page-id="${focused.dataset.pageId}"]${focused.dataset.sectionId ? `[data-section-id="${focused.dataset.sectionId}"]` : ':not([data-section-id])'}`
      : focused?.dataset.selectPage
        ? `[data-select-page="${focused.dataset.selectPage}"]`
        : null;
    $('workspace').hidden = false;
    $('bootstrap-reload').hidden = true;
    $('login-form').hidden = true;
    $('selected-page-label').textContent = PAGE_BY_ID[selected].label;
    renderChoices();
    const page = PAGE_BY_ID[selected],
      detail = $('page-detail'),
      heading = el('div', undefined, 'detail-heading'),
      headingCopy = el('div'),
      title = el('h2', page.label);
    title.tabIndex = -1;
    title.id = 'selected-page-title';
    headingCopy.append(title, el('span', page.path, 'page-path'));
    const link = el('a', 'Buka halaman', 'detail-link');
    link.href = page.path;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    heading.append(headingCopy, link);
    detail.replaceChildren(heading);
    const statuses = el('div', undefined, 'page-statuses');
    for (const [label, config] of [
      ['Status tersimpan', saved],
      ['Hasil jika disimpan', draft],
    ]) {
      const item = el('div', undefined, 'page-status-item'),
        enabled = getPageState(config, selected),
        badge = el('span', stateLabel(enabled), 'visibility-badge');
      badge.dataset.active = String(enabled);
      item.append(el('span', label), badge);
      statuses.append(item);
    }
    detail.append(statuses);
    switchControl(detail, selected);
    if (page.parent && !getPageState(draft, page.parent))
      detail.append(
        el(
          'p',
          `Tidak tampil karena ${PAGE_BY_ID[page.parent].label} nonaktif. Preferensi halaman ini tetap tersimpan.`,
          'detail-notice',
        ),
      );
    if (!getPageState(draft, selected) && page.sections.length)
      detail.append(
        el(
          'p',
          'Halaman ini nonaktif. Anda tetap dapat mengatur section; hasilnya tampil ketika halaman diaktifkan.',
          'detail-notice',
        ),
      );
    if (page.sections.length) {
      const sectionHeading = el('div', undefined, 'section-heading');
      sectionHeading.append(
        el('h3', `Section ${page.label}`),
        el(
          'p',
          `${page.sections.length} bagian dapat diatur secara terpisah. Menonaktifkan section tidak menghapus konten.`,
        ),
      );
      detail.append(sectionHeading);
      const list = el('div', undefined, 'section-list');
      for (const section of page.sections)
        switchControl(list, selected, section.id);
      detail.append(list);
    } else {
      const text =
        selected === 'contact'
          ? 'Contact memiliki satu komposisi. Atur visibilitas halaman secara utuh; kartu kontak tidak memiliki switch terpisah.'
          : selected === 'recruitment-apply'
            ? 'Application Form dikelola sebagai satu halaman. Pertanyaan dan bagian form tidak memiliki switch terpisah.'
            : 'Halaman detail dikelola sebagai satu komposisi. Bagian internal tidak memiliki switch terpisah.';
      detail.append(el('p', text, 'detail-notice'));
    }
    if (selected === 'recruitment')
      detail.append(
        el(
          'p',
          'Available Roles memerlukan sedikitnya satu halaman role aktif. Mematikan daftar ini tidak mematikan URL detail Role.',
          'detail-notice',
        ),
      );
    renderSummary();
    const count = changes().length;
    root.classList.toggle('has-pending', count > 0 || !!uncertain || busy);
    $('pending-count').textContent = count
      ? `${count} perubahan belum disimpan.`
      : 'Semua perubahan tersimpan.';
    for (const id of [
      'save',
      'cancel',
      'reload',
      'logout',
      'retry',
      'conflict-reload',
      'conflict-reapply',
    ]) {
      const disabled =
        busy ||
        ((id === 'save' || id === 'cancel') &&
          (!count || !!uncertain || !!conflict)) ||
        (id === 'reload' && !!uncertain);
      $(id).disabled = disabled;
      $(id).setAttribute('aria-disabled', String(disabled));
      $(id).dataset.sfx = disabled ? 'error' : 'click';
    }
    $('save').classList.toggle('is-loading', busy);
    $('save').textContent = busy ? 'Memproses…' : 'Simpan perubahan';
    $('workspace').setAttribute('aria-busy', String(busy));
    $('conflict').hidden = !conflict;
    $('uncertain').hidden = !uncertain;
    if (focusSelector) {
      const replacement = root.querySelector(focusArea + ' ' + focusSelector);
      if (replacement && !replacement.disabled)
        replacement.focus({ preventScroll: true });
    }
  }
  async function load() {
    if (busy || uncertain) return;
    if (
      changes().length &&
      !confirm('Muat ulang dan abaikan draft yang belum disimpan?')
    )
      return;
    const mine = ++generation;
    readController?.abort();
    readController = new AbortController();
    busy = true;
    render();
    message('Memuat Pages & Sections…');
    const r = await send('/api/admin/site-visibility', {
      signal: readController.signal,
      deadline: 15000,
    });
    if (mine !== generation) return;
    busy = false;
    if ([401, 403].includes(r.response?.status)) {
      expireSession();
      return;
    }
    try {
      if (!r.response?.ok || !r.result?.ok) throw new Error();
      saved = validateVisibility(r.result.data);
      draft = structuredClone(saved);
      csrf = r.result.csrf;
      $('review-notice').hidden =
        r.response.headers.get('x-local-review-fixture') !== '1';
      conflict = undefined;
      message('Pengaturan terbaru dimuat.');
    } catch {
      message('Pengaturan belum bisa dimuat. Muat ulang untuk mencoba lagi.');
    }
    render();
  }
  async function save(retry = false) {
    if (busy || conflict || (!retry && !changes().length)) return;
    if (!retry)
      uncertain = {
        operation: 'save',
        payload: {
          expectedRevision: saved.revision,
          requestId: crypto.randomUUID(),
          changes: changes(),
        },
      };
    if (!uncertain) return;
    const body = JSON.stringify(uncertain),
      mine = ++generation;
    readController?.abort();
    busy = true;
    render();
    message('Menyimpan perubahan…');
    const r = await send('/api/admin/site-visibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
      body,
      deadline: 20000,
    });
    if (mine !== generation) return;
    busy = false;
    if ([401, 403].includes(r.response?.status)) {
      expireSession();
      return;
    }
    if (!r.response || r.malformed || r.response.status >= 500) {
      message('Hasil simpan belum diketahui. Ulangi permintaan yang sama.');
      render();
      return;
    }
    if (r.response.status === 409) {
      uncertain = undefined;
      if (r.result.data) {
        try {
          conflict = validateVisibility(r.result.data);
          message(
            'Konflik pengaturan. Tinjau status terbaru; draft tetap tersedia.',
          );
        } catch {
          message('Status konflik belum bisa dibaca. Muat ulang.');
        }
      } else
        message(
          'Permintaan ditolak: ' +
            (r.result.error?.code || 'CONFLICT') +
            '. Muat ulang sebelum mencoba lagi.',
        );
      render();
      return;
    }
    if (!r.response.ok || !r.result.ok) {
      uncertain = undefined;
      message('Perubahan belum disimpan. Periksa pengaturan.');
      render();
      return;
    }
    try {
      saved = validateVisibility(r.result.data);
      draft = structuredClone(saved);
      csrf = r.result.csrf;
      uncertain = undefined;
      message(
        'Perubahan tersimpan. Berlaku pada kunjungan atau refresh berikutnya.',
      );
      toast(
        'Perubahan tersimpan. Berlaku pada kunjungan atau refresh berikutnya.',
      );
    } catch {
      message('Hasil simpan belum diketahui. Ulangi permintaan yang sama.');
    }
    render();
  }
  root.addEventListener(
    'change',
    (e) => {
      const input = e.target;
      if (!input.dataset.pageId || busy || uncertain || conflict) return;
      const state = draft.pages[input.dataset.pageId];
      if (input.dataset.sectionId)
        state.sections[input.dataset.sectionId] = input.checked;
      else if (input.dataset.pageId !== 'home') state.enabled = input.checked;
      render();
    },
    { signal: listeners.signal },
  );
  root.addEventListener(
    'click',
    (e) => {
      const b = e.target.closest('[data-select-page]');
      if (b) {
        selected = b.dataset.selectPage;
        const group = groups.find((g) =>
          g.pages.some((p) => p.id === selected),
        );
        openedGroups.add(group.id);
        setPickerOpen(false);
        render();
        if (matchMedia('(max-width: 1023px)').matches) {
          $('selected-page-title').focus({ preventScroll: true });
          $('selected-page-title').scrollIntoView({
            block: 'start',
            behavior: 'instant',
          });
        }
      }
    },
    { signal: listeners.signal },
  );
  const click = (id, fn) =>
    $(id).addEventListener('click', fn, { signal: listeners.signal });
  click('page-picker-toggle', () => {
    const open = !root.classList.contains('picker-open');
    setPickerOpen(open);
    if (open) {
      $('page-search').focus({ preventScroll: true });
      $('page-search').select();
    }
  });
  $('page-search').addEventListener('input', renderChoices, {
    signal: listeners.signal,
  });
  click('clear-search', () => {
    $('page-search').value = '';
    renderChoices();
    $('page-search').focus();
  });
  click('bootstrap-reload', load);
  click('save', () => save());
  click('retry', () => save(true));
  click('reload', load);
  click('cancel', () => {
    if (busy || uncertain) return;
    draft = structuredClone(saved);
    conflict = undefined;
    render();
    message('Draft dibatalkan.');
  });
  click('conflict-reload', () => {
    saved = conflict;
    draft = structuredClone(saved);
    conflict = undefined;
    render();
    message('Status terbaru digunakan.');
  });
  click('conflict-reapply', () => {
    const local = changes();
    saved = conflict;
    draft = structuredClone(saved);
    for (const c of local) {
      if (c.sectionId) draft.pages[c.pageId].sections[c.sectionId] = c.enabled;
      else draft.pages[c.pageId].enabled = c.enabled;
    }
    conflict = undefined;
    render();
    message('Draft diterapkan pada status terbaru. Tinjau lalu simpan.');
  });
  click('logout', async () => {
    if (
      busy ||
      ((changes().length || uncertain) &&
        !confirm(
          'Keluar dan abaikan draft? Hasil simpan yang belum diketahui tetap bisa sudah tersimpan.',
        ))
    )
      return;
    busy = true;
    render();
    const r = await send('/api/admin/auth/logout', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrf },
      deadline: 15000,
    });
    busy = false;
    if (r.response?.ok) {
      document.dispatchEvent(new CustomEvent('ds:admin-session-ended'));
      expireSession();
    } else {
      message('Belum bisa keluar. Coba lagi.');
      render();
    }
  });
  $('login-form').addEventListener(
    'submit',
    async (e) => {
      e.preventDefault();
      if (busy) return;
      busy = true;
      $('login-submit').disabled = true;
      const password = $('login-password').value;
      $('login-password').value = '';
      const r = await send('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: $('login-email').value.trim(),
          password,
        }),
        deadline: 15000,
      });
      busy = false;
      $('login-submit').disabled = false;
      if (r.response?.ok && r.result.ok) {
        await initialRead;
        await load();
        document.dispatchEvent(
          new CustomEvent('ds:admin-session-started', {
            detail: { panel: root.id },
          }),
        );
      } else message('Login belum berhasil. Periksa akun owner.');
    },
    { signal: listeners.signal },
  );
  document.addEventListener('ds:admin-session-ended', expireSession, {
    signal: listeners.signal,
  });
  let initialRead;
  const ensureSession = createSessionResumer(root, {
    initialRead: () => initialRead,
    load,
    isDirty: () => busy || !!uncertain || changes().length > 0,
  });
  const instance = {
    ensureSession,
    isDirty: () => busy || !!uncertain || changes().length > 0,
    load,
    expireSession,
    teardown: () => {
      expireSession();
      listeners.abort();
      clearTimeout(toastTimer);
      instances.delete(root.id);
    },
    _root: root,
  };
  instances.set(root.id, instance);
  initialRead = load();
  return instance;
}
