/**
 * The sample library's games.
 *
 * Where a website frame shows a system's list, the list is that frame's: Game Boy Advance
 * (`site-01`, `site-10`), Super Nintendo (`site-05`, `site-08`), CPS1 (`site-06`) and CPS2
 * (`site-04`). The rest are a handful of real titles per system. A game is *scraped* - a real name,
 * a rating, a description - only where a frame shows that game's details; every other game is what
 * NeoStation shows for a ROM the scraper has not reached: its cleaned file name, and "Incomplete
 * Metadata" on the info tab.
 *
 * Achievement names are not reproduced: RetroAchievements' own sets are the author's, and only one
 * name is visible in any frame. The rest are numbered.
 */

export interface Scraped {
  /** ScreenScraper's 0-20 rating; the card shows half of it. */
  readonly rating?: number
  readonly developer?: string
  readonly publisher?: string
  readonly players?: string
  readonly year?: string
  readonly genre?: string
  readonly description?: string
}

export interface Cheevo {
  readonly title: string
  readonly description: string
  readonly points: number
  readonly unlocked: boolean
}

export interface GameDef {
  readonly title: string
  readonly file: string
  readonly favorite?: boolean
  readonly played?: number
  readonly scraped?: Scraped
  /** RetroAchievements: how many the set has, and any the frames name. */
  readonly cheevos?: { readonly total: number; readonly named?: Readonly<Record<number, Omit<Cheevo, 'unlocked'>>> }
}

/** An unscraped ROM: the list shows its file name with the region tag and extension removed. */
const rom = (name: string, region = 'USA', ext = 'zip'): GameDef => ({ title: name, file: `${name} (${region}).${ext}` })
const fav = (g: GameDef): GameDef => ({ ...g, favorite: true })

export const GAME_DEFS: Readonly<Record<string, readonly GameDef[]>> = {
  gba: [
    {
      title: 'Bubble Bobble : Old & New',
      file: 'Bubble Bobble - Old & New (USA).zip',
      favorite: true,
      scraped: { rating: 16, developer: 'Taito', players: '1-2', year: '2002', genre: 'Platform' },
      cheevos: { total: 63 },
    },
    {
      title: 'Dragon Ball : Advanced Adventure',
      file: 'Dragon Ball - Advanced Adventure (Europe).zip',
      favorite: true,
    },
    { title: 'Final Fantasy Tactics Advance', file: 'Final Fantasy Tactics Advance (USA).zip', favorite: true },
    {
      title: 'Goodboy Galaxy',
      file: 'Goodboy Galaxy (World) (v1.3) (Aftermarket).zip',
      favorite: true,
      played: 3 * 3600 + 14 * 60 + 52,
      scraped: { developer: 'Goodboy Galaxy Team', players: '1', year: '2023', genre: 'Platform' },
      cheevos: { total: 125 },
    },
    { title: '007 : Nightfire', file: '007 - NightFire (USA, Europe).zip' },
    { title: 'Ace Combat Advance', file: 'Ace Combat Advance (USA).zip' },
    { title: 'Action Man : Robot Atak', file: 'Action Man - Robot Atak (Europe).zip' },
    { title: 'Activision Anthology', file: 'Activision Anthology (USA).zip' },
    { title: 'Advance Guardian Heroes', file: 'Advance Guardian Heroes (USA).zip' },
    { title: 'Advance Wars', file: 'Advance Wars (USA).zip' },
    { title: 'Advance Wars 2 : Black Hole Rising', file: 'Advance Wars 2 - Black Hole Rising (USA).zip' },
    rom('Castlevania - Aria of Sorrow'),
    rom('Golden Sun'),
    rom('Mario Kart - Super Circuit'),
    rom('Metroid Fusion'),
    rom('Minish Cap, The', 'Europe'),
  ],
  snes: [
    {
      title: 'Boogerman : A Pick and Flick Adventure',
      file: 'Boogerman - A Pick and Flick Adventure (USA).zip',
      favorite: true,
      scraped: { rating: 12, developer: 'Interplay', players: '1', year: '1995', genre: 'Platform' },
      cheevos: { total: 17 },
    },
    fav({ title: 'BS Zelda no Densetsu', file: 'BS Zelda no Densetsu (Japan).zip' }),
    fav({ title: 'Contra III : The Alien Wars', file: 'Contra III - The Alien Wars (USA).zip' }),
    fav({ title: 'Doom', file: 'Doom (USA).zip' }),
    fav({ title: 'EarthBound', file: 'EarthBound (USA).zip' }),
    fav({ title: 'Earthworm Jim', file: 'Earthworm Jim (USA).zip' }),
    fav({ title: 'Earthworm Jim 2', file: 'Earthworm Jim 2 (USA).zip' }),
    fav({ title: 'Fatal Fury', file: 'Fatal Fury (USA).zip' }),
    fav({ title: 'Fatal Fury 2', file: 'Fatal Fury 2 (USA).zip' }),
    fav({ title: 'Final Fantasy IV', file: 'Final Fantasy IV (Japan).zip' }),
    fav({ title: 'International Superstar Soccer', file: 'International Superstar Soccer (USA).zip' }),
    { title: 'Beavis and Butt-Head', file: 'Beavis and Butt-Head (USA).zip' },
    { title: "Bebe's Kids", file: "Bebe's Kids (USA).zip" },
    { title: 'Beethoven : The Ultimate Canine Caper!', file: 'Beethoven - The Ultimate Canine Caper! (USA).zip' },
    { title: 'Biker Mice from Mars', file: 'Biker Mice from Mars (USA).zip' },
    { title: 'BioMetal', file: 'BioMetal (USA).zip' },
    {
      title: 'Bishoujo Senshi Sailor Moon',
      file: 'Bishoujo Senshi Sailor Moon (Japan).zip',
      scraped: { rating: 14, developer: 'Angel', players: '1-2', year: '1993', genre: "Beat'em Up" },
      cheevos: { total: 18 },
    },
    {
      title: 'Bishoujo Senshi Sailor Moon : Another Story',
      file: 'Bishoujo Senshi Sailor Moon - Another Story (Japan).zip',
    },
    { title: 'Bishoujo Senshi Sailor Moon R', file: 'Bishoujo Senshi Sailor Moon R (Japan).zip' },
    {
      title: 'Bishoujo Senshi Sailor Moon S : Jougai Rantou!? Shuyaku Soudatsusen',
      file: 'Bishoujo Senshi Sailor Moon S - Jougai Rantou! Shuyaku Soudatsusen (Japan).zip',
    },
    {
      title: 'Bishoujo Senshi Sailor Moon SuperS : Fuwa Fuwa Panic',
      file: 'Bishoujo Senshi Sailor Moon SuperS - Fuwa Fuwa Panic (Japan).zip',
    },
    {
      title: 'Bishoujo Senshi Sailor Moon SuperS : Zenin Sanka!! Shuyaku Soudatsusen',
      file: 'Bishoujo Senshi Sailor Moon SuperS - Zenin Sanka!! Shuyaku Soudatsusen (Japan).zip',
    },
    rom('Chrono Trigger'),
    rom('Donkey Kong Country'),
    rom('Super Metroid', 'Japan, USA'),
  ],
  cps1: [
    rom('1941 - Counter Attack', 'World'),
    rom('Captain Commando', 'World'),
    rom('Carrier Air Wing', 'World'),
    rom('Dynasty Wars', 'USA'),
    { title: 'Final Fight', file: 'ffight.zip' },
    { title: 'Forgotten Worlds', file: 'forgottn.zip' },
    { title: "Ghouls'n Ghosts", file: 'ghouls.zip' },
    { title: 'Knights of the Round', file: 'knights.zip' },
    { title: 'Magic Sword: Heroic Fantasy', file: 'msword.zip' },
    {
      title: 'Mega Man: The Power Battle',
      file: 'megaman.zip',
      scraped: {
        rating: 15,
        developer: 'Capcom',
        players: '1-2',
        year: '1995',
        genre: 'Fighting',
        description:
          "Have you ever pictured a Rockman or Megaman game that allows to skip all the platform elements and just grapple against the bosses? That's pretty much the main idea in this game! Choose from Rockman/Megaman, Protoman or Bass.",
      },
      cheevos: { total: 60 },
    },
    { title: 'Mega Twins', file: 'mtwins.zip' },
    { title: 'Mercs', file: 'mercs.zip' },
    { title: 'Muscle Bomber Duo : Ultimate Team Battle', file: 'mbombrd.zip' },
    { title: 'Nemo', file: 'nemo.zip' },
    { title: 'Pang! 3', file: 'pang3.zip' },
    rom('Street Fighter II - The World Warrior', 'World'),
    rom('Strider', 'USA'),
    rom('U.N. Squadron', 'USA'),
    rom('Willow', 'USA'),
  ],
  cps2: [
    { title: '1944 : The Loop Master', file: '1944.zip' },
    {
      title: '19XX : The War Against Destiny',
      file: '19xx.zip',
      scraped: { rating: 14, developer: 'Capcom', players: '1-2', year: '1995', genre: 'Shoot-em Up' },
      cheevos: {
        total: 23,
        named: { 6: { title: 'Wings of the Rising Sun', description: 'Beat Stage 3', points: 5 } },
      },
    },
    { title: 'Alien vs. Predator', file: 'avsp.zip' },
    { title: 'Armored Warriors', file: 'armwar.zip' },
    { title: 'Battle Circuit', file: 'batcir.zip' },
    { title: 'Capcom Sports Club', file: 'csclub.zip' },
    { title: 'Cyberbots : Fullmetal Madness', file: 'cybots.zip' },
    { title: 'Darkstalkers: The Night Warriors', file: 'dstlk.zip' },
    { title: 'Dimahoo', file: 'dimahoo.zip' },
    { title: 'Dungeons & Dragons: Shadow over Mystara', file: 'ddsom.zip' },
    { title: 'Dungeons & Dragons: Tower of Doom', file: 'ddtod.zip' },
    rom('Street Fighter Alpha 3', 'USA'),
    rom('Super Puzzle Fighter II Turbo', 'USA'),
  ],
  arc: [
    rom('Donkey Kong', 'World'),
    rom('Galaga', 'World'),
    rom('Pac-Man', 'World'),
    rom('Space Invaders', 'World'),
    rom('Tempest', 'World'),
    rom('Time Pilot', 'World'),
  ],
  chf: [rom('Pinball Challenge'), rom('Space War'), rom('Video Whizball'), rom('Maze')],
  a2: [
    rom('Karateka', 'USA', 'dsk'),
    rom('Lode Runner', 'USA', 'dsk'),
    rom('Oregon Trail, The', 'USA', 'dsk'),
    rom('Prince of Persia', 'USA', 'dsk'),
    rom('Ultima IV', 'USA', 'dsk'),
  ],
  '2600': [
    rom('Adventure'),
    rom('Asteroids'),
    rom('Missile Command'),
    rom('Pitfall!'),
    rom('River Raid'),
    rom("Yars' Revenge"),
  ],
  mo2: [
    rom('K.C. Munchkin!', 'Europe'),
    rom('Pick Axe Pete!', 'Europe'),
    rom('Quest for Rings!', 'Europe'),
    rom('UFO!', 'Europe'),
  ],
  vc4k: [rom('Galaxy Invader', 'Europe'), rom('Grand Prix', 'Europe'), rom('Monster Man', 'Europe')],
  a2001: [rom('Cat Trax'), rom('Jungler'), rom('Route 16'), rom('Space Attack')],
  cv: [rom('BurgerTime'), rom('Donkey Kong'), rom('Frogger'), rom('Venture'), rom('Zaxxon')],
  vect: [
    rom('Berzerk', 'World'),
    rom('Mine Storm', 'World'),
    rom('Scramble', 'World'),
    rom('Star Trek - The Motion Picture', 'World'),
  ],
  msx: [
    rom('Knightmare', 'Japan'),
    rom('Metal Gear', 'Japan'),
    rom('Nemesis', 'Europe'),
    rom('Penguin Adventure', 'Japan'),
    rom('Vampire Killer', 'Europe'),
  ],
  nes: [
    rom('Castlevania'),
    rom('Contra'),
    rom('Mega Man 2'),
    rom('Metroid'),
    rom('Super Mario Bros. 3'),
    rom('Legend of Zelda, The'),
  ],
  sms: [
    rom('Alex Kidd in Miracle World', 'Europe'),
    rom('Phantasy Star', 'Europe'),
    rom("Wonder Boy III - The Dragon's Trap", 'Europe'),
  ],
  pce: [rom("Bonk's Adventure"), rom('Blazing Lazers'), rom("Galaga '90"), rom('R-Type', 'Japan')],
  '7800': [rom('Food Fight'), rom('Ms. Pac-Man'), rom('Robotron 2084'), rom('Xevious')],
  genesis: [
    rom('Gunstar Heroes'),
    rom('Phantasy Star IV'),
    rom('Sonic The Hedgehog 2', 'World'),
    rom('Streets of Rage 2'),
    rom('Shinobi III - Return of the Ninja Master'),
  ],
  gb: [rom("Kirby's Dream Land"), rom("Link's Awakening"), rom('Super Mario Land', 'World'), rom('Tetris', 'World')],
  lynx: [rom('Blue Lightning'), rom('California Games'), rom("Chip's Challenge"), rom('Gates of Zendocon')],
  gg: [rom('Columns', 'World'), rom('GG Aleste', 'Japan'), rom('Shinobi'), rom('Sonic Triple Trouble')],
  ngp: [rom('Melon-chan no Seichou Nikki', 'Japan'), rom("Neo Geo Cup '98", 'Japan'), rom('Samurai Shodown!', 'Japan')],
  n64: [
    rom('Banjo-Kazooie', 'USA', 'z64'),
    rom('F-Zero X', 'USA', 'z64'),
    rom('GoldenEye 007', 'USA', 'z64'),
    rom('Super Mario 64', 'USA', 'z64'),
    rom('Star Fox 64', 'USA', 'z64'),
  ],
  ps1: [
    rom('Castlevania - Symphony of the Night', 'USA', 'chd'),
    rom('Crash Bandicoot', 'USA', 'chd'),
    rom('Final Fantasy VII', 'USA', 'chd'),
    rom('Metal Gear Solid', 'USA', 'chd'),
    rom('Spyro the Dragon', 'USA', 'chd'),
  ],
  gbc: [rom('Dragon Warrior III'), rom('Oracle of Ages'), rom('Pokemon Crystal'), rom('Wario Land 3', 'World')],
  ngpc: [
    rom("Card Fighters' Clash", 'World'),
    rom('Metal Slug - 2nd Mission', 'World'),
    rom('Sonic the Hedgehog - Pocket Adventure', 'World'),
  ],
  ws: [rom('Gunpey', 'Japan'), rom('Klonoa - Moonlight Museum', 'Japan'), rom('Makaimura', 'Japan')],
  dc: [
    rom('Crazy Taxi', 'USA', 'chd'),
    rom('Jet Grind Radio', 'USA', 'chd'),
    rom('Power Stone', 'USA', 'chd'),
    rom('Soulcalibur', 'USA', 'chd'),
  ],
  ds: [
    rom('Castlevania - Dawn of Sorrow', 'USA', 'nds'),
    rom('Elite Beat Agents', 'USA', 'nds'),
    rom('Mario Kart DS', 'USA', 'nds'),
    rom('Professor Layton and the Curious Village', 'USA', 'nds'),
  ],
  psp: [
    rom('Daxter', 'USA', 'iso'),
    rom('Lumines', 'USA', 'iso'),
    rom('Patapon', 'USA', 'iso'),
    rom('Wipeout Pure', 'USA', 'iso'),
  ],
}

/** The Android card's apps (Android only). Their icons are the device's, drawn here as initials. */
export const ANDROID_APPS: readonly string[] = [
  'Chrome',
  'Dolphin',
  'DuckStation',
  'Files',
  'Lemuroid',
  'Moonlight',
  'Play Store',
  'PPSSPP',
  'RetroArch',
  'Settings',
  'Steam Link',
  'YouTube',
]
