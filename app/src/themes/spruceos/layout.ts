import { fontSize, type Panel } from './panel'
import { lineHeight } from './text'

/**
 * Every view's geometry for one panel, resolved to device pixels from PyUI's own arithmetic
 * (`views/*.py`, `views/view_creator.py`) and the theme's image sizes. PyUI mixes integer and float
 * division freely - `icon_width` is a float, `row_spacing // 2` floors a float - and the results
 * land on screen, so the arithmetic is kept as written rather than tidied.
 */

const int = Math.trunc
/** Python's `//` on floats, which floors. */
const fdiv = (a: number, b: number) => Math.floor(a / b)

export type Size = readonly [number, number]

/** `_calculate_scaled_width_and_height` with FIT (`display/display.py:481-506`). */
export function fit(orig: Size, tw: number | null, th: number | null): Size {
  const scale = tw && th ? Math.min(tw / orig[0], th / orig[1]) : tw ? tw / orig[0] : th ? th / orig[1] : 1
  return [int(orig[0] * scale), int(orig[1] * scale)]
}

export interface Box {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

/** `_render_surface_texture`'s anchor: `x - w // 2` and the like, then truncated (`display.py:563-574`). */
export function anchor(x: number, y: number, size: Size, mode: string): Box {
  const [w, h] = size
  const [ym, xm] = mode.split('_') as [string, string]
  const ax = xm === 'CENTER' ? x - fdiv(w, 2) : xm === 'RIGHT' ? x - w : x
  const ay = ym === 'MIDDLE' ? y - fdiv(h, 2) : ym === 'BOTTOM' ? y - h : y
  return { x: int(ax), y: int(ay), w, h }
}

export interface GridGeometry {
  readonly cols: number
  readonly rows: number
  /** Each column's centre: `int(x_pad + col * icon_width) + icon_width // 2`. */
  readonly cellX: readonly number[]
  /** Each row's `bottom_row_y` and `cell_y`. */
  readonly bottomY: readonly number[]
  readonly cellY: readonly number[]
}

function grid(p: Panel, topH: number, usableH: number, cols: number, rows: number): GridGeometry {
  const iconWidth = (p.w - 20) / cols
  const spacing = usableH / rows
  const cellX = Array.from({ length: cols }, (_, c) => int(10 + c * iconWidth) + fdiv(iconWidth, 2))
  const bottomY = Array.from({ length: rows }, (_, r) => r * spacing + spacing + topH)
  return { cols, rows, cellX, bottomY, cellY: bottomY.map((b) => b - fdiv(spacing, 2)) }
}

export interface Geometry {
  readonly panel: Panel
  readonly w: number
  readonly h: number
  readonly m: number
  readonly topH: number
  readonly bottomH: number
  readonly usableH: number
  readonly font: { readonly list: number; readonly gridOne: number; readonly gridMulti: number }
  readonly recentsOnMain: boolean
  readonly main: GridGeometry & { readonly textBottom: number }
  readonly systems: GridGeometry & { readonly resized: number; readonly bg: Size }
  readonly gameGrid: GridGeometry & { readonly resized: number; readonly bg: Size }
  readonly carousel: { readonly cols: number; readonly primaryPercent: number }
  readonly gameList: {
    readonly lineH: number
    readonly rows: number
    readonly baseY: number
    readonly textPad: number
    readonly img: Size
    readonly imgX: number
    readonly imgY: number
    /** `get_img_x_starting`: the selection bar is cropped here, and the text clipped short of it. */
    readonly imgLeft: number
  }
  readonly textList: { readonly lineH: number; readonly rows: number; readonly baseY: number }
  readonly popup: {
    readonly x: number
    readonly y: number
    readonly lineH: number
    readonly rows: number
    readonly textX: number
  }
  readonly desc: {
    readonly offX: number
    readonly textOffY: number
    readonly fromIcon: number
    readonly firstY: number
  }
  /** A descriptive list's row size: `bg-list-l` if any row has an icon or description, else `bg-list-s`. */
  readonly descEntry: (rows: readonly DescRowShape[]) => {
    readonly large: boolean
    readonly size: Size
    readonly rows: number
  }
  readonly descRows: (rows: readonly DescRowShape[]) => number
  readonly switcher: { readonly img: Size; readonly stripY: number; readonly stripPad: number }
  readonly keyboard: { readonly keyW: number; readonly keyPitch: number }
  readonly index: { readonly x: number; readonly y: number }
  readonly topBar: { readonly center: number; readonly clockX: number; readonly right: number }
}

export interface DescRowShape {
  readonly icon?: string | undefined
  readonly description?: string | undefined
}

export function geometry(p: Panel): Geometry {
  const topH = p.size('skin/bg-title')[1]
  const bottomH = p.size('skin/tips-bar-bg')[1]
  const usableH = p.h - topH - bottomH
  const m = p.m
  const font = { list: fontSize(p, 'list'), gridOne: fontSize(p, 'gridOne'), gridMulti: fontSize(p, 'gridMulti') }
  const listLine = lineHeight(font.list) + 10

  const mainCols = p.config.mainMenuColCount ?? 4
  const main = { ...grid(p, topH, usableH, mainCols, 1), textBottom: int((p.h * 310) / 480) }

  // `gameSystemSelectColCount` and `RowCount` default to 4 and 2 stretched by the panel (`theme.py:1035-1040`).
  const sysResized = int(140 * m)
  const pad = int(20 * m)
  const sysBgTarget = int((sysResized + pad) * 1.05)
  const systems = {
    ...grid(p, topH, usableH, int(4 * p.widthMult), int(2 * p.heightMult)),
    resized: sysResized,
    bg: fit(p.size('skin/bg-game-item-f'), sysBgTarget, sysBgTarget),
  }

  // The game grid's cells and columns, the carousel's columns and the list's picture box all scale
  // the theme's 640x480 defaults: 140, 4, 3 and 320x300 (`theme.py`, read back from PyUI per panel).
  const gameResized = int(140 * m)
  const gameBgTarget = int((gameResized + pad) * 1.05)
  const gameGrid = {
    ...grid(p, topH, usableH, int(4 * p.widthMult), 2),
    resized: gameResized,
    bg: fit(p.size('skin/grid-game-selected'), gameBgTarget, gameBgTarget),
  }

  const img: Size = [int(320 * m), int(300 * m)]
  const imgX = p.w - 10 - fdiv(img[0], 2)
  const imgY = fdiv(p.h - topH + bottomH, 2) + topH - bottomH
  const listLineH = Math.max(listLine, p.size('skin/bg-list-s')[1])

  const popupLine = Math.max(listLine, p.size('skin/bg-list-s2')[1])

  const offX = int(10 * m)
  const descEntry = (rows: readonly DescRowShape[]) => {
    const large = rows.some((r) => r.icon !== undefined || r.description !== undefined)
    const size = p.size(large ? 'skin/bg-list-l' : 'skin/bg-list-s')
    const usable = usableH / size[1]
    return { large, size, rows: int(usable + (usable % 1 >= 0.8 ? 1 : 0)) }
  }

  return {
    panel: p,
    w: p.w,
    h: p.h,
    m,
    topH,
    bottomH,
    usableH,
    font,
    recentsOnMain: p.config.recentsEnabled,
    main,
    systems,
    gameGrid,
    carousel: { cols: int(3 * p.widthMult), primaryPercent: 50 },
    gameList: {
      lineH: listLineH,
      rows: fdiv(usableH, listLineH),
      baseY: topH + 5,
      textPad: int((30 * p.h) / 480),
      img,
      imgX,
      imgY,
      imgLeft: imgX - fdiv(img[0], 2),
    },
    textList: { lineH: listLineH, rows: fdiv(usableH, listLineH), baseY: topH + 5 },
    popup: {
      x: 0,
      y: topH,
      lineH: popupLine,
      rows: fdiv(p.size('skin/bg-pop-menu-4')[1], popupLine),
      textX: int(20 * m),
    },
    desc: { offX, textOffY: int(15 * m), fromIcon: int(10 * m), firstY: topH + 5 },
    descEntry,
    descRows: (rows) => descEntry(rows).rows,
    switcher: { img: [p.w, int(p.h * 0.75)], stripY: int(p.h - 10 * m), stripPad: 20 },
    keyboard: { keyW: fdiv(p.w, 16), keyPitch: fdiv(p.w, 13) },
    index: { x: p.w - 10, y: p.h - Math.max(5, fdiv(bottomH, 4)) },
    topBar: { center: fdiv(topH, 2), clockX: p.config.topBarInitialXOffset, right: p.w - 20 },
  }
}
