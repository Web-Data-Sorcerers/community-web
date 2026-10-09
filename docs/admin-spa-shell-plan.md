# Admin SPA shell (Opsi 2 Varian A) — master plan

8 Oct 2026. Owner meminta **Opsi 2**: dashboard admin jadi satu halaman dengan
tab internal (Projects / Team / Pendaftar) supaya pindah tab **tidak** fetch ulang
seluruh data tiap kali. Plan ini **PLAN ONLY**; belum implementasi, belum sentuh
kode, belum deploy.

Konteks: live `c7b82e1` (background publish). Dokumen terkait:
[performance plan](admin-performance-feedback-plan.md),
[unified admin plan](admin-unified-recruitment-plan.md).

## 1. Masalah dan tujuan

Sekarang `/admin/`, `/admin/team/`, `/admin/recruitment/` adalah **3 halaman
Astro terpisah**. Pindah tab = navigasi URL baru → script modul baru jalan →
fetch data dari server lagi. Session (cookie) tetap, tapi **state di memori
browser hilang** setiap pindah.

**Tujuan:** pindah tab antar modul admin terasa instan setelah pertama kali
dibuka; state (data list/editor/filter) bertahan selama sesi halaman admin.
Tidak mengubah auth/CSRF/ACL/audit/kontrak server/RPC. Tidak mengubah UI publik.

**Bukan tujuan:** rewrite total admin (Varian B — ditolak sebagai default).
Tidak mengubah endpoint server. Tidak mengubah aturan privasi PII.

## 2. Temuan source (read-only, sesi ini)

| Surface          | Bukti                                                                                                     | Implikasi                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Routes           | `src/pages/admin/{index,team,recruitment}.astro`                                                          | 3 halaman terpisah, tiap file 640/654/923 baris                        |
| Nav              | `src/components/admin/AdminNavigation.astro`                                                              | 3 link `<a href>`; aktif via `aria-current="page"`                     |
| Script wiring    | Tiap page `import '../../scripts/<module>.js'` di `<script>` akhir body                                   | satu modul = satu entry script                                         |
| Lifecycle        | `cms-admin-editor.js` / `cms-team-editor.js` = IIFE auto-run; `recruitment-admin.js` = `DOMContentLoaded` | **tidak** pakai `astro:page-load`; tiap navigasi = full page + re-init |
| Draft guard      | Ketiganya punya `beforeunload` saat ada draft                                                             | harus dipertahankan di SPA                                             |
| URL handling     | `cms-admin-editor.js` `history.replaceState(null,'','/admin/')`                                           | perlu dikoordinasi dengan router tab                                   |
| Auth             | `createAdminHandler` + `server/cms-auth.mjs`                                                              | per-request, tidak berubah                                             |
| Server endpoints | `/api/admin/{projects,team,media}`, `/api/admin/recruitment/*`                                            | tidak berubah                                                          |

Semua script modul saat ini **self-contained**: punya `byId`/`el` helper, state
`let state/selected/csrf`, handler DOM, dan entry `load()`/`init()`. Tidak ada
dependency silang antar modul.

## 3. Desain Varian A — "SPA shell + keep-alive panel"

Satu route `/admin/` yang menampung **tiga panel hidden**; tab cuma
menampilkan/menyembunyikan panel. Panel **dimount saat pertama dibuka** lalu
**tetap hidup** (keep-alive); state & DOM-nya tidak dihancurkan saat pindah tab.

```
/admin/   (satu dokumen)
├── <AdminNavigation>  (tab: Projects | Team | Pendaftar)
└── #admin-panels
    ├── section#panel-projects    [data-panel]
    ├── section#panel-team        [data-panel]
    └── section#panel-recruitment [data-panel]
    (hanya satu yang tampil; sisanya hidden)
```

**Alur:**

1. Buka `/admin/` → panel Projects aktif & di-load (default).
2. Klik Team → kalau **belum pernah** dibuka: tampilkan skeleton + mount + load
   (loading sekali). Setelah itu panel Team **disimpan**.
3. Pindah balik Projects → panel Projects masih utuh di DOM (instan).
4. Klik Team lagi → instan (tidak fetch ulang).

**Kontrak keep-alive:** tiap panel = modul yang di-init **sekali** dan punya
API lifecycle eksplisit `mount(host)` / `show()` / `hide()` / (opsional)
`refresh()`. Data tetap selama dokumen hidup; refresh manual lewat tombol
"Muat ulang" existing.

## 4. Strategi migrasi (menghindari rewrite besar)

Modul JS existing **tidak ditulis ulang**. Pendekatan:

1. **Pisahkan struktur HTML tiap page jadi komponen panel** (Astro component),
   e.g. `src/components/admin/AdminProjectsPanel.astro`,
   `AdminTeamPanel.astro`, `AdminRecruitmentPanel.astro`. Isinya = markup
   existing (dipindah apa adanya dari 3 page).

2. **Satu script koordinator shell** `src/scripts/admin-shell.js`:
   - render tab aktif, toggle `hidden` per panel
   - mount panel saat pertama dipilih (`import()` dinamis modul modul)
   - simpan instance/pernah-mount di Map
   - manage `history` + hash deep-link (`#projects`/`#team`/`#recruitment`)
   - guard `beforeunload` terpusat (kalau ada panel dirty)
   - koordinasi logout (semua panel direset saat 401/logout)

3. **Modul existing di-wrap jadi API** tanpa mengubah logic inti:
   - `cms-admin-editor.js` → export `{ mount(root), show(), hide(), isDirty(), teardown() }`
   - `cms-team-editor.js` → idem
   - `recruitment-admin.js` → idem
   - Helper `byId` diubah supaya scope ke `root` panel (bukan `document`) — agar
     3 panel tidak tabrakan id. **Ini perubahan paling berisiko** dan harus
     diuji ketat (lihat §6).

   Catatan: saat ini ketiga modul punya **id DOM yang berbeda** (Projects vs
   Team vs Pendaftar), jadi kebanyakan `getElementById` aman. Yang perlu dicek:
   elemen generik (`#status`, `#login`, `#logout`, `#workspace`) — harus
   dipastikan tidak bertabrakan antar panel. Kalau bertabrakan → scope ke panel.

4. **URL/routing:**
   - `/admin/` = Projects (default)
   - `/admin/team/` & `/admin/recruitment/` tetap **valid** untuk deep-link &
     bookmarks; shell membaca path/hash awal untuk memilih tab awal. Untuk
     kompatibilitas, boleh redirect ringan `/admin/team/` → `/admin/#team`
     (atau shell langsung memilih panel tanpa redirect). Keputusan detail §7.
   - Nav link memakai `href` + intercept klik → ganti panel tanpa full reload
     (`history.pushState`), tapi tetap bisa di-`Cmd+Click` buka tab baru.

## 5. File change map

**Baru:**

- `src/scripts/admin-shell.js` — koordinator tab/panel/history/dirty-guard.
- `src/components/admin/AdminProjectsPanel.astro`
- `src/components/admin/AdminTeamPanel.astro`
- `src/components/admin/AdminRecruitmentPanel.astro`

**Diubah:**

- `src/pages/admin/index.astro` — jadi shell (nav + 3 panel + login overlay),
  import `admin-shell.js`. Markup panel dari 3 page digabung.
- `src/pages/admin/team.astro` & `recruitment.astro` — jadi shim/deep-link ke
  shell (route tetap valid). Pilihan: redirect ke `/admin/#...` atau render
  shell yang sama dengan tab awal terpilih.
- `src/scripts/cms-admin-editor.js`, `cms-team-editor.js`, `recruitment-admin.js`
  — ekspor lifecycle API + scoped-`byId`; logic inti tak berubah.
- `src/components/admin/AdminNavigation.astro` — link jadi tab-aware
  (aria-current dari state, bukan dari halaman), intercept klik.

**Tidak berubah:** server (`cms-admin.mjs`, `recruitment-admin.mjs`,
`cms-auth.mjs`, `cms-media.mjs`), RPC/SQL, ACL/audit, endpoint, dependency,
UI publik, snapshot.

## 6. QA / test matrix

Automasi existing harus tetap hijau:

- `test:cms`, `test:recruitment` (kontrak server tak berubah).
- Mock browser: `verify:cms-native-admin`, `verify:cms-team-admin`,
  `verify:recruitment-review` → sesuaikan ke shell (tab + keep-alive).

Tambahan QA baru (mock HTTP, `CMS_DATA_SOURCE=local`):

1. Buka `/admin/` → Projects tampil, tab aktif benar.
2. Klik Team → load sekali; pindah balik Projects → **tanpa fetch list baru**
   (hitung request `/api/admin/projects` = tetap 1).
3. Klik Pendaftar → load; balik Team → instan (tanpa fetch `/api/admin/team`).
4. Deep-link `/admin/team/` (dan `/#team`) → tab Team terpilih.
5. `Cmd+Click` tab → buka dokumen baru (bukan intercept).
6. Dirty draft di Projects + coba pindah tab → konfirmasi sebelum meninggalkan
   panel (atau tampilkan indikator draft). `beforeunload` tetap saat tutup tab.
7. Logout dari salah satu panel → semua panel di-reset + login overlay muncul;
   request anonymous berikutnya 401.
8. 401 di tengah sesi (mock) → semua panel expire bersih.
9. 320/390/768/1440: tab shell tidak overflow, focus/keyboard OK, panel toggle
   benar.
10. Upload/save/retry/conflict per modul tetap bekerja seperti sebelum SPA.
11. `verify:vt`/`ClientRouter` — pastikan shell tidak dobel-init saat navigasi
    balik ke `/admin/` (kalau pakai ClientRouter).

Regresi wajib:

- `npm run build` 0 error, `test:*` PASS.
- Snapshot `4345f1…4857` tetap; HTML publik byte-identik; hanya HTML admin
  berubah.
- `verify:visual` exit 0 `browserErrors: []`; navbar/seo/spacing PASS.
- Secrets 0 di dist.

## 7. Keputusan owner (FINAL — 8 Oct 2026)

Owner memilih **semua rekomendasi** ("pakai semua rekomendasi gw"). Jadi:

1. **URL deep-link:** `/admin/team/` & `/admin/recruitment/` dipertahankan
   sebagai **alias tab** via `history.pushState`/hash `#team`/`#recruitment`;
   **tanpa redirect**. Bookmark & deep-link lama tetap valid; route lama harus
   tetap 200 dan memilih panel yang benar.
2. **Keep-alive scope:** semua panel tetap hidup **selama dokumen hidup**
   (satu sesi halaman). Tidak ada auto-reset berbasis waktu; tombol "Muat ulang"
   per panel tetap ada untuk pengambilan data fresh manual.
3. **Dirty-guard lintas tab:** **konfirmasi** saat ada draft belum disimpan lalu
   pindah panel (perilaku sama seperti `beforeunload` sekarang). `beforeunload`
   tetap aktif saat menutup/refresh dokumen.
4. **PII Pendaftar:** keep-alive **hanya di memori dokumen**; **tidak ada**
   cache storage persisten (`localStorage`/`sessionStorage`/IndexedDB) untuk
   jawaban pendaftar. Reset total saat reload/close/logout/401.

Keputusan ini **mengikat** eksekutor; tidak perlu tanya owner lagi kecuali
muncul trade-off teknis baru di luar §7.

## 8. Risiko dan mitigasi

| Risiko                         | Mitigasi                                                                                                         |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Tabrakan id DOM antar panel    | audit id unik per panel sebelum mount; scope `byId`                                                              |
| Logic CSRF/login terpanggil 3x | satu koordinator auth; panel minta CSRF lewat helper bersama atau tetap per-panel (per-request auth tak berubah) |
| Draft hilang saat pindah tab   | dirty-guard + konfirmasi; `beforeunload` dipertahankan                                                           |
| PII Pendaftar ikut "tersimpan" | keep-alive hanya memori dokumen; tidak ada storage persisten                                                     |
| View Transition double-init    | shell pakai guard `astro:page-load`/`data-mounted`                                                               |
| Deep-link/bookmark rusak       | route lama tetap valid (alias tab)                                                                               |
| Regresi admin stabil           | QA matrix §6 + mock existing; satu pass fokus, tidak digabung fitur lain                                         |

## 9. Rollback

Semua perubahan **client-side** (Astro page/komponen/script). Tidak ada
SQL/env/schema/dependency server baru. Rollback = `git revert` commit → deploy
ulang; route lama tetap tersedia sepanjang migrasi (kalau dipilih pendekatan
alias). Tidak ada migrasi data.

## 10. Definisi selesai (DoD)

1. Owner setuju plan + keputusan §7.
2. `admin-shell.js` + 3 panel komponen + 3 modul di-wrap lifecycle.
3. QA matrix §6 PASS (mock + regresi).
4. Build 0 error; `test:cms`/`test:recruitment` PASS; snapshot/publik parity.
5. verify mock admin + recruitment-review PASS 4 widths.
6. verify:visual/navbar/seo/spacing PASS.
7. Izin exact HEAD SHA → satu push → READY + live acceptance (pindah tab
   instan + CRUD/upload/logout tetap bekerja).
8. Checkpoint AGENTS/handoff.

## 11. Estimasi effort

- Shell + panel komponen + migrasi markup: 1–2 sesi.
- Wrap lifecycle 3 modul + scoped id: 1–2 sesi.
- QA matrix + perbaikan: 1 sesi.
  Total **3–5 sesi fokus**, satu pass, tanpa digabung fitur lain.

## 12. Catatan prioritas

Antrian aktif sebelum plan ini boleh dieksekusi:

1. Live acceptance A2b (belum dijalankan).
2. Plan B v2 (Team photo fit otomatis) — plan terpisah.
   Plan SPA ini **terpisah**; jangan dikerjakan bersamaan dengan A2b/B v2 untuk
   menjaga admin yang sudah stabil.
