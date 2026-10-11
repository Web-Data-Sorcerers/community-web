# Pages & Sections UI refinement — hasil lokal

Tanggal: 11 Oktober 2026. Owner menyetujui arah refinement setelah review UI.
Implementasi dan QA lokal selesai; production, SQL live, provider, deployment,
live toggle, commit dan push tidak dijalankan.

Rencana: [page-section-visibility-ui-refinement-plan.md](page-section-visibility-ui-refinement-plan.md).
Perilaku/runtime dasar tetap mengikuti [master plan](page-section-visibility-plan.md)
dan [hasil P0–P6](page-section-visibility-local.md).

## Perubahan yang dapat ditinjau

- Sidebar hanya memilih halaman. Toggle halaman ada satu kali di panel detail.
- Daftar terbagi Halaman utama, Detail HoDS dan Detail Recruitment, dengan
  disclosure, pencarian nama/path, jumlah section, serta status aktif/nonaktif.
  Grup detail tertutup pada kunjungan awal dan terbuka saat dipilih.
- Desktop memakai kolom 304px dan detail fleksibel, align-items:start. Panel
  kanan tidak membesar mengikuti daftar kiri. Mobile di bawah 1024px memakai
  pemilih halaman ringkas; setelah memilih, daftar menutup dan fokus berpindah
  ke judul detail. Hanya ada satu state/form untuk kedua layout.
- Judul lebih ringkas, label terbaca, track/thumb switch memakai checkbox native
  role=switch, accessible name, describedby, focus dan dukungan Space.
- Status tersimpan dibedakan dari hasil jika draft disimpan. Setiap perubahan
  menunjukkan nilai lama/baru. Section aktif dalam halaman nonaktif diberi
  penjelasan bahwa preferensinya menunggu halaman diaktifkan.
- Ringkasan draft memuat semua halaman yang berubah, termasuk dampak Projects
  terhadap Explore, independensi Domains/URL HoDS, Available Roles/URL Role,
  serta efek parent Recruitment pada Role dan Apply.
- Contact, detail HoDS/Role dan Application Form menjelaskan bahwa komposisi
  internalnya dilindungi; tidak mengarang switch section baru.
- Toolbar menempel hanya ketika ada draft/proses simpan. Saat tidak ada draft,
  toolbar berada dalam alur layout sehingga tidak menutup pengaturan awal.
  Aksi sesi Muat ulang/Keluar dipisahkan dari Simpan/Batalkan.
- Konflik menampilkan perbandingan status terbaru/draft per target, termasuk
  perubahan eksternal tanpa edit lokal. Terapkan ulang tetap menggabungkan
  hanya perubahan lokal ke revision terbaru, lalu memerlukan simpan eksplisit.
- Hasil simpan yang belum diketahui menyediakan Periksa hasil simpan, memakai
  payload/request ID yang sama. Draft, dirty guard dan pembersihan sesi tetap
  dipertahankan. Sukses menyebut kunjungan atau refresh berikutnya.
- Preview lokal dikenali dari header khusus transport fixture dan diberi banner
  bahwa perubahan hanya ke fixture; application Auth tidak mendapat bypass.

Style global panel Projects/Team existing semula ikut memberi ukuran 13px pada
label dan padding/margin header. Refinement memberikan override terarah hanya
untuk Pages & Sections. Panel existing dan public composition tidak direstyle.
Tetap Bluu Next Bold, Manrope, warna console existing, Button variants existing,
ZERO EMOTE, spacing layout 8/16/24/32. Tidak ada artwork/font/dependency baru atau
klaim Figma pixel match untuk custom admin ini.

## Pass per halaman dan section

Browser memakai transport review lokal sesungguhnya, tanpa route mock untuk
save UI/SSR pada verifier baru. Setiap pass section off/on disimpan melalui UI,
lalu raw SSR HTML diperiksa dengan DOMParser untuk memastikan komponen
absent/present. Pass halaman off/on memeriksa chamber/no-chamber. Home diuji
terkunci. Seluruh fixture dipulihkan dalam finally.

| Pass             | Hasil                                                                      |
| ---------------- | -------------------------------------------------------------------------- |
| Home             | Protected Home; lima section off/on; Projects/Explore summary PASS         |
| About Us         | Halaman off/on; empat section off/on; preferensi ketika off PASS           |
| Hall of Frames   | Halaman off/on; tiga section off/on PASS                                   |
| Recruitment      | Halaman off/on; tujuh section off/on; parent dan alasan nol/satu role PASS |
| Partners         | Halaman off/on; dua section off/on PASS                                    |
| Contact          | Halaman off/on, alasan tanpa section PASS                                  |
| Detail HoDS      | Enam halaman masing-masing off/on PASS                                     |
| Detail Role      | Enam halaman masing-masing off/on, parent preference tetap aktif PASS      |
| Application Form | Halaman off/on, alasan komposisi form dilindungi PASS                      |

Data CMS snapshot tetap SHA256
`4345f1abe445aa2a400c31413ccc058707a77105a7e388dc8d1074e78da94857`.
Fixture akhir cocok dengan seluruh flag seed: Home dan Projects aktif; About
serta Hall of Frames nonaktif. Tidak mengubah RECRUITMENT_OPEN.

## QA final

| Check                                    | Hasil                                                                                                          |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Astro check/build                        | PASS; 0 errors, 0 warnings, 36 existing hints                                                                  |
| Format / diff whitespace / spacing panel | PASS                                                                                                           |
| SEO runtime/static                       | 24 dokumen, canonical/robots/sitemap/OG PASS                                                                   |
| UI verifier                              | 47 records: 19 halaman, 21 section, 7 layout; browserErrors=[]                                                 |
| Layout                                   | 320, 390, 768, 1024, 1440px; 390x480 layar pendek; CSS zoom 200% pada 1440px                                   |
| Usability                                | Seluruh 19 pilihan di tiap layout, nol overflow, search/reset, draft lintas halaman, keyboard Space/focus PASS |
| Initial state / normal motion            | Grup detail tertutup, toolbar sticky hanya ketika draft PASS                                                   |
| Admin Pages regression                   | 12 kombinasi tiga entry route/empat lebar; conflict, retry UUID, dirty guard, logout PASS                      |
| Late-response races                      | Tiga mode late read, failed read dan late write/double save PASS                                               |
| Shared contract/Auth/runtime tests       | 10 PASS                                                                                                        |
| Existing Projects admin                  | Empat lebar PASS                                                                                               |
| Existing Team admin                      | Empat lebar PASS                                                                                               |
| Existing Pendaftar admin                 | Empat lebar PASS                                                                                               |

Zoom check memakai CSS zoom untuk stress layout; bukan klaim semua kombinasi
browser native zoom. Screenshot ditinjau secara visual; bukti ada di ignored
`artifacts/site-visibility/`: `ui-initial-390.png`, `ui-initial-1440.png`, tujuh
`ui-refined-*`, `ui-refinement-proof.json`, dan log `ui-*`. Baseline dirty diff
sebelum refinement disimpan sebagai `ui-before.diff`; tidak reset/stash.

## Review manual

Preview berjalan di `http://127.0.0.1:4348/admin/#pages` melalui generated Vercel
function harness dan fixture `/tmp/ds-visibility-review.json`. Reload tab admin
untuk memuat bundle terbaru. Tanpa kredensial production pada mode review ini.

1. Pilih About Us: empat section terlihat, bersama penjelasan halaman nonaktif.
2. Di mobile, gunakan Ganti halaman; pilih Recruitment untuk melihat tujuh section.
3. Pilih Home; matikan Our Projects. Ringkasan menyebut section dan Explore.
4. Simpan; kunjungi atau refresh `/` untuk melihat hasil terbaru.
5. Kembalikan switch dan simpan untuk mengembalikan fixture.

Confirmed save berlaku pada request berikutnya, tanpa rebuild; waktu jaringan,
query dan render tetap ada. Tab publik yang sudah terbuka tidak auto-update.
Preview fixture tidak mengukur latency Supabase/Vercel production. SQL/provider/
deployment/live toggle tetap memerlukan izin terpisah setelah review hasil ini.
