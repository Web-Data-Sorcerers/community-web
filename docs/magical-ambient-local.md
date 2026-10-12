# Magical ambient auditions — local, 12 Oct 2026

Owner requested a magical/Harry Potter atmosphere and then “lanjut yang suara tadi”.
Scope is two original procedural auditions, local implementation and QA only.
No soundtrack copied, downloaded audio, new dependency, commit/push/deploy or
backend/visibility write. Existing unrelated dirty documents/reference assets kept.

## Composition

Magical Library (local default): 68 BPM, 32-beat /28.235s phrase. Sparse celesta-like
sine fundamental/soft octave partial, triangle harp replies, overlapping sine pads;
Am(add9)/Fmaj7/Cmaj9/G(add9) colour. Moonlit Castle: 64 BPM /30s phrase, fewer bells,
darker voicings and no harp. Synthetic approximations, not sampled acoustic instruments.
Original score, fixed-seed two-second filtered reverb, restrained stereo width.
No drums, no endless high-frequency sparkle. Existing interaction cues retained.

## Runtime

sound-ambient.ts renders two repeated cycles using OfflineAudioContext (24kHz,
stereo), then retains the second. Opening includes preceding pad/reverb tails.
Each preset is rendered lazily once and cached in memory; seamless buffer source
loops on the existing singleton AudioContext. No recurring JS scheduler or network
music. Master0.75/ambient0.28; source peak remains below0.5, with low background RMS.
Preset changes fade old output and stop/disconnect old sources within one second;
generation guard rejects stale asynchronous render results. Render failures leave
SFX/navigation usable. Mute/reduce/hidden state gates the ambient output. Hidden
buffer playback fades down but retains its position; it is not a CPU suspend claim.
Rendering starts only when context runs, unmuted, ambient allowed and visible.

Current Sound.astro actually had no orb or storage preference despite historical
SOP describing them. Restored an accessible48px global toggle,24px safe-area offsets,
using existing palette and inline speaker SVG. Preference ds:sound on/off persists;
orb rebinds on astro:page-load. Default on, audio context unlocked only by gesture.
Reduced motion bypasses background audio; preference changes update ambient gate.
No public hero/nav/visibility/cache change. Lab preset choice is in-memory, retained
across Astro swaps; does not change stored mute choice or persist across full reload.

## Review

Local audition: http://127.0.0.1:4368/lab/sound/. Listen for a complete phrase, compare
both presets on speakers/headphones, then browse/complete a form to judge distraction.
Default candidate is Magical Library. Owner listening acceptance remains pending;
automated checks cannot decide whether the composition feels pleasant. Real Safari
and iOS audio interruption/background recovery remain device acceptance, not claimed.

## Validation

Node22 check/build and dedicated browser/VT evidence are in artifacts/magical-ambient/.
Dedicated test at390/1440 × normal/reduce checks both rendered buffers (duration,
nonzero RMS, headroom and seam), rapid20 preset switches, singleton/source persistence
through Home/client Back, stored mute on reload, silent reduced-motion and no horizontal
overflow/errors. Visibility hidden/resume is simulated via document.hidden/event;
it does not prove real OS backgrounding. No production session/submission is used.

Final local acceptance PASS: Node22 check/build0errors/0warnings; scoped
Prettier and spacing (Sound/lab) PASS; four width/motion cases PASS, browser
errors0; existing VT/cue lifecycle smoke PASS, pageerrors:none. Final buffer
peaks Library0.4744/Castle0.4447; RMS0.05782/0.04612; loop seam differences
0.00001196/0.00000811. Engine gain keeps playback quiet; no clipping in buffer.
Full legacy visual/responsive suites not rerun: their historic page expectations
do not match current visibility composition. Dedicated lab overflow checks and
existing VT smoke cover this scope. Owner listening/Safari acceptance pending.
No commit/push/deployment. Local preview4368 remains running for review.

## Third audition — Enchanted Castle Waltz

Owner asked for a more distinctive Harry Potter atmosphere, then “coba deh”.
Added original 24-bar/72-beat3/4 score,80BPM,54seconds. Celesta-like music box,
chromatic D-minor motif and three-bar harmonic blocks; rising/falling triangle
harp in middle section, soft harmonic strings, quiet vowel-like choir partials,
woodwind-like downbeats and two light replies for waltz feel. These are synthetic
approximations, not sampled orchestra. Melody/composition original. Third lab
button compares it with prior Library/Castle; Library default remains until owner
listening review. No release or live change. Existing runtime gates remain.

Third-preset final QA: Node22 build0errors/0warnings, spacing PASS; all three
presets at390/1440 × normal/reduce PASS, browser errors0. Waltz duration54s,
peak0.353773, RMS0.042186, seam0.00012926.
No buffer clipping; existing singleton/mute/reload/visibility-gate checks PASS.
No engine lifecycle change after prior VT PASS; only score/preset choice added.
Owner listening review pending. Preview4368 running; no commit/push/live write.

## Owner selection — 12 Oct 2026

Owner accepted third audition with “okeee boleh tuh bro”. Enchanted Castle
Waltz is now the local default on fresh documents; Library/Castle remain lab
comparisons. Stored mute preference/reduced-motion gates unchanged. This
acceptance authorizes local selection, not commit/push/deployment. Earlier
Library-default/listening-pending statements above are historical. Safari
device verification still not claimed; production remainscff4126.

Selected-default acceptance: Node22 build PASS; dedicated browser QA repeats
all four width/motion conditions and three presets PASS, including fresh
waltz default assertion, stored mute/reload and errors0. Preview rebuilt/restarted.

## Owner override — no orb, auto-on and splash sound

Owner explicitly requested removing the speaker button, always-on audio and sound
while the Home splash loads. This supersedes the local restored orb/stored mute
choice described above and the skill's gesture-only startup guideline. No orb
markup/style/binding remains; stored ds:sound is not read or changed. Internal
engine mute method remains available for debugging/tests. Public audio defaults on.

A normal AudioContext creation/resume attempt runs at initialization in normal
motion mode. This is not an autoplay bypass: browser policy may leave it suspended.
Existing real gesture listeners then resume it when allowed. Splash initialization
samples the root armed/done state, and context state changes trigger a quiet ritual
bed and sparse glass accents only while that splash is active. Loading effects use
a dedicated gain/oscillator group, fade and stop/disconnect on completion, swap,
hidden tab, mute or reduced-motion. Existing Waltz ambient continues independently.
Splash completion success cue has source:splash; it is discarded while context is
not ready, preventing a delayed loading completion sound after a later gesture.
No new HTML request spinner, splash wait, duration/layout or navigation delay.

Autoplay availability depends on browser policy/interaction/allowlisting. Cannot
promise sound from first frame for new Safari/iPhone visitors. MDN source:
https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay . Test-only Chromium
policy flags exercise permitted/blocked paths; no such flags/bypass are shipped.
Browser context creation is skipped on initial reduced motion; background/splash
remain silent there. No commit/push/deploy/live/provider/visibility mutation.

Auto/splash local acceptance PASS: permitted and blocked autoplay policies at
390/1440, allowed playback while splash armed, tap fallback during blocked splash,
stopped effects on finish and client swap, continuous ambient, late-gesture skip,
reduced-motion silence/no orb. Four ambient width/motion cases and three presets
PASS including ignored old mute preference; browser errors0. Existing VT smoke
PASS/pageerrors:none; spacing3 surfaces PASS. Final lab copy removes all obsolete
orb instructions. Evidence splash-audio.json/log, browser.log and vt.log.
Chromium policy simulation is not a real Safari/iPhone certification.

## Release authorized — 12 Oct 2026

Owner explicitly instructed “commit dan push” for the final Waltz/audio/splash
scope. One scoped commit/main push and connected deployment authorized.
Baseline HEAD/remote cff41261e9581af53090fd7e85dbcf4d9870f1c2 matched; all
local QA above passed. Pre-release live revision unchanged:
b5cb65e9-cf25-4f07-9972-cc91b0843bc8. Release SHA/live acceptance pending.
No production saves/submissions/visibility/provider/database mutations.
Existing unrelated dirty documents/reference assets remain local.
