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

const INSTANCES = new Map();

export function mount(root, opts = {}) {
  const id = root.id || root.dataset.panel || 'recruitment';
  if (INSTANCES.has(id)) return INSTANCES.get(id);
  const send = createTransport();
  const byId = (id) => root.querySelector('#' + id);
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
  const notify = (type) => {
    if (typeof window !== 'undefined')
      window.dispatchEvent(new CustomEvent(type, { detail: { panel: id } }));
  };
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
  function showToast(type, title, text = '', duration = 4000) {
    const container = byId('recruitment-toast-container');
    if (!container) return;
    const toast = create('div', undefined, 'admin-toast toast-' + type);
    toast.setAttribute('role', 'alert');
    const dot = create('span', undefined, 'toast-dot');
    const contentDiv = create('div', undefined, 'toast-content');
    const titleDiv = create('div', title, 'toast-title');
    contentDiv.append(titleDiv);
    if (text) {
      const descDiv = create('div', text, 'toast-desc');
      contentDiv.append(descDiv);
    }
    const closeBtn = create('button', '×', 'toast-close');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Tutup notifikasi');
    const dismiss = () => {
      toast.classList.add('toast-closing');
      setTimeout(() => toast.remove(), 300);
    };
    closeBtn.addEventListener('click', dismiss);
    toast.append(dot, contentDiv, closeBtn);
    container.append(toast);
    if (duration > 0) {
      setTimeout(() => {
        if (toast.isConnected) dismiss();
      }, duration);
    }
  }
  const message = (s, bad = false) => {
    byId('status').textContent = s;
    byId('status').dataset.error = String(bad);
    if (bad && s) {
      showToast('error', 'Pemberitahuan Sistem', s);
    }
  };
  const armSlow = createSlowNotice((text) => message(text));
  const feedback = (s, bad = false) => {
    byId('review-feedback').textContent = s;
    byId('review-feedback').focus();
    if (s && s !== 'Menyimpan…') {
      const isWarn =
        s.includes('Konflik') ||
        s.includes('Pilih perpindahan') ||
        s.includes('Konfirmasikan');
      const type = bad ? 'error' : isWarn ? 'warning' : 'success';
      showToast(type, s);
    }
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
    if (byId('analytics-visuals')) byId('analytics-visuals').hidden = false;
  }
  function endSession(code = 'UNAUTHORIZED', notifyEnd = true) {
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
    if (notifyEnd) notify('admin:session-end');
  }
  function loggedIn() {
    byId('workspace').hidden = false;
    byId('login-form').hidden = true;
    byId('logout').hidden = false;
    if (!refreshTimer) refreshTimer = setInterval(refresh, 30 * 60 * 1000);
    notify('admin:login');
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
  function renderVisualizations(stats, counts) {
    const visuals = byId('analytics-visuals');
    if (!visuals) return;
    visuals.hidden = false;
    const svgNS = 'http://www.w3.org/2000/svg';
    const totalFiltered = Math.max(1, stats.filtered);

    // 1. Domain Donut SVG Chart
    const donut = byId('domain-donut');
    if (donut) {
      donut.replaceChildren();
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('viewBox', '0 0 140 140');
      svg.setAttribute('class', 'domain-donut-svg');
      svg.setAttribute(
        'aria-label',
        `Distribusi domain (${stats.filtered} pelamar)`,
      );

      const bg = document.createElementNS(svgNS, 'circle');
      bg.setAttribute('cx', '70');
      bg.setAttribute('cy', '70');
      bg.setAttribute('r', '50');
      bg.setAttribute('fill', 'none');
      bg.setAttribute('stroke', 'rgba(255, 255, 255, 0.05)');
      bg.setAttribute('stroke-width', '16');
      svg.appendChild(bg);

      const domainColors = {
        data: '#c084fc',
        core: '#60a5fa',
        language: '#34d399',
        vision: '#fbbf24',
        product: '#fb7185',
        growth: '#38bdf8',
      };

      const C = 314.159; // 2 * PI * 50
      let offset = 0;
      const g = document.createElementNS(svgNS, 'g');
      g.setAttribute('transform', 'rotate(-90 70 70)');

      if (stats.filtered > 0) {
        for (const { hods, count } of stats.by_hods) {
          if (count <= 0) continue;
          const seg = document.createElementNS(svgNS, 'circle');
          const dash = (count / stats.filtered) * C;
          seg.setAttribute('cx', '70');
          seg.setAttribute('cy', '70');
          seg.setAttribute('r', '50');
          seg.setAttribute('fill', 'none');
          seg.setAttribute('stroke', domainColors[hods] || '#9b7bff');
          seg.setAttribute('stroke-width', '16');
          seg.setAttribute('stroke-dasharray', `${dash} ${C}`);
          seg.setAttribute('stroke-dashoffset', String(-offset));
          g.appendChild(seg);
          offset += dash;
        }
      }
      svg.appendChild(g);

      const totalText = document.createElementNS(svgNS, 'text');
      totalText.setAttribute('x', '70');
      totalText.setAttribute('y', '64');
      totalText.setAttribute('text-anchor', 'middle');
      totalText.setAttribute('dominant-baseline', 'middle');
      totalText.setAttribute('fill', '#ffffff');
      totalText.setAttribute('font-size', '22');
      totalText.setAttribute('font-weight', '700');
      totalText.setAttribute('font-family', "'Bluu Next', serif");
      totalText.textContent = String(stats.filtered);

      const labelText = document.createElementNS(svgNS, 'text');
      labelText.setAttribute('x', '70');
      labelText.setAttribute('y', '82');
      labelText.setAttribute('text-anchor', 'middle');
      labelText.setAttribute('dominant-baseline', 'middle');
      labelText.setAttribute('fill', '#a8a3b8');
      labelText.setAttribute('font-size', '10');
      labelText.setAttribute('font-weight', '600');
      labelText.setAttribute('letter-spacing', '0.8');
      labelText.textContent = 'PELAMAR';

      svg.appendChild(totalText);
      svg.appendChild(labelText);
      donut.appendChild(svg);
    }

    // 2. Domain Breakdown Progress Bars
    const domainBars = byId('domain-bars');
    const domainGradients = {
      data: 'linear-gradient(90deg, #9333ea, #c084fc)',
      core: 'linear-gradient(90deg, #2563eb, #60a5fa)',
      language: 'linear-gradient(90deg, #059669, #34d399)',
      vision: 'linear-gradient(90deg, #d97706, #fbbf24)',
      product: 'linear-gradient(90deg, #e11d48, #fb7185)',
      growth: 'linear-gradient(90deg, #0891b2, #38bdf8)',
    };
    const domainLabels = {
      data: 'Data & AI',
      core: 'Core Engineering',
      language: 'Language & LLM',
      vision: 'Computer Vision',
      product: 'Product & Design',
      growth: 'Growth & Community',
    };

    if (domainBars) {
      domainBars.replaceChildren(
        ...stats.by_hods.map(({ hods, count }) => {
          const pct = Math.round((count / totalFiltered) * 100);
          const item = create('div', undefined, 'domain-bar-item');
          const labelRow = create('div', undefined, 'domain-bar-label-row');
          labelRow.append(
            create('span', domainLabels[hods] || hods),
            create('span', `${count} (${pct}%)`),
          );
          const track = create('div', undefined, 'domain-bar-track');
          const fill = create('div', undefined, 'domain-bar-fill');
          fill.style.width = `${pct}%`;
          fill.style.background = domainGradients[hods] || 'var(--accent)';
          track.append(fill);
          item.append(labelRow, track);
          return item;
        }),
      );
    }
    const domainTotalBadge = byId('domain-stats-total');
    if (domainTotalBadge) {
      domainTotalBadge.textContent = `${stats.filtered} dari ${stats.total_global}`;
    }

    // 3. SVG Stepped Pipeline Funnel Chart
    const pipelineChart = byId('pipeline-chart');
    if (pipelineChart) {
      pipelineChart.replaceChildren();
      const inReviewTotal =
        counts.reviewing + counts.shortlisted + counts.interview;
      const stages = [
        { label: 'BARU', count: counts.new, color: '#38bdf8' },
        { label: 'DITINJAU', count: inReviewTotal, color: '#c4b5fd' },
        { label: 'SHORTLIST', count: counts.shortlisted, color: '#fbbf24' },
        { label: 'DITERIMA', count: counts.accepted, color: '#34d399' },
      ];

      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('viewBox', '0 0 380 84');
      svg.setAttribute('class', 'pipeline-chart-svg');
      svg.setAttribute('aria-label', 'Visual alur seleksi');

      stages.forEach((st, idx) => {
        const x = 6 + idx * 96;
        const width = 80;

        const rect = document.createElementNS(svgNS, 'rect');
        rect.setAttribute('x', String(x));
        rect.setAttribute('y', '4');
        rect.setAttribute('width', String(width));
        rect.setAttribute('height', '74');
        rect.setAttribute('rx', '8');
        rect.setAttribute('fill', 'rgba(255, 255, 255, 0.03)');
        rect.setAttribute('stroke', st.color);
        rect.setAttribute('stroke-opacity', '0.35');
        rect.setAttribute('stroke-width', '1.5');
        svg.appendChild(rect);

        const accent = document.createElementNS(svgNS, 'line');
        accent.setAttribute('x1', String(x + 12));
        accent.setAttribute('y1', '4');
        accent.setAttribute('x2', String(x + width - 12));
        accent.setAttribute('y2', '4');
        accent.setAttribute('stroke', st.color);
        accent.setAttribute('stroke-width', '2.5');
        accent.setAttribute('stroke-linecap', 'round');
        svg.appendChild(accent);

        const txtLabel = document.createElementNS(svgNS, 'text');
        txtLabel.setAttribute('x', String(x + width / 2));
        txtLabel.setAttribute('y', '26');
        txtLabel.setAttribute('text-anchor', 'middle');
        txtLabel.setAttribute('fill', st.color);
        txtLabel.setAttribute('font-size', '10');
        txtLabel.setAttribute('font-weight', '700');
        txtLabel.setAttribute('letter-spacing', '0.6');
        txtLabel.textContent = st.label;
        svg.appendChild(txtLabel);

        const txtCount = document.createElementNS(svgNS, 'text');
        txtCount.setAttribute('x', String(x + width / 2));
        txtCount.setAttribute('y', '56');
        txtCount.setAttribute('text-anchor', 'middle');
        txtCount.setAttribute('fill', '#ffffff');
        txtCount.setAttribute('font-size', '19');
        txtCount.setAttribute('font-weight', '700');
        txtCount.setAttribute('font-family', "'Bluu Next', serif");
        txtCount.textContent = String(st.count);
        svg.appendChild(txtCount);

        if (idx < stages.length - 1) {
          const arrowX = x + width + 8;
          const arrow = document.createElementNS(svgNS, 'path');
          arrow.setAttribute(
            'd',
            `M${arrowX} 35 L${arrowX + 4} 41 L${arrowX} 47`,
          );
          arrow.setAttribute('stroke', 'rgba(155, 123, 255, 0.45)');
          arrow.setAttribute('stroke-width', '2');
          arrow.setAttribute('stroke-linecap', 'round');
          arrow.setAttribute('stroke-linejoin', 'round');
          arrow.setAttribute('fill', 'none');
          svg.appendChild(arrow);
        }
      });
      pipelineChart.appendChild(svg);
    }

    // 4. Pipeline Terminal Outcomes (Pills)
    const funnel = byId('pipeline-funnel');
    if (funnel) {
      funnel.replaceChildren();
      const terminalRow = create('div', undefined, 'pipeline-terminal-pills');
      const terminalItems = [
        ['Daftar Tunggu', counts.waitlisted],
        ['Ditolak', counts.rejected],
        ['Mundur', counts.withdrawn],
      ];
      terminalItems.forEach(([label, val]) => {
        const pill = create('div', undefined, 'terminal-pill');
        pill.append(
          create('span', label + ': '),
          create('strong', String(val)),
        );
        terminalRow.append(pill);
      });
      funnel.append(terminalRow);
    }

    const funnelConversionBadge = byId('pipeline-stats-conversion');
    if (funnelConversionBadge) {
      const acceptedPct = Math.round((counts.accepted / totalFiltered) * 100);
      funnelConversionBadge.textContent = `${acceptedPct}% Diterima`;
    }
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
    renderVisualizations(stats, counts);
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
    const skeletonFragment = document.createDocumentFragment();
    for (let i = 0; i < 5; i++) {
      const sRow = create('tr', undefined, 'skeleton-row');
      sRow.innerHTML = `
        <td><div class="skeleton-pill w-140"></div></td>
        <td><div class="skeleton-pill w-180"></div></td>
        <td><div class="skeleton-pill w-80"></div></td>
        <td><div class="skeleton-pill w-120"></div></td>
        <td><div class="skeleton-badge"></div></td>
        <td><div class="skeleton-pill w-40"></div></td>
        <td class="col-action"><div class="skeleton-btn"></div></td>
      `;
      skeletonFragment.append(sRow);
    }
    byId('applications-body').replaceChildren(skeletonFragment);
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
      cell.colSpan = 7;
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
      const statusTd = create('td');
      const badge = create(
        'span',
        STATUSES[a.review.status] || a.review.status,
        'status-pill status-' + a.review.status,
      );
      statusTd.append(badge);

      const actionTd = create('td', undefined, 'col-action');
      const actionBtn = create(
        'button',
        'Tinjau Detail →',
        'btn-review-action',
      );
      actionBtn.type = 'button';
      actionBtn.addEventListener('click', () => loadDetail(a.receipt));
      actionTd.append(actionBtn);

      row.append(
        name,
        create('td', a.email || '—'),
        create('td', a.primary_hods || '—'),
        create('td', date(a.received_at)),
        statusTd,
        create('td', String(a.review.note_count)),
        actionTd,
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
    if (byId('analytics-visuals')) byId('analytics-visuals').hidden = true;
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

    const groups = [
      {
        num: '01',
        title: 'Identitas & Informasi Pribadi',
        keys: [
          'full_name',
          'preferred_name',
          'email',
          'whatsapp',
          'institution',
          'city_region',
        ],
      },
      {
        num: '02',
        title: 'Profil & Pemahaman Diri',
        keys: ['current_status', 'current_level', 'best_description'],
      },
      {
        num: '03',
        title: 'Peminatan Domain HoDS & Keahlian',
        keys: [
          'primary_hods',
          'specific_area',
          'currently_exploring',
          'foundation_skills',
          'secondary_interest',
        ],
      },
      {
        num: '04',
        title: 'Bukti Karya & Portofolio',
        keys: [
          'portfolio_link',
          'most_relevant_work',
          'alternative_evidence',
          'project_experience',
        ],
      },
      {
        num: '05',
        title: 'Riset, Masalah & Rencana Karya',
        fullWidth: true,
        keys: [
          'real_world_problem',
          'technology_approach',
          'explore_or_build',
          'what_to_contribute',
          'what_to_build_together',
          'desired_output',
        ],
      },
      {
        num: '06',
        title: 'Kolaborasi & Dinamika Tim',
        fullWidth: true,
        keys: [
          'team_comfort',
          'team_roles',
          'team_story',
          'cross_hods_willingness',
        ],
      },
      {
        num: '07',
        title: 'Komitmen, Motivasi & Pembelajaran',
        fullWidth: true,
        keys: [
          'time_commitment',
          'contribution_types',
          'why_join',
          'skill_to_improve',
          'six_months_goal',
          'learning_methods',
          'independent_learning',
        ],
      },
      {
        num: '08',
        title: 'Persetujuan & Kebijakan',
        keys: ['agreement_1', 'agreement_2', 'agreement_3'],
      },
    ];

    const renderedKeys = new Set();
    for (const grp of groups) {
      const groupFields = [];
      for (const key of grp.keys) {
        const value = data.fields[key];
        if (
          value === null ||
          value === undefined ||
          value === '' ||
          (Array.isArray(value) && value.length === 0)
        )
          continue;
        renderedKeys.add(key);
        const field = create('div', undefined, 'field');
        const labelDiv = create(
          'div',
          labels[key] || key.replaceAll('_', ' '),
          'field-label',
        );
        let valElement;
        if (
          key === 'portfolio_link' &&
          typeof value === 'string' &&
          (value.startsWith('http://') || value.startsWith('https://'))
        ) {
          valElement = create('div', undefined, 'field-value');
          const link = create('a', value, 'portfolio-link');
          link.href = value;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          valElement.append(link);
        } else if (key.startsWith('agreement_')) {
          valElement = create('div', undefined, 'field-value agreement-badge');
          valElement.append(create('span', 'Disetujui (' + value + ')'));
        } else {
          valElement = create(
            'div',
            Array.isArray(value) ? value.join(', ') : String(value),
          );
        }
        field.append(labelDiv, valElement);
        groupFields.push(field);
      }
      if (groupFields.length > 0) {
        const card = create(
          'div',
          undefined,
          'detail-group-card' + (grp.fullWidth ? ' full-width-fields' : ''),
        );
        const head = create('div', undefined, 'detail-group-header');
        head.append(
          create('span', grp.num, 'detail-group-num'),
          create('h3', grp.title, 'detail-group-title'),
        );
        const grid = create('div', undefined, 'detail-group-grid');
        grid.append(...groupFields);
        card.append(head, grid);
        byId('detail-panel').append(card);
      }
    }

    const otherFields = [];
    for (const [key, value] of Object.entries(data.fields)) {
      if (
        renderedKeys.has(key) ||
        value === null ||
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      )
        continue;
      const field = create('div', undefined, 'field');
      field.append(
        create('div', labels[key] || key.replaceAll('_', ' '), 'field-label'),
        create('div', Array.isArray(value) ? value.join(', ') : String(value)),
      );
      otherFields.push(field);
    }
    if (otherFields.length > 0) {
      const card = create('div', undefined, 'detail-group-card');
      const head = create('div', undefined, 'detail-group-header');
      head.append(
        create('span', '+', 'detail-group-num'),
        create('h3', 'Informasi Tambahan', 'detail-group-title'),
      );
      const grid = create('div', undefined, 'detail-group-grid');
      grid.append(...otherFields);
      card.append(head, grid);
      byId('detail-panel').append(card);
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
    const reloadBtn = byId('reload-detail');
    if (reloadBtn) {
      reloadBtn.classList.add('is-loading');
      reloadBtn.innerHTML = '<span class="btn-spinner"></span> Memuat…';
    }
    const gen = ++detailGeneration;
    listGeneration++;
    byId('notes-list').textContent = 'Memuat catatan…';
    byId('history-list').textContent = 'Memuat aktivitas…';
    const doneSlow = armSlow('Memuat detail…');
    const result = await request('application', { receipt }, false, 'detail');
    if (reloadBtn) {
      reloadBtn.classList.remove('is-loading');
      reloadBtn.textContent = 'Muat detail terbaru';
    }
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
    if (byId('back-list-top')) byId('back-list-top').disabled = locked;
    byId('reload-detail').disabled = saving || revisionPending;

    if (saving) {
      if (mutationPending?.kind === 'status') {
        byId('save-status').classList.add('is-loading');
        byId('save-status').innerHTML =
          '<span class="btn-spinner"></span> Menyimpan…';
      } else if (mutationPending?.kind === 'note') {
        byId('save-note').classList.add('is-loading');
        byId('save-note').innerHTML =
          '<span class="btn-spinner"></span> Menambahkan…';
      }
    } else {
      byId('save-status').classList.remove('is-loading');
      byId('save-status').textContent = 'Simpan status';
      byId('save-note').classList.remove('is-loading');
      byId('save-note').textContent = 'Tambah catatan';
    }
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
    byId('back-list-top')?.addEventListener('click', () => {
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
    window.addEventListener('beforeunload', (e) => {
      if (current && dirty()) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
    byId('logout').addEventListener('click', async () => {
      const gen = session;
      const btn = byId('logout');
      if (btn) {
        btn.classList.add('is-loading');
        btn.innerHTML = '<span class="btn-spinner"></span> Keluar…';
      }
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
          showToast('info', 'Sesi Berakhir', 'Sudah keluar dari admin.');
        } else {
          if (r.status === 403) endSession('FORBIDDEN');
          message('Belum berhasil keluar. Coba lagi.', true);
          showToast(
            'error',
            'Gagal Keluar',
            'Belum berhasil keluar. Coba lagi.',
          );
        }
      } catch {
        message('Koneksi terputus. Coba keluar lagi.', true);
        showToast('error', 'Koneksi Terputus', 'Coba keluar lagi.');
      } finally {
        if (btn) {
          btn.classList.remove('is-loading');
          btn.textContent = 'Keluar';
        }
      }
    });
    byId('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (byId('login-submit').disabled) return;
      const gen = session;
      const submit = byId('login-submit');
      submit.disabled = true;
      submit.classList.add('is-loading');
      submit.innerHTML = '<span class="btn-spinner"></span> Memeriksa…';
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
          const errText =
            r.status === 429
              ? 'Terlalu banyak percobaan. Coba beberapa saat lagi.'
              : 'Email atau password salah.';
          message(errText, true);
          showToast('error', 'Gagal Masuk', errText);
          return;
        }
        session++;
        csrf = d.csrf;
        loggedIn();
        showToast(
          'success',
          'Akses Diberikan',
          'Selamat datang di konsol admin.',
        );
        await bootstrap();
      } catch {
        message('Koneksi terputus.', true);
        showToast(
          'error',
          'Koneksi Terputus',
          'Periksa koneksi jaringan Anda.',
        );
      } finally {
        submit.disabled = false;
        submit.classList.remove('is-loading');
        submit.textContent = 'Masuk';
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
  }
  init();
  const instance = {
    show() {
      root.hidden = false;
    },
    hide() {
      root.hidden = true;
    },
    isDirty: () => Boolean(current) && dirty(),
    load: bootstrap,
    teardown() {
      clearInterval(refreshTimer);
      refreshTimer = null;
      INSTANCES.delete(id);
    },
    expireSession() {
      endSession('UNAUTHORIZED', false);
    },
    _root: root,
  };
  INSTANCES.set(id, instance);
  bootstrap().finally(() => {
    if (byId('login-submit')) byId('login-submit').disabled = false;
  });
  return instance;
}

export function getInstance(id) {
  return (
    INSTANCES.get(id) ||
    INSTANCES.get('panel-' + id) ||
    INSTANCES.get(id?.replace?.(/^panel-/, '')) ||
    null
  );
}
