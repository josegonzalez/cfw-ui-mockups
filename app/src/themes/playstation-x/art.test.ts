import { describe, expect, it } from 'vitest'
import { boxart, fanart, marquee } from './art'
import { GAMES } from './library'
import golden from './__fixtures__/art.golden.json'

/**
 * The generated artwork against the original's own output.
 *
 * String-built SVG is exactly where a transposed coefficient produces a picture that looks
 * plausible and is not the same picture, so every game is compared rather than a sample.
 */
describe('artwork against the original', () => {
  for (const game of GAMES) {
    it(`draws ${game.name} identically`, () => {
      const expected = (golden as Record<string, Record<string, string>>)[game.name]!
      expect(fanart(game, 320, 180)).toBe(expected.fanart)
      expect(boxart(game, 160, 220)).toBe(expected.boxart)
      expect(marquee(game, 240, 80)).toBe(expected.marquee)
    })
  }
})

describe('artwork behaviour', () => {
  it('gives a game with no palette the neutral fallback rather than failing', () => {
    const unknown = { ...GAMES[0]!, art: 'not-a-real-key' }
    expect(() => fanart(unknown, 100, 100)).not.toThrow()
    expect(fanart(unknown, 100, 100)).toContain(encodeURIComponent('#1e2430'))
  })

  it('escapes a title before embedding it, so an ampersand cannot break the markup', () => {
    const tricky = { ...GAMES[0]!, name: 'Rock & Roll <b>' }
    const svg = decodeURIComponent(fanart(tricky, 200, 100))

    expect(svg).toContain('Rock &amp; Roll &lt;b>')
    expect(svg).not.toContain('<b>')
  })

  it('scales with the box it is asked for rather than assuming one size', () => {
    const game = GAMES[0]!
    expect(fanart(game, 320, 180)).not.toBe(fanart(game, 640, 360))
    expect(decodeURIComponent(fanart(game, 640, 360))).toContain('width="640"')
  })
})
