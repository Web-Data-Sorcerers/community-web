# Recruitment simplification and wider applicant detail — LOCAL COMPLETE

Owner requested a safe plan on12 Oct2026; later authorized local execution.
The planning sections below are retained as the implementation contract. The initial planning pass made no source/release/DB writes; local execution
and final acceptance are recorded below. Existing Home/contact/focus local changes and dirty docs retained.
Admin shared-login plan remains separate and unimplemented.

## Intended result

Applicant detail prioritizes readable full answers in a wide main column, with
internal review controls clearly separate. New applicants no longer see questions
34(best_description),35(independent_learning), or Collaboration & Teamwork.
Keep all three required Community Agreement checkboxes with no question number.
Preserve all old applicant records and their answers.

Scope assumption for review: remove the entire Collaboration & Teamwork block,
questions25–27(team_comfort,team_roles,team_story), rather than only25–26 shown
in the old record screenshot. Keep cross_hods_willingness, which belongs to a
separate commitment question. Old records may still show team answers.

## Findings from current source

- AdminRecruitmentPanel.astro uses380px sidebar plus remaining answer column at
  1024px, nested main.detail-main-pane, padding22/gap28 and additional card grids.
  Admin entry shell global main rule has max-width1280/margin auto/padding32/24;
  this also potentially affects nested main. Confirm computed sizes in browser
  before attributing the screenshot narrowing solely to this rule.
- Client serializes named form controls; shared server recruitment-contract.mjs
  still requires best_description and independent_learning. Removing only markup
  would reject new submissions as INVALID_INPUT.
- Data is stored as JSON fields; team_comfort has an existing generated read
  column. Keep it. Admin groups skip absent/empty values, so old records can
  retain answers while new submissions omit these questions.
- Draft and uncertain pending submission are kept under separate storage keys.
  A pending request must keep its exact original payload and receipt.

## Package A — wider, clearer detail UI

Owner-requested admin refinement; no supplied Figma node for this admin view.
Keep established colors and Bluu Next/Manrope, using8-point spacing in changed
layout. Proposed geometry, to verify in browser:

1. Give the outer admin container a named shell selector; avoid styling every
   main element. Replace nested main with a section labelled by the answers
   heading, preserving a single main landmark. Apply equivalent shell rules to
   /admin, /admin/team and /admin/recruitment entry routes.
2. Detail mode can use available viewport width up to1440px, desktop gutters32px,
   mobile16px. Keep other panels' current widths to avoid unrelated layout change.
3. Desktop sidebar320px, gap32px, answers minmax(0,1fr), children width100% and
   min-width0. Use a stacked layout when available width cannot fit a useful
   answer column. At1280px target roughly864px answers if outer widths allow.
4. Applicant summary spans full width: name, email, domain, submitted time and
   status with clear labels. Receipt is secondary and wraps without truncation.
5. Put answers first in reading/mobile order, internal selection/notes/activity
   separately labelled. Keep long answers one full-width row; short identity
   fields may use two columns when space permits. No line-clamp, fixed-height
   answer scrollboxes or hidden text. Preserve line breaks and safe text rendering.
6. Use16px body/24px line-height for answers, clear labels,24px card padding and
   16/24/32 spacing. Show review feedback only when it contains a message, while
   retaining live-region behavior; no unexplained empty outlined status box.
7. Keep selectors/listeners for status/save/note/history/reload/retry intact.
   Sticky controls only on roomy desktop; avoid nested scrolling that traps
   mobile users. Keyboard focus and reduced-motion behavior remain accessible.

## Package B — simplify form safely

1. Remove questions34 and35 markup and now-unused imports. Change final section
   title to Community Agreement; retain its three statements/required flags and
   use the unnumbered label Community Agreement. No preset/fake answers.
2. Remove the full collaboration block25–27 per scope assumption. Update step4
   legend/navigation summary to describe the retained commitment/motivation/
   agreement content. Keep four wizard steps to avoid unnecessary routing changes.
3. Renumber the retained question labels and section badges consecutively after
   removing the block; agreement remains unnumbered. Update comments/accessibility
   labels and browser assertions so no references point to removed content.
4. Remove best_description/independent_learning from REQUIRED_CHOICES only.
   Retain their CHOICES allowlists and historical field support. Team fields stay
   recognized optional fields for old payloads; missing values normalize to the
   existing empty string/array values. Do not remove JSON data/generated columns,
   invent defaults, or change consent requirements.
5. Existing saved draft: restore only controls present in the new form; remaining
   answers survive and removed fields are not submitted by a new serialization.
   Existing uncertain pending request: retry exact original receipt/payload;
   never strip fields or regenerate IDs, avoiding duplicate/ID_CONFLICT behavior.
   Preserve normalization of old supplied values so canonical hashes stay stable.
6. Keep historical admin labels/group rendering. New records with no team fields
   omit the empty group; old records still display those answers. Do not erase
   old questions from stored applicant records merely because the form changed.

## Verification and release order

- First verify Package A with synthetic applicants: long multiline answers,
  long URLs/email, minimal fields and all historical fields;320/390/768/1024/
  1280/1440 widths, keyboard and both motion modes. Safari/WebKit check where
  available since screenshot originates in Safari; otherwise record limitation.
- Confirm full answers wrap without overflow/truncation; review controls, drafts,
  conflict/retry, notes/history, Back/list transitions and other tabs still work.
- Contract tests: new submission without five removed fields accepted; omitted
  agreement or other required fields rejected; invalid historical values still
  rejected; old complete payload normalizes identically; duplicate retry/id
  conflict behavior unchanged. Do not submit a real application during QA.
- Browser form flow: four wizard steps, removed questions absent, labels updated,
  agreement all required, draft restoration, exact pending retry, role selection,
  validation errors and payload expectations updated. Existing focus fix retained.
- Node22 check/build, targeted format, recruitment/intake/review tests and8-point
  audit. No serverless cache or visibility/Auth changes bundled into this work.
- For release, backend optional-field support must be ready before new form
  becomes usable. Existing same-build route deployment can deliver both together;
  validate packed API as well as SSR. No new SQL migration is proposed.
- Local implementation follows owner approval of this plan. Commit/push/deploy
  require a new explicit scoped instruction. Live save/status/content/visibility
  mutations are not part of planning or synthetic QA.

## Execution authorized — 12 Oct2026

Owner said “eksusi plan yang belum dan gas”: execute local detail/form and
shared admin-session work. No commit/push/deploy or live writes authorized.
Package A local Node22 build PASS, synthetic review browser320/390/768/1024/
1280/1440 PASS including status/note/conflict/retry/history/races and draft checks.
Single main landmark; nested answer padding0px; desktop answer width at least
viewport minus416px. Changed layout follows24/32/16/8 spacing; fonts/colors
retained (#050507/#141122/#0e0c18/#ffffff/#a8a3b8/#9b7bff). No new artwork/Figma
node; owner-requested admin composition. Package A locked before form changes.

Package B locked: Node22 check/build0errors/0warnings;44recruitment tests PASS
including absent fields/required consents/invalid old options and pinned old
canonical hash. Browser4flows/416layouts/six roles PASS; removed five fields
absent, agreement unnumbered/three required checks, existing exact retry flow
retained. No database migration or applicant mutation. Proceed shared-session
package according to admin-shared-session-local.md.

## Final acceptance

Detail/browser workflow six widths PASS with all38 historical fields, conflicts,
notes/activity, uncertain retries, request races and safe text rendering. Long
multiline answer60paragraphs has natural full height at390/1440 in both motion
modes; no overflow/truncation. Clean review screenshots: artifacts/recruitment-detail-layout/.
No WebKit installation; Safari acceptance not claimed.

Server44tests PASS; pinned pre-change canonical hash includes all five removed
questions. Old draft restores retained controls; historical pending request
retries the exact original ID and all original fields (synthetic interception).
Form4flows/416layouts and six role destinations PASS. Focus-outline fix retained.

Shared-session work complete per admin-shared-session-local.md. Final Node22
check/build zero errors/warnings; spacing40components PASS. Evidence logs in
artifacts/recruitment-admin-followup/. Preview http://127.0.0.1:4364/ uses only
isolated /tmp visibility and local CMS fixtures. No owner credentials/live
submissions/status saves/visibility changes/SQL/provider changes/commit/push/deploy.
Existing dirty work preserved; production remains prior release2a79695.
