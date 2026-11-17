# Rainfaller — working notes

**How much rain has fallen near you today, gauge by gauge.** A sister to
Hindcaster (`JohnBaish/hindcaster`, yesterday's weather), Clockmaker and
Backtimer (`JohnBaish/clockwheel`) and the other baish.net tools. Proposed
address `rainfaller.baish.net`. The repo is public.

Read these first, in this order:

1. `SPEC.md`: what Rainfaller does (a draft being agreed with John; the
   numbered questions are at the end).
2. `HOUSE-STYLE.md`: the shared look and ways of working. Copied from
   `JohnBaish/clockwheel` at commit `f8c4aff` (November 17th 2026; `HOUSE-STYLE.md`
   re-copied at `ba9c802` the same day for §17), with
   `SEO-HANDOVER.md` and `.claude/skills/fresh-look/`. Clockwheel holds the
   master copies; re-copy them if they change, and note it here.
3. `design/quicker-rain-2026-11-17.md`: the first tests of the Environment
   Agency's live rain API.
4. Hindcaster's notes on rain gauges
   (`design/handover-2026-10-18-rain-gauges.md` in `JohnBaish/hindcaster`):
   the gauge list, its checks and John's decisions on names. Rainfaller reuses
   all of it.

Key points from the house style, repeated because they matter most:

- John is not a developer. Explain plainly and briefly, say what he needs to
  do, and use British spelling. He decides wording.
- Agree before building anything significant. Show mock-ups of pages, images
  and icons before wiring them in.
- Build on a branch and merge to `main` only when John says so.
- Check in a real browser at 1200px, at 390px with touch and at 844×390 with
  touch, and say what couldn't be checked.
- Add a dated entry below for every change.
- **Project tracker:** when something significant changes (a stage finished,
  a decision made, something goes live or is parked), update this project's
  file and its line in `INDEX.md` in `JohnBaish/baish.net-directory`,
  following that repo's README, straight to its `main` (John's standing
  permission, even when this session was given its own branch). Before
  committing there, run `node site/check-tracker.mjs` in that repo and fix
  anything it lists.

Rainfaller-specific points:

- **No server for the readings.** The visitor's browser asks the Environment
  Agency directly (SPEC §6). The page must cope with a slow or failed request
  for any one gauge.
- **"Less than", never "under"; "more than", never "over"** for amounts.
  Times in UK clock time, written "9.30am".
- **Nothing private in this repo:** it's public.

## Log

### 2026-11-17 — spec moved here from Hindcaster; house-style files copied (notes only, straight to `main`)

John made this repo (public) and answered the first draft's questions: the name and tagline agreed;
refresh only when Refresh is pressed; no "Use my location"; last hour only; the summary and footer
wording agreed. He asked for a way to bring Hindcaster's monthly gauge check across, and for "by this
time yesterday" or, better, the fortnight's average by this time. **What:** `SPEC.md` (the draft moved
from Hindcaster's `design/rainfaller-spec-draft-2026-11-17.md`, with his answers and new sections 4 and
7), this file, `design/quicker-rain-2026-11-17.md`, and `HOUSE-STYLE.md`, `SEO-HANDOVER.md` and the
fresh-look skill from clockwheel `f8c4aff`. **Tested for section 4:** one gauge (E7050) asked for 15
days: 1,377 readings, 13 KB compressed, usually under a second (one request took 22 seconds); 95 of 96
readings on two of the 14 days. No code yet.

### 2026-11-17 — John's answers; PLAN.md (notes only, straight to `main`)

John chose option A for the gauge list (Hindcaster publishes a public file), agreed the fortnight's
average with its wording and the 10-of-14-days rule, and asked for "by this time yesterday" too
("By 2.45pm yesterday: 0.4 mm", Claude's wording in the agreed pattern). Recorded in `SPEC.md`; no
questions left open. `PLAN.md` written: stage 1 mock-ups, 2 Hindcaster's file, 3 the page, 4 favicon and
preview picture, 5 launch. No code yet.

### 2026-11-17 — stage 1: mock-ups (branch `stage-1-mockups`)

**What:** `design/mock/` (a static page, `mock.template.html`, filled in by `make-mock.py` with figures worked
out from real Environment Agency readings fetched at 9.47am today; Hindcaster's `organic.css` and `global.css`
copied beside it). RG4's eight nearest reporting gauges from Hindcaster's own list: a wet morning, 8.2 to
13.7 mm by 9.15am against fortnight averages of 0.4 to 0.7 mm. Pictures in `design/previews/mock-*.png`: the
place and the chooser at 1200px, 390px and 844×390 with touch, light and dark, and `?state=edge` (labelled
illustration: a late gauge, a failed gauge, a gauge without enough days). Drafts for John: the chooser's
paragraph, "Not available" for a late gauge's last hour, the failed-gauge sentence.

**Found:** each gauge's 15 days by its station address took 1 to 15 seconds here; by its measure address
(SPEC §4's test) it was usually under a second, so the page should use the measure address (Hindcaster's file
can carry it).

**Verified:** no page errors, no sideways scroll at any size, all four brand fonts loaded. Fonts were loaded by
path at render time (they come with the app's build later). Not merged.

### 2026-11-17 — mock-ups: John's wording (branch `stage-1-mockups`)

**John:** the summary reworded ("There was rain in the last hour at four of the eight gauges, the highest of them, at
Yattendon, recording 0.4 mm." / "The range of rainfall recorded so far today is 8.2 to 13.7 mm. All eight gauges had
recorded more than the fortnight's average by this time."), the strip "RG4 · EIGHT GAUGES NEAREST TO CAVERSHAM", the
chooser's heading "Rainfall nearby" and its paragraph reworded; drafts 2 to 4 agreed. Done in the mock and `SPEC.md`,
with drafts for one gauge, ties, no rain and gauges without an average (the edge illustration shows a tie). Dark mode
checked against HOUSE-STYLE §2: page `#24211e`, cards `#37332e` with the shadow, as agreed on November 14th. Pictures
re-rendered: no errors, no sideways scroll, fonts loaded.

### 2026-11-17 — mock-ups: footer and colour by state (branch `stage-1-mockups`)

**John:** yes to the footer naming the light or dark choice, and yes to colour by state. **What:** the footer
now reads "…stores your recent places and your choice of light or dark mode. To get the readings…"; in dark
mode each gauge (table row or card) is edged blue (`#6a98c6`) when today is wetter than its fortnight's average
by this time, sand (`#d8b46e`) when drier, none otherwise (Hindcaster's year-ago colours). The edge illustration
now also shows a drier gauge. SPEC updated. Pictures re-rendered (edge pictures in dark added): no errors, no
sideways scroll.

### 2026-11-17 — house style re-copied (notes only, straight to `main`)

From clockwheel `ba9c802`, at John's request: the new §17, "Sharing a picture" (every Share button sends a sentence, a
link to the same place sent separately, and a title; each sentence agreed with John as part of the design; dates rather
than "today"; a full postcode cut to its first half), and a line in §16 step 9 pointing to it. No other change; no code.

### 2026-11-17 — stage 2 done: Hindcaster publishes the gauge files (notes only, straight to `main`)

At John's word, straight to Hindcaster's `main` (its commit `28ce64c`): `https://hindcaster.baish.net/rainfaller/gauges.json`
(the gauges Hindcaster offers less those held back that day: `id`, `live`, `m` the 15-minute series, `name`, `line`, `e`, `n`
in British National Grid metres; plus `made` and `credits`) and `/rainfaller/outcodes.json` (`[easting, northing, place]` per
postcode district). Remade with every Hindcaster update. Checked live: both 200, `access-control-allow-origin: *`,
`cache-control: public, max-age=300`. Ask the EA by `m` (`/id/measures/<m>/readings?since=…`); if a gauge has no `m`, by
station (`/id/stations/<live>/readings`). The mock-ups (stage 1) are on branch `stage-1-mockups`, agreed apart from
building them.

### 2026-11-17 — stage 3: the page built (branch `stage-3-page`, not merged)

**What:** Vite + React + TypeScript (Hindcaster's versions and settings). The chooser (postcode, recent places) and a
place's view (`#RG4`): the eight nearest reporting gauges, each asked for its readings by the browser (by measure, else by
station), figures in `src/lib/rain.ts`, the summary in `src/lib/summary.ts`, Refresh, colour by state in dark mode, "About
these figures" (drafts), footer. The gauge list and postcode districts come from Hindcaster's public files, with copies in
`public/data/` if Hindcaster can't be reached. `npm run check` (`scripts/check.ts`, 13 checks of the rules). Two gauges in a
summary say "both". **Not yet:** a monthly job to refresh `public/data/`; favicon and preview picture (stage 4).
**Verified:** tsc, lint, checks, build; in Chromium with the real EA readings for RG4 at 1200px, 390px and 844×390 with touch,
light and dark: no errors (bar Vercel's statistics script, local only), no sideways scroll, boxes 16px on a phone; Refresh,
recent places, reopening on the last place and a Welsh postcode refused all work.

### 2026-11-17 — "About these figures": John's wording (branch `stage-3-page`)

**John:** "‘The last hour’ is defined as the aggregate of the four latest 15-minute readings." and "The gauges are the ones
offered by the companion baish.net website Hindcaster: …". Otherwise agreed; on to stage 4. Build clean.

### 2026-11-17 — stage 4: favicon A chosen and wired in; link-preview picture drafted (branch `stage-3-page`)

**John chose A** (an ink raindrop with a terracotta shine, on the cream disc with the terracotta ring). It is
`public/favicon.svg`, linked from `index.html`. Options and their tab-row picture in `design/favicon-options*`.
**Link-preview picture drafted** (`design/og-rainfaller.html`, from Hindcaster's template; rendered to
`design/previews/og-rainfaller.png`, 1200×630, both fonts confirmed loaded): the drop large on the pale disc, "Rainfaller"
and the agreed tagline "How much rain has fallen near you today, gauge by gauge." Waiting for John before it goes into
`public/` with the `og:` and `twitter:` tags.
