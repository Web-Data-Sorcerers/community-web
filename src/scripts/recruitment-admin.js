import {
  STATUSES,
  TRANSITIONS,
  TERMINAL,
} from '../../server/recruitment-review-status.mjs';
import {
  createTransport,
  createSlowNotice,
  READ_DEADLINE_MS,
} from './admin-request.js';
(() => {
  const send = createTransport();
  const byId = (id) => document.getElementById(id);
  const api = '/api/admin/recruitment/';
  const create = (tag, text, cls) => {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (cls) el.className = cls;
    return el;
  };
  const date = (iso) =>
    iso
      ? new Date(iso).toLocaleString('id-ID', {
          timeZone: 'Asia/Jakarta',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) + ' WIB'
      : '—';
  const errors = {
    UNAUTHORIZED: 'Sesi admin berakhir. Silakan masuk lagi.',
    FORBIDDEN: 'Akun ini belum memiliki izin melihat pendaftar.',
    INVALID_INPUT: 'Periksa input dan batas karakter.',
    NOT_FOUND: 'Data tidak ditemukan.',
    SERVER_ERROR: 'Data belum bisa dimuat. Coba muat ulang.',
    CONFIGURATION: 'Konfigurasi server belum lengkap.',
    ID_CONFLICT:
      'ID kiriman sudah dipakai untuk perubahan lain. Muat detail terbaru.',
    INVALID_TRANSITION: 'Perpindahan status tidak diizinkan.',
    BODY_TOO_LARGE: 'Kiriman terlalu besar.',
  };
  let csrf,
    session = 0,
    listGeneration = 0,
    detailGeneration = 0,
    refreshTimer;
  let current = null,
    offset = 0,
    asOf,
    activeFilters = {},
    filtered = 0,
    mutationPending = null,
    saving = false,
    revisionPending = false;
  const pages = { notes: 0, history: 0 };
  const generations = { notes: 0, history: 0 };
  const reads = new Map();
  const readSignal = (kind) => {
    reads.get(kind)?.abort();
    const controller = new AbortController();
    reads.set(kind, controller);
    return controller.signal;
  };
  const abortReads = () => {
    for (const controller of reads.values()) controller.abort();
    reads.clear();
  };
  const message = (s, bad = false) => {
    byId('status').textContent = s;
    byId('status').dataset.error = String(bad);
  };
  const armSlow = createSlowNotice((text) => message(text));
  const feedback = (s) => {
    byId('review-feedback').textContent = s;
    byId('review-feedback').focus();
  };
  const dirty = () =>
    Boolean(
      byId('review-note').value.trim() ||
      byId('review-reason').value.trim() ||
      byId('review-status').value ||
      mutationPending,
    );
  const mayLeave = () =>
    !saving &&
    (!dirty() ||
      confirm(
        'Ada draft atau kiriman belum dikonfirmasi. Tinggalkan detail? Periksa aktivitas sebelum mengirim ulang.',
      ));
  function clearDetail() {
    current = null;
    mutationPending = null;
    revisionPending = false;
    detailGeneration++;
    abortReads();
    for (const k of ['notes', 'history']) {
      generations[k]++;
      pages[k] = 0;
    }
    for (const id of [
      'detail-panel',
      'detail-summary',
      'notes-list',
      'history-list',
    ])
      byId(id).replaceChildren();
    for (const id of ['review-note', 'review-reason', 'review-status'])
      byId(id).value = '';
    byId('confirm-status').checked = false;
    byId('confirm-label').textContent = '';
    byId('decision-confirm').hidden = true;
    byId('retry-mutation').hidden = true;
    byId('review-feedback').textContent = '';
    byId('review-meta').textContent = '';
    byId('detail-area').hidden = true;
    for (const id of ['filter-form', 'stats', 'stats-scope', 'intake-status'])
      byId(id).hidden = false;
  }
  function endSession(code = 'UNAUTHORIZED') {
    session++;
    listGeneration++;
    clearDetail();
    if (code !== 'FORBIDDEN') csrf = undefined;
    saving = false;
    byId('workspace').hidden = true;
    byId('applications-body').replaceChildren();
    byId('stats').replaceChildren();
    for (const id of [
      'search',
      'filter-since',
      'filter-until',
      'filter-status',
      'filter-hods',
    ])
      byId(id).value = '';
    byId('login-password').value = '';
    byId('login-email').value = '';
    byId('login-form').hidden = code === 'FORBIDDEN';
    byId('logout').hidden = code !== 'FORBIDDEN';
    byId('login-submit').disabled = false;
    message(errors[code], true);
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  function loggedIn() {
    byId('workspace').hidden = false;
    byId('login-form').hidden = true;
    byId('logout').hidden = false;
    if (!refreshTimer) refreshTimer = setInterval(refresh, 30 * 60 * 1000);
  }
  const READ_KINDS = new Set(['list', 'stats', 'detail', 'notes', 'history']);
  async function request(route, input, post = false, kind = route) {
    const gen = session;
    const url = new URL(api + route, location.origin);
    if (!post)
      for (const [k, v] of Object.entries(input || {}))
        url.searchParams.set(k, v);
    const read = READ_KINDS.has(kind);
    const outcome = await send(url, {
      method: post ? 'POST' : 'GET',
      headers: post
        ? { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf || '' }
        : {},
      body: post ? JSON.stringify(input) : undefined,
      signal: read ? readSignal(kind) : undefined,
      deadline: read ? READ_DEADLINE_MS : undefined,
    });
    if (gen !== session) return null;
    if (outcome.cancelled) return { cancelled: true };
    if (outcome.timeout)
      return { ok: false, error: { code: 'TIMEOUT' }, http: 0, timeout: true };
    if (outcome.network)
      return { ok: false, error: { code: 'NETWORK' }, http: 0 };
    if (outcome.malformed)
      return { ok: false, error: { code: 'MALFORMED' }, http: 0 };
    const r = outcome.response;
    const result = outcome.result;
    if (r.status === 401 || r.status === 403) {
      if (r.status === 403 && result.csrf) csrf = result.csrf;
      endSession(r.status === 403 ? 'FORBIDDEN' : 'UNAUTHORIZED');
      return null;
    }
    if (result.csrf) csrf = result.csrf;
    if (result.ok) loggedIn();
    return { ...result, http: r.status };
  }
  function renderStats(stats) {
    const counts = Object.fromEntries(
      stats.by_status.map((x) => [x.status, x.count]),
    );
    const cards = [
      ['Total seluruh pendaftar', stats.total_global],
      ['Hasil filter', stats.filtered],
      ['Baru', counts.new],
      ['Proses', counts.reviewing + counts.shortlisted + counts.interview],
      ['Daftar tunggu', counts.waitlisted],
      ['Diterima', counts.accepted],
      ['Ditolak', counts.rejected],
      ['Mundur', counts.withdrawn],
    ];
    byId('stats').replaceChildren(
      ...cards.map(([label, value]) => {
        const card = create('div', undefined, 'stat-card');
        card.append(
          create('span', String(value), 'number'),
          create('span', label, 'label'),
        );
        return card;
      }),
    );
    byId('stats-scope').textContent =
      'Ringkasan mengikuti filter: ' +
      stats.by_hods.map((x) => x.hods + ' ' + x.count).join(', ') +
      '. Tanggal WIB. Status dapat berubah saat reviewer lain menyimpan.';
  }
  function readFilters() {
    const f = {};
    for (const [id, key] of [
      ['search', 'search'],
      ['filter-hods', 'primary_hods'],
      ['filter-status', 'status'],
      ['filter-since', 'since'],
      ['filter-until', 'until'],
      ['filter-sort', 'sort'],
    ])
      if (byId(id).value) f[key] = byId(id).value;
    return f;
  }
  async function loadList(reset = false, bootstrap = false) {
    if (current && !mayLeave()) return;
    if (current) clearDetail();
    const gen = ++listGeneration;
    if (reset) {
      offset = 0;
      asOf = undefined;
      activeFilters = readFilters();
    }
    const input = {
      ...activeFilters,
      limit: 50,
      offset,
      ...(asOf ? { as_of: asOf } : {}),
    };
    byId('table-wrapper').hidden = false;
    byId('table-wrapper').setAttribute('aria-busy', 'true');
    byId('pagination').hidden = true;
    byId('list-error').textContent = '';
    const placeholder = create('tr');
    const placeholderCell = create('td', 'Memuat pendaftar…');
    placeholderCell.colSpan = 6;
    placeholder.append(placeholderCell);
    byId('applications-body').replaceChildren(placeholder);
    const doneSlow = armSlow('Memuat daftar…');
    // Bootstrap uses GET so a restored sealed session yields validated CSRF
    // before the protected list/stats POSTs (no CSRF-guessing request).
    const result = await request('applications', input, !bootstrap, 'list');
    if (gen !== listGeneration || !result || result.cancelled) return;
    if (!result.ok) {
      doneSlow();
      byId('table-wrapper').setAttribute('aria-busy', 'false');
      byId('list-error').textContent =
        errors[result.error?.code] ||
        (result.timeout
          ? 'Data belum bisa dimuat. Coba lagi.'
          : 'Koneksi terputus. Muat ulang daftar.');
      return;
    }
    const data = result.data;
    asOf = data.as_of;
    filtered = data.filtered;
    if (!data.applications.length && offset > 0) {
      offset = Math.max(0, Math.ceil(filtered / 50 - 1) * 50);
      asOf = undefined;
      doneSlow();
      return loadList();
    }
    byId('applications-body').replaceChildren();
    if (!data.applications.length) {
      const row = create('tr'),
        cell = create(
          'td',
          data.total_global === 0
            ? 'Belum ada pendaftar.'
            : 'Tidak ada pendaftar yang cocok. Reset filter untuk melihat lainnya.',
        );
      cell.colSpan = 6;
      row.append(cell);
      byId('applications-body').append(row);
    }
    for (const a of data.applications) {
      const row = create('tr');
      const name = create('td'),
        button = create(
          'button',
          a.full_name || 'Lihat detail',
          'applicant-detail',
        );
      button.type = 'button';
      button.addEventListener('click', () => loadDetail(a.receipt));
      name.append(button);
      row.append(
        name,
        ...[
          a.email || '—',
          a.primary_hods || '—',
          date(a.received_at),
          STATUSES[a.review.status],
          String(a.review.note_count),
        ].map((x) => create('td', x)),
      );
      byId('applications-body').append(row);
    }
    byId('page-info').textContent =
      `Halaman ${Math.floor(offset / 50) + 1} dari ${Math.max(1, Math.ceil(filtered / 50))}`;
    byId('pagination').hidden = false;
    byId('prev-page').disabled = offset === 0;
    byId('next-page').disabled = !data.has_more;
    byId('table-wrapper').setAttribute('aria-busy', 'false');
    doneSlow();
    message(`${filtered} dari ${data.total_global} pendaftar`);
    // Secondary statistics must not gate the list: paint the table first,
    // then load filtered stats with the list snapshot as_of.
    byId('stats').replaceChildren();
    byId('stats').setAttribute('aria-busy', 'true');
    byId('stats-scope').textContent = 'Memuat ringkasan…';
    const sr = await request(
      'stats',
      { ...activeFilters, as_of: asOf },
      true,
      'stats',
    );
    if (gen !== listGeneration || !sr || sr.cancelled) return;
    byId('stats').setAttribute('aria-busy', 'false');
    if (sr.ok) renderStats(sr.data);
    else {
      byId('stats').replaceChildren();
      byId('stats-scope').textContent =
        'Statistik belum bisa dimuat. Muat ulang daftar.';
    }
  }
  const labels = {
    full_name: 'Nama lengkap',
    preferred_name: 'Nama panggilan',
    email: 'Email',
    whatsapp: 'WhatsApp',
    institution: 'Institusi',
    city_region: 'Kota / wilayah',
    current_status: 'Status saat ini',
    current_level: 'Tingkat pengalaman',
    currently_exploring: 'Sedang dipelajari',
    primary_hods: 'Domain utama',
    secondary_interest: 'Minat lain',
    most_relevant_work: 'Karya paling relevan',
    portfolio_link: 'Tautan portofolio',
    alternative_evidence: 'Bukti karya alternatif',
    real_world_problem: 'Masalah yang ingin diselesaikan',
    technology_approach: 'Pendekatan teknologi',
    explore_or_build: 'Eksplorasi atau membangun',
    skill_to_improve: 'Kemampuan yang ingin ditingkatkan',
    six_months_goal: 'Target enam bulan',
    team_story: 'Pengalaman bekerja dalam tim',
    why_join: 'Alasan bergabung',
    what_to_contribute: 'Kontribusi yang ditawarkan',
    what_to_build_together: 'Yang ingin dibangun bersama',
    learning_methods: 'Cara belajar',
    project_experience: 'Pengalaman project',
    desired_output: 'Hasil yang diinginkan',
    team_comfort: 'Kenyamanan dalam tim',
    team_roles: 'Peran dalam tim',
    time_commitment: 'Komitmen waktu',
    contribution_types: 'Jenis kontribusi',
    cross_hods_willingness: 'Kolaborasi lintas domain',
    best_description: 'Deskripsi diri',
    independent_learning: 'Belajar mandiri',
    agreement_1: 'Persetujuan 1',
    agreement_2: 'Persetujuan 2',
    agreement_3: 'Persetujuan 3',
    specific_area: 'Bidang spesifik',
    foundation_skills: 'Kemampuan dasar',
  };
  function renderDetail(data, preserve = false) {
    const draft = preserve
      ? {
          status: byId('review-status').value,
          reason: byId('review-reason').value,
          note: byId('review-note').value,
        }
      : null;
    current = data;
    byId('detail-area').hidden = false;
    for (const id of ['filter-form', 'stats', 'stats-scope', 'intake-status'])
      byId(id).hidden = true;
    byId('table-wrapper').hidden = true;
    byId('pagination').hidden = true;
    byId('detail-summary').replaceChildren(
      create('strong', data.fields.full_name || 'Pendaftar'),
      create(
        'p',
        `${data.fields.email || ''} · ${data.fields.primary_hods || ''}`,
      ),
      create('p', `Diterima ${date(data.received_at)} · Resi ${data.receipt}`),
    );
    byId('review-meta').textContent =
      `${STATUSES[data.review.status]} · Revisi ${data.review.version} · ${data.review.reviewer_label || 'Belum ditinjau'} · ${date(data.review.updated_at)}`;
    const select = byId('review-status');
    select.replaceChildren();
    const blank = create('option', 'Pilih status tujuan');
    blank.value = '';
    select.append(blank);
    for (const s of TRANSITIONS[data.review.status]) {
      const opt = create('option', STATUSES[s]);
      opt.value = s;
      select.append(opt);
    }
    if (draft) {
      if (
        draft.status &&
        !TRANSITIONS[data.review.status].includes(draft.status)
      ) {
        const opt = create(
          'option',
          STATUSES[draft.status] + ' (tidak diizinkan dari status terbaru)',
        );
        opt.value = draft.status;
        select.append(opt);
      }
      select.value = draft.status;
      byId('review-reason').value = draft.reason;
      byId('review-note').value = draft.note;
    } else {
      byId('review-reason').value = '';
      byId('review-note').value = '';
    }
    byId('confirm-status').checked = false;
    confirmation();
    byId('detail-panel').replaceChildren();
    for (const [key, value] of Object.entries(data.fields)) {
      if (value === null || value === undefined || value === '') continue;
      const field = create('div', undefined, 'field');
      field.append(
        create('div', labels[key] || key.replaceAll('_', ' '), 'field-label'),
        create('div', Array.isArray(value) ? value.join(', ') : String(value)),
      );
      byId('detail-panel').append(field);
    }
    noteCount();
    controls();
  }
  function confirmation() {
    if (!current) return;
    const to = byId('review-status').value;
    const needed =
      TERMINAL.includes(to) || TERMINAL.includes(current.review.status);
    byId('decision-confirm').hidden = !to || !needed;
    byId('confirm-label').textContent =
      `Saya mengonfirmasi ${current.fields.full_name || 'pendaftar'} → ${STATUSES[to] || ''}. Riwayat keputusan tetap tersimpan.`;
  }
  async function loadDetail(receipt, preserve = false) {
    if (!preserve && current && !mayLeave()) return;
    if (!preserve) clearDetail();
    const gen = ++detailGeneration;
    listGeneration++;
    byId('notes-list').textContent = 'Memuat catatan…';
    byId('history-list').textContent = 'Memuat aktivitas…';
    const doneSlow = armSlow('Memuat detail…');
    const result = await request('application', { receipt }, false, 'detail');
    if (gen !== detailGeneration || !result || result.cancelled) return;
    if (!result.ok) {
      doneSlow();
      message(
        result.timeout
          ? 'Data belum bisa dimuat. Coba lagi.'
          : errors[result.error?.code] || errors.SERVER_ERROR,
        true,
      );
      byId('notes-list').textContent =
        'Detail belum bisa dimuat. Coba muat detail terbaru.';
      byId('history-list').textContent =
        'Detail belum bisa dimuat. Coba muat detail terbaru.';
      return false;
    }
    renderDetail(result.data, preserve);
    if (!preserve) byId('detail-heading').focus();
    doneSlow();
    message('Detail pendaftar: ' + (result.data.fields.full_name || ''));
    // Detail is usable now; notes and history load independently.
    await Promise.all([loadHistory('notes'), loadHistory('history')]);
    return true;
  }
  async function loadHistory(kind) {
    if (!current) return;
    const gen = ++generations[kind],
      id = current.receipt,
      dgen = detailGeneration;
    byId(kind + '-list').textContent =
      kind === 'notes' ? 'Memuat catatan…' : 'Memuat aktivitas…';
    const result = await request(
      kind,
      {
        receipt: id,
        limit: 20,
        offset: pages[kind],
      },
      false,
      kind,
    );
    if (
      gen !== generations[kind] ||
      dgen !== detailGeneration ||
      current?.receipt !== id ||
      !result ||
      result.cancelled
    )
      return;
    const container = byId(kind + '-list');
    container.replaceChildren();
    if (!result.ok) {
      container.textContent = result.timeout
        ? 'Panel ini belum bisa dimuat. Coba lagi.'
        : errors[result.error?.code] ||
          'Gagal memuat. Klik Muat detail terbaru untuk mencoba lagi.';
      return;
    }
    const d = result.data;
    if (!d.items.length && pages[kind] > 0) {
      pages[kind] = Math.max(0, pages[kind] - 20);
      return loadHistory(kind);
    }
    if (!d.items.length)
      container.textContent =
        kind === 'notes'
          ? 'Belum ada catatan internal.'
          : 'Belum ada aktivitas review.';
    for (const item of d.items) {
      const field = create('div', undefined, 'field');
      if (kind === 'notes')
        field.append(
          create('strong', item.author_label || 'Reviewer'),
          create('p', date(item.created_at)),
          create('div', item.body),
        );
      else
        field.append(
          create(
            'strong',
            item.action === 'note_added'
              ? 'Catatan ditambahkan'
              : `${STATUSES[item.from_status]} → ${STATUSES[item.to_status]}`,
          ),
          create(
            'p',
            `${item.actor_label} · ${date(item.created_at)} · Revisi ${item.before_version} → ${item.after_version}`,
          ),
          create('div', item.reason || ''),
        );
      container.append(field);
    }
    byId(kind + '-prev').disabled = pages[kind] === 0;
    byId(kind + '-next').disabled = !d.has_more;
    byId(kind + '-page').textContent =
      `${d.total} ${kind === 'notes' ? 'catatan' : 'aktivitas'} · halaman ${Math.floor(pages[kind] / 20) + 1}`;
  }
  function controls() {
    const locked = saving || revisionPending || Boolean(mutationPending);
    for (const id of [
      'save-status',
      'save-note',
      'review-status',
      'review-reason',
      'review-note',
      'confirm-status',
    ])
      byId(id).disabled = locked;
    byId('retry-mutation').disabled = saving || revisionPending;
    byId('retry-mutation').hidden = !mutationPending;
    byId('back-list').disabled = locked;
    byId('reload-detail').disabled = saving || revisionPending;
  }
  function noteCount() {
    byId('note-help').textContent =
      `${[...byId('review-note').value.trim()].length}/4000 karakter. Maksimum 16 KiB. Catatan hanya tersimpan setelah Tambah catatan.`;
  }
  const normalize = (s) => s.replace(/\r\n?/g, '\n').trim();
  function validText(s, min, max) {
    return (
      [...s].length >= min &&
      [...s].length <= max &&
      new TextEncoder().encode(s).length <= 16384 &&
      !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(s)
    );
  }
  async function submit(kind) {
    if (saving || revisionPending || mutationPending || !current) return;
    const body = {
      receipt: current.receipt,
      request_id: crypto.randomUUID(),
      expected_version: current.review.version,
    };
    if (kind === 'status') {
      body.status = byId('review-status').value;
      body.reason = normalize(byId('review-reason').value);
      const terminal =
        TERMINAL.includes(body.status) ||
        TERMINAL.includes(current.review.status);
      if (
        !TRANSITIONS[current.review.status].includes(body.status) ||
        !validText(body.reason, terminal ? 10 : 0, 500)
      ) {
        feedback(
          'Pilih perpindahan yang diizinkan dan periksa panjang alasan.',
        );
        return;
      }
      if (terminal && !byId('confirm-status').checked) {
        feedback('Konfirmasikan keputusan sebelum menyimpan.');
        byId('confirm-status').focus();
        return;
      }
    } else {
      body.body = normalize(byId('review-note').value);
      if (!validText(body.body, 1, 4000)) {
        feedback(
          'Catatan wajib 1–4000 karakter, maksimum 16 KiB, tanpa karakter kontrol.',
        );
        return;
      }
    }
    mutationPending = { kind, body };
    await sendMutation();
  }
  async function sendMutation() {
    if (saving || !mutationPending || !current) return;
    const intent = mutationPending,
      id = current.receipt,
      gen = detailGeneration,
      sg = session;
    saving = true;
    controls();
    feedback('Menyimpan…');
    try {
      const r = await request(
        intent.kind === 'status' ? 'review-status' : 'review-note',
        intent.body,
        true,
        'write',
      );
      if (gen !== detailGeneration || sg !== session || !r) return;
      if (r.ok) {
        const replayed = Boolean(r.data?.replayed);
        mutationPending = null;
        if (intent.kind === 'note') byId('review-note').value = '';
        else {
          byId('review-status').value = '';
          byId('review-reason').value = '';
        }
        // Acknowledge the authoritative write result immediately; list/stats
        // and notes/history reconciliation continue in the background.
        feedback(
          replayed
            ? 'Kiriman yang sama sudah tersimpan. Tidak ada duplikasi.'
            : 'Perubahan tersimpan.',
        );
        revisionPending = true;
        controls();
        void reconcile(id, sg);
        return;
      } else if (r.http === 409) {
        mutationPending = null;
        const refreshed = await loadDetail(id, true);
        if (!refreshed) {
          if (current)
            feedback(
              'Konflik: detail terbaru belum bisa dimuat. Draft tetap ada. Muat detail sebelum mengirim ulang.',
            );
          return;
        }
        feedback(
          r.error.code === 'CONFLICT'
            ? 'Konflik: reviewer lain sudah menyimpan. Draft tetap ada. Tinjau data terbaru sebelum menyimpan sebagai kiriman baru.'
            : errors[r.error.code] ||
                'Konflik kiriman. Tinjau aktivitas sebelum mencoba lagi.',
        );
      } else if (r.http >= 400 && r.http < 500) {
        mutationPending = null;
        feedback(errors[r.error.code] || 'Kiriman ditolak. Periksa input.');
      } else {
        feedback(
          'Kiriman belum dikonfirmasi. Periksa detail terbaru atau coba kiriman yang sama. Draft dan ID kiriman dipertahankan.',
        );
      }
    } finally {
      if (sg === session) {
        saving = false;
        controls();
      }
    }
  }
  async function reconcile(id, sg) {
    try {
      const refreshed = await loadDetail(id, true);
      if (sg !== session) return;
      if (!refreshed && current)
        feedback(
          'Perubahan tersimpan. Detail terbaru belum bisa dimuat; muat detail sebelum perubahan berikutnya.',
        );
      asOf = undefined;
      offset = 0;
      const lr = await request(
        'applications',
        { ...activeFilters, limit: 50, offset: 0 },
        true,
        'list',
      );
      if (sg !== session || current?.receipt !== id) return;
      if (lr?.ok) {
        asOf = lr.data.as_of;
        filtered = lr.data.filtered;
        const st = await request(
          'stats',
          { ...activeFilters, as_of: asOf },
          true,
          'stats',
        );
        if (sg === session && st?.ok) renderStats(st.data);
      }
    } finally {
      if (sg === session) {
        revisionPending = false;
        controls();
      }
    }
  }
  async function refresh() {
    const gen = session;
    try {
      const r = await fetch('/api/admin/auth/refresh', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'X-CSRF-Token': csrf || '' },
      });
      if (gen !== session) return;
      if (r.status === 401 || r.status === 403) {
        endSession(r.status === 403 ? 'FORBIDDEN' : 'UNAUTHORIZED');
        return;
      }
      const d = await r.json();
      if (gen === session && d.csrf) csrf = d.csrf;
    } catch {
      /* Retry only explicit read; no automatic mutation retry. */
    }
  }
  async function bootstrap() {
    // The first private read validates the restored sealed session and yields
    // CSRF; the table paints before the filtered-statistics request.
    await loadList(true, true);
  }
  function init() {
    for (const [id, entries] of [
      [
        'filter-hods',
        ['data', 'core', 'language', 'vision', 'product', 'growth'].map((x) => [
          x,
          x,
        ]),
      ],
      ['filter-status', Object.entries(STATUSES)],
    ])
      for (const [value, label] of entries) {
        const o = create('option', label);
        o.value = value;
        byId(id).append(o);
      }
    byId('filter-form').addEventListener('submit', (e) => {
      e.preventDefault();
      loadList(true);
    });
    byId('reset-filter').addEventListener('click', () => {
      if (current && !mayLeave()) return;
      clearDetail();
      byId('filter-form').reset();
      loadList(true);
    });
    byId('reload-list').addEventListener('click', () => loadList(true));
    byId('prev-page').addEventListener('click', () => {
      offset = Math.max(0, offset - 50);
      loadList();
    });
    byId('next-page').addEventListener('click', () => {
      offset += 50;
      loadList();
    });
    byId('back-list').addEventListener('click', () => {
      if (!mayLeave()) return;
      clearDetail();
      loadList();
    });
    byId('review-status').addEventListener('change', () => {
      byId('confirm-status').checked = false;
      confirmation();
    });
    byId('review-note').addEventListener('input', noteCount);
    byId('status-form').addEventListener('submit', (e) => {
      e.preventDefault();
      submit('status');
    });
    byId('note-form').addEventListener('submit', (e) => {
      e.preventDefault();
      submit('note');
    });
    byId('retry-mutation').addEventListener('click', sendMutation);
    byId('reload-detail').addEventListener('click', () => {
      if (current && !saving) loadDetail(current.receipt, true);
    });
    for (const kind of ['notes', 'history'])
      for (const dir of ['prev', 'next'])
        byId(kind + '-' + dir).addEventListener('click', () => {
          pages[kind] = Math.max(0, pages[kind] + (dir === 'next' ? 20 : -20));
          loadHistory(kind);
        });
    document
      .querySelectorAll('.admin-navigation a, .auth-links a')
      .forEach((a) =>
        a.addEventListener('click', (e) => {
          if (current && !mayLeave()) e.preventDefault();
        }),
      );
    window.addEventListener('beforeunload', (e) => {
      if (current && dirty()) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
    byId('logout').addEventListener('click', async () => {
      const gen = session;
      try {
        const r = await fetch('/api/admin/auth/logout', {
          method: 'POST',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: { 'X-CSRF-Token': csrf || '' },
        });
        if (gen !== session) return;
        if (r.ok || r.status === 401) {
          endSession();
          message('Sudah keluar dari admin.');
        } else {
          if (r.status === 403) endSession('FORBIDDEN');
          message('Belum berhasil keluar. Coba lagi.', true);
        }
      } catch {
        message('Koneksi terputus. Coba keluar lagi.', true);
      }
    });
    byId('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (byId('login-submit').disabled) return;
      const gen = session;
      byId('login-submit').disabled = true;
      message('Masuk…');
      try {
        const r = await fetch('/api/admin/auth/login', {
          method: 'POST',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: byId('login-email').value,
            password: byId('login-password').value,
          }),
        });
        const d = await r.json();
        if (gen !== session) return;
        byId('login-password').value = '';
        if (!r.ok) {
          message(
            r.status === 429
              ? 'Terlalu banyak percobaan. Coba beberapa saat lagi.'
              : 'Email atau password salah.',
            true,
          );
          return;
        }
        session++;
        csrf = d.csrf;
        loggedIn();
        await bootstrap();
      } catch {
        message('Koneksi terputus.', true);
      } finally {
        byId('login-submit').disabled = false;
      }
    });
    fetch('/api/recruitment/application', { cache: 'no-store' })
      .then((r) => r.json())
      .then(
        (d) =>
          (byId('intake-status').textContent = d.accepting
            ? 'Pendaftaran dibuka. Pendaftar baru akan tersimpan di sini.'
            : 'Pendaftaran belum dibuka.'),
      )
      .catch(
        () =>
          (byId('intake-status').textContent =
            'Status pendaftaran belum bisa diperiksa.'),
      );
    byId('login-submit').disabled = true;
    bootstrap().finally(() => {
      byId('login-submit').disabled = false;
    });
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else init();
})();
