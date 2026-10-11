# Rencana refinement UI Pages & Sections

Tanggal: 11 Oktober 2026. Rencana awal berdasarkan review kode, screenshot
preview lokal, dan pemeriksaan browser. Refinement kini diimplementasikan lokal;
hasil dan batas QA dicatat di [hasil refinement lokal](page-section-visibility-ui-refinement-local.md).
Isi rencana awal di bawah dipertahankan sebagai referensi.
Master perilaku tetap `page-section-visibility-plan.md`; hasil implementasi
lokal sebelumnya tetap `page-section-visibility-local.md`.

## Temuan aktual

- Pemilihan awal selalu Home. Nama halaman membuka detail; checkbox halaman
  hanya mengubah enabled. Dua tindakan berdekatan ini belum cukup jelas.
- Browser memastikan Home 5 section, About 4, Hall of Frames 3, Recruitment 7,
  Partners 2. Jadi kontrol section bukan hanya Home.
- Contact, enam detail HoDS, enam detail Role, dan Application Form tidak punya
  switch section dalam scope v1; komposisi internals dilindungi master plan.
- Daftar 19 kartu panjang membuat grid kanan ikut stretch hingga bagian bawah,
  menghasilkan ruang kosong besar. Mobile menempatkan detail setelah seluruh
  daftar, sehingga detail halaman terpilih sulit ditemukan.
- Label status tersimpan, draft dan hasil efektif belum cukup dibedakan.
  Checkbox native belum memberi tampilan switch yang mudah dibaca.
- Konflik saat ini menampilkan ringkasan teks panjang; perlu perbandingan yang
  dapat dipahami tanpa membaca detail teknis.

## Tujuan hasil

Owner dapat memilih halaman, melihat section miliknya, memahami apakah ia
benar-benar tampil, mengubah draft, dan menyimpan tanpa menebak kontrol.
Refinement mempertahankan 19 page ID, 21 section ID, parent inheritance,
protected Home, default About/HoF nonaktif, serta semua konten dan draft.
Tidak menambahkan section baru di luar registry tanpa perluasan scope terpisah.

## Arah visual

Tetap memakai identitas console Data Sorcerers: latar obsidian, panel violet
lembut, Bluu Next Bold untuk judul, Manrope untuk label, status dan isi.
Reuse token shell existing; referensi warna yang sudah dipakai adalah #050507,
#141122, #9b7bff, #c5bad4, #ede8ff. Tentukan warna final melalui token existing,
bukan membuat tema terpisah. Kontras status dan focus harus diuji.

Judul tidak mendominasi ruang kerja. Hierarki melalui judul, divider, jarak dan
selected state; hindari kartu dekoratif berulang tanpa fungsi. Tombol tetap
memakai komponen/variant existing. ZERO EMOTE; label selalu jelas dengan teks.
Spacing layout 8/16/24/32/48, target sentuh minimum 48px. Ukuran border/focus
mengikuti SOP existing. Tidak mengklaim pixel match ke Figma tanpa referensi.

## Layout yang direncanakan

Desktop, mulai sekitar 1024px setelah diuji terhadap shell existing:

```text
Pages & Sections                           Status simpan
Atur halaman dan bagian yang tampil.

Pilih halaman              | About Us                  Buka halaman
Cari halaman               | /about/
                           | Status halaman: Under Development
Halaman utama              | [switch] Halaman aktif
Home           5 section   | Section baru tampil ketika halaman aktif.
About Us       4 section   |
Hall of Frames 3 section   | Section About Us
Recruitment    7 section   | Vision & Mission     [switch] Aktif
Partners       2 section   | Our Philosophy       [switch] Aktif
Contact        Halaman saja| Our Ecosystem        [switch] Aktif
                           | Our Team             [switch] Nonaktif
Detail HoDS                |
Detail Recruitment         | Ringkasan perubahan yang belum disimpan
                           | Our Team: aktif menjadi nonaktif

1 perubahan belum disimpan       Batalkan perubahan    Simpan perubahan
```

- Sidebar sekitar 288–320px, detail fleksibel dengan min-width:0.
- Grid align-items:start; panel detail tidak meregang mengikuti tinggi daftar.
- Sidebar berisi pilihan halaman saja. Toggle enabled dipusatkan di detail agar
  satu kontrol hanya punya satu fungsi. Seluruh baris pilihan dapat diklik.
- Selected row jelas, jumlah section terlihat sebelum halaman dibuka.
- Group: Halaman utama (6), Detail HoDS (6), Detail Recruitment (7).
- Search mencari nama dan path; saat kosong tampilkan reset pencarian.
- Group dapat dilipat. Grup halaman terpilih terbuka otomatis; pencarian tetap
  memperlihatkan semua hasil yang cocok. Draft tidak hilang saat pindah pilihan.
- Toolbar simpan sticky dengan latar solid, z-index terkendali dan area aman.
  Muat ulang merupakan aksi sekunder. Keluar tetap tersedia sebagai aksi sesi,
  dipisahkan dari aksi draft.
- Hindari panel kanan dan kiri memiliki banyak scroll bersarang. Uji sticky
  terhadap overflow ancestor shell sebelum menetapkan perilaku akhir.

Mobile/tablet sempit:

- Pemilih halaman ringkas di atas detail; buka daftar/search lewat disclosure.
- Setelah memilih, daftar menutup dan judul detail terlihat tanpa melewati 19
  kartu. Pindahkan fokus secara terukur setelah tindakan pengguna.
- Detail satu kolom; setiap section punya label, switch dan keterangan status.
- Footer aksi tetap mudah dicapai, wrap pada lebar kecil, aman dari home indicator
  dan keyboard. Tambahkan ruang bawah supaya tidak menutupi isi/focus.
- Desktop dan mobile menggunakan satu state/form dan ID unik; jangan membuat
  salinan editor yang dapat menyimpan draft berbeda.

## Model status dan microcopy

Tampilkan tiga informasi dengan peran berbeda:

1. Status tersimpan: hasil terakhir yang sudah dikonfirmasi server.
2. Draft: perubahan lokal yang belum berlaku publik.
3. Hasil jika disimpan: apakah halaman/section akan tampil dengan seluruh aturan.

Label utama halaman: Aktif / Under Development. Section: Aktif / Nonaktif.
Alasan efektif ditampilkan bila berbeda dari switch, misalnya:

- Halaman ini nonaktif. Preferensi section tetap tersimpan.
- Tidak tampil karena Recruitment nonaktif.
- Available Roles tidak tampil karena semua halaman role nonaktif.
- Home selalu aktif; hero dan navigasi dilindungi.

Gunakan teks dan bentuk selain warna. Switch native checkbox tetap mendukung
keyboard dan semantics; visual track/thumb dapat dibentuk dengan CSS tanpa
menghilangkan focus. Label clickable; loading menonaktifkan aksi ganda.

Jika halaman tidak punya section, tulis alasan sesuai jenis halaman: Contact
memiliki satu komposisi; detail HoDS/Role memiliki isi detail yang dilindungi;
Application Form dikelola sebagai halaman utuh. Jangan sekadar menampilkan
panel section kosong atau menyatakan fitur belum selesai.

## Cakupan section

| Halaman          | Section yang tersedia                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| Home             | Our Philosophy; What We Do; House of Data Sorcerers; Our Projects; Recruitment CTA                   |
| About Us         | Vision & Mission; Our Philosophy; Our Ecosystem; Our Team                                            |
| Hall of Frames   | Featured Sorcerers; Project Highlights; Community Milestones                                         |
| Recruitment      | Who Should Join; What You Will Do; Available Roles; Selection Timeline; FAQ; Snippets; Community CTA |
| Partners         | Our Partners; Why Data Sorcerers                                                                     |
| Contact          | Toggle halaman; tanpa switch section internal                                                        |
| Enam detail HoDS | Toggle per halaman; tanpa switch section internal                                                    |
| Enam detail Role | Toggle per halaman; tanpa switch section internal                                                    |
| Application Form | Toggle halaman; tanpa switch pertanyaan/form internal                                                |

About/HoF yang nonaktif tetap boleh diedit preferensi section-nya. Mengaktifkan
halaman lalu menyimpan akan merender komposisi asli dengan preferensi tersebut.

Halaman dan section tetap independen: mematikan Home Domains tidak otomatis
mematikan enam URL HoDS; mematikan Available Roles tidak otomatis mematikan URL
role. Sebaliknya, mematikan halaman Recruitment membuat anak Role dan Apply
secara efektif nonaktif tanpa menimpa enabled milik masing-masing anak.
Visibilitas tidak mengubah RECRUITMENT_OPEN atau status penerimaan pendaftaran.

## Ringkasan dampak dan simpan

- Tampilkan perubahan per target, nilai tersimpan ke nilai draft.
- Jelaskan efek navigasi untuk target yang terdampak dengan memanfaatkan aturan
  registry yang sama: Projects off menghilangkan section dan Explore; Role off
  menghilangkan kartu terkait; semua Role off menghilangkan Available Roles.
- Ringkasan harus menyebut dampak yang benar-benar dapat ditentukan, bukan
  mengarang jumlah semua tautan di situs.
- Simpan seluruh draft sebagai satu batch atomic menggunakan API existing.
- Sebelum ada perubahan: Simpan dan Batalkan disabled.
- Sedang menyimpan: indikator, aria-busy, cegah klik ganda.
- Sukses: Perubahan tersimpan. Berlaku pada kunjungan atau refresh berikutnya.
- Gagal pasti: draft dipertahankan, alasan dan langkah selanjutnya ditampilkan.
- Hasil belum diketahui: jangan menyatakan gagal/berhasil; tombol Periksa hasil
  simpan mengirim ulang payload dan request ID yang sama.
- Konflik: perbandingan status terbaru vs draft; pilihan Gunakan status terbaru
  atau Terapkan ulang draft. Tidak menimpa perubahan admin lain diam-diam.
- Sesi berakhir: bersihkan state privat dan kembali ke shared login existing.
- Pindah tab/admin route dengan draft tetap melalui dirty guard existing.

## Kapan perubahan berlaku

Urutan aktual: toggle mengubah draft lokal, Simpan mengirim batch, server
memvalidasi shared Auth/Origin/CSRF dan revision, transaksi menyimpan config,
respons sukses diterima, lalu request publik berikutnya membaca revision baru.
Tidak ada deploy hook atau rebuild pada visibility save.

Request publik SSR membaca config sekali per request; halaman, section dan
CTA memakai revision yang sama. Header browser/CDN no-store dan tanpa cache
lintas request pada loader visibility. Request yang sudah dimulai sebelum
transaksi commit mungkin selesai dengan revision lama.

- Setelah respons sukses, kunjungan/refresh baru memakai status terbaru.
- Navigasi Astro yang meminta halaman baru memakai status terbaru; perubahan
  hash saja dalam dokumen yang sama tidak otomatis menjadi request baru.
- Tab pengunjung yang sudah terbuka tetap menampilkan snapshot sampai ada
  request baru; tidak ada polling atau realtime push v1.
- Kembali dari browser bfcache memeriksa revision lalu reload bila berbeda;
  eligibility bfcache bergantung browser dan tidak dijanjikan universal.
- Save dan kunjungan tetap membutuhkan jaringan, query dan render. Tidak ada
  janji 0ms atau batas latency produksi sebelum pengukuran release.
- Source visibility gagal dibaca: halaman 503 sementara, bukan membuka konten
  menggunakan flag default lama.

Preview 127.0.0.1:4348 memakai file fixture dan synthetic review session. UI
harus menunjukkan banner Preview lokal dan menjelaskan perubahan hanya masuk
ke fixture. Kecepatan fixture bukan bukti kecepatan Supabase/Vercel production.
Production saat ini belum menerima fitur: SQL/config/deployment/live toggle
masih membutuhkan izin terpisah sesudah hasil konkret siap ditinjau.

## Tahapan implementasi berikutnya dan acceptance

1. Baseline: catat status/diff terbaru, screenshot 320/390/768/1024/1440, pertahankan
   seluruh perubahan existing. Dokumentasikan sumber masalah visual.
2. Struktur: group/search/pemilih halaman, hilangkan toggle sidebar, align-start,
   mobile disclosure. Verifikasi pilihan semua 19 halaman dan draft tetap utuh.
3. Home: refine status protected, lima section, switch dan ringkasan dampak.
   QA toggle/cancel/save, Projects/Explore dan kunjungan publik baru.
4. About: empat section, notice halaman off, aktifkan hanya fixture untuk QA,
   verifikasi render asli dan kembalikan fixture. Tidak mengubah default seed.
5. Hall of Frames: tiga section, pola off yang sama, QA sendiri dan restore.
6. Recruitment: tujuh section, parent/Role/Apply, nol/satu role, CTA dan
   missing-anchor. Intake flag tidak berubah. QA setiap section satu per pass.
7. Partners: dua section, QA masing-masing dan seluruh halaman nonaktif.
8. Contact kemudian detail HoDS/Role/Apply satu halaman per pass: alasan tanpa
   section, parent inheritance, direct URL, kartu/CTA yang ikut berubah.
9. State feedback: ringkasan perubahan, conflict diff, uncertain retry, session
   expiry dan banner fixture. Jalankan regressions existing admin tabs.
10. Final: format/check/build, spacing/accessibility, browser QA, dokumentasi
    hasil nyata, screenshot desktop/mobile dan daftar batasan. Tidak commit/push.

Acceptance akhir: seluruh 19 pilihan dapat ditemukan, seluruh 21 section
terlihat pada halaman yang tepat, tidak ada panel kosong memanjang, detail
mobile langsung terjangkau, keyboard/focus jelas, tidak ada overflow 320px,
zoom 200% tidak menutup aksi, sticky aman pada layar pendek, reduced motion
berfungsi, status tidak bergantung warna, browserErrors kosong. No-JS public
SSR, no-store freshness, replay/conflict dan proteksi shared Auth tetap lulus.

Review ini tidak memerlukan perubahan schema CMS enam collection, akun, grant,
allowlist, provider/config production, deployment, atau live toggle.
