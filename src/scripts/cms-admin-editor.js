import { prepareImageForUpload } from './admin-image.js';
(() => {
  const byId = (id) => document.getElementById(id);
  const form = byId('project-form');
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
  const message = (text, error = false) => {
    byId('status').textContent = text;
    byId('status').dataset.error = String(error);
  };
  const setScope = (name, value) => {
    scopes[name] = value;
    applyBusy();
  };
  const applyBusy = () => {
    const writeLocked = locked();
    byId('fields').disabled = writeLocked || scopes.upload;
    byId('image-upload').disabled = writeLocked || scopes.upload;
    byId('save').disabled = writeLocked || scopes.upload;
    byId('add').disabled =
      writeLocked ||
      scopes.upload ||
      !state ||
      state.projects.length >= state.maxProjects;
    byId('delete').disabled =
      writeLocked ||
      scopes.upload ||
      !selected ||
      !state ||
      state.projects.length <= state.minProjects;
    byId('retry').disabled = writeLocked || scopes.publication;
    byId('reload').disabled = scopes.read;
    byId('logout').disabled = scopes.logout || scopes.mutation;
    document
      .querySelectorAll('.project-choice')
      .forEach((choice) => (choice.disabled = writeLocked || scopes.upload));
    byId('workspace').setAttribute(
      'aria-busy',
      String(writeLocked || scopes.upload),
    );
  };
  let csrf;
  const preview = () => {
    const image = byId('image').value;
    const element = byId('image-preview');
    element.hidden = !image;
    if (/^\/images\/cms\/projects\/[a-f0-9]{64}\.webp$/.test(image)) {
      element.src = '/api/admin/media?image=' + encodeURIComponent(image);
    } else if (
      /^\/images\/[a-zA-Z0-9_./-]+$/.test(image) &&
      !image.includes('..')
    )
      element.src = image;
    else {
      element.removeAttribute('src');
      element.hidden = true;
    }
  };
  const expire = () => {
    byId('workspace').hidden = true;
    byId('logout').hidden = true;
    byId('login').hidden = false;
    byId('retry').hidden = true;
    byId('reload').hidden = false;
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
      byId('login').hidden = true;
      byId('logout').hidden = false;
    }
    return result;
  };
  const choose = (id) => {
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
    byId('editor-title').textContent = id ? 'Isi project' : 'Project baru';
    byId('title').value = record.title;
    byId('description').value = record.description;
    byId('tag-one').value = record.tags[0];
    byId('tag-two').value = record.tags[1];
    byId('image').value = record.image;
    byId('image-upload').value = '';
    preview();
    document
      .querySelectorAll('.project-choice')
      .forEach((button) =>
        button.setAttribute('aria-current', String(button.dataset.id === id)),
      );
    applyBusy();
  };
  const render = () => {
    byId('project-list').replaceChildren();
    state.projects.forEach((project) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'project-choice';
      button.dataset.id = project.id;
      button.textContent = project.title;
      button.addEventListener('click', () => choose(project.id));
      byId('project-list').append(button);
    });
    byId('image').replaceChildren();
    state.imagePresets.forEach((image, index) => {
      const option = document.createElement('option');
      option.value = image;
      option.textContent = image.startsWith('/images/cms/projects/')
        ? 'Gambar upload ' + (index + 1)
        : 'Gambar ' + (index + 1);
      byId('image').append(option);
    });
    byId('workspace').hidden = false;
    choose(
      state.projects.some((project) => project.id === selected)
        ? selected
        : state.projects[0].id,
    );
  };
  // The save response returns before the publish hook resolves (the hook runs
  // in the background via waitUntil), so there is no synchronous `accepted`
  // result. Keep the retry button available to recover a missed rebuild.
  const publicationMessage = (saved) => {
    byId('retry').hidden = false;
    message(
      (saved ? 'Perubahan tersimpan. ' : '') +
        'Penerbitan dimulai di belakang layar. Tunggu beberapa menit sebelum memeriksa situs.',
    );
  };
  const load = async () => {
    if (locked() || scopes.read) return;
    if (
      dirty &&
      !window.confirm('Muat ulang dan abaikan perubahan yang belum disimpan?')
    )
      return;
    setScope('read', true);
    message('Memuat projects…');
    try {
      const result = await rpc('adminLoadProjects');
      if (!result.ok) {
        message(errors[result.error.code] || errors.SERVER_ERROR, true);
        byId('reload').hidden = false;
        return;
      }
      state = result.data;
      dirty = false;
      setScope('read', false);
      render();
      byId('reload').hidden = true;
      byId('retry').hidden = !state.publicationPending;
      message(
        state.publicationPending
          ? 'Ada perubahan tersimpan yang belum berhasil diterbitkan. Klik Coba terbitkan lagi.'
          : 'Pilih project yang ingin diubah.',
      );
    } catch (_error) {
      message(
        'Koneksi terputus. Muat ulang projects untuk mencoba lagi.',
        true,
      );
      byId('reload').hidden = false;
    } finally {
      setScope('read', false);
    }
  };
  byId('image').addEventListener('change', preview);
  byId('image-upload').addEventListener('change', async () => {
    const file = byId('image-upload').files[0];
    if (!file || locked() || scopes.upload) return;
    setScope('upload', true);
    message('Menyiapkan gambar…');
    try {
      const prepared = await prepareImageForUpload(file);
      if (prepared.error === 'type') {
        message('Pilih JPG, PNG atau WebP.', true);
        return;
      }
      if (prepared.error === 'decode') {
        message(
          'Gambar tidak bisa dibaca. Coba file JPG, PNG atau WebP lain.',
          true,
        );
        return;
      }
      if (prepared.error === 'size') {
        message(
          'Gambar terlalu besar untuk diunggah. Coba gambar yang lebih kecil.',
          true,
        );
        return;
      }
      message(
        prepared.converted
          ? 'Gambar dikecilkan otomatis agar sesuai batas. Mengupload…'
          : 'Mengupload gambar…',
      );
      const response = await fetch('/api/admin/media', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': prepared.type, 'X-CSRF-Token': csrf },
        body: prepared.blob,
      });
      const result = await response.json();
      if (result.error?.code === 'UNAUTHORIZED') {
        expire();
        return;
      }
      if (
        !result.ok ||
        !/^\/images\/cms\/projects\/[a-f0-9]{64}\.webp$/.test(
          result.data?.image || '',
        )
      ) {
        message(
          result.error?.code === 'INVALID_INPUT'
            ? 'Gambar tidak didukung server. Coba JPG, PNG atau WebP lain.'
            : 'Gambar belum berhasil diupload. Coba lagi.',
          true,
        );
        return;
      }
      const image = result.data.image;
      if (
        ![...byId('image').options].some((option) => option.value === image)
      ) {
        const option = document.createElement('option');
        option.value = image;
        option.textContent = 'Gambar yang baru diupload';
        byId('image').append(option);
      }
      byId('image').value = image;
      dirty = true;
      preview();
      message(
        'Gambar siap. Klik Simpan dan terbitkan untuk memakai gambar ini di situs.',
      );
    } catch {
      message(
        'Koneksi upload terputus. Project belum disimpan. Pilih gambar lagi untuk mencoba ulang.',
        true,
      );
    } finally {
      byId('image-upload').value = '';
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
      title: byId('title').value,
      description: byId('description').value,
      tags: [byId('tag-one').value, byId('tag-two').value],
      image: byId('image').value,
    };
    setScope('mutation', true);
    message('Menyimpan dan meminta penerbitan…');
    try {
      const result = await rpc(
        selected ? 'adminSaveProject' : 'adminAddProject',
        {
          project,
          revision: state.revision,
        },
      );
      if (!result.ok) {
        message(errors[result.error.code] || errors.SERVER_ERROR, true);
        byId('reload').hidden = false;
        return;
      }
      state = result.data;
      selected = result.data.affectedId;
      dirty = false;
      setScope('mutation', false);
      render();
      byId('reload').hidden = true;
      publicationMessage(true);
    } catch (_error) {
      message(
        'Koneksi terputus. Muat ulang projects sebelum menyimpan lagi untuk memeriksa perubahan terakhir.',
        true,
      );
      byId('reload').hidden = false;
    } finally {
      setScope('mutation', false);
    }
  });
  byId('add').addEventListener('click', () => {
    if (locked() || state.projects.length >= state.maxProjects) return;
    choose(null);
    if (selected === null) {
      dirty = true;
      byId('title').focus();
    }
  });
  byId('delete').addEventListener('click', async () => {
    if (locked() || !selected || state.projects.length <= state.minProjects)
      return;
    const record = state.projects.find((project) => project.id === selected);
    if (
      !window.confirm(
        'Hapus project “' + record.title + '”? Situs akan dibangun ulang.',
      )
    )
      return;
    setScope('mutation', true);
    message('Menghapus dan meminta penerbitan…');
    try {
      const result = await rpc('adminDeleteProject', {
        id: selected,
        revision: state.revision,
      });
      if (!result.ok) {
        message(errors[result.error.code] || errors.SERVER_ERROR, true);
        byId('reload').hidden = false;
        return;
      }
      state = result.data;
      dirty = false;
      setScope('mutation', false);
      render();
      byId('reload').hidden = true;
      publicationMessage(true);
      byId('title').focus();
    } catch (_error) {
      message(
        'Koneksi terputus. Muat ulang projects sebelum menghapus lagi untuk memeriksa perubahan terakhir.',
        true,
      );
      byId('reload').hidden = false;
    } finally {
      setScope('mutation', false);
    }
  });
  byId('retry').addEventListener('click', async () => {
    if (locked() || scopes.publication) return;
    setScope('publication', true);
    message('Meminta penerbitan ulang…');
    try {
      const result = await rpc('adminRetryPublication');
      if (!result.ok)
        message(errors[result.error.code] || errors.SERVER_ERROR, true);
      else publicationMessage(false);
    } catch (_error) {
      message('Koneksi terputus. Coba terbitkan lagi.', true);
    } finally {
      setScope('publication', false);
    }
  });
  byId('reload').addEventListener('click', load);
  window.addEventListener('beforeunload', (event) => {
    if (dirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
  document
    .querySelectorAll('.admin-navigation a, .auth-actions a')
    .forEach((link) =>
      link.addEventListener('click', (event) => {
        if (
          dirty &&
          !window.confirm(
            'Perubahan belum disimpan. Tinggalkan halaman dan abaikan perubahan?',
          )
        )
          event.preventDefault();
      }),
    );
  byId('logout').addEventListener('click', async () => {
    if (locked() || scopes.logout) return;
    if (
      dirty &&
      !window.confirm('Keluar dan abaikan perubahan yang belum disimpan?')
    )
      return;
    setScope('logout', true);
    try {
      const response = await fetch('/api/admin/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'X-CSRF-Token': csrf },
      });
      if (!response.ok) {
        message('Belum bisa keluar. Coba lagi.', true);
        return;
      }
      dirty = false;
      state = undefined;
      form.reset();
      byId('image-preview').hidden = true;
      byId('image-preview').removeAttribute('src');
      byId('project-list').replaceChildren();
      expire();
      byId('reload').hidden = true;
      message('Sudah keluar. Masuk lagi untuk mengelola Projects.');
    } catch {
      message('Koneksi terputus. Coba keluar lagi.', true);
    } finally {
      setScope('logout', false);
    }
  });
  const loginForm = byId('login-form');
  const showLogin = () => {
    loginForm.hidden = false;
    byId('login').hidden = true;
    const email = byId('login-email');
    email.focus();
  };
  byId('login').addEventListener('click', showLogin);
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (scopes.logout) return;
    const submit = byId('login-submit');
    const email = byId('login-email').value.trim();
    const password = byId('login-password').value;
    if (!email || !password) return;
    submit.disabled = true;
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        message(
          result.error?.code === 'FORBIDDEN'
            ? 'Akun ini tidak punya akses owner.'
            : 'Login belum berhasil. Periksa email dan kata sandi.',
          true,
        );
        return;
      }
      byId('login-password').value = '';
      loginForm.hidden = true;
      message('Masuk. Memuat projects…');
      load();
    } catch {
      message('Koneksi terputus. Coba masuk lagi.', true);
    } finally {
      submit.disabled = false;
    }
  });
  if (new URL(location.href).searchParams.has('login')) {
    message(
      new URL(location.href).searchParams.get('login') === 'unavailable'
        ? 'Login admin belum aktif. Hubungi pengelola situs.'
        : 'Login belum berhasil. Gunakan akun owner atau hubungi pengelola situs.',
      true,
    );
    history.replaceState(null, '', '/admin/');
    showLogin();
  } else load();
})();
