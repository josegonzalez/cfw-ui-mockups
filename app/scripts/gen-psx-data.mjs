/*
 * Extract PlayStation X's sample library from the original source.
 *
 * Systems and games with their metadata and descriptions. Transcribing that by hand invites
 * the one class of error nobody notices - a wrong release year, a dropped favourite flag - so
 * it is lifted mechanically instead. The predicates that read this data are hand-written in
 * `library.ts`, because their citations are the point.
 *
 * Run from `app/`:  node scripts/gen-psx-data.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import vm from 'node:vm'

const repoRoot = resolve(import.meta.dirname, '../..')
const out = resolve(import.meta.dirname, '../src/themes/playstation-x/library.data.ts')

// The original is browser code. It only touches the DOM inside its builder functions, so a
// stub is enough to reach the data at the top.
const sandbox = {
  window: {},
  document: { createElement: () => ({ style: {}, appendChild() {}, classList: { add() {} } }) },
}
vm.createContext(sandbox)

for (const file of ['palette.js', 'layout.js', 'views.js']) {
  vm.runInContext(readFileSync(resolve(repoRoot, 'legacy/playstation-x', file), 'utf8'), sandbox, {
    filename: file,
  })
}

const PSX = sandbox.window.PlayStationX
const json = (value) => JSON.stringify(value, null, 2).replace(/"([A-Za-z_$][\w$]*)":/g, '$1:')

const source = `/**
 * The sample library, lifted from the original by \`scripts/gen-psx-data.mjs\`.
 *
 * Generated, so it is not edited by hand - re-run the script instead. The types and the
 * predicates that read it live in \`library.ts\`.
 */
import type { PsxGame, PsxSystem } from './library'

export const SYSTEMS: readonly PsxSystem[] = ${json(PSX.SYSTEMS)}

export const GAMES: readonly PsxGame[] = ${json(PSX.GAMES)}
`

writeFileSync(out, source)
console.log(`wrote ${PSX.SYSTEMS.length} systems and ${PSX.GAMES.length} games to ${out}`)
