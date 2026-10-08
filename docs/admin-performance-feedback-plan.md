# Dashboard admin — performance, loading dan feedback plan

8 Oct 2026. Owner meminta PLAN untuk percepatan seluruh dashboard admin dan
pesan loading/error/success. Status **PROPOSED / PLAN ONLY**; belum implementasi,
timing authenticated baru, SQL, config, deployment atau owner acceptance baru.
Terpisah dari fix foto Team lokal. Production14e62af workflow accepted tetap.

## 1. Tujuan dan batas

Projects `/admin/`, Team `/admin/team/`, Pendaftar `/admin/recruitment/`, shared
login/refresh/logout, upload, save/delete/publication, status/note/conflict/retry.
Respons UI cepat, data pertama muncul tanpa request berulang, pesan setiap
operasi jelas. Existing Supabase dan dependencies; tanpa provider/infra baru.
Public form/UI, CMS content, grants/users/allowlist/env/OPEN tidak berubah.

Target usulan, **bukan hasil ukur atau janji instan**:

| Ukuran                   | Target awal                                    | Kondisi                                        |
| ------------------------ | ---------------------------------------------- | ---------------------------------------------- |
| Feedback klik/input      | ≤100ms p95                                     | UI lokal, tidak menunggu API                   |
| Struktur/skeleton awal   | ≤200ms setelah JS siap                         | Tidak memuat data privat sebelum izin          |
| Data pertama modul       | ≤1s p50 / ≤2s p95                              | Warm, jaringan baik; evaluasi setelah baseline |
| Konfirmasi save terlihat | ≤100ms setelah response sukses                 | Bukan sebelum DB commit                        |
| Pekerjaan sekunder       | Tidak menghalangi data utama                   | Statistik/history dapat loading sendiri        |
| Cold/slow request        | Feedback progres, batas tunggu dan retry jelas | Timing dilaporkan terpisah                     |

Jika bottleneck jaringan/region menghalangi target, laporkan ukurannya dan opsi
konkret; jangan menyembunyikan latensi atau mengubah infra otomatis.

## 2. Temuan source audit

| Surface               | Bukti saat ini                                                                               | Implikasi                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Recruitment bootstrap | `src/scripts/recruitment-admin.js`: stats → loadList → stats                                 | 3 request berurutan, statistik diduplikasi                                             |
| Recruitment list      | Daftar dirender sebelum filtered stats; stats memakai list `as_of`                           | Jaga konsistensi snapshot, jangan asal parallel dengan timestamp berbeda               |
| Recruitment detail    | Detail → notes/history parallel                                                              | Detail bisa ditampilkan dahulu; notes/history tidak harus mengunci form sepanjang read |
| Recruitment save      | Mutation → detail+notes/history → list → stats; `saving` false di finally                    | Acknowledgement dan interaksi tertunda oleh refresh pendukung                          |
| Recruitment fetch     | Tidak ada browser AbortController/deadline; generation guard sudah ada                       | Response lama diabaikan tetapi request tetap berjalan                                  |
| Projects fetch        | `src/scripts/cms-admin-editor.js`: load GET, busy global, fetch tanpa deadline               | Read dan mutation perlu status/recovery berbeda                                        |
| Team fetch            | `src/scripts/cms-team-editor.js`: `setBusy` menonaktifkan semua button                       | Proses satu area membuat dashboard terasa terkunci                                     |
| CMS backend           | `server/cms-admin.mjs`: auth → RPC/Management write → publication hook                       | Tersimpan dan permintaan publikasi harus dibedakan dari situs sudah live               |
| Shared auth           | `server/cms-auth.mjs`: getUser → cms_verify_admin tiap request                               | Trusted identity/permission wajib, bukan kandidat bypass                               |
| Recruitment backend   | `server/recruitment-admin.mjs`: auth → admin_verify_identity → data RPC → awaited read audit | Beberapa perjalanan upstream per request; ukur durasi tiap tahap                       |

Audit read saat ini awaited, walau failure ditoleransi. Jangan memindahkan audit
ke promise tanpa await pada serverless: delivery bisa hilang. Gabungan RPC/audit
hanya opsi fase terpisah setelah profil dan review SQL; pertahankan audit.
Belum ada bukti root cause region, cold start atau query DB lambat.

## 3. Tahap A — ukur sebelum optimasi

Tambahkan instrumentation lokal/in-process: waktu navigasi, JS ready, feedback,
first usable data, total settle; API time auth identity/CMS permission/recruitment
permission/data/audit/publication, request count, bytes dan status. Timing output
hanya aggregate/module/action/status; tidak URL query ber-PII, body, actor email,
receipt nyata, token/cookie/CSRF/credential. Tidak HAR/trace/storageState sensitif.

Ukur Projects/Team/Pendaftar: initial load, reload, pindah modul, filter/page,
detail, synthetic save/upload, timeout, conflict dan logout. Pisahkan cache/warm
dan cold, mobile390/desktop1440, normal dan jaringan lambat; laporkan sample n,
p50/p95 dan worst, bukan satu request tercepat. Contoh baseline lokal20 reads
per skenario warm; cold alami dilaporkan terpisah tanpa force restart production.
Mutation mocks dan temporary PostgreSQL dahulu. Live login/read-only terpisah;
live fixture/save/upload/hook/cleanup harus punya scope approval konkret baru.

Read-only deployment region/log metadata bila relevan; tidak menyalin raw logs
yang mungkin berisi payload. Tooling provider existing, tanpa telemetry baru.
[Vercel slow function guide](https://vercel.com/docs/functions/debug-slow-functions)
menjelaskan diagnosis duration/cold start/region. Database query plan diuji lokal
pakai synthetic data dahulu sesuai
[Supabase query optimization](https://supabase.com/docs/guides/database/query-optimization).
Tidak enable EXPLAIN endpoint atau extensions baru di live.

## 4. Tahap B — hapus request berulang, tampilkan data utama dahulu

Default prioritas: Pendaftar → Team → Projects → shared navigation/auth UX.

Pendaftar initial load: langsung satu list request untuk validasi sesi+permissions
existing dan data pertama, lalu satu filtered stats memakai `as_of` response
list. Hapus stats bootstrap duplikat:3 menjadi2 read request, daftar tidak lagi
menunggu initial stats. Skeleton statistik terpisah. Filter tetap submit existing;
tidak otomatis fetch setiap karakter. Jika live search dipilih kemudian, debounce
dan minimum input disepakati; tidak masuk default.

Dedupe hanya read identik yang sedang in-flight pada modul/session generation,
endpoint+normalized filters+as_of. Tidak gabungkan audit berbeda, mutation, atau
request setelah logout/identity change. Abort read saat input/screen/session
berubah, tetap generation guard karena abort tidak menjamin server berhenti.

Detail muncul segera setelah detail response; notes/history loading masing-masing,
partial error bisa retry per panel. Mutation sukses: update hanya field metadata
yang benar-benar ada dalam response, tampilkan acknowledgement segera; invalidate
affected list/stats/notes/history dan refresh dengan urutan dependensi `as_of`.
Jangan menampilkan version/status fiktif; form write baru tetap disabled hingga
fresh revision terkonfirmasi. Saving network dan revalidating UI dipisahkan.

Projects/Team: tampilkan list begitu load response selesai; upload hanya mengunci
kontrol upload/save yang bergantung pada foto. Save/delete tetap mengunci operasi
yang dapat konflik. Pindah modul tidak boleh membuang draft tanpa konfirmasi.
Render small field changes daripada rebuild seluruh DOM jika diukur bermanfaat.

## 5. Tahap C — loading dan status konsisten

Desain admin custom existing, tidak ada node Figma baru. Pertahankan Manrope,
Bluu Next, palette gelap/violet, spacing8–32, max1280, padding32/16,
controls48 existing. Inventaris per surface: login, navigation, module toolbar,
list/form/detail, stats/notes/history, upload, save/publication, logout.
Tidak mengganti layout publik. Per-section plan SOP sebelum implementasi UI.

State model: idle → loading → ready/empty/partial/error; mutation terpisah
draft → saving → confirmed/conflict/rejected/unknown → reconciling.

Skeleton sesuai bentuk konten pada initial load, fixed geometry untuk mencegah
layout shift; tidak spinner fullscreen. Reload di modul yang sama menjaga data
yang sudah valid terlihat dengan label “Memperbarui…”; 401/403 segera clear semua
data privat. Empty hanya setelah response sukses0, bukan sebelum request selesai.
Tidak menghalangi seluruh nav karena stats/history sedang loading.

Loading terlihat langsung; setelah3s beri pesan lambat dan tindakan yang tepat.
Read deadline awal15s sebagai kandidat, diselaraskan dengan timeout server dan
hasil pengukuran. Tombol “Coba lagi” hanya mengulang panel yang gagal. Tidak fake
progress percentage; indeterminate untuk upload tanpa byte progress terukur.
Mutation timeout tidak diberi label pasti “gagal”; server bisa sudah commit.

## 6. Pesan yang direncanakan

| Keadaan                   | Contoh pesan                                                    | Tindakan                                            |
| ------------------------- | --------------------------------------------------------------- | --------------------------------------------------- |
| Initial load              | “Memuat pendaftar…”                                             | Skeleton bagian data                                |
| Reload                    | “Memperbarui daftar…”                                           | Data lama pada screen yang sama tetap terlihat      |
| Slow read                 | “Data belum selesai dimuat.”                                    | Tetap menunggu sampai deadline; retry setelah gagal |
| Empty global              | “Belum ada pendaftar.”                                          | Normal, bukan error                                 |
| Empty filter              | “Tidak ada pendaftar sesuai filter.”                            | Reset filter                                        |
| Read offline/timeout      | “Data belum bisa dimuat. Coba lagi.”                            | Retry panel; jangan logout otomatis                 |
| Save pending              | “Menyimpan perubahan…”                                          | Disable write relevan                               |
| Confirmed review          | “Status diperbarui.” / “Catatan ditambahkan.”                   | Refresh pendukung                                   |
| Confirmed CMS save        | “Perubahan tersimpan. Penerbitan diminta.”                      | Jangan klaim sudah live                             |
| Publication partial/error | “Perubahan tersimpan, tetapi penerbitan belum berhasil.”        | Retry publication, tidak ulang save                 |
| Unknown write result      | “Hasil penyimpanan belum terkonfirmasi. Periksa data terbaru.”  | Reconcile sebelum retry                             |
| Exact workflow replay     | “Kiriman ini sudah tersimpan. Tidak ada duplikasi.”             | Tidak tambah effect                                 |
| Conflict409               | “Data sudah berubah. Muat versi terbaru; draft tetap tersedia.” | Review ulang sebelum write baru                     |
| Input invalid             | “Periksa [field yang salah].”                                   | Inline field error+focus                            |
| Forbidden403              | “Akun ini tidak memiliki akses ke modul ini.”                   | Clear private module data                           |
| Session expired401        | “Sesi berakhir. Masuk lagi untuk melanjutkan.”                  | Clear private data/password                         |
| Logout success            | “Sudah keluar.”                                                 | Semua module session data cleared                   |
| Logout failure            | “Belum bisa keluar. Coba lagi.”                                 | Jangan mengklaim session terminated                 |

Pesan penting persistent inline dekat aksi. Toast hanya pelengkap untuk success
singkat; tidak menghilangkan error/draft. role=status/aria-live polite untuk status,
role=alert untuk error relevan, aria-busy per panel, focus tanpa stealing saat
background refresh, keyboard dan prefers-reduced-motion terjaga.

## 7. Tahap D — recovery, izin dan privasi

Setiap API request tetap trusted actor+CMS permission; recruitment allowlist juga.
POST Origin+CSRF, sealed cookie dan global logout tetap. Tidak membuat cache auth
lintas request atau memperpanjang permission freshness untuk mengejar latency.

Default **tanpa persistent PII cache**: tidak localStorage/sessionStorage/IndexedDB,
Service Worker, CDN/shared cache, browser token, global server session object.
In-flight dedupe bukan response cache. DOM data pada screen aktif boleh tetap
terlihat selama reload, tetapi revoke401/403/logout/navigation expiry membersihkan.
Existing module routes full-page navigation; cache memory tidak otomatis hidup
lintas page. Persistent admin shell adalah opsi tahap lanjut, bukan asumsi quick win.

Read retry bounded dan manual default. Workflow write retry mempertahankan UUID
dan payload identik untuk intent yang belum dikonfirmasi. Projects/Team/upload
tidak dianggap idempotent hanya karena workflow idempotent: jangan automatic retry
POST mereka. Reconcile state/revision dahulu; field draft non-secret tetap tersedia
selama session valid. Password tidak dipertahankan. Global refresh single-flight
hanya di document context yang sama; test rotated-cookie races antartab.

## 8. Tahap E — backend berdasarkan bukti

Bila B–D belum memenuhi target, gunakan profiling A untuk pilih satu optimasi:
combined protected read RPC/list+stats dengan satu snapshot; request-scoped
dedupe verifikasi identitas yang benar-benar redundant; query/index lokal dengan
synthetic cardinalities50/500/5000, filter/sort/count/explain. Default tetap existing
SQL/Auth, dan protected operations tidak boleh mulai sebelum izin diverifikasi.

Gabungan permission/data/audit memerlukan proof revoke/race/ACL dan mempertahankan
audit semantics. Jangan parallelize authorization dependent steps sembarangan.
SQL additive lokal optional hanya jika benefit terbukti; live apply memerlukan
exact objects/project+backup approval. Region/provider/env/upgrade tetap opsi
review terpisah, tidak bagian eksekusi default. Tidak fire-and-forget audit,
menonaktifkan grant checks atau mengklaim cold start tanpa data.

## 9. QA dan acceptance

Local: existing fullCMS tanpa server env sehingga10Team live mutation SKIP,
recruitment/auth/Origin/CSRF/conflict/retry tests, workflow ephemeral PostgreSQL
bila kontrak workflow berubah. Mocks320/390/768/1440 untuk3module + shared auth:
fast/delayed/timeout/offline/400/401/403/409/429/500/malformed JSON,
out-of-order responses, double click, navigate while pending, expired/revoked
session, rotated CSRF, note XSS safety, failed panel without blocking others.
Mutations unknown→reconcile, replay single effect, unchanged draft, global clear.

Compare before/after timing and request counts with same fixtures/environment;
delay mocks membuktikan UX/sequence, bukan real Supabase latency.7gates+SEO,
public HTML/snapshot parity, dist/diff secrets0; admin-only asset hash changes
dicatat bila memengaruhi bundling, jangan melonggarkan parity tanpa alasan.

Live release terpisah: exact HEAD SHA approval→one push→READY/primaryalias→
secure owner read-only metrics. Live mutation/fixture/hook/cleanup membutuhkan
izin baru konkret; fixture12POST sebelumnya sudah selesai/consumed, bukan izin
uji baru. Recruitment OPEN, existing data/grants/content/provider unchanged.

## 10. Deliverables dan urutan eksekusi

1. A: baseline timing/request graph + bottleneck verdict, no sensitive artifacts.
2. B: remove duplicate reads + priority rendering; before/after call count proof.
3. C–D: shared loading/feedback/recovery behavior dan copy matrix accepted lokal.
4. QA:3modules/auth mocks, gates/parity/privacy and measurable improvement report.
5. E hanya jika profil membuktikan perlu: local reviewed SQL/backend proposal.
6. Commit/local reviewable diff; exact push approval; live acceptance scope terpisah.

Rekomendasi: **A–D dahulu**. Tidak perlu dependency/infra/upgrade atau SQL baru
untuk menghapus request berulang dan membuat UI lebih responsif. Implementasi
performance belum diotorisasi oleh pesan plan ini; NEXT review plan → instruksi
eksekusi lokal. Semua target di atas masih proposed, bukan applied/deployed/accepted.
