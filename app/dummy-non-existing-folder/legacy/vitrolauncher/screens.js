/*
 * screens.js - VitroLauncher sample library data + DOM builders.
 *
 * Shared by the interactive launcher and the static per-screen reference files.
 * Builders create the full DOM for a screen once; vitro.js drives focus by
 * toggling classes so CSS transitions stay smooth.
 */
window.Vitro = window.Vitro || {};
(function (V) {
  'use strict';

  V.ASSET = '../assets/'; // all pages live one level under vitrolauncher/

  // ---- color schemes (Settings -> Color) ------------------------------
  V.COLORS = [
    { l: 'Blue', accent: '#2245cc', bg: '#2245cc' },
    { l: 'Purple', accent: '#7a3fd4', bg: '#7a3fd4' },
    { l: 'Red', accent: '#c0264b', bg: '#c0264b' },
    { l: 'Orange', accent: '#d97b1f', bg: '#d97b1f' },
    { l: 'Green', accent: '#1f9e46', bg: '#1f9e46' },
    { l: 'Teal', accent: '#12939c', bg: '#12939c' },
    { l: 'Pink', accent: '#d4569b', bg: '#d4569b' },
    { l: 'Silver', accent: '#7f8c9b', bg: '#7f8c9b' },
    { l: 'Black', accent: '#101216', bg: '#101216' },
    { l: 'Black & Blue', accent: '#1a9fff', bg: '#0e141b' },
    { l: 'White & Blue', accent: '#20a0d6', bg: '#e9edf2', light: true }
  ];

  // ---- settings schema -------------------------------------------------
  V.SETTINGS = [
    { key: 'color', label: 'Color', type: 'color' },
    { key: 'theme', label: 'Theme', type: 'options', options: [
      { v: 'waves', l: 'Waves' }, { v: 'particles', l: 'Particles' }, { v: 'clouds', l: 'Clouds' },
      { v: 'simple-dark', l: 'Simple Dark' }, { v: 'simple-light', l: 'Simple Light' } ] },
    { key: 'tooltips', label: 'Tooltips', type: 'toggle' },
    { key: 'nav_autohide', label: 'Auto-Hide Navigation', type: 'options', options: [
      { v: 0, l: 'No' }, { v: 3, l: '3s' }, { v: 5, l: '5s' }, { v: 10, l: '10s' } ] },
    { key: 'infinite', label: 'Infinite Scrolling', type: 'toggle' },
    { key: 'button_style', label: 'Button Style', type: 'buttons', options: [
      { v: 'retro', l: 'A / B' }, { v: 'modern', l: 'X / O' } ] },
    { key: 'default_screen', label: 'Default Screen', type: 'options', options: [
      { v: 'recent', l: 'Recent' }, { v: 'all', l: 'All Titles' } ] },
    { key: 'startup_fade', label: 'Startup Fade-In', type: 'toggle' },
    { key: 'show_playtime', label: 'Show Playtime', type: 'toggle' },
    { key: 'show_titles', label: 'Show Titles on Recents', type: 'toggle' },
    { key: 'cover_size', label: 'Cover Size on Recents', type: 'options', options: [
      { v: 'small', l: 'Small' }, { v: 'medium', l: 'Medium' }, { v: 'large', l: 'Large' } ] },
    { key: 'recent_limit', label: 'Title Limit on Recents', type: 'options', options: [
      { v: 4, l: '4' }, { v: 8, l: '8' }, { v: 12, l: '12' }, { v: 16, l: '16' } ] },
    { key: 'all_icon_size', label: 'Icon Size on All Titles', type: 'options', options: [
      { v: 'small', l: 'Small (3 Rows)' }, { v: 'large', l: 'Large (2 Rows)' } ] },
    { key: 'all_sort', label: 'Sorting on All Titles', type: 'options', options: [
      { v: 'az', l: 'A-Z' }, { v: 'recent', l: 'Recent' }, { v: 'playtime', l: 'Time Played' } ] },
    { key: 'all_bookmarks', label: 'Bookmarks on All Titles', type: 'options', options: [
      { v: 'first', l: 'Show First' }, { v: 'sorted', l: 'As Sorted' } ] },
    { key: 'transparency', label: 'Transparency', type: 'toggle' },
    { key: 'brightness', label: 'Screen Brightness', type: 'percent' },
    { key: 'volume', label: 'System Volume', type: 'percent' },
    { key: 'reset', label: 'Reset Settings', type: 'action' }
  ];

  // default values (shipped config, with tooltips + retro A/B on for a clearer mockup)
  V.defaults = function () {
    return {
      color: 9, theme: 'waves', tooltips: true, nav_autohide: 10, infinite: false,
      button_style: 'retro', default_screen: 'recent', startup_fade: true, show_playtime: true,
      show_titles: false, cover_size: 'large', recent_limit: 12, all_icon_size: 'small',
      all_sort: 'az', all_bookmarks: 'first', transparency: true, brightness: 80, volume: 60
    };
  };

  // ---- sample library --------------------------------------------------
  function g(name, system, mins, bm) {
    return { id: name, name: name, system: system, playSeconds: mins * 60, bookmarked: !!bm };
  }
  V.DATA = [
    g('Golden Sun', 'gba', 740, true),
    g('Chrono Trigger', 'snes', 1360, true),
    g('Metal Slug X', 'arcade', 65),
    g("Castlevania: Symphony of the Night", 'psx', 390),
    g('Super Metroid', 'snes', 195),
    g('Sonic the Hedgehog 2', 'genesis', 45),
    g("The Legend of Zelda: Link's Awakening", 'gb', 290, true),
    g('Final Fantasy VI', 'snes', 900),
    g('Advance Wars', 'gba', 545),
    g('Street Fighter Alpha 3', 'arcade', 120),
    g('Super Mario World', 'snes', 340),
    g('Crash Bandicoot', 'psx', 180),
    g('Mega Man X', 'snes', 110),
    g("Kirby's Adventure", 'nes', 150, true),
    g('Fire Emblem', 'gba', 1090),
    g('Tetris', 'gb', 30),
    g('Doom II', 'ports', 75),
    g('Gran Turismo 2', 'psx', 610)
  ];

  V.formatPlaytime = function (sec) {
    if (!sec || sec <= 0) return '';
    var total = Math.floor(sec / 60), h = Math.floor(total / 60), m = total % 60;
    if (total < 1) return '<1m';
    if (h === 0) return m + 'm';
    if (h >= 10 || m === 0) return h + 'h';
    return h + 'h ' + m + 'm';
  };

  // ---- placeholder box art (pixel-crisp SVG data URI) ------------------
  var SYS_HUE = { gba: 265, snes: 210, psx: 300, gb: 90, gbc: 140, genesis: 220, nes: 0,
    n64: 30, arcade: 350, ports: 190, gg: 50 };
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function wrap(name) {
    var words = name.split(' '), lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      if ((cur + ' ' + words[i]).trim().length > 14 && cur) { lines.push(cur); cur = words[i]; }
      else cur = (cur + ' ' + words[i]).trim();
    }
    if (cur) lines.push(cur);
    return lines.slice(0, 4);
  }
  V.cover = function (game) {
    var base = SYS_HUE[game.system] != null ? SYS_HUE[game.system] : (hash(game.name) % 360);
    var h1 = (base + (hash(game.name) % 30)) % 360, h2 = (h1 + 40) % 360;
    var lines = wrap(game.name);
    var startY = 225 - (lines.length - 1) * 24;
    var tspans = lines.map(function (ln, i) {
      return '<tspan x="150" y="' + (startY + i * 48) + '">' + esc(ln) + '</tspan>';
    }).join('');
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="hsl(' + h1 + ',55%,42%)"/>' +
      '<stop offset="1" stop-color="hsl(' + h2 + ',60%,20%)"/></linearGradient>' +
      '<radialGradient id="v" cx="0.5" cy="0.38" r="0.75">' +
      '<stop offset="0.55" stop-color="rgba(0,0,0,0)"/><stop offset="1" stop-color="rgba(0,0,0,0.45)"/>' +
      '</radialGradient></defs>' +
      '<rect width="300" height="450" fill="url(#g)"/>' +
      '<rect width="300" height="450" fill="url(#v)"/>' +
      '<rect x="0" y="0" width="300" height="6" fill="rgba(255,255,255,0.25)"/>' +
      '<text font-family="Roboto Condensed, sans-serif" font-weight="700" font-size="40" ' +
      'fill="#ffffff" text-anchor="middle" style="paint-order:stroke" stroke="rgba(0,0,0,0.35)" stroke-width="3">' +
      tspans + '</text>' +
      '<text x="150" y="418" font-family="Roboto Condensed, sans-serif" font-weight="700" font-size="22" ' +
      'fill="rgba(255,255,255,0.75)" text-anchor="middle" letter-spacing="2">' + esc(game.system.toUpperCase()) + '</text>' +
      '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  };

  // ---- DOM builders ----------------------------------------------------
  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }

  // Carousel: returns { row, tiles }
  V.buildCarousel = function (games, opts) {
    var row = el('div', 'carousel-row');
    var tiles = [];
    var aspectSquare = opts && opts.aspect === '1:1';
    games.forEach(function (game) {
      var t = el('div', 'cov' + (aspectSquare ? ' square' : ''));
      var art = el('img', 'cov-art'); art.src = V.cover(game); art.alt = ''; art.draggable = false;
      t.appendChild(art);
      var cap = el('div', 'cov-caption');
      var title = el('div', 'cov-title'); title.textContent = game.name;
      var pt = el('div', 'cov-playtime');
      var p = V.formatPlaytime(game.playSeconds); pt.textContent = p ? p + ' Played' : '';
      cap.appendChild(title); cap.appendChild(pt); t.appendChild(cap);
      row.appendChild(t); tiles.push(t);
    });
    return { row: row, tiles: tiles };
  };

  // Grid page: returns { pageEl, icons } for one page
  V.buildGridPage = function (games, page, layout) {
    var cols = layout === 'large' ? 5 : 7, rows = layout === 'large' ? 2 : 3;
    var per = cols * rows;
    var pageEl = el('div', 'grid-page ' + layout);
    pageEl.style.gridTemplateColumns = 'repeat(' + cols + ', auto)';
    var icons = [];
    for (var i = 0; i < per; i++) {
      var idx = page * per + i;
      if (idx >= games.length) break;
      var game = games[idx];
      var ic = el('div', 'gicon');
      ic.dataset.idx = idx;
      var art = el('img', 'gicon-art'); art.src = V.cover(game); art.alt = ''; art.draggable = false;
      ic.appendChild(art);
      if (game.bookmarked) {
        var bm = el('img', 'gicon-bm'); bm.src = V.ASSET + 'images/bookmark.png'; bm.alt = '';
        ic.appendChild(bm);
      }
      pageEl.appendChild(ic); icons.push(ic);
    }
    return { pageEl: pageEl, icons: icons };
  };

  // Settings rows: returns { scroll, rows: [{el, valueEl, def}] }
  V.buildSettings = function (defs, values) {
    var scroll = el('div', 'settings-scroll');
    var rows = [];
    defs.forEach(function (def) {
      var r = el('div', 'srow');
      var glass = el('div', 'srow-glass glass'); r.appendChild(glass);
      var label = el('div', 'srow-label'); label.textContent = def.label; r.appendChild(label);
      var val = el('div', 'srow-value');
      var la = el('img', 'srow-arrow left'); la.src = V.ASSET + 'images/glass-arrow-right.png'; la.classList.add('invertible');
      var ra = el('img', 'srow-arrow right'); ra.src = V.ASSET + 'images/glass-arrow-right.png'; ra.classList.add('invertible');
      var mid = el('div', 'srow-mid');
      if (def.type !== 'action') val.classList.add('srow-changeable');
      val.appendChild(la); val.appendChild(mid); val.appendChild(ra);
      r.appendChild(val);
      scroll.appendChild(r);
      rows.push({ el: r, midEl: mid, def: def });
    });
    V.refreshSettings(rows, values);
    return { scroll: scroll, rows: rows };
  };

  // Update the value display of every settings row from current values.
  V.refreshSettings = function (rows, values) {
    rows.forEach(function (row) {
      var def = row.def, mid = row.midEl;
      mid.textContent = ''; mid.className = 'srow-mid';
      if (def.type === 'action') { return; }
      if (def.type === 'color') {
        var c = V.COLORS[values.color];
        var dot = el('span', 'srow-dot');
        if (c.light || c.bg !== c.accent) {
          dot.style.background = 'linear-gradient(90deg,' + c.bg + ' 50%,' + c.accent + ' 50%)';
        } else { dot.style.background = c.accent; }
        var txt = document.createTextNode(c.l);
        mid.appendChild(dot); mid.appendChild(txt);
        return;
      }
      if (def.type === 'toggle') { mid.textContent = values[def.key] ? 'Yes' : 'No'; return; }
      if (def.type === 'percent') { mid.textContent = (values[def.key] != null ? values[def.key] + '%' : '--'); return; }
      if (def.type === 'buttons') {
        var g = el('span', 'srow-glyphs');
        var pair = values.button_style === 'modern' ? ['button_Cross', 'button_Circle'] : ['button_A', 'button_B'];
        var a = el('img'); a.src = V.ASSET + 'images/buttons/' + pair[0] + '.png';
        var slash = document.createTextNode('/');
        var b = el('img'); b.src = V.ASSET + 'images/buttons/' + pair[1] + '.png';
        g.appendChild(a); g.appendChild(slash); g.appendChild(b);
        mid.appendChild(g); return;
      }
      // options: find matching label
      var opts = def.options, cur = values[def.key], lbl = cur;
      for (var i = 0; i < opts.length; i++) if (opts[i].v === cur) { lbl = opts[i].l; break; }
      mid.textContent = lbl;
    });
  };
})(window.Vitro);
