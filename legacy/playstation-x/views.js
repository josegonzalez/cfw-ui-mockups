/*
 * views.js - sample library and the view builders.
 *
 * Field names are the theme's own {game:...} / {system:...} tokens, so one grep matches both
 * the XML and this file.
 *
 * The sample set is not decorative: each system and each game was chosen to trip a specific
 * data predicate in the source. The full coverage table is in reference/source-notes.md
 * "Sample data coverage" - if you change this data, update that table.
 *
 * DATA PREDICATES. The theme conditions elements two ways. ifSubset / aspect-ratio /
 * tinyScreen depend only on the device and chrome state, so layout.js resolves them once.
 * if= over {system.theme} / {system.name} and <visible> over {game:*} depend on the SELECTED
 * item, so they are evaluated here, per render. Each predicate carries the source expression
 * it implements in a comment beside it.
 */
window.PlayStationX = window.PlayStationX || {};

(function (PSX) {
  'use strict';

  /* All pages live one level under playstation-x/, like elementerial's E.ASSET. */
  PSX.ASSET = '../assets/';

  /* ---- systems ------------------------------------------------------ */
  var SYSTEMS = [
    {
      theme: 'psx', name: 'psx', fullName: 'Sony PlayStation', manufacturer: 'Sony',
      hardwareType: 'Console', releaseYear: 1994,
      total: 66, favorites: 16, gamesPlayed: 27, mostPlayed: 'Final Fantasy VII',
      /* _theme_inc/infos/psx.xml, English <text> only, trimmed to two sentences. */
      description: 'The PlayStation is a 32-bit fifth-generation home video game console ' +
        'released by Sony in 1994. It was the first console to ship 100 million units and ' +
        'made CD-ROM the dominant game medium.',
      /* infos/psx.xml sets the bottom rule to a red-to-teal gradient. */
      linea: ['#F2001A', '#00AD9E'],
      hasConsole: true, hasLogo: true
    },
    {
      theme: 'snes', name: 'snes', fullName: 'Super Nintendo', manufacturer: 'Nintendo',
      hardwareType: 'Console', releaseYear: 1990,
      total: 48, favorites: 9, gamesPlayed: 21, mostPlayed: 'Super Metroid',
      description: 'The Super Nintendo Entertainment System is a 16-bit console released by ' +
        'Nintendo in 1990, and the best-selling console of its generation.',
      linea: ['#7B68C4', '#E5E5E5'], hasConsole: true, hasLogo: true
    },
    {
      theme: 'n64', name: 'n64', fullName: 'Nintendo 64', manufacturer: 'Nintendo',
      hardwareType: 'Console', releaseYear: 1996,
      total: 31, favorites: 7, gamesPlayed: 14, mostPlayed: 'GoldenEye 007',
      description: 'The Nintendo 64 is a 64-bit console released in 1996, named for its ' +
        '64-bit processor and remembered for bringing analogue 3D control to the mainstream.',
      linea: ['#009B48', '#F5C400'], hasConsole: true, hasLogo: true
    },
    {
      theme: 'megadrive', name: 'megadrive', fullName: 'Sega Mega Drive', manufacturer: 'Sega',
      hardwareType: 'Console', releaseYear: 1988,
      total: 54, favorites: 12, gamesPlayed: 19, mostPlayed: 'Sonic the Hedgehog 2',
      description: 'The Mega Drive is a 16-bit console released by Sega in 1988, sold as the ' +
        'Genesis in North America.',
      linea: ['#0057B8', '#00A3E0'], hasConsole: true, hasLogo: true
    },
    {
      theme: 'gba', name: 'gba', fullName: 'Game Boy Advance', manufacturer: 'Nintendo',
      hardwareType: 'Portable console', releaseYear: 2001,
      total: 72, favorites: 18, gamesPlayed: 25, mostPlayed: 'Metroid Fusion',
      description: 'The Game Boy Advance is a 32-bit handheld released by Nintendo in 2001, ' +
        'and the last of the Game Boy line.',
      linea: ['#5B2C8D', '#C0A0E0'], hasConsole: true, hasLogo: true
    },
    {
      theme: 'dreamcast', name: 'dreamcast', fullName: 'Sega Dreamcast', manufacturer: 'Sega',
      hardwareType: 'Console', releaseYear: 1998,
      total: 27, favorites: 6, gamesPlayed: 11, mostPlayed: 'Jet Set Radio',
      description: 'The Dreamcast is a 128-bit console released by Sega in 1998, the first ' +
        'of its generation and the first with a built-in modem.',
      linea: ['#F26522', '#0060A8'], hasConsole: true, hasLogo: true
    },
    {
      theme: 'arcade', name: 'arcade', fullName: 'Arcade', manufacturer: 'Various',
      hardwareType: 'Arcade', releaseYear: 1979,
      total: 143, favorites: 24, gamesPlayed: 38, mostPlayed: 'Metal Slug',
      description: 'Coin-operated arcade hardware spanning three decades of dedicated boards ' +
        'and cabinets.',
      linea: ['#E8B000', '#DF0024'], hasConsole: true, hasLogo: true
    },
    {
      /* A Collection. {system.name} is 'favorites', which hides gridtile.favorite
       * (grid.xml:116) and shows the italic system chip beside each title. Collections have
       * no console art upstream, so hasConsole is false. */
      theme: 'auto-favorites', name: 'favorites', fullName: 'Favorites',
      manufacturer: 'Collections', hardwareType: 'Collection', releaseYear: '',
      total: 92, favorites: 92, gamesPlayed: 41, mostPlayed: 'Final Fantasy VII',
      description: 'Every game flagged as a favourite, gathered across all systems.',
      /* Collections ship neither a console render nor a system cutout upstream - only a
       * caratula, a logo and a background. */
      linea: ['#F3C300', '#0070d1'], hasConsole: false, hasLogo: true, hasOverlayArt: false,
      isCollection: true
    }
  ];

  /* ---- games --------------------------------------------------------
   * Twelve psx titles. The right-hand column of the coverage table in source-notes.md maps
   * one-to-one onto these; the comment on each says what it exists to fire.
   */
  var GAMES = [
    {
      name: 'Final Fantasy VII', system: 'psx', rom: 'Final Fantasy VII (Disc 1).cue',
      desc: 'The Shinra Corporation is draining the planet of its life. Cloud, a mercenary ' +
        'turned eco-warrior, joins a resistance cell and finds the journey ahead will change ' +
        'far more than the fate of one city.',
      publisher: 'Squaresoft', developer: 'Squaresoft', releaseyear: 1997,
      genre: 'Role playing games', stars: 5, playerCount: 1,
      region: 'eu', lang: 'en', favorite: true, cheevos: true,
      /* rom contains "(Disc 1)" -> the pulsing multi-disc chip, grid.xml:607 */
      multidisc: true,
      playcount: 34, gametime: 187200, lastplayed: '2 days ago',
      art: 'ff7', overlay: 'Final-Fantasy'
    },
    {
      /* publisher == developer, both non-empty -> grid.xml:271 */
      name: 'Gran Turismo', system: 'psx', rom: 'Gran Turismo.chd',
      desc: 'A racing simulator built around collecting and tuning production cars, with a ' +
        'licence system that gates progression behind driving tests.',
      publisher: 'Sony Computer Entertainment', developer: 'Sony Computer Entertainment',
      releaseyear: 1997, genre: 'Racing', stars: 5, playerCount: 2,
      region: 'eu', lang: 'en', favorite: true, cheevos: true,
      playcount: 12, gametime: 43200, lastplayed: '1 week ago', art: 'gt'
    },
    {
      /* developer only -> grid.xml:275 */
      name: 'Silent Hill', system: 'psx', rom: 'Silent Hill.chd',
      desc: 'Harry Mason searches a fog-bound town for his missing daughter, and finds it has ' +
        'been replaced by something else.',
      publisher: '', developer: 'Team Silent', releaseyear: 1999,
      genre: 'Survival horror', stars: 5, playerCount: 1,
      region: 'eu', lang: 'en', favorite: false, cheevos: true,
      playcount: 5, gametime: 18000, lastplayed: '3 weeks ago', art: 'sh'
    },
    {
      /* publisher only -> grid.xml:283 */
      name: 'Tekken 3', system: 'psx', rom: 'Tekken 3.chd',
      desc: 'The third entry in the fighting series, widely held to be the strongest of the ' +
        'PlayStation generation.',
      publisher: 'Namco', developer: '', releaseyear: 1998,
      genre: 'Fighting', stars: 4, playerCount: 2,
      region: 'eu', lang: 'en', favorite: true, cheevos: false,
      playcount: 21, gametime: 25200, lastplayed: '4 days ago', art: 'tk3'
    },
    {
      /* neither publisher nor developer -> the dim ------------- placeholder,
       * detailed.xml:127 */
      name: 'Klonoa: Door to Phantomile', system: 'psx', rom: 'Klonoa.chd',
      desc: 'A side-scrolling platformer rendered in 3D, in which the player grabs and throws ' +
        'enemies to cross gaps.',
      publisher: '', developer: '', releaseyear: 1997,
      genre: 'Platform', stars: 4, playerCount: 1,
      region: 'eu', lang: 'en', favorite: false, cheevos: false,
      playcount: 3, gametime: 9000, lastplayed: '2 months ago', art: 'klonoa'
    },
    {
      /* stars empty -> detailed.xml:175 hides the star row entirely */
      name: 'Vib-Ribbon', system: 'psx', rom: 'Vib-Ribbon.chd',
      desc: 'A rhythm game that generates its levels from whatever audio CD the player loads.',
      publisher: 'Sony Computer Entertainment', developer: 'NanaOn-Sha', releaseyear: 1999,
      genre: 'Rhythm', stars: 0, playerCount: 1,
      region: 'eu', lang: 'en', favorite: false, cheevos: false,
      playcount: 1, gametime: 1800, lastplayed: '5 months ago', art: 'vib'
    },
    {
      /* tags: finished -> F11E badge, pulsing */
      name: 'Metal Gear Solid', system: 'psx', rom: 'Metal Gear Solid (Disc 1).chd',
      desc: 'Solid Snake infiltrates a nuclear disposal facility seized by a rogue special ' +
        'forces unit.',
      publisher: 'Konami', developer: 'Konami', releaseyear: 1998,
      genre: 'Stealth', stars: 5, playerCount: 1,
      region: 'eu', lang: 'en', favorite: true, cheevos: true,
      multidisc: true, tags: ['finished'],
      playcount: 18, gametime: 72000, lastplayed: '6 days ago',
      art: 'mgs', overlay: 'Metal-Gear'
    },
    {
      /* tags: in progress -> F144 badge */
      name: 'Castlevania: Symphony of the Night', system: 'psx', rom: 'SOTN.chd',
      desc: 'Alucard explores his father\'s castle in an open, upgrade-driven design that ' +
        'named a genre.',
      publisher: 'Konami', developer: 'Konami', releaseyear: 1997,
      genre: 'Action adventure', stars: 5, playerCount: 1,
      region: 'eu', lang: 'en', favorite: true, cheevos: true, tags: ['in progress'],
      playcount: 9, gametime: 32400, lastplayed: 'yesterday', art: 'sotn'
    },
    {
      /* tags: buggy -> F070 badge */
      name: 'Bushido Blade', system: 'psx', rom: 'Bushido Blade.chd',
      desc: 'A weapons fighter with no health bars, in which a single clean strike ends the ' +
        'match.',
      publisher: 'Squaresoft', developer: 'Light Weight', releaseyear: 1997,
      genre: 'Fighting', stars: 3, playerCount: 2,
      region: 'eu', lang: 'en', favorite: false, cheevos: false, tags: ['buggy'],
      playcount: 2, gametime: 3600, lastplayed: '3 months ago', art: 'bushido'
    },
    {
      /* tags: liked -> like badge */
      name: 'Crash Bandicoot', system: 'psx', rom: 'Crash Bandicoot.chd',
      desc: 'A linear 3D platformer built around tight, memorised runs down corridors and ' +
        'along beaches.',
      publisher: 'Sony Computer Entertainment', developer: 'Naughty Dog', releaseyear: 1996,
      genre: 'Platform', stars: 4, playerCount: 1,
      region: 'eu', lang: 'en', favorite: true, cheevos: true, tags: ['liked'],
      playcount: 15, gametime: 28800, lastplayed: '1 week ago',
      art: 'crash', overlay: 'Crash-Bandicoot'
    },
    {
      /* region 'eu,us' -> force-world-flag (grid.xml:356); also kidGame + save state */
      name: 'PaRappa the Rapper', system: 'psx', rom: 'PaRappa.chd',
      desc: 'A rhythm game in paper-thin 2D characters, in which the player answers each ' +
        'teacher\'s line in time.',
      publisher: 'Sony Computer Entertainment', developer: 'NanaOn-Sha', releaseyear: 1996,
      genre: 'Rhythm', stars: 4, playerCount: 1,
      region: 'eu,us', lang: 'en', favorite: false, cheevos: false,
      kidGame: true, hasSaveState: true,
      playcount: 7, gametime: 10800, lastplayed: '2 weeks ago', art: 'parappa'
    },
    {
      /* lang 'en,fr,de' -> the text label instead of a flag (grid.xml:381);
       * gunGame + keyboard mapping + manual; gametime 0 -> gameInfoExNull (top-info.xml:294) */
      name: 'Point Blank', system: 'psx', rom: 'Point Blank.chd',
      desc: 'A light-gun game built from short shooting-gallery minigames rather than a ' +
        'continuous stage.',
      publisher: 'Namco', developer: 'Namco', releaseyear: 1994,
      genre: 'Shooter', stars: 3, playerCount: 2,
      region: 'eu', lang: 'en,fr,de', favorite: false, cheevos: false,
      gunGame: true, hasKeyboardMapping: true, hasManual: true,
      playcount: 0, gametime: 0, lastplayed: 'never', art: 'pointblank'
    }
  ];

  /*
   * A few titles per other system. The psx set above carries the predicate coverage; these
   * exist so every system has a populated gamelist, and so the franchise-cutout matching in
   * _theme_options/gamelist-overlay.xml is demonstrable outside psx (Zelda, on snes).
   */
  var OTHER = [
    { name: 'Super Metroid', system: 'snes', rom: 'Super Metroid.sfc', genre: 'Action adventure',
      publisher: 'Nintendo', developer: 'Nintendo R&D1', releaseyear: 1994, stars: 5,
      desc: 'Samus returns to Zebes to recover the last Metroid, in a map-driven adventure ' +
        'that set the template for the genre.', art: 'metroid' },
    { name: 'The Legend of Zelda: A Link to the Past', system: 'snes', rom: 'Zelda ALTTP.sfc',
      genre: 'Action adventure', publisher: 'Nintendo', developer: 'Nintendo EAD',
      releaseyear: 1991, stars: 5, favorite: true, cheevos: true,
      desc: 'Link travels between a light world and a dark one to rescue the seven maidens ' +
        'and stop Ganon.', art: 'zelda', overlay: 'Zelda' },
    { name: 'Chrono Trigger', system: 'snes', rom: 'Chrono Trigger.sfc', genre: 'Role playing games',
      publisher: 'Squaresoft', developer: 'Squaresoft', releaseyear: 1995, stars: 5,
      favorite: true, desc: 'A party travels across eras to prevent a catastrophe, in a ' +
        'role-playing game built around a branching set of endings.', art: 'chrono' },
    { name: 'GoldenEye 007', system: 'n64', rom: 'GoldenEye 007.z64', genre: 'Shooter',
      publisher: 'Nintendo', developer: 'Rare', releaseyear: 1997, stars: 5, playerCount: 4,
      favorite: true, desc: 'A first-person shooter adapted from the film, remembered as much ' +
        'for its split-screen multiplayer as its campaign.', art: 'goldeneye' },
    { name: 'Super Mario 64', system: 'n64', rom: 'Super Mario 64.z64', genre: 'Platform',
      publisher: 'Nintendo', developer: 'Nintendo EAD', releaseyear: 1996, stars: 5,
      cheevos: true, desc: 'The first 3D Mario, built around open courses and an analogue ' +
        'moveset rather than linear stages.', art: 'mario64' },
    { name: 'Sonic the Hedgehog 2', system: 'megadrive', rom: 'Sonic 2.md', genre: 'Platform',
      publisher: 'Sega', developer: 'Sega Technical Institute', releaseyear: 1992, stars: 4,
      playerCount: 2, favorite: true, desc: 'Sonic and Tails run through zones built for ' +
        'speed, with a spin dash and a split-screen versus mode.', art: 'sonic2' },
    { name: 'Streets of Rage 2', system: 'megadrive', rom: 'Streets of Rage 2.md',
      genre: 'Beat em up', publisher: 'Sega', developer: 'Sega', releaseyear: 1992, stars: 5,
      playerCount: 2, desc: 'A side-scrolling brawler with a widely praised soundtrack.',
      art: 'sor2' },
    { name: 'Metroid Fusion', system: 'gba', rom: 'Metroid Fusion.gba', genre: 'Action adventure',
      publisher: 'Nintendo', developer: 'Nintendo R&D1', releaseyear: 2002, stars: 5,
      favorite: true, cheevos: true, desc: 'Samus, infected by a parasite, works through a ' +
        'research station under the direction of a ship computer.', art: 'fusion' },
    { name: 'Advance Wars', system: 'gba', rom: 'Advance Wars.gba', genre: 'Strategy',
      publisher: 'Nintendo', developer: 'Intelligent Systems', releaseyear: 2001, stars: 4,
      playerCount: 4, desc: 'A turn-based tactics game played on grid maps with unit ' +
        'production and commanding officers.', art: 'advwars' },
    { name: 'Jet Set Radio', system: 'dreamcast', rom: 'Jet Set Radio.chd', genre: 'Action',
      publisher: 'Sega', developer: 'Smilebit', releaseyear: 2000, stars: 4, favorite: true,
      desc: 'Inline skaters tag a stylised Tokyo, in the game that popularised cel-shaded ' +
        'rendering.', art: 'jsr' },
    { name: 'Shenmue', system: 'dreamcast', rom: 'Shenmue (Disc 1).chd', genre: 'Adventure',
      publisher: 'Sega', developer: 'Sega AM2', releaseyear: 1999, stars: 4, multidisc: true,
      desc: 'Ryo investigates his father\'s death across a simulated 1980s Yokosuka.',
      art: 'shenmue' },
    { name: 'Metal Slug', system: 'arcade', rom: 'mslug.zip', genre: 'Run and gun',
      publisher: 'SNK', developer: 'Nazca', releaseyear: 1996, stars: 5, playerCount: 2,
      favorite: true, cheevos: true, desc: 'A hand-animated run-and-gun built around rescuing ' +
        'prisoners and commandeering vehicles.', art: 'mslug' },
    { name: 'Street Fighter II', system: 'arcade', rom: 'sf2.zip', genre: 'Fighting',
      publisher: 'Capcom', developer: 'Capcom', releaseyear: 1991, stars: 5, playerCount: 2,
      desc: 'The fighting game that defined the genre and the arcade competitive scene.',
      art: 'sf2' }
  ];

  /* Fill in the fields the psx entries all carry, so no view has to guard. */
  OTHER.forEach(function (g) {
    if (g.playerCount === undefined) g.playerCount = 1;
    if (g.region === undefined) g.region = 'eu';
    if (g.lang === undefined) g.lang = 'en';
    if (g.favorite === undefined) g.favorite = false;
    if (g.cheevos === undefined) g.cheevos = false;
    if (g.playcount === undefined) g.playcount = 4;
    if (g.gametime === undefined) g.gametime = 12600;
    if (g.lastplayed === undefined) g.lastplayed = '2 weeks ago';
    GAMES.push(g);
  });

  /* ---- generated art -------------------------------------------------
   * The theme ships no per-game art - it is scraped per install - so box art, screenshots and
   * marquees are generated SVG data URIs tinted from the live accent, the same call
   * elementerial made. The reference screenshots show real scraped art; ours is a stand-in
   * and is expected to differ.
   */
  var ART_PALETTE = {
    ff7: ['#1b2a4a', '#4a7bb5'], gt: ['#2a2a30', '#c8462d'],
    sh: ['#2b2723', '#7d6a55'], tk3: ['#3a1f2b', '#b5476a'],
    klonoa: ['#1e3550', '#57b0d8'], vib: ['#1a1a1a', '#e8e8e8'],
    mgs: ['#1f2a24', '#5d7d63'], sotn: ['#241a30', '#8a6bb5'],
    bushido: ['#2a2320', '#b59a6b'], crash: ['#3a2410', '#e8842d'],
    parappa: ['#2d2a12', '#e8d24a'], pointblank: ['#1a2438', '#4a8ad8'],
    metroid: ['#1c2330', '#6b8fb5'], zelda: ['#1b3020', '#5da05e'],
    chrono: ['#2a1f38', '#9a7bc0'], goldeneye: ['#2a2a1f', '#b5a05d'],
    mario64: ['#1f2a4a', '#d84a4a'], sonic2: ['#12244a', '#3ba0e0'],
    sor2: ['#2a1c1c', '#c06a3a'], fusion: ['#2a1f2a', '#c05d8a'],
    advwars: ['#2a2a1c', '#c0b03a'], jsr: ['#1f2a2a', '#3ac0a0'],
    shenmue: ['#242a30', '#7a95b5'], mslug: ['#2a2a20', '#b5a545'],
    sf2: ['#301f1c', '#d0653a']
  };

  function svgUri(svg) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  /* Fanart-shaped placeholder: a soft diagonal gradient plus the title, standing in for a
   * scraped screenshot. */
  PSX.fanart = function (game, w, h) {
    var pal = ART_PALETTE[game.art] || ['#1e2430', '#4a6ea8'];
    var id = 'g' + (game.art || 'x');
    var title = String(game.name).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    return svgUri(
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + pal[0] + '"/><stop offset="1" stop-color="' + pal[1] + '"/>' +
      '</linearGradient></defs>' +
      '<rect width="' + w + '" height="' + h + '" fill="url(#' + id + ')"/>' +
      '<g opacity="0.20" fill="none" stroke="#fff" stroke-width="' + Math.max(1, w / 90) + '">' +
      '<circle cx="' + w * 0.72 + '" cy="' + h * 0.30 + '" r="' + h * 0.30 + '"/>' +
      '<circle cx="' + w * 0.26 + '" cy="' + h * 0.74 + '" r="' + h * 0.22 + '"/>' +
      '</g>' +
      '<rect y="' + h * 0.70 + '" width="' + w + '" height="' + h * 0.30 + '" fill="#000" opacity="0.42"/>' +
      '<text x="' + w * 0.05 + '" y="' + h * 0.87 + '" fill="#ffffff" ' +
      'font-family="Helvetica,Arial,sans-serif" font-size="' + Math.round(h * 0.11) + '" ' +
      'font-weight="600">' + title + '</text>' +
      '</svg>'
    );
  };

  /* Box art: portrait, with a spine, standing in for scraped boxart. */
  PSX.boxart = function (game, w, h) {
    var pal = ART_PALETTE[game.art] || ['#1e2430', '#4a6ea8'];
    var title = String(game.name).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    return svgUri(
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
      '<rect width="' + w + '" height="' + h + '" fill="' + pal[0] + '"/>' +
      '<rect width="' + w * 0.12 + '" height="' + h + '" fill="#000" opacity="0.35"/>' +
      '<rect x="' + w * 0.16 + '" y="' + h * 0.08 + '" width="' + w * 0.76 + '" height="' + h * 0.52 + '" fill="' + pal[1] + '" opacity="0.85"/>' +
      '<text x="' + w * 0.16 + '" y="' + h * 0.74 + '" fill="#ffffff" ' +
      'font-family="Helvetica,Arial,sans-serif" font-size="' + Math.round(h * 0.062) + '" ' +
      'font-weight="700">' + title.slice(0, 22) + '</text>' +
      '<rect y="' + h * 0.93 + '" width="' + w + '" height="' + h * 0.07 + '" fill="#d8d8d8"/>' +
      '</svg>'
    );
  };

  /* Marquee / game logo: the title on transparency. */
  PSX.marquee = function (game, w, h) {
    var title = String(game.name).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    return svgUri(
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
      '<text x="' + w / 2 + '" y="' + h * 0.58 + '" fill="#ffffff" text-anchor="middle" ' +
      'font-family="Helvetica,Arial,sans-serif" font-size="' + Math.round(h * 0.20) + '" ' +
      'font-weight="700" letter-spacing="1">' + title.slice(0, 18) + '</text>' +
      '</svg>'
    );
  };

  /* ---- data predicates -----------------------------------------------
   * Each implements one source expression, cited beside it. These depend on the selected
   * item, which is why they live here and not in layout.js.
   */
  var P = {
    /* <visible>{game:publisher} == {game:developer} && !empty(...) - grid.xml:271 */
    pubEqDev: function (g) {
      return !!g.publisher && !!g.developer && g.publisher === g.developer;
    },
    /* <visible>empty({game:publisher}) && !empty({game:developer}) - grid.xml:275 */
    devOnly: function (g) { return !g.publisher && !!g.developer; },
    /* the mirrored case - grid.xml:283 */
    pubOnly: function (g) { return !!g.publisher && !g.developer; },
    /* neither -> the dim placeholder rows - detailed.xml:127 */
    neither: function (g) { return !g.publisher && !g.developer; },
    /* <visible> on the star row - detailed.xml:175 */
    hasStars: function (g) { return (g.stars || 0) > 0; },
    /* theme.game-hasMultidisc, theme.xml - true when the rom name marks a disc */
    multidisc: function (g) { return !!g.multidisc || /\(Disc \d\)/.test(g.rom || ''); },
    /* force-world-flag when a game claims more than one region - grid.xml:356 */
    worldFlag: function (g) { return String(g.region || '').indexOf(',') !== -1; },
    /* more than one language -> a text label rather than a flag - grid.xml:381 */
    langLabel: function (g) { return String(g.lang || '').indexOf(',') !== -1; },
    /* gameInfoExNull when the game has never been played - top-info.xml:294 */
    neverPlayed: function (g) { return !g.gametime; },
    /* if="{system.name} == 'favorites'" hides the per-tile heart - grid.xml:116 */
    hidesFavorite: function (sys) { return sys.name === 'favorites'; },
    /* if="${system.manufacturer} == 'Collections'" shows the italic chip - ps4-style.xml:216 */
    showsSystemChip: function (sys) { return sys.manufacturer === 'Collections'; },
    /* if="{system.theme} == 'n64' || 'snes' || 'gameandwatch'" - grid.xml:14 */
    gridSpecialCase: function (sys) {
      return ['n64', 'snes', 'gameandwatch'].indexOf(sys.theme) !== -1;
    }
  };

  /* ---- helpers ------------------------------------------------------- */

  /* {game:stars} renders as filled/empty pips. starFill / starUnfill from the colorset. */
  function starsHtml(n) {
    var out = '';
    for (var i = 0; i < 5; i++) {
      out += i < n
        ? '<span style="color:var(--starFill)">★</span>'
        : '<span style="color:var(--starUnfill)">★</span>';
    }
    return out;
  }

  /* "Times Played: N • Game Time: 2h 12m", from the theme's own label strings. */
  function formatGameTime(sec) {
    if (!sec) return '0m';
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    return h ? h + 'h ' + m + 'm' : m + 'm';
  }

  PSX.SYSTEMS = SYSTEMS;
  PSX.GAMES = GAMES;
  PSX.P = P;
  PSX.starsHtml = starsHtml;
  PSX.formatGameTime = formatGameTime;

  PSX.systemByTheme = function (t) {
    return SYSTEMS.filter(function (s) { return s.theme === t; })[0] || SYSTEMS[0];
  };
  PSX.gamesForSystem = function (sys) {
    /* A collection gathers favourites from everywhere; a real system lists its own. */
    if (sys.isCollection) return GAMES.filter(function (g) { return g.favorite; });
    return GAMES.filter(function (g) { return g.system === sys.theme; });
  };
})(window.PlayStationX);
