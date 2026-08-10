/**
 * Elementerial's layout: normalised in the source's own numbers, resolved to pixels once.
 *
 * EmulationStation themes position everything in normalised 0-1 coordinates - x against screen
 * width, y against screen height, font sizes against height only - and every element carries an
 * `origin`, a normalised anchor *within* the element. So `origin [0.5, 0.5]` with
 * `pos [0.7, 0.25]` puts the element's centre at 70% across and 25% down.
 *
 * This repo renders at native device pixels, so the spec below stays in the source's numbers and
 * `resolve()` turns them into literal pixels for one fixed size. Nothing here reads the viewport.
 *
 * `SPEC` mirrors the source's view XML; `ASPECT` mirrors its per-aspect override files. The
 * aspects genuinely restructure the detailed view rather than merely scaling it, which is why
 * those overrides are stated explicitly rather than derived.
 */
import { getDevice, type DeviceSlug } from '../../device/devices'

export type ElementerialDevice = 'rg35xx' | 'rg-cubexx' | 'rg351m' | 'rg552'
export type Ratio = 'ratio43' | 'ratio11' | 'ratio32' | 'ratio53'
export type FontSize = 'small' | 'medium' | 'large'
export type GridDirection = 'horizontal' | 'vertical'

export const ELEMENTERIAL_DEVICES: readonly ElementerialDevice[] = [
  'rg35xx',
  'rg-cubexx',
  'rg351m',
  'rg552',
]

const RATIO_OF: Record<ElementerialDevice, Ratio> = {
  rg35xx: 'ratio43',
  'rg-cubexx': 'ratio11',
  rg351m: 'ratio32',
  rg552: 'ratio53',
}

/** All normalised to screen height, from the source's `variables.xml`. */
export const FONTS: Record<FontSize, Record<string, number>> = {
  small: { h1: 0.05625, h2: 0.04375, h3: 0.0375, body: 0.03, caption: 0.028125 },
  medium: { h1: 0.06, h2: 0.05, h3: 0.04375, body: 0.035, caption: 0.028125 },
  large: { h1: 0.06875, h2: 0.05625, h3: 0.046875, body: 0.040625, caption: 0.03125 },
}

/** The 1920x960 system screenshots and the 480x320 logo SVGs. */
const NATURAL = { cover: 1920 / 960, logo: 480 / 320 }

/**
 * EmulationStation multiplies `lineSpacing` by the font's *line height*, not by its size:
 * `rowHeight = Font::getHeight() * lineSpacing`. These are read out of the bundled faces' own
 * metrics tables. It is what makes the theme's numbers come out round - every device shows
 * exactly ten rows in the detailed list and seven in the video list, which is why 4:3 carries
 * the otherwise odd 1.42125 video spacing.
 */
const LINE_BOX = { inter: 1.2102, roboto: 1.1719 }

/** ES image size modes map straight onto a CSS object-fit. */
export const FIT = { minSize: 'cover', maxSize: 'contain', size: 'fill' } as const

export const BOX_ART = {
  cover: { selectionMode: 'full', imageSizeMode: 'minSize' },
  fit: { selectionMode: 'image', imageSizeMode: 'maxSize' },
  stretch: { selectionMode: 'image', imageSizeMode: 'size' },
} as const

export const GRID_IMAGE = {
  screenshot: { source: 'image', selectionMode: 'full', imageSizeMode: 'minSize' },
  thumbnail: { source: 'thumbnail', selectionMode: 'full', imageSizeMode: 'minSize' },
  marquee: { source: 'marquee', selectionMode: 'full', imageSizeMode: 'maxSize' },
} as const

export const ICON_STYLE = { Square: 'grid', Steam: 'grid-steam' } as const

/* eslint-disable @typescript-eslint/no-explicit-any -- the spec mirrors an untyped XML shape */
type Node = any

const SPEC: Record<string, Node> = {
  screen: {
    help: { pos: [0.016666667, 0.96], origin: [0, 0.5], font: 'body' },
    clock: { origin: [0, 0.5], font: 'body', align: 'right' },
    activity: { pos: [0.016666, 0.025], origin: [0, 0], size: 0.025, itemSpacing: 0.003 },
    border: { z: 100 },
    osd: { z: 100 },
  },

  system: {
    cover: { size: [1, 0], origin: [0, 0.5], pos: [0, 0.25], z: -9, natural: 'cover' },
    carouselVideo: { pos: [0, 0.25], origin: [0, 0.5], minSize: [1, 0.5], z: -8, delay: 1500 },
    scrim: { z: -7 },
    carousel: { pos: [0.5, 0], origin: [0.5, 0], logoSize: [0.25, 0.25], logoScale: 1.4, z: 10 },
    systemName: { origin: [0, 0], size: [0.866667, 'h1'], font: 'h1', bold: true, upper: true, z: 15 },
    systemInfo: { origin: [0, 0], size: [0.866667, 'body'], font: 'body', upper: true, z: 15 },
  },

  gamelistCommon: {
    coverList: { size: [1, 0], origin: [0, 0.5], pos: [0, 0.225], minSize: [1, 0.45], z: -5, natural: 'cover' },
    scrim: { z: -4 },
  },

  listHeader: {
    logoText: { pos: [0.033333, 0.1], origin: [0, 0.5], size: [0.933333, 'h2'], font: 'h2', bold: true, upper: true, z: 5 },
    gamelist: { pos: [0, 0.2], origin: [0, 0], hMargin: 0.033333, font: 'body', z: 5 },
  },

  detailed: {
    gamelist: { size: [0.466667, 0.725] },
    md_image: { pos: [0.733333, 0.525], origin: [0.5, 0.5], maxSize: [0.466667, 0.55], round: 0.05, z: 5 },
    md_marquee: { pos: [0.733333, 0.25], origin: [0.5, 0.5], maxSize: [0.4, 0.175], z: 6 },
    md_rating: { origin: [0, 0], z: 5 },
  },

  video: {
    md_marquee: { pos: [0.2, 0.1875], origin: [0.5, 0.5], maxSize: [0.333333333, 0.325] },
    md_image: { pos: [0.7, 0.25], origin: [0.5, 0.5], minSize: [0.7, 0.55], z: -1 },
    md_video: { pos: [0.7, 0.25], origin: [0.5, 0.5], minSize: [0.7, 0.55], z: 0, delay: 1000 },
    scrim: { z: 4 },
    logoText: { origin: [0, 0.5], pos: [0.033333333, 0.4] },
    gamelist: { pos: [0, 0.45], size: [1, 0.475] },
  },

  grid: {
    logoText: { pos: [0.033333, 0.078125], origin: [0, 0.5], size: [0.675, 'h2'], font: 'h2', bold: true, upper: true, z: 5 },
    md_name: { pos: [0.033333, 0.14375], origin: [0, 0.5], size: [0.9, 'body'], font: 'body', z: 5 },
    gamegrid: { pos: [0, 0.2], size: [1, 0.725], padding: [0.066666667, 0.025], z: 5 },
    caption: { font: 'caption' },
    favorite: { maxSize: [0.25, 0.25] },
  },

  boxes: {
    gamegrid: { size: [1, 0.725], selectedZoom: 1.075 },
    marquee: { pos: [0.5, 0.5], origin: [0.5, 0.5], maxSize: [0.65, 0.65], maxSizeSelected: [0.8, 0.8] },
    caption: { size: [1, 0.2], pos: [0, 0.7], font: 'caption', lineSpacing: 1.2 },
  },

  elementflix: {
    gamegrid: { pos: [0, 0.475], selectedZoom: 1.075, animateSelection: false },
    md_marquee: { pos: [0.233333333, 0.125], origin: [0.5, 0.5], maxSize: [0.4, 0.225] },
    md_image: { pos: [0.7, 0.25], origin: [0.5, 0.5], minSize: [0.7, 0.55], z: -1 },
    md_video: { pos: [0.7, 0.25], origin: [0.5, 0.5], minSize: [0.6, 0.5], z: 0, delay: 1000 },
    md_description: { pos: [0.033333333, 0.25], origin: [0, 0], size: [0.433333333, 0.15], font: 'caption', lineSpacing: 1.1, z: 5 },
    logoText: { pos: [0.033333333, 0.45], origin: [0, 0.5], font: 'h3' },
    scrim: { z: 4 },
    caption: { size: [1, 0.2], pos: [0, 0.75], font: 'caption', lineSpacing: 1.2 },
    // The two fades carry different origins in the vertical variant - the top anchors at [0, 0]
    // and the bottom at [0, 1] - so each keeps its own.
    horizontal: {
      size: [1, 0.46],
      padding: [0.065, 0.0225],
      margin: [0.016666667, 0.025],
      fade: { asset: 'fade-hor.png', size: [0.075, 0.525], a: [0.0375, 0.7375], aOrigin: [0.5, 0.5], b: [0.9625, 0.7375], bOrigin: [0.5, 0.5] },
    },
    vertical: {
      size: [1, 0.475],
      padding: [0.04, 0.075],
      margin: [0.016666667, 0.025],
      fade: { asset: 'fade-ver.png', size: [1, 0.075], a: [0, 0.475], aOrigin: [0, 0], b: [0, 0.95], bOrigin: [0, 1] },
    },
  },

  basic: {
    gamelist: { size: [1, 0.725] },
  },
}

/**
 * Menu geometry is an **approximation**.
 *
 * The source's menu XML themes only fonts, colours, the panel artwork and the icon set - the
 * panel's position and size belong to EmulationStation's own menu component, not to the theme,
 * so there is nothing in the source to transcribe. These fractions are modelled on the
 * equivalent Batocera menu and are the one place in this file that is not a quotation.
 */
const MENU = {
  panel: { width: 0.62, maxHeight: 0.78 },
  title: { height: 2.1, font: 'h2' },
  row: { height: 2.0, font: 'body' },
  group: { height: 1.9, font: 'caption' },
  footer: { height: 2.0, font: 'caption' },
  padding: 0.04,
  icon: 1.15,
  radius: 0.21,
}

const ASPECT: Record<Ratio, Node> = {
  ratio43: {
    carousel: { size: [1.1, 1], maxLogoCount: 4, logoPos: [0.15, 0.6] },
    systemName: { pos: [0.08333, 0.375] },
    systemInfo: { pos: [0.08333, 0.46] },
    lineSpacing: { list: 1.68, video: 1.42125 },
    md_rating: { pos: [0.6075, 0.83125], size: 0.066667 },
    grid: { autoLayout: [3, 2], margin: [0.033333, 0.025], tilePadding: [4, 4], round: 0.04, roundSelected: 0.025, selectorRadius: 5, caption: { size: [0.9, 0.225], padding: [0.05, 0], lineSpacing: 1.15 } },
    boxes: { autoLayout: [2, 2], margin: [0.025, 0.033333], round: 0.025, roundSelected: 0.01 },
    flix: { autoLayout: [3, 1], tilePadding: [3, 3], selectorRadius: 5 },
    clock: { pos: [0, 0.041666667], size: [0.7625, 0] },
    battery: { pos: [0.9, 0.008333333], size: 0.066666667, itemSpacing: 0.0125, icons: '32x32' },
  },

  ratio11: {
    carousel: { size: [1.2, 1], maxLogoCount: 4, logoPos: [0.2, 0.6] },
    systemName: { pos: [0.08333, 0.375] },
    systemInfo: { pos: [0.08333, 0.475] },
    lineSpacing: { list: 1.6, video: 1.6 },
    md_rating: { pos: [0.61, 0.6375], size: 0.05 },
    // The 1:1 aspect restructures detailed and turns the description back on. The origins are
    // restated because an aspect override replaces the whole element node rather than merging
    // into it, exactly as ES's own theme inheritance does.
    detailed: {
      md_marquee: { origin: [0.5, 0.5], pos: [0.733333, 0.2], maxSize: [0.4, 0.175], z: 6 },
      md_image: { origin: [0.5, 0.5], pos: [0.733333, 0.425], maxSize: [0.466667, 0.4], round: 0.02, z: 5 },
      md_description: { visible: true, origin: [0.5, 0], pos: [0.733333, 0.7], size: [0.466667, 0.2125], font: 'caption', lineSpacing: 1.25 },
    },
    grid: { autoLayout: [3, 2], margin: [0.033333, 0.025], tilePadding: [4, 4], round: 0.03, roundSelected: 0.02, selectorRadius: 5, caption: { size: [0.92, 0.225], padding: [0.04, 0], lineSpacing: 1.2 } },
    boxes: { autoLayout: [2, 2], margin: [0.0333333, 0.05], round: 0.015, roundSelected: 0.01 },
    flix: { autoLayout: [3, 1], tilePadding: [3, 3], selectorRadius: 5 },
    clock: { pos: [-0.02, 0.0375], size: [0.84, 0] },
    battery: { pos: [0.86, 0.0125], size: 0.044444444, itemSpacing: 0.0125, icons: '32x32' },
    // The 1:1 aspect ships no OSD background of its own and borrows the 4:3 one.
    osdFrom: 'ratio43',
  },

  ratio32: {
    carousel: { size: [1.1, 1], maxLogoCount: 4, logoPos: [0.15, 0.55] },
    systemName: { pos: [0.08333, 0.325] },
    systemInfo: { pos: [0.08333, 0.41] },
    lineSpacing: { list: 1.6, video: 1.6 },
    md_rating: { pos: [0.61, 0.83125], size: 0.075 },
    grid: { autoLayout: [3, 2], margin: [0.033333, 0.025], tilePadding: [3, 3], round: 0.03, roundSelected: 0.02, selectorRadius: 2, caption: { size: [0.92, 0.225], padding: [0.04, 0], lineSpacing: 1.15 } },
    boxes: { autoLayout: [2, 2], margin: [0.0333333, 0.05], round: 0.025, roundSelected: 0.025 },
    flix: { autoLayout: [3, 1], tilePadding: [2, 2], selectorRadius: 2 },
    clock: { pos: [0, 0.0375], size: [0.775, 0] },
    battery: { pos: [0.9125, 0.00625], size: 0.075, itemSpacing: 0.008333333, icons: '24x24' },
  },

  ratio53: {
    carousel: { size: [1.2, 1], maxLogoCount: 5, logoPos: [0.2, 0.55] },
    systemName: { pos: [0.08333, 0.325] },
    systemInfo: { pos: [0.08333, 0.41] },
    lineSpacing: { list: 1.575, video: 1.575 },
    md_rating: { pos: [0.62, 0.83125], size: 0.075 },
    grid: { autoLayout: [4, 2], margin: [0.025, 0.025], tilePadding: [8, 8], round: 0.025, roundSelected: 0.015, selectorRadius: 9, caption: { size: [0.9, 0.18], padding: [0.05, 0], lineSpacing: 1.15 } },
    boxes: { autoLayout: [3, 2], margin: [0.025, 0.041667], round: 0.015, roundSelected: 0.01 },
    flix: { autoLayout: [5, 1], tilePadding: [4, 4], selectorRadius: 9 },
    clock: { pos: [0, 0.041666667], size: [0.84, 0] },
    battery: { pos: [0.93, 0.0125], size: 0.0625, itemSpacing: 0.0125, icons: '72x72' },
  },
}

export interface EsBox {
  left: number
  top: number
  width: number
  height: number
  /** Anchor, kept separately: a `maxSize` element's box shrinks to the fitted image in ES. */
  posX: number
  posY: number
  originX: number
  originY: number
  fit: 'contain' | 'cover' | null
  radius: number
  z?: number
  font?: number
  lineSpacing?: number
}

/**
 * Resolve one spec node to a pixel box.
 *
 * `size` is the base when present; `maxSize` and `minSize` are only the box when the element
 * declares no size of its own. The cover list declares both `size [1, 0]` and
 * `minSize [1, 0.45]`, so that precedence matters.
 */
function boxOf(node: Node, W: number, H: number, fonts: Record<string, number>, natural?: number): EsBox {
  const base = node.size || node.maxSize || node.minSize || [0, 0]
  let w = base[0] * W
  let h = typeof base[1] === 'string' ? fonts[base[1]]! * H : base[1] * H

  // A zero component means "derive from the asset's own aspect ratio".
  if (base[1] === 0 && natural) h = w / natural
  if (base[0] === 0 && natural) w = h * natural

  // minSize is a floor, so grow to cover it, keeping the asset's aspect.
  if (node.minSize) {
    const minW = node.minSize[0] * W
    const minH = node.minSize[1] * H
    if (natural) {
      if (h < minH) {
        h = minH
        w = h * natural
      }
      if (w < minW) {
        w = minW
        h = w / natural
      }
    } else {
      if (w < minW) w = minW
      if (h < minH) h = minH
    }
  }

  const origin = node.origin || [0, 0]
  const pos = node.pos || [0, 0]

  return {
    left: pos[0] * W - origin[0] * w,
    top: pos[1] * H - origin[1] * h,
    width: w,
    height: h,
    posX: pos[0] * W,
    posY: pos[1] * H,
    originX: origin[0],
    originY: origin[1],
    fit: node.maxSize ? 'contain' : node.minSize ? 'cover' : null,
    radius: node.round ? node.round * Math.min(w, h) : 0,
    z: node.z,
  }
}

export interface GridMetrics {
  box: { left: number; top: number; width: number; height: number }
  padding: [number, number]
  margin: [number, number]
  cols: number
  rows: number
  tileW: number
  tileH: number
}

function gridMetrics(node: Node, W: number, H: number, aspectGrid: Node): GridMetrics {
  const box = {
    left: (node.pos ? node.pos[0] : 0) * W,
    top: (node.pos ? node.pos[1] : 0) * H,
    width: node.size[0] * W,
    height: node.size[1] * H,
  }
  const pad: [number, number] = [node.padding[0] * W, node.padding[1] * H]
  const margin: [number, number] = [aspectGrid.margin[0] * W, aspectGrid.margin[1] * H]
  const cols = aspectGrid.autoLayout[0]
  const rows = aspectGrid.autoLayout[1]

  return {
    box,
    padding: pad,
    margin,
    cols,
    rows,
    tileW: (box.width - 2 * pad[0] - (cols - 1) * margin[0]) / cols,
    tileH: (box.height - 2 * pad[1] - (rows - 1) * margin[1]) / rows,
  }
}

export interface ResolveOptions {
  readonly fontSize?: FontSize | undefined
  readonly gridDirection?: GridDirection | undefined
}

/** Mirrors the source spec's shape, which is untyped XML rather than a designed schema. */
export type ElementerialLayout = any

/**
 * Every measurement a device needs, in literal pixels.
 *
 * Pure, so `layout.test.ts` can assert it against output captured from the original resolver
 * across every device, font size and grid direction - 24 combinations, compared value by value.
 */
export function resolve(deviceId: ElementerialDevice, opts: ResolveOptions = {}): ElementerialLayout {
  const dev = getDevice(deviceId as DeviceSlug)
  const W = dev.w
  const H = dev.h
  const ratio = RATIO_OF[deviceId]
  const a = ASPECT[ratio]
  const fonts = FONTS[opts.fontSize ?? 'medium']
  const natCover = NATURAL.cover

  const font: Record<string, number> = {}
  for (const key of Object.keys(fonts)) font[key] = fonts[key]! * H

  /*
   * Carousel: `logoPos` is normalised within the carousel box, not the screen, and marks the
   * TOP-LEFT of the selected logo's cell. The selected logo then scales about that cell's
   * centre. Spacing is one even division of the carousel width, and because the box is wider
   * than the screen the row bleeds off both edges.
   *
   * The top-left reading is what the reference screenshots show, and is the only reading under
   * which the system info does not collide with the logo row on any aspect.
   */
  const cw = a.carousel.size[0] * W
  const ch = a.carousel.size[1] * H
  const logoW = SPEC.system!.carousel.logoSize[0] * W
  const logoH = SPEC.system!.carousel.logoSize[1] * H
  const carousel = {
    left: SPEC.system!.carousel.pos[0] * W - SPEC.system!.carousel.origin[0] * cw,
    top: 0,
    width: cw,
    height: ch,
    logoW,
    logoH,
    scale: SPEC.system!.carousel.logoScale,
    count: a.carousel.maxLogoCount,
    pitch: cw / a.carousel.maxLogoCount,
    selTopLeft: [a.carousel.logoPos[0] * cw, a.carousel.logoPos[1] * ch],
    selCenter: [a.carousel.logoPos[0] * cw + logoW / 2, a.carousel.logoPos[1] * ch + logoH / 2],
  }

  const lineBox = font.body! * LINE_BOX.inter
  const listRow = lineBox * a.lineSpacing.list
  const videoRow = lineBox * a.lineSpacing.video

  const detailed = { ...SPEC.detailed, ...(a.detailed || {}) }
  const listBox = {
    left: 0,
    top: SPEC.listHeader!.gamelist.pos[1] * H,
    width: detailed.gamelist.size[0] * W,
    height: detailed.gamelist.size[1] * H,
    hMargin: SPEC.listHeader!.gamelist.hMargin * W,
    row: listRow,
  }

  const gridNode = { ...SPEC.grid!.gamegrid }
  const boxesNode = { ...SPEC.grid!.gamegrid, ...SPEC.boxes!.gamegrid }

  // Elementflix: grid geometry, then the flix overrides, then the selected direction variant.
  const flixDir: GridDirection = opts.gridDirection === 'vertical' ? 'vertical' : 'horizontal'
  const flixVar = SPEC.elementflix![flixDir]
  const flixNode = {
    ...SPEC.grid!.gamegrid,
    ...SPEC.elementflix!.gamegrid,
    size: flixVar.size,
    padding: flixVar.padding,
  }
  const flixMetrics = gridMetrics(flixNode, W, H, {
    autoLayout: a.flix.autoLayout,
    margin: flixVar.margin,
  })

  return {
    device: deviceId,
    ratio,
    w: W,
    h: H,
    font,
    osdRatio: a.osdFrom || ratio,

    screen: {
      help: {
        left: SPEC.screen!.help.pos[0] * W,
        top: SPEC.screen!.help.pos[1] * H,
        font: font.body,
      },
      clock: {
        left: a.clock.pos[0] * W,
        top: a.clock.pos[1] * H,
        width: a.clock.size[0] * W,
        font: font.body,
      },
      battery: {
        left: a.battery.pos[0] * W,
        top: a.battery.pos[1] * H,
        size: a.battery.size * H,
        itemSpacing: a.battery.itemSpacing * W,
        icons: a.battery.icons,
      },
      activity: {
        left: SPEC.screen!.activity.pos[0] * W,
        top: SPEC.screen!.activity.pos[1] * H,
        size: SPEC.screen!.activity.size * H,
        itemSpacing: SPEC.screen!.activity.itemSpacing * W,
      },
    },

    system: {
      cover: boxOf(SPEC.system!.cover, W, H, fonts, natCover),
      carouselVideo: boxOf(SPEC.system!.carouselVideo, W, H, fonts, natCover),
      carousel,
      systemName: {
        left: a.systemName.pos[0] * W,
        top: a.systemName.pos[1] * H,
        width: SPEC.system!.systemName.size[0] * W,
        font: font.h1,
      },
      systemInfo: {
        left: a.systemInfo.pos[0] * W,
        top: a.systemInfo.pos[1] * H,
        width: SPEC.system!.systemInfo.size[0] * W,
        font: font.body,
      },
    },

    gamelist: {
      coverList: boxOf(SPEC.gamelistCommon!.coverList, W, H, fonts, natCover),
      logoText: {
        left: SPEC.listHeader!.logoText.pos[0] * W,
        top: SPEC.listHeader!.logoText.pos[1] * H,
        width: SPEC.listHeader!.logoText.size[0] * W,
        font: font.h2,
      },
    },

    detailed: {
      list: listBox,
      md_image: boxOf(detailed.md_image, W, H, fonts),
      md_marquee: boxOf(detailed.md_marquee, W, H, fonts),
      md_rating: {
        left: a.md_rating.pos[0] * W,
        top: a.md_rating.pos[1] * H,
        size: a.md_rating.size * H,
      },
      md_description:
        a.detailed && a.detailed.md_description
          ? { ...boxOf(a.detailed.md_description, W, H, fonts), font: font.caption }
          : null,
    },

    video: {
      md_marquee: boxOf(SPEC.video!.md_marquee, W, H, fonts),
      md_image: boxOf(SPEC.video!.md_image, W, H, fonts, natCover),
      logoText: {
        left: SPEC.video!.logoText.pos[0] * W,
        top: SPEC.video!.logoText.pos[1] * H,
        width: SPEC.listHeader!.logoText.size[0] * W,
        font: font.h2,
      },
      list: {
        left: 0,
        top: SPEC.video!.gamelist.pos[1] * H,
        width: SPEC.video!.gamelist.size[0] * W,
        height: SPEC.video!.gamelist.size[1] * H,
        hMargin: SPEC.listHeader!.gamelist.hMargin * W,
        row: videoRow,
      },
      delay: SPEC.video!.md_video.delay,
    },

    grid: {
      ...gridMetrics(gridNode, W, H, a.grid),
      logoText: {
        left: SPEC.grid!.logoText.pos[0] * W,
        top: SPEC.grid!.logoText.pos[1] * H,
        width: SPEC.grid!.logoText.size[0] * W,
        font: font.h2,
      },
      md_name: {
        left: SPEC.grid!.md_name.pos[0] * W,
        top: SPEC.grid!.md_name.pos[1] * H,
        width: SPEC.grid!.md_name.size[0] * W,
        font: font.body,
      },
      tilePadding: a.grid.tilePadding,
      round: a.grid.round,
      roundSelected: a.grid.roundSelected,
      selectorRadius: a.grid.selectorRadius,
      caption: {
        width: a.grid.caption.size[0],
        height: a.grid.caption.size[1],
        padding: a.grid.caption.padding[0],
        lineSpacing: a.grid.caption.lineSpacing,
        font: font.caption,
      },
    },

    menu: (() => {
      const pw = MENU.panel.width * W
      return {
        width: pw,
        maxHeight: MENU.panel.maxHeight * H,
        left: (W - pw) / 2,
        padding: MENU.padding * pw,
        // The panel artwork is a 72px square with a ~15px corner, so the radius tracks that
        // ratio against the device height.
        radius: (15 / 480) * H,
        titleHeight: MENU.title.height * font[MENU.title.font]!,
        titleFont: font[MENU.title.font],
        rowHeight: MENU.row.height * font[MENU.row.font]!,
        rowFont: font[MENU.row.font],
        groupHeight: MENU.group.height * font[MENU.group.font]!,
        groupFont: font[MENU.group.font],
        footerHeight: MENU.footer.height * font[MENU.footer.font]!,
        footerFont: font[MENU.footer.font],
        smallFont: font.caption,
        icon: MENU.icon * font[MENU.row.font]!,
      }
    })(),

    basic: {
      list: {
        left: 0,
        top: SPEC.listHeader!.gamelist.pos[1] * H,
        width: SPEC.basic!.gamelist.size[0] * W,
        height: SPEC.basic!.gamelist.size[1] * H,
        hMargin: SPEC.listHeader!.gamelist.hMargin * W,
        row: listRow,
      },
    },

    elementflix: {
      ...flixMetrics,
      direction: flixDir,
      selectedZoom: SPEC.elementflix!.gamegrid.selectedZoom,
      tilePadding: a.flix.tilePadding,
      selectorRadius: a.flix.selectorRadius,
      md_marquee: boxOf(SPEC.elementflix!.md_marquee, W, H, fonts),
      md_image: boxOf(SPEC.elementflix!.md_image, W, H, fonts, natCover),
      md_description: {
        ...boxOf(SPEC.elementflix!.md_description, W, H, fonts),
        font: font.caption,
        lineSpacing: SPEC.elementflix!.md_description.lineSpacing,
      },
      logoText: {
        left: SPEC.elementflix!.logoText.pos[0] * W,
        top: SPEC.elementflix!.logoText.pos[1] * H,
        width: SPEC.listHeader!.logoText.size[0] * W,
        font: font.h3,
      },
      caption: {
        top: SPEC.elementflix!.caption.pos[1],
        height: SPEC.elementflix!.caption.size[1],
        lineSpacing: SPEC.elementflix!.caption.lineSpacing,
        font: font.caption,
      },
      fade: (() => {
        const f = flixVar.fade
        const fw = f.size[0] * W
        const fh = f.size[1] * H
        return {
          asset: f.asset,
          width: fw,
          height: fh,
          a: [f.a[0] * W - f.aOrigin[0] * fw, f.a[1] * H - f.aOrigin[1] * fh],
          b: [f.b[0] * W - f.bOrigin[0] * fw, f.b[1] * H - f.bOrigin[1] * fh],
        }
      })(),
    },

    boxes: {
      ...gridMetrics(boxesNode, W, H, a.boxes),
      selectedZoom: SPEC.boxes!.gamegrid.selectedZoom,
      round: a.boxes.round,
      roundSelected: a.boxes.roundSelected,
      tilePadding: a.grid.tilePadding,
      marquee: SPEC.boxes!.marquee,
      caption: {
        top: SPEC.boxes!.caption.pos[1],
        height: SPEC.boxes!.caption.size[1],
        lineSpacing: SPEC.boxes!.caption.lineSpacing,
        font: font.caption,
      },
    },
  }
}

/** Absolute style for a resolved ES box. */
export function placeEs(box: EsBox & { font?: number }): Record<string, string | number> {
  const style: Record<string, string | number> = {
    position: 'absolute',
    left: `${box.left}px`,
    top: `${box.top}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
  }
  if (box.font != null) style.fontSize = `${box.font}px`
  if (box.radius) style.borderRadius = `${box.radius}px`
  if (box.z != null) style.zIndex = box.z
  return style
}

/**
 * Place a `maxSize` (contain) image the way ES does.
 *
 * ES scales the image down to fit and then **shrinks the element to the fitted size**, so the
 * anchor and any rounded corners act on the image's own edges. Sizing a fixed box and leaning on
 * `object-fit: contain` letterboxes instead, which puts the rounded corners on the empty box
 * rather than on the artwork.
 */
export function placeContain(box: EsBox): Record<string, string | number> {
  const style: Record<string, string | number> = {
    position: 'absolute',
    left: `${box.posX}px`,
    top: `${box.posY}px`,
    maxWidth: `${box.width}px`,
    maxHeight: `${box.height}px`,
    width: 'auto',
    height: 'auto',
    transform: `translate(${-box.originX * 100}%, ${-box.originY * 100}%)`,
  }
  if (box.radius) style.borderRadius = `${box.radius}px`
  if (box.z != null) style.zIndex = box.z
  return style
}
