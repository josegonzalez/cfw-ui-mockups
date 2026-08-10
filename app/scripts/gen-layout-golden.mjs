/*
 * Capture the original Elementerial resolver's output as a test fixture.
 *
 * The port is asserted against this rather than against a snapshot of itself: a snapshot only
 * proves the port has not changed since someone last accepted it, whereas this proves it still
 * agrees with the thing it reproduces.
 *
 * Run from `app/`:  node scripts/gen-layout-golden.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import vm from 'node:vm'

const repoRoot = resolve(import.meta.dirname, '../..')
const out = resolve(import.meta.dirname, '../src/themes/elementerial/__fixtures__/layout.golden.json')

// The original is browser code that attaches to a global; give it one and nothing else.
const sandbox = { window: {} }
vm.createContext(sandbox)

for (const file of ['palette.js', 'layout.js']) {
  const source = readFileSync(resolve(repoRoot, 'legacy/elementerial', file), 'utf8')
  vm.runInContext(source, sandbox, { filename: file })
}

const E = sandbox.window.Elementerial
const golden = {}

for (const device of Object.keys(E.DEVICES)) {
  for (const fontSize of ['small', 'medium', 'large']) {
    for (const gridDirection of ['horizontal', 'vertical']) {
      golden[`${device}|${fontSize}|${gridDirection}`] = E.resolve(device, { fontSize, gridDirection })
    }
  }
}

writeFileSync(out, JSON.stringify(golden, null, 1))
console.log(`wrote ${Object.keys(golden).length} combinations to ${out}`)
