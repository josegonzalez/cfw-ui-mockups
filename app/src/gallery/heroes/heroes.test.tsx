import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Landing } from '../Landing'
import { HeroSwitcher } from './HeroSwitcher'
import { useHeroVariant } from './useHeroVariant'
import { HERO_LABEL, HERO_VARIANTS, isHeroVariant } from './types'
import { HERO } from './content'

function setUrl(search: string) {
  globalThis.history.replaceState(null, '', `/${search}`)
}

/**
 * An in-memory `Storage`, installed for the duration of these tests.
 *
 * jsdom's own `localStorage` is unreachable here: recent Node versions define an experimental
 * `localStorage` global that is inert without a backing file, and under jsdom `window` *is* the
 * global, so it shadows the document's. The implementation reads `window.localStorage`, which is
 * correct in a browser; this gives it something real to read in a test.
 */
function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
  } as Storage
}

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    value: memoryStorage(),
    configurable: true,
    writable: true,
  })
  setUrl('')
})

describe('isHeroVariant', () => {
  it('accepts the known treatments and nothing else', () => {
    for (const variant of HERO_VARIANTS) expect(isHeroVariant(variant)).toBe(true)
    expect(isHeroVariant('nope')).toBe(false)
    expect(isHeroVariant(null)).toBe(false)
  })
})

describe('useHeroVariant', () => {
  it('defaults to neon', () => {
    const { result } = renderHook(() => useHeroVariant())
    expect(result.current.variant).toBe('neon')
  })

  it('takes the variant from the URL', () => {
    setUrl('?hero=marquee')
    const { result } = renderHook(() => useHeroVariant())
    expect(result.current.variant).toBe('marquee')
  })

  it('falls back to the stored preference', () => {
    window.localStorage.setItem('cfw:hero', 'boot')
    const { result } = renderHook(() => useHeroVariant())
    expect(result.current.variant).toBe('boot')
  })

  it('lets the URL win over the stored preference, so a shared link shows what was sent', () => {
    window.localStorage.setItem('cfw:hero', 'boot')
    setUrl('?hero=device')

    const { result } = renderHook(() => useHeroVariant())
    expect(result.current.variant).toBe('device')
  })

  it('ignores an unknown value rather than rendering nothing', () => {
    setUrl('?hero=banana')
    const { result } = renderHook(() => useHeroVariant())
    expect(result.current.variant).toBe('neon')
  })

  it('remembers a change and reflects it in the URL', () => {
    const { result } = renderHook(() => useHeroVariant())

    act(() => result.current.setVariant('device'))

    expect(result.current.variant).toBe('device')
    expect(window.localStorage.getItem('cfw:hero')).toBe('device')
    expect(new URLSearchParams(globalThis.location.search).get('hero')).toBe('device')
  })

  it('cycles through every treatment and wraps', () => {
    const { result } = renderHook(() => useHeroVariant())

    for (const expected of [...HERO_VARIANTS.slice(1), HERO_VARIANTS[0]!]) {
      act(() => result.current.cycle())
      expect(result.current.variant).toBe(expected)
    }
  })

  it('cycles on H', () => {
    renderHook(() => useHeroVariant())

    act(() => {
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }))
    })

    expect(window.localStorage.getItem('cfw:hero')).toBe('boot')
  })

  it('leaves H alone while typing, and when it is part of a shortcut', () => {
    renderHook(() => useHeroVariant())

    const input = document.createElement('input')
    document.body.append(input)
    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', bubbles: true }))
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', metaKey: true }))
    })

    expect(window.localStorage.getItem('cfw:hero')).toBeNull()
    input.remove()
  })

  it('survives storage being unavailable', () => {
    // Private browsing contexts throw on write; losing the preference is not worth failing over.
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('denied')
      })

    const { result } = renderHook(() => useHeroVariant())
    expect(() => act(() => result.current.setVariant('boot'))).not.toThrow()
    expect(result.current.variant).toBe('boot')

    setItem.mockRestore()
  })
})

describe('HeroSwitcher', () => {
  it('offers every treatment and marks the current one', () => {
    render(<HeroSwitcher variant="boot" onChange={() => {}} />)

    for (const variant of HERO_VARIANTS) {
      expect(screen.getByRole('radio', { name: HERO_LABEL[variant] })).toBeInTheDocument()
    }
    expect(screen.getByRole('radio', { name: 'Boot log' })).toBeChecked()
  })

  it('reports a choice', async () => {
    const onChange = vi.fn()
    render(<HeroSwitcher variant="neon" onChange={onChange} />)

    await userEvent.click(screen.getByRole('radio', { name: 'Marquee' }))
    expect(onChange).toHaveBeenCalledWith('marquee')
  })
})

describe('hero treatments', () => {
  it('each renders exactly one page heading', () => {
    // Four treatments of one page: more than one h1 would be a second page heading, not a
    // second style.
    for (const variant of HERO_VARIANTS) {
      setUrl(`?hero=${variant}`)
      const view = render(<Landing />)

      expect(screen.getAllByRole('heading', { level: 1 }), variant).toHaveLength(1)
      view.unmount()
    }
  })

  it('each carries the shared headline, so switching compares design rather than copy', () => {
    for (const variant of HERO_VARIANTS) {
      setUrl(`?hero=${variant}`)
      const view = render(<Landing />)

      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading.textContent?.toLowerCase(), variant).toContain(HERO.headline.accent)
      view.unmount()
    }
  })

  it('marks which treatment is showing', () => {
    setUrl('?hero=marquee')
    const { container } = render(<Landing />)
    expect(container.querySelector('.gal')).toHaveAttribute('data-hero', 'marquee')
  })

  it('renders a real device frame in the device treatment, without capturing the keyboard', () => {
    // An interactive frame attaches a global key listener that swallows the arrow keys, which
    // would stop the page scrolling.
    setUrl('?hero=device')
    const { container } = render(<Landing />)

    expect(container.querySelector('.hero-device__stage .screen')).not.toBeNull()

    const before = globalThis.location.href
    act(() => {
      globalThis.document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })
    expect(globalThis.location.href).toBe(before)
  })

  it('builds the boot log from the catalogue rather than writing the numbers in', () => {
    setUrl('?hero=boot')
    render(<Landing />)

    // The counts in the log and the counts in the stat row are the same source.
    expect(screen.getByText('4 found')).toBeInTheDocument()
    expect(screen.getByText('24 views')).toBeInTheDocument()
  })
})
