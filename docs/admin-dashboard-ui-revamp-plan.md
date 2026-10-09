# Plan & Hasil: Revamp UI/UX Admin Dashboard Data Sorcerers

## 1. Latar Belakang & Tujuan

Dashboard admin Data Sorcerers (`/admin/`, `/admin/team/`, dan `/admin/recruitment/`) sebelumnya berkinerja cepat dan responsif, tetapi secara visual masih berupa wireframe/raw form dasar (input kaku, border abu-abu tebal, tabel polos tanpa status badge, button flat).

Tujuan revamp ini adalah mentransformasi seluruh interface admin menjadi **Dark Arcane Command Center** yang selaras dengan tema website Data Sorcerers (obsidian glass, glowing accents, typografi Bluu Next & Manrope, semantic status badges, responsive multi-viewport) dengan **100% mempertahankan DOM ID, selector, dan event handler** agar seluruh automated testing dan kontrak backend tetap berfungsi tanpa regresi.

## 2. Ruang Lingkup Perubahan

1. **Top Navigation (`src/components/admin/AdminNavigation.astro`)**:
   - Menambahkan emblem logo Data Sorcerers ber-glow halus dan judul brand.
   - Menambahkan chip badge "Console".
   - Segmented pill tabs dengan border glass, active gradient indicator, dan glowing dot indicator.
   - Mematuhi aturan strict 8-point spacing audit (39 komponen lulus).

2. **Projects Editor (`src/pages/admin/index.astro`)**:
   - Hero header glass card dengan backdrop blur dan shadow.
   - Form controls modern (input, textarea, select) dengan dark background `#08060f`, border glass halus, dan glowing focus ring.
   - List project `.project-choice` bertransformasi menjadi kartu mini dengan highlight aktif yang jelas.
   - Upload gambar dengan area dropzone interaktif dan bingkai preview `#image-preview` ber-glow halus.
   - Action buttons: Tombol "Simpan dan terbitkan" dengan gradien ungu menyala, tombol "Hapus project" dengan subtle rose outline.

3. **Team Editor (`src/pages/admin/team.astro`)**:
   - Pembagian grup anggota di sidebar menggunakan header `.group-title` bergaris pemisah halus.
   - Frame live preview foto anggota `#image-preview` dengan rasio 3:4 kartu tim asli.
   - Mempertahankan assertion Playwright test: `outline-style: solid` saat fokus pada input `#name`.

4. **Pendaftar Reviewer (`src/pages/admin/recruitment.astro` & `src/scripts/recruitment-admin.js`)**:
   - KPI metric cards (`.stat-card`) dengan angka besar menyala berfont Bluu Next dan label berbobot.
   - Filter toolbar terpadu (`#filter-form.search-bar`) dalam grid kartu kaca gelap.
   - Data table modern (`#table-wrapper`) dengan sticky header gelap, hover glow per baris, dan link nama pendaftar bergaris bawah halus.
   - **Semantic Status Pills**:
     - `Baru` (`new`): Sky Blue (`#38bdf8`) + dot glow
     - `Reviewing` (`reviewing`): Arcane Purple (`#9b7bff`) + dot glow
     - `Shortlisted` (`shortlisted`): Warm Amber (`#fbbf24`) + dot glow
     - `Interview` (`interview`): Violet Purple (`#d8b4fe`) + dot glow
     - `Diterima` (`accepted`): Sorcerer Emerald (`#34d399`) + dot glow
     - `Ditolak` (`rejected`): Crimson Rose (`#fb7185`) + dot glow
     - `Daftar tunggu` (`waitlisted`): Gold Yellow (`#fde047`) + dot glow
     - `Mundur` (`withdrawn`): Slate Muted (`#94a3b8`) + dot glow
   - Detail area focused layout: Ringkasan pendaftar, formulir status internal, timeline catatan append-only, dan timeline riwayat aktivitas.

## 3. Hasil Pengujian & Quality Assurance (Node 22.23.0)

- `npm run test:cms`: **94 PASS + 10 Team live SKIP / 0 FAIL**.
- `npm run test:recruitment`: **42 PASS / 0 FAIL**.
- `npm run verify:cms-native-admin`: **PASS** di 4 ukuran layar (320px, 390px, 768px, 1440px).
- `npm run verify:cms-team-admin`: **PASS** di 4 ukuran layar (320px, 390px, 768px, 1440px).
- `npm run verify:recruitment-review`: **PASS** di 4 ukuran layar (320px, 390px, 768px, 1440px).
- `npm run audit:spacing`: **Strict 8-point audit PASS** (39 komponen).
- `npm run format:check`: **Prettier bersih** (All matched files use Prettier code style).
- `npm run build`: **0 error**, 23 halaman berhasil di-generate.
- **Integritas Data**: `src/data/cms-snapshot.json` dan 20 halaman publik tidak mengalami perubahan.
