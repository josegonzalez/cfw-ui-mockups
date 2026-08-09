/*
 * playstation-x.js - the controller.
 *
 * Builds a view's DOM once from the resolved layout, then drives focus by firing storyboard
 * events at bound elements. All motion lives in storyboard.js; nothing here animates directly
 * except two plain strip translations, which the source expresses as list scrolling rather
 * than as a storyboard.
 *
 *   PlayStationX.boot(root, {
 *     device, view, colorset, secondary, carouselType, carouselSize, topInfo,
 *     system, interactive, chrome
 *   })
 *
 * interactive:false suppresses key handling and the clock, and routes every storyboard call
 * through settle() instead of play() - which is how the static per-screen snapshots are
 * produced from exactly the same code as the live build.
 *
 * We deliberately do NOT load shared/nav.js: it models neither held buttons nor per-view
 * cursor behaviour. The key table below is the repo-standard one, reproduced verbatim so the
 * device frame behaves the same across every mockup set.
 */
window.PlayStationX = window.PlayStationX || {};

(function (PSX) {
  'use strict';

  /* Repo-standard key map. Identical table in vitrolauncher and elementerial. */
  var KEYS = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    z: 'a', Z: 'a', x: 'b', X: 'b', Backspace: 'b',
    a: 'x', A: 'x', s: 'y', S: 'y',
    Enter: 'start', q: 'l', Q: 'l', w: 'r', W: 'r', Escape: 'menu'
  };

  /* Mockup-only keys, deliberately outside the device map so they can never be taken for
   * device buttons: [ ] view, , . carousel type, \ colorset, - = carousel size, ; animations,
   * / system. */
  var CHROME_KEYS = {
    '[': ['view', -1], ']': ['view', 1],
    ',': ['carousel-type', -1], '.': ['carousel-type', 1],
    '\\': ['colorset', 1],
    '-': ['carousel', -1], '=': ['carousel', 1],
    ';': ['animations', 1],
    '/': ['system', 1],
    "'": ['secondary_colorset', 1]
  };

  var VIEWS = ['system', 'ps4Style', 'ps5Style', 'detailed', 'grid', 'carousel',
               'fullGrid', 'single', 'mediaTester', 'splash', 'gamesplash'];

  var VIEW_LABEL = {
    system: 'System', ps4Style: 'PS4 Style', ps5Style: 'PS5 Style', detailed: 'Detailed',
    grid: 'Grid', carousel: 'Horizontal Carousel', fullGrid: 'Full Grid',
    single: 'Game by game', mediaTester: 'Media tester', splash: 'Boot splash',
    gamesplash: 'Game launch'
  };

  function el(tag, cls, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
  }

  function place(e, box) {
    if (!box) return e;
    if (box.left !== undefined) e.style.left = box.left + 'px';
    if (box.top !== undefined) e.style.top = box.top + 'px';
    if (box.w !== undefined) e.style.width = box.w + 'px';
    if (box.h !== undefined) e.style.height = box.h + 'px';
    if (box.font !== undefined) e.style.fontSize = box.font + 'px';
    if (box.z !== undefined) e.style.zIndex = box.z;
    return e;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  }

  /*
   * maxSize is a BOUNDING BOX the image letterboxes inside, not a size. For a square asset
   * (pictos, flags, avatars, cover tiles) the real drawn size is min(maxW, maxH) - using the
   * full box instead makes elements overlap their neighbours, because maxW is a fraction of
   * width and maxH a fraction of height, and at 16:9 those differ by nearly 2x.
   */
  function square(e, box) {
    var s = Math.min(box.maxW !== undefined ? box.maxW : box.w,
                     box.maxH !== undefined ? box.maxH : box.h);
    e.style.width = s + 'px';
    e.style.height = s + 'px';
    return e;
  }

  /*
   * ES centres a text element vertically inside its authored box. Two cases:
   *
   *  - The box has a real height (the whole top bar - infoText is `size 0.387 0.05`, username
   *    `0.165 0.04`). Keep the box and centre the line in it. Getting this wrong lifts every
   *    string by half a line, which is enough to visibly break alignment against the pictos
   *    sitting beside them.
   *  - The height is authored as ~0 (system_name is `size 0.6 0.001`). There is no box to
   *    centre in, so centre on the y itself.
   */
  function textLine(e, box, align) {
    var fs = box.font || 16;
    var lh = Math.ceil(fs * 1.25);
    if (box.h !== undefined && box.h >= lh * 0.5) {
      e.style.top = box.top + 'px';
      e.style.height = box.h + 'px';
    } else {
      e.style.top = (box.top - lh / 2) + 'px';
      e.style.height = lh + 'px';
    }
    e.style.display = 'flex';
    e.style.alignItems = 'center';
    if (align) e.style.justifyContent = align;
    e.style.whiteSpace = 'nowrap';
    return e;
  }

  /* ------------------------------------------------------------------ */

  function Theme(root, opts) {
    this.root = root;
    this.opts = opts || {};
    this.device = this.opts.device || 'trimui-smart-pro';
    this.interactive = this.opts.interactive !== false;
    this.animate = this.interactive && this.opts.animate !== false;
    this.showChrome = !!this.opts.chrome;

    this.state = {
      colorset: this.opts.colorset || 'blue',
      secondary_colorset: this.opts.secondary || 'default',
      'carousel-type': this.opts.carouselType || 'PS5',
      carousel: this.opts.carouselSize || 'medium',
      'top-info': this.opts.topInfo || 'default'
    };

    var dev = PSX.DEVICES[this.device];
    this.view = this.opts.view || dev.defaultView;
    this.systemIndex = Math.max(0, PSX.SYSTEMS.findIndex(function (s) {
      return s.theme === (opts && opts.system ? opts.system : 'psx');
    }));
    this.cursor = 0;

    this.rebuild(true);
    if (this.interactive) this.wireInput();
    if (this.showChrome) this.buildChrome();
  }

  Theme.prototype.system = function () { return PSX.SYSTEMS[this.systemIndex]; };

  /*
   * Never returns undefined. An empty gamelist is a real state in ES - the Start pill's own
   * visible= expression is `{system:total} > 0` - so the views must render without a game
   * rather than throw.
   */
  Theme.prototype.game = function () {
    return this.games[this.cursor] || this.games[0] || null;
  };

  /* Full rebuild: re-resolve geometry, rebuild the DOM, restore view and cursor. Used on any
   * geometry-changing chrome toggle. */
  Theme.prototype.rebuild = function (first) {
    this.L = PSX.resolve(this.device, this.state);
    this.ctx = { w: this.L.w, h: this.L.h };
    this.games = PSX.gamesForSystem(this.system());
    if (this.cursor >= this.games.length) this.cursor = 0;
    this.build();
    if (!first && this.chromeEl) this.buildChrome();
  };

  Theme.prototype.build = function () {
    var stage = this.stage;
    if (!stage) {
      this.root.innerHTML = '';
      this.root.classList.add('psx');
      stage = this.stage = el('div', 'psx-stage', this.root);
      stage.style.position = 'absolute';
      stage.style.inset = '0';
    }
    stage.innerHTML = '';

    PSX.applyColors(this.root, this.state.colorset, this.state.secondary_colorset);

    var sys = this.system();
    this.root.style.setProperty('--lineaFrom', sys.linea[0]);
    this.root.style.setProperty('--lineaTo', sys.linea[1]);

    var v = this.view;
    if (v === 'splash') { this.buildSplash(); return; }
    if (v === 'gamesplash') { this.buildGamesplash(); return; }

    this.buildBackground();

    if (v === 'system') this.buildSystem();
    else if (v === 'ps4Style') this.buildPs4Style();
    else if (v === 'ps5Style') this.buildPs5Style();
    else if (v === 'detailed') this.buildDetailed();
    else if (v === 'grid') this.buildGrid();
    else if (v === 'carousel') this.buildCarousel();
    else if (v === 'fullGrid') this.buildFullGrid();
    else if (v === 'single') this.buildSingle();
    else if (v === 'mediaTester') this.buildMediaTester();

    this.buildTopInfo();
    this.buildBottomChrome();
    this.setCursor(this.cursor, null);
  };

  /* ---- shared layers -------------------------------------------------- */

  Theme.prototype.buildBackground = function () {
    var sys = this.system();
    var isSystemView = this.view === 'system';

    var bg = el('img', 'psx-bg', this.stage);
    bg.src = PSX.ASSET + 'background/' + sys.theme + '.jpg';
    bg.alt = '';
    bg.style.zIndex = 45;
    PSX.SB.bind(bg, PSX.STORYBOARDS[isSystemView ? 'background-system' : 'background-gamelist'], this.ctx);
    this.bgEl = bg;

    /* Each view names its own scrim. front.xml uses overlay-systemview (and a PS3 variant);
     * ps4Style and single use overlay-single; grid/carousel use overlay-carousel;
     * detailed and full-grid use overlay-full-grid. */
    var scrim = 'overlay-single';
    if (isSystemView) {
      scrim = this.state['carousel-type'] === 'PS3' ? 'overlay-systemview-ps3' : 'overlay-systemview';
    } else if (this.view === 'grid' || this.view === 'carousel') {
      scrim = 'overlay-carousel';
    } else if (this.view === 'detailed' || this.view === 'fullGrid' || this.view === 'mediaTester') {
      scrim = 'overlay-full-grid';
    }
    var ov = el('img', 'psx-overlay', this.stage);
    ov.src = PSX.ASSET + 'overlays/' + scrim + '.png';
    ov.alt = '';
    ov.style.zIndex = 50;

    /* Character cutout. In the system view it is per-system art; in gamelists it is matched
     * to the game by name, the way gamelist-overlay.xml does with contains(lower(name),...). */
    var src = null;
    if (isSystemView) {
      if (sys.hasOverlayArt !== false) {
        src = PSX.ASSET + 'overlay-arts/systems/' + sys.theme + '.png';
      }
    } else {
      var g = this.game();
      if (g && g.overlay) src = PSX.ASSET + 'overlay-arts/' + g.overlay + '.png';
    }
    if (src) {
      var art = el('img', 'psx-overlay-art', this.stage);
      art.src = src;
      art.alt = '';
      art.style.zIndex = isSystemView ? this.L.system.overlayArt.z : this.L.ps4Style.overlayArt.z;
      PSX.SB.bind(art, PSX.STORYBOARDS['overlay-arts'], this.ctx);
      this.overlayArtEl = art;
    } else {
      this.overlayArtEl = null;
    }
  };

  Theme.prototype.buildBottomChrome = function () {
    var L = this.L;

    place(el('div', 'psx-pie', this.stage), L.pieBarra).style.zIndex = L.pieBarra.z;
    place(el('div', 'psx-linea', this.stage), L.lineaInferior).style.zIndex = L.lineaInferior.z;

    var help = place(el('div', 'psx-help', this.stage), L.help);
    help.style.zIndex = 99;
    var prompts = this.view === 'system'
      ? [['START', 'MENU'], ['□', 'SEARCH/RANDOM'], ['△', 'NETPLAY'], ['✕', 'SELECT'], ['✛', 'CHOOSE']]
      : [['SELECT', 'OPTIONS'], ['START', 'MENU'], ['○', 'BACK'], ['□', 'SEARCH/RANDOM'],
         ['△', 'GAME OPTIONS'], ['✕', 'LAUNCH']];
    prompts.forEach(function (p) {
      var wrap = el('span', null, help);
      wrap.style.display = 'inline-flex';
      wrap.style.alignItems = 'center';
      var gl = el('span', 'glyph', wrap);
      gl.textContent = p[0];
      if (p[0].length > 2) {
        gl.style.borderRadius = '0.5em';
        gl.style.width = 'auto';
        gl.style.padding = '0 0.4em';
        gl.style.fontSize = '0.62em';
      }
      el('span', null, wrap).textContent = p[1];
    });

    /* Region tag - hidden entirely on tinyScreen (theme.xml:469). */
    if (L.region.visible !== false) {
      var reg = place(el('div', null, this.stage), L.region);
      reg.style.position = 'absolute';
      reg.style.textAlign = 'right';
      reg.style.color = '#aaaaaa';
      reg.style.fontFamily = "'SST', sans-serif";
      reg.style.zIndex = L.region.z;
      reg.textContent = 'EU';
    }

    /* ROM folder chip, system view only. front.xml */
    if (this.view === 'system') {
      var gf = place(el('img', 'psx-img', this.stage), L.system.gamefolder);
      gf.src = PSX.ASSET + 'images/gamefolder.png';
      gf.alt = '';
      gf.style.zIndex = L.system.gamefolder.z;
      var sf = place(el('div', 'psx-el psx-glow', this.stage), L.system.systemFolder);
      sf.style.fontFamily = "'SST', sans-serif";
      sf.style.zIndex = L.system.systemFolder.z;
      sf.textContent = '/' + this.system().theme;
    }
  };

  /* ---- top info bar ---------------------------------------------------
   * _theme_views/top-info.xml. The two stacked ticker blocks share one grid cell and
   * cross-fade forever on a 5350ms loop - the most visible ambient motion in the chrome.
   */
  Theme.prototype.buildTopInfo = function () {
    var T = this.L.topInfo;
    var top = el('div', 'psx-top', this.stage);
    top.style.zIndex = 99;
    var sys = this.system();
    var isSystemView = this.view === 'system';

    /* Left slot: the frontend logo in the system view, the system cover art in gamelists. */
    if (isSystemView) {
      var logo = place(el('img', 'psx-img', top), T.frontendLogo);
      logo.src = PSX.ASSET + 'frontend/Batocera-logo.svg';
      logo.alt = 'Batocera';
      PSX.SB.bind(logo, PSX.STORYBOARDS['frontend-logo'], this.ctx);
      this.frontendLogoEl = logo;
    } else if (T.caratulaTop.visible !== false) {
      /* Square cover art in a maxSize box that is much wider than it is tall - fit it square
       * so it sits at the authored left edge rather than floating centred in the box. */
      var cover = square(place(el('img', 'psx-img', top), T.caratulaTop), T.caratulaTop);
      cover.src = PSX.caratula(sys.theme, this.state.colorset);
      cover.alt = '';
      if (this.state['carousel-type'] === 'PS5') cover.style.borderRadius = '15%';
      PSX.SB.bind(cover, PSX.STORYBOARDS['caratula-top'], this.ctx);
      this.caratulaTopEl = cover;
    }

    if (T.plusPicto.visible !== false) {
      var plus = square(place(el('img', 'psx-img', top), T.plusPicto), T.plusPicto);
      plus.src = PSX.ASSET + 'images/plus-picto-bato.svg';
      plus.alt = '';
    }

    var info = square(place(el('img', 'psx-img', top), T.infoPicto), T.infoPicto);
    info.src = PSX.ASSET + 'images/info-picto.svg';
    info.alt = '';

    /* The rotating ticker. Two blocks, same box, opposite phase. */
    var ticker = textLine(place(el('div', 'psx-ticker', top), T.infoText), T.infoText);
    ticker.style.display = 'grid';
    ticker.style.alignItems = 'center';
    ticker.style.fontSize = T.infoText.font + 'px';
    var a = el('div', 'txt psx-glow', ticker);
    var b = el('div', 'txt psx-glow', ticker);
    a.style.position = 'static';
    b.style.position = 'static';

    if (isSystemView) {
      a.textContent = sys.total + ' Games  •  ' + sys.favorites + ' Favorites  •  ' +
        sys.gamesPlayed + ' Played';
      b.textContent = 'Most played: ' + sys.mostPlayed;
    } else {
      var g = this.game();
      /* gameInfoExNull replaces the ticker when the game has never been played -
       * top-info.xml:294. */
      if (g && PSX.P.neverPlayed(g)) {
        a.textContent = 'Times Played: 0';
        b.textContent = 'Last Played: never';
      } else if (g) {
        a.textContent = 'Times Played: ' + g.playcount + '  •  Game Time: ' +
          PSX.formatGameTime(g.gametime);
        b.textContent = 'Last Played: ' + g.lastplayed;
      }
    }
    PSX.SB.bind(a, PSX.STORYBOARDS['systemInfoEx'], this.ctx);
    PSX.SB.bind(b, PSX.STORYBOARDS['systemInfoEx2'], this.ctx);
    this.tickerA = a;
    this.tickerB = b;

    if (T.version.visible !== false) {
      var ver = textLine(place(el('div', 'txt', top), T.version), T.version);
      ver.textContent = 'v.43';
      ver.style.fontSize = T.version.font + 'px';

      /* punto-azul is the separator dot immediately left of the version, centred on it. */
      var dotSize = 0.011 * this.L.w;
      var dot = el('img', 'psx-img', top);
      dot.src = PSX.ASSET + 'images/punto-azul.png';
      dot.alt = '';
      dot.style.left = (T.version.left - dotSize * 1.35) + 'px';
      dot.style.top = (T.version.top + (T.version.h - dotSize) / 2) + 'px';
      dot.style.width = dotSize + 'px';
      dot.style.height = dotSize + 'px';
    }

    var av = square(place(el('img', 'psx-img', top), T.avatar), T.avatar);
    av.src = PSX.ASSET + 'avatars/custom-avatar.png';
    av.alt = '';
    av.style.borderRadius = '50%';
    av.style.objectFit = 'cover';

    var user = textLine(place(el('div', 'txt psx-glow', top), T.username), T.username);
    user.textContent = 'pajarorrojo';
    user.style.fontSize = T.username.font + 'px';

    var tr = square(place(el('img', 'psx-img', top), T.trophy), T.trophy);
    tr.src = PSX.ASSET + 'images/trophy-picto.svg';
    tr.alt = '';
    /* cheevosOnColor F3C300 - the trophy is gold when achievements are on. */
    tr.style.filter = 'invert(70%) sepia(90%) saturate(1400%) hue-rotate(1deg) brightness(1.05)';
    PSX.SB.bind(tr, PSX.STORYBOARDS['cheevos-icon'], this.ctx);
    this.trophyEl = tr;

    if (T.starPicto.visible !== false) {
      var st = square(place(el('img', 'psx-img', top), T.starPicto), T.starPicto);
      st.src = PSX.ASSET + 'images/star-picto.png';
      st.alt = '';
    }
    if (T.year.visible !== false) {
      var yr = textLine(place(el('div', 'txt', top), T.year), T.year);
      yr.textContent = '2026';
      yr.style.fontFamily = "'SST', sans-serif";
      yr.style.fontSize = T.year.font + 'px';
    }

    var clock = textLine(place(el('div', 'txt', top), T.clock), T.clock, 'flex-end');
    clock.style.fontSize = T.clock.font + 'px';
    this.clockEl = clock;
    this.tickClock();
    if (this.interactive && !this._clockTimer) {
      var self = this;
      this._clockTimer = setInterval(function () { self.tickClock(); }, 20000);
    }
  };

  Theme.prototype.tickClock = function () {
    if (!this.clockEl) return;
    var d = new Date();
    this.clockEl.textContent =
      String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  };

  /* ---- system view ---------------------------------------------------- */

  Theme.prototype.buildSystem = function () {
    var L = this.L.system;
    var C = L.carousel;
    var self = this;

    var strip = el('div', 'psx-strip', this.stage);
    strip.style.position = 'absolute';
    strip.style.left = C.left + 'px';
    strip.style.top = C.top + 'px';
    strip.style.height = C.h + 'px';
    strip.style.zIndex = C.z;
    strip.style.transition = 'transform 600ms cubic-bezier(0,0,0.58,1)';
    this.sysStripEl = strip;

    /* Tile pitch: the tile edge plus the gap the scaled selection needs. */
    var pitch = C.tile * 1.08;
    this.sysTiles = [];
    PSX.SYSTEMS.forEach(function (s, i) {
      var t = el('div', 'psx-systile', strip);
      t.style.left = (i * pitch) + 'px';
      t.style.width = C.tile + 'px';
      t.style.height = C.tile + 'px';
      if (C.roundCorners) t.style.borderRadius = (C.roundCorners * 100) + '%';
      var img = el('img', null, t);
      img.src = PSX.caratula(s.theme, self.state.colorset);
      img.alt = s.fullName;
      /* PS3 uses the desaturated icon set; we approximate with a saturation filter, since we
       * did not copy the 351-file iconset. carousel-ps3.xml sets <saturation>0</saturation>. */
      if (self.state['carousel-type'] === 'PS3') img.style.filter = 'saturate(0)';
      self.sysTiles.push(t);
    });
    this.sysPitch = pitch;

    /* Selection frame: PS4 ships an isometric PNG; PS5 draws a rounded white rect. */
    var marco;
    if (this.state['carousel-type'] === 'PS5') {
      marco = el('div', 'psx-marco psx-marco--ps5', this.stage);
      marco.style.borderRadius = '15%';
    } else {
      marco = el('img', 'psx-marco', this.stage);
      marco.src = PSX.ASSET + 'images/marco-activo-iso.png';
      marco.alt = '';
    }
    marco.style.left = L.marcoActivo.left + 'px';
    marco.style.top = L.marcoActivo.top + 'px';
    marco.style.width = L.marcoActivo.w + 'px';
    marco.style.height = L.marcoActivo.h + 'px';
    marco.style.zIndex = L.marcoActivo.z;
    PSX.SB.bind(marco, PSX.STORYBOARDS['marco-activo'], this.ctx);
    this.marcoEl = marco;

    var start = place(el('div', 'psx-start', this.stage), L.start);
    start.textContent = 'Start';
    PSX.SB.bind(start, PSX.STORYBOARDS['start'], this.ctx);
    this.startEl = start;

    var name = place(el('div', 'psx-el psx-glow', this.stage), L.systemName);
    name.style.fontFamily = "'SST Light', 'SST', sans-serif";
    name.style.fontWeight = 300;
    name.style.zIndex = L.systemName.z;
    textLine(name, L.systemName);
    PSX.SB.bind(name, PSX.STORYBOARDS['system_name'], this.ctx);
    this.sysNameEl = name;

    var data = place(el('div', 'psx-row', this.stage), L.systemData);
    data.style.gap = (L.systemData.separator * this.L.w) + 'px';
    this.sysDataEl = data;

    var desc = place(el('div', 'psx-desc psx-glow', this.stage), L.systemDesc);
    PSX.SB.bind(desc, PSX.STORYBOARDS['system_description'], this.ctx);
    this.sysDescEl = desc;

    var sys = this.system();
    if (sys.hasConsole) {
      var con = place(el('img', 'psx-img', this.stage), L.console);
      con.src = PSX.ASSET + 'consoles/' + sys.theme + '.png';
      con.alt = '';
      con.style.zIndex = L.console.z;
      con.style.objectPosition = 'bottom';
      PSX.SB.bind(con, PSX.STORYBOARDS['system-console'], this.ctx);
      this.consoleEl = con;
    }
    if (sys.hasLogo) {
      var lg = place(el('img', 'psx-img', this.stage), L.logo2);
      lg.src = PSX.ASSET + 'logos/' + sys.theme + (sys.isCollection ? '.png' : '.svg');
      lg.alt = '';
      lg.style.zIndex = L.logo2.z;
      this.logo2El = lg;
    }
  };

  Theme.prototype.renderSystem = function () {
    var sys = this.system();
    this.sysNameEl.textContent = sys.fullName;
    this.sysDescEl.textContent = sys.description;
    var bits = ['<span>' + esc(String(sys.hardwareType).toUpperCase()) + '</span>'];
    if (sys.releaseYear) {
      bits.push('<span>&bull;</span>', '<span>' + sys.releaseYear + '</span>');
    }
    bits.push('<span>&bull;</span>',
      '<span>' + esc(String(sys.manufacturer).toUpperCase()) + '</span>');
    this.sysDataEl.innerHTML = bits.join(' ');

    var C = this.L.system.carousel;
    this.sysTiles.forEach(function (t, j) {
      var sel = j === this.systemIndex;
      t.classList.toggle('is-selected', sel);
      t.style.transform = sel ? 'scale(' + C.scale + ')' : 'scale(1)';
      t.style.opacity = sel ? 1 : C.minLogoOpacity;
      t.style.zIndex = sel ? 3 : 1;
    }, this);

    /*
     * Scroll so the selected tile lands under the frame. The strip's own left is the
     * carousel's authored (negative) x, and the frame sits at marcoActivo's authored x, so
     * the shift is the gap between them minus the tile's own offset in the strip.
     */
    var M = this.L.system.marcoActivo;
    var shift = (M.left - this.L.system.carousel.left) - this.systemIndex * this.sysPitch;
    /* Centre the tile within the frame - the frame is the scaled footprint, the tile is not. */
    shift += (M.w - C.tile) / 2;
    this.sysStripEl.style.transform = 'translateX(' + shift + 'px)';
  };

  /* ---- ps4Style ------------------------------------------------------- */

  Theme.prototype.buildPs4Style = function () {
    var L = this.L.ps4Style;
    var gg = L.gamegrid;
    var self = this;

    var strip = el('div', 'psx-strip', this.stage);
    strip.style.position = 'absolute';
    strip.style.left = gg.left + 'px';
    strip.style.top = gg.top + 'px';
    strip.style.height = gg.h + 'px';
    strip.style.zIndex = gg.z;
    strip.style.transition = 'transform 300ms cubic-bezier(0.33,1,0.68,1)';
    this.stripEl = strip;

    this.tiles = this.games.map(function (g, i) {
      var t = el('div', 'psx-tile', strip);
      t.style.left = (i * gg.cellW + gg.padX) + 'px';
      t.style.top = gg.padY + 'px';
      t.style.width = (gg.cellW - gg.padX * 2) + 'px';
      t.style.height = (gg.cellH - gg.padY * 2) + 'px';
      self.fillTile(t, g, gg.cellW, gg.cellH);
      return t;
    });

    var marco = el('img', 'psx-marco', this.stage);
    marco.src = PSX.ASSET + 'images/marco-activo-iso.png';
    marco.alt = '';
    marco.style.left = L.marcoActivo.left + 'px';
    marco.style.top = L.marcoActivo.top + 'px';
    marco.style.width = L.marcoActivo.w + 'px';
    marco.style.height = L.marcoActivo.h + 'px';
    marco.style.zIndex = L.marcoActivo.z;
    PSX.SB.bind(marco, PSX.STORYBOARDS['marco-activo'], this.ctx);
    this.marcoEl = marco;

    var start = place(el('div', 'psx-start', this.stage), L.start);
    start.textContent = 'Start';
    PSX.SB.bind(start, PSX.STORYBOARDS['start'], this.ctx);
    this.startEl = start;

    this.buildTitle(L, "'SST Light', 'SST', sans-serif", 300);
    this.buildMetaRows(L);
    this.buildSideMedia(L);
  };

  /* Tile contents, shared by every grid-ish view. */
  Theme.prototype.fillTile = function (t, g, w, h) {
    var img = el('img', 'art', t);
    img.src = PSX.fanart(g, Math.round(w), Math.round(h));
    img.alt = g.name;
    /* gridtile.favorite is hidden entirely inside a Collection - grid.xml:116 */
    if (g.favorite && !PSX.P.hidesFavorite(this.system())) {
      var fav = el('img', 'psx-tile-fav', t);
      fav.src = PSX.ASSET + 'images/favorite.png';
      fav.alt = '';
    }
    if (g.cheevos) {
      var ch = el('img', 'psx-tile-cheevos', t);
      ch.src = PSX.ASSET + 'images/trophy-picto.svg';
      ch.alt = '';
    }
  };

  Theme.prototype.buildTitle = function (L, family, weight) {
    var title = place(el('div', 'psx-gamename', this.stage), L.gamename);
    var nameEl = el('span', 'name psx-glow', title);
    nameEl.style.fontFamily = family;
    nameEl.style.fontWeight = weight;
    nameEl.style.fontSize = (L.gameName ? L.gameName.font : L.gamename.font) + 'px';
    this.nameEl = nameEl;
    /* The italic chip only appears inside a Collection - ps4-style.xml:216 */
    if (PSX.P.showsSystemChip(this.system())) {
      var chip = el('span', 'chip', title);
      chip.style.fontSize = (L.systemNameChip ? L.systemNameChip.font : 16) + 'px';
      chip.style.marginLeft = '0.6em';
      this.chipEl = chip;
    } else {
      this.chipEl = null;
    }
    PSX.SB.bind(title, PSX.STORYBOARDS['gamename'], this.ctx);
    this.titleEl = title;
  };

  Theme.prototype.buildMetaRows = function (L) {
    var self = this;
    function row(box) {
      var r = place(el('div', 'psx-row', self.stage), box);
      r.style.gap = ((box.separator || 0.015) * self.L.w) + 'px';
      r.style.fontSize = box.font + 'px';
      PSX.SB.bind(r, PSX.STORYBOARDS['grid-meta'], self.ctx);
      return r;
    }
    this.gamedataEl = L.gamedata ? row(L.gamedata) : null;
    this.gamedata2El = L.gamedata2 ? row(L.gamedata2) : null;
    this.iconosEl = L.iconos ? row(L.iconos) : null;
    if (L.gamedesc) {
      this.descEl = place(el('div', 'psx-desc', this.stage), L.gamedesc);
      PSX.SB.bind(this.descEl, PSX.STORYBOARDS['grid-meta'], this.ctx);
    } else {
      this.descEl = null;
    }
  };

  Theme.prototype.buildSideMedia = function (L) {
    if (L.featured || L.image) {
      var feat = place(el('img', 'psx-img', this.stage), L.featured || L.image);
      feat.style.zIndex = (L.featured || L.image).z;
      this.featEl = feat;
    } else { this.featEl = null; }

    if (L.thumbnail) {
      var th = place(el('img', 'psx-img', this.stage), L.thumbnail);
      th.style.zIndex = L.thumbnail.z;
      this.thumbEl = th;
    } else { this.thumbEl = null; }

    if (L.marquee) {
      var mq = place(el('img', 'psx-img', this.stage), L.marquee);
      mq.style.zIndex = L.marquee.z;
      PSX.SB.bind(mq, PSX.STORYBOARDS['marquee'], this.ctx);
      this.marqueeEl = mq;
    } else { this.marqueeEl = null; }
  };

  /* ---- ps5Style ------------------------------------------------------- */

  Theme.prototype.buildPs5Style = function () {
    var L = this.L.ps5Style;
    this.buildTileGrid(L.gamegrid, 'ps5');
    var title = place(el('div', 'psx-gamename', this.stage), L.gamename);
    title.style.justifyContent = 'flex-end';
    var nameEl = el('span', 'name', title);
    nameEl.style.fontFamily = "'SST', sans-serif";
    nameEl.style.fontWeight = 400;
    nameEl.style.fontSize = L.gamename.font + 'px';
    this.nameEl = nameEl;
    this.chipEl = null;
    PSX.SB.bind(title, PSX.STORYBOARDS['gamename'], this.ctx);
    this.titleEl = title;

    var sys = this.system();
    if (sys.hasConsole) {
      var con = place(el('img', 'psx-img', this.stage), L.console);
      con.src = PSX.ASSET + 'consoles/' + sys.theme + '.png';
      con.alt = '';
      con.style.zIndex = L.console.z;
    }
    this.buildMetaRows(L);
    this.buildSideMedia(L);
  };

  /* A plain rows x cols tile grid, used by ps5Style, grid, fullGrid. */
  Theme.prototype.buildTileGrid = function (gg, kind) {
    var self = this;
    var wrap = el('div', 'psx-gridwrap', this.stage);
    wrap.style.position = 'absolute';
    wrap.style.left = gg.left + 'px';
    wrap.style.top = gg.top + 'px';
    wrap.style.width = gg.w + 'px';
    wrap.style.height = gg.h + 'px';
    wrap.style.zIndex = gg.z;
    this.gridWrapEl = wrap;

    var perPage = gg.cols * gg.rows;
    this.perPage = perPage;
    var page = Math.floor(this.cursor / perPage);
    this.tiles = [];
    for (var i = 0; i < perPage; i++) {
      var idx = page * perPage + i;
      var g = this.games[idx];
      var t = el('div', 'psx-tile', wrap);
      var cx = i % gg.cols;
      var cy = Math.floor(i / gg.cols);
      t.style.left = (cx * gg.cellW + gg.marginX) + 'px';
      t.style.top = (cy * gg.cellH + gg.marginY) + 'px';
      t.style.width = (gg.cellW - gg.marginX * 2) + 'px';
      t.style.height = (gg.cellH - gg.marginY * 2) + 'px';
      t.dataset.index = idx;
      if (g) self.fillTile(t, g, gg.cellW, gg.cellH);
      else t.style.visibility = 'hidden';
      this.tiles.push(t);
    }
  };

  /* ---- detailed ------------------------------------------------------- */

  Theme.prototype.buildDetailed = function () {
    var L = this.L.detailed;
    var self = this;

    var list = place(el('div', 'psx-list', this.stage), L.gamelist);
    list.style.zIndex = L.gamelist.z;
    list.style.fontSize = L.gamelist.font + 'px';
    this.listRows = this.games.map(function (g, i) {
      var r = el('div', 'psx-list-row', list);
      r.textContent = g.name;
      r.style.height = (L.gamelist.font * 1.45) + 'px';
      r.style.lineHeight = (L.gamelist.font * 1.45) + 'px';
      return r;
    });
    this.listEl = list;

    /*
     * The detailed panel is the whole right-hand column, and it moves as one: out by 78% of
     * screen height, in from the opposite 78%. animated-list.xml:10-33 names every child
     * individually; grouping them in one bound wrapper is equivalent and far cheaper.
     */
    var panel = el('div', 'psx-panel', this.stage);
    panel.style.position = 'absolute';
    panel.style.inset = '0';
    panel.style.zIndex = 91;
    PSX.SB.bind(panel, PSX.STORYBOARDS['detailed-panel'], this.ctx);
    this.panelEl = panel;
    var savedStage = this.stage;
    this.stage = panel;
    this.buildMetaRows(L);
    this.buildSideMedia(L);
    place(el('div', 'psx-linea-infos', panel), L.lineaInfos).style.zIndex = L.lineaInfos.z;
    this.stage = savedStage;

    this.nameEl = null;
    this.chipEl = null;
    this.titleEl = null;
  };

  /* ---- grid / carousel / full-grid / single --------------------------- */

  Theme.prototype.buildGrid = function () {
    var L = this.L.grid;
    this.buildTileGrid(L.gamegrid, 'grid');
    this.buildTitle(L, "'SST', sans-serif", 700);
    this.buildMetaRows(L);
    this.buildSideMedia(L);
  };

  Theme.prototype.buildCarousel = function () {
    var L = this.L.carousel;
    var gg = L.gamegrid;
    var self = this;

    var strip = el('div', 'psx-strip psx-strip--reflect', this.stage);
    strip.style.position = 'absolute';
    strip.style.left = '0px';
    strip.style.top = gg.top + 'px';
    strip.style.height = gg.h + 'px';
    strip.style.width = this.L.w + 'px';
    strip.style.zIndex = gg.z;
    this.stripEl = strip;

    var inner = el('div', 'psx-strip-inner', strip);
    inner.style.position = 'absolute';
    inner.style.left = '0px';
    inner.style.top = '0px';
    inner.style.height = '100%';
    inner.style.transition = 'transform 300ms cubic-bezier(0.33,1,0.68,1)';
    this.stripInnerEl = inner;

    /*
     * autoLayoutSelectedZoom is the SELECTED tile's size relative to its neighbours, and the
     * cell is sized for the zoomed tile - so the base tile is cell/zoom and the selected one
     * grows to fill the cell. Scaling the base tile up by the zoom instead makes it overflow
     * the cell, which at 640x480 with zoom 1.5 pushes tiles clean off the screen.
     */
    this.carouselZoom = gg.scaleFactor || 1.5;
    var baseW = (gg.cellW - gg.padX * 2) / this.carouselZoom;
    var baseH = (gg.cellH - gg.padY * 2) / this.carouselZoom;

    this.tiles = this.games.map(function (g, i) {
      var t = el('div', 'psx-tile psx-tile--reflect', inner);
      t.style.left = (i * gg.cellW + gg.padX + (gg.cellW - gg.padX * 2 - baseW) / 2) + 'px';
      t.style.top = (gg.padY + (gg.cellH - gg.padY * 2 - baseH) / 2) + 'px';
      t.style.width = baseW + 'px';
      t.style.height = baseH + 'px';
      self.fillTile(t, g, baseW, baseH);
      return t;
    });

    /* Shares grid's upper text block. */
    var G = this.L.grid;
    this.buildTitle(G, "'SST', sans-serif", 700);
    this.buildMetaRows(G);
    this.buildSideMedia(L);
  };

  Theme.prototype.buildFullGrid = function () {
    var L = this.L.fullGrid;
    this.buildTileGrid(L.gamegrid, 'full');
    var title = place(el('div', 'psx-gamename', this.stage), L.gamename);
    var nameEl = el('span', 'name', title);
    nameEl.style.fontFamily = "'SST', sans-serif";
    nameEl.style.fontWeight = 700;
    nameEl.style.fontSize = L.gamename.font + 'px';
    nameEl.style.whiteSpace = 'normal';
    this.nameEl = nameEl;
    this.chipEl = null;
    PSX.SB.bind(title, PSX.STORYBOARDS['gamename'], this.ctx);
    this.titleEl = title;
    this.buildMetaRows(L);
    this.buildSideMedia(L);
  };

  Theme.prototype.buildSingle = function () {
    var L = this.L.single;
    var start = place(el('div', 'psx-start psx-start--pill', this.stage), L.start);
    start.textContent = 'Start';
    start.style.background = 'var(--sistemaLineaInferior)';
    start.style.justifyContent = 'flex-start';
    start.style.paddingLeft = (0.013 * this.L.w) + 'px';
    this.startEl = start;

    this.buildTitle(L, "'SST', sans-serif", 700);
    this.buildMetaRows(L);
    this.buildSideMedia(L);

    var arrow = place(el('img', 'psx-img', this.stage), L.arrow);
    arrow.src = PSX.ASSET + 'images/arrow-right.png';
    arrow.alt = '';
    arrow.style.zIndex = L.arrow.z;
    PSX.SB.bind(arrow, PSX.STORYBOARDS['arrow-right'], this.ctx);
    this.arrowEl = arrow;

    var mq = place(el('img', 'psx-img', this.stage), L.marquee);
    mq.style.zIndex = L.marquee.z;
    PSX.SB.bind(mq, PSX.STORYBOARDS['marquee'], this.ctx);
    this.marqueeEl = mq;
  };

  /* ---- media tester ----------------------------------------------------
   * test-media.xml - every scraped asset slot, captioned with a closing tag. The point of the
   * screen is to show which media are missing, so empty slots stay visible.
   */
  Theme.prototype.buildMediaTester = function () {
    var L = this.L.mediaTester;
    var W = this.L.w, H = this.L.h;
    var self = this;

    var list = place(el('div', 'psx-list', this.stage), L.gamelist);
    list.style.fontSize = L.gamelist.font + 'px';
    list.style.zIndex = L.gamelist.z;
    this.listRows = this.games.map(function (g) {
      var r = el('div', 'psx-list-row', list);
      r.textContent = g.name;
      r.style.height = (L.gamelist.font * 1.2) + 'px';
      r.style.lineHeight = (L.gamelist.font * 1.2) + 'px';
      return r;
    });
    this.listEl = list;

    var title = place(el('div', 'psx-gamename', this.stage), L.gamename);
    var nameEl = el('span', 'name', title);
    nameEl.style.fontFamily = "'SST Light', 'SST', sans-serif";
    nameEl.style.fontWeight = 300;
    nameEl.style.fontSize = L.gamename.font + 'px';
    this.nameEl = nameEl;
    this.chipEl = null;
    this.titleEl = title;

    /* test-media.xml:  top row y 0.29 (tags 0.45), bottom row y 0.72 (tags 0.89). */
    var SLOTS = [
      { tag: 'VIDEO', x: 0.32, y: 0.29, ty: 0.45, kind: 'none' },
      { tag: 'IMAGE', x: 0.53, y: 0.29, ty: 0.45, kind: 'fanart' },
      { tag: 'THUMBNAIL', x: 0.73, y: 0.29, ty: 0.45, kind: 'box', ms: [0.17, 0.25] },
      { tag: 'MARQUEE', x: 0.91, y: 0.29, ty: 0.45, kind: 'marquee', ms: [0.13, 0.13] },
      { tag: 'FANART', x: 0.12, y: 0.72, ty: 0.89, kind: 'fanart', ms: [0.22, 0.25] },
      { tag: 'TITLESHOT', x: 0.36, y: 0.72, ty: 0.89, kind: 'fanart' },
      { tag: 'BOXART', x: 0.56, y: 0.72, ty: 0.89, kind: 'box', ms: [0.17, 0.25] },
      { tag: 'BOXBACK', x: 0.75, y: 0.72, ty: 0.89, kind: 'none', ms: [0.17, 0.25] },
      { tag: 'CARTRIDGE', x: 0.92, y: 0.72, ty: 0.89, kind: 'none', ms: [0.14, 0.18] }
    ];
    this.mediaSlots = SLOTS.map(function (s) {
      var mw = (s.ms ? s.ms[0] : 0.19) * W;
      var mh = (s.ms ? s.ms[1] : 0.25) * H;
      var img = el('img', 'psx-img', self.stage);
      img.style.left = (s.x * W - mw / 2) + 'px';
      img.style.top = (s.y * H - mh / 2) + 'px';
      img.style.width = mw + 'px';
      img.style.height = mh + 'px';
      img.style.zIndex = L.slot.z;
      img.alt = '';

      var tag = el('div', 'psx-tag', self.stage);
      tag.textContent = '</' + s.tag + '>';
      tag.style.left = (s.x * W) + 'px';
      tag.style.top = (s.ty * H) + 'px';
      tag.style.transform = 'translate(-50%, -50%)';
      tag.style.fontSize = L.tag.font + 'px';
      tag.style.zIndex = L.tag.z;
      return { def: s, img: img };
    });
  };

  /* ---- splash / gamesplash -------------------------------------------- */

  Theme.prototype.buildSplash = function () {
    var L = this.L.splash;
    var stage = this.stage;

    var bg = el('img', 'psx-bg', stage);
    bg.src = PSX.colorsetBackground(this.state.colorset);
    bg.alt = '';
    bg.style.zIndex = 0;

    var logo = place(el('img', 'psx-img', stage), L.logo);
    logo.src = PSX.ASSET + 'frontend/Batocera-splash.svg';
    logo.alt = 'Batocera';
    logo.style.zIndex = L.logo.z;

    var welcome = place(el('div', 'psx-el psx-glow', stage), L.welcome);
    welcome.style.fontFamily = "'SST Light', 'SST', sans-serif";
    welcome.style.fontWeight = 300;
    welcome.style.textAlign = 'center';
    welcome.style.zIndex = L.welcome.z;
    welcome.textContent = 'Welcome to Playstation X for Batocera';

    var frame = place(el('img', 'psx-img', stage), L.avatarFrame);
    frame.src = PSX.ASSET + 'images/frame-splash.png';
    frame.alt = '';
    frame.style.zIndex = L.avatarFrame.z;

    var av = place(el('img', 'psx-img', stage), L.avatar);
    av.src = PSX.ASSET + 'avatars/custom-avatar.png';
    av.alt = '';
    av.style.zIndex = L.avatar.z;

    var user = place(el('div', 'psx-el', stage), L.username);
    user.style.fontFamily = "'SST Light', 'SST', sans-serif";
    user.style.fontWeight = 300;
    user.style.textAlign = 'center';
    user.style.zIndex = L.username.z;
    user.textContent = 'PlayStation-X';

    /* The progress bar, with its label sitting on top - splash.xml puts both at y 0.703. */
    var bar = place(el('div', 'psx-progress', stage), L.progressbar);
    bar.style.zIndex = L.progressbar.z;
    var fill = el('div', 'fill', bar);
    fill.style.width = '86%';

    var label = place(el('div', 'psx-el', stage), L.label);
    label.style.fontFamily = "'SST Light', 'SST', sans-serif";
    label.style.fontWeight = 300;
    label.style.textAlign = 'center';
    label.style.lineHeight = L.progressbar.h + 'px';
    label.style.zIndex = L.label.z;
    label.textContent = 'Preloading UI';

    /* The splash is not tied to a system, so its rule is the colorset accent rather than the
     * per-system gradient from _theme_inc/infos/<theme>.xml. */
    var sl = place(el('div', 'psx-linea', stage), L.linea);
    sl.style.zIndex = L.linea.z;
    sl.style.background = 'var(--sistemaLineaInferior)';

    var reg = place(el('div', 'psx-el', stage), L.region);
    reg.style.textAlign = 'right';
    reg.style.fontFamily = "'SST', sans-serif";
    reg.style.zIndex = L.region.z;
    reg.textContent = 'Region: Europe';

    var ver = place(el('div', 'psx-el', stage), L.version);
    ver.style.fontFamily = "'SST', sans-serif";
    ver.style.color = '#999999';
    ver.style.zIndex = L.version.z;
    ver.textContent = 'Theme by pajarorrojo - Version 43.1';
  };

  Theme.prototype.buildGamesplash = function () {
    var L = this.L.gamesplash;
    var stage = this.stage;
    var g = this.game();
    var sys = this.system();
    if (!g) return;

    var bg = el('img', 'psx-bg', stage);
    bg.src = PSX.fanart(g, 960, 540);
    bg.alt = '';
    bg.style.zIndex = 0;
    bg.style.filter = 'brightness(0.63)';

    var ov = el('img', 'psx-overlay', stage);
    ov.src = PSX.ASSET + 'overlays/overlay-gamesplash.png';
    ov.alt = '';
    ov.style.zIndex = 1;

    var mq = place(el('img', 'psx-img', stage), L.marquee);
    mq.src = PSX.marquee(g, 260, 90);
    mq.alt = '';
    mq.style.zIndex = L.marquee.z;

    var title = place(el('div', 'psx-gamename', stage), L.gamename);
    var nameEl = el('span', 'name psx-glow', title);
    nameEl.style.fontFamily = "'SST', sans-serif";
    nameEl.style.fontWeight = 700;
    nameEl.style.fontSize = L.gamename.font + 'px';
    nameEl.textContent = g.name;
    this.nameEl = nameEl;
    this.chipEl = null;
    this.titleEl = null;

    this.gamedataEl = place(el('div', 'psx-row', stage), L.gamedata);
    this.gamedataEl.style.gap = (L.gamedata.separator * this.L.w) + 'px';
    this.gamedataEl.style.fontSize = L.gamedata.font + 'px';
    this.gamedata2El = place(el('div', 'psx-row', stage), L.gamedata2);
    this.gamedata2El.style.gap = (L.gamedata2.separator * this.L.w) + 'px';
    this.gamedata2El.style.fontSize = L.gamedata2.font + 'px';
    this.iconosEl = place(el('div', 'psx-row', stage), L.iconos);
    this.iconosEl.style.gap = (L.iconos.separator * this.L.w) + 'px';
    this.descEl = null;
    this.featEl = null;
    this.thumbEl = null;
    this.marqueeEl = null;

    if (sys.hasConsole) {
      var con = place(el('img', 'psx-img', stage), L.console);
      con.src = PSX.ASSET + 'consoles/' + sys.theme + '.png';
      con.alt = '';
      con.style.zIndex = L.console.z;
    }

    var loading = place(el('div', 'psx-row', stage), L.loading);
    loading.style.gap = (L.loading.separator * this.L.w) + 'px';
    loading.style.fontFamily = "'SST Light', 'SST', sans-serif";
    loading.style.fontWeight = 300;
    loading.style.fontSize = L.loading.font + 'px';
    loading.innerHTML = '<span>Loading ...</span>' +
      '<span style="font-size:' + L.romPath.font + 'px">' + esc(g.rom) + '</span>';

    this.renderMeta();
    var self = this;
    [this.gamedataEl, this.gamedata2El, this.iconosEl].forEach(function (e) {
      if (e) PSX.SB.bind(e, PSX.STORYBOARDS['grid-meta'], self.ctx);
    });
  };

  /* ---- cursor / render ------------------------------------------------ */

  Theme.prototype.setCursor = function (i, dir) {
    if (this.view === 'splash' || this.view === 'gamesplash') return;

    if (this.view === 'system') {
      var n = PSX.SYSTEMS.length;
      this.systemIndex = ((i % n) + n) % n;
      this.renderSystem();
    } else {
      var m = this.games.length;
      if (!m) return;
      /* scrollLoop is true on the strip views (ps4-style.xml:56, carousel.xml:31). */
      this.cursor = ((i % m) + m) % m;
      this.renderGame();
      this.renderMeta();
      this.positionSelection();
    }

    var event = dir === null ? 'open' : (dir > 0 ? 'activateNext' : 'activatePrev');
    var self = this;
    [this.marcoEl, this.titleEl, this.marqueeEl, this.gamedataEl, this.gamedata2El,
     this.iconosEl, this.descEl, this.bgEl, this.overlayArtEl, this.startEl,
     this.panelEl, this.sysNameEl, this.sysDescEl, this.consoleEl,
     this.frontendLogoEl, this.caratulaTopEl, this.trophyEl, this.tickerA, this.tickerB,
     this.arrowEl].forEach(function (e) {
      if (e) PSX.SB.drive(e, event, self.animate);
    });
  };

  /* Move whichever selection affordance this view uses. */
  Theme.prototype.positionSelection = function () {
    var v = this.view;
    var self = this;

    if (v === 'ps4Style') {
      var gg = this.L.ps4Style.gamegrid;
      this.tiles.forEach(function (t, j) { t.classList.toggle('is-selected', j === self.cursor); });
      this.stripEl.style.transform =
        'translateX(' + (-(this.cursor - gg.centerIndex) * gg.cellW) + 'px)';
      return;
    }
    if (v === 'carousel') {
      var cg = this.L.carousel.gamegrid;
      this.tiles.forEach(function (t, j) {
        var sel = j === self.cursor;
        t.classList.toggle('is-selected', sel);
        t.style.transform = sel ? 'scale(' + self.carouselZoom + ')' : 'scale(1)';
        t.style.zIndex = sel ? 3 : 1;
      });
      var centre = this.L.w / 2 - cg.cellW / 2;
      this.stripInnerEl.style.transform =
        'translateX(' + (centre - this.cursor * cg.cellW) + 'px)';
      return;
    }
    if (v === 'detailed' || v === 'mediaTester') {
      this.listRows.forEach(function (r, j) { r.classList.toggle('is-selected', j === self.cursor); });
      var row = this.listRows[this.cursor];
      if (row) row.scrollIntoView({ block: 'nearest' });
      return;
    }
    if (this.tiles) {
      /* Paged grids re-render the page with no animation, matching the source's instant
       * page turn. */
      var gspec = this.L[v] && this.L[v].gamegrid;
      if (gspec && this.perPage) {
        var page = Math.floor(this.cursor / this.perPage);
        var built = Math.floor((+this.tiles[0].dataset.index || 0) / this.perPage);
        if (page !== built) {
          this.gridWrapEl.remove();
          this.buildTileGrid(gspec, v);
        }
      }
      this.tiles.forEach(function (t) {
        t.classList.toggle('is-selected', +t.dataset.index === self.cursor);
      });
    }
  };

  Theme.prototype.renderGame = function () {
    var g = this.game();
    if (!g) return;
    if (this.nameEl) this.nameEl.textContent = g.name;
    if (this.chipEl) this.chipEl.textContent = PSX.systemByTheme(g.system).fullName;
    if (this.featEl) this.featEl.src = PSX.fanart(g, 320, 180);
    if (this.thumbEl) this.thumbEl.src = PSX.boxart(g, 200, 280);
    if (this.marqueeEl) this.marqueeEl.src = PSX.marquee(g, 260, 90);
    if (this.descEl) this.descEl.textContent = g.desc;

    if (this.mediaSlots) {
      this.mediaSlots.forEach(function (s) {
        var k = s.def.kind;
        s.img.src = k === 'fanart' ? PSX.fanart(g, 320, 180)
          : k === 'box' ? PSX.boxart(g, 200, 280)
          : k === 'marquee' ? PSX.marquee(g, 260, 90)
          : PSX.ASSET + 'images/no-image-default.png';
      });
    }
  };

  /* Metadata rows. Every branch here is a data predicate from views.js. */
  Theme.prototype.renderMeta = function () {
    var g = this.game();
    if (!g) return;

    if (this.gamedataEl) {
      var p = ['<span class="release">' + (g.releaseyear || '------') + '</span>'];
      if (PSX.P.neither(g)) {
        p.push('<span class="sep">&bull;</span>', '<span class="dim">-------------</span>');
      } else if (PSX.P.pubEqDev(g) || PSX.P.devOnly(g)) {
        p.push('<span class="sep">&bull;</span>', '<span>' + esc(g.developer) + '</span>');
      } else if (PSX.P.pubOnly(g)) {
        p.push('<span class="sep">&bull;</span>', '<span>' + esc(g.publisher) + '</span>');
      } else {
        p.push('<span class="sep">&bull;</span>',
          '<span>' + esc(g.publisher) + ' &ndash; ' + esc(g.developer) + '</span>');
      }
      this.gamedataEl.innerHTML = p.join('');
    }

    if (this.gamedata2El) {
      var q = [];
      if (PSX.P.hasStars(g)) q.push('<span class="psx-stars">' + PSX.starsHtml(g.stars) + '</span>');
      q.push('<span class="genre">&bull;</span>', '<span class="genre">' + esc(g.genre) + '</span>');
      this.gamedata2El.innerHTML = q.join('');
      if (PSX.P.multidisc(g)) {
        var chip = el('span', 'multidisc', this.gamedata2El);
        chip.textContent = 'multi-disc';
        PSX.SB.bind(chip, PSX.STORYBOARDS['badge'], this.ctx);
        PSX.SB.drive(chip, null, this.animate);
      }
    }

    if (this.iconosEl) this.renderIcons(g);
  };

  /*
   * contenedor-iconos. Flags, player count, capability pictos and the pulsing tag badges.
   * grid.xml:340-620.
   */
  Theme.prototype.renderIcons = function (g) {
    var box = this.iconosEl;
    box.innerHTML = '';
    var self = this;
    var h = Math.max(12, (this.L.h * 0.03));

    function img(src, cls) {
      var i = el('img', cls || null, box);
      i.src = src;
      i.alt = '';
      i.style.height = h + 'px';
      i.style.width = 'auto';
      i.style.objectFit = 'contain';
      return i;
    }
    function badge(src) {
      var i = img(src);
      PSX.SB.bind(i, PSX.STORYBOARDS['badge'], self.ctx);
      PSX.SB.drive(i, null, self.animate);
      return i;
    }

    /* force-world-flag when a game claims more than one region - grid.xml:356 */
    if (PSX.P.worldFlag(g)) img(PSX.ASSET + 'flags/wor.png');
    else img(PSX.ASSET + 'flags/' + (g.region || 'eu') + '.png');

    /* More than one language shows a text label instead of a flag - grid.xml:381 */
    if (PSX.P.langLabel(g)) {
      var lab = el('span', null, box);
      lab.textContent = String(g.lang).toUpperCase();
      lab.style.color = 'var(--releaseColor)';
      lab.style.fontSize = (h * 0.62) + 'px';
    } else {
      img(PSX.ASSET + 'flags/' + (g.lang === 'en' ? 'en' : g.lang) + '.png');
    }

    /* Player count renders through players.ttf, an icon font. */
    var pc = el('span', null, box);
    pc.textContent = String(g.playerCount || 1);
    pc.style.fontFamily = "'players', 'SST', sans-serif";
    pc.style.fontSize = (h * 1.2) + 'px';
    pc.style.color = '#eeeeee';

    if (g.cheevos) img(PSX.ASSET + 'images/trophy-picto.svg').style.filter =
      'invert(72%) sepia(85%) saturate(1200%) hue-rotate(2deg)';
    if (g.hasSaveState) img(PSX.ASSET + 'images/SaveState.png');
    if (g.hasManual) img(PSX.ASSET + 'images/manual.png');
    if (g.kidGame) img(PSX.ASSET + 'images/kidgame.png');
    if (g.gunGame) img(PSX.ASSET + 'images/lightgun.png');
    if (g.wheelGame) img(PSX.ASSET + 'images/volante.png');
    if (g.hasKeyboardMapping) img(PSX.ASSET + 'images/keyboardmap.png');

    /* The pulsing tag badges - grid.xml:496-573. */
    var TAG = {
      finished: 'F11E', 'in progress': 'F144', slow: 'F071',
      'not working': 'F057', buggy: 'F070', liked: 'like', disliked: 'dislike'
    };
    (g.tags || []).forEach(function (t) {
      if (TAG[t]) badge(PSX.ASSET + 'badges/' + TAG[t] + '.png');
    });
  };

  /* ---- input ----------------------------------------------------------- */

  Theme.prototype.wireInput = function () {
    var self = this;
    document.addEventListener('keydown', function (e) {
      if (self.showChrome && CHROME_KEYS[e.key]) {
        e.preventDefault();
        self.cycle(CHROME_KEYS[e.key][0], CHROME_KEYS[e.key][1]);
        return;
      }
      var button = e.code === 'ShiftRight' ? 'select' : KEYS[e.key];
      if (!button) return;
      e.preventDefault();
      self.handle(button);
    });
    document.querySelectorAll('[data-btn]').forEach(function (b) {
      b.addEventListener('click', function () { self.handle(b.getAttribute('data-btn')); });
    });
  };

  Theme.prototype.flash = function (button) {
    document.querySelectorAll('[data-btn="' + button + '"]').forEach(function (e) {
      e.classList.add('is-pressed');
      setTimeout(function () { e.classList.remove('is-pressed'); }, 120);
    });
  };

  Theme.prototype.handle = function (button) {
    this.flash(button);
    var idx = this.view === 'system' ? this.systemIndex : this.cursor;
    var cols = 1;
    var g = this.L[this.view] && this.L[this.view].gamegrid;
    if (g && (this.view === 'grid' || this.view === 'ps5Style' || this.view === 'fullGrid')) {
      cols = g.cols;
    }
    switch (button) {
      case 'left': this.setCursor(idx - 1, -1); break;
      case 'right': this.setCursor(idx + 1, +1); break;
      case 'up': this.setCursor(idx - cols, -1); break;
      case 'down': this.setCursor(idx + cols, +1); break;
      default: break;
    }
  };

  /* ---- chrome strip -----------------------------------------------------
   * Three update classes, matching elementerial's split:
   *   colour-only     -> applyColors, no rebuild, cursor and animations survive
   *   geometry        -> full rebuild, view and cursor restored
   *   animations off  -> settleAll, no rebuild
   */
  var CHROME_SECTIONS = [
    { key: 'view', label: 'View', values: VIEWS, geometry: true },
    { key: 'system', label: 'System', values: null, geometry: true },
    { key: 'colorset', label: 'Colorset', values: ['blue', 'black'], geometry: false },
    { key: 'secondary_colorset', label: 'Accent',
      values: ['default', 'blue', 'yellow', 'green', 'orange', 'red', 'pink', 'purple', 'black'],
      geometry: false, swatch: true },
    { key: 'carousel-type', label: 'Carousel', values: ['PS5', 'PS4', 'PS3'], geometry: true },
    { key: 'carousel', label: 'Size', values: ['big', 'medium', 'small'], geometry: true },
    { key: 'top-info', label: 'Top info', values: ['default', 'no-numbers', 'clean'], geometry: true },
    { key: 'animations', label: 'Animations', values: ['on', 'off'], geometry: false }
  ];

  Theme.prototype.currentValue = function (key) {
    if (key === 'view') return this.view;
    if (key === 'system') return this.system().theme;
    if (key === 'animations') return this.animate ? 'on' : 'off';
    return this.state[key];
  };

  Theme.prototype.setValue = function (key, value) {
    if (key === 'view') {
      this.view = value;
      this.cursor = 0;
      this.rebuild();
      return;
    }
    if (key === 'system') {
      this.systemIndex = Math.max(0, PSX.SYSTEMS.findIndex(function (s) { return s.theme === value; }));
      this.cursor = 0;
      this.rebuild();
      return;
    }
    if (key === 'animations') {
      this.animate = value === 'on';
      if (!this.animate) PSX.SB.settleAll(this.root, this.ctx);
      else this.setCursor(this.view === 'system' ? this.systemIndex : this.cursor, null);
      this.buildChrome();
      return;
    }
    this.state[key] = value;
    var section = CHROME_SECTIONS.filter(function (s) { return s.key === key; })[0];
    if (section && section.geometry) {
      this.rebuild();
    } else {
      /* Colour-only: no rebuild, so the cursor and every running animation survive. */
      PSX.applyColors(this.root, this.state.colorset, this.state.secondary_colorset);
      this.buildChrome();
    }
  };

  Theme.prototype.cycle = function (key, delta) {
    var section = CHROME_SECTIONS.filter(function (s) { return s.key === key; })[0];
    if (!section) return;
    var vals = section.values || PSX.SYSTEMS.map(function (s) { return s.theme; });
    var i = vals.indexOf(this.currentValue(key));
    this.setValue(key, vals[((i + delta) % vals.length + vals.length) % vals.length]);
  };

  Theme.prototype.buildChrome = function () {
    var self = this;
    if (this.chromeEl) this.chromeEl.remove();
    var host = this.opts.chromeHost || this.root.closest('.device-viewport') || this.root;
    var strip = el('div', 'psx-chrome');
    this.chromeEl = strip;
    (host.parentNode || document.body).insertBefore(strip, host.nextSibling);

    CHROME_SECTIONS.forEach(function (sec) {
      var vals = sec.values || PSX.SYSTEMS.map(function (s) { return s.theme; });
      var grp = el('div', 'psx-chrome-group', strip);
      el('div', 'psx-chrome-label', grp).textContent = sec.label;
      var row = el('div', 'psx-chrome-row', grp);
      vals.forEach(function (v) {
        var b = el('button', 'psx-chip', row);
        if (sec.swatch && v !== 'default') {
          var sw = el('span', 'sw', b);
          sw.style.background = PSX.cssColor(PSX.SECONDARY[v].accent);
        }
        el('span', null, b).textContent = sec.key === 'view' ? (VIEW_LABEL[v] || v) : v;
        if (self.currentValue(sec.key) === v) b.classList.add('is-on');
        b.addEventListener('click', function () { self.setValue(sec.key, v); });
      });
    });

    var hint = el('div', 'psx-chrome-hint', strip);
    hint.textContent =
      'Device keys: arrows = D-pad, Z=A, X=B, A=X, S=Y, Enter=Start, RightShift=Select, ' +
      'Q/W=L/R, Esc=Menu.   Mockup-only: [ ] view, / system, \\ colorset, ’ accent, ' +
      ', . carousel, - = size, ; animations.';
  };

  PSX.boot = function (root, opts) {
    var t = new Theme(root, opts);
    PSX.current = t;
    return t;
  };
})(window.PlayStationX);
