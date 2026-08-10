import { describe, expect, it } from 'vitest'
import {
  formatGameTime,
  GAMES,
  gamesForSystem,
  P,
  starPips,
  SYSTEMS,
  systemByTheme,
  type PsxGame,
} from './library'

const game = (over: Partial<PsxGame> = {}): PsxGame => ({
  name: 'x',
  system: 'psx',
  rom: 'x.cue',
  desc: '',
  ...over,
})

describe('the publisher and developer predicates', () => {
  /*
   * Four mutually exclusive rows covering every combination, because EmulationStation has no
   * else - the source writes each case separately and all four have to be reproduced,
   * including the placeholder. Exactly one must hold for any game.
   */
  const cases: Array<[string, Partial<PsxGame>, keyof typeof P]> = [
    ['same publisher and developer', { publisher: 'Sony', developer: 'Sony' }, 'pubEqDev'],
    ['developer only', { developer: 'Sony' }, 'devOnly'],
    ['publisher only', { publisher: 'Sony' }, 'pubOnly'],
    ['neither', {}, 'neither'],
  ]

  for (const [label, fields, expected] of cases) {
    it(`treats ${label} as exactly one case`, () => {
      const g = game(fields)
      const holding = (['pubEqDev', 'devOnly', 'pubOnly', 'neither'] as const).filter((k) => P[k](g))
      expect(holding).toEqual([expected])
    })
  }

  it('does not call differing publisher and developer any of the four', () => {
    // The fifth combination - both present and different - is the ordinary case, which the
    // source renders with its own row rather than one of these.
    const g = game({ publisher: 'Sony', developer: 'Naughty Dog' })
    expect([P.pubEqDev(g), P.devOnly(g), P.pubOnly(g), P.neither(g)]).toEqual([
      false,
      false,
      false,
      false,
    ])
  })
})

describe('the game-state predicates', () => {
  it('reads a disc marker out of the rom name as well as the flag', () => {
    expect(P.multidisc(game({ rom: 'Final Fantasy VII (Disc 1).cue' }))).toBe(true)
    expect(P.multidisc(game({ multidisc: true }))).toBe(true)
    expect(P.multidisc(game({ rom: 'Crash Bandicoot.cue' }))).toBe(false)
  })

  it('forces the world flag only when a game claims more than one region', () => {
    expect(P.worldFlag(game({ region: 'eu,us' }))).toBe(true)
    expect(P.worldFlag(game({ region: 'eu' }))).toBe(false)
    expect(P.worldFlag(game())).toBe(false)
  })

  it('labels more than one language rather than drawing a flag', () => {
    expect(P.langLabel(game({ lang: 'en,fr' }))).toBe(true)
    expect(P.langLabel(game({ lang: 'en' }))).toBe(false)
  })

  it('counts a game with no play time as never played', () => {
    expect(P.neverPlayed(game())).toBe(true)
    expect(P.neverPlayed(game({ gametime: 0 }))).toBe(true)
    expect(P.neverPlayed(game({ gametime: 60 }))).toBe(false)
  })

  it('shows the star row only when there is a rating', () => {
    expect(P.hasStars(game({ stars: 3 }))).toBe(true)
    expect(P.hasStars(game({ stars: 0 }))).toBe(false)
    expect(P.hasStars(game())).toBe(false)
  })
})

describe('the system predicates', () => {
  it('hides the per-tile heart on the favourites collection', () => {
    expect(P.hidesFavorite(systemByTheme('auto-favorites'))).toBe(true)
    expect(P.hidesFavorite(systemByTheme('psx'))).toBe(false)
  })

  it('shows the italic chip only on a Collection', () => {
    expect(P.showsSystemChip(systemByTheme('auto-favorites'))).toBe(true)
    expect(P.showsSystemChip(systemByTheme('psx'))).toBe(false)
  })
})

describe('the library', () => {
  it('gathers a collection from every system rather than owning games', () => {
    const collection = SYSTEMS.find((s) => s.isCollection)!
    const games = gamesForSystem(collection)

    expect(games.length).toBeGreaterThan(0)
    expect(games.every((g) => g.favorite)).toBe(true)
    expect(new Set(games.map((g) => g.system)).size).toBeGreaterThan(1)
  })

  it('gives every system something to show', () => {
    for (const system of SYSTEMS) {
      expect(gamesForSystem(system).length, system.theme).toBeGreaterThan(0)
    }
  })

  it('leaves a collection with no release year, as the source ships it', () => {
    expect(SYSTEMS.find((s) => s.isCollection)!.releaseYear).toBe('')
  })

  it('carries the play-state tags the badges are drawn from', () => {
    const tagged = GAMES.filter((g) => g.tags?.length)
    expect(tagged.length).toBeGreaterThan(0)
    for (const g of tagged) {
      for (const tag of g.tags!) {
        expect(['finished', 'in progress', 'buggy', 'liked']).toContain(tag)
      }
    }
  })
})

describe('formatting', () => {
  it('drops the hour when there is not one', () => {
    expect(formatGameTime(187200)).toBe('52h 0m')
    expect(formatGameTime(720)).toBe('12m')
    expect(formatGameTime(0)).toBe('0m')
    expect(formatGameTime(undefined)).toBe('0m')
  })

  it('fills the star pips to the rating', () => {
    expect(starPips(3)).toEqual([true, true, true, false, false])
    expect(starPips(0)).toEqual([false, false, false, false, false])
    expect(starPips(undefined)).toEqual([false, false, false, false, false])
  })
})
