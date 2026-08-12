import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'
import { render } from '@testing-library/react'
import { DeviceFrame } from '../../../device/DeviceFrame'
import { PlayStationX } from '..'
import { applyChromeAction, DEFAULT_SUBSETS, VIEWS } from '../Interactive'
import { boxOf, textLine } from './Chrome'
import { resolve } from '../layout'
import { PSX_SCREENS } from '../manifest'

const STATE = {
  carousel: 'medium',
  'carousel-type': 'PS4',
  'top-info': 'default',
  view: 'gamelist',
} as const

const L = resolve('rg35xx', STATE)

/**
 * Every one of these is a fault the visual pass found and no numeric check did. They are
 * regression tests in the strict sense: each asserts the thing that was wrong on screen.
 */
describe('text placement', () => {
  it('leaves an unsized element on its top edge', () => {
    // No authored height is not the same as a height authored ~0, and conflating the two lifts
    // the element by half a line. `systemFolder` authors no size.
    const node = resolve('rg35xx', { ...STATE, view: 'system' }).system.systemFolder
    expect(node.h).toBeUndefined()

    const style = textLine(node)
    expect(style.top).toBe(`${node.top}px`)
    expect(style.height).toBeUndefined()
  })

  it('centres a line on its y when the box is authored ~0 tall', () => {
    // `system_name` is authored `size 0.6 0.001`, which is 0.48px tall on a 480px panel.
    const node = resolve('rg35xx', { ...STATE, view: 'system' }).system.systemName
    expect(node.h).toBeLessThan(1)

    const style = textLine(node)
    const lineHeight = Math.ceil(node.font! * 1.25)

    expect(style.height).toBe(`${lineHeight}px`)
    expect(style.top).toBe(`${node.top - lineHeight / 2}px`)
  })

  it('keeps a real box and centres inside it', () => {
    const node = L.topInfo.username
    expect(node.h).toBeGreaterThan(node.font! * 0.625)

    const style = textLine(node)

    expect(style.height).toBe(`${node.h}px`)
    expect(style.top).toBe(`${node.top}px`)
    expect(style.alignItems).toBe('center')
  })

  it('carries the z-index through boxOf', () => {
    // Re-applying z by hand at each call site is a rule that only has to be missed once, and
    // was - the icon row had no z-index at all and painted under the z-45 background.
    expect(boxOf(L.ps4Style.gamedata).z).toBe(L.ps4Style.gamedata.z)
    expect(boxOf(L.ps4Style.iconos).z).toBe(L.ps4Style.iconos.z)
  })
})

describe('grid geometry', () => {
  it('insets a tile inside its cell rather than the grid inside its box', () => {
    const gg = L.ps4Style.gamegrid
    const tiles = renderView('ps4Style').querySelectorAll<HTMLElement>('.psx-tile')
    expect(tiles.length).toBeGreaterThan(0)

    // The source: left = i * cellW + padX, width = cellW - padX * 2.
    expect(tiles[0]!.style.width).toBe(`${gg.cellW - gg.padX * 2}px`)
    expect(tiles[0]!.style.height).toBe(`${gg.cellH - gg.padY * 2}px`)
  })

  it('leaves room under the strip for the Start pill', () => {
    // A full-cell tile runs to the grid box's bottom at 228 and buries the pill. Inset, it stops
    // on the pill's top edge - the theme authors the two flush, to within half a pixel.
    const gg = L.ps4Style.gamegrid
    const tileBottom = gg.top + gg.padY + (gg.cellH - gg.padY * 2)

    expect(tileBottom).toBeLessThan(L.ps4Style.start.top + 1)
    expect(gg.top + gg.h).toBeGreaterThan(L.ps4Style.start.top)
  })

  it('gives the animated grid wrapper the grid’s own z', () => {
    // A transformed element is a stacking context, so a wrapper left at `auto` re-bases the
    // whole grid to 0 and the z-45 background paints over every tile.
    const tile = renderView('ps4Style').querySelector<HTMLElement>('.psx-tile')!
    const wrapper = tile.closest<HTMLElement>('.px-anim')

    expect(wrapper).not.toBeNull()
    expect(wrapper!.style.zIndex).toBe(String(L.ps4Style.gamegrid.z))
  })
})

describe('view composition', () => {
  it('draws only the metadata nodes a view declares', () => {
    // `detailed` declares no `iconos`. Drawing one anyway put the flags where the stars belong.
    expect(L.detailed.iconos).toBeUndefined()

    const detailed = renderView('detailed')
    expect(detailed.querySelector('[data-widget="IconRow"]')).toBeNull()
    expect(detailed.querySelector('.psx-stars')).not.toBeNull()
  })

  it('draws the icon row where the view does declare one', () => {
    expect(L.ps4Style.iconos).toBeDefined()
    expect(renderView('ps4Style').querySelector('[data-widget="IconRow"]')).not.toBeNull()
  })

  it('gives every gamelist view its side media', () => {
    // Each of grid, carousel and fullGrid lost its featured image by not calling SideMedia.
    for (const view of ['grid', 'carousel', 'fullGrid', 'ps4Style', 'single'] as const) {
      const node = L[view].featured ?? L[view].image
      expect(node, `${view} declares a featured slot`).toBeDefined()
      expect(
        renderView(view).querySelector(`img[style*="${node!.left}px"]`),
        `${view} draws it`,
      ).not.toBeNull()
    }
  })

  it('renders the system name the original defined and never drew', () => {
    expect(L.fullGrid.systemName).toBeDefined()
    expect(renderView('fullGrid').textContent).toContain('Sony PlayStation')
  })

  it('draws one marquee in the single view, not two', () => {
    // `buildSingle` built a second marquee img that overwrote the first, orphaning it with no
    // src, so it drew as an empty bordered box.
    const node = L.single.marquee!
    const found = renderView('single').querySelectorAll(`img[style*="top: ${node.top}px"]`)

    expect(found.length).toBe(1)
  })
})

describe('the media tester', () => {
  it('draws a placeholder for an unscraped slot rather than an empty frame', () => {
    const imgs = [...renderView('mediaTester').querySelectorAll('img')]
    const placeholders = imgs.filter((i) => i.getAttribute('src')?.includes('no-image-default'))

    // VIDEO, BOXBACK and CARTRIDGE have no stand-in art.
    expect(placeholders.length).toBe(3)
  })
})

describe('the hint bar', () => {
  it('stops before the battery', () => {
    const help = renderView('ps4Style').querySelector<HTMLElement>('.psx-help')!
    const width = Number.parseFloat(help.style.width)

    expect(width).toBeGreaterThan(0)
    expect(L.help.left + width).toBeLessThanOrEqual(L.battery.left)
  })

  it('is not clipped to a zero height', () => {
    // `help` authors no size. Taking that as a literal box gives a zero-tall element, and
    // `overflow: hidden` on it hides the prompts completely - so it sizes to its content.
    const help = renderView('ps4Style').querySelector<HTMLElement>('.psx-help')!
    expect(help.style.height).toBe('')
  })

  it('sits on its authored top edge rather than half a line above it', () => {
    // The ~0-height rule centres a line on its y. An element with no authored height at all is
    // not that case, and applying it anyway lifts the whole prompt row by half a line.
    const help = renderView('ps4Style').querySelector<HTMLElement>('.psx-help')!
    expect(help.style.top).toBe(`${L.help.top}px`)
  })
})

describe('the subset keys', () => {
  it('cycles the view both ways', () => {
    const next = applyChromeAction(DEFAULT_SUBSETS, 'nextView')
    expect(next.view).toBe(VIEWS[VIEWS.indexOf(DEFAULT_SUBSETS.view) + 1])
    expect(applyChromeAction(next, 'prevView').view).toBe(DEFAULT_SUBSETS.view)
  })

  it('wraps rather than stopping at the ends', () => {
    let subsets = DEFAULT_SUBSETS
    for (let i = 0; i < VIEWS.length; i++) subsets = applyChromeAction(subsets, 'nextView')
    expect(subsets.view).toBe(DEFAULT_SUBSETS.view)
  })

  it('toggles animations', () => {
    expect(applyChromeAction(DEFAULT_SUBSETS, 'toggleAnimations').animate).toBe(false)
  })

  it('ignores a key it does not own', () => {
    expect(applyChromeAction(DEFAULT_SUBSETS, 'nonsense')).toBe(DEFAULT_SUBSETS)
  })
})

describe('the manifest', () => {
  it('covers every view exactly once', () => {
    expect(PSX_SCREENS.map((s) => s.view).sort()).toEqual([...VIEWS].sort())
  })

  it('uses the theme’s own view names, hyphenated', () => {
    const expected = [
      'boot-splash', 'carousel', 'detailed', 'full-grid', 'game-launch', 'grid',
      'media-tester', 'ps4-style', 'ps5-style', 'single', 'system',
    ]
    expect(PSX_SCREENS.map((s) => s.slug).sort()).toEqual(expected)
  })
})

describe('the theme root', () => {
  it('isolates its stacking context', () => {
    // Same fault Elementerial had: without this, a negative-z layer escapes the root and paints
    // behind its own background fill. jsdom applies no stylesheet, so this reads the file.
    // From disk rather than an import: the test environment resolves a CSS import to an empty
    // module, so importing it would assert against nothing and always pass.
    const css = readFileSync(
      resolvePath(process.cwd(), 'src/themes/playstation-x/playstation-x.css'),
      'utf8',
    )
    expect(css).toMatch(/\.psx\s*\{[^}]*isolation:\s*isolate/)
  })

  it('renders every view without throwing', () => {
    for (const screen of PSX_SCREENS) {
      expect(() => renderView(screen.view), screen.slug).not.toThrow()
    }
  })
})

/** Render a static screen and hand back its theme root. */
function renderView(view: (typeof VIEWS)[number]): HTMLElement {
  const { container } = render(
    <DeviceFrame device="rg35xx" animate={false} interactive={false}>
      <PlayStationX view={view} />
    </DeviceFrame>,
  )
  return container.querySelector<HTMLElement>('.psx')!
}

describe('the scale origin', () => {
  it('comes from the authored origin rather than a stylesheet rule', () => {
    // A renderer with no cascade cannot read a CSS class. The value has to be data.
    const marco = renderView('ps4Style').querySelector<HTMLElement>('.psx-marco')!
    const origin = L.ps4Style.marcoActivo.origin!

    expect(marco.style.transformOrigin).toBe(`${origin[0] * 100}% ${origin[1] * 100}%`)

    const css = readFileSync(
      resolvePath(process.cwd(), 'src/themes/playstation-x/playstation-x.css'),
      'utf8',
    )
    const rule = css.slice(css.indexOf('.psx-marco {'), css.indexOf('}', css.indexOf('.psx-marco {')))
    expect(rule).not.toContain('transform-origin')
  })

  it('resolves to the frame’s top-left corner on every device and subset', () => {
    // The bump grows out of the corner rather than pulsing about the centre.
    for (const device of ['rg35xx', 'rg34xx', 'rg552', 'trimui-smart-pro'] as const) {
      for (const type of ['PS5', 'PS4', 'PS3'] as const) {
        const resolved = resolve(device, { ...STATE, 'carousel-type': type })
        expect(resolved.ps4Style.marcoActivo.origin, `${device}/${type}`).toEqual([0, 0])
      }
    }
  })
})
