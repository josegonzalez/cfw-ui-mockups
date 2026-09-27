// Measure TortOS's card art the way the launcher does at load time.
//
// `content_bottom` (src/main.c:398) is where a card's opaque pixels stop, as a
// fraction of its height: the reflection starts there rather than at the
// canvas edge. The launcher measures it per texture when it decodes one; the
// mockup has no decode step, so the numbers are measured once here and kept as
// data in `app/src/themes/tortos/cards.ts`.
//
// Run from `app/` (it borrows that package's pngjs):
//   node ../docs/themes/tortos/reference/measure-cards.mjs
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'

// Resolved from the working directory rather than from this file, which sits
// outside any package.
const { PNG } = createRequire(resolve(process.cwd(), 'package.json'))('pngjs')

const root = resolve(process.cwd(), 'src/themes/tortos/assets/cards')

for (const set of ['classic', 'fancy']) {
  for (const file of readdirSync(resolve(root, set)).filter((f) => f.endsWith('.png')).sort()) {
    const png = PNG.sync.read(readFileSync(resolve(root, set, file)))
    let bottom = 0
    // The launcher's own threshold: a row counts once any pixel in it is more
    // than faintly there (main.c content_bottom reads alpha > 8).
    for (let y = png.height - 1; y >= 0 && !bottom; y--) {
      for (let x = 0; x < png.width; x++) {
        if (png.data[(y * png.width + x) * 4 + 3] > 8) {
          bottom = y + 1
          break
        }
      }
    }
    console.log(`${set}/${file.replace('.png', '')}: ${png.width}x${png.height} cb=${(bottom / png.height).toFixed(4)}`)
  }
}
