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

### 2026-11-17 — house style re-copied (notes only, straight to `main`)

From clockwheel `ba9c802`, at John's request: the new §17, "Sharing a picture" (every Share button sends a sentence, a
link to the same place sent separately, and a title; each sentence agreed with John as part of the design; dates rather
than "today"; a full postcode cut to its first half), and a line in §16 step 9 pointing to it. No other change; no code.
