/*
 * layout.js - Elementerial's layout spec, kept normalized, resolved to px once.
 *
 * EmulationStation themes position everything in normalized 0-1 coordinates: x
 * against screen width, y against screen height, font sizes against screen
 * height only. Each element carries an `origin`, a normalized anchor point
 * WITHIN the element, so `origin 0.5 0.5` with `pos 0.7 0.25` puts the
 * element's centre at 70% across and 25% down.
 *
 * This repo renders at native device pixels and forbids fluid layout, so the
 * spec below stays in the source's own numbers and resolve() turns it into
 * literal px for one fixed (w, h). Nothing here reads the viewport.
 *
 * SPEC mirrors settings/display/view-general.xml, view-system.xml,
 * view-grid/grid.xml and view-boxes.xml. ASPECT mirrors
 * settings/display/aspect/{4-3,1-1,3-2}.xml. The three aspects genuinely
 * restructure the detailed view rather than just scaling it, which is why the
 * overrides are explicit rather than derived.
 *
 * Values are quoted from github.com/mluizvitor/es-theme-elementerial @ e710525.
 */
window.Elementerial = window.Elementerial || {};
(function (E) {
  'use strict';

  E.DEVICES = {
    'rg35xx':    { w: 640,  h: 480,  ratio: 'ratio43', label: 'RG35XX' },
    'rg-cubexx': { w: 720,  h: 720,  ratio: 'ratio11', label: 'RG CubeXX' },
    'rg351m':    { w: 480,  h: 320,  ratio: 'ratio32', label: 'RG351M' },
    'rg552':     { w: 1920, h: 1152, ratio: 'ratio53', label: 'RG552' }
  };

  /* variables.xml:11-29 - all normalized to screen height. */
  E.FONTS = {
    small:  { h1: 0.05625, h2: 0.04375, h3: 0.0375,   body: 0.03,     caption: 0.028125 },
    medium: { h1: 0.06,    h2: 0.05,    h3: 0.04375,  body: 0.035,    caption: 0.028125 },
    large:  { h1: 0.06875, h2: 0.05625, h3: 0.046875, body: 0.040625, caption: 0.03125 }
  };

  /* The 1920x960 system screenshots and the 480x320 logo SVGs. */
  E.NATURAL = { cover: 1920 / 960, logo: 480 / 320 };

  /*
   * ES multiplies lineSpacing by the FONT'S LINE HEIGHT, not by the font size:
   * rowHeight = Font::getHeight() * lineSpacing. Read straight out of the sfnt
   * hhea/head tables of the bundled faces:
   *   Inter            upem 2816, asc 2728, desc -680, gap 0 -> 1.2102 em
   *   RobotoCondensed  upem 2048, asc 1900, desc -500, gap 0 -> 1.1719 em
   * This is what makes the theme's numbers come out round: every device shows
   * exactly 10 rows in the detailed list and 7 in the video list, which is why
   * 4:3 carries the odd 1.42125 video lineSpacing.
   */
  E.LINE_BOX = { inter: 1.2102, roboto: 1.1719 };

  /* ---- normalized spec ------------------------------------------------- */

  var SPEC = {
    /* view name="screen" plus the two overlays that sit on every view */
    screen: {
      /* view-general.xml:11-15, colours scheme.xml:12-13 */
      help:    { pos: [0.016666667, 0.96], origin: [0, 0.5], font: 'body' },
      /* view-system.xml:93-99 */
      clock:   { origin: [0, 0.5], font: 'body', align: 'right' },
      /* view-system.xml:101-107 */
      activity: { pos: [0.016666, 0.025], origin: [0, 0], size: 0.025, itemSpacing: 0.003 },
      /* view-general.xml:17-22 and view-system.xml:83-88, both zIndex 100 */
      border:  { z: 100 },
      osd:     { z: 100 }
    },

    /* view-system.xml */
    system: {
      cover:      { size: [1, 0], origin: [0, 0.5], pos: [0, 0.25], z: -9, natural: 'cover' },
      /* background/carousel-video-on.xml - the PlayVideo subset */
      carouselVideo: { pos: [0, 0.25], origin: [0, 0.5], minSize: [1, 0.5], z: -8, delay: 1500 },
      scrim:      { z: -7 },
      carousel:   { pos: [0.5, 0], origin: [0.5, 0], logoSize: [0.25, 0.25], logoScale: 1.4, z: 10 },
      systemName: { origin: [0, 0], size: [0.866667, 'h1'], font: 'h1', bold: true, upper: true, z: 15 },
      systemInfo: { origin: [0, 0], size: [0.866667, 'body'], font: 'body', upper: true, z: 15 }
    },

    /* view-general.xml:26-77 - shared by basic, detailed, video and grid */
    gamelistCommon: {
      coverList: { size: [1, 0], origin: [0, 0.5], pos: [0, 0.225], minSize: [1, 0.45], z: -5, natural: 'cover' },
      scrim:     { z: -4 }
    },

    /* view-general.xml:66-77 - basic, detailed and video only */
    listHeader: {
      logoText: { pos: [0.033333, 0.1], origin: [0, 0.5], size: [0.933333, 'h2'], font: 'h2', bold: true, upper: true, z: 5 },
      gamelist: { pos: [0, 0.2], origin: [0, 0], hMargin: 0.033333, font: 'body', z: 5 }
    },

    /* view-general.xml:101-128. Every md_* text is visible=false here. */
    detailed: {
      gamelist:   { size: [0.466667, 0.725] },
      md_image:   { pos: [0.733333, 0.525], origin: [0.5, 0.5], maxSize: [0.466667, 0.55], round: 0.05, z: 5 },
      md_marquee: { pos: [0.733333, 0.25], origin: [0.5, 0.5], maxSize: [0.4, 0.175], z: 6 },
      md_rating:  { origin: [0, 0], z: 5 }
    },

    /* view-general.xml:131-177 */
    video: {
      md_marquee: { pos: [0.2, 0.1875], origin: [0.5, 0.5], maxSize: [0.333333333, 0.325] },
      md_image:   { pos: [0.7, 0.25], origin: [0.5, 0.5], minSize: [0.7, 0.55], z: -1 },
      md_video:   { pos: [0.7, 0.25], origin: [0.5, 0.5], minSize: [0.7, 0.55], z: 0, delay: 1000 },
      scrim:      { z: 4 },
      logoText:   { origin: [0, 0.5], pos: [0.033333333, 0.4] },
      gamelist:   { pos: [0, 0.45], size: [1, 0.475] }
    },

    /* view-grid/grid.xml */
    grid: {
      logoText: { pos: [0.033333, 0.078125], origin: [0, 0.5], size: [0.675, 'h2'], font: 'h2', bold: true, upper: true, z: 5 },
      md_name:  { pos: [0.033333, 0.14375], origin: [0, 0.5], size: [0.9, 'body'], font: 'body', z: 5 },
      gamegrid: { pos: [0, 0.2], size: [1, 0.725], padding: [0.066666667, 0.025], z: 5 },
      caption:  { font: 'caption' },
      favorite: { maxSize: [0.25, 0.25] }
    },

    /* view-boxes.xml - inherits grid, then overrides */
    boxes: {
      gamegrid: { size: [1, 0.725], selectedZoom: 1.075 },
      marquee:  { pos: [0.5, 0.5], origin: [0.5, 0.5], maxSize: [0.65, 0.65], maxSizeSelected: [0.8, 0.8] },
      caption:  { size: [1, 0.2], pos: [0, 0.7], font: 'caption', lineSpacing: 1.2 }
    },

    /* view-elementflix/flix.xml - inherits grid, then overrides */
    elementflix: {
      gamegrid:       { pos: [0, 0.475], selectedZoom: 1.075, animateSelection: false },
      md_marquee:     { pos: [0.233333333, 0.125], origin: [0.5, 0.5], maxSize: [0.4, 0.225] },
      md_image:       { pos: [0.7, 0.25], origin: [0.5, 0.5], minSize: [0.7, 0.55], z: -1 },
      md_video:       { pos: [0.7, 0.25], origin: [0.5, 0.5], minSize: [0.6, 0.5], z: 0, delay: 1000 },
      md_description: { pos: [0.033333333, 0.25], origin: [0, 0], size: [0.433333333, 0.15], font: 'caption', lineSpacing: 1.1, z: 5 },
      logoText:       { pos: [0.033333333, 0.45], origin: [0, 0.5], font: 'h3' },
      scrim:          { z: 4 },
      caption:        { size: [1, 0.2], pos: [0, 0.75], font: 'caption', lineSpacing: 1.2 },
      /* flix-grid-horizontal.xml and flix-grid-vertical.xml */
      /* The two fades carry different origins in the vertical variant - the top
       * one anchors at 0 0 and the bottom one at 0 1 - so each is stored with
       * its own. */
      horizontal: {
        size: [1, 0.46], padding: [0.065, 0.0225], margin: [0.016666667, 0.025],
        fade: { asset: 'fade-hor.png', size: [0.075, 0.525],
                a: [0.0375, 0.7375], aOrigin: [0.5, 0.5],
                b: [0.9625, 0.7375], bOrigin: [0.5, 0.5] }
      },
      vertical: {
        size: [1, 0.475], padding: [0.04, 0.075], margin: [0.016666667, 0.025],
        fade: { asset: 'fade-ver.png', size: [1, 0.075],
                a: [0, 0.475], aOrigin: [0, 0],
                b: [0, 0.95], bOrigin: [0, 1] }
      }
    },

    /* view-general.xml:80-85 - full-width list, no metadata */
    basic: {
      gamelist: { size: [1, 0.725] }
    }
  };

  /*
   * BoxArtStyle (flix-box-{cover,fit,stretch}.xml) and Grid Game Image
   * (grid-{screenshot,thumbnail,marquee}.xml) both resolve to an ES
   * imageSizeMode, which maps straight onto a CSS object-fit.
   */
  E.FIT = { minSize: 'cover', maxSize: 'contain', size: 'fill' };

  E.BOX_ART = {
    cover:   { selectionMode: 'full',  imageSizeMode: 'minSize' },
    fit:     { selectionMode: 'image', imageSizeMode: 'maxSize' },
    stretch: { selectionMode: 'image', imageSizeMode: 'size' }
  };

  E.GRID_IMAGE = {
    screenshot: { source: 'image',     selectionMode: 'full', imageSizeMode: 'minSize' },
    thumbnail:  { source: 'thumbnail', selectionMode: 'full', imageSizeMode: 'minSize' },
    marquee:    { source: 'marquee',   selectionMode: 'full', imageSizeMode: 'maxSize' }
  };

  /* Default icons style - each scheme's ratio-square.xml / ratio-steam.xml. */
  E.ICON_STYLE = { Square: 'grid', Steam: 'grid-steam' };

  /*
   * Menu geometry is an APPROXIMATION. view-menu.xml themes only fonts,
   * colours, the panel background, the button/switch artwork and the icon set -
   * the panel's position and size belong to EmulationStation's MenuComponent,
   * not to the theme, so there is nothing in the source to transcribe. These
   * fractions are modelled on Batocera's main menu and are flagged as such in
   * the porting notes.
   */
  E.MENU = {
    panel:   { width: 0.62, maxHeight: 0.78 },
    title:   { height: 2.1, font: 'h2' },   /* height is a multiple of its font */
    row:     { height: 2.0, font: 'body' },
    group:   { height: 1.9, font: 'caption' },
    footer:  { height: 2.0, font: 'caption' },
    padding: 0.04,                          /* of panel width */
    icon:    1.15,                          /* of row font size */
    radius:  0.21                           /* menu.png is 72px with r=15 */
  };

  /* ---- per-aspect overrides ------------------------------------------- */

  var ASPECT = {
    /* settings/display/aspect/4-3.xml */
    ratio43: {
      carousel:   { size: [1.1, 1], maxLogoCount: 4, logoPos: [0.15, 0.6] },
      systemName: { pos: [0.08333, 0.375] },
      systemInfo: { pos: [0.08333, 0.46] },
      lineSpacing: { list: 1.68, video: 1.42125 },
      md_rating:  { pos: [0.6075, 0.83125], size: 0.066667 },
      grid: { autoLayout: [3, 2], margin: [0.033333, 0.025], tilePadding: [4, 4],
              round: 0.04, roundSelected: 0.025, selectorRadius: 5,
              caption: { size: [0.9, 0.225], padding: [0.05, 0], lineSpacing: 1.15 } },
      boxes: { autoLayout: [2, 2], margin: [0.025, 0.033333], round: 0.025, roundSelected: 0.01 },
      flix:  { autoLayout: [3, 1], tilePadding: [3, 3], selectorRadius: 5 },
      clock:   { pos: [0, 0.041666667], size: [0.7625, 0] },
      battery: { pos: [0.9, 0.008333333], size: 0.066666667, itemSpacing: 0.0125, icons: '32x32' }
    },

    /* settings/display/aspect/1-1.xml */
    ratio11: {
      carousel:   { size: [1.2, 1], maxLogoCount: 4, logoPos: [0.2, 0.6] },
      systemName: { pos: [0.08333, 0.375] },
      systemInfo: { pos: [0.08333, 0.475] },
      lineSpacing: { list: 1.6, video: 1.6 },
      md_rating:  { pos: [0.61, 0.6375], size: 0.05 },
      /* 1-1.xml:32-59 restructures detailed and turns the description back on.
       * The origins are re-stated because an aspect override replaces the whole
       * element node rather than merging into it, exactly as ES's own theme
       * inheritance does. */
      detailed: {
        md_marquee:     { origin: [0.5, 0.5], pos: [0.733333, 0.2], maxSize: [0.4, 0.175], z: 6 },
        md_image:       { origin: [0.5, 0.5], pos: [0.733333, 0.425], maxSize: [0.466667, 0.40], round: 0.02, z: 5 },
        md_description: { visible: true, origin: [0.5, 0], pos: [0.733333, 0.7], size: [0.466667, 0.2125], font: 'caption', lineSpacing: 1.25 }
      },
      grid: { autoLayout: [3, 2], margin: [0.033333, 0.025], tilePadding: [4, 4],
              round: 0.03, roundSelected: 0.02, selectorRadius: 5,
              caption: { size: [0.92, 0.225], padding: [0.04, 0], lineSpacing: 1.2 } },
      boxes: { autoLayout: [2, 2], margin: [0.0333333, 0.05], round: 0.015, roundSelected: 0.01 },
      flix:  { autoLayout: [3, 1], tilePadding: [3, 3], selectorRadius: 5 },
      clock:   { pos: [-0.02, 0.0375], size: [0.84, 0] },
      battery: { pos: [0.86, 0.0125], size: 0.044444444, itemSpacing: 0.0125, icons: '32x32' },
      /* 1-1.xml:131 - the 1:1 aspect has no osd-bg of its own and borrows 4:3's */
      osdFrom: 'ratio43'
    },

    /* settings/display/aspect/3-2.xml */
    ratio32: {
      carousel:   { size: [1.1, 1], maxLogoCount: 4, logoPos: [0.15, 0.55] },
      systemName: { pos: [0.08333, 0.325] },
      systemInfo: { pos: [0.08333, 0.41] },
      lineSpacing: { list: 1.6, video: 1.6 },
      md_rating:  { pos: [0.61, 0.83125], size: 0.075 },
      grid: { autoLayout: [3, 2], margin: [0.033333, 0.025], tilePadding: [3, 3],
              round: 0.03, roundSelected: 0.02, selectorRadius: 2,
              caption: { size: [0.92, 0.225], padding: [0.04, 0], lineSpacing: 1.15 } },
      boxes: { autoLayout: [2, 2], margin: [0.0333333, 0.05], round: 0.025, roundSelected: 0.025 },
      flix:  { autoLayout: [3, 1], tilePadding: [2, 2], selectorRadius: 2 },
      clock:   { pos: [0, 0.0375], size: [0.775, 0] },
      battery: { pos: [0.9125, 0.00625], size: 0.075, itemSpacing: 0.008333333, icons: '24x24' }
    },

    /* settings/display/aspect/5-3.xml */
    ratio53: {
      carousel:   { size: [1.2, 1], maxLogoCount: 5, logoPos: [0.2, 0.55] },
      systemName: { pos: [0.08333, 0.325] },
      systemInfo: { pos: [0.08333, 0.41] },
      /* 5-3.xml folds video into the shared basic/detailed/video block. */
      lineSpacing: { list: 1.575, video: 1.575 },
      md_rating:  { pos: [0.62, 0.83125], size: 0.075 },
      grid: { autoLayout: [4, 2], margin: [0.025, 0.025], tilePadding: [8, 8],
              round: 0.025, roundSelected: 0.015, selectorRadius: 9,
              caption: { size: [0.9, 0.18], padding: [0.05, 0], lineSpacing: 1.15 } },
      boxes: { autoLayout: [3, 2], margin: [0.025, 0.041667], round: 0.015, roundSelected: 0.01 },
      flix:  { autoLayout: [5, 1], tilePadding: [4, 4], selectorRadius: 9 },
      clock:   { pos: [0, 0.041666667], size: [0.84, 0] },
      battery: { pos: [0.93, 0.0125], size: 0.0625, itemSpacing: 0.0125, icons: '72x72' }
    }
  };

  /* ---- resolver -------------------------------------------------------- */

  function boxOf(node, W, H, fonts, natural) {
    /* `size` is the base when present; maxSize and minSize are only the box
     * when the element declares no size of its own. cover_list declares both
     * `size 1 0` and `minSize 1 0.45`, so precedence matters here. */
    var base = node.size || node.maxSize || node.minSize || [0, 0];
    var w = base[0] * W;
    var h = typeof base[1] === 'string' ? fonts[base[1]] * H : base[1] * H;

    /* A zero component means "derive from the asset's own aspect ratio". */
    if (base[1] === 0 && natural) h = w / natural;
    if (base[0] === 0 && natural) w = h * natural;

    /* minSize is a floor, so grow to cover it, keeping the asset's aspect. */
    if (node.minSize) {
      var minW = node.minSize[0] * W, minH = node.minSize[1] * H;
      if (natural) {
        if (h < minH) { h = minH; w = h * natural; }
        if (w < minW) { w = minW; h = w / natural; }
      } else {
        if (w < minW) w = minW;
        if (h < minH) h = minH;
      }
    }

    var origin = node.origin || [0, 0];
    var pos = node.pos || [0, 0];
    return {
      left: pos[0] * W - origin[0] * w,
      top: pos[1] * H - origin[1] * h,
      width: w,
      height: h,
      /* Anchor kept separately: a maxSize element's box shrinks to the fitted
       * image in ES, so it has to be placed by anchor rather than by box. */
      posX: pos[0] * W,
      posY: pos[1] * H,
      originX: origin[0],
      originY: origin[1],
      /* maxSize is contain, minSize is cover. */
      fit: node.maxSize ? 'contain' : (node.minSize ? 'cover' : null),
      radius: node.round ? node.round * Math.min(w, h) : 0,
      z: node.z
    };
  }

  function gridMetrics(node, W, H, aspectGrid) {
    var box = {
      left: (node.pos ? node.pos[0] : 0) * W,
      top: (node.pos ? node.pos[1] : 0) * H,
      width: node.size[0] * W,
      height: node.size[1] * H
    };
    var pad = [node.padding[0] * W, node.padding[1] * H];
    var margin = [aspectGrid.margin[0] * W, aspectGrid.margin[1] * H];
    var cols = aspectGrid.autoLayout[0];
    var rows = aspectGrid.autoLayout[1];

    return {
      box: box,
      padding: pad,
      margin: margin,
      cols: cols,
      rows: rows,
      tileW: (box.width - 2 * pad[0] - (cols - 1) * margin[0]) / cols,
      tileH: (box.height - 2 * pad[1] - (rows - 1) * margin[1]) / rows
    };
  }

  /*
   * Returns every measurement a device needs, in literal pixels. Callers write
   * these straight into inline styles; no CSS calc(), no viewport units.
   */
  E.resolve = function (deviceId, opts) {
    opts = opts || {};
    var dev = E.DEVICES[deviceId];
    var W = dev.w, H = dev.h;
    var a = ASPECT[dev.ratio];
    var fonts = E.FONTS[opts.fontSize || 'medium'];
    var natCover = E.NATURAL.cover;

    var font = {};
    Object.keys(fonts).forEach(function (k) { font[k] = fonts[k] * H; });

    /* Carousel: logoPos is normalized within the carousel box, not the screen,
     * and marks the TOP-LEFT of the selected logo's cell. The selected logo
     * then scales by logoScale about that cell's centre. Spacing is one even
     * division of the carousel width, and because the box is wider than the
     * screen the row bleeds off both edges.
     *
     * The top-left reading is what the reference screenshot shows: on 480x320
     * the selected card measures 168x112 spanning y 160-272, which is exactly
     * a 120x80 cell at y 176 grown 1.4x about its centre. It is also the only
     * reading under which systemInfo does not collide with the logo row on any
     * of the three aspects. */
    var cw = a.carousel.size[0] * W;
    var ch = a.carousel.size[1] * H;
    var logoW = SPEC.system.carousel.logoSize[0] * W;
    var logoH = SPEC.system.carousel.logoSize[1] * H;
    var carousel = {
      left: SPEC.system.carousel.pos[0] * W - SPEC.system.carousel.origin[0] * cw,
      top: 0,
      width: cw,
      height: ch,
      logoW: logoW,
      logoH: logoH,
      scale: SPEC.system.carousel.logoScale,
      count: a.carousel.maxLogoCount,
      pitch: cw / a.carousel.maxLogoCount,
      selTopLeft: [a.carousel.logoPos[0] * cw, a.carousel.logoPos[1] * ch],
      selCenter: [a.carousel.logoPos[0] * cw + logoW / 2,
                  a.carousel.logoPos[1] * ch + logoH / 2]
    };

    var lineBox = font.body * E.LINE_BOX.inter;
    var listRow = lineBox * a.lineSpacing.list;
    var videoRow = lineBox * a.lineSpacing.video;

    var detailed = Object.assign({}, SPEC.detailed, (a.detailed || {}));
    var listBox = {
      left: 0,
      top: SPEC.listHeader.gamelist.pos[1] * H,
      width: detailed.gamelist.size[0] * W,
      height: detailed.gamelist.size[1] * H,
      hMargin: SPEC.listHeader.gamelist.hMargin * W,
      row: listRow
    };

    var gridNode = Object.assign({}, SPEC.grid.gamegrid);
    var boxesNode = Object.assign({}, SPEC.grid.gamegrid, SPEC.boxes.gamegrid);

    /* Elementflix: grid geometry, then the flix overrides, then whichever of
     * the two GridDirection variants is selected. */
    var flixDir = (opts.gridDirection === 'vertical') ? 'vertical' : 'horizontal';
    var flixVar = SPEC.elementflix[flixDir];
    var flixNode = Object.assign({}, SPEC.grid.gamegrid, SPEC.elementflix.gamegrid, {
      size: flixVar.size, padding: flixVar.padding
    });
    var flixMetrics = gridMetrics(flixNode, W, H,
      { autoLayout: a.flix.autoLayout, margin: flixVar.margin });

    return {
      device: deviceId,
      ratio: dev.ratio,
      w: W,
      h: H,
      font: font,
      osdRatio: a.osdFrom || dev.ratio,

      screen: {
        help: {
          left: SPEC.screen.help.pos[0] * W,
          top: SPEC.screen.help.pos[1] * H,
          font: font.body
        },
        clock: {
          left: a.clock.pos[0] * W,
          top: a.clock.pos[1] * H,
          width: a.clock.size[0] * W,
          font: font.body
        },
        battery: {
          left: a.battery.pos[0] * W,
          top: a.battery.pos[1] * H,
          size: a.battery.size * H,
          itemSpacing: a.battery.itemSpacing * W,
          icons: a.battery.icons
        },
        activity: {
          left: SPEC.screen.activity.pos[0] * W,
          top: SPEC.screen.activity.pos[1] * H,
          size: SPEC.screen.activity.size * H,
          itemSpacing: SPEC.screen.activity.itemSpacing * W
        }
      },

      system: {
        cover: boxOf(SPEC.system.cover, W, H, fonts, natCover),
        carouselVideo: boxOf(SPEC.system.carouselVideo, W, H, fonts, natCover),
        carousel: carousel,
        systemName: {
          left: a.systemName.pos[0] * W,
          top: a.systemName.pos[1] * H,
          width: SPEC.system.systemName.size[0] * W,
          font: font.h1
        },
        systemInfo: {
          left: a.systemInfo.pos[0] * W,
          top: a.systemInfo.pos[1] * H,
          width: SPEC.system.systemInfo.size[0] * W,
          font: font.body
        }
      },

      gamelist: {
        coverList: boxOf(SPEC.gamelistCommon.coverList, W, H, fonts, natCover),
        logoText: {
          left: SPEC.listHeader.logoText.pos[0] * W,
          top: SPEC.listHeader.logoText.pos[1] * H,
          width: SPEC.listHeader.logoText.size[0] * W,
          font: font.h2
        }
      },

      detailed: {
        list: listBox,
        md_image: boxOf(detailed.md_image, W, H, fonts),
        md_marquee: boxOf(detailed.md_marquee, W, H, fonts),
        md_rating: {
          left: a.md_rating.pos[0] * W,
          top: a.md_rating.pos[1] * H,
          size: a.md_rating.size * H
        },
        md_description: a.detailed && a.detailed.md_description
          ? Object.assign(boxOf(a.detailed.md_description, W, H, fonts), { font: font.caption })
          : null
      },

      video: {
        md_marquee: boxOf(SPEC.video.md_marquee, W, H, fonts),
        md_image: boxOf(SPEC.video.md_image, W, H, fonts, natCover),
        logoText: {
          left: SPEC.video.logoText.pos[0] * W,
          top: SPEC.video.logoText.pos[1] * H,
          width: SPEC.listHeader.logoText.size[0] * W,
          font: font.h2
        },
        list: {
          left: 0,
          top: SPEC.video.gamelist.pos[1] * H,
          width: SPEC.video.gamelist.size[0] * W,
          height: SPEC.video.gamelist.size[1] * H,
          hMargin: SPEC.listHeader.gamelist.hMargin * W,
          row: videoRow
        },
        delay: SPEC.video.md_video.delay
      },

      grid: Object.assign(gridMetrics(gridNode, W, H, a.grid), {
        logoText: {
          left: SPEC.grid.logoText.pos[0] * W,
          top: SPEC.grid.logoText.pos[1] * H,
          width: SPEC.grid.logoText.size[0] * W,
          font: font.h2
        },
        md_name: {
          left: SPEC.grid.md_name.pos[0] * W,
          top: SPEC.grid.md_name.pos[1] * H,
          width: SPEC.grid.md_name.size[0] * W,
          font: font.body
        },
        tilePadding: a.grid.tilePadding,
        round: a.grid.round,
        roundSelected: a.grid.roundSelected,
        selectorRadius: a.grid.selectorRadius,
        caption: {
          width: a.grid.caption.size[0],
          height: a.grid.caption.size[1],
          padding: a.grid.caption.padding[0],
          lineSpacing: a.grid.caption.lineSpacing,
          font: font.caption
        }
      }),

      menu: (function () {
        var m = E.MENU;
        var pw = m.panel.width * W;
        return {
          width: pw,
          maxHeight: m.panel.maxHeight * H,
          left: (W - pw) / 2,
          padding: m.padding * pw,
          /* menu.png is a 72px square with a ~15px corner, so the panel radius
           * tracks that ratio against the device height. */
          radius: (15 / 480) * H,
          titleHeight: m.title.height * font[m.title.font],
          titleFont: font[m.title.font],
          rowHeight: m.row.height * font[m.row.font],
          rowFont: font[m.row.font],
          groupHeight: m.group.height * font[m.group.font],
          groupFont: font[m.group.font],
          footerHeight: m.footer.height * font[m.footer.font],
          footerFont: font[m.footer.font],
          smallFont: font.caption,
          icon: m.icon * font[m.row.font]
        };
      })(),

      basic: {
        list: {
          left: 0,
          top: SPEC.listHeader.gamelist.pos[1] * H,
          width: SPEC.basic.gamelist.size[0] * W,
          height: SPEC.basic.gamelist.size[1] * H,
          hMargin: SPEC.listHeader.gamelist.hMargin * W,
          row: listRow
        }
      },

      elementflix: Object.assign(flixMetrics, {
        direction: flixDir,
        selectedZoom: SPEC.elementflix.gamegrid.selectedZoom,
        tilePadding: a.flix.tilePadding,
        selectorRadius: a.flix.selectorRadius,
        md_marquee: boxOf(SPEC.elementflix.md_marquee, W, H, fonts),
        md_image: boxOf(SPEC.elementflix.md_image, W, H, fonts, natCover),
        md_description: Object.assign(boxOf(SPEC.elementflix.md_description, W, H, fonts), {
          font: font.caption, lineSpacing: SPEC.elementflix.md_description.lineSpacing
        }),
        logoText: {
          left: SPEC.elementflix.logoText.pos[0] * W,
          top: SPEC.elementflix.logoText.pos[1] * H,
          width: SPEC.listHeader.logoText.size[0] * W,
          font: font.h3
        },
        caption: {
          top: SPEC.elementflix.caption.pos[1],
          height: SPEC.elementflix.caption.size[1],
          lineSpacing: SPEC.elementflix.caption.lineSpacing,
          font: font.caption
        },
        fade: (function () {
          var f = flixVar.fade;
          var fw = f.size[0] * W, fh = f.size[1] * H;
          return {
            asset: f.asset,
            width: fw,
            height: fh,
            a: [f.a[0] * W - f.aOrigin[0] * fw, f.a[1] * H - f.aOrigin[1] * fh],
            b: [f.b[0] * W - f.bOrigin[0] * fw, f.b[1] * H - f.bOrigin[1] * fh]
          };
        })()
      }),

      boxes: Object.assign(gridMetrics(boxesNode, W, H, a.boxes), {
        selectedZoom: SPEC.boxes.gamegrid.selectedZoom,
        round: a.boxes.round,
        roundSelected: a.boxes.roundSelected,
        tilePadding: a.grid.tilePadding,
        marquee: SPEC.boxes.marquee,
        caption: {
          top: SPEC.boxes.caption.pos[1],
          height: SPEC.boxes.caption.size[1],
          lineSpacing: SPEC.boxes.caption.lineSpacing,
          font: font.caption
        }
      })
    };
  };

  /* Writes a resolved box onto an element as literal px. */
  E.place = function (el, box) {
    el.style.left = box.left + 'px';
    el.style.top = box.top + 'px';
    if (box.width != null) el.style.width = box.width + 'px';
    if (box.height != null) el.style.height = box.height + 'px';
    if (box.font != null) el.style.fontSize = box.font + 'px';
    if (box.radius) el.style.borderRadius = box.radius + 'px';
    if (box.z != null) el.style.zIndex = box.z;
    return el;
  };

  /*
   * Places a maxSize (contain) image the way ES does. ES scales the image down
   * to fit the box and then SHRINKS the element to the fitted size, so the
   * anchor and any roundCorners act on the image's own edges. Sizing a fixed
   * box and leaning on object-fit:contain would letterbox instead, which puts
   * the rounded corners on the empty box rather than on the artwork.
   */
  E.placeContain = function (el, box) {
    el.style.left = box.posX + 'px';
    el.style.top = box.posY + 'px';
    el.style.maxWidth = box.width + 'px';
    el.style.maxHeight = box.height + 'px';
    el.style.width = 'auto';
    el.style.height = 'auto';
    el.style.transform = 'translate(' + (-box.originX * 100) + '%, ' +
                                        (-box.originY * 100) + '%)';
    if (box.radius) el.style.borderRadius = box.radius + 'px';
    if (box.z != null) el.style.zIndex = box.z;
    return el;
  };
})(window.Elementerial);
