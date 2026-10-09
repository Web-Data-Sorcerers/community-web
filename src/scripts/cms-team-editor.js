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
  const load = async () => {
    if (locked() || scopes.read) return;
    if (
      dirty &&
      !confirm('Muat ulang dan abaikan perubahan yang belum disimpan?')
    )
      return;
    setScope('read', true);
    message('Memuat Team…');
    try {
      const result = await rpc('load');
      if (!result.ok) {
        message(messages[result.error.code] || messages.SERVER_ERROR, true);
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
    } catch {
      message('Koneksi terputus. Muat ulang Team untuk mencoba lagi.', true);
      $('reload').hidden = false;
    } finally {
      setScope('read', false);
    }
  };
  form.addEventListener('input', () => (dirty = true));
  form.addEventListener('change', () => (dirty = true));
  $('image').addEventListener('change', preview);
  $('add').addEventListener('click', () => {
    if (choose(null)) {
      dirty = true;
      $('name').focus();
    }
  });
  const mutate = async (operation, payload) => {
    setScope('mutation', true);
    message('Menyimpan dan meminta penerbitan…');
    try {
      const result = await rpc(operation, {
        ...payload,
        revision: state.revision,
      });
      if (!result.ok) {
        message(messages[result.error.code] || messages.SERVER_ERROR, true);
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
    } catch {
      message(
        'Koneksi terputus. Muat ulang Team sebelum mengulang untuk memeriksa data tersimpan.',
        true,
      );
      $('reload').hidden = false;
    } finally {
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
    try {
      const result = await rpc('retry');
      if (result.ok) publication();
      else message(messages[result.error.code] || messages.SERVER_ERROR, true);
    } catch {
      message('Koneksi terputus. Coba terbitkan lagi.', true);
    } finally {
      setScope('publication', false);
    }
  });
  $('reload').addEventListener('click', load);
  $('image-upload').addEventListener('change', async () => {
    const file = $('image-upload').files[0];
    if (!file || locked() || scopes.upload) return;
    setScope('upload', true);
    message('Menyiapkan foto…');
    try {
      const prepared = await prepareImageForUpload(file);
      if (prepared.error === 'type') {
        message('Pilih JPG, PNG atau WebP.', true);
        return;
      }
      if (prepared.error === 'decode') {
        message(
          'Foto tidak bisa dibaca. Coba file JPG, PNG atau WebP lain.',
          true,
        );
        return;
      }
      if (prepared.error === 'size') {
        message(
          'Foto terlalu besar untuk diunggah. Coba gambar yang lebih kecil.',
          true,
        );
        return;
      }
      message(
        prepared.converted
          ? 'Foto dikecilkan otomatis agar sesuai batas. Mengupload…'
          : 'Mengupload foto…',
      );
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
        return;
      }
      if (
        !result.ok ||
        !/^\/images\/cms\/team\/[a-f0-9]{64}\.webp$/.test(result.data?.image)
      ) {
        message(
          result.error?.code === 'INVALID_INPUT'
            ? 'Gambar tidak didukung server. Coba JPG, PNG atau WebP lain.'
            : 'Foto belum berhasil diupload. Coba lagi.',
          true,
        );
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
      message(
        'Foto siap. Klik Simpan dan terbitkan untuk memakai foto di situs.',
      );
    } catch {
      message(
        'Koneksi upload terputus. Anggota belum disimpan. Pilih foto lagi.',
        true,
      );
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
        selected = undefined;
        form.reset();
        $('project-list').replaceChildren();
        $('image-preview').removeAttribute('src');
        $('image-preview').hidden = true;
        expire();
        message('Sudah keluar. Masuk lagi untuk mengelola Team.');
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
        message('Masuk. Memuat Team…');
        void load();
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
