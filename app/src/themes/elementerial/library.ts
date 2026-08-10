/**
 * Elementerial's sample library.
 *
 * Extracted from the original source by `scripts/gen-data.mjs` rather than retyped - it is
 * around ninety entries of metadata, and a transcription slip in one year or one favourite flag
 * would be invisible.
 *
 * The theme ships system logos and backdrops but no per-game artwork, which is why every screen
 * that needs cover art generates it. See `art.ts`.
 */

export interface ElementerialSystem {
  readonly theme: string
  readonly fullName: string
  readonly count: number
}

export interface ElementerialGame {
  readonly name: string
  readonly releasedate: string
  readonly genre: string
  readonly players: string
  /** 0 to 1; the view renders five stars from it. */
  readonly rating: number
  readonly developer: string
  readonly favorite: boolean
  /** Renders the scheme's no-artwork placeholder instead of generated art. */
  readonly noArt: boolean
  readonly folder: boolean
  readonly desc: string
  /** Filled in at load; the source sets it on the game when a list is built. */
  readonly system?: string
}

export const SYSTEMS: readonly ElementerialSystem[] = [
  {
    theme: "nes",
    fullName: "Nintendo Entertainment System",
    count: 214
  },
  {
    theme: "snes",
    fullName: "Super Nintendo",
    count: 118
  },
  {
    theme: "gb",
    fullName: "Game Boy",
    count: 73
  },
  {
    theme: "gbc",
    fullName: "Game Boy Color",
    count: 61
  },
  {
    theme: "gba",
    fullName: "Game Boy Advance",
    count: 126
  },
  {
    theme: "genesis",
    fullName: "Sega Genesis",
    count: 88
  },
  {
    theme: "psx",
    fullName: "PlayStation",
    count: 41
  },
  {
    theme: "n64",
    fullName: "Nintendo 64",
    count: 35
  },
  {
    theme: "dreamcast",
    fullName: "Dreamcast",
    count: 27
  },
  {
    theme: "arcade",
    fullName: "Arcade",
    count: 302
  }
]

export const GAMES: Readonly<Record<string, readonly ElementerialGame[]>> = {
  snes: [
    {
      name: "Super Mario World",
      releasedate: "1990",
      genre: "Platform",
      players: "1-2",
      rating: 1,
      developer: "Nintendo EAD",
      favorite: true,
      noArt: false,
      folder: false,
      desc: "Mario and Luigi set out across Dinosaur Land to rescue Princess Toadstool from Bowser, with Yoshi along for the ride."
    },
    {
      name: "The Legend of Zelda: A Link to the Past",
      releasedate: "1991",
      genre: "Action Adventure",
      players: "1",
      rating: 1,
      developer: "Nintendo EAD",
      favorite: true,
      noArt: false,
      folder: false,
      desc: "Link travels between the Light World and the Dark World to gather the Pendants of Virtue and free Hyrule."
    },
    {
      name: "Super Metroid",
      releasedate: "1994",
      genre: "Action",
      players: "1",
      rating: 1,
      developer: "Nintendo R&D1",
      favorite: false,
      noArt: false,
      folder: false,
      desc: "Samus returns to Zebes to recover the stolen Metroid larva from the Space Pirates."
    },
    {
      name: "Chrono Trigger",
      releasedate: "1995",
      genre: "Role Playing",
      players: "1",
      rating: 1,
      developer: "Square",
      favorite: true,
      noArt: false,
      folder: false,
      desc: "A band of travellers moves through eras to prevent an apocalypse."
    },
    {
      name: "Donkey Kong Country",
      releasedate: "1994",
      genre: "Platform",
      players: "1-2",
      rating: 0.8,
      developer: "Rare",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "F-Zero",
      releasedate: "1990",
      genre: "Racing",
      players: "1",
      rating: 0.8,
      developer: "Nintendo EAD",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Super Castlevania IV",
      releasedate: "1991",
      genre: "Platform",
      players: "1",
      rating: 0.8,
      developer: "Konami",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Kirby Super Star",
      releasedate: "1996",
      genre: "Platform",
      players: "1-2",
      rating: 0.9,
      developer: "HAL Laboratory",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Secret of Mana",
      releasedate: "1993",
      genre: "Role Playing",
      players: "1-3",
      rating: 0.9,
      developer: "Square",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Star Fox",
      releasedate: "1993",
      genre: "Shooter",
      players: "1",
      rating: 0.7,
      developer: "Nintendo EAD",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Super Punch-Out!!",
      releasedate: "1994",
      genre: "Sports",
      players: "1",
      rating: 0.7,
      developer: "Nintendo IRD",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Teenage Mutant Ninja Turtles IV: Turtles in Time",
      releasedate: "1992",
      genre: "Beat ’em Up",
      players: "1-2",
      rating: 0.9,
      developer: "Konami",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Contra III: The Alien Wars",
      releasedate: "1992",
      genre: "Shooter",
      players: "1-2",
      rating: 0.8,
      developer: "Konami",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Mega Man X",
      releasedate: "1993",
      genre: "Platform",
      players: "1",
      rating: 0.9,
      developer: "Capcom",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Earthbound",
      releasedate: "1994",
      genre: "Role Playing",
      players: "1",
      rating: 0.5,
      developer: "Ape",
      favorite: false,
      noArt: true,
      folder: false,
      desc: ""
    },
    {
      name: "Homebrew",
      releasedate: "",
      genre: "",
      players: "",
      rating: 0,
      developer: "",
      favorite: false,
      noArt: false,
      folder: true,
      desc: ""
    },
    {
      name: "Pilotwings",
      releasedate: "1990",
      genre: "Simulation",
      players: "1",
      rating: 0.5,
      developer: "Nintendo EAD",
      favorite: false,
      noArt: true,
      folder: false,
      desc: ""
    },
    {
      name: "Yoshi’s Island",
      releasedate: "1995",
      genre: "Platform",
      players: "1",
      rating: 1,
      developer: "Nintendo EAD",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    }
  ],
  nes: [
    {
      name: "Super Mario Bros. 3",
      releasedate: "1988",
      genre: "Platform",
      players: "1-2",
      rating: 1,
      developer: "Nintendo R&D4",
      favorite: true,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "The Legend of Zelda",
      releasedate: "1986",
      genre: "Action Adventure",
      players: "1",
      rating: 0.9,
      developer: "Nintendo R&D4",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Metroid",
      releasedate: "1986",
      genre: "Action",
      players: "1",
      rating: 0.8,
      developer: "Nintendo R&D1",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Mega Man 2",
      releasedate: "1988",
      genre: "Platform",
      players: "1",
      rating: 1,
      developer: "Capcom",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Castlevania",
      releasedate: "1986",
      genre: "Platform",
      players: "1",
      rating: 0.8,
      developer: "Konami",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Punch-Out!!",
      releasedate: "1987",
      genre: "Sports",
      players: "1",
      rating: 0.8,
      developer: "Nintendo IRD",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Kirby’s Adventure",
      releasedate: "1993",
      genre: "Platform",
      players: "1",
      rating: 0.8,
      developer: "HAL Laboratory",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Duck Hunt",
      releasedate: "1984",
      genre: "Shooter",
      players: "1-2",
      rating: 0.5,
      developer: "Nintendo R&D1",
      favorite: false,
      noArt: true,
      folder: false,
      desc: ""
    }
  ],
  gb: [
    {
      name: "Tetris",
      releasedate: "1989",
      genre: "Puzzle",
      players: "1-2",
      rating: 1,
      developer: "Nintendo R&D1",
      favorite: true,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Super Mario Land",
      releasedate: "1989",
      genre: "Platform",
      players: "1",
      rating: 0.8,
      developer: "Nintendo R&D1",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Pokémon Red",
      releasedate: "1996",
      genre: "Role Playing",
      players: "1",
      rating: 1,
      developer: "Game Freak",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "The Legend of Zelda: Link’s Awakening",
      releasedate: "1993",
      genre: "Action Adventure",
      players: "1",
      rating: 1,
      developer: "Nintendo EAD",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Metroid II: Return of Samus",
      releasedate: "1991",
      genre: "Action",
      players: "1",
      rating: 0.7,
      developer: "Nintendo R&D1",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Kirby’s Dream Land",
      releasedate: "1992",
      genre: "Platform",
      players: "1",
      rating: 0.7,
      developer: "HAL Laboratory",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    }
  ],
  gbc: [
    {
      name: "Pokémon Crystal",
      releasedate: "2000",
      genre: "Role Playing",
      players: "1",
      rating: 1,
      developer: "Game Freak",
      favorite: true,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "The Legend of Zelda: Oracle of Ages",
      releasedate: "2001",
      genre: "Action Adventure",
      players: "1",
      rating: 0.9,
      developer: "Capcom",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Wario Land 3",
      releasedate: "2000",
      genre: "Platform",
      players: "1",
      rating: 0.8,
      developer: "Nintendo R&D1",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Shantae",
      releasedate: "2002",
      genre: "Platform",
      players: "1",
      rating: 0.8,
      developer: "WayForward",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Metal Gear Solid",
      releasedate: "2000",
      genre: "Action",
      players: "1",
      rating: 0.9,
      developer: "Konami",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Dragon Warrior III",
      releasedate: "2000",
      genre: "Role Playing",
      players: "1",
      rating: 0.7,
      developer: "Enix",
      favorite: false,
      noArt: true,
      folder: false,
      desc: ""
    }
  ],
  gba: [
    {
      name: "Metroid Fusion",
      releasedate: "2002",
      genre: "Action",
      players: "1",
      rating: 0.9,
      developer: "Nintendo R&D1",
      favorite: true,
      noArt: false,
      folder: false,
      desc: "Samus investigates a research station overrun by the parasitic X, hunted by a creature wearing her own stolen suit."
    },
    {
      name: "The Legend of Zelda: The Minish Cap",
      releasedate: "2004",
      genre: "Action Adventure",
      players: "1",
      rating: 0.9,
      developer: "Capcom",
      favorite: false,
      noArt: false,
      folder: false,
      desc: "Link shrinks to the size of the Picori to restore the Picori Blade and undo Vaati’s curse on Princess Zelda."
    },
    {
      name: "Advance Wars",
      releasedate: "2001",
      genre: "Strategy",
      players: "1-4",
      rating: 1,
      developer: "Intelligent Systems",
      favorite: false,
      noArt: false,
      folder: false,
      desc: "Turn-based tactics across Orange Star, Blue Moon, Yellow Comet and Green Earth, each commander with their own power."
    },
    {
      name: "Castlevania: Aria of Sorrow",
      releasedate: "2003",
      genre: "Platform",
      players: "1",
      rating: 1,
      developer: "Konami",
      favorite: false,
      noArt: false,
      folder: false,
      desc: "Soma Cruz absorbs the souls of the creatures he defeats inside a castle sealed within a solar eclipse."
    },
    {
      name: "Metal Slug Advance",
      releasedate: "2004",
      genre: "Shooter",
      players: "1",
      rating: 0.8,
      developer: "SNK Playmore",
      favorite: false,
      noArt: false,
      folder: false,
      desc: "A run-and-gun built for the handheld, with a card system and a life bar in place of one-hit deaths."
    },
    {
      name: "Golden Sun",
      releasedate: "2001",
      genre: "Role Playing",
      players: "1",
      rating: 0.9,
      developer: "Camelot",
      favorite: false,
      noArt: false,
      folder: false,
      desc: "Adepts wield Psynergy and collect Djinn to stop alchemy being loosed back upon Weyard."
    },
    {
      name: "Mario Kart: Super Circuit",
      releasedate: "2001",
      genre: "Racing",
      players: "1-4",
      rating: 0.8,
      developer: "Intelligent Systems",
      favorite: false,
      noArt: false,
      folder: false,
      desc: "Twenty new circuits plus every track from the original Super Mario Kart, unlocked by collecting coins."
    },
    {
      name: "Fire Emblem",
      releasedate: "2003",
      genre: "Strategy",
      players: "1",
      rating: 0.9,
      developer: "Intelligent Systems",
      favorite: false,
      noArt: false,
      folder: false,
      desc: "Lyn, Eliwood and Hector lead a campaign across Elibe where a fallen unit is gone for good."
    }
  ],
  genesis: [
    {
      name: "Sonic the Hedgehog 2",
      releasedate: "1992",
      genre: "Platform",
      players: "1-2",
      rating: 1,
      developer: "Sega Technical Institute",
      favorite: true,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Streets of Rage 2",
      releasedate: "1992",
      genre: "Beat ’em Up",
      players: "1-2",
      rating: 1,
      developer: "Sega AM7",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Gunstar Heroes",
      releasedate: "1993",
      genre: "Shooter",
      players: "1-2",
      rating: 0.9,
      developer: "Treasure",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Phantasy Star IV",
      releasedate: "1993",
      genre: "Role Playing",
      players: "1",
      rating: 0.9,
      developer: "Sega",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Ristar",
      releasedate: "1995",
      genre: "Platform",
      players: "1",
      rating: 0.8,
      developer: "Sega",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Comix Zone",
      releasedate: "1995",
      genre: "Beat ’em Up",
      players: "1",
      rating: 0.7,
      developer: "Sega Technical Institute",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    }
  ],
  psx: [
    {
      name: "Final Fantasy VII",
      releasedate: "1997",
      genre: "Role Playing",
      players: "1",
      rating: 1,
      developer: "Square",
      favorite: true,
      noArt: false,
      folder: false,
      desc: "Cloud Strife joins an eco-terrorist cell against the Shinra Electric Power Company, and finds the planet itself is the thing at stake."
    },
    {
      name: "Metal Gear Solid",
      releasedate: "1998",
      genre: "Action",
      players: "1",
      rating: 1,
      developer: "Konami",
      favorite: false,
      noArt: false,
      folder: false,
      desc: "Solid Snake infiltrates a nuclear disposal facility on Shadow Moses to stop a rogue special forces unit."
    },
    {
      name: "Castlevania: Symphony of the Night",
      releasedate: "1997",
      genre: "Platform",
      players: "1",
      rating: 1,
      developer: "Konami",
      favorite: false,
      noArt: false,
      folder: false,
      desc: "Alucard explores his father’s castle in a sprawling, map-driven reinvention of the series."
    },
    {
      name: "Gran Turismo 2",
      releasedate: "1999",
      genre: "Racing",
      players: "1-2",
      rating: 0.9,
      developer: "Polyphony Digital",
      favorite: false,
      noArt: false,
      folder: false,
      desc: "Over 650 cars and a licence system that treats driving as something to be studied."
    },
    {
      name: "Silent Hill",
      releasedate: "1999",
      genre: "Adventure",
      players: "1",
      rating: 0.9,
      developer: "Konami",
      favorite: false,
      noArt: false,
      folder: false,
      desc: "Harry Mason searches a fog-bound town for his daughter as it slips into a rusted other world."
    },
    {
      name: "Crash Bandicoot 3: Warped",
      releasedate: "1998",
      genre: "Platform",
      players: "1",
      rating: 0.8,
      developer: "Naughty Dog",
      favorite: false,
      noArt: false,
      folder: false,
      desc: "Crash and Coco chase crystals across time, with vehicle stages breaking up the corridor platforming."
    }
  ],
  n64: [
    {
      name: "The Legend of Zelda: Ocarina of Time",
      releasedate: "1998",
      genre: "Action Adventure",
      players: "1",
      rating: 1,
      developer: "Nintendo EAD",
      favorite: true,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Super Mario 64",
      releasedate: "1996",
      genre: "Platform",
      players: "1",
      rating: 1,
      developer: "Nintendo EAD",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "GoldenEye 007",
      releasedate: "1997",
      genre: "Shooter",
      players: "1-4",
      rating: 0.9,
      developer: "Rare",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Mario Kart 64",
      releasedate: "1996",
      genre: "Racing",
      players: "1-4",
      rating: 0.9,
      developer: "Nintendo EAD",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Banjo-Kazooie",
      releasedate: "1998",
      genre: "Platform",
      players: "1",
      rating: 0.9,
      developer: "Rare",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Perfect Dark",
      releasedate: "2000",
      genre: "Shooter",
      players: "1-4",
      rating: 0.8,
      developer: "Rare",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    }
  ],
  dreamcast: [
    {
      name: "Sonic Adventure",
      releasedate: "1998",
      genre: "Platform",
      players: "1",
      rating: 0.8,
      developer: "Sonic Team",
      favorite: true,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Jet Set Radio",
      releasedate: "2000",
      genre: "Action",
      players: "1",
      rating: 0.9,
      developer: "Smilebit",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Shenmue",
      releasedate: "1999",
      genre: "Adventure",
      players: "1",
      rating: 0.9,
      developer: "Sega AM2",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Crazy Taxi",
      releasedate: "1999",
      genre: "Racing",
      players: "1",
      rating: 0.8,
      developer: "Hitmaker",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Power Stone 2",
      releasedate: "2000",
      genre: "Fighting",
      players: "1-4",
      rating: 0.8,
      developer: "Capcom",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Soulcalibur",
      releasedate: "1999",
      genre: "Fighting",
      players: "1-2",
      rating: 1,
      developer: "Namco",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    }
  ],
  arcade: [
    {
      name: "Metal Slug 3",
      releasedate: "2000",
      genre: "Shooter",
      players: "1-2",
      rating: 1,
      developer: "SNK",
      favorite: true,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Street Fighter II Turbo",
      releasedate: "1992",
      genre: "Fighting",
      players: "1-2",
      rating: 1,
      developer: "Capcom",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "The King of Fighters ’98",
      releasedate: "1998",
      genre: "Fighting",
      players: "1-2",
      rating: 0.9,
      developer: "SNK",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Bubble Bobble",
      releasedate: "1986",
      genre: "Platform",
      players: "1-2",
      rating: 0.8,
      developer: "Taito",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Galaga",
      releasedate: "1981",
      genre: "Shooter",
      players: "1-2",
      rating: 0.8,
      developer: "Namco",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    },
    {
      name: "Sunset Riders",
      releasedate: "1991",
      genre: "Shooter",
      players: "1-4",
      rating: 0.8,
      developer: "Konami",
      favorite: false,
      noArt: false,
      folder: false,
      desc: ""
    }
  ]
}

export function gamesFor(systemTheme: string): readonly ElementerialGame[] {
  return GAMES[systemTheme] ?? GAMES.snes!
}

export function systemByTheme(theme: string): ElementerialSystem {
  return SYSTEMS.find((s) => s.theme === theme) ?? SYSTEMS[0]!
}

/**
 * What the description slot shows.
 *
 * Falls back to the game's own scraped metadata rather than invented prose, so the slot is
 * always populated in Elementflix and in the 1:1 detailed view.
 */
export function describe(game: ElementerialGame): string {
  if (game.desc) return game.desc
  return [game.genre, game.developer, game.releasedate].filter(Boolean).join('  \u00b7  ')
}
