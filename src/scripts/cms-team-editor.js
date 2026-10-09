import { prepareImageForUpload } from './admin-image.js';
(() => {
  const el = (id) => document.getElementById(id);
  const form = el('project-form');
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
    el('status').textContent = text;
    el('status').dataset.error = String(error);
  };
  const setScope = (name, value) => {
    scopes[name] = value;
    applyBusy();
  };
  const applyBusy = () => {
    const writeLocked = locked();
    el('fields').disabled = writeLocked || scopes.upload;
    el('image-upload').disabled = writeLocked || scopes.upload;
    el('save').disabled = writeLocked || scopes.upload;
    el('add').disabled =
      writeLocked ||
      !state ||
      state.groups.every(
        (g) => state.members.filter((m) => m.group === g.id).length >= 8,
      );
    const record = state?.members.find((m) => m.id === selected);
    el('delete').disabled =
      writeLocked ||
      scopes.upload ||
      !record ||
      state.members.filter((m) => m.group === record.group).length <= 1;
    el('retry').disabled = writeLocked || scopes.publication;
    el('reload').disabled = scopes.read;
    el('logout').disabled = scopes.logout || scopes.mutation;
    document
      .querySelectorAll('.project-choice')
      .forEach((choice) => (choice.disabled = writeLocked || scopes.upload));
    el('workspace').setAttribute(
      'aria-busy',
      String(writeLocked || scopes.upload),
    );
  };
  const expire = () => {
    el('workspace').hidden = true;
    el('logout').hidden = true;
    el('login').hidden = false;
    el('retry').hidden = true;
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
      el('login').hidden = true;
      el('logout').hidden = false;
    }
    return result;
  };
  const preview = () => {
    const photo = el('image').value;
    const image = el('image-preview');
    if (['marchel', 'zidan-rose'].includes(photo))
      image.src = '/images/team/' + photo + '.webp';
    else if (/^\/images\/cms\/team\/[a-f0-9]{64}\.webp$/.test(photo))
      image.src =
        '/api/admin/media?collection=team&image=' + encodeURIComponent(photo);
    else {
      image.removeAttribute('src');
      image.hidden = true;
      return;
    }
    image.hidden = false;
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
    const group = el('group').value || 'leader';
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
    el('editor-title').textContent = id ? 'Isi anggota' : 'Anggota baru';
    for (const key of ['group', 'name', 'role', 'order'])
      el(key).value = record[key];
    el('image').value = record.photo;
    el('image-upload').value = '';
    document
      .querySelectorAll('.project-choice')
      .forEach((b) =>
        b.setAttribute('aria-current', String(b.dataset.id === id)),
      );
    applyBusy();
    preview();
    return true;
  };
  const render = () => {
    el('project-list').replaceChildren();
    el('group').replaceChildren();
    state.groups.forEach((group) => {
      const option = document.createElement('option');
      option.value = group.id;
      option.textContent = group.title;
      el('group').append(option);
      const title = document.createElement('p');
      title.textContent = group.title;
      el('project-list').append(title);
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
          el('project-list').append(button);
        });
    });
    el('image').replaceChildren();
    state.photoPresets.forEach((photo, i) => {
      const option = document.createElement('option');
      option.value = photo;
      option.textContent =
        photo === 'marchel'
          ? 'Preset Marchel'
          : photo === 'zidan-rose'
            ? 'Preset Zidan / Rose'
            : 'Foto upload ' + (i + 1);
      el('image').append(option);
    });
    el('workspace').hidden = false;
    choose(
      state.members.some((m) => m.id === selected)
        ? selected
        : state.members[0].id,
    );
  };
  // Save returns before the background publish hook resolves (waitUntil), so
  // there is no synchronous accepted result; keep retry available as recovery.
  const publication = () => {
    el('retry').hidden = false;
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
        el('reload').hidden = false;
        return;
      }
      state = result.data;
      dirty = false;
      setScope('read', false);
      render();
      el('reload').hidden = true;
      el('retry').hidden = !state.publicationPending;
      message(
        state.publicationPending
          ? 'Ada perubahan tersimpan yang belum berhasil diterbitkan. Klik Coba terbitkan lagi.'
          : 'Pilih anggota yang ingin diubah.',
      );
    } catch {
      message('Koneksi terputus. Muat ulang Team untuk mencoba lagi.', true);
      el('reload').hidden = false;
    } finally {
      setScope('read', false);
    }
  };
  form.addEventListener('input', () => (dirty = true));
  form.addEventListener('change', () => (dirty = true));
  el('image').addEventListener('change', preview);
  el('add').addEventListener('click', () => {
    if (choose(null)) {
      dirty = true;
      el('name').focus();
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
        el('reload').hidden = false;
        return;
      }
      state = result.data;
      selected = result.data.affectedId;
      dirty = false;
      setScope('mutation', false);
      render();
      el('reload').hidden = true;
      publication();
    } catch {
      message(
        'Koneksi terputus. Muat ulang Team sebelum mengulang untuk memeriksa data tersimpan.',
        true,
      );
      el('reload').hidden = false;
    } finally {
      setScope('mutation', false);
    }
  };
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (locked() || !form.reportValidity()) return;
    const member = {
      ...(selected ? { id: selected } : {}),
      group: el('group').value,
      name: el('name').value,
      role: el('role').value,
      order: Number(el('order').value),
      photo: el('image').value,
    };
    void mutate(selected ? 'save' : 'add', { member });
  });
  el('delete').addEventListener('click', () => {
    if (locked() || !selected) return;
    const member = state.members.find((m) => m.id === selected);
    if (
      confirm('Hapus anggota “' + member.name + '”? Situs akan dibangun ulang.')
    )
      void mutate('delete', { id: selected });
  });
  el('retry').addEventListener('click', async () => {
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
  el('reload').addEventListener('click', load);
  el('image-upload').addEventListener('change', async () => {
    const file = el('image-upload').files[0];
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
      if (![...el('image').options].some((o) => o.value === photo)) {
        const option = document.createElement('option');
        option.value = photo;
        option.textContent = 'Foto yang baru diupload';
        el('image').append(option);
      }
      el('image').value = photo;
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
      el('image-upload').value = '';
      setScope('upload', false);
    }
  });
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
          !confirm(
            'Perubahan belum disimpan. Tinggalkan halaman dan abaikan perubahan?',
          )
        )
          event.preventDefault();
      }),
    );
  el('logout').addEventListener('click', async () => {
    if (locked() || scopes.logout) return;
    if (dirty && !confirm('Keluar dan abaikan perubahan yang belum disimpan?'))
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
      el('project-list').replaceChildren();
      el('image-preview').removeAttribute('src');
      el('image-preview').hidden = true;
      expire();
      message('Sudah keluar. Masuk lagi untuk mengelola Team.');
    } catch {
      message('Koneksi terputus. Coba keluar lagi.', true);
    } finally {
      setScope('logout', false);
    }
  });
  const loginForm = el('login-form');
  const showLogin = () => {
    loginForm.hidden = false;
    el('login').hidden = true;
    el('login-email').focus();
  };
  el('login').addEventListener('click', showLogin);
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (scopes.logout) return;
    const submit = el('login-submit');
    const email = el('login-email').value.trim();
    const password = el('login-password').value;
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
      el('login-password').value = '';
      loginForm.hidden = true;
      message('Masuk. Memuat Team…');
      void load();
    } catch {
      message('Koneksi terputus. Coba masuk lagi.', true);
    } finally {
      submit.disabled = false;
    }
  });
  void load();
})();
