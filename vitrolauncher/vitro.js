/*
 * vitro.js - VitroLauncher mockup controller.
 *
 * Vitro.boot(rootEl, { w, h, screen, interactive }) builds the whole launcher
 * inside an empty `.vitro` root: animated background, three screens, persistent
 * status + nav pills, and (when interactive) input handling and every transition.
 *
 * Input map (matches the repo convention + VitroLauncher desktop keys):
 *   arrows = D-pad   Z = A (launch/activate)   X = B (back)
 *   Q = L1 / W = R1 (prev/next screen)   Right Shift = Select (toggle Settings)
 *   A = X (grid skip page)   S = Y (grid bookmark)   Enter = Start   Esc = Menu (hold = power off)
 *   L1 + X + START held 2s = exit combo
 */
(function (V) {
  'use strict';

  var SCREEN_ORDER = ['recent', 'all', 'settings'];
  var SIZE_SCALE = { small: 0.75, medium: 1, large: 1.2 };

  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  function Launcher(root, opts) {
    this.root = root;
    this.W = opts.w; this.H = opts.h;
    this.interactive = opts.interactive !== false;
    this.values = V.defaults();
    this.screen = opts.screen || this.values.default_screen;
    this.pressed = {};
    this.build();
    this.applyTheme();
    this.buildRecent();
    this.buildAll();
    this.buildSettings();
    this.showScreen(this.screen, true);
    this.startClock();
    if (this.interactive) { this.wireInput(); this.resetNavAutohide(); }
    this.runStartup();
  }

  Launcher.prototype.build = function () {
    var root = this.root;
    root.classList.add('vitro');
    VitroBg.init(root, this.W, this.H);         // inserts bg canvases as first children

    this.wash = el('div', 'vitro-wash'); root.appendChild(this.wash);

    this.ui = el('div', 'vitro-ui'); root.appendChild(this.ui);
    this.screensWrap = el('div', 'vitro-screens'); this.ui.appendChild(this.screensWrap);
    this.layers = {};
    ['recent', 'all', 'settings'].forEach(function (name) {
      var l = el('div', 'screen-layer'); l.dataset.screen = name;
      this.screensWrap.appendChild(l); this.layers[name] = l;
    }, this);

    // status pill
    this.status = el('div', 'status-pill glass');
    this.statusTime = el('span', 'status-time');
    var batt = el('span', 'status-batt');
    var icon = el('span', 'batt-icon'); this.battFill = el('span', 'batt-fill'); icon.appendChild(this.battFill);
    this.battPct = el('span'); this.battPct.textContent = '85%';
    batt.appendChild(icon); batt.appendChild(this.battPct);
    this.status.appendChild(this.statusTime); this.status.appendChild(batt);
    this.ui.appendChild(this.status);

    // nav pill
    this.nav = el('div', 'nav-pill');
    this.navPillGlass = el('div', 'glass'); this.navPillGlass.style.cssText = 'position:absolute;inset:0;border-radius:999px;';
    this.nav.appendChild(this.navPillGlass);
    this.navBubble = el('div', 'nav-bubble'); this.nav.appendChild(this.navBubble);
    var slots = el('div', 'nav-slots'); this.navSlots = [];
    var iconNames = { recent: 'lastplayed', all: 'allTitles', settings: 'settings' };
    SCREEN_ORDER.forEach(function (name) {
      var slot = el('div', 'nav-slot');
      var img = el('img', 'invertible'); img.src = V.ASSET + 'images/icons/' + iconNames[name] + '.png'; img.alt = name;
      slot.appendChild(img); slots.appendChild(slot); this.navSlots.push(slot);
    }, this);
    this.nav.appendChild(slots);
    var l1 = el('img', 'nav-l1 invertible'); l1.src = V.ASSET + 'images/buttons/button_L1.png';
    var r1 = el('img', 'nav-r1 invertible'); r1.src = V.ASSET + 'images/buttons/button_R1.png';
    this.nav.appendChild(l1); this.nav.appendChild(r1);
    this.ui.appendChild(this.nav);

    // overlays
    this.startupBlack = el('div', 'startup-black'); root.appendChild(this.startupBlack);
    this.poweroffBlack = el('div', 'poweroff-black'); root.appendChild(this.poweroffBlack);
    this.exitBanner = el('div', 'exit-banner');
    var et = el('div', 'exit-banner-text'); et.textContent = 'Keep holding to exit to muOS...';
    var bar = el('div', 'exit-bar'); this.exitFill = el('div', 'exit-bar-fill'); bar.appendChild(this.exitFill);
    this.exitBanner.appendChild(et); this.exitBanner.appendChild(bar); root.appendChild(this.exitBanner);
    this.loadingCover = el('div', 'loading-cover');
    this.loadingText = el('div', 'loading-text'); this.loadingCover.appendChild(this.loadingText);
    root.appendChild(this.loadingCover);
  };

  // ---- theming ---------------------------------------------------------

  Launcher.prototype.applyTheme = function () {
    var v = this.values, c = V.COLORS[v.color], theme = v.theme;
    var simple = theme.indexOf('simple') === 0;
    var uiLight = theme === 'simple-light' ? true : theme === 'simple-dark' ? false : !!c.light;
    var bgLight = !!c.light; // background modules use the color scheme's light flag
    var r = this.root;
    r.classList.toggle('theme-light', uiLight);
    r.classList.toggle('no-transparency', !v.transparency);
    r.classList.toggle('no-tooltips', !v.tooltips);
    r.classList.toggle('show-titles', !!v.show_titles);
    r.style.setProperty('--accent', c.accent);
    r.style.setProperty('--bg', c.bg);
    r.style.setProperty('--fg', uiLight ? '#1f242e' : '#ffffff');
    r.style.setProperty('--fg-rgb', uiLight ? '31,36,46' : '255,255,255');
    r.style.setProperty('--wash', uiLight ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)');
    r.style.setProperty('--highlight', (uiLight || simple) ? c.accent : '#ffffff');
    // background
    var bgTheme = simple ? theme : theme; // pass through
    var bgLightForModule = theme === 'simple-light' ? true : theme === 'simple-dark' ? false : bgLight;
    VitroBg.set(bgTheme, { accent: c.accent, bg: c.bg, light: bgLightForModule });
  };

  // ---- Last Played: carousel ------------------------------------------

  Launcher.prototype.recentList = function () {
    return V.DATA.slice(0, this.values.recent_limit);
  };
  Launcher.prototype.covMetrics = function () {
    var scale = SIZE_SCALE[this.values.cover_size] || 1.2;
    var aspect = 2 / 3; // cover_aspect default 2:3
    var hu = 160 * scale, hf = 200 * scale;
    var wu = hu * aspect, wf = hf * aspect;
    return {
      wu: wu, hu: hu, wf: wf, hf: hf,
      ru: 0.15 * Math.min(wu, hu), rf: 0.15 * Math.min(wf, hf), gap: 20
    };
  };
  Launcher.prototype.buildRecent = function () {
    var layer = this.layers.recent; layer.innerHTML = '';
    var games = this.recentList();
    if (!games.length) {
      var e = el('div', 'empty-state');
      e.textContent = 'No games found.\nAdd folders with info.cfg inside the GAME directory.';
      layer.appendChild(e); this.recentTiles = []; return;
    }
    var built = V.buildCarousel(games, { aspect: '2:3' });
    this.recentRow = built.row; this.recentTiles = built.tiles;
    layer.appendChild(built.row);
    this.recentFocus = clamp(this.recentFocus || 0, 0, games.length - 1);
    this.applyCovMetrics();
    this.setRecentFocus(this.recentFocus, true);
  };
  Launcher.prototype.applyCovMetrics = function () {
    if (!this.recentRow) return;
    var m = this.covMetrics(), s = this.recentRow.style;
    s.setProperty('--cov-w', m.wu + 'px'); s.setProperty('--cov-h', m.hu + 'px');
    s.setProperty('--cov-wf', m.wf + 'px'); s.setProperty('--cov-hf', m.hf + 'px');
    s.setProperty('--cov-r', m.ru + 'px'); s.setProperty('--cov-rf', m.rf + 'px');
  };
  Launcher.prototype.setRecentFocus = function (i, instant) {
    var tiles = this.recentTiles; if (!tiles || !tiles.length) return;
    this.recentFocus = i = clamp(i, 0, tiles.length - 1);
    tiles.forEach(function (t, j) { t.classList.toggle('is-focused', j === i); });
    var m = this.covMetrics();
    var center = i * (m.wu + m.gap) + m.wf / 2;      // focused tile center within row (target widths)
    var scroll = this.W * 0.5 - center;
    if (instant) {
      var prev = this.recentRow.style.transition; this.recentRow.style.transition = 'none';
      this.recentRow.style.setProperty('--scroll', scroll + 'px');
      this.recentRow.offsetHeight; this.recentRow.style.transition = prev || '';
    } else {
      this.recentRow.style.setProperty('--scroll', scroll + 'px');
    }
  };

  // ---- All Titles: grid ------------------------------------------------

  Launcher.prototype.allList = function () {
    var list = V.DATA.slice();
    var sort = this.values.all_sort;
    if (sort === 'az') list.sort(function (a, b) { return a.name.localeCompare(b.name); });
    else if (sort === 'playtime') list.sort(function (a, b) { return b.playSeconds - a.playSeconds || a.name.localeCompare(b.name); });
    // 'recent' keeps DATA order (most-recent first)
    if (this.values.all_bookmarks === 'first') {
      list.sort(function (a, b) { return (b.bookmarked ? 1 : 0) - (a.bookmarked ? 1 : 0); });
    }
    return list;
  };
  Launcher.prototype.gridDims = function () {
    return this.values.all_icon_size === 'large'
      ? { cols: 5, rows: 2, layout: 'large' } : { cols: 7, rows: 3, layout: 'small' };
  };
  Launcher.prototype.buildAll = function () {
    var layer = this.layers.all; layer.innerHTML = '';
    this.allGames = this.allList();
    if (!this.allGames.length) {
      var e = el('div', 'empty-state');
      e.textContent = 'No games found.\nAdd folders with info.cfg inside the GAME directory.';
      layer.appendChild(e); return;
    }
    this.gridHost = el('div'); layer.appendChild(this.gridHost);
    this.gridCaption = el('div', 'grid-caption');
    this.gridName = el('div', 'grid-name'); this.gridInfo = el('div', 'grid-info');
    this.gridCaption.appendChild(this.gridName); this.gridCaption.appendChild(this.gridInfo);
    layer.appendChild(this.gridCaption);
    this.arrowL = el('img', 'grid-arrow left invertible'); this.arrowL.src = V.ASSET + 'images/glass-arrow-right.png';
    this.arrowR = el('img', 'grid-arrow right invertible'); this.arrowR.src = V.ASSET + 'images/glass-arrow-right.png';
    this.xskip = el('img', 'grid-xskip invertible');
    layer.appendChild(this.arrowL); layer.appendChild(this.arrowR); layer.appendChild(this.xskip);
    this.allFocus = clamp(this.allFocus || 0, 0, this.allGames.length - 1);
    this.renderGridPage(true);
  };
  Launcher.prototype.renderGridPage = function () {
    var d = this.gridDims(), per = d.cols * d.rows;
    var page = Math.floor(this.allFocus / per);
    var built = V.buildGridPage(this.allGames, page, d.layout);
    this.gridHost.innerHTML = ''; this.gridHost.appendChild(built.pageEl);
    this.gridIcons = built.icons; this.gridPage = page; this.gridPer = per; this.gridCols = d.cols;
    this.setAllFocus(this.allFocus);
    // arrows
    var pageCount = Math.ceil(this.allGames.length / per);
    this.arrowL.style.display = page > 0 ? '' : 'none';
    this.arrowR.style.display = page < pageCount - 1 ? '' : 'none';
    var showX = this.values.tooltips && pageCount > 1;
    this.xskip.style.display = showX ? '' : 'none';
    this.xskip.src = V.ASSET + 'images/buttons/' + (this.values.button_style === 'modern' ? 'button_Square' : 'button_X') + '.png';
  };
  Launcher.prototype.setAllFocus = function (idx) {
    this.allFocus = idx = clamp(idx, 0, this.allGames.length - 1);
    var per = this.gridPer, page = this.gridPage;
    var local = idx - page * per;
    this.gridIcons.forEach(function (ic, j) { ic.classList.toggle('is-focused', j === local); });
    var game = this.allGames[idx];
    this.gridName.textContent = game.name;
    this.gridInfo.innerHTML = '';
    var pt = V.formatPlaytime(game.playSeconds);
    if (this.values.show_playtime && pt) {
      var s = el('span'); s.textContent = pt + ' Played  |  '; this.gridInfo.appendChild(s);
    }
    var glyph = el('img'); glyph.className = 'invertible';
    glyph.src = V.ASSET + 'images/buttons/' + (this.values.button_style === 'modern' ? 'button_Triangle' : 'button_Y') + '.png';
    this.gridInfo.appendChild(glyph);
    var hint = el('span'); hint.textContent = ' to ' + (game.bookmarked ? 'Unbookmark' : 'Bookmark');
    this.gridInfo.appendChild(hint);
  };
  Launcher.prototype.gridMove = function (dx, dy) {
    var d = this.gridDims(), per = d.cols * d.rows, cols = d.cols;
    var idx = this.allFocus, page = Math.floor(idx / per), local = idx - page * per;
    var col = local % cols, row = Math.floor(local / cols);
    var pageCount = Math.ceil(this.allGames.length / per);
    if (dy === -1) { if (row > 0) this.moveFocusTo(idx - cols); return; }
    if (dy === 1) { if (idx + cols < this.allGames.length && row < d.rows - 1) this.moveFocusTo(idx + cols); return; }
    if (dx === -1) {
      if (col > 0) this.moveFocusTo(idx - 1);
      else if (page > 0) this.turnPage(page - 1, row * cols + (cols - 1)); // same row, last col
    } else if (dx === 1) {
      if (col < cols - 1 && idx + 1 < this.allGames.length) this.moveFocusTo(idx + 1);
      else if (page < pageCount - 1) this.turnPage(page + 1, row * cols); // same row, first col
    }
  };
  Launcher.prototype.moveFocusTo = function (idx) {
    idx = clamp(idx, 0, this.allGames.length - 1);
    var per = this.gridPer;
    if (Math.floor(idx / per) !== this.gridPage) { this.allFocus = idx; this.renderGridPage(); }
    else this.setAllFocus(idx);
  };
  Launcher.prototype.turnPage = function (page, localTarget) {
    var per = this.gridPer;
    var idx = clamp(page * per + localTarget, 0, this.allGames.length - 1);
    this.allFocus = idx; this.renderGridPage();
  };
  Launcher.prototype.skipPage = function () {
    var per = this.gridPer, pageCount = Math.ceil(this.allGames.length / per);
    var page = (this.gridPage + 1) % pageCount;
    var local = this.allFocus - this.gridPage * per;
    this.turnPage(page, local);
  };
  Launcher.prototype.toggleBookmark = function () {
    var game = this.allGames[this.allFocus]; if (!game) return;
    game.bookmarked = !game.bookmarked;
    this.renderGridPage(); // reflect badge + caption instantly
  };

  // ---- Settings --------------------------------------------------------

  Launcher.prototype.buildSettings = function () {
    var host = el('div', 'settings-list');
    var title = el('div', 'settings-title'); title.textContent = 'Settings';
    this.layers.settings.innerHTML = '';
    this.layers.settings.appendChild(title);
    var built = V.buildSettings(V.SETTINGS, this.values);
    this.settingsScroll = built.scroll; this.settingsRows = built.rows;
    host.appendChild(built.scroll); this.layers.settings.appendChild(host);
    this.settingsMore = el('div', 'settings-more'); this.settingsMore.textContent = 'more';
    this.layers.settings.appendChild(this.settingsMore);
    this.settingsFocus = this.settingsFocus || 0;
    this.settingsScrollTop = 0;
    this.setSettingsFocus(this.settingsFocus);
  };
  Launcher.prototype.setSettingsFocus = function (i) {
    var rows = this.settingsRows;
    this.settingsFocus = i = clamp(i, 0, rows.length - 1);
    rows.forEach(function (r, j) { r.el.classList.toggle('is-focused', j === i); });
    if (i < this.settingsScrollTop) this.settingsScrollTop = i;
    if (i > this.settingsScrollTop + 6) this.settingsScrollTop = i - 6;
    this.settingsScroll.style.transform = 'translateY(' + (-this.settingsScrollTop * 42) + 'px)';
    this.settingsMore.style.display = (this.settingsScrollTop + 7 < rows.length) ? '' : 'none';
  };
  Launcher.prototype.settingsChange = function (dir) {
    var def = this.settingsRows[this.settingsFocus].def, v = this.values, key = def.key;
    if (def.type === 'action') return;
    if (def.type === 'color') { v.color = (v.color + dir + V.COLORS.length) % V.COLORS.length; }
    else if (def.type === 'toggle') { v[key] = !v[key]; }
    else if (def.type === 'percent') { v[key] = clamp((v[key] || 0) + dir * 10, 0, 100); }
    else if (def.type === 'buttons' || def.type === 'options') {
      var opts = def.options, cur = 0;
      for (var i = 0; i < opts.length; i++) if (opts[i].v === v[key]) { cur = i; break; }
      v[key] = opts[(cur + dir + opts.length) % opts.length].v;
    }
    V.refreshSettings(this.settingsRows, v);
    this.applyEffects(key);
  };
  Launcher.prototype.settingsActivate = function () {
    var def = this.settingsRows[this.settingsFocus].def;
    if (def.type === 'action') { // Reset Settings
      this.values = V.defaults();
      this.applyTheme();
      V.refreshSettings(this.settingsRows, this.values);
      this.buildRecent(); this.buildAll();
      this.resetNavAutohide();
    }
  };
  // re-apply side effects of a changed setting key
  Launcher.prototype.applyEffects = function (key) {
    if (key === 'color' || key === 'theme' || key === 'transparency' || key === 'tooltips') this.applyTheme();
    if (key === 'cover_size') { this.applyCovMetrics(); this.setRecentFocus(this.recentFocus, true); }
    if (key === 'show_titles') this.root.classList.toggle('show-titles', !!this.values.show_titles);
    if (key === 'recent_limit' || key === 'show_playtime') this.buildRecent();
    if (key === 'all_icon_size' || key === 'all_sort' || key === 'all_bookmarks') this.buildAll();
    if (key === 'tooltips' || key === 'button_style' || key === 'show_playtime') { this.renderGridPage && this.gridIcons && this.renderGridPage(); }
    if (key === 'nav_autohide') this.resetNavAutohide();
  };

  // ---- screen switching + nav pill ------------------------------------

  Launcher.prototype.showScreen = function (name, instant) {
    this.screen = name;
    var self = this;
    SCREEN_ORDER.forEach(function (n) { self.layers[n].classList.toggle('active', n === name); });
    var pos = SCREEN_ORDER.indexOf(name);
    this.navBubble.style.transform = 'translateX(' + (pos * 70) + 'px)';
    this.navSlots.forEach(function (s, j) { s.classList.toggle('active', j === pos); });
    if (this.interactive) this.resetNavAutohide();
  };
  Launcher.prototype.switchScreen = function (dir) {
    var pos = SCREEN_ORDER.indexOf(this.screen);
    pos = clamp(pos + dir, 0, SCREEN_ORDER.length - 1);
    this.showScreen(SCREEN_ORDER[pos]);
  };
  Launcher.prototype.toggleSettings = function () {
    this.showScreen(this.screen === 'settings' ? (this.values.default_screen || 'recent') : 'settings');
  };
  Launcher.prototype.resetNavAutohide = function () {
    if (!this.interactive) return;
    this.nav.classList.remove('hidden');
    if (this._navTimer) clearTimeout(this._navTimer);
    var secs = this.values.nav_autohide;
    if (secs > 0) {
      var self = this;
      this._navTimer = setTimeout(function () { self.nav.classList.add('hidden'); }, secs * 1000);
    }
  };

  // ---- input -----------------------------------------------------------

  Launcher.prototype.press = function (button) {
    this.flash(button);
    if (this.interactive) this.resetNavAutohide();
    switch (button) {
      case 'l': this.switchScreen(-1); break;
      case 'r': this.switchScreen(1); break;
      case 'select': this.toggleSettings(); break;
      case 'up': this.dpad(0, -1); break;
      case 'down': this.dpad(0, 1); break;
      case 'left': this.dpad(-1, 0); break;
      case 'right': this.dpad(1, 0); break;
      case 'a': this.confirm(); break;
      case 'b': if (this.screen === 'settings') this.showScreen(this.values.default_screen || 'recent'); break;
      case 'x': if (this.screen === 'all') this.skipPage(); break;
      case 'y': if (this.screen === 'all') this.toggleBookmark(); break;
    }
  };
  Launcher.prototype.dpad = function (dx, dy) {
    if (this.screen === 'recent') {
      if (dx) this.setRecentFocus(this.recentFocus + dx);
    } else if (this.screen === 'all') {
      this.gridMove(dx, dy);
    } else if (this.screen === 'settings') {
      if (dy) this.setSettingsFocus(this.settingsFocus + dy);
      else if (dx) this.settingsChange(dx);
    }
  };
  Launcher.prototype.confirm = function () {
    if (this.screen === 'recent' && this.recentTiles && this.recentTiles.length) {
      this.launchGame(this.recentList()[this.recentFocus]);
    } else if (this.screen === 'all' && this.allGames && this.allGames.length) {
      this.launchGame(this.allGames[this.allFocus]);
    } else if (this.screen === 'settings') {
      this.settingsActivate();
    }
  };
  Launcher.prototype.flash = function (button) {
    this.root.querySelectorAll('[data-btn="' + button + '"]').forEach(function (e) {
      e.classList.add('is-pressed'); setTimeout(function () { e.classList.remove('is-pressed'); }, 120);
    });
  };

  var KEYS = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    z: 'a', Z: 'a', x: 'b', X: 'b', Backspace: 'b',
    a: 'x', A: 'x', s: 'y', S: 'y', q: 'l', Q: 'l', w: 'r', W: 'r', Enter: 'start'
  };
  Launcher.prototype.wireInput = function () {
    var self = this;
    document.addEventListener('keydown', function (e) {
      if (e.repeat && (e.key === 'Escape')) return;
      if (e.key === 'Escape') { e.preventDefault(); self.startPowerOff(); return; }
      var button = e.code === 'ShiftRight' ? 'select' : KEYS[e.key];
      self.pressed[button] = true;
      self.checkExitCombo();
      if (!button) return;
      if (e.repeat && (button === 'start')) return;
      e.preventDefault();
      if (button === 'start') return; // start alone: no-op here (used in exit combo)
      self.press(button);
    });
    document.addEventListener('keyup', function (e) {
      if (e.key === 'Escape') { self.cancelPowerOff(); return; }
      var button = e.code === 'ShiftRight' ? 'select' : KEYS[e.key];
      self.pressed[button] = false;
      self.cancelExitCombo();
    });
    // on-screen buttons in the device frame
    document.querySelectorAll('[data-btn]').forEach(function (b) {
      b.addEventListener('click', function () {
        var btn = b.getAttribute('data-btn');
        if (btn === 'menu') { self.startPowerOff(); setTimeout(function () { self.cancelPowerOff(); }, 500); return; }
        if (btn === 'start') return;
        self.press(btn);
      });
    });
  };

  // ---- transitions: startup / power-off / exit / loading --------------

  Launcher.prototype.runStartup = function () {
    var r = this.root;
    if (!this.interactive || !this.values.startup_fade) { return; }
    r.classList.add('booting');
    r.offsetHeight; // reflow so the initial state paints
    requestAnimationFrame(function () { r.classList.add('boot-bg'); });
    setTimeout(function () { r.classList.add('boot-ui'); }, 600);
    setTimeout(function () { r.classList.remove('booting', 'boot-bg', 'boot-ui'); }, 1100);
  };
  Launcher.prototype.startPowerOff = function () {
    if (this._powerHeld) return;
    this._powerHeld = true;
    var b = this.poweroffBlack;
    b.style.transition = 'opacity 2000ms linear'; b.style.opacity = '1';
    var self = this;
    this._powerTimer = setTimeout(function () { self._poweredOff = true; }, 2000);
  };
  Launcher.prototype.cancelPowerOff = function () {
    if (!this._powerHeld || this._poweredOff) return;
    this._powerHeld = false; clearTimeout(this._powerTimer);
    var b = this.poweroffBlack;
    b.style.transition = 'opacity 400ms linear'; b.style.opacity = '0';
  };
  Launcher.prototype.checkExitCombo = function () {
    if (this._exiting) return;
    if (this.pressed.l && this.pressed.x && this.pressed.start) {
      this._exiting = true;
      this.exitBanner.classList.add('show');
      var fill = this.exitFill;
      fill.style.transition = 'none'; fill.style.width = '0';
      fill.offsetHeight;
      fill.style.transition = 'width 2000ms linear'; fill.style.width = '100%';
      var self = this;
      this._exitTimer = setTimeout(function () { self._exited = true; }, 2000);
    }
  };
  Launcher.prototype.cancelExitCombo = function () {
    if (!this._exiting || this._exited) return;
    if (this.pressed.l && this.pressed.x && this.pressed.start) return;
    this._exiting = false; clearTimeout(this._exitTimer);
    this.exitBanner.classList.remove('show');
    this.exitFill.style.transition = 'none'; this.exitFill.style.width = '0';
  };
  Launcher.prototype.launchGame = function (game) {
    if (!game || this._loading) return;
    this._loading = true;
    var cover = this.loadingCover;
    this.loadingText.textContent = 'Loading...';
    cover.classList.add('show');
    cover.style.transition = 'opacity 1100ms ease-in-out'; cover.style.opacity = '1';
    var self = this;
    setTimeout(function () {
      cover.style.transition = 'opacity 500ms ease-in-out'; cover.style.opacity = '0';
      setTimeout(function () { cover.classList.remove('show'); self._loading = false; }, 500);
    }, 1100 + 250);
  };

  // ---- status clock ----------------------------------------------------

  Launcher.prototype.startClock = function () {
    var self = this;
    function tick() {
      var d = new Date();
      var h = d.getHours(), m = d.getMinutes(), ap = h >= 12 ? 'PM' : 'AM';
      h = h % 12; if (h === 0) h = 12;
      self.statusTime.textContent = h + ':' + (m < 10 ? '0' + m : m) + ' ' + ap;
    }
    tick();
    if (this.interactive) this._clock = setInterval(tick, 1000);
  };

  // ---- public boot -----------------------------------------------------

  V.boot = function (root, opts) {
    opts = opts || {};
    return new Launcher(root, opts);
  };
})(window.Vitro);
