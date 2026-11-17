const { chromium } = require('playwright')
const d = require(process.argv[2]); const out = process.argv[3]
const r1 = (v) => { const t = Math.floor((Math.round(Math.abs(v) * 100) + 5) / 10); return `${Math.floor(t / 10)}.${t % 10}` }
const avg = (rs, k) => rs.reduce((s, r) => s + (r[k] ?? 0), 0) / rs.length
const CSS = `
.cmp{margin-top:28px}.cmp h3{margin:0 0 6px}.cmp-form{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:10px 0 18px}
.cmp-form input{width:150px}.cmp-key{display:flex;gap:18px;flex-wrap:wrap;font-size:13px;color:var(--color-neutral-700);margin:4px 0 10px}
.cmp-key span{display:inline-flex;align-items:center;gap:6px}.sw{width:12px;height:12px;border-radius:3px;display:inline-block}
:root{--c1:#c67139;--c2:#4a78b5}@media screen{:root[data-theme=dark]{--c1:#d07a45;--c2:#5b93d8}}
.cmp-chart{margin:6px 0 18px}.cmp-chart h4{margin:0 0 2px;font-size:15px}.cmp-sub{font-size:12.5px;color:var(--color-neutral-700);margin:0 0 10px}
.cmp-grp{margin:12px 0 4px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-700);display:flex;align-items:center;gap:6px}
.cmp-row{display:grid;grid-template-columns:minmax(0,170px) minmax(0,1fr) 58px;gap:10px;align-items:center;font-size:13px;padding:2px 0}
.cmp-row .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cmp-row .v{text-align:right;font-variant-numeric:tabular-nums}
.trk{position:relative;height:12px}.br{position:absolute;left:0;top:0;bottom:0;border-radius:0 4px 4px 0}
.ax{display:grid;grid-template-columns:minmax(0,170px) minmax(0,1fr) 58px;gap:10px;font-size:11px;color:var(--color-neutral-700);margin-top:6px}
.ax div:nth-child(2){display:flex;justify-content:space-between;border-top:1px solid var(--color-divider);padding-top:3px}
.cmp-share{display:flex;gap:10px;align-items:center}.illus{font-size:12px;color:var(--color-neutral-700);font-style:italic}
@media(max-width:720px){.cmp-row,.ax{grid-template-columns:minmax(0,104px) minmax(0,1fr) 64px;gap:8px;font-size:12.5px}}`
function chart(key, unit, title, sub, max, ticks) {
  const grp = (code, c) => `<div class="cmp-grp"><span class="sw" style="background:var(${c})"></span>${code} · ${d[code].place}</div>` +
    d[code].rows.map((r) => `<div class="cmp-row"><span class="nm">${r.name}</span><span class="trk"><span class="br" style="width:${Math.max(0.6, Number(r1(r[key] ?? 0)) / max * 100)}%;background:var(${c})"></span></span><span class="v">${r1(r[key] ?? 0)} mm</span></div>`).join('')
  return `<div class="cmp-chart"><h4>${title}</h4><p class="cmp-sub">${sub}</p>${grp('RG4', '--c1')}${grp('PE38', '--c2')}<div class="ax"><div></div><div>${ticks.map((t) => `<span>${t}</span>`).join('')}</div><div></div></div></div>`
}
const A = d.RG4.rows, B = d.PE38.rows
const intro = `<div class="cmp-form"><label class="field-label" for="cmp">Compare RG4 with</label><input id="cmp" class="input" value="PE38"><button class="btn btn-secondary">Compare</button><button class="btn btn-ghost">Clear</button></div>`
const sum = `<p>So far today the eight gauges nearest PE38 have averaged ${r1(avg(B, 'today'))} mm, and those nearest RG4 ${r1(avg(A, 'today'))} mm. In the last hour: PE38 ${r1(avg(B, 'hour'))} mm, RG4 ${r1(avg(A, 'hour'))} mm.</p>`
const share = `<div class="cmp-share"><button class="btn btn-secondary">Copy chart</button></div>`
const todayChart = chart('today', 'mm', 'Rain so far today', 'Each gauge from midnight to its latest reading, nearest first. Same scale for both places.', 30, ['0', '10', '20', '30 mm'])
const hourChart = chart('hour', 'mm', 'Rain in the last hour', 'The four latest 15-minute readings at each gauge.', 0.4, ['0', '0.1', '0.2', '0.3', '0.4 mm'])
const html = {
  A: `<section class="card cmp" data-mock><h3>Compare with another place</h3>${intro}<div class="card roundup">${sum}</div>${todayChart}${hourChart}${share}</section>`,
  empty: `<section class="card cmp" data-mock><h3>Compare with another place</h3><p class="note">See the rain at the gauges nearest another postcode beside these, in a chart you can copy or share.</p>${intro.replace('value="PE38"', 'placeholder="Postcode"').replace('<button class="btn btn-ghost">Clear</button>', '')}</section>`,
}
;(async () => {
  const b = await chromium.launch()
  for (const theme of ['light', 'dark']) for (const [w, h, t] of [[1200, 900, false], [390, 844, true]]) for (const v of ['A', 'empty']) {
    if (v === 'empty' && (theme === 'dark' || w === 390)) continue
    const c = await b.newContext({ viewport: { width: w, height: h }, hasTouch: t, isMobile: t, colorScheme: theme })
    const p = await c.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message))
    await p.goto('https://rainfaller.baish.net/#RG4')
    await p.waitForFunction(() => document.body.innerText.includes('Checked at'), null, { timeout: 60000 })
    await p.evaluate(({ css, html }) => { const s = document.createElement('style'); s.textContent = css; document.head.append(s); document.querySelector('section.source').insertAdjacentHTML('afterend', html) }, { css: CSS, html: html[v] })
    await p.waitForTimeout(300)
    const sw = await p.evaluate(() => document.documentElement.scrollWidth)
    const el = await p.$('[data-mock]')
    await el.screenshot({ path: `${out}/compare-${v}-${w}-${theme}.png` })
    console.log(v, w, theme, 'sideways', sw > w, errs.join('|'))
    await c.close()
  }
  await b.close()
})()
