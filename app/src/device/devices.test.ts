import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DEVICES, DEVICE_SLUGS, getDevice, gripWidth, isDeviceSlug } from './devices'

/**
 * The registry and `docs/devices.md` describe the same hardware. Documentation that can drift
 * from the code it documents eventually does, so the table is parsed and compared rather than
 * trusted.
 */
// Resolved from the Vitest root (`app/`) rather than `import.meta.url`, which is not a file
// URL under jsdom.
const DOC = readFileSync(resolve(process.cwd(), '../docs/devices.md'), 'utf8')

interface DocRow {
  slug: string
  resolution: string
  aspect: string
}

function parseDeviceTable(markdown: string): DocRow[] {
  const rows: DocRow[] = []
  for (const line of markdown.split('\n')) {
    // | `slug` | Label | 640x480 | 4:3 | class |
    const match = /^\|\s*`([a-z0-9-]+)`\s*\|([^|]*)\|\s*(\d+x\d+)\s*\|\s*([0-9:]+)\s*\|/.exec(line)
    if (match) {
      rows.push({ slug: match[1]!, resolution: match[3]!, aspect: match[4]! })
    }
  }
  return rows
}

describe('device registry', () => {
  const docRows = parseDeviceTable(DOC)

  it('parses the documented table', () => {
    expect(docRows.length).toBeGreaterThan(0)
  })

  it('lists exactly the devices the documentation does', () => {
    expect(docRows.map((r) => r.slug).sort()).toEqual([...DEVICE_SLUGS].sort())
  })

  it('agrees with the documentation on every resolution and aspect', () => {
    for (const row of docRows) {
      const device = DEVICES[row.slug as keyof typeof DEVICES]
      expect(`${device.w}x${device.h}`, `resolution for ${row.slug}`).toBe(row.resolution)
      expect(device.aspect, `aspect for ${row.slug}`).toBe(row.aspect)
    }
  })

  it('keys every entry by its own slug', () => {
    for (const slug of DEVICE_SLUGS) {
      expect(DEVICES[slug].slug).toBe(slug)
    }
  })

  it('gives every device a usable panel and viewing scale', () => {
    for (const slug of DEVICE_SLUGS) {
      const d = getDevice(slug)
      expect(d.w).toBeGreaterThan(0)
      expect(d.h).toBeGreaterThan(0)
      expect(d.viewScale).toBeGreaterThan(0)
      expect(d.label).toBeTruthy()
    }
  })

  it('recognises known slugs and rejects unknown ones', () => {
    expect(isDeviceSlug('rg35xx')).toBe(true)
    expect(isDeviceSlug('not-a-device')).toBe(false)
  })

  it('scales the largest and smallest devices to a comparable viewing size', () => {
    /*
     * The scale is a viewing preference, but a device that renders enormous or postage-stamp
     * sized on a desktop makes the gallery unusable.
     *
     * Measured on the whole body rather than the panel. A landscape body puts a grip either
     * side, so the same panel width is a much smaller share of the frame, and holding the panel
     * to a fixed range would push the body off the edge of the page.
     */
    for (const slug of DEVICE_SLUGS) {
      const d = getDevice(slug)
      const grips = gripWidth(d.shell, d.w) * 2
      const bodyWidth = (d.w + grips + d.shell.bezel.side * 2) * d.viewScale

      expect(bodyWidth, `${slug} body width`).toBeGreaterThan(500)
      expect(bodyWidth, `${slug} body width`).toBeLessThan(1400)
      // The panel still has to be legible in its own right.
      expect(d.w * d.viewScale, `${slug} panel width`).toBeGreaterThan(400)
    }
  })
})
