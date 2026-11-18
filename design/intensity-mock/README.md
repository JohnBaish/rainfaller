# How hard it rained: mock-ups (November 18th 2026)

Three options for John, made by patching a scratch copy of the app (`mock.diff`, `intensity.ts`)
and opening it with `?opt=1`, `2` or `3` on real Environment Agency readings at about 9.20pm.
Pictures in `../previews/intensity/` (`opt0` is the page as it is now), taken by `shots.cjs`.
Nothing in the app has changed.

1. A word for the last hour: Slight, Moderate, Heavy, Very heavy (less than 0.5, 0.5 to 4, 4 to 8,
   8 mm or more an hour), as quoted by the USGS from the Met Office's Fact sheet 3. Not yet checked
   against the fact sheet itself (its host was blocked from this session).
2. The heaviest 15 minutes today: "Heaviest 15 minutes: 2.0 mm, to 7.45pm" (the latest, if tied).
3. A strip of today's 15-minute readings, midnight to midnight, on one scale for all the gauges
   (the wettest 15 minutes among them, at least 1 mm). Hovering over a bar names its reading.

Found while making them: of 20 gauges sampled, 13 record rain in steps of 0.2 mm and 7 in steps
of 0.01 or 0.1 mm, so light rain looks patchier at some gauges than others.
