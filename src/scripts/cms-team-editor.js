import { prepareImageForUpload } from './admin-image.js';

const INSTANCES = new Map();

export function mount(root, opts = {}) {
  const id = root.id || root.dataset.panel || 'team';
  if (INSTANCES.has(id)) return INSTANCES.get(id);
  const $ = (sel) => root.querySelector('#' + sel);
  const $$ = (sel) => root.querySelectorAll(sel);
  const form = $('project-form');
  let state, selected, csrf;
  let dirty = false;
  const scopes = {
    read: false,
    mutation: false,
    upload: false,
    publication: false,
    logout: false,
  };
  const locked = () => scopes.read || scopes.mutation;
  const messages = {
    UNAUTHORIZED:
      'Masuk dengan akun owner untuk mengelola Team. Formulir belum disimpan.',
    CONFLICT:
      'Team sudah berubah. Muat ulang sebelum menyimpan lagi; formulir tetap tersedia.',
    MINIMUM: 'Setiap grup harus memiliki minimal satu anggota.',
    LIMIT: 'Maksimal delapan anggota per grup.',
    INVALID_INPUT: 'Periksa nama, peran, grup, posisi dan foto anggota.',
    INVALID_DATA: 'Data Team belum bisa dibaca. Hubungi pengelola situs.',
    NOT_FOUND: 'Anggota tidak ditemukan. Muat ulang Team.',
    CONFIGURATION:
      'Konfigurasi penerbitan belum lengkap. Hubungi pengelola situs.',
    COLLISION: 'ID baru belum bisa dibuat. Coba tambah lagi.',
    SERVER_ERROR:
      'Operasi belum berhasil. Muat ulang Team untuk memeriksa data tersimpan.',
  };
  const isLoadingText = (t) =>
    typeof t === 'string' &&
    (t.startsWith('Memuat') ||
      t.startsWith('Memeriksa') ||
      t.endsWith('…') ||
      t.endsWith('...'));
  const message = (text, error = false) => {
    const el = $('status');
    if (!el) return;
    el.textContent = text;
    el.dataset.error = String(error);
    const loading = !error && isLoadingText(text);
    el.classList.toggle('is-loading', loading);
    el.dataset.loading = String(loading);
  };
  const showToast = (type, title, text = '', duration = 4000) => {
    const container =
      root.querySelector('.admin-toast-container') ||
      document.querySelector('.admin-toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'admin-toast toast-' + type;
    toast.setAttribute('role', 'alert');
    const dot = document.createElement('span');
    dot.className = 'toast-dot';
    const content = document.createElement('div');
    content.className = 'toast-content';
    const titleEl = document.createElement('div');
    titleEl.className = 'toast-title';
    titleEl.textContent = title;
    content.appendChild(titleEl);
    if (text) {
      const descEl = document.createElement('div');
      descEl.className = 'toast-desc';
      descEl.textContent = text;
      content.appendChild(descEl);
    }
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'toast-close';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Tutup notifikasi');
    const dismiss = () => {
      toast.classList.add('toast-closing');
      setTimeout(() => toast.remove(), 300);
    };
    closeBtn.addEventListener('click', dismiss);
    toast.append(dot, content, closeBtn);
    container.appendChild(toast);
    if (duration > 0) {
      setTimeout(() => {
        if (toast.isConnected) dismiss();
      }, duration);
    }
  };
  const setBtnLoading = (btn, isLoading, loadingText, defaultText) => {
    if (!btn) return;
    if (isLoading) {
      btn.classList.add('is-loading');
      btn.innerHTML = `<span class="btn-spinner"></span> ${loadingText}`;
    } else {
      btn.classList.remove('is-loading');
      btn.textContent = defaultText;
    }
  };
  const setScope = (name, value) => {
    scopes[name] = value;
    applyBusy();
  };
  const applyBusy = () => {
    const writeLocked = locked();
    $('fields').disabled = writeLocked || scopes.upload;
    $('image-upload').disabled = writeLocked || scopes.upload;
    $('save').disabled = writeLocked || scopes.upload;
    $('add').disabled =
      writeLocked ||
      !state ||
      state.groups.every(
        (g) => state.members.filter((m) => m.group === g.id).length >= 8,
      );
    const record = state?.members.find((m) => m.id === selected);
    $('delete').disabled =
      writeLocked ||
      scopes.upload ||
      !record ||
      state.members.filter((m) => m.group === record.group).length <= 1;
    $('retry').disabled = writeLocked || scopes.publication;
    $('reload').disabled = scopes.read;
    if ($('logout')) $('logout').disabled = scopes.logout || scopes.mutation;
    $$('.project-choice').forEach(
      (choice) => (choice.disabled = writeLocked || scopes.upload),
    );
    $('workspace').setAttribute(
      'aria-busy',
      String(writeLocked || scopes.upload),
    );
  };
  const expire = () => {
    $('workspace').hidden = true;
    if ($('workspace-skeleton')) $('workspace-skeleton').hidden = true;
    if ($('logout')) $('logout').hidden = true;
    if ($('login')) $('login').hidden = false;
    $('retry').hidden = true;
  };
  const rpc = async (operation, payload) => {
    const response = await fetch('/api/admin/team', {
      method: operation === 'load' ? 'GET' : 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      ...(operation === 'load'
        ? {}
        : {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrf,
            },
            body: JSON.stringify({
              operation,
              ...(payload === undefined ? {} : { payload }),
            }),
          }),
    });
    const result = await response.json();
    if (result.error?.code === 'UNAUTHORIZED') expire();
    if (result.ok) {
      csrf = result.csrf;
      if ($('login')) $('login').hidden = true;
      if ($('logout')) $('logout').hidden = false;
    }
    return result;
  };
  const preview = () => {
    const photo = $('image').value;
    const image = $('image-preview');
    if (['marchel', 'zidan-rose'].includes(photo)) {
      image.src = '/images/team/' + photo + '.webp';
      image.hidden = false;
    } else if (/^\/images\/cms\/team\/[a-f0-9]{64}\.webp$/.test(photo)) {
      image.src =
        '/api/admin/media?collection=team&image=' + encodeURIComponent(photo);
      image.hidden = false;
    } else {
      image.removeAttribute('src');
      image.hidden = true;
    }
  };
  const choose = (id) => {
    if (
      locked() ||
      scopes.upload ||
      (dirty &&
        !confirm(
          'Perubahan belum disimpan. Pindah anggota dan abaikan perubahan?',
        ))
    )
      return false;
    selected = id;
    dirty = false;
    const group = $('group').value || 'leader';
    const record = state.members.find((m) => m.id === id) || {
      group,
      name: '',
      role: '',
      order: Math.min(
        state.members.filter((m) => m.group === group).length + 1,
        8,
      ),
      photo: 'zidan-rose',
    };
    $('editor-title').textContent = id ? 'Isi anggota' : 'Anggota baru';
    for (const key of ['group', 'name', 'role', 'order'])
      $(key).value = record[key];
    $('image').value = record.photo;
    $('image-upload').value = '';
    $$('.project-choice').forEach((b) =>
      b.setAttribute('aria-current', String(b.dataset.id === id)),
    );
    applyBusy();
    preview();
    return true;
  };
  const render = () => {
    $('project-list').replaceChildren();
    $('group').replaceChildren();
    state.groups.forEach((group) => {
      const option = document.createElement('option');
      option.value = group.id;
      option.textContent = group.title;
      $('group').append(option);
      const title = document.createElement('p');
      title.textContent = group.title;
      $('project-list').append(title);
      state.members
        .filter((m) => m.group === group.id)
        .sort((a, b) => a.order - b.order)
        .forEach((m) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'project-choice';
          button.dataset.id = m.id;
          button.textContent = m.order + '. ' + m.name;
          button.addEventListener('click', () => choose(m.id));
          $('project-list').append(button);
        });
    });
    $('image').replaceChildren();
    state.photoPresets.forEach((photo, i) => {
      const option = document.createElement('option');
      option.value = photo;
      option.textContent =
        photo === 'marchel'
          ? 'Preset Marchel'
          : photo === 'zidan-rose'
            ? 'Preset Zidan / Rose'
            : 'Foto upload ' + (i + 1);
      $('image').append(option);
    });
    $('workspace').hidden = false;
    if ($('workspace-skeleton')) $('workspace-skeleton').hidden = true;
    choose(
      state.members.some((m) => m.id === selected)
        ? selected
        : state.members[0].id,
    );
  };
  const publication = () => {
    $('retry').hidden = false;
    message(
      'Perubahan tersimpan. Penerbitan dimulai di belakang layar. Periksa situs setelah beberapa menit.',
    );
  };
  const load = async (isManual = false) => {
    if (locked() || scopes.read) return;
    if (
      dirty &&
      !confirm('Muat ulang dan abaikan perubahan yang belum disimpan?')
    )
      return;
    setScope('read', true);
    setBtnLoading($('reload'), true, 'Memuat…', 'Muat ulang Team');
    message('Memuat Team…');
    if ($('workspace').hidden && $('workspace-skeleton'))
      $('workspace-skeleton').hidden = false;
    try {
      const result = await rpc('load');
      if (!result.ok) {
        if ($('workspace-skeleton')) $('workspace-skeleton').hidden = true;
        const errText = messages[result.error.code] || messages.SERVER_ERROR;
        message(errText, true);
        showToast(
          'error',
          result.error?.code === 'UNAUTHORIZED'
            ? 'Sesi Berakhir'
            : 'Gagal Memuat',
          result.error?.code === 'UNAUTHORIZED'
            ? 'Sesi owner telah berakhir. Silakan masuk kembali.'
            : 'Tidak dapat memuat data tim terbaru.',
        );
        $('reload').hidden = false;
        return;
      }
      state = result.data;
      dirty = false;
      setScope('read', false);
      render();
      $('reload').hidden = true;
      $('retry').hidden = !state.publicationPending;
      message(
        state.publicationPending
          ? 'Ada perubahan tersimpan yang belum berhasil diterbitkan. Klik Coba terbitkan lagi.'
          : 'Pilih anggota yang ingin diubah.',
      );
      if (isManual) {
        showToast(
          'info',
          'Data Terkini',
          'Daftar anggota tim berhasil diperbarui.',
        );
      }
    } catch {
      const errText = 'Koneksi terputus. Muat ulang Team untuk mencoba lagi.';
      message(errText, true);
      showToast('error', 'Koneksi Terputus', errText);
      $('reload').hidden = false;
    } finally {
      setBtnLoading($('reload'), false, '', 'Muat ulang Team');
      setScope('read', false);
    }
  };
  form.addEventListener('input', () => (dirty = true));
  form.addEventListener('change', () => (dirty = true));
  $('image').addEventListener('change', preview);
  $('add').addEventListener('click', () => {
    if (locked()) return;
    if (
      state &&
      state.groups.every(
        (g) => state.members.filter((m) => m.group === g.id).length >= 8,
      )
    ) {
      showToast('warning', 'Batas Maksimal', messages.LIMIT);
      return;
    }
    if (choose(null)) {
      dirty = true;
      $('name').focus();
      showToast(
        'info',
        'Anggota Baru',
        'Formulir anggota tim baru siap diisi.',
      );
    }
  });
  const mutate = async (operation, payload) => {
    setScope('mutation', true);
    const isDel = operation === 'delete';
    if (isDel) {
      setBtnLoading($('delete'), true, 'Menghapus…', 'Hapus anggota');
    } else {
      setBtnLoading($('save'), true, 'Menyimpan…', 'Simpan dan terbitkan');
    }
    message(
      isDel
        ? 'Menghapus dan meminta penerbitan…'
        : 'Menyimpan dan meminta penerbitan…',
    );
    try {
      const result = await rpc(operation, {
        ...payload,
        revision: state.revision,
      });
      if (!result.ok) {
        const errText = messages[result.error.code] || messages.SERVER_ERROR;
        message(errText, true);
        showToast(
          result.error?.code === 'CONFLICT' ? 'warning' : 'error',
          result.error?.code === 'CONFLICT'
            ? 'Konflik Versi'
            : result.error?.code === 'UNAUTHORIZED'
              ? 'Sesi Berakhir'
              : isDel
                ? 'Gagal Menghapus'
                : 'Gagal Menyimpan',
          result.error?.code === 'CONFLICT'
            ? 'Terdapat revisi terbaru dari sesi lain. Muat ulang untuk sinkronisasi data.'
            : result.error?.code === 'UNAUTHORIZED'
              ? 'Sesi owner telah berakhir. Silakan masuk kembali.'
              : 'Permintaan tidak dapat diproses oleh server.',
        );
        $('reload').hidden = false;
        return;
      }
      state = result.data;
      selected = result.data.affectedId;
      dirty = false;
      setScope('mutation', false);
      render();
      $('reload').hidden = true;
      publication();
      showToast(
        'success',
        isDel ? 'Anggota Dihapus' : 'Anggota Tersimpan',
        isDel
          ? 'Data anggota telah disingkirkan dari daftar tim.'
          : 'Perubahan data anggota berhasil disimpan ke server.',
      );
    } catch {
      const errText =
        'Koneksi terputus. Muat ulang Team sebelum mengulang untuk memeriksa data tersimpan.';
      message(errText, true);
      showToast('error', 'Koneksi Terputus', errText);
      $('reload').hidden = false;
    } finally {
      setBtnLoading($('save'), false, '', 'Simpan dan terbitkan');
      setBtnLoading($('delete'), false, '', 'Hapus anggota');
      setScope('mutation', false);
    }
  };
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (locked() || !form.reportValidity()) return;
    const member = {
      ...(selected ? { id: selected } : {}),
      group: $('group').value,
      name: $('name').value,
      role: $('role').value,
      order: Number($('order').value),
      photo: $('image').value,
    };
    void mutate(selected ? 'save' : 'add', { member });
  });
  $('delete').addEventListener('click', () => {
    if (locked() || !selected) return;
    const member = state.members.find((m) => m.id === selected);
    if (
      confirm('Hapus anggota "' + member.name + '"? Situs akan dibangun ulang.')
    )
      void mutate('delete', { id: selected });
  });
  $('retry').addEventListener('click', async () => {
    if (locked() || scopes.publication) return;
    setScope('publication', true);
    setBtnLoading($('retry'), true, 'Menerbitkan…', 'Coba terbitkan lagi');
    try {
      const result = await rpc('retry');
      if (result.ok) {
        publication();
        showToast(
          'success',
          'Antrean Rilis',
          'Permintaan build situs telah dikirimkan ke server.',
        );
      } else {
        const errText = messages[result.error.code] || messages.SERVER_ERROR;
        message(errText, true);
        showToast('error', 'Gagal Publikasi', errText);
      }
    } catch {
      const errText = 'Koneksi terputus. Coba terbitkan lagi.';
      message(errText, true);
      showToast('error', 'Koneksi Terputus', errText);
    } finally {
      setBtnLoading($('retry'), false, '', 'Coba terbitkan lagi');
      setScope('publication', false);
    }
  });
  $('reload').addEventListener('click', () => load(true));
  $('image-upload').addEventListener('change', async () => {
    const file = $('image-upload').files[0];
    if (!file || locked() || scopes.upload) return;
    setScope('upload', true);
    message('Menyiapkan foto…');
    try {
      const prepared = await prepareImageForUpload(file);
      if (prepared.error === 'type') {
        const errText = 'Pilih JPG, PNG atau WebP.';
        message(errText, true);
        showToast('error', 'Format Tidak Didukung', errText);
        return;
      }
      if (prepared.error === 'decode') {
        const errText =
          'Foto tidak bisa dibaca. Coba file JPG, PNG atau WebP lain.';
        message(errText, true);
        showToast('error', 'Gagal Membaca Berkas', errText);
        return;
      }
      if (prepared.error === 'size') {
        const errText =
          'Foto terlalu besar untuk diunggah. Coba gambar yang lebih kecil.';
        message(errText, true);
        showToast('error', 'Ukuran Terlalu Besar', errText);
        return;
      }
      const notice = prepared.converted
        ? 'Foto dikecilkan otomatis agar sesuai batas. Mengupload…'
        : 'Mengupload foto…';
      message(notice);
      showToast('info', 'Memproses Berkas', notice);
      const response = await fetch('/api/admin/media?collection=team', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': prepared.type, 'X-CSRF-Token': csrf },
        body: prepared.blob,
      });
      const result = await response.json();
      if (result.error?.code === 'UNAUTHORIZED') {
        expire();
        message(messages.UNAUTHORIZED, true);
        showToast('error', 'Sesi Berakhir', 'Masuk lagi sebelum melanjutkan.');
        return;
      }
      if (
        !result.ok ||
        !/^\/images\/cms\/team\/[a-f0-9]{64}\.webp$/.test(result.data?.image)
      ) {
        const errText =
          result.error?.code === 'INVALID_INPUT'
            ? 'Gambar tidak didukung server. Coba JPG, PNG atau WebP lain.'
            : 'Foto belum berhasil diupload. Coba lagi.';
        message(errText, true);
        showToast('error', 'Gagal Mengunggah', errText);
        return;
      }
      const photo = result.data.image;
      if (![...$('image').options].some((o) => o.value === photo)) {
        const option = document.createElement('option');
        option.value = photo;
        option.textContent = 'Foto yang baru diupload';
        $('image').append(option);
      }
      $('image').value = photo;
      dirty = true;
      preview();
      const readyMsg =
        'Foto siap. Klik Simpan dan terbitkan untuk memakai foto di situs.';
      message(readyMsg);
      showToast(
        'success',
        'Berkas Terverifikasi',
        'Gambar profil anggota siap digunakan. Klik Simpan untuk menerapkan.',
      );
    } catch {
      const errText =
        'Koneksi upload terputus. Anggota belum disimpan. Pilih foto lagi.';
      message(errText, true);
      showToast('error', 'Koneksi Terputus', errText);
    } finally {
      $('image-upload').value = '';
      setScope('upload', false);
    }
  });
  if ($('logout')) {
    $('logout').addEventListener('click', async () => {
      if (locked() || scopes.logout) return;
      if (
        dirty &&
        !confirm('Keluar dan abaikan perubahan yang belum disimpan?')
      )
        return;
      setScope('logout', true);
      setBtnLoading($('logout'), true, 'Keluar…', 'Keluar');
      try {
        const response = await fetch('/api/admin/auth/logout', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'X-CSRF-Token': csrf },
        });
        if (!response.ok) {
          const errText = 'Belum bisa keluar. Coba lagi.';
          message(errText, true);
          showToast('error', 'Gagal Keluar', errText);
          return;
        }
        dirty = false;
        state = undefined;
        selected = undefined;
        form.reset();
        $('project-list').replaceChildren();
        $('image-preview').removeAttribute('src');
        $('image-preview').hidden = true;
        expire();
        const msg = 'Sudah keluar. Masuk lagi untuk mengelola Team.';
        message(msg);
        showToast('info', 'Sesi Berakhir', msg);
      } catch {
        const errText = 'Koneksi terputus. Coba keluar lagi.';
        message(errText, true);
        showToast('error', 'Koneksi Terputus', errText);
      } finally {
        setBtnLoading($('logout'), false, '', 'Keluar');
        setScope('logout', false);
      }
    });
  }
  const loginForm = $('login-form');
  const showLogin = () => {
    if (loginForm) loginForm.hidden = false;
    if ($('login')) $('login').hidden = true;
    if ($('login-email')) $('login-email').focus();
  };
  if ($('login')) $('login').addEventListener('click', showLogin);
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (scopes.logout) return;
      const submit = $('login-submit');
      const email = $('login-email').value.trim();
      const password = $('login-password').value;
      if (!email || !password) return;
      if (submit) {
        submit.disabled = true;
        setBtnLoading(submit, true, 'Memeriksa…', 'Masuk');
      }
      try {
        const response = await fetch('/api/admin/auth/login', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
          const errText =
            result.error?.code === 'FORBIDDEN'
              ? 'Akun ini tidak punya akses owner.'
              : 'Login belum berhasil. Periksa email dan kata sandi.';
          message(errText, true);
          showToast('error', 'Gagal Masuk', errText);
          return;
        }
        $('login-password').value = '';
        loginForm.hidden = true;
        message('Masuk. Memuat Team…');
        showToast(
          'success',
          'Akses Diberikan',
          'Selamat datang di konsol admin.',
        );
        void load();
      } catch {
        const errText = 'Koneksi terputus. Coba masuk lagi.';
        message(errText, true);
        showToast('error', 'Koneksi Terputus', errText);
      } finally {
        if (submit) {
          submit.disabled = false;
          setBtnLoading(submit, false, '', 'Masuk');
        }
      }
    });
  }
  window.addEventListener('beforeunload', (event) => {
    if (dirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
  const instance = {
    show() {
      root.hidden = false;
    },
    hide() {
      root.hidden = true;
    },
    isDirty: () => dirty || scopes.mutation || scopes.upload,
    teardown() {
      dirty = false;
      state = undefined;
      selected = undefined;
      csrf = undefined;
      if ($('workspace')) $('workspace').hidden = true;
      INSTANCES.delete(id);
    },
    load,
    _root: root,
  };
  INSTANCES.set(id, instance);
  load();
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
