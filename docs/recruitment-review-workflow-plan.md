# Pengelolaan pendaftar — Master Work Plan

## Checkpoint eksekusi lokal (8 Oct 2026)

Plan selesai di3f4b8e9; owner kemudian mengotorisasi A–D lokal dengan defaults
§1–18. Implementasi/QA lokal selesai; migration belum applied, fitur belum
deployed atau accepted live. Production e59abde OPEN tetap baseline.
[Hasil lokal/objects/QA/gates](recruitment-review-local-implementation.md).
Label PLAN ONLY dan proposed dalam versi awal di bawah adalah konteks planning,
bukan larangan atas eksekusi lokal yang sudah diotorisasi user berikutnya.
Gate E–F/live migration/push/fixture tetap izin konkret terpisah.

Tanggal: 8 Oct 2026. Owner: Faiz. **PLAN ONLY**: dokumen ini belum mengizinkan
implementasi, migration live, perubahan izin, fixture, push, atau deployment.

## 1. Hasil yang dituju

Owner masuk sekali ke dashboard yang sama, membuka menu **Pendaftar**, menemukan
pendaftar dengan filter, membaca jawaban lengkap, mengubah tahap seleksi, menulis
catatan internal, dan melihat siapa mengubah apa serta kapan. Semua data tetap
di existing Supabase; tidak membuat aplikasi/dashboard/database kedua.

Contoh alur: pendaftar baru masuk → owner membuka detail → status **Ditinjau** →
catatan tentang portofolio → **Shortlist** → **Wawancara** → **Diterima**.
Jawaban asli formulir tetap utuh sepanjang proses. Status Diterima adalah keputusan
internal; tidak otomatis menambahkan anggota Team atau mengirim pesan ke pendaftar.

## 2. Baseline dan batas bukti audit

Production terakhir accepted: `e59abde7b16766646bc2f40dd5169cafe0bbd92a`;
deployment `dpl_A3GRRJ44rnycsCwiSe9QrW5KQmBc`, primary alias
`data-sorcerers-community-sigma.vercel.app`, READY. Checkpoint docs setelah push
lokal `c3f8ecd`; cek git log lagi saat eksekusi. Izin push e59abde sudah consumed.
Origin hanya satu fetch/push URL community-web; testing project tetap absent.

Shared Supabase password login dan owner/intake acceptance sudah selesai pada
00ac70a. Recruitment **OPEN**, CMS/data/media memakai Supabase, kode GAS sudah
dihapus. Plan ini tidak mengulang migrasi auth, pembukaan recruitment, atau GAS.

Fresh proof setelah deploy e59abde mencatat 4 Projects, satu CMS grant aktif,
applications0/media0, fingerprints unchanged; angka applications adalah checkpoint,
bukan jaminan tetap nol selama recruitment OPEN. Sesi planning ini membaca source,
tests, migrations, dan dokumen lokal; **tidak membaca applicant PII atau catalog live**.
Semua asumsi schema live harus diperiksa read-only ulang pada tahap A.

| Area           | Implementasi yang diaudit                                                       | Implikasi untuk plan                                                                   |
| -------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Dashboard      | `src/pages/admin/recruitment.astro`, navigasi Projects/Team/Pendaftar           | Kembangkan halaman existing, bukan dashboard baru                                      |
| UI data        | `src/scripts/recruitment-admin.js`                                              | Sudah ada list, detail, search nama/email, filter domain, statistik total/domain       |
| Pagination UI  | Membaca list lalu `applications.slice`, PAGE_SIZE50; request limit200           | Masih pagination lokal browser                                                         |
| API            | `server/recruitment-admin.mjs`, catch-all `api/admin/recruitment/[...route].js` | Pertahankan satu function catch-all dan lifecycle bersama                              |
| Auth           | `createCmsAuth.authorize` lalu `admin_verify_identity` dengan trusted actor     | CMS grant saja tidak cukup; recruitment allowlist tetap wajib                          |
| Data asli      | `private.recruitment_applications`                                              | Receipt UUID, canonical fields38, content_hash, received_at, generated summary columns |
| SQL list       | `20261007120000_recruitment_pass2_admin_read.sql`                               | v_limit/v_offset dideklarasikan tetapi query tidak memakainya; aggregate semua hasil   |
| Filter tanggal | SQL/API mengenal since/until; UI belum menyediakan kontrol                      | Lengkapi UI dan validasi server                                                        |
| Statistik      | Total dan by_hods; belum ada status/filter stats                                | Tambah statistik workflow yang konsisten dengan filter                                 |
| Audit read     | `private.recruitment_audit_log`; handler audit best effort                      | Tidak menjamin read-audit selalu tercatat; jangan label sebagai audit lengkap          |
| Workflow       | Belum ada status seleksi, notes, revision, mutation routes                      | Perlu schema/RPC/API/UI baru                                                           |

Pagination SQL belum bounded adalah temuan source, bukan hasil uji volume live.
Jangan menyebutnya sudah diperbaiki sebelum patch dan real PostgreSQL QA selesai.

## 3. Scope rilis pertama dan pekerjaan terpisah

Rilis pertama wajib mencakup:

- Status seleksi per receipt, default Baru untuk pendaftar lama maupun baru.
- Filter nama/email, domain utama, status, rentang tanggal diterima; reset filter.
- Pagination **server-side**, 50 record per halaman, maksimum100 per request.
- Detail 38 canonical fields + panel seleksi + notes + riwayat aktivitas.
- Catatan internal dengan author dan timestamp, append-only pada rilis pertama.
- Statistik yang dapat dibedakan antara total global dan hasil filter.
- Revision/conflict handling, idempotent write retry, authorization dan audit writes.
- Empty/loading/error/permission-denied/session-ended states serta QA lengkap.

Terpisah, bukan dependency atau izin otomatis dari plan ini:

- Multi-admin baru, assignment reviewer, skor/rubrik, jadwal kalender, upload CV.
- CSV/export PII, bulk accept/reject, edit jawaban pendaftar, delete applicant.
- Email/WhatsApp otomatis, portal pelamar, perubahan status publik, auto-add Team.
- CAPTCHA/anti-spam publik, kebijakan retensi, job penghapusan data, env GAS cleanup.

Arsitektur menyimpan author agar siap bila reviewer ditambah nanti, tetapi tidak
menambah Auth user, allowlist, role, atau hak akses reviewer sekarang.

## 4. Status seleksi dan aturan perpindahan

Delapan status berikut adalah **usulan default**, belum keputusan bisnis final.
Saat owner meminta eksekusi tanpa mengganti workflow, gunakan default tertulis ini;
perubahan business flow disepakati sebelum migration/UI dibekukan.

| Code          | Label UI          | Makna                                                            |
| ------------- | ----------------- | ---------------------------------------------------------------- |
| `new`         | Baru              | Belum ditinjau                                                   |
| `reviewing`   | Ditinjau          | Jawaban/portofolio sedang diperiksa                              |
| `shortlisted` | Shortlist         | Kandidat lolos penyaringan awal                                  |
| `interview`   | Wawancara         | Masuk tahap wawancara; tidak menyiratkan undangan sudah terkirim |
| `waitlisted`  | Daftar tunggu     | Keputusan ditunda / menunggu slot                                |
| `accepted`    | Diterima          | Keputusan internal diterima                                      |
| `rejected`    | Ditolak           | Keputusan internal ditolak                                       |
| `withdrawn`   | Mengundurkan diri | Owner mencatat permintaan mundur                                 |

| Dari                                   | Ke yang diizinkan                                                    |
| -------------------------------------- | -------------------------------------------------------------------- |
| Baru                                   | Ditinjau, Ditolak, Mengundurkan diri                                 |
| Ditinjau                               | Shortlist, Daftar tunggu, Ditolak, Mengundurkan diri                 |
| Shortlist                              | Wawancara, Diterima, Daftar tunggu, Ditolak, Mengundurkan diri       |
| Wawancara                              | Diterima, Daftar tunggu, Ditolak, Mengundurkan diri                  |
| Daftar tunggu                          | Ditinjau, Shortlist, Wawancara, Diterima, Ditolak, Mengundurkan diri |
| Diterima / Ditolak / Mengundurkan diri | Ditinjau, dengan alasan pembukaan kembali                            |

Aturan:

1. Memilih status hanya menyiapkan draft; DB berubah setelah klik **Simpan status**.
2. Alasan10–500codepoints wajib untuk Diterima/Ditolak/Mengundurkan diri dan
   pembukaan kembali dari status terminal; perpindahan lain boleh alasan kosong.
3. Simpan status yang sama ditolak sebagai INVALID_TRANSITION409; tidak menambah
   revision/event. Replay request sukses yang sama tetap mendapat hasil idempotent.
4. Keputusan terminal memakai confirmation inline dengan nama + status tujuan;
   reopen juga menjelaskan bahwa riwayat keputusan sebelumnya tetap tersimpan.
5. Semua aturan ditegakkan di server **dan SQL**; dropdown UI bukan pengamanan.
6. Semua delapan status internal saja. Tidak ada komunikasi/publikasi otomatis.

## 5. Filter, list, pagination, dan statistik

### 5.1 Kontrak filter

| Field         | Aturan                                                             |
| ------------- | ------------------------------------------------------------------ |
| search        | Opsional, trim, maksimum200codepoints; nama/email case-insensitive |
| primary_hods  | Kosong atau salah satu data/core/language/vision/product/growth    |
| status        | Kosong atau salah satu delapan code; missing state berarti new     |
| since / until | UI tanggal WIB; server mengubah ke UTC boundaries                  |
| sort          | received_at_desc default; received_at_asc opsional rilis pertama   |
| limit         | Integer1–100, default50; UI50                                      |
| offset        | Integer0–100000; bukan parseInt yang menerima string parsial       |
| as_of         | Timestamp snapshot list dari server, bukan waktu browser           |

Rentang tanggal UI inklusif untuk kedua tanggal; query memakai received_at>=awal
hari WIB dan received_at<awal hari WIB sesudah tanggal akhir. since>until ditolak400.
Field tidak dikenal/array/object yang salah, NaN, negatif dan limit berlebih ditolak.
SQL mengulang validasi; tidak bergantung hanya pada validasi browser.

Search `%`, `_`, dan backslash diperlakukan literal. Tidak menyusun SQL dengan
string user. Indeks B-tree nama/email existing tidak dianggap otomatis mempercepat
substring search; query-plan diuji pada synthetic volume sebelum menambah extension.

### 5.2 Pagination server

- LIMIT/OFFSET diterapkan dalam paged CTE/subquery **sebelum jsonb_agg**.
- ORDER BY received_at + receipt menjadi urutan unik; receipt sebagai tie-breaker.
- Response memuat applications maksimal limit, total_global, filtered, limit,
  offset, has_more, as_of. filtered menghitung seluruh hasil matching, bukan page size.
- Current page saja ditahan di browser; Prev/Next melakukan request baru.
- Mengubah filter/sort/reset kembali ke offset0 dan as_of baru.
- as_of ditentukan server pada page pertama, diwariskan saat paging dan membatasi
  received_at<=as_of agar insert normal baru tidak menggeser page yang sedang dibaca.
- as_of bukan snapshot DB lintas request: status berubah/commit terlambat/delete
  administratif bisa mengubah membership. UI menawarkan **Muat ulang daftar**;
  tidak menjanjikan snapshot immutability. Setelah mutation owner, reload list/stats
  menggunakan snapshot baru dan tangani page yang menjadi kosong.
- Cursor pagination dapat menjadi pass lanjutan jika offset besar terbukti mahal;
  tidak perlu menambah kompleksitas sebelum synthetic query-plan menunjukkan kebutuhan.

Urutan unik penting saat LIMIT/OFFSET; lihat
[PostgreSQL LIMIT/OFFSET](https://www.postgresql.org/docs/current/queries-limit.html).

### 5.3 Statistik yang tidak menyesatkan

Stats v2 menerima filter yang sama dan as_of yang sama dengan list.
Response: total_global, filtered, by_status (8code termasuk count0), by_hods,
as_of, filters_applied. Jumlah by_status dan by_hods harus sama dengan filtered.

UI memperlihatkan **Total seluruh pendaftar**, **Hasil filter**, serta ringkasan
Baru/Proses/Daftar tunggu/Diterima/Ditolak/Mundur. Proses adalah reviewing+
shortlisted+interview; tidak menghitung waitlisted dua kali. Label dengan jelas
menyatakan ringkasan status/domain mengikuti filter. Empty database bernilai0.
Respons list/stats pada request berbeda masih bisa berubah karena review bersamaan;
shared as_of tidak membekukan status. Jangan melabelnya sinkron realtime.

## 6. Detail pendaftar dan catatan internal

Detail dibagi menjadi:

1. Ringkasan: nama, email, domain utama, tanggal masuk, receipt, status.
2. Jawaban: seluruh38field existing, kelompok identitas/minat/pengalaman/motivasi/
   kontribusi/persetujuan; field kosong dapat tetap skipped seperti kontrak existing.
3. Seleksi: status saat ini, last reviewer, last change time, kontrol status/alasan.
4. Catatan: textarea, tombol **Tambah catatan**, author/waktu setiap catatan.
5. Aktivitas: status lama→baru, alasan, actor, waktu, dan event catatan ditambahkan.

Notes:

- Plain text,1–4000codepoints sesudah trim, maksimum16KiB UTF-8.
- Normalisasi CRLF ke LF; newline/tab diperbolehkan, NUL/control berbahaya ditolak.
- Append-only rilis pertama. Koreksi ditulis sebagai catatan baru; tidak ada edit/
  delete tersembunyi yang menghilangkan jejak. Edit/redaction perlu pass tersendiri.
- Notes hanya ada pada detail; list membawa note_count, bukan isi catatan.
- Notes dan activity paginated: default/max20item per request, ordered timestamp+
  unique ID, endpoint terpisah. Jangan mengirim semua history dalam detail tunggal.
- Author dari trusted actor server. Browser tidak boleh mengirim author_id/email.
- Catatan dan alasan adalah data privat, bukan materi untuk log error atau analytics.
- Tidak menyimpan notes/draft/PII di localStorage, sessionStorage, URL, atau cookies.
  Draft di memory/DOM; logout/permission denial/session end membersihkan semuanya.

Semua teks user lewat textContent/escaped rendering. Tautan portfolio tetap plain
text pada rilis pertama; fitur clickable link memerlukan URL validation dan opener
protections, tidak membuka portal/url otomatis saat detail dimuat.

## 7. Data Supabase — additive, jawaban asli immutable

### 7.1 Tabel yang diusulkan

Nama final diverifikasi terhadap catalog pada tahap A, bukan diasumsikan absent.

| Tabel                                   | Kolom/constraint inti                                                                                                                                                                                                            |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| private.recruitment_application_reviews | receipt UUID PK/FK ke applications; status text CHECK8code; version bigint>=0; updated_at timestamptz; updated_by text                                                                                                           |
| private.recruitment_review_notes        | id UUID PK; receipt FK; body bounded; created_by text; author_label dari trusted identity; created_at server                                                                                                                     |
| private.recruitment_review_events       | id UUID PK; receipt FK; action status_changed/note_added; from/to status; reason bounded; note_id nullable; actor_id text; actor_label; created_at; before/after version; request_id UUID; request_hash; minimal result metadata |

FK uses RESTRICT, bukan cascade delete applicant otomatis. Event note reference
tidak memuat ulang isi notes. Actor text konsisten dengan recruitment allowlist
auth_id text; CMS grant auth_id UUID ditangani dengan validasi/konversi eksplisit.
Tidak otomatis membuat FK ke auth.users atau mengubah lifecycle akun.

Event UNIQUE(actor_id,request_id) untuk dedupe satu mutation intent lintas
operation/receipt. request_hash mencakup normalized action, receipt, expected_version,
status/reason/note body. Hash dihitung DB dari bentuk canonical yang disepakati;
server tidak menerima hash/hasil idempotency dari browser.

Indices awal: reviews(status,receipt), notes(receipt,created_at,id),
events(receipt,created_at,id); existing applications received_at index dilengkapi
tie-breaker receipt bila query-plan membutuhkannya. Hindari index tanpa query nyata.

### 7.2 Default tanpa reseed/backfill massal

Existing applicant tanpa reviews row dibaca sebagai status new/version0.
Review row dibuat lazy saat mutation valid pertama. New intake tetap memasukkan
applications dengan38canonical fields seperti sekarang; tidak harus membuat state
via trigger. stats/filter new harus mencakup row tanpa reviews.

fields/content_hash/received_at/receipt/schema_version dan generated columns tetap
utuh. Status, notes, activity disimpan terpisah; tidak mengedit jawaban untuk
mencatat hasil seleksi. Tidak reseed applicant atau menghapus drift/content CMS.

### 7.3 RPC baru, kompatibel dengan deployment sebelumnya

Usulan wrapper service_role-only:

- admin_list_applications_v2(p_filters)
- admin_get_application_v2(p_receipt)
- admin_get_stats_v2(p_filters)
- admin_list_review_notes(p_receipt,p_page)
- admin_list_review_events(p_receipt,p_page)
- admin_update_application_status(p_actor_id,p_request)
- admin_add_review_note(p_actor_id,p_request)

Private implementations fully qualified; SECURITY DEFINER memakai fixed
pg_catalog search_path. Revoke PUBLIC/anon/authenticated EXECUTE; hanya service_role
mendapat EXECUTE wrapper yang memang diperlukan. Table direct SELECT/INSERT/
UPDATE/DELETE juga revoke service_role, bukan menganggap RLS cukup untuk role ini.
Ketiga tabel baru enable RLS dengan ALL-deny policy, tanpa grant read/write untuk
anon/authenticated. service_role tetap diuji lewat table ACL karena dapat bypass RLS.
No direct browser database/Storage access. Catalog grants/owner/policies diverifikasi.

RPC lama dipertahankan agar rollback aplikasi lama tetap bekerja; API baru memakai
v2. Tidak mengedit/reapply migration pass1/pass2/pass3/auth yang sudah applied.
Migration baru disusun lokal saat eksekusi, dengan filename timestamp actual saat itu.

Dasar desain privilege mengikuti
[Supabase database functions](https://supabase.com/docs/guides/database/functions)
dan [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
Plan memilih model private wrapper existing; bukan grant writes untuk semua
authenticated users.

## 8. Atomic write, conflict, dan retry

Satu request status/note harus menjalankan **satu transaksi DB**:

1. Vercel memverifikasi Origin/CSRF, trusted Auth actor, CMS grant dan recruitment
   allowlist sebelum masuk write RPC. Actor berasal guard, bukan body.
2. SQL mengulang CMS/recruitment active-permission checks. Lock permission rows
   dengan urutan tetap sebelum lock applicant untuk serialisasi dengan revocation.
3. Lock applications row FOR UPDATE menurut receipt. Tidak mengubah row canonical;
   lock ini menserialisasi dua mutation saat review row masih belum ada.
4. Cari event untuk actor+request_id. Jika hash sama, replay hasil committed;
   jika intent berbeda, ID_CONFLICT409. Replay dicek **sebelum revision**.
5. Bandingkan expected_version dengan state.version atau0. Stale→CONFLICT409.
6. Validasi status transition/reason/note/receipt; seluruh failure bebas partial write.
7. Upsert state, increment version, insert note jika relevan, insert event berisi
   dedupe/result metadata. Semuanya commit bersamaan atau rollback semua.

Write failure tidak boleh hanya mengembalikan error sesudah insert partial. Gunakan
controlled exception/transaction block yang memastikan rollback, lalu map error
terbatas ke API. Jika event insert gagal, status/note tidak boleh tersimpan.
Jangan memakai best-effort read-audit handler existing untuk audit mutation.

Version milik review metadata; semua status/note mutations menaikkannya. Dua tab
dengan version sama: satu sukses, satu409. Tidak auto-overwrite atau silent retry.
Lock acquisition order seragam diuji untuk deadlock/permission revocation race.
Row locks dan penundaan transaksi lain mengikuti
[PostgreSQL explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html).

request_id dibuat browser UUIDv4 satu kali ketika submit intent. Double-click
dinonaktifkan. Timeout/putus koneksi memberi **UNCONFIRMED**, bukan klaim gagal
menyimpan; retry manual mengirim ID+payload yang sama. Setelah sukses/replay,
client reload detail untuk state terbaru, tidak menimpa UI dengan hasil lama replay.

409 mempertahankan draft di memory, muat metadata terbaru, tampilkan konflik,
owner meninjau lalu submit intent baru dengan UUID baru. Sesudah reload penuh
request memory hilang: baca detail/history dulu, jangan auto-submit ulang notes.
Mutation request tidak memicu deploy hook atau rebuild situs.

## 9. Kontrak API dan keamanan

Catch-all existing diperluas; tidak menambah function Vercel per endpoint.

| HTTP / path relatif /api/admin/recruitment | Kontrak                                                                |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| POST applications                          | Read filters JSON; Origin+CSRF; bounded paged list v2                  |
| GET applications                           | Kompatibilitas bounded read; input whitelist; UI baru memakai POST     |
| GET application?receipt=UUID               | Canonical detail + status/version/note_count, tanpa semua notes/events |
| POST stats                                 | Filtered stats v2, Origin+CSRF                                         |
| GET stats                                  | Default bounded stats untuk compatibility                              |
| GET notes?receipt=UUID&...                 | Maksimum20notes, authenticated only                                    |
| GET history?receipt=UUID&...               | Maksimum20events, authenticated only                                   |
| POST review-status                         | request_id,receipt,expected_version,status,reason                      |
| POST review-note                           | request_id,receipt,expected_version,body                               |

Search/filter POST menghindari nama/email dalam query URL/browser history; read
audit menyimpan flag/count/category, bukan raw search term atau applicant answers.
Tidak menghapus historical audit logs yang mungkin menyimpan filters; kebijakan
redaction/retensi lama perlu pekerjaan terpisah. No PII di logs/artifacts/commits.

API guard yang wajib:

- Lifecycle cookie/refresh/logout tetap shared existing; tanpa password baru.
- Every request: Origin-bound session → POST Origin/CSRF → getUser → CMS permission
  → recruitment permission → privileged RPC. SQL rechecks grants pada writes.
- Tidak menerima actor, timestamps, audit metadata, SQL/function name dari browser.
- Methods eksplisit per route; unknown route404, wrong method405, invalid input400,
  anonymous401, permission403, missing receipt404, revision/id conflict409.
- Body stream maksimum32KiB, termasuk tanpa Content-Length;413 bila berlebih.
- Bounded upstream response maksimum1MiB; list/details/notes/history bounded.
- Return strict selected fields, no arbitrary RPC objects or SQL/Auth/provider errors.
- Forward rotated Set-Cookie dan csrf pada reads/writes sesuai existing auth contract.
- Cache-Control no-store; no third-party applicant analytics; no service key di client.
- 401/403/logout clears applicant list/detail/notes/history/draft and ignores stale
  responses using session generation. Separate request generation juga menolak
  list/detail/filter response lama yang datang setelah request baru.
- No Supabase Realtime subscription/SDK browser, env baru, provider/allowlist grants,
  atau infrastructure baru diperlukan untuk v1.

## 10. UI per surface dan accessibility

Admin custom belum mempunyai node Figma/reference PNG baru. Gunakan layout criteria
tertulis dan existing fonts/logo/palette; jangan mengklaim Figma pixel match.
Eksekusi UI wajib baca pixel SOP/assets/fullscreen plan yang berlaku terlebih dahulu.
Public halaman dan form recruitment tetap terkunci untuk pass ini.

| Surface  | Desktop                                               | Mobile / acceptance                                                   |
| -------- | ----------------------------------------------------- | --------------------------------------------------------------------- |
| Nav/auth | Existing3menu, recruitment aktif                      | Wrap rapi, single login, logout bersama                               |
| Stats    | Cards grid, angka+label filter scope                  | 2kolom bila muat; label readable, tidak clipped                       |
| Filter   | Search/domain/status/date-from/date-to + Cari/Reset   | Stack dengan labels; controls min44px touch target                    |
| List     | Nama/email/domain/status/tanggal/catatan count/action | Table scroll dalam wrapper atau compact rows; document overflow0      |
| Detail   | Summary, answers, selection+notes/history blocks      | Natural page scroll; tidak nested modal yang menyulitkan form panjang |
| Status   | Badge text+color, allowed transition selector         | Color bukan satu-satunya penanda; confirmation inline/focus           |
| Notes    | Multiline input/count/save, note author/time          | Body wraps; mobile keyboard tidak menutup action permanen             |
| History  | Timeline/list yang paginated                          | Actor/action/time readable; tidak memuat semua events otomatis        |

Tokens existing: base#050507, surface#16141f, text#fff, muted#bcb7cb,
accent#9b7bff, border#393344; Manrope400/700 dan BluuNext700 lokal. Max1280,
main padding32 desktop/16 mobile, gaps8/16/24/32. Tidak font/dependency baru.

Keyboard Enter/Space membuka detail lewat button, bukan row click saja; visible
focus; semua filter berlabel; status/error aria-live polite; note validation
terhubung ke textarea; pending button disabled; conflict message focusable.
Dirty note/status draft diberi navigation confirmation saat pindah receipt/menu.
Session revoked tidak mempertahankan draft/PII demi privacy.

Loading menampilkan state yang spesifik; network retry tidak membuka dialog
berulang. Empty database, no filter matches, notes empty, history empty, missing
receipt, session-ended, forbidden, saving, saved, conflict, unconfirmed wajib diuji.

## 11. File implementation map

| Path                                                            | Rencana perubahan                                                                            |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| supabase/migrations/<timestamp>_recruitment_review_workflow.sql | Add3tables, indexes, ACL, private functions + new public wrappers; tidak apply saat planning |
| server/recruitment-review-contract.mjs (baru)                   | Status labels/transitions, filter/body/response bounds; tidak mengubah APPLICATION_FIELDS    |
| server/recruitment-admin.mjs                                    | v2 reads, mutation dispatch, trusted actor, response validation/errors                       |
| api/admin/recruitment/[...route].js                             | Add notes/history/review-status/review-note map di catch-all existing                        |
| src/pages/admin/recruitment.astro                               | Filter controls, stats/status columns, review/notes/history surfaces                         |
| src/scripts/recruitment-admin.js                                | Server pagination, state/revision/draft, mutation/retry, race suppression                    |
| tests/recruitment-shared-admin.test.mjs                         | Preserve lifecycle/permission reads, add route guards/mutations                              |
| tests/recruitment-review*.test.mjs (baru)                       | Contract/API/concurrent/idempotency/ACL real PostgreSQL proof                                |
| scripts/verify-recruitment-review.mjs (baru bila diperlukan)    | Synthetic browser workflow4widths; tanpa applicant nyata/live env                            |
| docs/cms-sop.md + handoff/TODO/AGENTS                           | Workflow SOP, applied/live status, proof limits dan release gates                            |

Public intake handler/38field contract, CMS Projects/Team/media/auth SQL tidak
diubah untuk fitur review. Reuse existing auth module, bukan refactor auth ulang.

## 12. Tahap A–F, deliverables, dan gates

### A — audit dan desain final, read-only

1. status/log/refs/remotes/Node22; capture snapshot/public19HTML/input baseline.
2. Catalog actual applications/allowlists/audit/functions/table ACL/RLS/indexes dan
   schema version; aggregate counts/fingerprints saja, tanpa applicant payload.
3. Inspect ada/tidak proposed3tables dan RPC baru. Jika sudah ada, inspect definitions
   dahulu; jangan blind reapply/drop/reseed.
4. Confirm defaults§4/filter/timezone/note append-only/final decisions internal.
5. Write concrete schema/API contract, migration diff, UI inventory dan acceptance matrix.

Output: audited baseline, final design, migration proposal. Code execution dimulai
hanya setelah owner meminta implementasi; current session tetap plan-only.

### B — local DB/RPC + server

1. Additive migration pada ephemeral PostgreSQL, tidak production.
2. Bounded list/stats/detail v2, lazy review default, atomic writes/events/idempotency.
3. New server routes+strict guards+error mappings dan permission checks.
4. Keep old RPCs for rollback; catalog/ACL preservation proof.

Gate: real PostgreSQL integrity/permission/concurrency tests PASS; API tests PASS.

### C — UI per surface

1. Filters/list/server pagination.
2. Status controls/confirmation/conflict.
3. Notes/history/detail and dirty-navigation handling.
4. Four viewport mocks320/390/768/1440, keyboard, stale-response/privacy states.

Gate: UI contract+all states, no pageerrors/document overflow, same shared login.

### D — full QA, review, local commit

Run§13, review diff/no PII, document coverage and exact migration objects/locks.
Separate migration apply approval from code push approval. No production fixture
or SQL probe DML disguised as read-only. Local result must be reviewable first.

### E — live migration, deploy, acceptance

1. Before apply: show exact SQL diff, existing project `web-community /
yejrdckcmlxrkklgtrwy`, affected objects/ACL, backup/forward rollback, local QA.
   Request concrete apply approval; no grant/user provisioning bundled.
2. Apply **one new migration once**; inspect state on errors before retry.
   Catalog/counts/fingerprints and wrapper/table role denials read-only.
3. Commit local final feature+checkpoint; request exact HEAD SHA approval for one
   origin/main push to community-web. No second testing repo/project.
4. Vercel READY exact SHA+primaryalias+build proof. No env/open flag change or hooks.
5. Read-only actual owner list/detail/stats and shared navigation390/1440; anonymous/
   unpermitted denies; refresh/logout. Empty database is not positive mutation proof.
6. Approved synthetic acceptance+cleanup as§14. Recruitment stays OPEN.

### F — closeout

Record applied migration/READY/provider clock/proof limits/cleanup, exact changed
objects, count/fingerprint preservation, QA results, SOP and next optional features.
Checkpoint docs local by default; each new push SHA needs new approval.

## 13. QA yang wajib sebelum deploy

Baseline historical e59abde: CMS94PASS+10Team liveSKIP, recruitment28PASS,
7gates+SEO, 2native/Team+unified mocks4widths, snapshot/public19HTML exact,
dist52textfiles/secrets0. **Ini bukan fresh results untuk workflow baru.**

| Category          | Cases minimum                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| Intake regression | Same38fields/hash/idempotent receipt; review tidak mengubah fields/content_hash                                     |
| Default/new       | Existing/new applicant without review row=Baru/version0; counts/filter correct                                      |
| Transitions       | Every allowed pair + every forbidden pair; terminal reasons/reopen; same-status rejection                           |
| Notes             | Empty/whitespace/max/max+1, UTF-8/codepoints/NUL, LF, HTML/script-looking text safe                                 |
| Pagination        | 0/1/49/50/51/200/201records; max100; negatives/NaN/unknownfields; tied timestamps                                   |
| Filters           | Search literals %,_,backslash; mixed-case; combined domain/status/date; since>until                                 |
| Timezone          | WIB midnight boundaries and end-date exclusive-next-day conversion                                                  |
| Stats             | Global vs filtered; zero categories; group sums=filtered; notes/events never inflate counts                         |
| Conflict          | Two clients same version, only1write/event; another status/note changes version; draft preserved                    |
| Idempotency       | Same intent same request ID repeats1effect; sameID changed body/receipt/action rejects409                           |
| Atomicity         | Forced event failure rolls back state/note; failed writes leave no rows/revision changes                            |
| Permissions       | anon/authenticated/direct-table/service_role reads denied perACL; wrappers authorized only; SQL recheck both grants |
| Actor spoof       | Body author/actor/email/time injection rejected; revoked CMS/recruitment grants denied                              |
| CSRF/method/body  | Wrong Origin/CSRF before privileged calls; wrong methods; body without Content-Length capped                        |
| Session           | Login once across3modules; rotated cookie; logout/401/403 clears notes/drafts/in-flight replies                     |
| Browser races     | Old filter/detail/stats responses cannot overwrite new selection; lost response retry safe                          |
| Scalability       | Synthetic 10kapplications + notes/events; response remains bounded, query-plan/index review                         |
| Compatibility     | Old admin RPC still callable from old server path, no altered SQL contract for intake/CMS                           |

Local test commands under Node22, **without server env** so10Team live mutation
tests SKIP; never set RECRUITMENT_DB_URL to production for DB verifier:

```sh
npm run test:cms
npm run test:recruitment
npm run verify:recruitment-db
npm run build
npm run verify:visual
npm run audit:navbar
npm run verify:vt
node scripts/responsive-audit.mjs
npm run audit:spacing
npm run format:check
npm run seo:audit
npm run verify:cms-native-admin
npm run verify:cms-team-admin
# New workflow browser verifier after it exists; synthetic, four widths.
```

Preview must actually listen before browser gates; do not trust stale Astro daemon
records. Bounded secret scan dist; no private answers baked into static HTML/build.
Capture before/after same-input snapshot/19HTML parity; do not overwrite repo snapshot
from live data or erase Team drift. No legacy GAS mock or generator resurrected.
Mock/ephemeral tests are not live owner/fixture proof. Report actual counts/skips.

## 14. Live acceptance dan fixture izin konkret

First read-only: READY/alias, 19publicHTML, intake accepting:true, anonymous CMS+
recruitment denies, owner shared navigation/reads/refresh/logout390/1440. Permission
denial via controlled mocks/catalog is distinct from real revoked-grant fixture;
do not reuse consumed auth-fixture approval or temporarily revoke owner by default.

Positive write proposal prepared **after local result and exact target exist**:

- One synthetic applicant example.invalid, new exact receipt+canonical hash.
- Prefer current public intake1submit+1identical retry to prove intake unaffected;
  explicit approval includes these two POSTs, not blanket applicant manipulation.
- Existing approved owner changes only fixture: Baru→Ditinjau→Shortlist→Wawancara→
  Diterima→Ditinjau(reopen with reason), adds2synthetic notes, retries exactly one
  previously successful mutation request to prove no duplicate note/event.
- Two owner test contexts generate one fixture-only conflict; no other applicant
  or arbitrary Team/Projects write. Show exact planned request count before approval.
  Usulan race: dari Ditinjau, dua request same-version menuju Shortlist/Daftar tunggu;
  satu sukses, satu409. Total proposal12mutation HTTP requests:2intake,
  5status moves,2notes,1replay,2race requests; read-only checks/guarded cleanup
  ditinjau terpisah dalam approval konkret. Tidak blind retry untuk mengejar hasil.
- After every successful step, DB/read UI version/status/note/events exact; canonical
  answers/hash unchanged, both responsive viewports readable, no secret/PII output.
- No emails, external messages, export, hooks or recruitment close/open env changes.
- Cleanup exact synthetic receipt/hash only: verified note/event/state children,
  events lalu notes lalu state lalu applicant; FK RESTRICT respected. Approval explicitly covers synthetic review
  event cleanup; existing recruitment read-audit logs are not erased to hide tests.
- Pre/post counts/fingerprints of **other** applicants unchanged; fixture absent.
  Artifacts retain synthetic IDs/counts/statuses/verification, not real PII.

Do not run fixture without its separate concrete approval. If owner declines, mark
positive live mutation acceptance pending; do not claim full workflow accepted.
If no secure owner session available, report access dependency; no chat password,
credential reset, grant bypass, or test user provision without explicit permission.

## 15. Backup, rollback, dan stop conditions

Before live SQL: backup current affected function definitions/ACL/schema metadata,
hashes and targeted operational state in secure storage outside repo. Do not export
all applicant PII to ordinary artifacts. If data backup is needed, show exact scope/
encryption/path/restore proof and obtain explicit approval. No fake "full backup"
claim from schema metadata or a local tag.

Apply additive schema first, old deployment remains compatible. No required change
to RECRUITMENT_OPEN, cookies, Supabase provider/grants, or service/Management secrets.
Transactions/DDL locks inspected; schedule with owner if actual volume or locks
need a maintenance window. Planning does not force closure of live intake.

Rollback preference: forward fix. With concrete approval, point production alias
to retained prior deployment/rebuild approved prior SHA; prior UI shows read-only
original applicant detail. Keep new review tables/data/events and old RPCs; do not
drop new columns/tables or delete notes to "undo" the release. Workflow metadata
survives until fixed version returns. Alias rollback/deploy requires approval.

Stop/inspect if existing unexpected objects, applied SQL error, allowlist/answer
fingerprint drift, public parity change, service key leak, audit partial-write bug,
unbounded list, wrong-grant write, or unrelated applicant affected. Never blind
reapply migration, reseed applicants, close recruitment, or delete rows as a retry.

## 16. Acceptance definition

Release accepted only when:

- [ ] One login still opens Projects/Team/Pendaftar; shared refresh/logout preserved.
- [ ] Original applicant38fields/hash never change because of review.
- [ ] All8statuses/default/transition/reason/reopen behavior proven.
- [ ] Server-side filters/pagination actually bounded; 201record test reaches last page.
- [ ] New read wrappers private/service-only, no direct PII access from browser roles.
- [ ] Notes/activities visible only to authorized admins, with trusted author/time.
- [ ] Revision conflict and idempotency prevent lost updates/duplicate notes/events.
- [ ] Mutation audit atomic; reads remain explicitly best effort unless separately upgraded.
- [ ] UI320/390/768/1440, keyboard/stale-response/dirty-draft/privacy states PASS.
- [ ] Fresh local QA/7gates+SEO/parity/secrets PASS, exact live SHA/READY/alias verified.
- [ ] Actual owner read-only acceptance and approved synthetic write+cleanup accepted.
- [ ] Recruitment stays OPEN, applicant/CMS data unchanged outside approved fixture.
- [ ] Current docs distinguish proposal/local/applied/deployed/accepted accurately.

## 17. Estimasi dan keputusan owner

Estimasi engineering, bukan janji tanggal: A/desain0.5–1hari; B/database+API1–2hari;
C/UI1–2hari; D/QA0.5–1hari; E/live acceptance0.5hari setelah izin/akses tersedia.
Total sekitar3.5–6.5hari kerja, bergantung catalog actual, QA PostgreSQL dan revisi
workflow/UI. Tidak termasuk fitur optional atau waktu menunggu persetujuan.

Default reviewable: delapan status§4, decisions internal, notes append-only,
existing owner grants, tanpa reviewer assignment/new accounts, WIB, server50/page,
tanpa export/bulk/messaging. Owner dapat mengganti defaults ketika meminta eksekusi;
tidak perlu menjawab pertanyaan berulang untuk pilihan implementasi rutin.

## 18. Prompt handoff eksekusi

```text
Bro, lanjut implementasi lokal docs/recruitment-review-workflow-plan.md di
/home/faiz/ds/ds5opencode. Bahasa Indonesia, panggil gw bro.
Planning sudah selesai; eksekusi A–D lokal sekarang diizinkan. Gunakan defaults
status/transition/notes append-only yang tertulis kecuali gw memberi koreksi.

Audit status/log/refs/remotes/Node22; production e59abde, checkpoint terbaru cek
git log. Origin satu URL community-web, testing absent. Baca AGENTS terbaru,
handoff, plan workflow seluruhnya, auth/shared-admin baseline dan CMS/pixel SOP.
GAS tidak kembali; jangan minta inventory Google untuk coding ini.

Perbaiki bounded server pagination/filter/stats, buat additive review metadata/
notes/events + atomic/idempotent service-only RPC dan UI Pendaftar existing.
Jangan edit jawaban asli38fields/hash, public form/UI, CMS content/Auth/grants,
atau recruitment OPEN/env. SDK/dependency/infra/provider baru tidak diperlukan.
Role permissions tetap per request, actor trusted, POST Origin+CSRF, optimistic
version + audit satu transaksi, response/draft hanya memory dan text-safe.

Real PostgreSQL ephemeral + fullCMS tanpa env server agar10Team live SKIP,
recruitment +7gates/SEO/native/Team/workflow mocks4widths, public19HTML/snapshot
same-input parity dan secrets0. Source mocks bukan positive live write proof.

Selesaikan migration diff+QA+UI reviewable dahulu. Apply migration live butuh
izin konkret project/objects/SQL+backup; push butuh izin exactHEADSHA baru.
Fixture submit/status/notes/conflict/retry/childcleanup perlu izin konkret baru.
Tidak ada automatic exportPII/email/WhatsApp/Team write/allowlist/Auth mutation.
Catat local/applied/deployed/accepted dan proof limits, tanpa secrets/PII.
```

Prompt di atas template untuk permintaan eksekusi berikutnya; keberadaannya dalam
file plan tidak memberikan izin eksekusi pada sesi planning ini.
