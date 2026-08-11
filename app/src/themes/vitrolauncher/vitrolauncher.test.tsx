import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'
import { gridMove, skipPage } from './views/AllTitles'
import { changeSetting, scrollTop } from './views/Settings'
import { cloudX, makeClouds } from './backgrounds/clouds'
import { makeMotes, moteTint } from './backgrounds/particles'
import { crest1, phases } from './backgrounds/waves'
import { carouselScroll, coverMetrics, gridDims, SETTINGS_WINDOW } from './layout'
import { COLORS, SETTINGS, defaults, formatPlaytime, sortedGames } from './library'
import { tokens } from './palette'
import { VitroLauncher } from '.'
import { SCREEN_ORDER } from './views/Chrome'
import { DeviceFrame } from '../../device/DeviceFrame'

const base = defaults()

describe('playtime', () => {
  it('reads the four ways the launcher phrases it', () => {
    expect(formatPlaytime(0)).toBe('')
    expect(formatPlaytime(30)).toBe('<1m')
    expect(formatPlaytime(45 * 60)).toBe('45m')
    expect(formatPlaytime(2 * 3600 + 15 * 60)).toBe('2h 15m')
    expect(formatPlaytime(3 * 3600)).toBe('3h') // an exact hour drops the minutes
    expect(formatPlaytime(12 * 3600 + 20 * 60)).toBe('12h') // and so does ten hours or more
  })
})

describe('the grid', () => {
  const total = 18

  it('moves within a page and turns at its edge', () => {
    const s = { ...base, all_icon_size: 'large' as const } // 5x2, so 10 per page
    expect(gridMove(0, 1, 0, total, s)).toBe(1)
    expect(gridMove(4, 1, 0, total, s)).toBe(10) // last column, same row, next page
    expect(gridMove(10, -1, 0, total, s)).toBe(4) // and back again
  })

  it('keeps the row when it turns a page', () => {
    // Landing on a corner instead would lose the reader's place vertically.
    const s = { ...base, all_icon_size: 'large' as const }
    expect(gridMove(9, 1, 0, total, s)).toBe(15) // row 1, col 4 -> next page row 1, col 0
  })

  it('stops at the ends with Infinite Scrolling off', () => {
    expect(gridMove(0, -1, 0, total, base)).toBe(0)
    expect(gridMove(0, 0, -1, total, base)).toBe(0)
  })

  it('wraps with Infinite Scrolling on', () => {
    // The setting was in the schema and had no implementation at all; the ends simply stopped.
    const s = { ...base, infinite: true }
    expect(gridMove(0, -1, 0, total, s)).not.toBe(0)
    expect(gridMove(0, 0, -1, total, s)).not.toBe(0)
  })

  it('never leaves the list', () => {
    const s = { ...base, all_icon_size: 'large' as const, infinite: true }
    for (const d of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      for (let i = 0; i < total; i++) {
        const next = gridMove(i, d[0]!, d[1]!, total, s)
        expect(next, `from ${i} by ${d}`).toBeGreaterThanOrEqual(0)
        expect(next).toBeLessThan(total)
      }
    }
  })

  it('skips a page and wraps, keeping its place within it', () => {
    const s = { ...base, all_icon_size: 'large' as const }
    expect(skipPage(3, total, s)).toBe(13)
    expect(skipPage(13, total, s)).toBe(3) // 18 games is two pages, so it comes back
  })

  it('sizes itself from the Icon Size setting', () => {
    expect(gridDims(base)).toEqual({ cols: 7, rows: 3, layout: 'small' })
    expect(gridDims({ ...base, all_icon_size: 'large' })).toEqual({
      cols: 5,
      rows: 2,
      layout: 'large',
    })
  })
})

describe('the carousel', () => {
  it('scales its covers by the Cover Size setting', () => {
    const small = coverMetrics({ ...base, cover_size: 'small' })
    const large = coverMetrics({ ...base, cover_size: 'large' })
    expect(small.h).toBeCloseTo(120, 5)
    expect(large.h).toBeCloseTo(192, 5)
    expect(large.w / large.h).toBeCloseTo(2 / 3, 5)
  })

  it('centres the focused tile using its focused width', () => {
    // Measured against where the tile will be once it has grown, not where it is.
    const m = coverMetrics(base)
    expect(carouselScroll(0, m, 640)).toBeCloseTo(320 - m.wf / 2, 5)
    expect(carouselScroll(1, m, 640)).toBeCloseTo(320 - (m.w + m.gap + m.wf / 2), 5)
  })
})

describe('the settings list', () => {
  it('only moves its window when the cursor would leave it', () => {
    expect(scrollTop(0, 0, SETTINGS.length)).toBe(0)
    expect(scrollTop(6, 0, SETTINGS.length)).toBe(0) // still the last visible row
    expect(scrollTop(7, 0, SETTINGS.length)).toBe(1)
    expect(scrollTop(3, 5, SETTINGS.length)).toBe(3) // scrolling back up pulls it with you
  })

  it('never scrolls past the end', () => {
    const top = scrollTop(SETTINGS.length - 1, 0, SETTINGS.length)
    expect(top + SETTINGS_WINDOW).toBeLessThanOrEqual(SETTINGS.length)
  })

  it('cycles a colour, wrapping both ways', () => {
    const def = SETTINGS[0]!
    expect(changeSetting({ ...base, color: 0 }, def, -1).color).toBe(COLORS.length - 1)
    expect(changeSetting({ ...base, color: COLORS.length - 1 }, def, 1).color).toBe(0)
  })

  it('clamps a percent instead of wrapping it', () => {
    const def = SETTINGS.find((d) => d.type === 'percent')!
    expect(changeSetting({ ...base, brightness: 100 }, def, 1).brightness).toBe(100)
    expect(changeSetting({ ...base, brightness: 0 }, def, -1).brightness).toBe(0)
    expect(changeSetting({ ...base, brightness: 50 }, def, 1).brightness).toBe(60)
  })

  it('flips a toggle and leaves an action alone', () => {
    const toggle = SETTINGS.find((d) => d.type === 'toggle')!
    expect(changeSetting(base, toggle, 1).tooltips).toBe(!base.tooltips)
    const action = SETTINGS.find((d) => d.type === 'action')!
    expect(changeSetting(base, action, 1)).toBe(base)
  })
})

describe('the palette', () => {
  it('flips the UI to dark-on-light for the one light scheme', () => {
    expect(tokens({ ...base, color: 10 }).uiLight).toBe(true)
    expect(tokens({ ...base, color: 9 }).uiLight).toBe(false)
  })

  it('lets the simple themes decide their own lightness', () => {
    // A light colour scheme does not make Simple Dark light, and vice versa.
    expect(tokens({ ...base, theme: 'simple-dark', color: 10 }).uiLight).toBe(false)
    expect(tokens({ ...base, theme: 'simple-light', color: 9 }).uiLight).toBe(true)
  })

  it('uses the accent as the selection border where white would vanish', () => {
    expect(tokens({ ...base, color: 9 }).highlight).toBe('#ffffff')
    expect(tokens({ ...base, theme: 'simple-dark' }).highlight).toBe(COLORS[9]!.accent)
  })
})

describe('sorting', () => {
  it('puts bookmarks first when asked, within the chosen order', () => {
    const list = sortedGames({ ...base, all_sort: 'az', all_bookmarks: 'first' })
    const firstUnmarked = list.findIndex((g) => !g.bookmarked)
    expect(list.slice(0, firstUnmarked).every((g) => g.bookmarked)).toBe(true)
  })

  it('sorts by playtime descending', () => {
    const list = sortedGames({ ...base, all_sort: 'playtime', all_bookmarks: 'sorted' })
    for (let i = 1; i < list.length; i++) {
      expect(list[i - 1]!.playSeconds).toBeGreaterThanOrEqual(list[i]!.playSeconds)
    }
  })
})

describe('the backgrounds', () => {
  it('drifts clouds from the clock, not from a frame counter', () => {
    // The original added `speed * 0.016` per frame, so drift tracked the refresh rate.
    const [cloud] = makeClouds()
    const a = cloudX(cloud!, 10)
    const b = cloudX(cloud!, 10)
    expect(a).toBe(b) // same time, same place, however many frames have passed
    expect(cloudX(cloud!, 0)).not.toBe(cloudX(cloud!, 20))
  })

  it('wraps a cloud rather than letting it run off forever', () => {
    const [cloud] = makeClouds()
    for (const t of [0, 50, 500, 5000]) {
      const x = cloudX(cloud!, t)
      expect(x).toBeGreaterThanOrEqual(-0.25)
      expect(x).toBeLessThan(1.25)
    }
  })

  it('seeds its dust deterministically', () => {
    // A `Math.random` field made every capture of this theme differ from the last.
    expect(makeMotes()).toEqual(makeMotes())
  })

  it('tints the dust towards the accent', () => {
    // Computed and then discarded with `void moteCol` in the original, so every scheme got white.
    expect(moteTint([1, 0, 0])).toEqual([1, 0.75, 0.75])
    expect(moteTint([1, 1, 1])).toEqual([1, 1, 1])
  })

  it('gives the wave fallback the same crests as the shader', () => {
    // The 2D path samples the same function, so only the glow and the soft edge are lost.
    const p = phases(3)
    expect(crest1(0, p)).toBeCloseTo(0.76 + 0.13 * Math.sin(p[0]) + 0.05 * Math.sin(-p[1]), 10)
  })

  it('advances every phase at its own rate', () => {
    const p = phases(1)
    expect(new Set(p).size).toBe(4)
  })
})

describe('the theme root', () => {
  it('isolates its stacking context', () => {
    // The background canvases sit under an opaque fill; without this a z-index can escape.
    const css = readFileSync(
      resolvePath(process.cwd(), 'src/themes/vitrolauncher/vitro.css'),
      'utf8',
    )
    const rule = css.slice(css.indexOf('.vitro {'), css.indexOf('}', css.indexOf('.vitro {')))
    expect(rule).toContain('isolation: isolate')
  })
})

describe('the transitions', () => {
  it('names every screen the launcher has', () => {
    // Three screens, and the four full-screen transitions that play over them.
    expect(SCREEN_ORDER).toEqual(['recent', 'all', 'settings'])
  })

  it('poses each overlay from a number rather than a running clock', () => {
    // A static screen sets these directly, which is how the exit banner has a capture at 62%.
    const { container } = render(
      <DeviceFrame device="rg35xx" animate={false} interactive={false}>
        <VitroLauncher screen="recent" powerOff={0.4} exitProgress={0.62} loading={0} />
      </DeviceFrame>,
    )
    const root = container.querySelector<HTMLElement>('.vitro')!
    expect(root.querySelector<HTMLElement>('.poweroff-black')!.style.opacity).toBe('0.4')
    expect(root.querySelector<HTMLElement>('.exit-bar-fill')!.style.width).toBe('62%')
    expect(root.querySelector('.exit-banner.show')).not.toBeNull()
  })

  it('hides the exit banner entirely when it is not posed', () => {
    const { container } = render(
      <DeviceFrame device="rg35xx" animate={false} interactive={false}>
        <VitroLauncher screen="recent" />
      </DeviceFrame>,
    )
    expect(container.querySelector('.exit-banner')).toBeNull()
  })

  it('does not start the boot fade on a static screen', () => {
    // Motion off means one settled frame; a screen caught mid-fade would not be a snapshot.
    const { container } = render(
      <DeviceFrame device="rg35xx" animate={false} interactive={false}>
        <VitroLauncher screen="recent" settings={{ startup_fade: true }} />
      </DeviceFrame>,
    )
    expect(container.querySelector('.vitro')!.className).not.toContain('booting')
  })
})

describe('the nav pill', () => {
  it('switches screens when a slot is clicked on the live build', async () => {
    // Mockup chrome: a handheld has no pointer, but the pill reads as a tab bar on a desktop.
    const { container } = render(
      <DeviceFrame device="rg35xx">
        <VitroLauncher screen="recent" />
      </DeviceFrame>,
    )
    const root = container.querySelector<HTMLElement>('.vitro')!
    expect(root.dataset.screen).toBe('recent')

    fireEvent.click(screen.getByRole('button', { name: 'All Titles' }))
    expect(root.dataset.screen).toBe('all')

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    expect(root.dataset.screen).toBe('settings')
  })

  it('has no controls at all on a static screen', () => {
    const { container } = render(
      <DeviceFrame device="rg35xx" animate={false} interactive={false}>
        <VitroLauncher screen="recent" />
      </DeviceFrame>,
    )
    expect(container.querySelectorAll('.nav-slot button')).toHaveLength(0)
    expect(container.querySelector('.nav-slot')!.tagName).toBe('DIV')
  })

  it('stops taking clicks once it has faded', () => {
    // Opacity alone would leave an invisible tab bar swallowing pointer events.
    const css = readFileSync(resolvePath(process.cwd(), 'src/themes/vitrolauncher/vitro.css'), 'utf8')
    expect(css).toMatch(/\.nav-pill\.hidden\s*\{\s*pointer-events:\s*none/)
  })
})
