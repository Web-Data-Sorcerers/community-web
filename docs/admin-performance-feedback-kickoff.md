# Prompt kickoff — dashboard admin performance dan feedback

Copy prompt below into a new AI session **when owner wants to authorize local
execution**. This planning document does not itself authorize execution now.

```text
Bro, lanjut IMPLEMENTASI LOKAL percepatan dashboard admin di
/home/faiz/ds/ds5opencode. Bahasa Indonesia, panggil gw bro.

Baca AGENTS.md terbaru → docs/ai-handoff.md →
docs/admin-performance-feedback-plan.md SELURUHNYA (§1–22) →
docs/cms-migration-todo.md → docs/cms-sop.md.
Sebelum UI, baca pixel SOP, assets dan fullscreen plan yang berlaku.
Baca workflow recruitment master §1–18 dan acceptance terbaru untuk invariants.

Cek git status/log/refs/remotes dan Node22 dulu; jangan reset/stash perubahan
asing. Checkpoint terbaru adalah sumber state, bukan arsip GAS/testing lama.
Production accepted terakhir14e62aff1614436b9d9a90a359b3f2800b4a6f23 READY,
recruitment OPEN/shared login accepted; cek read-only jika perlu. Origin satu
fetch/push URL community-web, testing absent jangan recreate.
Fix foto Team5c56f0dd3e5cc144ba01a269c0a98484fdf7e6cb lokal QA PASS belum
dipush; pertahankan dan pakai sebagai baseline lokal. Plan awal3cb5d53,
HEAD plan detail cek git log. Tidak ada owner session aktif/helper4393 sudah stop.
Workflow migration sudah applied, fixture12POST+cleanup sudah accepted/consumed.
GAS code removed; jangan ulang auth/GAS/setup/grant atau minta inventory Google.

Gw mengizinkan A–D LOKAL sesuai master plan:
- Ukur before/after timing dan request counts tanpa secrets/PII artifacts.
- Hapus request statistik duplikat; bootstrap GET applications lebih dulu
  untuk restored session tanpa browser CSRF, lalu filtered stats memakai as_of.
  Existing loadList POST tidak boleh dipanggil dengan CSRF kosong.
- Per-panel loading/skeleton/partial errors, generation+abort guard,
  acknowledgement hanya setelah authoritative server success.
- Fokus Pendaftar → Team → Projects → shared session/navigation UX.
- Scope busy/draft/revision, error/success/publication/conflict/unknown-result
  dan manual retry sesuai kontrak modul; tidak automatic CMS POST retry.
- Small shared helper boleh bila perlu, existing dependencies/Supabase saja.
- Selesaikan seluruh local diff+UI+QA dan commit/handoff reviewable.

Every request tetap trusted actor+CMS permission; recruitment allowlist wajib.
Protected POST Origin+CSRF. Tidak auth permission cache/TTL bypass, persistent
PII browser cache, cookie/token/HAR/storageState export atau fire-and-forget audit.
Actual401/403 membersihkan private UI; stale callbacks tidak boleh rehydrate.
Password kosong semua paths. Workflow notes append-only, 38answers/content_hash,
revision/UUID exact replay/conflict/50list/20history/WIB tetap.
CMS save tidak dianggap live sebelum deployment READY; publication retry tidak
mengulang mutation. Timeout/malformed POST response dianggap unknown dan reconcile.

Tidak public form/UI/CMS content write, Team live DML, SQL/auth existing,
grants/users/allowlist/env/OPEN/provider/region/hook/Google resource mutation.
E backend/SQL/region/infra tetap proposal terpisah berbasis profiling;
jangan langsung implement/apply karena ingin cepat.

QA: clean server env fullCMS agar10Team live mutation SKIP; recruitment/auth/
Origin/CSRF tests, workflow PostgreSQL sementara sesuai perubahan,
Native/Team/workflow+performance mocks320/390/768/1440, named12race cases,
7gates+SEO, snapshot+19publicHTML parity same local input, dist/diff secrets0.
Mocks bukti UX/request sequencing, bukan real Supabase/owner/live timing.
Targets100msfeedback dan1–2sdata proposed; laporkan angka actual/environment/n,
p50/p95/max/timeouts dan limitations; jangan fabricated PASS/instant claim.
Jangan build fixture-mutating runner bersamaan dengan build/site gates.

Live gates tetap terpisah:
1. Migration baru bila nanti dipilih perlu exactSQL/objects/project+backup approval.
2. Push perlu izin exact HEAD SHA baru; izin14e62af consumed.
3. Live owner login/read profiling belum tersedia; jangan minta password di chat.
4. Fixture save/status/note/upload/conflict/retry/hook/cleanup perlu concrete baru.
Tidak live mutation/deploy/env/hook/push otomatis. Jangan pakai izin12POST lama.

Simpan checkpoint actual proposed/local/applied/deployed/accepted dengan jelas.
Lanjut sampai local implementation+QA selesai, baru tampilkan hasil konkret,
exact commit, before/after performance, tests dan gate live yang masih pending.
```

For planning only in a new session, replace the first line and authorization
paragraph with an explicit PLAN ONLY instruction; do not use this execution
prompt unchanged if implementation is not desired.
