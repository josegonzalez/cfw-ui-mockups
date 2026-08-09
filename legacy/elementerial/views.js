/*
 * views.js - sample library data and the five view builders.
 *
 * Builders take a resolved layout (layout.js) and return DOM plus the handles
 * the controller needs to move a cursor around. They are shared by the
 * interactive page and the static snapshots, so a static page is just a boot
 * with interactive:false.
 *
 * The theme ships system logos and system backdrops but no per-game artwork,
 * so screenshots and marquees are generated as SVG data URIs. Everything that
 * does exist in the theme - logos, backdrops, the per-scheme no-artwork
 * placeholder, stars, the favourite heart - uses the real asset.
 */
window.Elementerial = window.Elementerial || {};
(function (E) {
  'use strict';

  E.ASSET = '../assets/';

  /* ---- sample library ------------------------------------------------- */

  E.SYSTEMS = [
    { theme: 'nes',       fullName: 'Nintendo Entertainment System', count: 214 },
    { theme: 'snes',      fullName: 'Super Nintendo',                count: 118 },
    { theme: 'gb',        fullName: 'Game Boy',                      count: 73 },
    { theme: 'gbc',       fullName: 'Game Boy Color',                count: 61 },
    { theme: 'gba',       fullName: 'Game Boy Advance',              count: 126 },
    { theme: 'genesis',   fullName: 'Sega Genesis',                  count: 88 },
    { theme: 'psx',       fullName: 'PlayStation',                   count: 41 },
    { theme: 'n64',       fullName: 'Nintendo 64',                   count: 35 },
    { theme: 'dreamcast', fullName: 'Dreamcast',                     count: 27 },
    { theme: 'arcade',    fullName: 'Arcade',                        count: 302 }
  ];

  function g(name, year, genre, players, rating, opts) {
    return Object.assign({
      name: name,
      releasedate: year,
      genre: genre,
      players: players,
      rating: rating,
      developer: '',
      favorite: false,
      noArt: false,
      folder: false,
      desc: ''
    }, opts || {});
  }

  E.GAMES = {
    snes: [
      g('Super Mario World', '1990', 'Platform', '1-2', 1.0, {
        developer: 'Nintendo EAD', favorite: true,
        desc: 'Mario and Luigi set out across Dinosaur Land to rescue Princess Toadstool from Bowser, with Yoshi along for the ride.' }),
      g('The Legend of Zelda: A Link to the Past', '1991', 'Action Adventure', '1', 1.0, {
        developer: 'Nintendo EAD', favorite: true,
        desc: 'Link travels between the Light World and the Dark World to gather the Pendants of Virtue and free Hyrule.' }),
      g('Super Metroid', '1994', 'Action', '1', 1.0, {
        developer: 'Nintendo R&D1',
        desc: 'Samus returns to Zebes to recover the stolen Metroid larva from the Space Pirates.' }),
      g('Chrono Trigger', '1995', 'Role Playing', '1', 1.0, {
        developer: 'Square', favorite: true,
        desc: 'A band of travellers moves through eras to prevent an apocalypse.' }),
      g('Donkey Kong Country', '1994', 'Platform', '1-2', 0.8, { developer: 'Rare' }),
      g('F-Zero', '1990', 'Racing', '1', 0.8, { developer: 'Nintendo EAD' }),
      g('Super Castlevania IV', '1991', 'Platform', '1', 0.8, { developer: 'Konami' }),
      g('Kirby Super Star', '1996', 'Platform', '1-2', 0.9, { developer: 'HAL Laboratory' }),
      g('Secret of Mana', '1993', 'Role Playing', '1-3', 0.9, { developer: 'Square' }),
      g('Star Fox', '1993', 'Shooter', '1', 0.7, { developer: 'Nintendo EAD' }),
      g('Super Punch-Out!!', '1994', 'Sports', '1', 0.7, { developer: 'Nintendo IRD' }),
      g('Teenage Mutant Ninja Turtles IV: Turtles in Time', '1992', 'Beat ’em Up', '1-2', 0.9, {
        developer: 'Konami' }),
      g('Contra III: The Alien Wars', '1992', 'Shooter', '1-2', 0.8, { developer: 'Konami' }),
      g('Mega Man X', '1993', 'Platform', '1', 0.9, { developer: 'Capcom' }),
      g('Earthbound', '1994', 'Role Playing', '1', 0.5, { developer: 'Ape', noArt: true }),
      g('Homebrew', '', '', '', 0, { folder: true }),
      g('Pilotwings', '1990', 'Simulation', '1', 0.5, { developer: 'Nintendo EAD', noArt: true }),
      g('Yoshi’s Island', '1995', 'Platform', '1', 1.0, { developer: 'Nintendo EAD' })
    ],
    nes: [
      g('Super Mario Bros. 3', '1988', 'Platform', '1-2', 1.0, { developer: 'Nintendo R&D4', favorite: true }),
      g('The Legend of Zelda', '1986', 'Action Adventure', '1', 0.9, { developer: 'Nintendo R&D4' }),
      g('Metroid', '1986', 'Action', '1', 0.8, { developer: 'Nintendo R&D1' }),
      g('Mega Man 2', '1988', 'Platform', '1', 1.0, { developer: 'Capcom' }),
      g('Castlevania', '1986', 'Platform', '1', 0.8, { developer: 'Konami' }),
      g('Punch-Out!!', '1987', 'Sports', '1', 0.8, { developer: 'Nintendo IRD' }),
      g('Kirby’s Adventure', '1993', 'Platform', '1', 0.8, { developer: 'HAL Laboratory' }),
      g('Duck Hunt', '1984', 'Shooter', '1-2', 0.5, { developer: 'Nintendo R&D1', noArt: true })
    ],
    gb: [
      g('Tetris', '1989', 'Puzzle', '1-2', 1.0, { developer: 'Nintendo R&D1', favorite: true }),
      g('Super Mario Land', '1989', 'Platform', '1', 0.8, { developer: 'Nintendo R&D1' }),
      g('Pokémon Red', '1996', 'Role Playing', '1', 1.0, { developer: 'Game Freak' }),
      g('The Legend of Zelda: Link’s Awakening', '1993', 'Action Adventure', '1', 1.0, { developer: 'Nintendo EAD' }),
      g('Metroid II: Return of Samus', '1991', 'Action', '1', 0.7, { developer: 'Nintendo R&D1' }),
      g('Kirby’s Dream Land', '1992', 'Platform', '1', 0.7, { developer: 'HAL Laboratory' })
    ],
    gbc: [
      g('Pokémon Crystal', '2000', 'Role Playing', '1', 1.0, { developer: 'Game Freak', favorite: true }),
      g('The Legend of Zelda: Oracle of Ages', '2001', 'Action Adventure', '1', 0.9, { developer: 'Capcom' }),
      g('Wario Land 3', '2000', 'Platform', '1', 0.8, { developer: 'Nintendo R&D1' }),
      g('Shantae', '2002', 'Platform', '1', 0.8, { developer: 'WayForward' }),
      g('Metal Gear Solid', '2000', 'Action', '1', 0.9, { developer: 'Konami' }),
      g('Dragon Warrior III', '2000', 'Role Playing', '1', 0.7, { developer: 'Enix', noArt: true })
    ],
    /* The 1:1 detailed view is the one layout that shows md_description, and
     * its static snapshot uses this system, so every entry carries one. */
    gba: [
      g('Metroid Fusion', '2002', 'Action', '1', 0.9, { developer: 'Nintendo R&D1', favorite: true,
        desc: 'Samus investigates a research station overrun by the parasitic X, hunted by a creature wearing her own stolen suit.' }),
      g('The Legend of Zelda: The Minish Cap', '2004', 'Action Adventure', '1', 0.9, { developer: 'Capcom',
        desc: 'Link shrinks to the size of the Picori to restore the Picori Blade and undo Vaati’s curse on Princess Zelda.' }),
      g('Advance Wars', '2001', 'Strategy', '1-4', 1.0, { developer: 'Intelligent Systems',
        desc: 'Turn-based tactics across Orange Star, Blue Moon, Yellow Comet and Green Earth, each commander with their own power.' }),
      g('Castlevania: Aria of Sorrow', '2003', 'Platform', '1', 1.0, { developer: 'Konami',
        desc: 'Soma Cruz absorbs the souls of the creatures he defeats inside a castle sealed within a solar eclipse.' }),
      g('Metal Slug Advance', '2004', 'Shooter', '1', 0.8, { developer: 'SNK Playmore',
        desc: 'A run-and-gun built for the handheld, with a card system and a life bar in place of one-hit deaths.' }),
      g('Golden Sun', '2001', 'Role Playing', '1', 0.9, { developer: 'Camelot',
        desc: 'Adepts wield Psynergy and collect Djinn to stop alchemy being loosed back upon Weyard.' }),
      g('Mario Kart: Super Circuit', '2001', 'Racing', '1-4', 0.8, { developer: 'Intelligent Systems',
        desc: 'Twenty new circuits plus every track from the original Super Mario Kart, unlocked by collecting coins.' }),
      g('Fire Emblem', '2003', 'Strategy', '1', 0.9, { developer: 'Intelligent Systems',
        desc: 'Lyn, Eliwood and Hector lead a campaign across Elibe where a fallen unit is gone for good.' })
    ],
    genesis: [
      g('Sonic the Hedgehog 2', '1992', 'Platform', '1-2', 1.0, { developer: 'Sega Technical Institute', favorite: true }),
      g('Streets of Rage 2', '1992', 'Beat ’em Up', '1-2', 1.0, { developer: 'Sega AM7' }),
      g('Gunstar Heroes', '1993', 'Shooter', '1-2', 0.9, { developer: 'Treasure' }),
      g('Phantasy Star IV', '1993', 'Role Playing', '1', 0.9, { developer: 'Sega' }),
      g('Ristar', '1995', 'Platform', '1', 0.8, { developer: 'Sega' }),
      g('Comix Zone', '1995', 'Beat ’em Up', '1', 0.7, { developer: 'Sega Technical Institute' })
    ],
    /* Elementflix always shows md_description, and its static snapshot uses
     * this system, so every entry carries one. */
    psx: [
      g('Final Fantasy VII', '1997', 'Role Playing', '1', 1.0, { developer: 'Square', favorite: true,
        desc: 'Cloud Strife joins an eco-terrorist cell against the Shinra Electric Power Company, and finds the planet itself is the thing at stake.' }),
      g('Metal Gear Solid', '1998', 'Action', '1', 1.0, { developer: 'Konami',
        desc: 'Solid Snake infiltrates a nuclear disposal facility on Shadow Moses to stop a rogue special forces unit.' }),
      g('Castlevania: Symphony of the Night', '1997', 'Platform', '1', 1.0, { developer: 'Konami',
        desc: 'Alucard explores his father’s castle in a sprawling, map-driven reinvention of the series.' }),
      g('Gran Turismo 2', '1999', 'Racing', '1-2', 0.9, { developer: 'Polyphony Digital',
        desc: 'Over 650 cars and a licence system that treats driving as something to be studied.' }),
      g('Silent Hill', '1999', 'Adventure', '1', 0.9, { developer: 'Konami',
        desc: 'Harry Mason searches a fog-bound town for his daughter as it slips into a rusted other world.' }),
      g('Crash Bandicoot 3: Warped', '1998', 'Platform', '1', 0.8, { developer: 'Naughty Dog',
        desc: 'Crash and Coco chase crystals across time, with vehicle stages breaking up the corridor platforming.' })
    ],
    n64: [
      g('The Legend of Zelda: Ocarina of Time', '1998', 'Action Adventure', '1', 1.0, { developer: 'Nintendo EAD', favorite: true }),
      g('Super Mario 64', '1996', 'Platform', '1', 1.0, { developer: 'Nintendo EAD' }),
      g('GoldenEye 007', '1997', 'Shooter', '1-4', 0.9, { developer: 'Rare' }),
      g('Mario Kart 64', '1996', 'Racing', '1-4', 0.9, { developer: 'Nintendo EAD' }),
      g('Banjo-Kazooie', '1998', 'Platform', '1', 0.9, { developer: 'Rare' }),
      g('Perfect Dark', '2000', 'Shooter', '1-4', 0.8, { developer: 'Rare' })
    ],
    dreamcast: [
      g('Sonic Adventure', '1998', 'Platform', '1', 0.8, { developer: 'Sonic Team', favorite: true }),
      g('Jet Set Radio', '2000', 'Action', '1', 0.9, { developer: 'Smilebit' }),
      g('Shenmue', '1999', 'Adventure', '1', 0.9, { developer: 'Sega AM2' }),
      g('Crazy Taxi', '1999', 'Racing', '1', 0.8, { developer: 'Hitmaker' }),
      g('Power Stone 2', '2000', 'Fighting', '1-4', 0.8, { developer: 'Capcom' }),
      g('Soulcalibur', '1999', 'Fighting', '1-2', 1.0, { developer: 'Namco' })
    ],
    arcade: [
      g('Metal Slug 3', '2000', 'Shooter', '1-2', 1.0, { developer: 'SNK', favorite: true }),
      g('Street Fighter II Turbo', '1992', 'Fighting', '1-2', 1.0, { developer: 'Capcom' }),
      g('The King of Fighters ’98', '1998', 'Fighting', '1-2', 0.9, { developer: 'SNK' }),
      g('Bubble Bobble', '1986', 'Platform', '1-2', 0.8, { developer: 'Taito' }),
      g('Galaga', '1981', 'Shooter', '1-2', 0.8, { developer: 'Namco' }),
      g('Sunset Riders', '1991', 'Shooter', '1-4', 0.8, { developer: 'Konami' })
    ]
  };

  E.gamesFor = function (systemTheme) {
    return E.GAMES[systemTheme] || E.GAMES.snes;
  };

  /*
   * md_description falls back to the game's own scraped metadata rather than
   * invented prose, so the slot is always populated in elementflix and in the
   * 1:1 detailed view.
   */
  E.describe = function (game) {
    if (game.desc) return game.desc;
    var bits = [game.genre, game.developer, game.releasedate].filter(Boolean);
    return bits.join('  ·  ');
  };

  /* ---- generated placeholder artwork ---------------------------------- */
  /*
   * The theme bundles no per-game art, so these stand in for scraped media.
   * They are drawn in Elementerial's own language - the accent gradient the
   * logo SVGs use, Inter Bold, a soft vignette - and read the live scheme so
   * they re-tint with it.
   */

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  function svgUri(svg) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /*
   * Rating stars, inlined so they can be tinted sectColor. Paths copied
   * verbatim from assets/icons/star.svg and star_border.svg; referencing the
   * files instead would need mask-image, which Chrome CORS-blocks over file://.
   */
  E.STAR_FILLED =
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="m22 9.74-7.19-0.62-2.81-6.62-2.81 6.63-7.19 0.61 5.46 4.73-1.64 7.03 ' +
    '6.18-3.73 6.18 3.73-1.63-7.03z"/></svg>';
  E.STAR_EMPTY =
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="m22 9.74-7.19-0.62-2.81-6.62-2.81 6.63-7.19 0.61 5.46 4.73-1.64 7.03 ' +
    '6.18-3.73 6.18 3.73-1.63-7.03zm-10 6.16-3.76 2.27 1-4.28-3.32-2.88 4.38-0.38 ' +
    '1.7-4.03 1.71 4.04 4.38 0.38-3.32 2.88 1 4.28z"/></svg>';

  function wrap(text, perLine) {
    var words = String(text).split(' ');
    var lines = [];
    var line = '';
    words.forEach(function (w) {
      if ((line + ' ' + w).trim().length > perLine && line) { lines.push(line); line = w; }
      else { line = (line ? line + ' ' : '') + w; }
    });
    if (line) lines.push(line);
    return lines;
  }

  /*
   * A stand-in for md_image and the grid/boxes tile art. Deliberately carries
   * no title: every view that shows this also shows the name via a marquee or
   * a tile caption, so lettering it here would just double up. Instead it is an
   * abstract scene in the scheme's own accent gradient, seeded off the title so
   * each game looks distinct.
   */
  E.screenshot = function (game, accent, sect) {
    var W = 640, H = 360;
    var seed = 0;
    for (var i = 0; i < game.name.length; i++) seed = (seed * 31 + game.name.charCodeAt(i)) % 9973;

    var shapes = '';
    for (var k = 0; k < 5; k++) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      var x = (seed % 100) / 100 * W;
      seed = (seed * 1103515245 + 12345) % 2147483648;
      var y = (seed % 100) / 100 * H;
      seed = (seed * 1103515245 + 12345) % 2147483648;
      var r = 40 + (seed % 90);
      shapes += '<circle cx="' + Math.round(x) + '" cy="' + Math.round(y) + '" r="' + r +
        '" fill="#fff" fill-opacity="0.07"/>';
    }

    return svgUri(
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' +
      '<defs>' +
        '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="' + accent + '"/>' +
          '<stop offset="1" stop-color="' + sect + '"/>' +
        '</linearGradient>' +
        '<radialGradient id="v" cx="0.5" cy="0.45" r="0.75">' +
          '<stop offset="0.55" stop-color="#000" stop-opacity="0"/>' +
          '<stop offset="1" stop-color="#000" stop-opacity="0.4"/>' +
        '</radialGradient>' +
      '</defs>' +
      '<rect width="' + W + '" height="' + H + '" fill="url(#g)"/>' +
      shapes +
      '<rect width="' + W + '" height="' + H + '" fill="url(#v)"/>' +
      '<text x="' + (W - 18) + '" y="' + (H - 16) + '" text-anchor="end" ' +
        'font-family="Inter, sans-serif" font-weight="400" font-size="20" ' +
        'fill="#fff" fill-opacity="0.75">' + esc(game.system || '') + '</text>' +
      '</svg>');
  };

  /* A stand-in for md_marquee - a transparent wordmark, as real marquees are. */
  E.marquee = function (game) {
    var W = 520, H = 200;
    var lines = wrap(game.name, 14).slice(0, 2);
    var start = H / 2 - (lines.length - 1) * 28 + 14;
    var text = lines.map(function (l, i) {
      return '<text x="' + (W / 2) + '" y="' + (start + i * 56) + '" text-anchor="middle" ' +
        'font-family="Inter, sans-serif" font-weight="700" font-size="46" fill="#fff" ' +
        'stroke="rgba(0,0,0,.45)" stroke-width="6" paint-order="stroke">' + esc(l) + '</text>';
    }).join('');
    return svgUri(
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' +
      text + '</svg>');
  };

  /* ---- DOM helpers ----------------------------------------------------- */

  function el(tag, cls, parent) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (parent) parent.appendChild(node);
    return node;
  }
  E.el = el;

  function abs(tag, cls, parent) {
    var node = el(tag, cls, parent);
    node.style.position = 'absolute';
    return node;
  }

  function scrim(parent, kind) {
    return el('div', 'el-scrim el-scrim--' + kind, parent);
  }

  /* ---- shared chrome --------------------------------------------------- */

  /*
   * The help bar strings come from EmulationStation, not the theme, and are
   * transcribed from the reference screenshots. See reference/source-notes.md.
   */
  E.HELP = {
    system: [
      { glyph: 'start', label: 'MENU' },
      { glyph: 'A', label: 'NAVIGATION BAR' },
      { glyph: 'Y', label: 'SEARCH/RANDOM' },
      { glyph: 'X', label: 'NETPLAY' }
    ],
    gamelist: [
      { glyph: 'select', label: 'OPTIONS' },
      { glyph: 'start', label: 'MENU' },
      { glyph: 'A', label: 'BACK' },
      { glyph: 'Y', label: 'SEARCH/RANDOM' }
    ]
  };

  E.buildHelp = function (parent, L, which) {
    var bar = el('div', 'el-help', parent);
    bar.style.left = L.screen.help.left + 'px';
    bar.style.top = L.screen.help.top + 'px';
    bar.style.fontSize = L.screen.help.font + 'px';

    E.HELP[which].forEach(function (item) {
      var span = el('span', null, bar);
      var icon = el('i', null, span);
      if (item.glyph === 'start' || item.glyph === 'select') {
        /* ES draws Start and Select as small pill pictograms, not letters. */
        icon.classList.add('pill');
        icon.textContent = '';
      } else {
        icon.textContent = item.glyph;
      }
      el('b', null, span).textContent = item.label;
    });
    return bar;
  };

  E.buildStatusBar = function (parent, L) {
    var clock = el('div', 'el-clock', parent);
    clock.style.left = L.screen.clock.left + 'px';
    clock.style.top = L.screen.clock.top + 'px';
    clock.style.width = L.screen.clock.width + 'px';
    clock.style.fontSize = L.screen.clock.font + 'px';

    var batt = el('div', 'el-battery', parent);
    batt.style.left = L.screen.battery.left + 'px';
    batt.style.top = L.screen.battery.top + 'px';
    batt.style.gap = L.screen.battery.itemSpacing + 'px';

    ['wifi=on', 'battery=full'].forEach(function (name) {
      var g = el('img', null, batt);
      g.src = E.ASSET + 'icons/screen/' + L.screen.battery.icons + '/' + name + '.svg';
      g.style.width = L.screen.battery.size + 'px';
      g.style.height = L.screen.battery.size + 'px';
    });

    var act = el('div', 'el-activity', parent);
    act.style.left = L.screen.activity.left + 'px';
    act.style.top = L.screen.activity.top + 'px';
    act.style.gap = L.screen.activity.itemSpacing + 'px';
    for (var i = 0; i < 2; i++) {
      var dot = el('span', null, act);
      dot.style.width = L.screen.activity.size + 'px';
      dot.style.height = L.screen.activity.size + 'px';
    }

    return { clock: clock, battery: batt, activity: act };
  };

  /* ---- system / carousel view ------------------------------------------ */

  E.buildSystem = function (layer, L) {
    var cover = el('img', 'el-cover', layer);
    E.place(cover, L.system.cover);
    cover.style.zIndex = -9;

    /*
     * carouselVideo, from the PlayVideo subset. The theme ships no videos and
     * the element sets showSnapshotNoVideo true, so ES draws the system's still
     * instead - which is what this reproduces, at zIndex -8 with the declared
     * 1.5s delay and 1000ms fade.
     */
    var video = el('img', 'el-carousel-video', layer);
    E.place(video, L.system.carouselVideo);
    video.style.zIndex = -8;

    /* The outgoing artwork, drawn just above the incoming one so it can fade
     * out over it. See the extras cross-fade note in elementerial.css. */
    var coverOut = el('img', 'el-cover el-cover--out', layer);
    E.place(coverOut, L.system.cover);
    /* Same z as the live cover; later in DOM order, so it paints on top. */
    coverOut.style.zIndex = -9;

    scrim(layer, 'carousel');

    var carousel = el('div', 'el-carousel', layer);
    carousel.style.left = L.system.carousel.left + 'px';
    carousel.style.top = '0px';
    carousel.style.width = L.system.carousel.width + 'px';
    carousel.style.height = L.system.carousel.height + 'px';

    var strip = el('div', 'el-carousel-strip', carousel);
    var logos = E.SYSTEMS.map(function (sys, i) {
      var slot = el('div', 'el-logo', strip);
      slot.style.width = L.system.carousel.logoW + 'px';
      slot.style.height = L.system.carousel.logoH + 'px';
      slot.style.left = (i * L.system.carousel.pitch) + 'px';
      slot.style.top = L.system.carousel.selTopLeft[1] + 'px';
      var img = el('img', null, slot);
      img.src = E.ASSET + 'logos/' + sys.theme + '.svg';
      img.alt = sys.fullName;
      return slot;
    });

    function placeName(node) {
      node.style.left = L.system.systemName.left + 'px';
      node.style.top = L.system.systemName.top + 'px';
      node.style.width = L.system.systemName.width + 'px';
      node.style.fontSize = L.system.systemName.font + 'px';
      return node;
    }
    var name = placeName(el('div', 'el-system-name', layer));
    /* systemName is extra="true", so it cross-fades with the artwork. */
    var nameOut = placeName(el('div', 'el-system-name el-system-name--out', layer));
    nameOut.style.zIndex = 16;

    var info = el('div', 'el-system-info', layer);
    info.style.left = L.system.systemInfo.left + 'px';
    info.style.top = L.system.systemInfo.top + 'px';
    info.style.width = L.system.systemInfo.width + 'px';
    info.style.fontSize = L.system.systemInfo.font + 'px';

    return {
      cover: cover, coverOut: coverOut, video: video, carousel: carousel,
      strip: strip, logos: logos, name: name, nameOut: nameOut, info: info
    };
  };

  /* ---- shared gamelist background -------------------------------------- */

  /*
   * cover_list is the system backdrop band at zIndex -5, and background_overlay
   * is the single scrim over it at -4. The aspect files swap only the scrim's
   * path per view, so a view gets exactly one background_overlay - the video
   * view's is the top-right window scrim, drawn at zIndex 4 instead.
   */
  function gamelistBackdrop(layer, L, scrimKind) {
    var cover = el('img', 'el-cover-list', layer);
    E.place(cover, L.gamelist.coverList);
    cover.style.zIndex = -5;
    if (scrimKind) scrim(layer, scrimKind);
    return cover;
  }

  function buildList(layer, box, font) {
    var list = el('div', 'el-list', layer);
    list.style.left = box.left + 'px';
    list.style.top = box.top + 'px';
    list.style.width = box.width + 'px';
    list.style.height = box.height + 'px';
    list.style.fontSize = font + 'px';
    var inner = el('div', 'el-list-inner', list);
    return { list: list, inner: inner };
  }

  function fillList(inner, games, box) {
    inner.innerHTML = '';
    return games.map(function (game) {
      var row = el('div', 'el-row', inner);
      row.style.height = box.row + 'px';
      row.style.paddingLeft = box.hMargin + 'px';
      row.style.paddingRight = box.hMargin + 'px';
      el('span', null, row).textContent = game.name;
      return row;
    });
  }
  E.fillList = fillList;

  /* ---- detailed view ---------------------------------------------------- */

  E.buildDetailed = function (layer, L) {
    var cover = gamelistBackdrop(layer, L, 'basic');

    var title = el('div', 'el-logo-text', layer);
    title.style.left = L.gamelist.logoText.left + 'px';
    title.style.top = L.gamelist.logoText.top + 'px';
    title.style.width = L.gamelist.logoText.width + 'px';
    title.style.fontSize = L.gamelist.logoText.font + 'px';
    title.style.transform = 'translateY(-50%)';

    var listParts = buildList(layer, L.detailed.list, L.font.body);

    var marquee = el('img', 'el-md-marquee', layer);
    E.placeContain(marquee, L.detailed.md_marquee);

    var image = el('img', 'el-md-image', layer);
    E.placeContain(image, L.detailed.md_image);

    var rating = el('div', 'el-rating', layer);
    rating.style.left = L.detailed.md_rating.left + 'px';
    rating.style.top = L.detailed.md_rating.top + 'px';
    var stars = [];
    for (var i = 0; i < 5; i++) {
      var star = el('span', null, rating);
      star.innerHTML = E.STAR_EMPTY;
      var svg = star.firstChild;
      svg.setAttribute('width', L.detailed.md_rating.size);
      svg.setAttribute('height', L.detailed.md_rating.size);
      stars.push(star);
    }

    /* Only the 1:1 aspect turns md_description back on (aspect/1-1.xml:54-59). */
    var desc = null;
    if (L.detailed.md_description) {
      desc = el('div', 'el-md-description', layer);
      E.place(desc, L.detailed.md_description);
      desc.style.lineHeight = 1.25;
    }

    return {
      cover: cover, title: title, list: listParts.list, inner: listParts.inner,
      marquee: marquee, image: image, rating: rating, stars: stars, desc: desc
    };
  };

  /* ---- video view ------------------------------------------------------- */

  E.buildVideo = function (layer, L) {
    var cover = gamelistBackdrop(layer, L, null);

    /* minSize is cover-fill, so this one keeps a fixed box. */
    var image = el('img', 'el-md-image', layer);
    E.place(image, L.video.md_image);

    var marquee = el('img', 'el-md-marquee', layer);
    E.placeContain(marquee, L.video.md_marquee);

    /* The diagonal scrim sits at zIndex 4, above the video and below the list. */
    scrim(layer, 'video');

    var title = el('div', 'el-logo-text', layer);
    title.style.left = L.video.logoText.left + 'px';
    title.style.top = L.video.logoText.top + 'px';
    title.style.width = L.video.logoText.width + 'px';
    title.style.fontSize = L.video.logoText.font + 'px';
    title.style.transform = 'translateY(-50%)';

    var listParts = buildList(layer, L.video.list, L.font.body);

    return {
      cover: cover, title: title, list: listParts.list, inner: listParts.inner,
      image: image, marquee: marquee
    };
  };

  /* ---- image grid views ------------------------------------------------- */

  /*
   * ES's imagegrid fills along its scroll axis: with scrollDirection horizontal
   * that is column-major (index i at column floor(i / rows), row i % rows), and
   * with vertical it is row-major. Elementflix is the only view that can be
   * either, via the GridDirection subset.
   */
  function buildTiles(strip, metrics, kind) {
    var tiles = [];
    return {
      render: function (games, opts) {
        strip.innerHTML = '';
        var rowMajor = !!opts.rowMajor;
        tiles = games.map(function (game, i) {
          var col = rowMajor ? i % metrics.cols : Math.floor(i / metrics.rows);
          var row = rowMajor ? Math.floor(i / metrics.cols) : i % metrics.rows;
          var tile = el('div', 'el-tile', strip);
          tile.style.width = metrics.tileW + 'px';
          tile.style.height = metrics.tileH + 'px';
          tile.style.left = (metrics.padding[0] + col * (metrics.tileW + metrics.margin[0])) + 'px';
          tile.style.top = (metrics.padding[1] + row * (metrics.tileH + metrics.margin[1])) + 'px';

          var bg = el('div', 'el-tile-bg', tile);
          bg.style.borderRadius = (opts.selectorRadius || 5) + 'px';

          var art = el('img', 'el-tile-art', tile);
          var pad = opts.tilePadding;
          art.style.left = pad[0] + 'px';
          art.style.top = pad[1] + 'px';
          art.style.width = (metrics.tileW - pad[0] * 2) + 'px';
          art.style.height = (metrics.tileH - pad[1] * 2 -
            (kind === 'grid' ? metrics.tileH * opts.captionHeight : 0)) + 'px';
          art.style.borderRadius = (opts.round * Math.min(metrics.tileW, metrics.tileH)) + 'px';
          /* imageSizeMode -> object-fit, per E.FIT. */
          if (opts.fit) art.style.objectFit = opts.fit;
          if (opts.placeholder) art.style.backgroundImage = "url('" + opts.placeholder + "')";
          if (game.noArt || game.folder) art.removeAttribute('src');

          var marquee = null;
          if (kind === 'boxes') {
            marquee = el('img', 'el-tile-marquee', tile);
          }

          var caption = el('div', 'el-tile-caption', tile);
          if (kind === 'boxes' || kind === 'flix') {
            caption.style.top = (metrics.tileH * opts.captionTop) + 'px';
            caption.style.height = (metrics.tileH * opts.captionHeight) + 'px';
          } else {
            caption.style.top = (metrics.tileH * (1 - opts.captionHeight)) + 'px';
            caption.style.height = (metrics.tileH * opts.captionHeight) + 'px';
            caption.style.paddingLeft = (metrics.tileW * opts.captionPadding) + 'px';
            caption.style.paddingRight = (metrics.tileW * opts.captionPadding) + 'px';
            caption.style.width = (metrics.tileW * opts.captionWidth) + 'px';
            caption.style.left = (metrics.tileW * (1 - opts.captionWidth) / 2) + 'px';
          }
          caption.style.fontSize = opts.captionFont + 'px';
          caption.style.lineHeight = opts.captionLineSpacing;
          caption.textContent = game.name;

          if (game.favorite) {
            var fav = el('img', 'el-tile-fav', tile);
            fav.src = E.ASSET + 'icons/favorite.png';
            fav.style.width = (metrics.tileW * 0.25) + 'px';
            fav.style.left = pad[0] + 'px';
            fav.style.top = pad[1] + 'px';
          }

          return { el: tile, art: art, marquee: marquee, caption: caption, game: game, col: col };
        });
        return tiles;
      },
      tiles: function () { return tiles; }
    };
  }

  E.buildGrid = function (layer, L) {
    var cover = gamelistBackdrop(layer, L, 'basic');

    var title = el('div', 'el-logo-text', layer);
    title.style.left = L.grid.logoText.left + 'px';
    title.style.top = L.grid.logoText.top + 'px';
    title.style.width = L.grid.logoText.width + 'px';
    title.style.fontSize = L.grid.logoText.font + 'px';
    title.style.transform = 'translateY(-50%)';

    var mdName = el('div', 'el-md-name', layer);
    mdName.style.left = L.grid.md_name.left + 'px';
    mdName.style.top = L.grid.md_name.top + 'px';
    mdName.style.width = L.grid.md_name.width + 'px';
    mdName.style.fontSize = L.grid.md_name.font + 'px';
    mdName.style.transform = 'translateY(-50%)';

    var grid = el('div', 'el-grid', layer);
    grid.style.left = L.grid.box.left + 'px';
    grid.style.top = L.grid.box.top + 'px';
    grid.style.width = L.grid.box.width + 'px';
    grid.style.height = L.grid.box.height + 'px';
    var strip = el('div', 'el-grid-strip', grid);

    return {
      cover: cover, title: title, mdName: mdName, grid: grid, strip: strip,
      tiles: buildTiles(strip, L.grid, 'grid')
    };
  };

  /* ---- basic gamelist --------------------------------------------------- */
  /* view-general.xml:80-85 - the detailed layout with a full-width list and no
   * metadata elements at all. */

  E.buildBasic = function (layer, L) {
    var cover = gamelistBackdrop(layer, L, 'basic');

    var title = el('div', 'el-logo-text', layer);
    title.style.left = L.gamelist.logoText.left + 'px';
    title.style.top = L.gamelist.logoText.top + 'px';
    title.style.width = L.gamelist.logoText.width + 'px';
    title.style.fontSize = L.gamelist.logoText.font + 'px';
    title.style.transform = 'translateY(-50%)';

    var listParts = buildList(layer, L.basic.list, L.font.body);

    return {
      cover: cover, title: title,
      list: listParts.list, inner: listParts.inner
    };
  };

  /* ---- elementflix ------------------------------------------------------ */

  E.buildElementflix = function (layer, L) {
    var F = L.elementflix;
    var cover = gamelistBackdrop(layer, L, null);

    var image = el('img', 'el-md-image', layer);
    E.place(image, F.md_image);

    var marquee = el('img', 'el-md-marquee', layer);
    E.placeContain(marquee, F.md_marquee);

    /* Same diagonal scrim as the video view, at zIndex 4. */
    scrim(layer, 'video');

    var desc = el('div', 'el-md-description', layer);
    E.place(desc, F.md_description);
    desc.style.fontSize = F.md_description.font + 'px';
    desc.style.lineHeight = F.md_description.lineSpacing;

    var title = el('div', 'el-logo-text', layer);
    title.style.left = F.logoText.left + 'px';
    title.style.top = F.logoText.top + 'px';
    title.style.width = F.logoText.width + 'px';
    title.style.fontSize = F.logoText.font + 'px';
    title.style.transform = 'translateY(-50%)';

    var grid = el('div', 'el-grid', layer);
    grid.style.left = F.box.left + 'px';
    grid.style.top = F.box.top + 'px';
    grid.style.width = F.box.width + 'px';
    grid.style.height = F.box.height + 'px';
    var strip = el('div', 'el-grid-strip', grid);

    /* Two bgColor edge fades, positioned by origin like any other element. */
    var fades = ['a', 'b'].map(function (which) {
      var f = el('div', 'el-flix-fade', layer);
      var url = 'var(--' + F.fade.asset.replace('.png', '') + ')';
      f.style.width = F.fade.width + 'px';
      f.style.height = F.fade.height + 'px';
      f.style.left = F.fade[which][0] + 'px';
      f.style.top = F.fade[which][1] + 'px';
      f.style.webkitMaskImage = url;
      f.style.maskImage = url;
      if (which === 'b') f.classList.add('is-flipped');
      return f;
    });

    return {
      cover: cover, title: title, desc: desc, image: image, marquee: marquee,
      grid: grid, strip: strip, fades: fades,
      tiles: buildTiles(strip, F, 'flix')
    };
  };

  /* ---- menu ------------------------------------------------------------- */
  /*
   * Entries mirror Batocera's main menu, and the icons are the theme's own
   * menuIcons mapping (view-menu.xml:61-77). Panel geometry is approximated -
   * see E.MENU in layout.js.
   */
  E.MENU_ENTRIES = [
    { group: 'Settings' },
    { icon: 'cog', label: 'System settings' },
    { icon: 'gamepad-square', label: 'Games settings' },
    { icon: 'brush', label: 'User interface settings', value: 'Elementerial' },
    { icon: 'volume-high', label: 'Sound settings', switch: true, on: true },
    { icon: 'gamepad-round', label: 'Controllers settings' },
    { icon: 'wifi-strength-3', label: 'Network settings', value: 'Connected' },
    { group: 'Content' },
    { icon: 'image', label: 'Scraper' },
    { icon: 'trophy', label: 'Retroachievements', switch: true, on: false },
    { icon: 'kodi', label: 'Kodi media center', button: 'Launch' },
    { group: 'System' },
    { icon: 'update', label: 'Updates and downloads' },
    { icon: 'library-shelves', label: 'Advanced settings' },
    { icon: 'restart', label: 'Restart system' },
    { icon: 'power', label: 'Shutdown' },
    { icon: 'exit-to-app', label: 'Quit' }
  ];

  E.buildMenu = function (layer, L) {
    var M = L.menu;
    el('div', 'el-menu-shade', layer);

    /*
     * Size the panel to a whole number of entries. ES scrolls its menu; the
     * mockup shows a fixed window instead, and clipping mid-row would read as
     * a rendering fault rather than a design.
     */
    var available = M.maxHeight - M.titleHeight - M.footerHeight;
    var used = 0;
    var shown = 0;
    for (var n = 0; n < E.MENU_ENTRIES.length; n++) {
      var h = E.MENU_ENTRIES[n].group ? M.groupHeight : M.rowHeight;
      if (used + h > available) break;
      used += h;
      shown++;
    }
    var panelHeight = M.titleHeight + used + M.footerHeight;

    var panel = el('div', 'el-menu-panel', layer);
    panel.style.width = M.width + 'px';
    panel.style.left = M.left + 'px';
    panel.style.borderRadius = M.radius + 'px';
    panel.style.height = panelHeight + 'px';
    panel.style.top = ((L.h - panelHeight) / 2) + 'px';

    var title = el('div', 'el-menu-title', panel);
    title.textContent = 'MAIN MENU';
    title.style.height = M.titleHeight + 'px';
    title.style.fontSize = M.titleFont + 'px';
    title.style.paddingLeft = M.padding + 'px';
    title.style.paddingRight = M.padding + 'px';

    var list = el('div', 'el-menu-list', panel);
    var rows = [];

    E.MENU_ENTRIES.slice(0, shown).forEach(function (entry) {
      if (entry.group) {
        var g = el('div', 'el-menu-group', list);
        g.textContent = entry.group;
        g.style.height = M.groupHeight + 'px';
        g.style.fontSize = M.groupFont + 'px';
        g.style.paddingLeft = M.padding + 'px';
        g.style.paddingRight = M.padding + 'px';
        return;
      }

      var row = el('div', 'el-menu-row', list);
      row.style.height = M.rowHeight + 'px';
      row.style.fontSize = M.rowFont + 'px';
      row.style.paddingLeft = M.padding + 'px';
      row.style.paddingRight = M.padding + 'px';
      row.style.gap = (M.padding * 0.5) + 'px';

      /* Mask sources come from masks.css as data URIs; see the note there. */
      var icon = el('span', 'el-menu-icon', row);
      var url = 'var(--icon-' + entry.icon + ')';
      icon.style.width = M.icon + 'px';
      icon.style.height = M.icon + 'px';
      icon.style.webkitMaskImage = url;
      icon.style.maskImage = url;

      el('span', 'label', row).textContent = entry.label;

      if (entry.switch) {
        var sw = el('img', 'el-menu-switch', row);
        sw.src = E.ASSET + (entry.on ? 'switch-on.svg' : 'switch-off.svg');
        sw.style.height = (M.rowFont * 1.25) + 'px';
      } else if (entry.button) {
        var btn = el('span', 'el-menu-button', row);
        btn.textContent = entry.button;
        btn.style.fontSize = (M.rowFont * 0.8) + 'px';
        btn.style.padding = '0 ' + (M.padding * 0.5) + 'px';
        btn.style.height = (M.rowFont * 1.5) + 'px';
      } else if (entry.value) {
        el('span', 'value', row).textContent = entry.value;
      }

      rows.push(row);
    });

    var footer = el('div', 'el-menu-footer', panel);
    footer.textContent = 'ELEMENTERIAL';
    footer.style.height = M.footerHeight + 'px';
    footer.style.fontSize = M.footerFont + 'px';
    footer.style.paddingLeft = M.padding + 'px';
    footer.style.paddingRight = M.padding + 'px';

    return { panel: panel, list: list, rows: rows, footer: footer };
  };

  E.buildBoxes = function (layer, L) {
    var cover = gamelistBackdrop(layer, L, 'basic');

    var title = el('div', 'el-logo-text', layer);
    title.style.left = L.grid.logoText.left + 'px';
    title.style.top = L.grid.logoText.top + 'px';
    title.style.width = L.grid.logoText.width + 'px';
    title.style.fontSize = L.grid.logoText.font + 'px';
    title.style.transform = 'translateY(-50%)';

    var mdName = el('div', 'el-md-name', layer);
    mdName.style.left = L.grid.md_name.left + 'px';
    mdName.style.top = L.grid.md_name.top + 'px';
    mdName.style.width = L.grid.md_name.width + 'px';
    mdName.style.fontSize = L.grid.md_name.font + 'px';
    mdName.style.transform = 'translateY(-50%)';

    var grid = el('div', 'el-grid', layer);
    grid.style.left = L.boxes.box.left + 'px';
    grid.style.top = L.boxes.box.top + 'px';
    grid.style.width = L.boxes.box.width + 'px';
    grid.style.height = L.boxes.box.height + 'px';
    var strip = el('div', 'el-grid-strip', grid);

    return {
      cover: cover, title: title, mdName: mdName, grid: grid, strip: strip,
      tiles: buildTiles(strip, L.boxes, 'boxes')
    };
  };
})(window.Elementerial);
