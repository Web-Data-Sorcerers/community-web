# Admin bersama CMS dan Recruitment — 8 Oct 2026

## Work order dan baseline

Faiz meminta satu dashboard admin untuk CMS dan pendaftar, serta recruitment
siap dibuka. Implementasi lokal diotorisasi. Runtime production72c36bd READY;
HEAD checkpoint1bc75f5. Pembukaan production dilakukan sesudah hasil lokal dan
uji penyimpanan konkret dapat ditinjau; push tetap izin exact SHA tersendiri.
GAS retirement resource tetap pass terpisah. Testing project tidak dibuat ulang.

## A. Satu sesi, izin tetap per modul

Gunakan Supabase Auth password dan cookie sealed CMS existing sebagai sesi admin
bersama. Recruitment membaca sesi melalui createCmsAuth.authorize lalu memeriksa
admin_verify_identity dengan trusted actor.id di setiap request. CMS grant saja
tidak memberikan akses pendaftar; allowlist recruitment tetap diperlukan.
Tidak seed/alter grant, table, provider, SQL, bucket atau akun Auth.

Login/refresh/logout recruitment legacy menjadi adapter ke lifecycle CMS.
Cookie sb-* lama tidak boleh memberi akses pendaftar. Logout admin menghapus
cookie bersama dan cookie recruitment lama. GET logout tidak lagi mengubah sesi;
POST membutuhkan Origin dan CSRF. Renewal cookie diteruskan pada response reads.
Auth isolation sebelumnya sengaja diganti shared-session contract: sekali login
owner boleh kedua modul bila kedua izin aktif; logout menutup kedua modul.

## B. Inventaris UI custom dan pass per surface

Tidak ada node Figma, URL Figma atau reference PNG untuk dashboard admin custom;
jangan mengarang atau mengklaim Figma pixel accuracy. Public section terkunci.
Existing font Bluu Next700/Manrope400/700 dan logo lokal digunakan, tanpa aset
atau dependency baru. Target viewports320/390/768/1440, natural document scroll.

| Pass | Surface                | Layout dan kriteria                                                                                                                                                                                                           |
| ---- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1   | Navigasi admin bersama | component nav di atas masing-masing header, links Projects/Team/Pendaftar, active aria-current; max1280, gap8, padding8/16, margin-bottom32, wraps mobile; keyboard visible focus                                             |
| B2   | Projects               | existing editor /admin/; nav Projects aktif; auth controls dan CRUD/revision/min-max/media tetap; keyboard dan dirty-navigation protection diuji                                                                              |
| B3   | Team                   | existing /admin/team/; nav Team aktif; auth controls dan CRUD/revision/slots tetap; UI-only mock writes, tanpa Team live mutation                                                                                             |
| B4   | Pendaftar              | /admin/recruitment/; same nav/session, stats+list+filter+detail; semua canonical fields ditampilkan text-safe, nama label Indonesia; tabel boleh scroll di wrapper tanpa document overflow; login sekali dan logout POST CSRF |

Palette existing: base#050507, surface#16141f, text#ffffff, muted#bcb7cb,
accent#9b7bff, border#393344. Heading40/48 desktop32/40 mobile; controls Manrope16/24.
Existing editor geometry dipertahankan di dalam workspace. Nav identitas menyatukan
modul tanpa iframe atau membuka Supabase dashboard untuk owner.

## C. QA lokal dan bukti

Capture public19HTML/snapshot hash baseline sebelum build. Tests intake existing
tetap; update recruitment auth tests ke shared cookie, trusted CMS identity,
independent recruitment grant, revoked/expired/malformed session, CSRF, refresh,
global logout, bounded errors/no secret leakage. Actual sealed-cookie integration
memakai Auth mock; bukan owner live proof. CMS focused lifecycle/native/media,
CMS light (tanpa env server agar Team live SKIP), recruitment DB verifier,
build, tujuh gate+SEO, Projects/Team mocks4widths, unified recruitment mock4widths
termasuk login→navigation→logout, details semua field dan XSS-safe.
Public19HTML exact/snapshot bytes unchanged/dist secret scan0.

## D. Live release dan pembukaan

1. Review diff+QA dan commit lokal; minta izin exact SHA push production.
2. READY exact SHA+primary alias dan real owner single-login reads kedua modul;
   anonymous401, grant-specific denial, refresh dan logout kedua modul.
3. Siapkan satu synthetic applicant example.invalid, exact receipt+hash, submit
   satu kali, identical retry, DB row/answer match, detail/stats/list match,
   cleanup exact receipt tanpa membaca atau menghapus applicant lain.
4. Tampilkan target approval konkret sebelum fixture dan env mutation:
   RECRUITMENT_OPEN=true Production projectprj_3KbX29t6DYN1RMTy88lKHXd0IUVE,
   preserving env ID/type/scope. Redeploy concrete SHA diperlukan untuk env runtime.
   Fixture/env/redeploy belum dilakukan oleh plan ini.
5. Setelah acceptance, biarkan open sesuai keputusan Faiz; monitor sanitized
   counters/errors. Tidak ada auto email/decision/export/status workflow dalam
   pass penyatuan existing dashboard. Status seleksi/catatan reviewer/ekspor
   memerlukan work order berikutnya bila diminta.

## Rollback dan checkpoint

Sebelum membuka, captured env metadata dan deployment72c36bd retained. Rollback
kode shared auth memulihkan model sesi terpisah; owner login ulang diperlukan.
Jika intake bermasalah, close flag+redeploy approved exact target; existing rows
tetap tersimpan. Jangan delete data untuk rollback. Catat proof limits dan SHA
checkpoint lokal, tanpa credential, cookie, payload applicant atau PII.

## E. Hasil lokal — 8 Oct 2026

Node22.23.0 fresh. CMS suite actual127tests:117PASS+10Team liveSKIP/0FAIL,
termasuk actual PostgreSQL Roles/Domains/Hods/Partners/auth/delete. Recruitment
28PASS/0FAIL mengganti test session sb-* dengan21shared-admin tests plus7intake
existing. Focused auth/native/media+recruitment54PASS pada run sebelum tambahan
malformed POST test; recruitment28 final mencakup tambahan tersebut. Intake
ephemeral PostgreSQL13/13PASS, tanpa external DB env.

Build0errors/23pages; tujuh gate+SEO PASS, browserErrors kosong,
responsive468/468, spacing39existing components + explicit nav/3admin surfaces, SEO23. Existing native Projects/Team/legacy
admin mocks masing-masing4widths PASS. Unified mock320/390/768/1440: sekali login,
nav3modules,38canonical fields, text-safe malicious string, keyboard detail,
filter, deny-clears-data dan logout bersama PASS;0content writes/pageerrors.
Mock bukan owner proof atau live persistence proof. Public19HTML exact, snapshot
SHA4345f1abe445aa2a400c31413ccc058707a77105a7e388dc8d1074e78da94857 tetap;
52dist textfiles/0server secret matches. Tidak ada reference/assertion public
atau dependency berubah.

Read-only live audit: applications0, grantCMS1active, recruitment allowlist1active,
intersection owner1. Env Production RECRUITMENT_OPEN idVlf93j1vLtXTaDFP,
typesensitive/targetProduction; nilainya tidak dicetak. Live GET masih
accepting:false. Supabase3env presentProduction. Tidak ada env mutation, SQL/grant/
fixture/redeploy/hook atau push. Runtime tetap72c36bd; checkpoint lokal saja.
Proof ignored artifacts/admin-unified/{qa-summary,browser-proof,parity-secrets,
state-audit,env-audit}.json; QA logs artifacts/cms-gas-retirement/unified-*.log.
NEXT exact SHA approval untuk push kode → READY + real shared-owner acceptance
→ concrete opening/fixture/cleanup approval. Detail commit cek git log.

## F. Deploy dan read-only regression — 8 Oct 2026

User approved exact00ac70a03516507db7d6618b23bf117856c79539 (`okee gas ajaa`).
Satu push origin/community-web selesai; izin consumed. Main/origin/main/
production/main exact00ac70a sebelum checkpoint docs lokal. Tidak ada second push,
env mutation/redeploy/hook/content write atau SQL/grant mutation.

Production deployment dpl_6QoWfvLG2BMAijeMrqhLWn2Z22FA READY exact00ac70a dan
primaryalias data-sorcerers-community-sigma.vercel.app assigned; provider readyAt
1791434271858 = 8Oct2026 04:37:51.858UTC/11:37:51.858WIB. Workspace clock terpisah.
Actual logs prebuild scripts/fetch-cms.mjs, remote snapshot validated, Astro23pages.
Public19/19 HTML hashes exact baseline. Actual anonymous Projects/Team/media401,
Recruitment stats/list401; intake GET200/accepting:false. Live3admin shells×390/1440
6cases PASS, login labels/password empty/workspace hidden/nav3modules/overflow0/
pageerrors0. Initial networkidle wait timed out Recruitment; use DOMContentLoaded
then explicit actual session-ended readiness; no application code changed for it.
Ini anonymous browser proof, bukan owner access proof.

DB fresh: Projects4, owner grant1active, applications0/media0; canonical fingerprints
Projects8a7d4624d896842800dfd191892df7a8,
Teamb867f2890c939b410e3e428259082883,
recruitment allowlist2a36dbfe696b9406baabd0cd4de9fb6f unchanged. Read-only intersection
owner1 dari audit sebelum push; tidak dimutasi. RECRUITMENT_OPEN metadata tetap
idVlf93j1vLtXTaDFP/type sensitive/Production; Supabase env present. Tidak menyatakan
nilai sensitive terbaca; live status membuktikan closed.

Owner diminta login sendiri dan berpindah Team/Pendaftar tanpa login ulang;
respons/owner shared-session read/refresh/logout belum ada. Cookie/credential tidak
tersedia di agent; browser terhubung restart lagi. Jangan menganggap login lama
sebagai proof00ac70a. Tidak mengambil data applicant atau credential. NEXT tetap
§D: owner acceptance, concrete synthetic fixture+cleanup dan pembukaan Production
approval. Full rollout/pembukaan recruitment belum accepted. GAS retirement
resource juga pending dan terpisah. Checkpoint ini lokal saja, push baru exactSHA.
Proof ignored artifacts/admin-unified/{deployments-current,build-log-proof,
public-after-push,admin-anonymous-shells,state-after-push,env-audit}.json.

## G. Delegasi seluruh acceptance — 8 Oct 2026

Faiz meminta agent menjalankan seluruh pengujian lanjutan (`coba lu yang
jaalanin aja semua`). Agent memeriksa browser connected page4 production/admin:
Projects/Team/Recruitment stats401; secure owner credential tidak tersedia di
env lokal. Sesi owner browser pribadi tidak dapat dipakai dari browser agent.
Owner diminta satu kali login di tab pengujian; bukan diminta menjalankan QA.
Ini dependency akses, bukan meminta ulang izin push atau memaksa password rotation.
Tidak mint/bypass token atau membuat/mereset akun untuk melewati dependency.

Target lanjutan disiapkan: Production projectprj_3KbX29t6DYN1RMTy88lKHXd0IUVE,
RECRUITMENT_OPEN=true existing envIDVlf93j1vLtXTaDFP/typesensitive/Production,
redeploy exact runtime00ac70a (bukan checkpoint docs HEAD). Satu fixture sintetis
receipt097010d8-37d7-403f-a15e-285d5493b4fc,
canonical SHA256a1075865f744f3f1e5f49adbec985dbe71ca2d632090fd9b06bb55b089a0451f.
Validator server actual PASS untuk synthetic example.invalid payload. Rencana:
submit1 + identical retry1 → tepat1matching row/canonical answers → owner
list/stats/detail → cleanup hanya exactreceipt+hash → fixture absent; applicant
lain dipertahankan. Ignored opening-fixture-plan.json menyimpan synthetic-only
payload; tanpa credential/PII nyata. Belum ada submit, delete, env mutation,
redeploy, hook atau push. Production fresh READY00ac70a. Lanjut setelah akses
owner tersedia, sesuai gate§D. Semua retirement GAS/resource tetap terpisah.
