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
  const message = (text, error = false) => {
    $('status').textContent = text;
    $('status').dataset.error = String(error);
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
  const preview = () => {
    const image = $('image').value;
    const element = $('image-preview');
    element.hidden = !image;
    if (/^\/images\/cms\/projects\/[a-f0-9]{64}\.webp$/.test(image)) {
      element.src = '/api/admin/media?image=' + encodeURIComponent(image);
    } else if (
      /^\/images\/[a-zA-Z0-9_.\/-]+$/.test(image) &&
      !image.includes('..')
    ) {
      element.src = image;
    } else {
      element.removeAttribute('src');
      element.hidden = true;
    }
  };
  const expire = () => {
    $('workspace').hidden = true;
    if ($('logout')) $('logout').hidden = true;
    if ($('login')) $('login').hidden = false;
    $('retry').hidden = true;
    $('reload').hidden = false;
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
  };
  const render = () => {
    $('project-list').replaceChildren();
    state.projects.forEach((project) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'project-choice';
      button.dataset.id = project.id;
      button.textContent = project.title;
      button.addEventListener('click', () => choose(project.id));
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
    } catch (_error) {
      message(
        'Koneksi terputus. Muat ulang projects untuk mencoba lagi.',
        true,
      );
      $('reload').hidden = false;
    } finally {
      setScope('read', false);
    }
  };
  $('image').addEventListener('change', preview);
  $('image-upload').addEventListener('change', async () => {
    const file = $('image-upload').files[0];
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
          'Gambar tidak bisa dibaca. Coba JPG, PNG atau WebP lain.',
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
      if (![...$('image').options].some((option) => option.value === image)) {
        const option = document.createElement('option');
        option.value = image;
        option.textContent = 'Gambar yang baru diupload';
        $('image').append(option);
      }
      $('image').value = image;
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
    message('Menyimpan dan meminta penerbitan…');
    try {
      const result = await rpc(
        selected ? 'adminSaveProject' : 'adminAddProject',
        { project, revision: state.revision },
      );
      if (!result.ok) {
        message(errors[result.error.code] || errors.SERVER_ERROR, true);
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
    } catch (_error) {
      message(
        'Koneksi terputus. Muat ulang projects sebelum menyimpan lagi untuk memeriksa perubahan terakhir.',
        true,
      );
      $('reload').hidden = false;
    } finally {
      setScope('mutation', false);
    }
  });
  $('add').addEventListener('click', () => {
    if (locked() || state.projects.length >= state.maxProjects) return;
    choose(null);
    if (selected === null) {
      dirty = true;
      $('title').focus();
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
    message('Menghapus dan meminta penerbitan…');
    try {
      const result = await rpc('adminDeleteProject', {
        id: selected,
        revision: state.revision,
      });
      if (!result.ok) {
        message(errors[result.error.code] || errors.SERVER_ERROR, true);
        $('reload').hidden = false;
        return;
      }
      state = result.data;
      dirty = false;
      setScope('mutation', false);
      render();
      $('reload').hidden = true;
      publicationMessage(true);
      $('title').focus();
    } catch (_error) {
      message(
        'Koneksi terputus. Muat ulang projects sebelum menghapus lagi untuk memeriksa perubahan terakhir.',
        true,
      );
      $('reload').hidden = false;
    } finally {
      setScope('mutation', false);
    }
  });
  $('retry').addEventListener('click', async () => {
    if (locked() || scopes.publication) return;
    setScope('publication', true);
    message('Meminta penerbitan ulang…');
    try {
      const result = await rpc('adminRetryPublication');
      if (!result.ok)
        message(errors[result.error.code] || errors.SERVER_ERROR, true);
      else publicationMessage(false);
    } catch {
      message('Koneksi terputus. Coba terbitkan lagi.', true);
    } finally {
      setScope('publication', false);
    }
  });
  $('reload').addEventListener('click', load);
  if ($('logout')) {
    $('logout').addEventListener('click', async () => {
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
        $('image-preview').hidden = true;
        $('image-preview').removeAttribute('src');
        $('project-list').replaceChildren();
        expire();
        $('reload').hidden = true;
        message('Sudah keluar. Masuk lagi untuk mengelola Projects.');
      } catch {
        message('Koneksi terputus. Coba keluar lagi.', true);
      } finally {
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
      if (submit) submit.disabled = true;
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
        $('login-password').value = '';
        loginForm.hidden = true;
        message('Masuk. Memuat projects…');
        load();
      } catch {
        message('Koneksi terputus. Coba masuk lagi.', true);
      } finally {
        if (submit) submit.disabled = false;
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
