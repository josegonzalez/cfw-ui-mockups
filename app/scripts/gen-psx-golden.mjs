/*
 * Capture the original PlayStation X resolver's output as a test fixture.
 *
 * Same reasoning as the Elementerial generator: the port is asserted against the original's own
 * output rather than a snapshot of itself, so the test proves agreement with the thing being
 * reproduced rather than merely that nobody has changed it lately.
 *
 * The layout conditions on six keys. Two come from the device (`aspect-ratio`, `tinyScreen`) and
 * three are live subsets (`carousel`, `carousel-type`, `top-info`); `view` is the sixth and is
 * captured separately because the original never puts it into the matcher state - that is one of
 * the defects this port fixes, so a fixture taken from the original cannot cover it.
 *
 * Run from `app/`:  node scripts/gen-psx-golden.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import vm from 'node:vm'

const repoRoot = resolve(import.meta.dirname, '../..')
const outDir = resolve(import.meta.dirname, '../src/themes/playstation-x/__fixtures__')

// `views.js` carries the sample data and the art factories, and touches the DOM only inside
// its builders, so a stub is enough to reach them.
const sandbox = {
  window: {},
  document: { createElement: () => ({ style: {}, appendChild() {}, classList: { add() {} } }) },
}
vm.createContext(sandbox)

for (const file of ['palette.js', 'layout.js', 'views.js']) {
  const source = readFileSync(resolve(repoRoot, 'legacy/playstation-x', file), 'utf8')
  vm.runInContext(source, sandbox, { filename: file })
}

const PSX = sandbox.window.PlayStationX

const CAROUSEL = ['big', 'medium', 'small']
const CAROUSEL_TYPE = ['PS5', 'PS4', 'PS3']
const TOP_INFO = ['default', 'no-numbers', 'clean']

const layout = {}
for (const device of Object.keys(PSX.DEVICES)) {
  for (const carousel of CAROUSEL) {
    for (const type of CAROUSEL_TYPE) {
      for (const topInfo of TOP_INFO) {
        const key = `${device}|${carousel}|${type}|${topInfo}`
        layout[key] = PSX.resolve(device, {
          carousel,
          'carousel-type': type,
          'top-info': topInfo,
        })
      }
    }
  }
}

writeFileSync(resolve(outDir, 'layout.golden.json'), JSON.stringify(layout))
console.log(`layout: ${Object.keys(layout).length} combinations`)

/* Colours resolve independently of geometry, so they get their own smaller sweep. */
const SECONDARY = ['default', 'blue', 'yellow', 'green', 'orange', 'red', 'pink', 'purple', 'black']
const palette = {}
for (const colorset of ['blue', 'black']) {
  for (const secondary of SECONDARY) {
    palette[`${colorset}|${secondary}`] = PSX.tokens(colorset, secondary)
  }
}

writeFileSync(resolve(outDir, 'palette.golden.json'), JSON.stringify(palette, null, 1))
console.log(`palette: ${Object.keys(palette).length} combinations`)

/*
 * Generated artwork. Small, deterministic, and exactly the kind of string-building where a
 * transposed coefficient produces a picture that looks plausible and is not the same picture.
 */
const art = {}
for (const game of PSX.GAMES) {
  art[game.name] = {
    fanart: PSX.fanart(game, 320, 180),
    boxart: PSX.boxart(game, 160, 220),
    marquee: PSX.marquee(game, 240, 80),
  }
}

writeFileSync(resolve(outDir, 'art.golden.json'), JSON.stringify(art, null, 1))
console.log(`art: ${Object.keys(art).length} games`)
