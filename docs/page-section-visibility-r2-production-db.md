# Pages & Sections — Paket A / R2 database production

11 Oktober 2026, 11:06–11:07 UTC (18:06–18:07 WIB).
Owner menjawab “gass” setelah paket approval konkret dan urutan berikutnya
disajikan. Scope yang diumumkan pada awal pass: Paket A SQL exact + verifikasi
R2. Ini bukan izin push/deployment/provider/live toggle/restore. Instruksi baru
“commit dan push” belum diberikan. [R0](page-section-visibility-r0-preflight.md)
tetap baseline historis; [release R0–R7](page-section-visibility-production-release-plan.md)
tetap acuan gate berikutnya.

## Hasil production database

Migration berhasil dan loader API siap pada target/kredensial existing yang
diuji. Fitur web belum live: Current/primary alias tetap deployment lama.

| Bukti                      | Hasil                                                                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target SQL/loader          | `yejrdckcmlxrkklgtrwy`; hostname SUPABASE_URL lokal cocok dengan write project constant                                                                       |
| File exact                 | `supabase/migrations/20261011160000_site_visibility.sql`                                                                                                      |
| SHA256                     | `62844c643ca608582334647824978663b758753c8623b87a6ac7622dd7a1b82c`                                                                                            |
| Catalog sebelum            | Tiga tabel/tiga fungsi visibility absent, tidak partial/reapply                                                                                               |
| Apply acknowledgment       | HTTP201, 11:06:26.461–11:06:26.781 UTC; transaksi BEGIN/COMMIT dari satu file                                                                                 |
| Catalog sesudah            | Tiga tabel private, validator private, dua public RPC dengan signature expected                                                                               |
| Function security          | Owner postgres; validator non-definer, wrappers SECURITY DEFINER; search_path=pg_catalog; anon/authenticated EXECUTE false, service_role true hanya load/save |
| Table security             | Ketiga tabel RLS ON, deny USING(false)/WITH CHECK(false), direct privileges anon/authenticated/service_role false                                             |
| State                      | Satu singleton schemaVersion1; SQL validator dan JS contract valid                                                                                            |
| Revision actual            | `00000000-0000-4000-8000-000000000001`                                                                                                                        |
| Defaults                   | 19 pages: Home+16 lainnya ON, About/HoF OFF; semua21 section prefs ON; home.projects=true                                                                     |
| Receipt/events             | Nol requests, nol events; tidak memanggil save/no-op sebagai probe                                                                                            |
| Remote loader              | HTTP200 valid tiga kali 11:06:32.041 / .160 / .230 UTC, revision konsisten                                                                                    |
| Schema-cache reload        | Tidak dijalankan; PostgREST langsung mengenali loader                                                                                                         |
| REST anon loader           | HTTP401/code42501, denied; key existing dibaca in-memory                                                                                                      |
| Direct state actual probes | SET LOCAL ROLE anon/authenticated/service_role + SELECT dalam read-only transaction, semuanya denied42501/Management API400                                   |

Semua 11 grouped catalog/state/default checks PASS. Catalog membuktikan direct
privilege denial ketiga tabel serta save RPC denial tanpa memanggil save.
Authenticated owner GET/save-to-public acceptance belum dilakukan.

## Preservation before/after

Immediate snapshots membandingkan 18 table definitions (17 private existing +
auth.users definition), 72 private/public existing functions, serta enam CMS
collection dan admin user/permission content fingerprints. Definitions mencakup
owner/ACL/RLS, columns/defaults/constraints/policies dan function signatures,
SECURITY DEFINER/search_path/body. Ketiga comparison groups identik:

| Group                    | SHA256 before = after                                              |
| ------------------------ | ------------------------------------------------------------------ |
| Tables                   | `8070d8531aba41c698c7ae8a10c3e9a620db9ad3a908e59b54f5892e71cad483` |
| Existing functions       | `be9bae18ed904330dce9ad97e7790e21f61467a1240c19699cdefcf9d5290357` |
| Protected content/access | `e58e34d408a251d2514ea26c3f4baa7dde8f4b56cf470601e80f2c68aab9676e` |

Counts/hash tetap: projects4, team_members25, domains6, hods6, roles6, partners1,
cms_admin_users1, cms_admin_permissions1. Hanya aggregate hash/count disimpan,
bukan account/applicant rows. Auth account contents tidak diekspor; auth.users
definition terjaga dan migration tidak menulis Auth. Tidak mengubah allowlist,
existing grants, enam CMS collection/schema/content, recruitment schema/intake,
storage atau provider/config. Ini bukan full backup/PITR.

Query fingerprint awal membutuhkan explicit cast PostgreSQL polcmd; query
read-only diperbaiki sebelum migration dan baseline sukses. Error diagnosis
disimpan terpisah, bukan apply attempt. Migration applied tepat sekali; tidak
seluruh folder/db push. Acknowledgment ini tidak mengklaim entry provider
migration-history otomatis terisi.

## Git/provider/live dan gate berikutnya

- HEAD tetap `51ce1984112283ad533e018dbebcb6b3730a138a`; remote main tetap
  `144e6812cda44c5f59b3152bffe6f0d027bc2e6b`. Tidak commit/push/source change;
  hash migration/CMS snapshot dan seluruh dirty existing dipertahankan.
- Current `dpl_5Kp2u5fzhVTgnVUMtykugjKUef3o` READY pada SHA144e681,
  primary alias data-sorcerers-community-sigma.vercel.app, provider Node24/main.
- Live Home/About/HoF200 masih komposisi lama tanpa visibility revision;
  content API200 source=supabase; intake GET200 accepting=true. Ini baseline
  deployment existing, bukan acceptance fitur visibility baru.

**R2 DB/API acceptance PASS pada target/kredensial existing yang diuji.**
R3 tetap pending: freeze final SHA, provider sensitive env/backend match dan
effective function routing/count/duration. Registration env tidak membuktikan
value. Tidak deploy untuk membuktikannya tanpa approval baru. R5 authenticated
owner GET dan R6 save-to-public tetap pending.

Paket C kini punya initial observed DB revision di atas, tetapi bukan izin
toggle atau jaminan revision tetap sama. Baca ulang setelah R5 sebelum save,
stop/review jika changed. Projects tetap ON. Target fresh visit setelah save
confirmed tanpa rebuild; bukan 0ms atau automatic update tab pengunjung terbuka.

Rollback default mempertahankan additive objects, tidak DROP/reseed. Candidate
provider rollback pada R0 harus dicek ulang dan membutuhkan izin tersendiri.

Ignored evidence: `artifacts/site-visibility/r2-20261011/`: before-query-error,
before/apply/after/verify/checks/preservation, loader/role-denials,
provider-current/live-existing JSON. Tidak token/cookie/raw PII pada Git atau
evidence. Dokumen ini belum committed.
