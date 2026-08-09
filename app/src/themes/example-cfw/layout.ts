import type { Box } from '../../layout/box'
import { getDevice, type DeviceSlug } from '../../device/devices'

/**
 * Example OS layout.
 *
 * The original was authored as literal pixels for a single 640x480 panel. Here the same numbers
 * are expressed as fractions of the screen, so the layout resolves for any device in the
 * registry - which is what the rest of the repo does, and what makes the scaffold a useful
 * starting point rather than a 640x480 special case.
 *
 * The fractions are exact divisions of the original pixel values, so at 640x480 this resolves
 * to precisely what the original hardcoded. `layout.test.ts` asserts that, which is what keeps
 * "generalised" from quietly meaning "changed".
 */
const SPEC = {
  headerHeight: 44 / 480,
  titleFont: 18 / 480,
  statusFont: 14 / 480,
  countFont: 13 / 480,
  paddingX: 20 / 640,
  ruleHeight: 1 / 480,
  /** Gap between the rule and the first row. */
  bodyTop: 12 / 480,
  /** Width allotted to the header clock and the battery readout, and the gap between them. */
  headerClockWidth: 51 / 640,
  headerStatusWidth: 48 / 640,
  headerStatusGap: 12 / 640,

  menuRowHeight: 68 / 480,
  menuRowGap: 4 / 480,
  menuLabelFont: 20 / 480,
  menuSublabelFont: 13 / 480,
  menuIconSize: 44 / 480,
  menuRowPaddingX: 12 / 640,
  menuRowRadius: 8 / 480,
  menuSelectedShiftX: 6 / 640,

  listWidth: 300 / 640,
  listPaddingX: 12 / 640,
  gameRowHeight: 48 / 480,
  gameRowGap: 4 / 480,
  gameTitleFont: 16 / 480,
  gameSubFont: 12 / 480,
  gameRowRadius: 6 / 480,

  artSize: 160 / 480,
  detailTitleFont: 19 / 480,
  detailMetaFont: 13 / 480,

  footerHeight: 40 / 480,
  footerFont: 13 / 480,
  footerPaddingX: 20 / 640,
} as const

export interface ExampleLayout {
  readonly w: number
  readonly h: number
  readonly header: Box
  readonly rule: Box
  /**
   * Clock and battery sit in resolved boxes rather than inside the header's flow slot. Every
   * widget positions absolutely from resolved geometry, so composing them into a flex slot
   * would be the one place in the app that worked differently.
   */
  readonly headerClock: Box
  readonly headerStatus: Box
  readonly titleFont: number
  readonly statusFont: number
  readonly countFont: number
  readonly paddingX: number

  readonly menu: {
    readonly box: Box
    readonly rowHeight: number
    readonly gap: number
    readonly labelFont: number
    readonly sublabelFont: number
    readonly iconSize: number
    readonly rowPaddingX: number
    readonly rowRadius: number
    readonly selectedShiftX: number
  }

  readonly gameList: {
    readonly list: Box
    readonly rowHeight: number
    readonly gap: number
    readonly titleFont: number
    readonly subFont: number
    readonly rowPaddingX: number
    readonly rowRadius: number
    readonly detail: Box
    readonly art: Box
    readonly detailTitle: Box
    readonly detailMeta: Box
  }

  readonly footer: Box
  readonly footerFont: number
  readonly footerPaddingX: number
}

/** Resolve the layout for a device. Pure, so every device can be snapshotted. */
export function resolve(device: DeviceSlug): ExampleLayout {
  const { w, h } = getDevice(device)

  const headerHeight = SPEC.headerHeight * h
  const ruleHeight = SPEC.ruleHeight * h
  const paddingX = SPEC.paddingX * w
  const footerHeight = SPEC.footerHeight * h

  const bodyTop = headerHeight + ruleHeight + SPEC.bodyTop * h
  const bodyHeight = h - bodyTop - footerHeight

  const listWidth = SPEC.listWidth * w
  const artSize = SPEC.artSize * h
  const detailLeft = listWidth
  const detailWidth = w - listWidth
  const detailTitleFont = SPEC.detailTitleFont * h
  const detailMetaFont = SPEC.detailMetaFont * h

  // The detail column centres its stack: art, title, metadata.
  const detailStackHeight = artSize + detailTitleFont * 2.2 + detailMetaFont * 1.8
  const detailStackTop = bodyTop + (bodyHeight - detailStackHeight) / 2

  // Header cluster, right-aligned: clock, gap, battery, then the header padding.
  const statusWidth = SPEC.headerStatusWidth * w
  const clockWidth = SPEC.headerClockWidth * w
  const statusLeft = w - paddingX - statusWidth
  const clockLeft = statusLeft - SPEC.headerStatusGap * w - clockWidth

  return {
    w,
    h,
    header: { left: 0, top: 0, width: w, height: headerHeight },
    rule: {
      left: paddingX,
      top: headerHeight,
      width: w - paddingX * 2,
      height: ruleHeight,
    },
    headerClock: { left: clockLeft, top: 0, width: clockWidth, height: headerHeight },
    headerStatus: { left: statusLeft, top: 0, width: statusWidth, height: headerHeight },
    titleFont: SPEC.titleFont * h,
    statusFont: SPEC.statusFont * h,
    countFont: SPEC.countFont * h,
    paddingX,

    menu: {
      box: { left: paddingX, top: bodyTop, width: w - paddingX * 2, height: bodyHeight },
      rowHeight: SPEC.menuRowHeight * h,
      gap: SPEC.menuRowGap * h,
      labelFont: SPEC.menuLabelFont * h,
      sublabelFont: SPEC.menuSublabelFont * h,
      iconSize: SPEC.menuIconSize * h,
      rowPaddingX: SPEC.menuRowPaddingX * w,
      rowRadius: SPEC.menuRowRadius * h,
      selectedShiftX: SPEC.menuSelectedShiftX * w,
    },

    gameList: {
      list: {
        left: SPEC.listPaddingX * w,
        top: bodyTop,
        width: listWidth - SPEC.listPaddingX * w * 2,
        height: bodyHeight,
      },
      rowHeight: SPEC.gameRowHeight * h,
      gap: SPEC.gameRowGap * h,
      titleFont: SPEC.gameTitleFont * h,
      subFont: SPEC.gameSubFont * h,
      rowPaddingX: SPEC.menuRowPaddingX * w,
      rowRadius: SPEC.gameRowRadius * h,
      detail: { left: detailLeft, top: bodyTop, width: detailWidth, height: bodyHeight },
      art: {
        left: detailLeft + (detailWidth - artSize) / 2,
        top: detailStackTop,
        width: artSize,
        height: artSize,
      },
      detailTitle: {
        left: detailLeft,
        top: detailStackTop + artSize + detailTitleFont * 0.7,
        width: detailWidth,
        height: detailTitleFont * 1.4,
      },
      detailMeta: {
        left: detailLeft,
        top: detailStackTop + artSize + detailTitleFont * 2.2,
        width: detailWidth,
        height: detailMetaFont * 1.6,
      },
    },

    footer: { left: 0, top: h - footerHeight, width: w, height: footerHeight },
    footerFont: SPEC.footerFont * h,
    footerPaddingX: SPEC.footerPaddingX * w,
  }
}
