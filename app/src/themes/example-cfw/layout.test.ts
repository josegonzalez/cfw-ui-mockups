import { describe, expect, it } from 'vitest'
import { DEVICE_SLUGS } from '../../device/devices'
import { resolve } from './layout'

/**
 * The original authored this screen as literal pixels for one 640x480 panel. Here the same
 * numbers are fractions of the screen so the layout resolves for any device.
 *
 * These assertions are what stop "generalised" from quietly meaning "changed": at 640x480 the
 * resolver must reproduce the original's hardcoded values exactly.
 */
describe('resolve at 640x480, against the original hardcoded values', () => {
  const l = resolve('rg35xx')

  it('sizes the header, rule and footer as authored', () => {
    expect(l.header.height).toBe(44)
    expect(l.rule.height).toBe(1)
    expect(l.rule.left).toBe(20)
    expect(l.rule.width).toBe(600)
    expect(l.footer.height).toBe(40)
    expect(l.footer.top).toBe(440)
  })

  it('matches the authored type scale', () => {
    expect(l.titleFont).toBe(18)
    expect(l.statusFont).toBe(14)
    expect(l.countFont).toBe(13)
    expect(l.footerFont).toBe(13)
  })

  it('matches the authored menu metrics', () => {
    expect(l.menu.rowHeight).toBe(68)
    expect(l.menu.gap).toBe(4)
    expect(l.menu.labelFont).toBe(20)
    expect(l.menu.sublabelFont).toBe(13)
    expect(l.menu.iconSize).toBe(44)
    expect(l.menu.rowRadius).toBe(8)
    expect(l.menu.selectedShiftX).toBe(6)
  })

  it('matches the authored game list metrics', () => {
    expect(l.gameList.rowHeight).toBe(48)
    expect(l.gameList.titleFont).toBe(16)
    expect(l.gameList.subFont).toBe(12)
    expect(l.gameList.art.width).toBe(160)
    expect(l.gameList.art.height).toBe(160)
    // The list column is 300 wide; the detail column takes the rest.
    expect(l.gameList.detail.left).toBe(300)
    expect(l.gameList.detail.width).toBe(340)
  })

  it('starts the body below the header and rule', () => {
    // 44 header + 1 rule + 12 gap.
    expect(l.menu.box.top).toBe(57)
  })

  it('leaves the body exactly the space between header and footer', () => {
    expect(l.menu.box.top + l.menu.box.height).toBe(l.footer.top)
  })
})

describe('resolve across the registry', () => {
  it('produces a usable layout for every device', () => {
    for (const slug of DEVICE_SLUGS) {
      const l = resolve(slug)

      expect(l.header.height, `${slug} header`).toBeGreaterThan(0)
      expect(l.menu.box.height, `${slug} body`).toBeGreaterThan(0)
      expect(l.gameList.list.width, `${slug} list`).toBeGreaterThan(0)
      expect(l.footer.top + l.footer.height, `${slug} footer bottom`).toBeCloseTo(l.h, 6)
    }
  })

  it('keeps every box inside the panel', () => {
    for (const slug of DEVICE_SLUGS) {
      const l = resolve(slug)
      const boxes = [l.header, l.rule, l.headerClock, l.headerStatus, l.menu.box, l.footer, l.gameList.list, l.gameList.detail, l.gameList.art]

      for (const box of boxes) {
        expect(box.left, `${slug} left`).toBeGreaterThanOrEqual(0)
        expect(box.top, `${slug} top`).toBeGreaterThanOrEqual(0)
        expect(box.left + box.width, `${slug} right edge`).toBeLessThanOrEqual(l.w + 0.001)
        expect(box.top + box.height, `${slug} bottom edge`).toBeLessThanOrEqual(l.h + 0.001)
      }
    }
  })

  it('keeps the header clock and battery from overlapping', () => {
    for (const slug of DEVICE_SLUGS) {
      const l = resolve(slug)
      expect(l.headerClock.left + l.headerClock.width, slug).toBeLessThanOrEqual(l.headerStatus.left)
    }
  })

  it('fits at least one menu row on the smallest panel', () => {
    const l = resolve('rg351m')
    expect(l.menu.box.height).toBeGreaterThan(l.menu.rowHeight)
  })
})
