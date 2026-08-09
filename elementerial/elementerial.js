/*
 * elementerial.js - the controller: input, view switching, live re-theming and
 * every transition.
 *
 *   Elementerial.boot(rootEl, {
 *     device: 'rg35xx' | 'rg-cubexx' | 'rg351m',
 *     view: 'system' | 'detailed' | 'video' | 'grid' | 'boxes',
 *     scheme: 'strawberry' ... 'redBerries',
 *     style: 'dark' | 'light',
 *     fontSize: 'small' | 'medium' | 'large',
 *     system: 'snes',
 *     interactive: true | false
 *   });
 *
 * Device keys (matching shared/nav.js so the frame's on-screen buttons work):
 *   arrows D-pad, Z A, X B, A X, S Y, Enter Start, Right Shift Select,
 *   Q / W L / R, Esc Menu.
 *
 * Mockup-only keys, deliberately outside that map so they can never be taken
 * for device buttons: [ ] cycle view, , . cycle colour scheme, \ toggle
 * dark/light, - = font size.
 */
window.Elementerial = window.Elementerial || {};
(function (E) {
  'use strict';

  var VIEWS = ['system', 'basic', 'detailed', 'video', 'grid', 'boxes', 'elementflix', 'menu'];
  var VIEW_LABEL = {
    system: 'Main screen', basic: 'Basic', detailed: 'Detailed', video: 'Video',
    grid: 'Grid', boxes: 'Boxes', elementflix: 'Elementflix', menu: 'Menu'
  };
  var TILE_VIEWS = ['grid', 'boxes', 'elementflix'];
  var LIST_VIEWS = ['basic', 'detailed', 'video'];

  var KEYS = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    z: 'a', Z: 'a', x: 'b', X: 'b', Backspace: 'b',
    a: 'x', A: 'x', s: 'y', S: 'y',
    Enter: 'start', q: 'l', Q: 'l', w: 'r', W: 'r', Escape: 'menu'
  };

  function Theme(root, opts) {
    this.root = root;
    this.device = opts.device || 'rg35xx';
    this.view = opts.view || 'system';
    this.scheme = opts.scheme || 'strawberry';
    this.style = opts.style || 'dark';
    this.fontSize = opts.fontSize || 'medium';
    this.systemIndex = Math.max(0, E.SYSTEMS.findIndex(function (s) {
      return s.theme === (opts.system || 'gba');
    }));
    this.interactive = opts.interactive !== false;

    /* Theme subsets. Defaults are ES's first-listed option in each subset. */
    this.gridImage = opts.gridImage || 'screenshot';       /* Grid Game Image */
    this.iconStyle = opts.iconStyle || 'Square';           /* Default icons style */
    this.boxArtStyle = opts.boxArtStyle || 'cover';        /* BoxArtStyle */
    this.gridDirection = opts.gridDirection || 'horizontal'; /* GridDirection */
    this.statusBar = opts.statusBar || 'complete';         /* Status Bar */
    this.background = opts.background || 'default';        /* Background style */
    this.carouselVideo = !!opts.carouselVideo;             /* Video on carousel */

    this.cursor = { basic: 0, detailed: 0, video: 0, grid: 0, boxes: 0, elementflix: 0, menu: 0 };

    this.build();
    this.applyScheme();
    this.renderSystem();
    this.renderGamelists();
    this.showView(this.view, true);
    this.startClock();

    if (this.interactive) {
      this.wireInput();
      this.buildChrome();
    }
  }

  /* ---- construction ---------------------------------------------------- */

  Theme.prototype.build = function () {
    var root = this.root;
    root.innerHTML = '';
    root.classList.add('el-root');

    this.L = E.resolve(this.device, {
      fontSize: this.fontSize,
      gridDirection: this.gridDirection
    });
    root.dataset.ratio = this.L.ratio;

    this.layers = {};
    this.parts = {};

    VIEWS.forEach(function (name) {
      var layer = E.el('div', 'el-view el-view--' + name, root);
      layer.dataset.view = name;
      this.layers[name] = layer;
    }, this);

    this.parts.system = E.buildSystem(this.layers.system, this.L);
    this.parts.basic = E.buildBasic(this.layers.basic, this.L);
    this.parts.detailed = E.buildDetailed(this.layers.detailed, this.L);
    this.parts.video = E.buildVideo(this.layers.video, this.L);
    this.parts.grid = E.buildGrid(this.layers.grid, this.L);
    this.parts.boxes = E.buildBoxes(this.layers.boxes, this.L);
    this.parts.elementflix = E.buildElementflix(this.layers.elementflix, this.L);
    this.parts.menu = E.buildMenu(this.layers.menu, this.L);

    /* Chrome shared by every view, drawn above the layers. */
    this.helpSystem = E.buildHelp(root, this.L, 'system');
    this.helpGamelist = E.buildHelp(root, this.L, 'gamelist');
    this.status = E.buildStatusBar(root, this.L);

    E.el('div', 'el-scrim el-scrim--osd', root);
    E.el('div', 'el-scrim el-scrim--border', root);
    this.launch = E.el('div', 'el-launch', root);
  };

  Theme.prototype.applyScheme = function () {
    E.applyScheme(this.root, this.scheme, this.style);
    /* The generated placeholders read the live accent, so they are rebuilt
     * whenever the scheme changes. */
    this.renderGamelists();
  };

  /* ---- data helpers ---------------------------------------------------- */

  Theme.prototype.system = function () { return E.SYSTEMS[this.systemIndex]; };

  Theme.prototype.games = function () {
    var sys = this.system();
    return E.gamesFor(sys.theme).map(function (game) {
      return Object.assign({}, game, { system: sys.theme });
    });
  };

  Theme.prototype.accent = function () {
    var cs = getComputedStyle(this.root);
    return {
      main: cs.getPropertyValue('--mainColor').trim() || '#ed5353',
      sect: cs.getPropertyValue('--sectColor').trim() || '#ff8c82'
    };
  };

  Theme.prototype.artFor = function (game) {
    if (game.folder) return E.ASSET + 'grid/folder.png';
    if (game.noArt) return null;      /* falls through to the scheme placeholder */
    var a = this.accent();
    return E.screenshot(game, a.main, a.sect);
  };

  /* ---- system view ------------------------------------------------------ */

  /*
   * skipInfo is set during a cursor move: ES swaps the systemInfo text only
   * once it has finished fading out, so moveSystem owns that timing.
   */
  Theme.prototype.renderSystem = function (skipInfo) {
    var p = this.parts.system;
    var sys = this.system();
    var c = this.L.system.carousel;

    p.cover.src = this.backdropFor(sys);
    p.video.src = E.ASSET + 'systems/' + sys.theme + '.webp';
    p.video.classList.toggle('is-on', this.carouselVideo);
    p.name.textContent = sys.fullName;
    /* ES supplies this string, not the theme. Transcribed from
     * reference/main-strawberry-dark.png, which reads "126 GAMES". */
    if (!skipInfo) p.info.textContent = sys.count + ' GAMES';

    /* Rest the strip so the selected cell lands on logoPos, and scale the
     * selected logo about its own cell centre. */
    p.strip.style.transform =
      'translateX(' + (c.selTopLeft[0] - this.systemIndex * c.pitch) + 'px)';

    p.logos.forEach(function (slot, i) {
      var on = i === this.systemIndex;
      slot.style.transform = on ? 'scale(' + c.scale + ')' : 'scale(1)';
      slot.classList.toggle('is-selected', on);
    }, this);
  };

  /*
   * Mirrors SystemView::onCursorChanged for transition_style "fade":
   *   - mCamOffset lerps to the target on easeOutQuint over mTransitionSpeed,
   *     so the logo row slides and each logo's scale and opacity follow
   *     continuously;
   *   - mExtrasCamOffset jumps to the target immediately and
   *     mExtrasFadeOpacity lerps 1 to 0, so the previous artwork and
   *     systemName fade out on top of the new ones;
   *   - systemInfo runs its own fade-out / swap / delayed fade-in.
   */
  Theme.prototype.moveSystem = function (step) {
    var next = this.systemIndex + step;
    if (next < 0 || next >= E.SYSTEMS.length) return;   /* scrollLoop is false */

    var p = this.parts.system;
    var self = this;
    var prev = this.system();

    this.systemIndex = next;

    /* Hand the outgoing artwork and name to the fade-out layers before the
     * live ones are updated. */
    p.coverOut.classList.remove('is-fading');
    p.nameOut.classList.remove('is-fading');
    p.coverOut.src = E.ASSET + 'systems/' + prev.theme + '.webp';
    p.nameOut.textContent = prev.fullName;
    p.coverOut.style.opacity = 1;
    p.nameOut.style.opacity = 1;

    this.renderSystem(true);

    /* The new artwork re-runs its 1000ms storyboard, as activateExtras does. */
    p.cover.classList.remove('is-animated');
    void p.cover.offsetWidth;
    p.cover.classList.add('is-animated');

    void p.coverOut.offsetWidth;
    p.coverOut.classList.add('is-fading');
    p.nameOut.classList.add('is-fading');
    p.coverOut.style.opacity = 0;
    p.nameOut.style.opacity = 0;

    /* systemInfo: fade out, swap the text once it is gone, then fade back in
     * starting at systemInfoDelay. */
    clearTimeout(this._infoSwap);
    clearTimeout(this._infoIn);
    p.info.classList.remove('is-pending');
    p.info.classList.add('is-leaving');

    this._infoSwap = setTimeout(function () {
      p.info.classList.add('is-pending');
      p.info.classList.remove('is-leaving');
      p.info.textContent = self.system().count + ' GAMES';
    }, 150);

    this._infoIn = setTimeout(function () {
      p.info.classList.remove('is-pending');
    }, 300);

    this.renderGamelists();
  };

  /* ---- gamelists -------------------------------------------------------- */

  Theme.prototype.renderGamelists = function () {
    if (!this.parts) return;
    var games = this.games();
    var sys = this.system();

    LIST_VIEWS.forEach(function (v) { this.renderList(v, games, sys); }, this);
    TILE_VIEWS.forEach(function (v) { this.renderTiles(v, games, sys); }, this);
    this.applyStatusBar();
  };

  /*
   * Status Bar subset. "hidden" also drops osdBackground, which is the scrim
   * that exists only to back the clock and battery (statusbar/hidden.xml:9-13).
   */
  Theme.prototype.applyStatusBar = function () {
    var mode = this.statusBar;
    var showClock = mode === 'complete' || mode === 'clock';
    var showBattery = mode === 'complete' || mode === 'battery';
    this.status.clock.style.display = showClock ? '' : 'none';
    this.status.battery.style.display = showBattery ? '' : 'none';
    var osd = this.root.querySelector('.el-scrim--osd');
    if (osd) osd.style.display = mode === 'hidden' ? 'none' : '';
  };

  /*
   * Background style subset. ES resolves a multi-path image to the last path
   * that exists, so "default" lands on the theme's system backdrop and
   * "random" on a random game screenshot. "custom" prefers customBackground/,
   * which this repo does not ship, so it falls back to the backdrop exactly as
   * a fresh install would.
   */
  Theme.prototype.backdropFor = function (sys) {
    if (this.background === 'random') {
      var games = this.games();
      var pick = games[(this.systemIndex * 7 + 3) % games.length];
      return this.artFor(pick) || (E.ASSET + 'systems/' + sys.theme + '.webp');
    }
    return E.ASSET + 'systems/' + sys.theme + '.webp';
  };

  Theme.prototype.listBox = function (view) {
    if (view === 'video') return this.L.video.list;
    if (view === 'basic') return this.L.basic.list;
    return this.L.detailed.list;
  };

  Theme.prototype.renderList = function (view, games, sys) {
    var p = this.parts[view];
    var box = this.listBox(view);
    p.title.textContent = sys.fullName;
    /* cover_list - the system backdrop band behind the header, under the
     * gamelist-basic scrim (view-general.xml:49-55). */
    if (p.cover) p.cover.src = this.backdropFor(sys);
    p.rows = E.fillList(p.inner, games, box);
    this.setListCursor(view, Math.min(this.cursor[view], games.length - 1));
  };

  Theme.prototype.setListCursor = function (view, index) {
    var p = this.parts[view];
    var games = this.games();
    var box = this.listBox(view);
    if (!p.rows || !p.rows.length) return;

    index = Math.max(0, Math.min(index, games.length - 1));
    this.cursor[view] = index;

    p.rows.forEach(function (row, i) {
      row.classList.toggle('is-selected', i === index);
    });

    /* ES keeps the cursor inside the window and snaps - no easing. */
    var perScreen = Math.floor(box.height / box.row);
    var first = Math.max(0, Math.min(index - Math.floor(perScreen / 2),
                                     games.length - perScreen));
    if (first < 0) first = 0;
    p.inner.style.transform = 'translateY(' + (-first * box.row) + 'px)';

    var game = games[index];
    if (view === 'basic') return;   /* basic has no metadata elements at all */

    p.image.src = this.artFor(game) || this.placeholder();
    p.marquee.src = E.marquee(game);

    if (view === 'detailed') {
      p.stars.forEach(function (star, i) {
        var filled = game.rating >= (i + 1) / 5 - 0.001;
        var size = this.L.detailed.md_rating.size;
        star.innerHTML = filled ? E.STAR_FILLED : E.STAR_EMPTY;
        star.firstChild.setAttribute('width', size);
        star.firstChild.setAttribute('height', size);
      }, this);
      if (p.desc) p.desc.textContent = E.describe(game);
    }
  };

  /* Default icons style picks which no-artwork tile set is used. */
  Theme.prototype.placeholder = function (name) {
    return E.ASSET + E.ICON_STYLE[this.iconStyle] + '/' +
      (name || E.schemeById(this.scheme).grid) + '.png';
  };

  Theme.prototype.tileMetrics = function (view) {
    if (view === 'boxes') return this.L.boxes;
    if (view === 'elementflix') return this.L.elementflix;
    return this.L.grid;
  };

  Theme.prototype.renderTiles = function (view, games, sys) {
    var p = this.parts[view];
    p.title.textContent = sys.fullName;
    if (p.cover) p.cover.src = this.backdropFor(sys);

    var placeholder = this.placeholder();
    var opts;

    if (view === 'grid') {
      /* Grid Game Image subset chooses both the source and the fit. */
      var gi = E.GRID_IMAGE[this.gridImage];
      opts = {
        placeholder: placeholder,
        fit: E.FIT[gi.imageSizeMode],
        tilePadding: this.L.grid.tilePadding,
        round: this.L.grid.round,
        selectorRadius: this.L.grid.selectorRadius,
        captionWidth: this.L.grid.caption.width,
        captionHeight: this.L.grid.caption.height,
        captionPadding: this.L.grid.caption.padding,
        captionFont: this.L.grid.caption.font,
        captionLineSpacing: this.L.grid.caption.lineSpacing
      };
    } else if (view === 'boxes') {
      opts = {
        placeholder: placeholder,
        fit: E.FIT.minSize,
        /* boxes inherits grid's gridtile padding, and with selectionMode
         * full that gap is what lets the mainColor selector read as a frame
         * around the selected tile - visible in reference/boxes-snes-light.png. */
        tilePadding: this.L.boxes.tilePadding,
        round: this.L.boxes.round,
        selectorRadius: this.L.grid.selectorRadius,
        captionTop: this.L.boxes.caption.top,
        captionHeight: this.L.boxes.caption.height,
        captionFont: this.L.boxes.caption.font,
        captionLineSpacing: this.L.boxes.caption.lineSpacing
      };
    } else {
      /* BoxArtStyle subset chooses the fit; GridDirection chooses the axis. */
      var F = this.L.elementflix;
      opts = {
        placeholder: placeholder,
        fit: E.FIT[E.BOX_ART[this.boxArtStyle].imageSizeMode],
        rowMajor: F.direction === 'vertical',
        tilePadding: F.tilePadding,
        round: 0,                       /* flix.xml sets roundCorners 0 */
        selectorRadius: 0,              /* and backgroundCornerSize 0 */
        captionTop: F.caption.top,
        captionHeight: F.caption.height,
        captionFont: F.caption.font,
        captionLineSpacing: F.caption.lineSpacing
      };
    }

    p.tileList = p.tiles.render(games, opts);
    p.tileList.forEach(function (t) {
      /* thumbnail and marquee sources are different media in ES; the mockup
       * has only generated art, so marquee mode swaps in the wordmark. */
      var src = (view === 'grid' && this.gridImage === 'marquee')
        ? E.marquee(t.game)
        : this.artFor(t.game);
      if (src) t.art.src = src; else t.art.removeAttribute('src');
      if (t.marquee) t.marquee.src = E.marquee(t.game);
    }, this);

    if (view === 'elementflix') {
      var g = this.games()[Math.min(this.cursor.elementflix, games.length - 1)];
      p.desc.textContent = g ? E.describe(g) : '';
      p.image.src = this.artFor(g) || placeholder;
      p.marquee.src = E.marquee(g);
    }

    this.setTileCursor(view, Math.min(this.cursor[view], games.length - 1));
  };

  Theme.prototype.setTileCursor = function (view, index) {
    var p = this.parts[view];
    var metrics = this.tileMetrics(view);
    if (!p.tileList || !p.tileList.length) return;

    index = Math.max(0, Math.min(index, p.tileList.length - 1));
    this.cursor[view] = index;

    var zoom = (view === 'boxes' || view === 'elementflix') ? metrics.selectedZoom : 1;
    var mq = this.L.boxes.marquee;

    p.tileList.forEach(function (t, i) {
      var on = i === index;
      t.el.classList.toggle('is-selected', on);
      if (view === 'boxes' || view === 'elementflix') {
        t.el.style.transform = on ? 'scale(' + zoom + ')' : 'scale(1)';
      }
      if (view === 'boxes') {
        var box = on ? mq.maxSizeSelected : mq.maxSize;
        t.marquee.style.width = (metrics.tileW * box[0]) + 'px';
        t.marquee.style.height = (metrics.tileH * box[1]) + 'px';
      }
    });

    /* Keep the selected line inside the window, along the scroll axis. */
    var vertical = view === 'elementflix' && metrics.direction === 'vertical';
    if (vertical) {
      var rowH = metrics.tileH + metrics.margin[1];
      var rowIdx = Math.floor(index / metrics.cols);
      var lastRow = Math.floor((p.tileList.length - 1) / metrics.cols);
      var visRows = Math.max(1, Math.floor(
        (metrics.box.height - metrics.padding[1] * 2 + metrics.margin[1]) / rowH));
      var firstRow = Math.max(0, Math.min(rowIdx - Math.floor((visRows - 1) / 2),
                                          lastRow - visRows + 1));
      p.strip.style.transform = 'translateY(' + (-firstRow * rowH) + 'px)';
    } else {
      var col = p.tileList[index].col;
      var colW = metrics.tileW + metrics.margin[0];
      var visible = Math.max(1, Math.floor(
        (metrics.box.width - metrics.padding[0] * 2 + metrics.margin[0]) / colW));
      var lastCol = p.tileList[p.tileList.length - 1].col;
      var first = Math.max(0, Math.min(col - Math.floor((visible - 1) / 2),
                                       lastCol - visible + 1));
      if (first < 0) first = 0;
      p.strip.style.transform = 'translateX(' + (-first * colW) + 'px)';
    }

    var game = p.tileList[index].game;
    if (p.mdName) p.mdName.textContent = game.name;
    if (view === 'elementflix') {
      p.desc.textContent = E.describe(game);
      p.image.src = this.artFor(game) || this.placeholder();
      p.marquee.src = E.marquee(game);
    }
  };

  /* ---- view switching --------------------------------------------------- */

  Theme.prototype.showView = function (name, immediate) {
    if (VIEWS.indexOf(name) < 0) return;
    if (LIST_VIEWS.indexOf(name) >= 0 || TILE_VIEWS.indexOf(name) >= 0) {
      this._lastGamelist = name;
    }
    this.view = name;

    VIEWS.forEach(function (v) {
      this.layers[v].classList.toggle('active', v === name);
    }, this);

    /* The menu draws over whichever view is behind it, so that view stays up. */
    if (name === 'menu') {
      this.layers[this._lastGamelist || 'system'].classList.add('active');
      this.setMenuCursor(this.cursor.menu);
    }

    var isSystem = name === 'system';
    /* ES hides the help bar behind the menu. */
    var hideHelp = name === 'menu';
    this.helpSystem.style.display = (isSystem && !hideHelp) ? '' : 'none';
    this.helpGamelist.style.display = (!isSystem && !hideHelp) ? '' : 'none';

    var p = this.parts.system;
    if (isSystem) {
      if (immediate && !this.interactive) {
        p.cover.classList.remove('is-animated');
      } else {
        p.cover.classList.remove('is-animated');
        void p.cover.offsetWidth;
        p.cover.classList.add('is-animated');
      }
    }

    if (this.chrome) this.syncChrome();
  };

  Theme.prototype.lastGamelistView = function () {
    return this._lastGamelist || 'detailed';
  };

  /* ---- clock ------------------------------------------------------------ */

  Theme.prototype.startClock = function () {
    var self = this;
    function tick() {
      var d = new Date();
      var h = d.getHours();
      var m = String(d.getMinutes()).padStart(2, '0');
      var ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      self.status.clock.textContent = h + ':' + m + ' ' + ampm;
    }
    tick();
    /* Static snapshots tick once; only the interactive page keeps time. */
    if (this.interactive) this._clock = setInterval(tick, 20000);
  };

  /* ---- input ------------------------------------------------------------ */

  Theme.prototype.press = function (button) {
    this.flash(button);
    var view = this.view;

    if (button === 'start') { this.showView('menu'); return; }

    if (view === 'system') {
      if (button === 'left') this.moveSystem(-1);
      else if (button === 'right') this.moveSystem(1);
      else if (button === 'up') this.moveSystem(-1);
      else if (button === 'down') this.moveSystem(1);
      else if (button === 'b') this.showView(this.lastGamelistView());
      return;
    }

    if (view === 'menu') {
      var rows = this.parts.menu.rows;
      if (button === 'up') this.setMenuCursor(this.cursor.menu - 1);
      else if (button === 'down') this.setMenuCursor(this.cursor.menu + 1);
      else if (button === 'a' || button === 'start') this.showView(this.lastGamelistView());
      return;
    }

    if (LIST_VIEWS.indexOf(view) >= 0) {
      var box = this.listBox(view);
      var page = Math.max(1, Math.floor(box.height / box.row));
      if (button === 'up') this.setListCursor(view, this.cursor[view] - 1);
      else if (button === 'down') this.setListCursor(view, this.cursor[view] + 1);
      else if (button === 'l' || button === 'left') this.setListCursor(view, this.cursor[view] - page);
      else if (button === 'r' || button === 'right') this.setListCursor(view, this.cursor[view] + page);
      else if (button === 'a') this.showView('system');
      else if (button === 'b') this.launchGame();
      return;
    }

    /* Tile views. A horizontal imagegrid is column-major, so up/down walk a
     * column and left/right step one; a vertical one is the transpose. */
    var metrics = this.tileMetrics(view);
    var vertical = view === 'elementflix' && metrics.direction === 'vertical';
    var step = vertical ? metrics.cols : metrics.rows;
    var i = this.cursor[view];

    if (button === 'up') this.setTileCursor(view, vertical ? i - step : i - 1);
    else if (button === 'down') this.setTileCursor(view, vertical ? i + step : i + 1);
    else if (button === 'left') this.setTileCursor(view, vertical ? i - 1 : i - step);
    else if (button === 'right') this.setTileCursor(view, vertical ? i + 1 : i + step);
    else if (button === 'l') this.setTileCursor(view, i - metrics.rows * metrics.cols);
    else if (button === 'r') this.setTileCursor(view, i + metrics.rows * metrics.cols);
    else if (button === 'a') this.showView('system');
    else if (button === 'b') this.launchGame();
  };

  Theme.prototype.setMenuCursor = function (index) {
    var rows = this.parts.menu.rows;
    if (!rows.length) return;
    index = Math.max(0, Math.min(index, rows.length - 1));
    this.cursor.menu = index;
    rows.forEach(function (r, i) { r.classList.toggle('is-selected', i === index); });
  };

  Theme.prototype.launchGame = function () {
    var self = this;
    this.launch.classList.add('is-on');
    setTimeout(function () { self.launch.classList.remove('is-on'); }, 900);
  };

  Theme.prototype.flash = function (button) {
    document.querySelectorAll('[data-btn="' + button + '"]').forEach(function (el) {
      el.classList.add('is-pressed');
      setTimeout(function () { el.classList.remove('is-pressed'); }, 120);
    });
  };

  Theme.prototype.wireInput = function () {
    var self = this;

    document.addEventListener('keydown', function (e) {
      /* Mockup-only keys first, so they never shadow a device button. */
      if (e.key === '[') { self.cycleView(-1); e.preventDefault(); return; }
      if (e.key === ']') { self.cycleView(1); e.preventDefault(); return; }
      if (e.key === ',') { self.cycleScheme(-1); e.preventDefault(); return; }
      if (e.key === '.') { self.cycleScheme(1); e.preventDefault(); return; }
      if (e.key === '\\') { self.toggleStyle(); e.preventDefault(); return; }
      if (e.key === '-') { self.stepFontSize(-1); e.preventDefault(); return; }
      if (e.key === '=') { self.stepFontSize(1); e.preventDefault(); return; }

      var button = KEYS[e.key];
      if (!button && e.code === 'ShiftRight') button = 'select';
      if (!button) return;
      e.preventDefault();
      self.press(button);
    });

    document.querySelectorAll('[data-btn]').forEach(function (el) {
      el.addEventListener('click', function () {
        self.press(el.getAttribute('data-btn'));
      });
    });
  };

  /* ---- mockup chrome ---------------------------------------------------- */

  Theme.prototype.cycleView = function (step) {
    var i = (VIEWS.indexOf(this.view) + step + VIEWS.length) % VIEWS.length;
    this.showView(VIEWS[i]);
  };

  Theme.prototype.cycleScheme = function (step) {
    var ids = E.SCHEMES.map(function (s) { return s.id; });
    var i = (ids.indexOf(this.scheme) + step + ids.length) % ids.length;
    this.scheme = ids[i];
    this.applyScheme();
    this.syncChrome();
  };

  Theme.prototype.toggleStyle = function () {
    this.style = this.style === 'dark' ? 'light' : 'dark';
    this.applyScheme();
    this.syncChrome();
  };

  Theme.prototype.stepFontSize = function (step) {
    var sizes = ['small', 'medium', 'large'];
    var i = Math.max(0, Math.min(sizes.indexOf(this.fontSize) + step, sizes.length - 1));
    if (sizes[i] === this.fontSize) return;
    this.fontSize = sizes[i];
    this.rebuild();
  };

  Theme.prototype.setSystem = function (theme) {
    var i = E.SYSTEMS.findIndex(function (s) { return s.theme === theme; });
    if (i < 0 || i === this.systemIndex) return;
    this.systemIndex = i;
    this.renderSystem();
    this.renderGamelists();
    this.syncChrome();
  };

  /* Font size and grid direction change the resolved layout, so the layers
   * are rebuilt from scratch. */
  Theme.prototype.rebuild = function () {
    var keep = { view: this.view, cursor: this.cursor };
    this._lastGamelist = this._lastGamelist;
    this.build();
    this.applyScheme();
    this.renderSystem();
    this.cursor = keep.cursor;
    this.renderGamelists();
    this.showView(keep.view, true);
    this.startClock();
    this.buildChrome();
    this.syncChrome();
  };

  Theme.prototype.buildChrome = function () {
    var self = this;
    var host = this.root.closest('.device-viewport');
    if (!host) return;
    if (this.chrome) this.chrome.remove();

    var wrap = document.createElement('div');
    wrap.className = 'el-chrome';
    host.parentNode.insertBefore(wrap, host.nextSibling);
    this.chrome = wrap;

    function section(title) {
      var s = document.createElement('section');
      var h = document.createElement('h3');
      h.textContent = title;
      s.appendChild(h);
      var row = document.createElement('div');
      row.className = 'row';
      s.appendChild(row);
      wrap.appendChild(s);
      return row;
    }

    function button(row, label, onClick) {
      var b = document.createElement('button');
      b.textContent = label;
      b.addEventListener('click', onClick);
      row.appendChild(b);
      return b;
    }

    this.chromeButtons = { view: {}, scheme: {}, style: {}, font: {}, system: {} };

    var viewRow = section('View');
    VIEWS.forEach(function (v) {
      self.chromeButtons.view[v] = button(viewRow, VIEW_LABEL[v], function () {
        self.showView(v);
      });
    });

    var schemeRow = section('Colour scheme');
    E.SCHEMES.forEach(function (s) {
      var b = document.createElement('button');
      b.className = 'swatch';
      b.title = s.label;
      var tokens = s[self.style];
      b.innerHTML = '<i style="background:#' + tokens.bgColor + '"></i>' +
                    '<i class="b" style="background:#' + tokens.mainColor + '"></i>';
      b.addEventListener('click', function () {
        self.scheme = s.id;
        self.applyScheme();
        self.syncChrome();
      });
      schemeRow.appendChild(b);
      self.chromeButtons.scheme[s.id] = b;
    });

    var styleRow = section('Style');
    ['dark', 'light'].forEach(function (st) {
      self.chromeButtons.style[st] = button(styleRow, st === 'dark' ? 'Dark' : 'Light', function () {
        self.style = st;
        self.applyScheme();
        self.buildChrome();
        self.syncChrome();
      });
    });

    var fontRow = section('Font size');
    ['small', 'medium', 'large'].forEach(function (fs) {
      self.chromeButtons.font[fs] = button(fontRow, fs[0].toUpperCase() + fs.slice(1), function () {
        if (self.fontSize === fs) return;
        self.fontSize = fs;
        self.rebuild();
      });
    });

    var sysRow = section('System');
    E.SYSTEMS.forEach(function (s) {
      self.chromeButtons.system[s.theme] = button(sysRow, s.theme, function () {
        self.setSystem(s.theme);
      });
    });

    /*
     * The remaining theme subsets. Each maps one-to-one onto a <subset> in the
     * source, so the labels here are the theme's own displayName values.
     */
    function subset(title, key, options, needsRebuild) {
      var row = section(title);
      self.chromeButtons[key] = {};
      options.forEach(function (o) {
        var value = o.value !== undefined ? o.value : o;
        var label = o.label !== undefined ? o.label : o;
        self.chromeButtons[key][String(value)] = button(row, label, function () {
          if (self[key] === value) return;
          self[key] = value;
          if (needsRebuild) self.rebuild();
          else { self.renderSystem(); self.renderGamelists(); self.syncChrome(); }
        });
      });
    }

    subset('Grid game image', 'gridImage',
      [{ value: 'screenshot', label: 'Screenshot' },
       { value: 'thumbnail', label: 'Thumbnail' },
       { value: 'marquee', label: 'Marquee' }]);

    subset('Default icons style', 'iconStyle',
      [{ value: 'Square', label: 'Square' }, { value: 'Steam', label: 'Steam' }]);

    subset('Box art style', 'boxArtStyle',
      [{ value: 'cover', label: 'Cover' }, { value: 'fit', label: 'Fit' },
       { value: 'stretch', label: 'Stretch' }]);

    /* GridDirection changes the resolved grid geometry, so it needs a rebuild. */
    subset('Grid direction', 'gridDirection',
      [{ value: 'horizontal', label: 'Horizontal' },
       { value: 'vertical', label: 'Vertical' }], true);

    subset('Status bar', 'statusBar',
      [{ value: 'complete', label: 'Clock + Battery' }, { value: 'clock', label: 'Clock' },
       { value: 'battery', label: 'Battery' }, { value: 'hidden', label: 'Hidden' }]);

    subset('Background style', 'background',
      [{ value: 'default', label: 'Default' }, { value: 'random', label: 'Random' },
       { value: 'custom', label: 'Custom' }]);

    subset('Video on carousel', 'carouselVideo',
      [{ value: false, label: 'Disabled' }, { value: true, label: 'Enabled' }]);

    var hint = document.createElement('p');
    hint.className = 'hint';
    hint.innerHTML =
      'Device keys: arrows D-pad, <kbd>Z</kbd> A, <kbd>X</kbd> B, <kbd>A</kbd> X, ' +
      '<kbd>S</kbd> Y, <kbd>Enter</kbd> Start, <kbd>Q</kbd>/<kbd>W</kbd> L/R. ' +
      'Mockup only: <kbd>[</kbd> <kbd>]</kbd> view, <kbd>,</kbd> <kbd>.</kbd> scheme, ' +
      '<kbd>\\</kbd> dark/light, <kbd>-</kbd> <kbd>=</kbd> font size. ' +
      'These controls stand in for the theme’s own switcher, which lives in ' +
      'EmulationStation’s Theme Configuration menu.';
    wrap.appendChild(hint);

    this.syncChrome();
  };

  Theme.prototype.syncChrome = function () {
    if (!this.chromeButtons) return;
    var b = this.chromeButtons;
    Object.keys(b.view).forEach(function (k) {
      b.view[k].classList.toggle('is-on', k === this.view);
    }, this);
    Object.keys(b.scheme).forEach(function (k) {
      b.scheme[k].classList.toggle('is-on', k === this.scheme);
    }, this);
    Object.keys(b.style).forEach(function (k) {
      b.style[k].classList.toggle('is-on', k === this.style);
    }, this);
    Object.keys(b.font).forEach(function (k) {
      b.font[k].classList.toggle('is-on', k === this.fontSize);
    }, this);
    Object.keys(b.system).forEach(function (k) {
      b.system[k].classList.toggle('is-on', k === this.system().theme);
    }, this);

    ['gridImage', 'iconStyle', 'boxArtStyle', 'gridDirection',
     'statusBar', 'background', 'carouselVideo'].forEach(function (key) {
      if (!b[key]) return;
      Object.keys(b[key]).forEach(function (k) {
        b[key][k].classList.toggle('is-on', k === String(this[key]));
      }, this);
    }, this);
  };

  /*
   * Returns the controller and also parks it on Elementerial.current, so the
   * live state of a screen can be poked at from devtools - handy when checking
   * a subset or a resolved measurement against the source.
   */
  E.boot = function (root, opts) {
    var theme = new Theme(root, opts || {});
    E.current = theme;
    return theme;
  };
})(window.Elementerial);
