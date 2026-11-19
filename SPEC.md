# Rainfaller: spec (draft)

How much rain has fallen near a place in England in the last hour and so far
today, from the Environment Agency's rain gauges. A sister to Hindcaster
(yesterday's weather) on baish.net.

Parts marked **Agreed** are John's decisions. Everything else is a draft for
him to agree, change or strike out. First drafted on November 17th 2026 in
Hindcaster's repo; moved here the same day. The data tests behind it are in
`design/quicker-rain-2026-11-17.md` and section 5 below.

## 1. What it is

**Agreed (John, November 17th 2026):** a new site, separate from Hindcaster,
because Hindcaster is about yesterday and this is about today. The name
**Rainfaller** is agreed. The chooser's heading is "Rainfall nearby" (John,
November 17th 2026, replacing the earlier tagline "How much rain has fallen
near you today, gauge by gauge."). The tagline, used in the link preview and the
search description, is "How much rain has fallen nearby, so far today?" (John,
November 17th 2026, stage 4).

Address: `rainfaller.baish.net` (proposed). Repo: `JohnBaish/rainfaller`,
public (made by John, November 17th 2026).

## 2. Choosing a place

- **Agreed:** a postcode box, as Hindcaster's: the first half is enough ("RG4"
  or "RG4 7HN"), England only at first.
- **Agreed:** recent places (John's idea). The last five places chosen are shown
  as buttons under the box, newest first, each with a way to remove it. They're kept
  only in the visitor's browser (`localStorage`) and never sent anywhere. If the
  browser won't store them (some private windows), the page still works, just
  without the buttons.
- The page opens on the last place chosen, as Hindcaster's does.
- **Agreed:** no "Use my location" button.
- Not in the first version: counties, regions or England (these would need the
  whole-day list for every gauge, which is too slow for a browser).

## 3. What the page shows for a place

The **eight nearest gauges that are reporting**, as in Hindcaster's postcode
view, nearest first. For each:

- its name and the line beneath ("near Goring, Oxfordshire"), and its distance
  in whole miles, exactly as Hindcaster shows them;
- **Last hour** (agreed: no "last 15 minutes"): the rain in the four latest
  15-minute readings;
- **Today:** the rain since midnight (UK time);
- **the fortnight's average by this time** (section 4);
- the time of the latest reading ("to 2.45pm"). A gauge more than an hour
  behind is shown in grey with "Latest reading 11.15am".

**Agreed (John, November 17th 2026, after the mock-ups):** the strip at the top
reads "RG4 · EIGHT GAUGES NEAREST TO CAVERSHAM", and the summary above the list:

- "There was rain in the last hour at four of the eight gauges, the highest of
  them, at Yattendon, recording 0.4 mm."
- "The range of rainfall recorded so far today is 8.2 to 13.7 mm. All eight
  gauges had recorded more than the fortnight's average by this time."

Drafts in the same pattern, for John: one gauge ("…at one of the eight gauges,
Yattendon, recording 0.4 mm."), a tie ("…at Cleeve and Benson, recording
0.1 mm."), no rain ("There was no rain in the last hour at any of the eight
gauges."; "None of the eight gauges has recorded any rain so far today."), and
some or none above the average ("Five of the eight gauges had…", "None of the
eight gauges had…"; "…of the seven gauges with an average…" when one has too
few days). Also agreed: the late gauge's "Not available" and "Latest reading
7.45am", the failed gauge's sentence, and the line above the list.

A small bar beside each "Today" figure, as Hindcaster's gauge lists have.

**Agreed (John, November 17th 2026): colour by state** (HOUSE-STYLE §2), in dark
mode: each gauge edged blue when today is wetter than its fortnight's average by
this time, sand when drier, none when the same, without an average or failed.

**Agreed after the fresh look (John, November 17th 2026):**

- Counts in the summary are always out of all the gauges listed (2.2, option b),
  with a sentence when some are late or missing: "There was rain in the last hour
  at one of the eight gauges, Benson, recording 0.4 mm. One gauge's readings are
  late or missing." With no rain at the rest: "Two gauges' readings are late or
  missing. There was no rain in the last hour at the other six gauges."
- Claude's wording for one or two gauges and ties (2.3): "both gauges", "either
  gauge", "the higher of the two", "…at three of the eight gauges, A, B and C, each
  recording 0.1 mm", "All eight gauges have recorded 2.0 mm so far today."
- No comparison with the average on a dry day (2.6), and no bar at 0.0 mm (2.7).
- A gauge more than an hour behind with nothing today: "Latest reading 6pm
  yesterday" (2.4).
- Just after midnight, before today's readings arrive: each gauge shows
  "Yesterday: 12.3 mm" (or "Yesterday to 11.45pm: …"), and the summary "No readings
  from today have arrived yet. Yesterday's rainfall ranged from 2.0 to 9.0 mm." (2.5).
- When the nearest gauge is more than 20 miles away, above the summary: "The
  nearest gauges are some way off, so may not reflect the rain here." (4.3).
- In dark mode, after the line above the list: "A blue edge means wetter than the
  fortnight's average by this time; a sandy-coloured edge means it's drier."
  (5.1; reworded by John, November 19th 2026).

**Agreed (John, November 18th 2026): a small chart of each gauge's day** (option 3 of
the intensity mock-ups), under its Today figures: the rain in each 15 minutes from
midnight to midnight, all the gauges on one scale (the wettest 15 minutes among them,
at least 1 mm), with **Share charts** (Copy charts on a computer) under the list. The
share sentence: "Rain in each 15 minutes on Wednesday November 18th at the eight gauges
nearest BS48, from Rainfaller."; the title "Rainfaller: Rain today"; the link `#BS48`.
"About these figures" adds: "The small chart under each gauge shows the rain in each
15 minutes since midnight, with all the gauges on the same scale."

## 4. Compared with the last fortnight and yesterday

**Agreed (John, November 17th 2026):** both the fortnight's average by this
time and "by this time yesterday", with the wording below; an average only
when at least 10 of the 14 days count.

**How it would work.** For each gauge, the rain from midnight to the time of
its latest reading today, on each of the last 14 days, averaged. If today's
latest reading is 2.45pm, each earlier day counts midnight to 2.45pm UK time,
so the clock-change days are handled the same way.

- A day counts only if the gauge reported at or after that time on that day.
  (A single missing 15 minutes is common: one gauge tested had 95 of 96 on two
  of the 14 days. Hindcaster has the same rule for a whole day.)
- The average is shown only if at least 10 of the 14 days count. Otherwise:
  "Not enough readings for an average".
- "By this time yesterday" comes from the same readings at no extra cost.
  Yesterday counts only if the gauge reported at or after that time; otherwise
  it isn't shown.

**Wording (agreed):**

- Under each gauge's "Today": "Fortnight average by 2.45pm: 1.1 mm" and
  "By 2.45pm yesterday: 0.4 mm" (the second line's wording is Claude's, in the
  same pattern).
- Summary: "So far today: 0.4 to 6.8 mm. More than the fortnight's average by
  this time at six of the eight gauges."
- A note in "About these figures": "The fortnight's average is the rain from
  midnight to the same time on each of the last 14 days, averaged. It includes
  dry days, so one wet day can lift it a lot."

**What it changes.** Very little. Each gauge's one request asks for 15 days
rather than today alone. Tested (one Reading-area gauge, November 17th 2026):
1,377 readings, 13 KB compressed, usually under a second. One test request took
22 seconds, so the page shows each gauge as soon as its readings arrive.
About 100 KB in all for a place's eight gauges. The Environment Agency keeps
about four weeks of readings, so a fortnight is within reach. A month would
not be.

## 5. Freshness

- The readings come every 15 minutes and are usually 20 to 45 minutes old when
  they arrive (tested November 17th 2026).
- **Agreed:** the page asks for readings when it's opened, and again only when
  **Refresh** is pressed. Nothing refreshes by itself.
- A line at the top: "Readings to 2.45pm. Checked at 3.10pm."
- **Agreed after the fresh look (John, November 17th 2026, 2.1 option b):** the
  Environment Agency hands out shared copies of answers, sometimes more than 10
  minutes old. So the question is varied by a few seconds every 15 minutes (visitors
  in the same quarter-hour still share an answer), and Refresh always asks afresh.
  A fresh answer takes 2 to 13 seconds (tested), so a gauge is given up after 20
  seconds (3.2): "Couldn't get this gauge's readings." If every gauge fails, the top
  line says "Couldn't reach the Environment Agency. Press Refresh to try again." (3.1)

## 6. Where the figures come from

- **Readings:** the Environment Agency's real-time flood-monitoring API. The
  visitor's own browser asks it directly, one request per gauge for its
  readings over the last fortnight: eight requests for a place. The API lets
  browsers on other sites read it. No key, no server, no GitHub runs.
- **The day:** midnight to midnight UK clock time, as in Hindcaster. A reading
  counts in the 15 minutes it ends, so the one stamped midnight belongs to the
  day before.
- **Faulty readings:** a 15-minute reading of more than 50 mm is left out, as
  in Hindcaster.
- **The gauge list** (names, "near" lines, counties, positions, which gauges
  are trusted) and **postcode districts** come from Hindcaster. See section 7.

## 7. Getting Hindcaster's gauge list across

**Agreed (John, November 17th 2026): option A.** The options as considered:

- **A. Hindcaster publishes it (chosen).** Hindcaster's website
  gets one extra public file with a fixed address, for example
  `hindcaster.baish.net/rain-gauges.json`, holding only what Rainfaller needs.
  This would be each offered gauge's ID, name, line, county and position, plus
  the gauges held back that day by Hindcaster's checks against neighbouring
  gauges. It's remade whenever Hindcaster updates (three times a day), so
  Rainfaller gets the monthly check **and** the daily list of faulty gauges.
  Rainfaller's page reads it directly; the file just has to allow
  rainfaller.baish.net to read it. No tokens or secrets.
  - Almost nothing new is made public. Hindcaster's own page already sends
    every visitor each gauge's name, line and position (checked). The only
    addition is each gauge's ID in the live feed, which the Environment Agency
    publishes anyway. It's all Environment Agency and OS data, both under the
    Open Government Licence. No Met Office data would be included.
  - Postcode districts come the same way, or are copied once into Rainfaller
    (they hardly change).
  - Safety net: Rainfaller keeps its own copy in its repo, refreshed once a
    month by a small job in Rainfaller (free, as the repo is public), so it
    still works if Hindcaster's site is ever down.
- **B. Hindcaster's monthly job copies the file into Rainfaller's repo.** This
  needs a GitHub token kept as a secret in Hindcaster, allowed to write to
  Rainfaller only. Tokens expire, so it needs renewing. It gives the monthly
  list only, not the daily faulty-gauge list.
- **C. Rainfaller's job reads Hindcaster's private repo.** This needs a token
  that can read all of Hindcaster, stored in a public repo's settings. Not
  recommended.

## 8. Credits and privacy

- **Agreed:** "This uses Environment Agency rainfall data from the real-time
  data API (Beta)." The readings are provisional and can be corrected later; a
  line in "About these figures" says so.
- The three lines from OS Open Names, as on Hindcaster (for the place names
  and postcode districts).
- **Agreed (footer, John, November 17th 2026):** "Your device, rather than the
  website, stores your recent places and your choice of light or dark mode. To
  get the readings, your browser asks the Environment Agency directly." The Environment Agency sees the visitor's internet address and
  which gauges were asked for, as for any website the browser contacts;
  nothing goes to baish.net beyond the usual anonymous visit statistics.

## 9. Look and build

- The house style (`HOUSE-STYLE.md`), phone first, dark mode following the
  device.
- Vite, React and TypeScript, as the other tools. A new Vercel project.
- Rainfaller and Hindcaster link to each other with one line each.
- On the baish.net hub once it's live.

## 10. Not in the first version

Counties, regions and England; Scotland and Wales; maps; past days beyond the
fortnight's average; alerts; forecasts; "Use my location".

## 11. Questions for John

None open (all answered November 17th 2026). New ones go here, numbered.
