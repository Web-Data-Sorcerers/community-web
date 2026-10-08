(() => {
  const byId = (id) => document.getElementById(id);
  const api = '/api/admin/recruitment';
  let applications = [];
  let total = 0;
  let filtered = 0;
  let busy = false;
  let page = 0;
  const PAGE_SIZE = 50;
  const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
  let refreshTimer = null;
  let csrf;
  let sessionGeneration = 0;
  const hodsDivisions = [
    'data',
    'core',
    'language',
    'vision',
    'product',
    'growth',
  ];
  const errors = {
    UNAUTHORIZED: 'Sesi admin berakhir. Silakan masuk lagi.',
    FORBIDDEN: 'Akun ini belum memiliki izin melihat pendaftar.',
    CONFIGURATION: 'Konfigurasi server belum lengkap.',
    INVALID_INPUT: 'Permintaan tidak valid.',
    NOT_FOUND: 'Data tidak ditemukan.',
    SERVER_ERROR: 'Kesalahan server. Coba lagi.',
    LIMIT: 'Terlalu banyak percobaan. Coba beberapa saat lagi.',
  };

  const message = (text, error = false) => {
    byId('status').textContent = text;
    byId('status').dataset.error = String(error);
  };

  const setBusy = (value) => {
    busy = value;
    document
      .querySelectorAll('button, input, select')
      .forEach((el) => (el.disabled = value));
  };

  const loggedIn = () => {
    byId('workspace').hidden = false;
    byId('login-form').hidden = true;
    byId('logout').hidden = false;
  };

  const clearApplicantData = () => {
    byId('detail-area').hidden = true;
    byId('detail-panel').replaceChildren();
    byId('applications-body').replaceChildren();
    byId('stats').replaceChildren();
    applications = [];
  };

  const expire = () => {
    sessionGeneration++;
    clearApplicantData();
    byId('workspace').hidden = true;
    byId('login-form').hidden = false;
    byId('logout').hidden = true;
    csrf = undefined;
    byId('table-wrapper').hidden = false;
    message('Sesi berakhir. Silakan login ulang.', true);
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  };

  const refreshToken = async () => {
    try {
      const response = await fetch('/api/admin/auth/refresh', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'X-CSRF-Token': csrf || '' },
      });
      if (!response.ok) {
        expire();
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  const startRefreshTimer = () => {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(refreshToken, REFRESH_INTERVAL);
  };

  const apiFetch = async (route, params = {}) => {
    const generation = sessionGeneration;
    const url = new URL(api + '/' + route, location.origin);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    }
    try {
      const response = await fetch(url, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (generation !== sessionGeneration) return null;
      if (response.status === 401) {
        expire();
        return null;
      }
      const result = await response.json();
      if (generation !== sessionGeneration) return null;
      if (response.status === 403) {
        sessionGeneration++;
        clearApplicantData();
        byId('workspace').hidden = true;
        byId('login-form').hidden = true;
        byId('logout').hidden = false;
        message(errors.FORBIDDEN, true);
      }
      if (result.csrf) csrf = result.csrf;
      if (result.ok) loggedIn();
      return result;
    } catch {
      if (!busy) message('Koneksi terputus.', true);
      return null;
    }
  };

  const renderStats = (stats) => {
    const container = byId('stats');
    container.innerHTML = '';
    if (!stats) return;
    const cards = [
      { label: 'Total', value: stats.total ?? 0 },
      ...(stats.by_hods || []).map((h) => ({
        label: h.hods,
        value: h.count,
      })),
    ];
    for (const card of cards) {
      const div = document.createElement('div');
      div.className = 'stat-card';
      const number = document.createElement('span');
      number.className = 'number';
      number.textContent = String(card.value);
      const label = document.createElement('span');
      label.className = 'label';
      label.textContent = card.label;
      div.append(number, label);
      container.appendChild(div);
    }
  };

  const escapeHtml = (text) => {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const renderTable = () => {
    const tbody = byId('applications-body');
    tbody.innerHTML = '';
    const start = page * PAGE_SIZE;
    const slice = applications.slice(start, start + PAGE_SIZE);
    if (slice.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5" style="text-align:center;color:#bcb7cb">Belum ada pendaftar.</td></tr>';
      return;
    }
    for (const app of slice) {
      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      tr.innerHTML =
        '<td>' +
        escapeHtml(app.full_name || '-') +
        '</td><td>' +
        escapeHtml(app.email || '-') +
        '</td><td>' +
        escapeHtml(app.primary_hods || '-') +
        '</td><td>' +
        formatDate(app.received_at) +
        '</td><td style="font-family:monospace;font-size:12px">' +
        (app.receipt || '').slice(0, 8) +
        '…</td>';
      const detailButton = document.createElement('button');
      detailButton.type = 'button';
      detailButton.className = 'applicant-detail';
      detailButton.textContent = app.full_name || 'Lihat detail';
      tr.firstElementChild.replaceChildren(detailButton);
      tr.addEventListener('click', () => loadDetail(app.receipt));
      tbody.appendChild(tr);
    }
    byId('page-info').textContent =
      'Halaman ' +
      (page + 1) +
      ' dari ' +
      Math.max(1, Math.ceil(applications.length / PAGE_SIZE));
    byId('pagination').hidden = applications.length <= PAGE_SIZE;
    byId('prev-page').disabled = page === 0;
    byId('next-page').disabled = (page + 1) * PAGE_SIZE >= applications.length;
  };

  const loadList = async (search, hods) => {
    setBusy(true);
    message('Memuat data…');
    try {
      const params = { limit: 200 };
      if (search) params.search = search;
      if (hods) params.primary_hods = hods;
      const result = await apiFetch('applications', params);
      if (!result) return;
      if (!result.ok) {
        message(errors[result.error?.code] || errors.SERVER_ERROR, true);
        return;
      }
      applications = result.data?.applications || [];
      total = result.data?.total || 0;
      filtered = result.data?.filtered || 0;
      page = 0;
      byId('detail-area').hidden = true;
      byId('table-wrapper').hidden = false;
      renderTable();
      message(filtered + ' dari ' + total + ' pendaftar');
    } catch {
      message('Gagal memuat data.', true);
    } finally {
      setBusy(false);
    }
  };

  const loadDetail = async (receipt) => {
    setBusy(true);
    message('Memuat detail…');
    try {
      const result = await apiFetch('application', { receipt });
      if (!result) return;
      if (!result.ok) {
        message(errors[result.error?.code] || 'Gagal memuat detail.', true);
        return;
      }
      byId('table-wrapper').hidden = true;
      byId('detail-area').hidden = false;
      byId('pagination').hidden = true;
      const data = result.data;
      const panel = byId('detail-panel');
      panel.innerHTML = '';
      const fields = data.fields || {};
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
      const allKeys = Object.keys(fields);
      for (const key of allKeys) {
        const val = fields[key];
        if (val === undefined || val === null || val === '') continue;
        const div = document.createElement('div');
        div.className = 'field';
        div.innerHTML =
          '<div class="field-label">' +
          escapeHtml(labels[key] || key.replaceAll('_', ' ')) +
          '</div><div>' +
          escapeHtml(Array.isArray(val) ? val.join(', ') : String(val)) +
          '</div>';
        panel.appendChild(div);
      }
      message(
        'Detail pendaftar: ' + (data.full_name || fields.full_name || ''),
      );
    } catch {
      message('Gagal memuat detail.', true);
    } finally {
      setBusy(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await apiFetch('stats');
      if (result?.ok) renderStats(result.data);
    } catch {
      // Stats failure is non-critical.
    }
  };

  const init = () => {
    const params = new URL(location.href).searchParams;
    if (params.get('login') === 'failed') {
      message('Login gagal. Coba lagi.', true);
      history.replaceState(null, '', '/admin/recruitment/');
    } else if (params.get('login') === 'unavailable') {
      message('Konfigurasi server belum lengkap.', true);
      history.replaceState(null, '', '/admin/recruitment/');
    }

    const select = byId('filter-hods');
    for (const h of hodsDivisions) {
      const opt = document.createElement('option');
      opt.value = h;
      opt.textContent = h;
      select.appendChild(opt);
    }

    byId('logout').addEventListener('click', async () => {
      if (busy) return;
      setBusy(true);
      try {
        const response = await fetch('/api/admin/auth/logout', {
          method: 'POST',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: { 'X-CSRF-Token': csrf || '' },
        });
        if (response.ok || response.status === 401) {
          expire();
          message('Sudah keluar dari admin.');
        } else message('Belum berhasil keluar. Coba lagi.', true);
      } catch {
        message('Koneksi terputus. Coba keluar lagi.', true);
      } finally {
        setBusy(false);
      }
    });

    byId('login-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      if (busy) return;
      const email = byId('login-email').value;
      const password = byId('login-password').value;
      if (!email || !password) return;
      setBusy(true);
      message('Masuk…');
      try {
        const response = await fetch('/api/admin/auth/login', {
          method: 'POST',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (response.status === 429) {
          message(errors.LIMIT, true);
          return;
        }
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
          message(
            result.error?.code === 'CONFIGURATION'
              ? errors.CONFIGURATION
              : 'Email atau password salah.',
            true,
          );
          return;
        }
        byId('login-password').value = '';
        sessionGeneration++;
        csrf = result.csrf;
        loggedIn();
        startRefreshTimer();
        await loadList();
        await loadStats();
      } catch {
        message('Koneksi terputus.', true);
      } finally {
        setBusy(false);
      }
    });

    byId('filter-btn').addEventListener('click', () => {
      loadList(byId('search').value, byId('filter-hods').value);
    });

    byId('search').addEventListener('keydown', (e) => {
      if (e.key === 'Enter')
        loadList(byId('search').value, byId('filter-hods').value);
    });

    byId('prev-page').addEventListener('click', () => {
      if (page > 0) {
        page--;
        renderTable();
      }
    });

    byId('next-page').addEventListener('click', () => {
      if ((page + 1) * PAGE_SIZE < applications.length) {
        page++;
        renderTable();
      }
    });

    byId('back-list').addEventListener('click', () => {
      byId('detail-area').hidden = true;
      byId('table-wrapper').hidden = false;
      renderTable();
      message(filtered + ' dari ' + total + ' pendaftar');
    });

    fetch('/api/recruitment/application', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((result) => {
        byId('intake-status').textContent =
          result.accepting === true
            ? 'Pendaftaran dibuka. Pendaftar baru akan tersimpan di sini.'
            : 'Pendaftaran belum dibuka. Form belum menerima kiriman baru.';
      })
      .catch(() => {
        byId('intake-status').textContent =
          'Status pendaftaran belum bisa diperiksa.';
      });
    loadList();
    loadStats();
    startRefreshTimer();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
