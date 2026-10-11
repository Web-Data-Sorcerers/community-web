# On Development full-screen plan

Owner approved implementation on 11 Oct 2026. Custom composition from the
owner's background and approved conversation plan; no new Figma node exists.
Reference artwork: `assets/on development/ondp.png`. Do not invent Figma IDs or
claim a pixel match against the former About Us / Hall of Frames designs.

## Inventory and implementation

Both `/about/` and `/hall-of-frames/` contain the shared Navbar (existing,
unchanged) and one ArcaneChamber section. The large Footer is omitted on these
two routes. Original content components and the Team lab remain preserved.

Section reference viewport: 1440 x 903. Minimum height 100svh, with natural
vertical growth for short screens and enlarged text. Desktop content left aligned
in a maximum 640px column inside the existing page gutter. Mobile centered with
24px gutters. Header clearance 144px, bottom clearance 64px plus safe area;
internal gaps 8/24/32px, action gap 16px. No fixed content height or clipping.

Heading: Bluu Next Bold 700, fluid 32-72px, line-height 1.12. Body: Manrope
400, fluid 16-18px, line-height 1.6, lavender #ede8ff. Page label: Manrope 500,
16px. Heading white, obsidian overlays #050507, existing violet buttons.

Copy: page name, 'Page Under Development', and 'We’re currently working on this
page. Explore the available pages below while we prepare it.' No invented
progress, release dates or ritual status. Native links use existing Button
community/explore variants: Home, Recruitment, Partners, Contact only.

Background: proportional WebP, desktop at native width and 1280w; portrait
mobile crop favoring the right castle at 640/752w. No upscale. Reproducible Sharp
generator, decorative picture, eager loading. Artwork replaces large SVGs.
One opacity entrance under no-preference; reduced motion remains static.

## Acceptance

- Check, format, local build, spacing, navbar and SEO audits.
- Browser checks for both routes at 320/390/768/1440/2560px, short viewport,
  enlarged text, reduced motion, decoded artwork, no horizontal overflow,
  content below navbar, correct fonts and active navigation, no footer.
- Click every action, test keyboard focus, mobile menu and Astro client swaps.
- Save desktop/mobile screenshots and report browser errors.
- Page/section admin toggles and disabling Projects are separate future work.
- No commit or push without the explicit instruction 'commit dan push'.

## Result

Local QA: check 0 errors / 0 warnings (36 existing hints), static build 24
pages, format, spacing (40 components), SEO (24 pages), and Navbar (20 widths)
PASS. Targeted browser QA PASS: 14 layouts across both routes, short screens,
enlarged text, decoded mobile/desktop backgrounds, font/current-page state,
keyboard focus, mobile menu, all four Astro client links and Back navigation,
reduced-motion and normal entrance; browserErrors: []. Screenshots and metrics:
`artifacts/on-development/`. Full legacy visual suite was not rerun: its About
and Hall of Frames assertions still target the original content pages; this
pass uses the dedicated verifier for the approved replacement composition.

## Pages & Sections local integration (11 Oct 2026)

The approved chamber is reused for every known disabled public page. Page label
comes from the code-owned registry; existing Home/Recruitment/Partners/Contact
buttons are filtered by destination status and exclude the current route.
Default About/Hall of Frames composition, artwork, fonts and layout are retained.
Enabled pages render their preserved original components. Large Footer is omitted
on disabled pages, which return 200/noindex, follow. This is local-only execution;
see [visibility record](page-section-visibility-local.md) for fixtures and evidence.
