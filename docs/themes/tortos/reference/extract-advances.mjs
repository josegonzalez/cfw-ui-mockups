// Extract Josefin Sans's advance widths, so the mockup can measure text the way
// SDL_ttf does rather than asking the DOM.
//
// TortOS decides a lot by width: whether a shelf title slides or sits centred,
// where a menu row's value yields to its label, when a note turns into a
// marquee, where "..." cuts a name. Reading those widths back from layout would
// make the widgets depend on CSS; a table of advances is what a C renderer would
// have anyway, so it is the portable form.
//
// Kerning too. The font has no legacy `kern` table, only GPOS pair positioning,
// and the device's SDL_ttf shapes with HarfBuzz, which applies it: without the
// pairs, "Hold On To Your Potatoes,..." measured 17px wider than the device draws
// it and was cut three characters early.
//
// Run from `app/`:
//   node ../docs/themes/tortos/reference/extract-advances.mjs > src/themes/tortos/advances.ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const b = readFileSync(resolve(process.cwd(), 'src/themes/tortos/assets/fonts/JosefinSans-Regular.ttf'))
const tables = {}
for (let i = 0; i < b.readUInt16BE(4); i++) {
  const o = 12 + i * 16
  tables[b.toString('latin1', o, o + 4)] = b.readUInt32BE(o + 8)
}

const upm = b.readUInt16BE(tables.head + 18)
const numHMetrics = b.readUInt16BE(tables.hhea + 34)
const advanceOf = (gid) => b.readUInt16BE(tables.hmtx + 4 * Math.min(gid, numHMetrics - 1))

/* cmap: the first Unicode BMP subtable, format 4. */
function glyphFor(code) {
  const cmap = tables.cmap
  for (let i = 0; i < b.readUInt16BE(cmap + 2); i++) {
    const rec = cmap + 4 + i * 8
    const platform = b.readUInt16BE(rec)
    const encoding = b.readUInt16BE(rec + 2)
    const sub = cmap + b.readUInt32BE(rec + 4)
    if (b.readUInt16BE(sub) !== 4 || !((platform === 3 && encoding === 1) || platform === 0)) continue
    const segX2 = b.readUInt16BE(sub + 6)
    const ends = sub + 14
    const starts = ends + segX2 + 2
    const deltas = starts + segX2
    const offsets = deltas + segX2
    for (let s = 0; s < segX2 / 2; s++) {
      const end = b.readUInt16BE(ends + s * 2)
      if (code > end) continue
      const start = b.readUInt16BE(starts + s * 2)
      if (code < start) return 0
      const delta = b.readInt16BE(deltas + s * 2)
      const ro = b.readUInt16BE(offsets + s * 2)
      if (ro === 0) return (code + delta) & 0xffff
      const g = b.readUInt16BE(offsets + s * 2 + ro + (code - start) * 2)
      return g === 0 ? 0 : (g + delta) & 0xffff
    }
  }
  return 0
}

const chars = []
for (let c = 32; c < 127; c++) chars.push(c)
// The few non-ASCII characters TortOS's own strings use.
for (const c of ['·', '—', '–', 'é', '’']) chars.push(c.codePointAt(0))

const entries = chars.map((c) => `  ${JSON.stringify(String.fromCodePoint(c))}: ${advanceOf(glyphFor(c))},`)

/* ---- GPOS pair kerning ---------------------------------------------------- */

function coverage(off) {
  const fmt = b.readUInt16BE(off)
  const map = new Map()
  if (fmt === 1) {
    const n = b.readUInt16BE(off + 2)
    for (let i = 0; i < n; i++) map.set(b.readUInt16BE(off + 4 + i * 2), i)
  } else {
    const n = b.readUInt16BE(off + 2)
    for (let i = 0; i < n; i++) {
      const r = off + 4 + i * 6
      const start = b.readUInt16BE(r)
      const end = b.readUInt16BE(r + 2)
      const idx = b.readUInt16BE(r + 4)
      for (let g = start; g <= end; g++) map.set(g, idx + g - start)
    }
  }
  return map
}

function classDef(off) {
  const fmt = b.readUInt16BE(off)
  const map = new Map()
  if (fmt === 1) {
    const start = b.readUInt16BE(off + 2)
    const n = b.readUInt16BE(off + 4)
    for (let i = 0; i < n; i++) map.set(start + i, b.readUInt16BE(off + 6 + i * 2))
  } else {
    const n = b.readUInt16BE(off + 2)
    for (let i = 0; i < n; i++) {
      const r = off + 4 + i * 6
      for (let g = b.readUInt16BE(r); g <= b.readUInt16BE(r + 2); g++) map.set(g, b.readUInt16BE(r + 4))
    }
  }
  return map
}

const popcount = (v) => v.toString(2).split('').filter((x) => x === '1').length
/** A value record's x advance, or 0 when the format carries none. */
function xAdvance(rec, fmt) {
  if (!(fmt & 4)) return 0
  let o = rec
  if (fmt & 1) o += 2
  if (fmt & 2) o += 2
  return b.readInt16BE(o)
}

/** The kerning between two glyphs from one PairPos subtable, or null if it does not cover them. */
function pairPos(sub, g1, g2) {
  const fmt = b.readUInt16BE(sub)
  const cov = coverage(sub + b.readUInt16BE(sub + 2))
  const vf1 = b.readUInt16BE(sub + 4)
  const vf2 = b.readUInt16BE(sub + 6)
  const size1 = popcount(vf1) * 2
  const size2 = popcount(vf2) * 2
  if (!cov.has(g1)) return null
  if (fmt === 1) {
    const set = sub + b.readUInt16BE(sub + 10 + cov.get(g1) * 2)
    const n = b.readUInt16BE(set)
    for (let i = 0; i < n; i++) {
      const r = set + 2 + i * (2 + size1 + size2)
      if (b.readUInt16BE(r) === g2) return xAdvance(r + 2, vf1)
    }
    return null
  }
  const c1 = classDef(sub + b.readUInt16BE(sub + 8)).get(g1) ?? 0
  const c2 = classDef(sub + b.readUInt16BE(sub + 10)).get(g2) ?? 0
  const class2Count = b.readUInt16BE(sub + 14)
  const r = sub + 16 + (c1 * class2Count + c2) * (size1 + size2)
  return xAdvance(r, vf1)
}

const gpos = tables.GPOS
const lookupList = gpos + b.readUInt16BE(gpos + 8)
const featureList = gpos + b.readUInt16BE(gpos + 6)
const kernLookups = new Set()
for (let i = 0; i < b.readUInt16BE(featureList); i++) {
  const rec = featureList + 2 + i * 6
  if (b.toString('latin1', rec, rec + 4) !== 'kern') continue
  const feat = featureList + b.readUInt16BE(rec + 4)
  for (let k = 0; k < b.readUInt16BE(feat + 2); k++) kernLookups.add(b.readUInt16BE(feat + 4 + k * 2))
}

/** Every PairPos subtable of the kern feature's lookups, extension-wrapped or not, by lookup. */
const lookups = [...kernLookups].sort((x, y) => x - y).map((li) => {
  const lk = lookupList + b.readUInt16BE(lookupList + 2 + li * 2)
  let type = b.readUInt16BE(lk)
  const subs = []
  for (let k = 0; k < b.readUInt16BE(lk + 4); k++) {
    let sub = lk + b.readUInt16BE(lk + 6 + k * 2)
    if (type === 9) {
      type = b.readUInt16BE(sub + 2)
      sub = sub + b.readUInt32BE(sub + 4)
    }
    if (type === 2) subs.push(sub)
  }
  return subs
})

const kerns = []
for (const a of chars) {
  for (const c of chars) {
    const g1 = glyphFor(a)
    const g2 = glyphFor(c)
    let k = 0
    // Each lookup contributes its first subtable that covers the pair.
    for (const subs of lookups) {
      for (const sub of subs) {
        const v = pairPos(sub, g1, g2)
        if (v !== null) {
          k += v
          break
        }
      }
    }
    if (k) kerns.push(`  ${JSON.stringify(String.fromCodePoint(a) + String.fromCodePoint(c))}: ${k},`)
  }
}

console.log(`/**
 * Josefin Sans Regular's advance widths, in font units of ${upm} per em.
 *
 * Generated by \`docs/themes/tortos/reference/extract-advances.mjs\` from the font TortOS ships
 * (\`res/fonts/menu.ttf\`). Do not edit by hand.
 */
export const UNITS_PER_EM = ${upm}

export const ADVANCES: Readonly<Record<string, number>> = {
${entries.join('\n')}
}

/** GPOS pair kerning between two characters, in the same units. Only non-zero pairs. */
export const KERNING: Readonly<Record<string, number>> = {
${kerns.join('\n')}
}`)
