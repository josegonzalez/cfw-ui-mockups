import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GeneratedArt, gradientArt, hashString, paletteFor, svgDataUri } from '.'

describe('svgDataUri', () => {
  it('encodes markup safely into a URI', () => {
    const uri = svgDataUri('<svg><rect fill="#fff"/></svg>')
    expect(uri.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true)
    expect(uri).not.toContain('<')
    expect(decodeURIComponent(uri.split(',')[1]!)).toBe('<svg><rect fill="#fff"/></svg>')
  })
})

describe('hashString', () => {
  it('is deterministic', () => {
    // The whole placeholder-art scheme depends on this. A random source would make every
    // screenshot baseline fail on the next run.
    expect(hashString('Chrono Drifter')).toBe(hashString('Chrono Drifter'))
  })

  it('separates similar titles', () => {
    expect(hashString('Star Relay')).not.toBe(hashString('Star Relax'))
  })

  it('stays a non-negative 32-bit value', () => {
    for (const title of ['', 'a', 'Neon Samurai', '— unicode é']) {
      const h = hashString(title)
      expect(h).toBeGreaterThanOrEqual(0)
      expect(h).toBeLessThan(2 ** 32)
      expect(Number.isInteger(h)).toBe(true)
    }
  })
})

describe('paletteFor', () => {
  const palette = [
    ['#7b5cff', '#31d0ff'],
    ['#ff6b6b', '#ffb03a'],
    ['#3ad29f', '#4cc9f0'],
  ] as const

  it('picks the same pair for the same title', () => {
    expect(paletteFor('Moon Circuit', palette)).toEqual(paletteFor('Moon Circuit', palette))
  })

  it('only ever returns a pair from the palette', () => {
    for (const title of ['a', 'b', 'c', 'd', 'e', 'f']) {
      expect(palette).toContainEqual(paletteFor(title, palette))
    }
  })

  it('falls back rather than throwing on an empty palette', () => {
    expect(paletteFor('anything', [])).toHaveLength(2)
  })
})

describe('gradientArt', () => {
  it('produces a decodable svg carrying both stops', () => {
    const svg = decodeURIComponent(
      gradientArt({ width: 160, height: 160, from: '#7b5cff', to: '#31d0ff' }).split(',')[1]!,
    )

    expect(svg).toContain('width="160"')
    expect(svg).toContain('stop-color="#7b5cff"')
    expect(svg).toContain('stop-color="#31d0ff"')
  })

  it('escapes a label rather than emitting raw markup', () => {
    const svg = decodeURIComponent(
      gradientArt({ width: 10, height: 10, from: '#000', to: '#fff', label: 'A & <B>' }).split(',')[1]!,
    )

    expect(svg).toContain('A &amp; &lt;B&gt;')
    expect(svg).not.toContain('<B>')
  })

  it('is deterministic for identical options', () => {
    const opts = { width: 32, height: 32, from: '#111', to: '#222' }
    expect(gradientArt(opts)).toBe(gradientArt(opts))
  })
})

describe('GeneratedArt', () => {
  it('renders into its resolved box', () => {
    render(
      <GeneratedArt
        box={{ left: 12, top: 34, width: 160, height: 160 }}
        src={gradientArt({ width: 160, height: 160, from: '#000', to: '#fff' })}
        alt="Chrono Drifter cover"
        radius={8}
      />,
    )

    const img = screen.getByAltText('Chrono Drifter cover')
    expect(img).toHaveStyle({ left: '12px', top: '34px', width: '160px', borderRadius: '8px' })
  })

  it('does not smooth pixel art when asked not to', () => {
    render(
      <GeneratedArt
        box={{ left: 0, top: 0, width: 16, height: 16 }}
        src={gradientArt({ width: 16, height: 16, from: '#000', to: '#fff' })}
        alt="tile"
        pixelated
      />,
    )

    expect(screen.getByAltText('tile')).toHaveStyle({ imageRendering: 'pixelated' })
  })
})
