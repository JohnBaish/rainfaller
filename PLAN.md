# Rainfaller: plan

One stage at a time, each on its own branch, merged only when John says so.
Drafted November 17th 2026, after John agreed the spec's questions.

## Stage 1: mock-ups (design only)

The page for a real postcode, with real readings from the Environment Agency
on the day: the chooser with recent places, a place's eight gauges (last hour,
today, the fortnight's average and yesterday by this time), the summary, a gauge
behind or failed, and "Not enough readings for an average". On a computer
(1200px), a phone (390px) and a phone held sideways (844×390), in light and
dark. For John to agree before anything is built.

## Stage 2: Hindcaster publishes the gauge file (in `JohnBaish/hindcaster`)

One public file on Hindcaster's site with a fixed address (SPEC §7, option A):
each offered gauge's ID, live-feed ID, name, line, county and position, the
gauges held back that day, and the postcode districts. It allows
rainfaller.baish.net to read it. It's built from the same data as Hindcaster's
page, so it updates with every Hindcaster update. Hindcaster's page isn't
changed. A check that the file has what Rainfaller needs.

## Stage 3: the page

Vite, React and TypeScript, as the other tools. The chooser, the eight gauges
asked for in the visitor's browser (each shown as it arrives), Refresh, the
summary, the fortnight and yesterday, recent places, dark mode, "About these
figures", the credits and footer, a safety net. The rules (days, averages,
the 50 mm guard) as plain functions with `npm run check`. A monthly job keeps
a copy of Hindcaster's file in this repo, in case Hindcaster's site is down.
**John:** the Vercel project (from this repo).

## Stage 4: favicon and link-preview picture

Options shown to John first (HOUSE-STYLE §7).

## Stage 5: launch

**John:** the `rainfaller.baish.net` domain and Web Analytics in Vercel.
Then the search title and description, `robots.txt`, `sitemap.xml`, Search
Console (John), links between Rainfaller and Hindcaster, the card on
www.baish.net and the hub's description, the baish.net overview, and the
project tracker.
