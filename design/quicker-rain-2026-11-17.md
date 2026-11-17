# A quicker rain site: what the Environment Agency's live API allows (November 17th 2026)

John's idea: a website showing rainfall during the day, not the next morning.
Tested from this container against the EA's live flood-monitoring API
(`environment.data.gov.uk/flood-monitoring`), on Tuesday November 17th 2026,
about 7.15am UTC. Nothing built; notes only.

## What was tested

1. **Latest reading at every gauge, one request.**
   `data/readings?parameter=rainfall&latest`
   - 933 readings (some gauges have more than one measure: 853 15-minute "t",
     62 15-minute "i", 14 hourly, a few others), so about 920 gauges.
   - 332 KB, or **15 KB compressed**; under a second.
   - At 7.13am UTC: 715 gauges had the 6.45am reading (the quarter-hour to
     6.45am), 168 had 6.30am, 25 had 6am, a handful older. So most gauges are
     about 20 to 45 minutes behind. The EA's copy was made at 7.03am and is
     kept for five minutes (`cache-control: max-age=300`).
   - **The API allows other websites' pages to read it**
     (`access-control-allow-origin: *`), so a visitor's own browser can fetch
     it directly.
   - On its own this gives only the last 15 minutes' rain at each gauge.

2. **Every reading since midnight, every gauge** (for "rain so far today").
   `data/readings?parameter=rainfall&today&_limit=10000&_offset=…`
   - `since=` is refused by this request (400). `today` works.
   - At 7.15am: 25,213 readings over three pages of 10,000, sorted by time
     (not by gauge). Pages took 4, 9 and 20 seconds; about 116 KB compressed
     each. By late evening it would be about 90,000 readings (nine or ten
     pages), so likely a minute or more.
   - Too slow and too big to ask for in each visitor's browser.

3. **One gauge since midnight.**
   `id/measures/<measure>/readings?since=2026-11-17T00:00:00Z`: 27
   readings, under a second. Fine for a page about one place (say the eight
   nearest gauges: eight small requests).

## What this suggests (Claude's view, not decided)

- **"Rain in the last 15 minutes / hour" across England:** the browser can ask
  the EA itself (test 1). No server, no GitHub runs, no repo involvement.
- **"Rain so far today" for a postcode's nearest gauges:** the browser can ask
  each gauge directly (test 3).
- **"Rain so far today" across a county, region or England:** needs the
  whole-day list (test 2), so a small Vercel function that fetches it and has
  Vercel keep the answer for about 15 minutes, serving the kept copy while it
  fetches a fresh one, so no visitor waits. Not yet tried on Vercel; its
  time limits on the free plan should be checked first.
- The gauge list, place names, counties and neighbour checks from Hindcaster
  can be reused as they are.
- Scotland (SEPA) and Wales (NRW) were not part of this test; see
  `design/scotland-rain-data-2026-10-25.md` (NRW allows 10 calls a minute,
  which rules out asking it from every visitor's browser).
