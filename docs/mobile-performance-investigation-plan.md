# Investigasi dan rencana performa mobile — 12 Oktober 2026

Update: owner “okee terus” melanjutkan plan ke eksekusi lokal. Hasil dan scope
terkini: [mobile-performance-local.md](mobile-performance-local.md). Status
PLAN ONLY di bawah mencatat pass investigasi sebelumnya, bukan pembatalan izin
eksekusi lokal. Belum ada izin release baru.

Status: **PLAN ONLY**. Owner melaporkan berat pada semua aktivitas, di iPhone
dan Android, terutama Android. Model HP, versi OS/browser dan hasil Safari/Chrome
langsung dibanding browser WhatsApp belum diketahui. Bukti di bawah berasal dari
source dan diagnosis Chromium terhadap produksi; bukan sertifikasi perangkat asli.

## Baseline, batas pekerjaan, dan bukti

- HEAD dan remote main: `a397373db83333b5edf0c1e98a40ac004bbd3e1a`.
- Host pengukuran: `https://community.data-sorcerers.com`.
- Revision visibility dibaca ulang: `b5cb65e9-cf25-4f07-9972-cc91b0843bc8`.
- Runtime sudah Node 22 / Singapore; memindahkan region bukan pekerjaan baru.
- Fix responsif layar sukses pendaftaran sudah ada **lokal**, belum dirilis:
  [record terpisah](recruitment-success-responsive-local.md).
- Pass ini tidak mengubah aplikasi, build, database, provider, flag, deployment,
  commit atau push. Existing diff dan aset dipertahankan.
- Browser membolehkan GET/HEAD dan memblokir metode lain, termasuk telemetry.
  Pengisian teks diagnosis tidak disubmit. Tidak ada pendaftar produksi dibuat.

Artefak di `artifacts/mobile-performance-plan/`:

| Berkas                                                              | Isi                                                              |
| ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `metadata.json`                                                     | Kondisi, baseline, batas interpretasi                            |
| `audit.json`                                                        | Sembilan kasus Home, Recruitment, Apply dan intervensi diagnosis |
| `startup-repeat.json`                                               | Tiga pasangan startup audio aktif versus ditahan                 |
| `navigation.json`                                                   | Sembilan navigasi Astro dan pemeriksaan persistence audio        |
| `cold.cpuprofile`                                                   | Sampel CPU startup Home dengan splash                            |
| `audit-probe.mjs`, `followup-probe.mjs`, `startup-repeat-probe.mjs` | Harness reproduksi read-only                                     |

Kondisi: Chromium headless, viewport 390×844, DPR 3, touch/mobile, CPU throttle
4×, tanpa throttle jaringan. Browser audio memakai flag autoplay khusus tes untuk
mengamati kondisi audio benar-benar aktif; website/aturan autoplay tidak diubah.
Kasus session-warm menandai splash sudah pernah tampil, tetapi konteks browser
terpisah memakai cache HTTP baru. Jangan menyebutnya tes cache aset warm penuh.

## Temuan dengan tingkat kepastian

### 1. Pembuatan audio menahan main thread saat awal halaman — bukti kuat

`src/scripts/sound-ambient.ts` membuat musik Waltz dua siklus, total 108 detik,
sebelum mengambil siklus kedua sebagai loop 54 detik. Konstruktor graf membuat
458 oscillator, envelope dan panner masing-masing suara, serta 128 PeriodicWave.
Gelombang harmonik yang sama dibuat ulang per nada, bukan dipakai ulang per jenis
instrumen. Offline rendering berjalan asinkron; **pembuatan graf sebelumnya tetap
sinkron**, sehingga istilah offline tidak berarti setup bebas biaya main thread.

Tiga pasangan pengulangan, animasi lain tetap aktif:

| Kondisi                                | Long task startup terlama, tiga pengulangan | Median | Oscillator / PeriodicWave |
| -------------------------------------- | ------------------------------------------- | ------ | ------------------------- |
| Audio berjalan                         | 493 / 449 / 453 ms                          | 453 ms | 458 / 128                 |
| Audio ditahan melalui override browser | 168 / 160 / 197 ms                          | 168 ms | 0 / 0                     |

Override kedua menahan AudioContext agar mesin tidak mulai; label awal
`home-audio-muted` dalam audit bukan perubahan preference mute aplikasi.
Ini mengisolasi kontribusi jalur audio, bukan menetapkan setiap milidetik berasal
dari satu fungsi. CPU profile juga menunjukkan biaya `createPeriodicWave`.
Audio baru merupakan kontribusi nyata yang harus diperbaiki.

Pada rangkaian navigasi, satu offline render selesai sekitar **7,80 detik**
setelah `startRendering`; ini waktu render dalam kondisi diagnosis, bukan
7,80 detik blocking main thread. Satu buffer dan context tetap dipakai lintas
sembilan navigasi. Musik tidak ditemukan dibuat ulang setiap pindah halaman.

Ukuran PCM yang dihitung dari stereo Float32 24 kHz:

- Buffer render 108 detik: 19,78 MiB.
- Buffer loop yang disalin 54 detik: 9,89 MiB.
- Kedua buffer dapat bersamaan mencapai 29,66 MiB, belum termasuk impulse,
  internal graf dan overhead browser. Ini estimasi alokasi, bukan heap HP terukur.
- Tab tersembunyi sekarang mengecilkan gain; sumber loop tetap berjalan. Perlu
  suspend/resume terkontrol agar benar-benar menghemat audio CPU di background.

### 2. Banyak dekorasi bergerak bersama saat scroll — bukti kuat, besar dampak perlu pengulangan

Pada beberapa posisi Home terdapat **41–44 animasi CSS berstatus running**.
Philosophy memiliki 18 spark dengan orbit dan twinkle terpisah, aura/pulse dan
floating artwork. Starfield dan glow memakai bidang lebih besar daripada viewport.
Hero parallax pada `motion.ts` juga masih dibuat untuk mobile, walaupun pointer
drift dibatasi perangkat dengan fine pointer.

Pause offscreen sudah ada, tetapi observasi sering menargetkan **seluruh section**
dengan rootMargin 240 px. Section mobile bisa tinggi beberapa layar: dekorasi
tetap aktif ketika kontainer masih intersect meskipun dekorasinya tidak terlihat.

Diagnosis mematikan CSS animation/transition setelah startup, sambil mempertahankan
GSAP dan audio. TaskDuration fase scroll What We Do adalah sekitar 1.68/1.73 detik
pada dua baseline dan 0.33 detik pada satu kasus override. RecalcStyle juga turun.
Durasi fase mengikuti timer dan ikut memanjang jika CPU sibuk: **angka ini bukan
persentase CPU pada durasi identik**, bukan janji percepatan 80% di setiap HP.
Hasil cukup untuk memprioritaskan profil motion mobile; perlu before/after berulang.
Footer tidak konsisten membaik dalam intervensi ini, jadi tidak seluruh scroll
bisa dianggap selesai dengan mematikan CSS animation.

### 3. Splash menggabungkan kerja berat saat startup — bukti kuat pada implementasi dan startup gabungan

Home pertama dengan splash menghasilkan 21 long task, terlama 538 ms.
`splash-atmosphere.ts` membangkitkan noise 256×192 dengan lima octave dan warp,
kemudian menggambar canvas 1008×568 sekitar 30 fps: 12 bank kabut, 16 strand
masing-masing 97 titik, dan 68 motes. SVG seal juga bergerak bersamaan.
Cold case sekaligus mencakup audio, aset/font dan inisialisasi motion; angka
538 ms tidak boleh diatribusikan seluruhnya kepada fog tanpa isolasi tambahan.

Splash memiliki minimum 3 detik, maksimum 6 detik dan pelepasan 800 ms. Ini
**penundaan tampilan yang disengaja**, terpisah dari frame yang tersendat. Owner
sebelumnya meminta replay khusus refresh Home; aturan tersebut dipertahankan.
Memperpanjang splash agar menyembunyikan pekerjaan audio bukan solusi performa.

### 4. Blur/glass luas merupakan kandidat biaya GPU — belum terbukti dominan

Navbar fixed menggunakan backdrop blur 20 px, dan keadaan scrolled memakai
blur 16 px dengan saturate. Form memiliki backdrop blur 12/14/16 px serta dua
glow 600×600 dengan blur 140 px. Lapisan di atas konten yang bergerak perlu
profil paint/compositing pada GPU mobile asli.

Intervensi browser menghapus filter/backdrop-filter belum memperbaiki hasil
secara konsisten. Jangan melabeli blur sebagai penyebab utama yang sudah terukur;
perubahan terlokalisasi harus lolos A/B perangkat asli dan review visual.

### 5. Jaringan dan preparation masih menambah jeda navigasi

Sembilan navigasi client Astro:

| Tahap                                       | Minimum–maksimum | Median |
| ------------------------------------------- | ---------------- | ------ |
| before-preparation sampai after-preparation | 152–751 ms       | 232 ms |
| before-swap sampai after-swap               | 86–269 ms        | 145 ms |
| before-preparation sampai page-load         | 297–947 ms       | 446 ms |

Interval event adalah tahap teramati, bukan breakdown eksklusif fungsi CPU;
preparation mencakup pengambilan/persiapan dokumen, swap mencakup kerja browser.
Tidak membuktikan animation duration sebesar angka tersebut. Native swap sudah
instant pada scope navigasi terbaru, sehingga memangkas fade 180 ms lagi bukan
solusi terhadap kondisi saat ini.

ResponseStart dari navigation origin: 259–580 ms tanpa splash, 1048 ms pada
sampel Home pertama. Server-Timing visibility 47–135 ms pada delapan request
lain dan 577 ms pada sampel pertama; render Astro 3–7 ms. Ada kontribusi visibility
dan jaringan/cold state, tetapi server lambat tidak menjelaskan biaya scroll
setelah dokumen selesai dibuka. Sampel pertama saja tidak membuktikan cold start.

Realtime visibility membutuhkan konfigurasi fresh/no-store. Cache HTML atau
visibility TTL 10–15 detik akan membuat keputusan admin terlambat terlihat;
jangan menerapkan SWR itu sebagai jalan pintas. Region sin1 sudah sesuai database.

### 6. Aset dan form memerlukan optimasi terarah, bukan tebakan

- Hero aktif berupa gambar, **bukan WebGL/Three.js**. Modul partikel masih ada
  di repository tetapi tidak dipanggil oleh hero yang sekarang. Jangan menjadikan
  Three.js sebagai akar masalah mobile tanpa bukti runtime.
- Home memilih `latest-1440.webp`, sekitar 250 KB, pada diagnosis DPR 3. Source
  asli maksimum 1586×992. `sizes=100vw` kurang merepresentasikan kebutuhan
  `object-fit:cover` pada hero portrait tinggi; sekadar mengganti gambar menjadi
  landscape 480 px berpotensi mengembalikan blur yang owner sudah minta diperbaiki.
- Motion/GSAP bundle sekitar 120 KB decoded / 48 KB encoded pada halaman yang
  menggunakannya. Font Manrope empat weight dan Bluu sekitar 142 KB encoded
  total; tiga Manrope dipreload. Ini kandidat biaya awal, bukan satu-satunya sebab.
- Footer sudah mempunyai source mobile dan lazy loading. Jangan berasumsi
  gambar desktop 7200 px selalu dikirim ke HP.
- Draft form sudah memakai debounce 400 ms. Jangan mengklaim seluruh draft
  ditulis setiap ketukan keyboard. Probe typing tidak mengukur field INP.
- Halaman Apply memiliki startup long task 477 ms dengan audio; fase scroll
  form dalam sampel memiliki nol long task. Keparahan form pada HP asli perlu
  dibedakan antara startup, keyboard resize, GPU glass dan validasi.
- Sembilan navigasi menunjukkan GC mengurangi node/heap pada beberapa titik;
  satu context/render bertahan, browser errors nol. **Belum ada bukti memory leak**.

## Rencana eksekusi lokal berurutan

Setiap paket harus punya diff terpisah, measurement ulang, dan jalur revert
untuk paket itu saja. Jangan reset existing dirty work. Implementasi menunggu
instruksi owner untuk menjalankan plan; release membutuhkan instruksi baru
`commit dan push`.

### P0 — Kunci baseline dan reproduksi perangkat

1. Catat model Android dan iPhone, browser/OS, refresh rate, battery saver,
   serta Safari/Chrome langsung versus in-app WhatsApp.
2. Jalankan baseline 3–5 kali pada kondisi sama: Home pertama, Home refresh,
   scroll turun-naik, menu, Home–Recruitment–Apply–Back, typing dan next/back form.
3. Ukur startup long task, Event Timing interaksi, paint/layers, memory audio,
   dan network Server-Timing. Jangan mencampur cache/jaringan/CPU antara before
   dan after atau menyebut rAF headless sebagai FPS Android.
4. Saat implementasi, gunakan Node 22 dan fixture lokal read-only. Submission
   QA menggunakan response mock/fixture, bukan membuat pendaftar produksi.

### P1 — Ringankan audio terlebih dahulu

Berkas: `sound-ambient.ts`, `sound.ts`, `Sound.astro`, verifier audio yang ada.

1. Cache PeriodicWave per jenis instrumen **dalam context yang sama**. Untuk
   Waltz, target 128 konstruksi menjadi 3, dengan harmonic coefficients sama.
   Ini tidak mengganti melodi, tempo, timbre atau volume yang sudah disetujui.
2. Pecah setup nada menjadi batch kecil dengan yield. Target slice sekitar
   4–8 ms; ukur di throttle/perangkat referensi. Jangan hanya memindahkan seluruh
   450 ms ke satu callback idle atau timeout.
3. Splash tetap mendapat cue ringan; jadwalkan pembuatan score penuh setelah
   pekerjaan tampilan kritis dan yield terkontrol. Menampilkan splash tidak boleh
   menunggu offline render. Pertahankan autoplay attempt dan real-gesture fallback.
4. Ukur lagi. Jika render/RAM masih tinggi, ganti render dua siklus penuh dengan
   pre-roll sepanjang tail maksimum yang dihitung dari envelope/reverb, lalu
   satu siklus lengkap. Perubahan ini bersyarat pada hasil tes seam dan listening.
   Jika masih perlu, riset render segmen dengan cache bounded sebagai paket lanjut,
   bukan sekaligus merombak komposisi dalam fix pertama.
5. Suspend context ketika tab hidden dan resume sesuai state/policy saat visible;
   lindungi race dengan splash, navigasi, reduced motion dan rendering pending.
6. Pertahankan satu engine/buffer per preset per dokumen, generation guard dan
   cleanup. Tidak menambah audio file/dependency dalam paket ini.

Lulus: setup long task turun konsisten, tidak ada suara patah/klik/late splash
cue, loop seam/headroom setara baseline, tidak ada render berulang tiap navigasi.

### P2 — Profil motion mobile yang lebih ringan

Berkas: `motion.ts`, `Philosophy.astro`, `WhatWeDo.astro`, `Starfield.astro`,
`AvailableRoles.astro`, `DomainRail.astro`, bagian Footer jika hasil menuntutnya.

1. Pisahkan profil mobile dari desktop dan `prefers-reduced-motion`; jangan
   memaksa reduced motion global karena itu ikut menonaktifkan audio.
2. Nonaktifkan hero scroll parallax mobile; gambar dan posisi HD tetap.
3. Pertahankan entrance singkat sekali jalan, target 160–240 ms transform/opacity.
   Jadikan star drift, aura/glow breathing dan wave kartu statis pada mobile;
   jika diperlukan aksen, batasi 4–6 spark ringan pada elemen yang terlihat.
4. Observasi elemen dekorasi/kartu, bukan section sepanjang beberapa layar;
   rootMargin awal 0–80 px untuk pekerjaan kontinyu. Nonaktifkan ketika hidden.
5. Will-change hanya selama animasi yang membutuhkan, tidak pada semua elemen.
   Hindari perpindahan DOM read/write dan refresh ScrollTrigger berulang.
6. Pertahankan cleanup sebelum swap dan `ignoreMobileResize:true` yang sudah
   ada agar perubahan toolbar Safari tidak terus merefresh layout.
7. Garis panjang di atas View Details dan garis pendek gradient/hover tetap,
   spacing 8-point dan token Figma tetap. Desktop tidak diubah tanpa bukti.

### P3 — Kurangi paint/glass hanya setelah A/B

Berkas: `Navbar.astro`, shared Button dan form styles yang terbukti mahal.

1. A/B navbar mobile dengan satu fill/gradient semiopaque menggunakan token
   sekarang versus blur fixed. Bandingkan screenshot dan paint/layer perangkat.
2. Ganti glow form blur 140 px dengan radial-gradient statis jika memberi
   perbaikan; pertahankan batas, kontras, bentuk, posisi dan ukuran konten.
3. Hilangkan backdrop blur berlapis pada kartu mobile jika terbukti perlu;
   retain border/gradient yang memberikan kedalaman visual.
4. Jangan membenarkan desain menjadi polos hanya dari hipotesis. Ship hanya
   perubahan yang membaik terukur dan tidak merusak keterbacaan/visual.

### P4 — Splash mobile tetap magical dengan kerja lebih kecil

Berkas: `splash-atmosphere.ts`, `Splash.astro`, lifecycle terkait BaseLayout.

1. Kandidat awal canvas sekitar 504×284, fog lebih kecil, 15–20 fps, 6 bank,
   4 strand dengan 48 titik dan sekitar 20 motes pada mobile. Ukur dan lihat
   hasil; angka ini starting budget, bukan konfigurasi yang sudah diterapkan.
2. Hindari pembangkitan noise mahal setiap refresh: evaluasi texture kecil
   yang dihasilkan offline dari algoritma yang sama, atau penyiapan bertahap.
   Jangan mengasumsikan OfflineAudioContext bisa dipindah ke Web Worker.
3. Pertahankan seal, logo, warna dan cue loading; hentikan canvas/listener tepat
   pada selesai, swap, hidden atau reduced motion.
4. Home reload tetap replay, halaman lain tetap bypass sesuai keputusan owner.
   Durasi minimum 3 detik tidak otomatis diubah; jika owner ingin loading terasa
   lebih singkat, itu keputusan terpisah setelah kerja berat selesai diringankan.

### P5 — Delivery gambar HD dan font

Berkas: `Hero.astro`, `RecruitmentHero.astro`, pipeline gambar, `BaseLayout.astro`.

1. Evaluasi crop portrait untuk mobile dari source asli agar area terbuang
   tidak ikut dikirim. Tetapkan object-position/crop lewat review visual.
2. Tentukan srcset dari kebutuhan tinggi/cover dan kualitas source, bukan
   lebar CSS saja. Pertahankan maksimum native source; tidak melakukan upscale
   palsu atau memaksakan variant kecil yang blur pada hero tinggi.
3. Bandingkan WebP/AVIF dengan budget transfer dan decode Android; pakai yang
   memberi hasil visual dan startup lebih baik, bukan format berdasarkan asumsi.
4. Pertahankan hero fetchpriority high; lazy gambar di bawah fold yang sudah ada.
   Audit ikon kecil yang sekarang puluhan KB untuk gambar tampil sekitar 42 px.
5. Audit critical weight font sebelum mengurangi preload. Tetap Bluu/Manrope,
   font-display dan layout stabil; tidak mengganti font untuk mengejar skor.

### P6 — Navigasi, form dan integritas admin

1. Ukur ulang preparation/swap sesudah audio/motion diringankan. Pisahkan
   HTML wait dari parse, style, script dan refresh motion.
2. Gunakan warm CSS yang ada tanpa speculative HTML yang tidak bisa dipakai
   ulang karena no-store. Jangan restore progress/loading text lama.
3. Jika visibility wait tetap tinggi, telusuri request/RPC/pooling dan cold
   path dengan measurement terarah. Jangan memasukkan TTL visibility 10–15 s
   atau caching HTML yang membuat hasil save admin terlambat terlihat.
4. Uji typing, keyboard open/close, validasi step dan draft debounce. Cache query
   control hanya jika profil membuktikan biayanya; idempotency/retry/storage dan
   kontrak backend pendaftaran tetap sama.
5. Uji layar sukses dari fix lokal terpisah pada 320–1440 px dan text zoom.
   Fix ini belum berada di produksi; dokumentasi plan tidak menggantikan release.
6. Auth bersama admin, empat tab, visibility freshness dan revision check pada
   Back/BFCache tetap. Tidak ada live save/toggle/submit untuk QA pass ini.

## Acceptance dan release

- Ulangi baseline yang sama 3–5 kali sesudah setiap paket; catat median dan p95.
- Target awal: menghilangkan audio graph task sekitar 450 ms; target maksimum
  startup task 150 ms pada harness referensi, atau dokumentasikan residual beserta
  pemilik biayanya. Target bukan hasil yang sudah dicapai.
- Target scroll: penurunan TaskDuration yang konsisten pada durasi scroll sama,
  p95 frame mendekati budget layar 60 Hz dan tidak ada stall >100 ms pada Android
  referensi. Gunakan perangkat asli untuk keputusan FPS dan thermal.
- Target interaksi Event Timing/field INP <=200 ms. Headless typing duration
  bukan INP. Target LCP <=2.5 s dan CLS <=0.1 dinilai terpisah dari minimum
  splash yang memang disengaja; tidak mengklaim sudah lulus Core Web Vitals.
- Uji normal/reduced motion, audio allowed/blocked, tab background/resume,
  20 navigasi/Back dengan GC terkendali untuk mendeteksi pertumbuhan retained
  memory; ukur PCM/native memory terpisah dari JS heap.
- Visual: hero tetap tajam, Figma fonts/tokens/8-point spacing, separator kartu,
  navbar, mobile menu, contrast, short screen dan text enlargement tetap benar.
- Fungsional: draft, validasi, mock submit/receipt/retry, admin session, visibility
  fresh pada request berikutnya, no-store dan revision check tetap benar.
- Pada tahap implementasi jalankan Node22 check/build dan tes yang relevan:
  recruitment, visibility, audio/splash, navbar/spacing dan verifier sukses lokal.
- Tidak menjanjikan 0 ms atau 60 fps pada semua HP. Android GPU, battery saver,
  browser WhatsApp dan network berbeda perlu bukti perangkat.
- Setelah lokal lolos, owner review hasil konkret. Commit/push/deploy hanya
  setelah instruksi baru yang eksplisit untuk scope release tersebut.

## Referensi teknis

- [Rendering performance — web.dev](https://web.dev/articles/rendering-performance):
  frame budget dan dampak kerja main thread/rendering terhadap respons interaksi.
- [High-performance CSS animations — web.dev](https://web.dev/articles/animations-guide):
  transform/opacity, paint cost dan penggunaan layer secara selektif.
- [OfflineAudioContext — MDN](https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext):
  render audio ke buffer di luar playback realtime; tidak menghapus biaya setup graf.

Urutan yang direkomendasikan: **audio → motion mobile → splash → glass bersyarat
→ gambar/font → evaluasi ulang navigasi/form**. P3 dan P4 dapat ditukar berdasarkan
trace perangkat; audio/motion mendapat prioritas dari hasil yang paling kuat.
