import { test, expect } from '@playwright/test'

/**
 * slot's eight HUD glyphs are codepoints in a symbol font, and a wrong one is invisible.
 *
 * A missing glyph renders as `.notdef` - and because the font is the **Mono** variant, that box
 * has the same advance width as every real glyph, so measuring text cannot tell them apart. Three
 * of the eight are in the Material Design range above U+F0000, which is exactly where a font
 * substitution would fail first.
 *
 * Only three of the eight are posed by a static, so the screenshot baselines cover fewer than half
 * of them. This rasterises all eight and compares each against a codepoint the font certainly
 * lacks: same pixels means tofu.
 */
test('every HUD glyph is really in the font', async ({ page }) => {
  await page.goto('/#slot/rg-sp/hud-volume')
  await page.locator('.screen').waitFor({ state: 'visible' })
  await page.evaluate(() => document.fonts.ready)

  const result = await page.evaluate(() => {
    const glyphs: Record<string, string> = {
      volume: '\u{f028}', volumeMuted: '\u{f026}', brightness: '\u{f185}',
      blueLight: '\u{f186}', fastForward: '\u{f06d2}', fastForwardLatched: '\u{f0211}',
      rewind: '\u{f04a}', alert: '\u{f0026}',
    }
    const raster = (ch: string) => {
      const cv = document.createElement('canvas')
      cv.width = 80; cv.height = 80
      const c = cv.getContext('2d')!
      c.fillStyle = '#000'; c.fillRect(0, 0, 80, 80)
      c.fillStyle = '#fff'; c.font = '64px SlotSymbols'
      c.textBaseline = 'middle'
      c.fillText(ch, 8, 40)
      const d = c.getImageData(0, 0, 80, 80).data
      let ink = 0
      const bits: number[] = []
      for (let i = 0; i < d.length; i += 4) {
        const on = d[i]! > 128 ? 1 : 0
        ink += on
        bits.push(on)
      }
      return { ink, sig: bits.join('') }
    }
    const control = raster('\u{10FFFD}')
    const out: Record<string, { ink: number; sameAsControl: boolean }> = {}
    for (const [name, g] of Object.entries(glyphs)) {
      const r = raster(g)
      out[name] = { ink: r.ink, sameAsControl: r.sig === control.sig }
    }
    return { control: control.ink, out }
  })

  console.log(JSON.stringify(result, null, 1))
  for (const [name, r] of Object.entries(result.out)) {
    expect(r.ink, `${name} drew nothing`).toBeGreaterThan(0)
    expect(r.sameAsControl, `${name} is tofu`).toBe(false)
  }
})
