/*
 * palette.js - the theme's colour variables.
 *
 * Token names are the theme's own, from _theme_options/colorsets/{blue,black}.xml, so a grep
 * for e.g. `backgroundgridSelect` hits both the XML and this file.
 *
 * Keys marked SECONDARY below carry ifSubset="secondary_colorset:default" upstream, meaning
 * the secondary accent overrides them. Everything else is fixed per colorset.
 */
window.PlayStationX = window.PlayStationX || {};

(function (PSX) {
  'use strict';

  /* theme.xml:646-652 - the master palette every colorset draws from. */
  var MASTER = {
    'psx-theme-yellow': '#F3C300',
    'psx-theme-red': '#DF0024',
    'psx-theme-green': '#00AC97',
    'psx-theme-blue1': '#3CAEFB',
    'psx-theme-blue2': '#0070d1',
    'psx-theme-blue3': '#2E6DB4',
    'psx-theme-blue4': '#003791'
  };

  /* Keys the secondary accent overrides. */
  var SECONDARY_KEYS = [
    'menuSelectedColor', 'menuSelectorColor', 'menuSelectorColorEnd',
    'backgroundgridSelect', 'gamelistSelectorColor', 'sistema.lineainferior',
    'gamelist.starFill', 'grid.starFill'
  ];

  /* _theme_options/colorsets/blue.xml:6-41 */
  var BLUE = {
    menuSelectedColor: 'ffffff', menuSelectorColor: '0070d1', menuSelectorColorEnd: '003791',
    menuGrouptitle: '3CAEFB', menuFontcolor: 'DFDCDC', menuSeparatorColor: '555555',
    menuGroupSeparator: '3CAEFB', menuTitleColor: 'DFDCDC', menubgColor: '003791',
    backgroundgrid: '2E6DB4', backgroundgridSelect: 'F3C300', menuFooter: '555555',
    gamelistSelectedColor: '3CAEFB', gamelistSelectorColor: 'F3C300',
    helpFontColor: 'DFDCDC', helpIconColor: 'DFDCDC',
    developerColor: '00AC97', genreColor: '3CAEFB', releaseColor: 'F3C300',
    starFill: 'DF0024', starUnfill: 'ffffff69',
    manualOnColor: '3CAEFB', savegameOnColor: '3CAEFB', cheevosOnColor: 'F3C300',
    'splash.progressbarActive': '0070d1', 'splash.progressbarActiveEnd': '003791',
    'splash.progressbar': 'ffffff80', 'splash.labelColor': 'ffffff',
    'sistema.lineainferior': '0070d1', 'sistema.pie': '030a18',
    'gamelist.starFill': 'DF0024', 'ps4Style.tile.background': '020C29',
    'grid.starFill': 'F3C300', dimColor: '808080'
  };

  /* _theme_options/colorsets/black.xml */
  var BLACK = {
    menuSelectedColor: '3CAEFB', menuSelectorColor: '2d2828', menuSelectorColorEnd: '000000',
    menuGrouptitle: 'eeeeee', menuFontcolor: 'cccccc', menuSeparatorColor: '555555',
    menuGroupSeparator: 'dddddd', menuTitleColor: 'DFDCDC', menubgColor: '2d2828',
    backgroundgrid: 'aaaaaa', backgroundgridSelect: '666666', menuFooter: '555555',
    gamelistSelectedColor: '3CAEFB', gamelistSelectorColor: '666666',
    helpFontColor: 'DFDCDC', helpIconColor: 'DFDCDC',
    developerColor: '00AC97', genreColor: '3CAEFB', releaseColor: 'F3C300',
    starFill: 'DF0024', starUnfill: 'ffffff69',
    manualOnColor: '3CAEFB', savegameOnColor: '3CAEFB', cheevosOnColor: 'F3C300',
    'splash.progressbarActive': '0070d1', 'splash.progressbarActiveEnd': '111111',
    'splash.progressbar': 'ffffff69', 'splash.labelColor': 'ffffff',
    'sistema.lineainferior': '0070d1', 'sistema.pie': '000000',
    'gamelist.starFill': 'DF0024', 'ps4Style.tile.background': '000000',
    'grid.starFill': 'F3C300', dimColor: '808080'
  };

  /*
   * _theme_options/colorsets/secondary_colors/*.xml - each overrides the SECONDARY_KEYS.
   * `accent` is the value written to sistema.lineainferior / gamelistSelectorColor;
   * `gridSelect` is backgroundgridSelect, which differs only for black.
   */
  var SECONDARY = {
    default: null,
    blue: { accent: '0070d1', end: '003791', gridSelect: '0070d1' },
    yellow: { accent: 'F2BC00', end: 'F2BC00', gridSelect: 'F2BC00' },
    green: { accent: '00AC97', end: '00AC97', gridSelect: '00AC97' },
    orange: { accent: 'FF9E00', end: 'FF9E00', gridSelect: 'FF9E00' },
    red: { accent: 'DF0024', end: 'DF0024', gridSelect: 'DF0024' },
    pink: { accent: 'FF4DFF', end: 'FF4DFF', gridSelect: 'FF4DFF' },
    purple: { accent: '8159ED', end: '8159ED', gridSelect: '8159ED' },
    black: { accent: '666666', end: '666666', gridSelect: 'cccccc' }
  };

  var COLORSETS = { blue: BLUE, black: BLACK };

  /* ES writes colours as RRGGBB or RRGGBBAA. Turn either into a CSS colour. */
  function css(hex) {
    if (!hex) return 'transparent';
    var h = String(hex).replace('#', '');
    if (h.length === 8) {
      var a = parseInt(h.slice(6, 8), 16) / 255;
      return 'rgba(' + parseInt(h.slice(0, 2), 16) + ',' + parseInt(h.slice(2, 4), 16) +
        ',' + parseInt(h.slice(4, 6), 16) + ',' + a.toFixed(3) + ')';
    }
    return '#' + h;
  }

  /* Resolve a colorset + secondary accent into a flat token map. */
  function tokens(colorset, secondary) {
    var base = COLORSETS[colorset] || BLUE;
    var out = {};
    Object.keys(base).forEach(function (k) { out[k] = base[k]; });

    var sec = SECONDARY[secondary];
    if (sec) {
      out.gamelistSelectorColor = sec.accent;
      out['sistema.lineainferior'] = sec.accent;
      out.backgroundgridSelect = sec.gridSelect;
      out['grid.starFill'] = sec.accent;
      out['gamelist.starFill'] = sec.accent;
      out.menuSelectorColor = sec.accent;
      out.menuSelectorColorEnd = sec.end;
      out.menuSelectedColor = sec.accent;
    }
    return out;
  }

  /*
   * Write the tokens as CSS custom properties. Colour-only changes go through here with no
   * rebuild, so the cursor and every running animation survive.
   */
  function applyColors(root, colorset, secondary) {
    var t = tokens(colorset, secondary);
    var map = {
      '--genreColor': t.genreColor,
      '--releaseColor': t.releaseColor,
      '--developerColor': t.developerColor,
      '--starFill': t['gamelist.starFill'],
      '--starUnfill': t.starUnfill,
      '--dimColor': t.dimColor,
      '--gamelistSelectorColor': t.gamelistSelectorColor,
      '--gamelistSelectedColor': t.gamelistSelectedColor,
      '--sistemaLineaInferior': t['sistema.lineainferior'],
      '--sistemaPie': t['sistema.pie'],
      '--helpFontColor': t.helpFontColor,
      '--cheevosOnColor': t.cheevosOnColor,
      '--backgroundgridSelect': t.backgroundgridSelect,
      '--ps4TileBackground': t['ps4Style.tile.background'],
      '--splashProgressbar': t['splash.progressbar'],
      '--splashProgressbarActive': t['splash.progressbarActive'],
      '--splashProgressbarActiveEnd': t['splash.progressbarActiveEnd'],
      '--menubgColor': t.menubgColor,
      '--gridStarFill': t['grid.starFill']
    };
    Object.keys(map).forEach(function (k) {
      root.style.setProperty(k, css(map[k]));
    });
    root.dataset.colorset = colorset;
    return t;
  }

  /*
   * Assets that swap with the colorset: the full-screen background, and the `-b.png` caratula
   * variants the theme ships for the black scheme.
   */
  function colorsetBackground(colorset) {
    return PSX.ASSET + 'colorsets/' + (colorset === 'black' ? 'black' : 'blue') + '-background.jpg';
  }

  /* Only `arcade` and `auto-favorites` ship a -b.png in our slice; the rest fall back. */
  var HAS_B = { arcade: true, 'auto-favorites': true, default: true };

  function caratula(themeName, colorset) {
    if (colorset === 'black' && HAS_B[themeName]) {
      return PSX.ASSET + 'caratulas/' + themeName + '-b.png';
    }
    return PSX.ASSET + 'caratulas/' + themeName + '.png';
  }

  PSX.MASTER = MASTER;
  PSX.COLORSETS = COLORSETS;
  PSX.SECONDARY = SECONDARY;
  PSX.SECONDARY_KEYS = SECONDARY_KEYS;
  PSX.cssColor = css;
  PSX.tokens = tokens;
  PSX.applyColors = applyColors;
  PSX.colorsetBackground = colorsetBackground;
  PSX.caratula = caratula;
})(window.PlayStationX);
