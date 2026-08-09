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
  /**
   * The two screens space their bodies differently, and the difference is visible.
   *
   * The menu drops 12px below the rule and then flows to the footer. The game list starts flush
   * against the rule with a fixed height, which leaves a band of background above the footer.
   * Collapsing both into one body geometry moves the game list down and stretches its detail
   * column over that band.
   */
  menuBodyGap: 12 / 480,
  gameListBodyHeight: 356 / 480,
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
  /** Asymmetric in the original: 12 left, 8 right. */
  listPaddingLeft: 12 / 640,
  listPaddingRight: 8 / 640,
  listPaddingY: 8 / 480,
  /** Gap between the cover art and the title block in the detail column. */
  detailGap: 16 / 480,
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
  footerHintGap: 20 / 640,
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
    readonly detailTitleFont: number
    readonly detailMeta: Box
    readonly detailMetaFont: number
  }

  readonly footer: Box
  readonly footerFont: number
  readonly footerPaddingX: number
  readonly footerHintGap: number
}

/** Resolve the layout for a device. Pure, so every device can be snapshotted. */
export function resolve(device: DeviceSlug): ExampleLayout {
  const { w, h } = getDevice(device)

  const headerHeight = SPEC.headerHeight * h
  const ruleHeight = SPEC.ruleHeight * h
  const paddingX = SPEC.paddingX * w
  const footerHeight = SPEC.footerHeight * h

  // The menu drops below the rule and runs to the footer.
  const menuTop = headerHeight + ruleHeight + SPEC.menuBodyGap * h
  const menuHeight = h - menuTop - footerHeight

  // The game list starts flush against the rule and has a fixed height, leaving a band of
  // background between it and the footer.
  const listTop = headerHeight + ruleHeight
  const listBodyHeight = SPEC.gameListBodyHeight * h

  const listWidth = SPEC.listWidth * w
  const artSize = SPEC.artSize * h
  const detailLeft = listWidth
  const detailWidth = w - listWidth
  const detailTitleFont = SPEC.detailTitleFont * h
  const detailMetaFont = SPEC.detailMetaFont * h
  const detailGap = SPEC.detailGap * h

  // The detail column centres a stack of art, title and metadata. Line boxes are 1.5x the font
  // size, which is the inherited line height the original rendered with.
  const titleLine = detailTitleFont * 1.5
  const metaLine = detailMetaFont * 1.5
  const detailStackHeight = artSize + detailGap + titleLine + metaLine
  const detailStackTop = listTop + (listBodyHeight - detailStackHeight) / 2

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
      box: { left: paddingX, top: menuTop, width: w - paddingX * 2, height: menuHeight },
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
        left: SPEC.listPaddingLeft * w,
        top: listTop + SPEC.listPaddingY * h,
        width: listWidth - SPEC.listPaddingLeft * w - SPEC.listPaddingRight * w,
        // Top padding only. The original scrolls, and a scroll container clips at its padding
        // box, so the bottom padding does not cut the last row short.
        height: listBodyHeight - SPEC.listPaddingY * h,
      },
      rowHeight: SPEC.gameRowHeight * h,
      gap: SPEC.gameRowGap * h,
      titleFont: SPEC.gameTitleFont * h,
      subFont: SPEC.gameSubFont * h,
      rowPaddingX: SPEC.menuRowPaddingX * w,
      rowRadius: SPEC.gameRowRadius * h,
      detail: { left: detailLeft, top: listTop, width: detailWidth, height: listBodyHeight },
      art: {
        left: detailLeft + (detailWidth - artSize) / 2,
        top: detailStackTop,
        width: artSize,
        height: artSize,
      },
      detailTitle: {
        left: detailLeft,
        top: detailStackTop + artSize + detailGap,
        width: detailWidth,
        height: titleLine,
      },
      detailTitleFont,
      detailMeta: {
        left: detailLeft,
        top: detailStackTop + artSize + detailGap + titleLine,
        width: detailWidth,
        height: metaLine,
      },
      detailMetaFont,
    },

    footer: { left: 0, top: h - footerHeight, width: w, height: footerHeight },
    footerFont: SPEC.footerFont * h,
    footerPaddingX: SPEC.footerPaddingX * w,
    footerHintGap: SPEC.footerHintGap * w,
  }
}
