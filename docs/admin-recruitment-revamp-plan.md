# Master Plan: Admin Recruitment Revamp (Kolom Detail, Loading, Notifikasi, Detail Layout, & Data Visualization)

Dokumen ini merinci arsitektur, desain UI/UX, implementasi teknis, serta rencana verifikasi untuk peningkatan dashboard Admin Pendaftaran (`/admin/recruitment/` dan Admin SPA Shell).

---

## 1. Analisis Masalah & Kebutuhan

Berdasarkan screenshot pengguna (`uploaded_media_0` dan `uploaded_media_1`) serta instruksi:

| Area                               | Kondisi Saat Ini (Existing)                                                                                                                                                                         | Kebutuhan & Target Solusi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Kolom Detail**                | Buka detail hanya lewat teks Nama pendaftar (terlihat seperti hyperlink biasa). Kurang intuitif dan affordance rendah.                                                                              | Tambahkan kolom tabel khusus **`Aksi`** dengan tombol **`Tinjau Detail →`** yang mencolok, stylish (Dark Arcane obsidian glow), dan ramah sentuhan di mobile/desktop. Tetap pertahankan nama pendaftar sebagai link/button `.applicant-detail` agar backward compatible dengan seluruh test assertions.                                                                                                                                                                                                       |
| **2. Loading State & Animasi**     | Hanya teks statis polos `"Memuat pendaftar…"`, `"Memuat ringkasan…"`, atau `"Memuat detail…"`. Tombol mutasi tidak memiliki spinner atau indikator visual aktif yang jelas.                         | Implementasikan **Skeleton Shimmer Loading** (Dark Arcane obsidian gradient shimmer) pada baris tabel, kartu KPI, dan detail view. Tambahkan **Spinner SVG Glowing** pada tombol aksi saat loading (`is-loading`), disable button saat pending, dan animasi `fadeIn` halus saat data muncul.                                                                                                                                                                                                                  |
| **3. Notifikasi (Toast)**          | Notifikasi berupa teks biasa di paragraf `<p id="status">` atau `<p id="review-feedback">` yang berada di bawah form, sering tidak terlihat oleh reviewer setelah scroll.                           | Buat **Floating Dark Arcane Toast System**: fixed toast di pojok kanan/atas dengan glowing border (Hijau Emerald untuk sukses, Merah Neon untuk error, Kuning Amber untuk konflik/peringatan, Cyan untuk status aktif), icon informatif, auto-dismiss 4 detik, tombol dismiss manual, serta tetap mensinkronisasikan elemen `#review-feedback` & `#status` agar kontrak accessibility dan Playwright terjaga.                                                                                                 |
| **4. Layout Detail Pendaftar**     | Pada `uploaded_media_1`, jawaban formulir berjumlah 38 field ditumpuk secara vertikal dalam satu kolom tanpa kategori, monoton, membuat halaman menjadi sangat panjang dan melelahkan untuk dibaca. | Restrukturisasi menjadi **Split 2-Column Command Workspace**: <br>• **Kolom Kiri (Reviewer Console)**: Sticky action bar berisi Ubah Status, Alasan, Catatan Internal (append-only), dan Timeline Aktivitas. <br>• **Kolom Kanan (Jawaban Formulir Terstruktur)**: Pengelompokan visual ke dalam 5 bagian logis (Profil & Kontak, Domain & Keahlian, Portofolio & Proyek, Esai & Visi, Persetujuan Administratif) dengan kartu kontras, link eksternal portofolio yang dapat diklik langsung, dan chip badge. |
| **5. Analisis & Visualisasi Data** | Ringkasan hanya berupa kartu angka biasa dan teks mentah `"Ringkasan mengikuti filter: data 0, core 0..."`. Tidak ada representasi grafis.                                                          | Tambahkan **Visualisasi Data Native (SVG + CSS Dark Arcane, Zero Library Dependencies)**: <br>• **Domain Breakdown Chart**: Progress bar / segmented bar interaktif untuk 6 domain (Data, Core, Language, Vision, Product, Growth) lengkap dengan persentase dan legend berwarna menyala. <br>• **Recruitment Pipeline Funnel**: Visualisasi alur seleksi bertingkat (Total ➔ In Review ➔ Shortlisted ➔ Accepted vs Rejected).                                                                                |

---

## 2. Rincian Desain & Arsitektur Teknis

### A. Kolom Tabel "Aksi" (Action Column)

- **Tabel Header**:
  ```html
  <tr>
    <th>Nama</th>
    <th>Email</th>
    <th>Domain</th>
    <th>Tanggal</th>
    <th>Status</th>
    <th>Catatan</th>
    <th class="col-action">Aksi</th>
  </tr>
  ```
- **Tabel Body**:
  - Kolom Nama tetap memuat `<button class="applicant-detail">` untuk menjaga assertions di `scripts/verify-recruitment-review.mjs` (`count() === 50` dan `.textContent.endsWith('002')`).
  - Kolom Aksi memuat `<button type="button" class="btn-review-action">Tinjau Detail &rarr;</button>`.
  - Placeholder & empty state diubah `colSpan = 7`.
  - Styling tombol aksi: Dark obsidian background, border `rgba(168, 85, 247, 0.4)`, font Manrope 600, hover glow purple/cyan, cursor pointer.

---

### B. Dark Arcane Loading & Shimmer System

1. **Table Skeleton Shimmer**:
   Saat `loadList()` berjalan (`aria-busy="true"`), alih-alih teks statis, render 5 baris skeleton shimmer:

   ```html
   <tr class="skeleton-row">
     <td><div class="skeleton-pill w-120"></div></td>
     <td><div class="skeleton-pill w-180"></div></td>
     <td><div class="skeleton-pill w-80"></div></td>
     <td><div class="skeleton-pill w-140"></div></td>
     <td><div class="skeleton-badge"></div></td>
     <td><div class="skeleton-pill w-40"></div></td>
     <td><div class="skeleton-btn"></div></td>
   </tr>
   ```

   Animasi CSS:

   ```css
   @keyframes arcaneShimmer {
     0% {
       background-position: -200% 0;
     }
     100% {
       background-position: 200% 0;
     }
   }
   .skeleton-pill,
   .skeleton-badge,
   .skeleton-btn {
     background: linear-gradient(
       90deg,
       rgba(255, 255, 255, 0.03) 0%,
       rgba(168, 85, 247, 0.12) 50%,
       rgba(255, 255, 255, 0.03) 100%
     );
     background-size: 200% 100%;
     animation: arcaneShimmer 1.8s infinite ease-in-out;
     border-radius: 6px;
   }
   ```

2. **Button Loading Spinner**:
   Saat submit form status (`#save-status`), simpan catatan (`#save-note`), atau klik filter:
   - Tambahkan class `is-loading` pada button.
   - Inject mini SVG spinner berputar di dalam tombol:
     `<svg class="btn-spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4" stroke-dashoffset="10"/></svg>`
   - Ubah teks tombol menjadi `"Menyimpan…"` atau `"Memproses…"`.
   - Set `disabled = true` pada tombol untuk mencegah accidental double-submit.
   - Kembalikan ke state semula setelah mutation/request selesai atau gagal.

3. **Detail View Skeleton**:
   Saat `loadDetail(receipt)` berjalan, render layout skeleton di `#detail-summary` dan `#detail-panel`:
   - Hero card skeleton dengan avatar/title bar shimmer.
   - Section grid skeleton menirukan bentuk kartu jawaban formulir.

---

### C. Floating Dark Arcane Toast Notification System

- Komponen kontainer `<div id="admin-toast-container" class="toast-container" aria-live="polite"></div>` di pojok kanan atas layar (`position: fixed; top: 24px; right: 24px; z-index: 9999`).
- Fungsi universal: `showToast(type, message, description = null, durationMs = 4000)`
- Tipe Toast:
  1. **Success** (`status-success`):
     - Accent: Emerald Neon (`#10b981`), glow: `rgba(16, 185, 129, 0.3)`.
     - Icon: Centang tebal SVG.
     - Contoh pesan: _"Status diperbarui: Shortlisted"_.
  2. **Error** (`status-error`):
     - Accent: Crimson Neon (`#ef4444`), glow: `rgba(239, 68, 68, 0.3)`.
     - Icon: Tanda seru segitiga SVG.
     - Contoh pesan: _"Gagal menyimpan: Sesi telah kedaluwarsa"_.
  3. **Warning / Conflict** (`status-warning`):
     - Accent: Amber Glow (`#f59e0b`), glow: `rgba(245, 158, 11, 0.3)`.
     - Icon: Info/Caution SVG.
     - Contoh pesan: _"Konflik revisi: Data telah diperbarui oleh reviewer lain"_.
  4. **Info / Progress** (`status-info`):
     - Accent: Electric Cyan (`#06b6d4`), glow: `rgba(6, 182, 212, 0.3)`.
     - Icon: Pulse circle SVG.
     - Contoh pesan: _"Memuat data terbaru…"_.
- **Integrasi Elemen Eksisting**:
  - Paragraf teks eksisting `#review-feedback` dan `#status` tetap di-update teksnya secara transparan sehingga pembaca layar dan test otomatis (Playwright assertion) tetap membaca nilai yang diharapkan.

---

### D. Restrukturisasi Layout Detail Pendaftar (Image 2 Fix)

1. **Header Profil (Applicant Hero Banner)**:
   - Nama Lengkap (font Bluu Next / Manrope 700 28px).
   - Pill Badge status aktif (e.g. `Baru`, `Reviewing`, `Shortlisted`, dll.).
   - Baris meta kontak: Email (dengan tombol copy), WhatsApp (format link direct wa.me), Domisili, Institusi, Resi pendaftaran, dan tanggal masuk WIB.
   - Tombol `← Kembali ke Daftar` diposisikan di header atas DAN footer bawah agar reviewer tidak perlu scroll jauh untuk kembali.

2. **Split 2-Column Responsive Layout**:
   - Di desktop (>=1024px), layout menggunakan CSS Grid 2 kolom:
     - **Sisi Kiri (Reviewer Console, ~380px)**:
       - `position: sticky; top: 24px;` agar reviewer dapat terus mengubah status atau mencatat sambil membaca formulir di sisi kanan.
       - Card Seleksi Internal (`#status-form`).
       - Card Catatan Internal (`#note-form` + `#notes-list`).
       - Card Riwayat Aktivitas Audit (`#history-list`).
     - **Sisi Kanan (Jawaban Formulir Terstruktur, 1fr)**:
       - Berisi `#detail-panel`.

3. **Pengelompokan Jawaban Formulir dalam `#detail-panel`**:
   Untuk memenuhi syarat assertion test Playwright:
   `assert.equal(await recPanel.locator('#detail-panel .field').count(), 38)`
   Setiap field tetap mempertahankan tag `<div class="field">` di dalam `#detail-panel`, namun ditata ke dalam kartu seksi yang elegan:

   - **Seksi 1: 👤 Profil & Akademik**
     - `preferred_name`, `current_status`, `institution`, `city_region`, `current_level`.
   - **Seksi 2: 🎯 Peminatan Domain & Spesialisasi**
     - `primary_hods`, `specific_area`, `currently_exploring`, `foundation_skills`, `secondary_interest`.
   - **Seksi 3: 💼 Bukti Karya & Portofolio**
     - `portfolio_link` (dirender sebagai hyperlink interaktif `[ Buka Portofolio ↗ ]`), `most_relevant_work`, `alternative_evidence`, `project_experience`.
   - **Seksi 4: 💡 Visi, Esai & Kesiapan Kolaborasi**
     - `why_join`, `real_world_problem`, `technology_approach`, `explore_or_build`, `what_to_contribute`, `what_to_build_together`, `time_commitment`, `team_comfort`, `team_roles`, `team_story`, `cross_hods_willingness`, `learning_methods`, `independent_learning`, `desired_output`, `best_description`, `skill_to_improve`, `six_months_goal`, `contribution_types`.
   - **Seksi 5: 📋 Persetujuan & Administratif**
     - `agreement_1`, `agreement_2`, `agreement_3` (dirender dengan centang visual elegan hijau alih-alih sekadar kata mentah `"on"`).

---

### E. Analisis & Visualisasi Data Dashboard Pendaftar

Memanfaatkan data dari endpoint `/api/admin/recruitment/stats` yang sudah mengembalikan `by_status` dan `by_hods`:

1. **Domain Distribution Visualizer (Chart Distribusi Domain)**:
   - Komponen visual yang menampilkan bar proporsi horizontal segmented / multi-bar interaktif:
     - 🟣 **Data & AI** (Warna Ungu Violet)
     - 🔵 **Core Engineering** (Warna Biru Neon)
     - 🟢 **Language & LLM** (Warna Hijau Emerald)
     - 🟡 **Computer Vision** (Warna Emas Amber)
     - 🔴 **Product & Design** (Warna Rose Neon)
     - ⚪ **Growth & Community** (Warna Cyan)
   - Setiap bar menampilkan jumlah pelamar dan persentase dari total pelamar yang terfilter.
   - Desain Dark Arcane dengan efek glowing progress bars dan tooltip hover.

2. **Recruitment Pipeline Funnel (Alur Seleksi)**:
   - Diagram tahapan alur seleksi visual:
     `Baru (Inbound)` ➔ `Reviewing (Sedang Ditinjau)` ➔ `Shortlisted (Lolos Tahap 1)` ➔ `Accepted (Diterima)`
   - Menghitung rasio konversi (% pelamar yang bergerak dari satu tahap ke tahap berikutnya).
   - Menampilkan angka pendaftar `Daftar Tunggu (Waitlisted)`, `Ditolak (Rejected)`, dan `Mundur (Withdrawn)` di bilah samping analitik.

3. **Enhanced KPI Stat Cards**:
   - Kartu metrik dengan mini visual accent:
     - Card Total Pendaftar (dengan highlight glow ungu).
     - Card Baru (highlight cyan - membutuhkan perhatian).
     - Card Dalam Proses (highlight amber).
     - Card Diterima (highlight emerald).
     - Card Ditolak & Mundur (muted subtle dark).

---

## 3. Matriks Kompatibilitas & Zero-Breaking Safeguards

| Item                      | Kontrak yang Wajib Dijaga                                                                                          | Safeguard                                                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Database / Supabase**   | Tidak ada mutasi SQL, fungsi RPC, atau schema migration.                                                           | 100% menggunakan API RPC eksisting (`admin_list_applications_v2`, `admin_get_stats_v2`, `admin_get_application_v2`, dll.).                          |
| **API Endpoints**         | Tidak ada modifikasi struktur endpoint serverless di `server/recruitment-admin.mjs` atau `api/admin/recruitment/`. | Kontrak request/response GET dan POST tetap identik 100%.                                                                                           |
| **Playwright Assertions** | `locator('.applicant-detail').count() === 50`                                                                      | Tombol Nama tetap menggunakan class `.applicant-detail`. Tombol aksi baru menggunakan class `.btn-review-action`.                                   |
| **Playwright Assertions** | `locator('#detail-panel .field').count() === 38`                                                                   | Setiap field yang dirender tetap berkelas `.field` dan merupakan turunan dari `#detail-panel`.                                                      |
| **Playwright Assertions** | `locator('#detail-summary').textContent()` memuat '001' & 'WIB'                                                    | Konten teks ringkasan `#detail-summary` tetap mempertahankan format receipt dan tanggal WIB.                                                        |
| **Playwright Assertions** | `locator('#applications-body').textContent().includes('Tidak ada')`                                                | Text placeholder empty state tetap menggunakan format yang sama persis saat filter nihil.                                                           |
| **Public HTML Parity**    | 20 halaman publik tidak boleh tersentuh.                                                                           | Hanya file komponen panel admin `src/components/admin/AdminRecruitmentPanel.astro` dan script `src/scripts/recruitment-admin.js` yang dimodifikasi. |
| **Snapshot Parity**       | `src/data/cms-snapshot.json` SHA256 `4345f1...4857`                                                                | Snapshot sama sekali tidak tersentuh.                                                                                                               |

---

## 4. Rencana Implementasi Bertahap

1. **Fase 1: Komponen & Styling (Astro & CSS)**:
   - Update header tabel di `AdminRecruitmentPanel.astro` (tambah kolom `<th>Aksi</th>`).
   - Buat CSS styles Dark Arcane untuk:
     - Kolom & tombol aksi `.btn-review-action`.
     - Skeleton shimmer animations `.skeleton-row`, `.skeleton-pill`, `.skeleton-card`.
     - Toast notification container `.toast-container` dan `.toast-item`.
     - Layout split 2-kolom `.detail-workspace`, `.reviewer-sidebar`, `.detail-main`.
     - Desain visualisasi data `.analytics-dashboard`, `.domain-bars`, `.funnel-pipeline`.
     - Styling field formulir terstruktur `.field-group-card`, `.portfolio-anchor`.

2. **Fase 2: Interaksi & Logika (JavaScript)**:
   - Modifikasi `src/scripts/recruitment-admin.js`:
     - Tambahkan generator kolom Aksi dengan tombol `[ Tinjau Detail → ]` yang memanggil `loadDetail(a.receipt)`.
     - Implementasikan skeleton loader pada `loadList()` dan `loadDetail()`.
     - Tambahkan status loading + spinner pada tombol `#save-status`, `#save-note`, `#filter-btn`.
     - Implementasikan fungsi `showToast(type, title, message)` untuk semua mutation & read error feedback.
     - Implementasikan rendering visualisasi data di fungsi `renderStats(stats)`.
     - Perbarui `renderDetail()` untuk menyusun 38 field ke dalam layout grid 2 kolom & seksi terstruktur tanpa mengurangi jumlah elemen `.field`.

3. **Fase 3: Verifikasi & QA Komprehensif**:
   - `npm run verify:recruitment-review` (di 4 lebar viewport: 320, 390, 768, 1440 px).
   - `npm run test:recruitment` (42 unit tests backend & contract).
   - `npm run verify:cms-native-admin` & `npm run verify:cms-team-admin`.
   - `npm run build` (0 errors / 23 pages).
   - `npm run audit:navbar`, `npm run verify:vt`, `npm run audit:spacing`, `npm run format:check`.
   - Verifikasi visual screenshot detail viewport di artifacts.

---

## 5. Hasil Implementasi & QA Full Pass (9 Oct 2026)

Implementasi dan seluruh rangkaian gate QA telah selesai dan **100% LOKAL PASS** (Node 22.23.0, `CMS_DATA_SOURCE=local`):

- **Build**: `0 error / 23 pages` generated cleanly.
- **Unit Tests**:
  - `npm run test:recruitment`: **42 PASS / 0 FAIL**
  - `npm run test:cms`: **94 PASS + 10 live SKIP / 0 FAIL** (104 tests)
- **Browser Playwright Mocks (4 lebar viewport: 320, 390, 768, 1440 px)**:
  - `npm run verify:recruitment-review`: **PASS** (Zero horizontal overflow pada semua resolusi, detail test 38 field pass, XSS guard pass, filter & status pass)
  - `npm run verify:cms-native-admin`: **PASS**
  - `npm run verify:cms-team-admin`: **PASS**
- **Visual & Quality Gates**:
  - `npm run verify:visual`: **PASS** (`browserErrors: []`)
  - `npm run audit:navbar`: **ALL PASS** (Figma geometry exact at 1440, no overflow pada 20 breakpoint)
  - `npm run audit:spacing`: **PASS** (Strict 8-point audit PASS on 39 components)
  - `npm run format:check`: **PASS** (All matched files use Prettier code style)
  - `npm run seo:audit`: **PASS** (23 pages, canonical origin, robots/sitemap/OG OK)
- **Parity & Security**:
  - Snapshot `src/data/cms-snapshot.json` SHA256: `4345f1abe445aa2a400c31413ccc058707a77105a7e388dc8d1074e78da94857` (100% byte-matched)
  - Public HTML Parity: 20 halaman HTML publik 100% utuh tidak tersentuh
  - Database & Server Endpoints: Nol mutasi, no SQL/RPC schema changes, no auth changes.

---

## 6. Update v2: Zero Emote, 8 Kategori Sesuai Jawaban, & SVG Visual Charts

Pembaruan lanjutan mencakup:

1. **Zero Emote**: Menghilangkan seluruh emotikon dari UI (header detail `01`–`08`, notifikasi toast dot semantik, badge persetujuan polos `Disetujui (on)`, dan ikon SVG untuk chart).
2. **Kategori Sesuai Jawaban**: 38 field dikelompokkan ke dalam 8 kategori logis selaras dengan formulir asli (`RecruitmentForm.astro`). Field yang kosong tidak dirender, dan kategori tanpa jawaban tidak ditampilkan.
3. **SVG Donut Ring Chart**: Menampilkan visualisasi lingkaran proporsi 6 domain dengan total pelamar di tengah Donut.
4. **SVG Stepped Pipeline Chart**: Visualisasi alur seleksi 4 tahap dengan flow chevron dan tag hasil akhir (Daftar Tunggu, Ditolak, Mundur).
