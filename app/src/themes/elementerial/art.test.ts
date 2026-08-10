import { describe, expect, it } from 'vitest'
import golden from './__fixtures__/art.golden.json'
import { marquee, screenshot, starFilled } from './art'
import { GAMES, describe as describeGame, gamesFor, systemByTheme, SYSTEMS } from './library'

describe('generated art, against the original', () => {
  // The seeding is a character sum plus a linear congruential step. Comparing the emitted SVG
  // proves it was reproduced, where "some deterministic art" would not - the shapes are what
  // the reference screenshots show.
  for (const [key, expected] of Object.entries(golden)) {
    it(key, () => {
      const [theme, name] = key.split('|')
      const game = GAMES[theme!]!.find((g) => g.name === name)!
      const withSystem = { ...game, system: theme! }

      expect(screenshot(withSystem, '#ED5353', '#ff8c82')).toBe(expected.screenshot)
      expect(marquee(withSystem)).toBe(expected.marquee)
    })
  }
})

describe('generated art', () => {
  const game = GAMES.snes![0]!

  it('re-tints with the scheme', () => {
    const strawberry = screenshot(game, '#ED5353', '#ff8c82')
    const lime = screenshot(game, '#68B723', '#d1ff82')

    expect(strawberry).not.toBe(lime)
    expect(decodeURIComponent(lime)).toContain('#68B723')
  })

  it('is stable for the same game and scheme', () => {
    expect(screenshot(game, '#ED5353', '#ff8c82')).toBe(screenshot(game, '#ED5353', '#ff8c82'))
  })

  it('differs between games', () => {
    expect(screenshot(GAMES.snes![0]!, '#000', '#fff')).not.toBe(
      screenshot(GAMES.snes![1]!, '#000', '#fff'),
    )
  })

  it('escapes a title rather than emitting raw markup', () => {
    const svg = decodeURIComponent(marquee({ ...game, name: 'A & <B>' }))
    expect(svg).toContain('&amp;')
    expect(svg).not.toContain('<B>')
  })

  it('wraps a long marquee to at most two lines', () => {
    const svg = decodeURIComponent(
      marquee({ ...game, name: 'The Legend of Zelda: A Link to the Past' }),
    )
    expect(svg.match(/<text/g)).toHaveLength(2)
  })
})

describe('starFilled', () => {
  it('fills the right number of stars', () => {
    expect([0, 1, 2, 3, 4].map((i) => starFilled(0.6, i))).toEqual([true, true, true, false, false])
    expect([0, 1, 2, 3, 4].map((i) => starFilled(1, i))).toEqual([true, true, true, true, true])
    expect([0, 1, 2, 3, 4].map((i) => starFilled(0, i))).toEqual([false, false, false, false, false])
  })

  it('does not lose a star to floating point at exactly 0.8', () => {
    // 0.8 >= 4/5 is false in binary floating point without the epsilon, which visibly drops the
    // fourth star on a very common rating.
    expect(starFilled(0.8, 3)).toBe(true)
  })
})

describe('library', () => {
  it('has a games list for every system it advertises', () => {
    for (const system of SYSTEMS) {
      expect(gamesFor(system.theme).length, system.theme).toBeGreaterThan(0)
    }
  })

  it('falls back rather than returning nothing for an unknown system', () => {
    expect(gamesFor('not-a-system')).toBe(GAMES.snes)
    expect(systemByTheme('not-a-system')).toBe(SYSTEMS[0])
  })

  it('describes a game from its own metadata when it has no description', () => {
    // Every description slot has to be populated; inventing prose would be worse than showing
    // what was scraped.
    const plain = GAMES.snes!.find((g) => !g.desc && g.genre)!
    const text = describeGame(plain)

    expect(text).toContain(plain.genre)
    expect(text).toContain(plain.developer)
  })

  it('prefers a written description where one exists', () => {
    const written = GAMES.gba![0]!
    expect(describeGame(written)).toBe(written.desc)
  })

  it('carries the entries the views depend on', () => {
    // The grid views need a folder and a no-art entry to exercise their placeholder paths.
    expect(GAMES.snes!.some((g) => g.folder)).toBe(true)
    expect(GAMES.snes!.some((g) => g.noArt)).toBe(true)
    expect(GAMES.snes!.some((g) => g.favorite)).toBe(true)
  })

  it('gives every game in the description-showing systems a description', () => {
    // The 1:1 detailed view and Elementflix always show the slot, and their snapshots use these.
    for (const theme of ['gba', 'psx']) {
      for (const game of GAMES[theme]!) {
        expect(game.desc, `${theme}/${game.name}`).toBeTruthy()
      }
    }
  })
})
