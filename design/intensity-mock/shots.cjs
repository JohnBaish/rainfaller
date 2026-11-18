const { chromium } = require('playwright')
;(async () => {
  const b = await chromium.launch()
  const sizes = [['1200', 1200, 900, false, 'light'], ['1200', 1200, 900, false, 'dark'], ['390', 390, 844, true, 'light'], ['844x390', 844, 390, true, 'light']]
  for (const code of ['BS48', 'RG4']) for (const opt of ['0', '1', '2', '3']) for (const [tag, w, h, t, theme] of sizes) {
    if (code === 'RG4' && (tag !== '1200' || theme !== 'light')) continue
    const c = await b.newContext({ viewport: { width: w, height: h }, hasTouch: t, isMobile: t, colorScheme: theme, deviceScaleFactor: 2 })
    const p = await c.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message))
    await p.goto(`http://localhost:4411/?opt=${opt}#${code}`)
    await p.waitForFunction(() => document.body.innerText.includes('Checked at'), null, { timeout: 90000 })
    await p.waitForTimeout(400)
    const sw = await p.evaluate(() => document.documentElement.scrollWidth)
    const el = await p.$('section.source')
    await el.screenshot({ path: `shots/${code}-opt${opt}-${tag}-${theme}.png` })
    console.log(code, opt, tag, theme, 'sideways', sw > w, errs.filter(e=>!/insights/.test(e)).join('|'))
    await c.close()
  }
  await b.close()
})()
