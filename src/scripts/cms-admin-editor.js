import { prepareImageForUpload } from './admin-image.js';

const INSTANCES = new Map();

export function mount(root, opts = {}) {
  const id = root.id || root.dataset.panel || 'projects';
  if (INSTANCES.has(id)) return INSTANCES.get(id);
  const $ = (sel) => root.querySelector('#' + sel);
  const $$ = (sel) => root.querySelectorAll(sel);
  const form = $('project-form');
  let state;
  let selected;
  let dirty = false;
  const scopes = {
    read: false,
    mutation: false,
    upload: false,
    publication: false,
    logout: false,
  };
  const locked = () => scopes.read || scopes.mutation;
  const errors = {
    UNAUTHORIZED:
      'Masuk dengan akun owner untuk mengelola Projects. Perubahan formulir belum disimpan.',
    CONFIGURATION:
      'Konfigurasi penerbitan belum lengkap. Hubungi pengelola situs.',
    INVALID_INPUT:
      'Isi project belum valid. Periksa judul, deskripsi, kategori dan gambar.',
    INVALID_DATA: 'Data projects belum bisa dibaca. Hubungi pengelola situs.',
    CONFLICT:
      'Project sudah berubah sejak halaman dibuka. Muat ulang sebelum menyimpan lagi.',
    NOT_FOUND: 'Project tidak ditemukan. Muat ulang daftar projects.',
    MINIMUM: 'Minimal satu project harus tetap tersedia.',
    LIMIT: 'Maksimal delapan projects. Hapus satu sebelum menambah.',
    COLLISION: 'ID baru belum bisa dibuat. Coba tambah lagi.',
    SERVER_ERROR:
      'Operasi belum berhasil. Muat ulang projects untuk memeriksa isi yang tersimpan.',
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
      scopes.upload ||
      !state ||
      state.projects.length >= state.maxProjects;
    $('delete').disabled =
      writeLocked ||
      scopes.upload ||
      !selected ||
      !state ||
      state.projects.length <= state.minProjects;
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
  let csrf;
  const setImageLoading = (loading, text = 'Memuat gambar…') => {
    const container = $('image-preview-container');
    const loader = $('image-preview-loader');
    const loaderText = $('image-preview-loader-text');
    const image = $('image-preview');
    if (container) {
      container.classList.toggle('is-loading', loading);
      container.dataset.loading = String(loading);
      container.hidden = !loading && (!image || image.hidden);
    }
    if (loaderText) {
      loaderText.textContent = text;
    }
    if (loader) {
      loader.hidden = !loading;
    }
  };
  const preview = () => {
    const image = $('image').value;
    const element = $('image-preview');
    if (!element) return;
    let targetSrc = '';
    if (/^\/images\/cms\/projects\/[a-f0-9]{64}\.webp$/.test(image)) {
      targetSrc = '/api/admin/media?image=' + encodeURIComponent(image);
    } else if (
      /^\/images\/[a-zA-Z0-9_.\/-]+$/.test(image) &&
      !image.includes('..')
    ) {
      targetSrc = image;
    }
    if (targetSrc) {
      element.hidden = false;
      const currentSrc = element.getAttribute('src');
      if (
        currentSrc === targetSrc &&
        element.complete &&
        element.naturalWidth > 0
      ) {
        setImageLoading(false);
        return;
      }
      setImageLoading(true, 'Memuat gambar…');
      element.onload = () => {
        setImageLoading(false);
      };
      element.onerror = () => {
        setImageLoading(false);
      };
      element.src = targetSrc;
      if (element.complete && element.naturalWidth > 0) {
        setImageLoading(false);
      }
    } else {
      element.removeAttribute('src');
      element.hidden = true;
      setImageLoading(false);
    }
  };
  const expire = () => {
    $('workspace').hidden = true;
    if ($('workspace-skeleton')) $('workspace-skeleton').hidden = true;
    if ($('logout')) $('logout').hidden = true;
    if ($('login')) $('login').hidden = false;
    $('retry').hidden = true;
    $('reload').hidden = false;
    setImageLoading(false);
    message(
      'Sesi berakhir. Masuk lagi sebelum melanjutkan. Perubahan formulir belum disimpan.',
      true,
    );
  };
  const operations = {
    adminLoadProjects: 'load',
    adminSaveProject: 'save',
    adminAddProject: 'add',
    adminDeleteProject: 'delete',
    adminRetryPublication: 'retry',
  };
  const rpc = async (name, payload) => {
    const load = name === 'adminLoadProjects';
    const response = await fetch('/api/admin/projects', {
      method: load ? 'GET' : 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      ...(load
        ? {}
        : {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrf,
            },
            body: JSON.stringify({
              operation: operations[name],
              ...(payload === undefined ? {} : { payload }),
            }),
          }),
    });
    const result = await response.json();
    if (result.error?.code === 'UNAUTHORIZED') {
      expire();
      return result;
    }
    if (result.ok) {
      csrf = result.csrf;
      if ($('login')) $('login').hidden = true;
      if ($('logout')) $('logout').hidden = false;
    }
    return result;
  };
  const choose = (id, isUserClick = false) => {
    if (
      locked() ||
      scopes.upload ||
      (dirty &&
        !window.confirm(
          'Perubahan belum disimpan. Pindah project dan abaikan perubahan?',
        ))
    )
      return;
    selected = id;
    dirty = false;
    const record = state.projects.find((project) => project.id === id) || {
      title: '',
      description: '',
      tags: ['', ''],
      image: state.imagePresets[0],
    };
    $('editor-title').textContent = id ? 'Isi project' : 'Project baru';
    $('title').value = record.title;
    $('description').value = record.description;
    $('tag-one').value = record.tags[0];
    $('tag-two').value = record.tags[1];
    $('image').value = record.image;
    $('image-upload').value = '';
    preview();
    $$('.project-choice').forEach((button) =>
      button.setAttribute('aria-current', String(button.dataset.id === id)),
    );
    applyBusy();
    if (isUserClick && record.title) {
      showToast(
        'info',
        'Pilih Project',
        'Memuat data ' + record.title + '…',
        2500,
      );
    }
  };
  const render = () => {
    $('project-list').replaceChildren();
    state.projects.forEach((project) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'project-choice';
      button.dataset.id = project.id;
      button.textContent = project.title;
      button.addEventListener('click', () => choose(project.id, true));
      $('project-list').append(button);
    });
    $('image').replaceChildren();
    state.imagePresets.forEach((image, index) => {
      const option = document.createElement('option');
      option.value = image;
      option.textContent = image.startsWith('/images/cms/projects/')
        ? 'Gambar upload ' + (index + 1)
        : 'Gambar ' + (index + 1);
      $('image').append(option);
    });
    $('workspace').hidden = false;
    if ($('workspace-skeleton')) $('workspace-skeleton').hidden = true;
    choose(
      state.projects.some((project) => project.id === selected)
        ? selected
        : state.projects[0].id,
    );
  };
  const publicationMessage = (saved) => {
    $('retry').hidden = false;
    message(
      (saved ? 'Perubahan tersimpan. ' : '') +
        'Penerbitan dimulai di belakang layar. Tunggu beberapa menit sebelum memeriksa situs.',
    );
  };
  const load = async (isManual = false) => {
    if (locked() || scopes.read) return;
    if (
      dirty &&
      !window.confirm('Muat ulang dan abaikan perubahan yang belum disimpan?')
    )
      return;
    setScope('read', true);
    setBtnLoading($('reload'), true, 'Memuat…', 'Muat ulang projects');
    message('Memuat projects…');
    if ($('workspace').hidden && $('workspace-skeleton'))
      $('workspace-skeleton').hidden = false;
    try {
      const result = await rpc('adminLoadProjects');
      if (!result.ok) {
        if ($('workspace-skeleton')) $('workspace-skeleton').hidden = true;
        const errText = errors[result.error.code] || errors.SERVER_ERROR;
        message(errText, true);
        showToast(
          'error',
          result.error?.code === 'UNAUTHORIZED'
            ? 'Sesi Berakhir'
            : 'Gagal Memuat',
          result.error?.code === 'UNAUTHORIZED'
            ? 'Sesi owner telah berakhir. Silakan masuk kembali.'
            : 'Tidak dapat memuat data projects terbaru.',
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
          : 'Pilih project yang ingin diubah.',
      );
      if (isManual) {
        showToast(
          'info',
          'Data Terkini',
          'Daftar projects berhasil diperbarui.',
        );
      }
    } catch (_error) {
      const errText =
        'Koneksi terputus. Muat ulang projects untuk mencoba lagi.';
      message(errText, true);
      showToast('error', 'Koneksi Terputus', errText);
      $('reload').hidden = false;
    } finally {
      setBtnLoading($('reload'), false, '', 'Muat ulang projects');
      setScope('read', false);
    }
  };
  $('image').addEventListener('change', () => {
    preview();
    showToast(
      'info',
      'Pilihan Gambar',
      'Memperbarui pratinjau gambar project…',
      2500,
    );
  });
  $('image-upload').addEventListener('change', async () => {
    const file = $('image-upload').files[0];
    if (!file || locked() || scopes.upload) return;
    setScope('upload', true);
    setImageLoading(true, 'Menyiapkan gambar…');
    message('Menyiapkan gambar…');
    try {
      const prepared = await prepareImageForUpload(file);
      if (prepared.error === 'type') {
        setImageLoading(false);
        const errText = 'Pilih JPG, PNG atau WebP.';
        message(errText, true);
        showToast('error', 'Format Tidak Didukung', errText);
        return;
      }
      if (prepared.error === 'decode') {
        setImageLoading(false);
        const errText =
          'Gambar tidak bisa dibaca. Coba JPG, PNG atau WebP lain.';
        message(errText, true);
        showToast('error', 'Gagal Membaca Berkas', errText);
        return;
      }
      if (prepared.error === 'size') {
        setImageLoading(false);
        const errText =
          'Gambar terlalu besar untuk diunggah. Coba gambar yang lebih kecil.';
        message(errText, true);
        showToast('error', 'Ukuran Terlalu Besar', errText);
        return;
      }
      const notice = prepared.converted
        ? 'Gambar dikecilkan otomatis agar sesuai batas. Mengupload…'
        : 'Mengupload gambar…';
      setImageLoading(true, 'Mengunggah gambar…');
      message(notice);
      showToast('info', 'Memproses Berkas', notice);
      const response = await fetch('/api/admin/media', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': prepared.type, 'X-CSRF-Token': csrf },
        body: prepared.blob,
      });
      const result = await response.json();
      if (result.error?.code === 'UNAUTHORIZED') {
        setImageLoading(false);
        expire();
        showToast('error', 'Sesi Berakhir', 'Masuk lagi sebelum melanjutkan.');
        return;
      }
      if (
        !result.ok ||
        !/^\/images\/cms\/projects\/[a-f0-9]{64}\.webp$/.test(
          result.data?.image || '',
        )
      ) {
        setImageLoading(false);
        const errText =
          result.error?.code === 'INVALID_INPUT'
            ? 'Gambar tidak didukung server. Coba JPG, PNG atau WebP lain.'
            : 'Gambar belum berhasil diupload. Coba lagi.';
        message(errText, true);
        showToast('error', 'Gagal Mengunggah', errText);
        return;
      }
      const image = result.data.image;
      if (![...$('image').options].some((option) => option.value === image)) {
        const option = document.createElement('option');
        option.value = image;
        option.textContent = 'Gambar yang baru diupload';
        $('image').append(option);
      }
      $('image').value = image;
      dirty = true;
      preview();
      const readyMsg =
        'Gambar siap. Klik Simpan dan terbitkan untuk memakai gambar ini di situs.';
      message(readyMsg);
      showToast(
        'success',
        'Berkas Terverifikasi',
        'Gambar project telah siap digunakan. Klik Simpan dan terbitkan untuk menerapkan.',
      );
    } catch {
      setImageLoading(false);
      const errText =
        'Koneksi upload terputus. Project belum disimpan. Pilih gambar lagi untuk mencoba ulang.';
      message(errText, true);
      showToast('error', 'Koneksi Terputus', errText);
    } finally {
      $('image-upload').value = '';
      setScope('upload', false);
    }
  });
  form.addEventListener('input', () => {
    dirty = true;
  });
  form.addEventListener('change', () => {
    dirty = true;
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (locked() || !form.reportValidity()) return;
    const project = {
      ...(selected ? { id: selected } : {}),
      title: $('title').value,
      description: $('description').value,
      tags: [$('tag-one').value, $('tag-two').value],
      image: $('image').value,
    };
    setScope('mutation', true);
    setBtnLoading($('save'), true, 'Menyimpan…', 'Simpan dan terbitkan');
    message('Menyimpan dan meminta penerbitan…');
    try {
      const result = await rpc(
        selected ? 'adminSaveProject' : 'adminAddProject',
        { project, revision: state.revision },
      );
      if (!result.ok) {
        const errText = errors[result.error.code] || errors.SERVER_ERROR;
        message(errText, true);
        showToast(
          result.error?.code === 'CONFLICT' ? 'warning' : 'error',
          result.error?.code === 'CONFLICT'
            ? 'Konflik Versi'
            : result.error?.code === 'UNAUTHORIZED'
              ? 'Sesi Berakhir'
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
      publicationMessage(true);
      showToast(
        'success',
        'Project Tersimpan',
        'Perubahan data project berhasil disimpan ke server.',
      );
    } catch (_error) {
      const errText =
        'Koneksi terputus. Muat ulang projects sebelum menyimpan lagi untuk memeriksa perubahan terakhir.';
      message(errText, true);
      showToast('error', 'Koneksi Terputus', errText);
      $('reload').hidden = false;
    } finally {
      setBtnLoading($('save'), false, '', 'Simpan dan terbitkan');
      setScope('mutation', false);
    }
  });
  $('add').addEventListener('click', () => {
    if (locked()) return;
    if (state && state.projects.length >= state.maxProjects) {
      showToast('warning', 'Batas Maksimal', errors.LIMIT);
      return;
    }
    choose(null);
    if (selected === null) {
      dirty = true;
      $('title').focus();
      showToast('info', 'Project Baru', 'Formulir project baru siap diisi.');
    }
  });
  $('delete').addEventListener('click', async () => {
    if (locked() || !selected || state.projects.length <= state.minProjects)
      return;
    const record = state.projects.find((project) => project.id === selected);
    if (
      !window.confirm(
        'Hapus project "' + record.title + '"? Situs akan dibangun ulang.',
      )
    )
      return;
    setScope('mutation', true);
    setBtnLoading($('delete'), true, 'Menghapus…', 'Hapus project');
    message('Menghapus dan meminta penerbitan…');
    try {
      const result = await rpc('adminDeleteProject', {
        id: selected,
        revision: state.revision,
      });
      if (!result.ok) {
        const errText = errors[result.error.code] || errors.SERVER_ERROR;
        message(errText, true);
        showToast(
          'error',
          result.error?.code === 'UNAUTHORIZED'
            ? 'Sesi Berakhir'
            : 'Gagal Menghapus',
          result.error?.code === 'UNAUTHORIZED'
            ? 'Sesi owner telah berakhir. Silakan masuk kembali.'
            : 'Permintaan hapus tidak dapat diproses oleh server.',
        );
        $('reload').hidden = false;
        return;
      }
      state = result.data;
      dirty = false;
      setScope('mutation', false);
      render();
      $('reload').hidden = true;
      publicationMessage(true);
      showToast(
        'success',
        'Project Dihapus',
        'Data project telah disingkirkan dari daftar.',
      );
      $('title').focus();
    } catch (_error) {
      const errText =
        'Koneksi terputus. Muat ulang projects sebelum menghapus lagi untuk memeriksa perubahan terakhir.';
      message(errText, true);
      showToast('error', 'Koneksi Terputus', errText);
      $('reload').hidden = false;
    } finally {
      setBtnLoading($('delete'), false, '', 'Hapus project');
      setScope('mutation', false);
    }
  });
  $('retry').addEventListener('click', async () => {
    if (locked() || scopes.publication) return;
    setScope('publication', true);
    setBtnLoading($('retry'), true, 'Menerbitkan…', 'Coba terbitkan lagi');
    message('Meminta penerbitan ulang…');
    try {
      const result = await rpc('adminRetryPublication');
      if (!result.ok) {
        const errText = errors[result.error.code] || errors.SERVER_ERROR;
        message(errText, true);
        showToast('error', 'Gagal Publikasi', errText);
      } else {
        publicationMessage(false);
        showToast(
          'success',
          'Antrean Rilis',
          'Permintaan build situs telah dikirimkan ke server.',
        );
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
  if ($('logout')) {
    $('logout').addEventListener('click', async () => {
      if (locked() || scopes.logout) return;
      if (
        dirty &&
        !window.confirm('Keluar dan abaikan perubahan yang belum disimpan?')
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
        form.reset();
        $('image-preview').hidden = true;
        $('image-preview').removeAttribute('src');
        $('project-list').replaceChildren();
        expire();
        $('reload').hidden = true;
        const msg = 'Sudah keluar. Masuk lagi untuk mengelola Projects.';
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
    const email = $('login-email');
    if (email) email.focus();
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
        message('Masuk. Memuat projects…');
        showToast(
          'success',
          'Akses Diberikan',
          'Selamat datang di konsol admin.',
        );
        load();
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
      const ws = $('workspace');
      if (ws) ws.hidden = true;
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
