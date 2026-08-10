/**
 * The theme's geometry, in its own normalised 0-1 numbers.
 *
 * Every block cites `file:line` into `es-theme-PlayStation-X @ 26ce759`. The full extracted
 * spec is in `docs/themes/playstation-x/reference/source-notes.md`.
 *
 * Two rules govern how this resolves, both from the source notes:
 *
 * 1. **Last match wins.** EmulationStation resolves repeated property elements by taking the
 *    last one whose predicates match. The source depends on it - `carousel-sizes/big.xml:15-16`
 *    has a bare `<pos>` immediately followed by another bare `<pos>` purely to override it, and
 *    a most-specific-wins scheme would silently disagree.
 * 2. **A variant row may only be conditioned on a live subset.** Everything pinned - game-video,
 *    grid-origin, main-origin, region, iconset - is pre-evaluated and inlined, and only four
 *    aspect values exist, so every 16-10 / 5-4 / 21-9 row is dropped at transcription. That rule
 *    is what stops the override matrix exploding across eleven screens.
 *
 * Data predicates - `if=` over the system, `<visible>` over game fields - are *not* resolved
 * here. They depend on the selected item, so the views evaluate them per render.
 */

/** A condition over the matcher state. `null` matches anything. */
export type Condition = Record<string, string> | null

/**
 * A property that varies by condition, as `[condition, value]` rows in source order.
 *
 * The source's own `a|b` syntax is kept, so one grep hits both the XML and this file:
 * `{ 'aspect-ratio': '4-3|5-4' }` reads the same as `ifSubset="aspect-ratio:4-3|5-4"`.
 */
export type Variants<T> = ReadonlyArray<readonly [Condition, T]>

/* eslint-disable @typescript-eslint/no-explicit-any --
 * The spec mirrors untyped XML: element blocks carry whatever properties their source element
 * had, and a schema over that would be a second transcription to keep in step with the first. */

export type ElementSpec = Record<string, Variants<any>>
export type SpecNode = ElementSpec | { [key: string]: SpecNode }

/**
 * Any object carrying a geometry key is an element; anything else is a group to recurse into.
 * That is what lets the tree nest by view without the resolver knowing its shape.
 */
export const GEOM_KEYS = [
  'pos',
  'x',
  'y',
  'size',
  'maxSize',
  'fontSize',
  'zIndex',
  'origin',
  'visible',
  'autoLayout',
  'padding',
  'margin',
  'separator',
  'scale',
] as const

export const SPEC = {
  /* ---- shared chrome, present on system and gamelist views ---- */

  /* The accent rule across the bottom. `_theme_views/front.xml`, per-system gradient from
   * `_theme_inc/infos/<theme>.xml`. */
  lineaInferior: {
    pos: [[null, [0, 0.934]]],
    size: [
      [null, [1, 0.002]],
      [{ tinyScreen: 'true' }, [1, 0.005]],
    ],
    zIndex: [[null, 97]],
  },

  /* Footer scrim under the help bar. `front.xml` - colour `${sistema.pie}`, opacity 0.4. */
  pieBarra: {
    pos: [[null, [0, 0.934]]],
    size: [[null, [1, 0.2]]],
    zIndex: [[null, 96]],
  },

  /* helpsystem. `theme.xml:578-603` (system) and the detailed/grid repeat at fontSize 0.026. */
  help: {
    pos: [[null, [0.01, 0.955]]],
    fontSize: [
      [null, 0.03],
      [{ view: 'gamelist' }, 0.026],
      [{ view: 'gamelist', 'aspect-ratio': '4-3' }, 0.03],
    ],
  },

  /* Region corner tag. `theme.xml:469-488` - hidden entirely on tinyScreen. */
  region: {
    pos: [[null, [-0.019, 0.931]]],
    size: [[null, [1, 0.05]]],
    fontSize: [[null, 0.015]],
    zIndex: [[null, 99]],
    visible: [
      [null, true],
      [{ tinyScreen: 'true' }, false],
    ],
  },

  /* Battery. `theme.xml:452-459` */
  battery: {
    pos: [
      [null, [0.96, 0.961]],
      [{ tinyScreen: 'true' }, [0.935, 0.94]],
    ],
    size: [
      [null, [0.027, 0.027]],
      [{ tinyScreen: 'true' }, [0.06, 0.06]],
    ],
  },

  /* ---- top info bar. `_theme_views/top-info.xml` ---- */
  topInfo: {
    /* :66-68 frontend logo */
    frontendLogo: {
      pos: [[null, [0.009, 0.012]]],
      maxSize: [[null, 0.096]],
      zIndex: [[null, 99]],
    },
    /* :253-255 system cover art, gamelist views only. Hidden on 4:3 and tinyScreen. */
    caratulaTop: {
      pos: [[null, [0.015, 0.02]]],
      maxSize: [[null, 0.096]],
      origin: [[null, [0, 0]]],
      zIndex: [[null, 99]],
      visible: [
        [null, true],
        [{ 'aspect-ratio': '4-3' }, false],
        [{ tinyScreen: 'true' }, false],
      ],
    },
    plusPicto: {
      pos: [[null, [0.086, 0.045]]],
      maxSize: [[null, 0.05]],
      visible: [
        [null, true],
        [{ 'top-info': 'clean|no-numbers' }, false],
      ],
    },
    infoPicto: {
      pos: [
        [null, [0.125, 0.047]],
        [{ 'aspect-ratio': '4-3' }, [0.02, 0.047]],
      ],
      maxSize: [[null, 0.045]],
    },
    /* :115-130 the rotating ticker - two stacked blocks on a 5350ms loop */
    infoText: {
      pos: [
        [null, [0.162, 0.045]],
        [{ 'aspect-ratio': '4-3' }, [0.065, 0.042]],
      ],
      size: [
        [null, [0.387, 0.05]],
        [{ 'top-info': 'clean' }, [0.487, 0.05]],
      ],
      fontSize: [[null, 0.029]],
      zIndex: [[null, 99]],
    },
    version: {
      pos: [[null, [0.563, 0.012]]],
      size: [[null, [0.064, 0.035]]],
      fontSize: [[null, 0.023]],
      visible: [
        [null, true],
        [{ 'top-info': 'clean|no-numbers' }, false],
      ],
    },
    avatar: {
      pos: [
        [null, [0.618, 0.039]],
        [{ 'aspect-ratio': '4-3|3-2' }, [0.625, 0.039]],
        [{ 'top-info': 'clean' }, [0.718, 0.039]],
      ],
      maxSize: [[null, [0.063, 0.063]]],
      zIndex: [[null, 99]],
    },
    username: {
      pos: [
        [null, [0.66, 0.05]],
        [{ 'aspect-ratio': '4-3|3-2' }, [0.68, 0.05]],
        [{ 'top-info': 'clean' }, [0.76, 0.05]],
      ],
      size: [[null, [0.165, 0.04]]],
      fontSize: [[null, 0.028]],
    },
    trophy: {
      pos: [
        [null, [0.827, 0.045]],
        [{ 'aspect-ratio': '4-3' }, [0.885, 0.05]],
        [{ 'aspect-ratio': '3-2' }, [0.895, 0.055]],
        [{ 'top-info': 'clean' }, [0.681, 0.059]],
      ],
      maxSize: [
        [null, 0.044],
        [{ 'aspect-ratio': '4-3|3-2' }, 0.034],
        [{ 'top-info': 'clean' }, 0.025],
      ],
    },
    starPicto: {
      pos: [[null, [0.856, 0.054]]],
      maxSize: [[null, 0.03]],
      visible: [
        [null, true],
        [{ 'aspect-ratio': '4-3|3-2' }, false],
        [{ 'top-info': 'clean|no-numbers' }, false],
      ],
    },
    year: {
      pos: [[null, [0.875, 0.052]]],
      size: [[null, [0.048, 0.035]]],
      fontSize: [[null, 0.025]],
      visible: [
        [null, true],
        [{ 'top-info': 'clean|no-numbers' }, false],
      ],
    },
    clock: {
      pos: [
        [null, [0.91, 0.047]],
        [{ 'aspect-ratio': '4-3' }, [0.912, 0.047]],
      ],
      size: [[null, [0.075, 0.038]]],
      fontSize: [[null, 0.029]],
    },
  },

  /* ==================================================================
   * ps4Style - the theme's defaultView. `_theme_views/ps4-style.xml`
   *
   * The tile strip is an imagegrid wider than the screen, anchored off-screen left, with
   * centerSelection. Nine cells across 1.501 puts the centred cell's left edge at exactly
   * 0.162 - which is marco-activo's authored pos. The frame overlays the selected tile.
   * ================================================================== */
  ps4Style: {
    /* :28-58 */
    gamegrid: {
      pos: [
        [null, [-0.505, 0.085]],
        [{ 'aspect-ratio': '4-3' }, [-0.725, 0.085]],
        [{ 'aspect-ratio': '3-2' }, [-0.615, 0.085]],
        [{ 'aspect-ratio': '5-3' }, [-0.585, 0.085]],
      ],
      size: [
        [null, [1.501, 0.39]],
        [{ 'aspect-ratio': '4-3' }, [2, 0.39]],
        [{ 'aspect-ratio': '3-2' }, [1.75, 0.39]],
        [{ 'aspect-ratio': '5-3' }, [1.67, 0.39]],
      ],
      autoLayout: [[null, [9, 1]]],
      autoLayoutSelectedZoom: [[null, 1]],
      padding: [[null, [0.008, 0.05]]],
      zIndex: [[null, 60]],
    },
    /* :139-147 - origin 0 0, so it scales from its top-left corner */
    marcoActivo: {
      pos: [[null, [0.162, 0.132]]],
      maxSize: [[null, 0.347]],
      origin: [[null, [0, 0]]],
      zIndex: [[null, 89]],
    },
    /* :149-167 - the "Start" pill under the selected tile */
    start: {
      pos: [[null, [0.165, 0.424]]],
      size: [
        [null, [0.16, 0.05]],
        [{ 'aspect-ratio': '4-3' }, [0.216, 0.05]],
        [{ 'aspect-ratio': '3-2' }, [0.192, 0.05]],
        [{ 'aspect-ratio': '5-3' }, [0.173, 0.05]],
      ],
      fontSize: [[null, 0.03]],
      zIndex: [[null, 59]],
    },
    /* :172-232 - the big title stackpanel. y drops to 0.278 when height <= 480, which the
     * source writes as an if= expression rather than tinyScreen (ps4-style.xml:175). */
    gamename: {
      pos: [
        [null, [0.335, 0.43]],
        [{ 'aspect-ratio': '4-3' }, [0.39, 0.43]],
        [{ 'aspect-ratio': '3-2' }, [0.365, 0.43]],
        [{ 'aspect-ratio': '5-3' }, [0.35, 0.43]],
      ],
      y: [
        [null, undefined],
        [{ tinyScreen: 'true' }, 0.278],
      ],
      size: [
        [null, [0.63, 0.06]],
        [{ 'aspect-ratio': '5-3' }, [0.62, 0.06]],
      ],
      separator: [[null, 0.005]],
      zIndex: [[null, 99]],
    },
    /* :200-214 */
    gameName: {
      fontSize: [
        [null, 0.054],
        [{ 'aspect-ratio': '4-3' }, 0.05],
        [{ tinyScreen: 'true' }, 0.064],
      ],
      size: [[null, [0.71, 0.001]]],
    },
    /* :216-230 - only rendered when the system is a Collection */
    systemNameChip: {
      fontSize: [
        [null, 0.023],
        [{ tinyScreen: 'true' }, 0.032],
      ],
      pos: [[null, [0, 0.175]]],
    },
    /* image-sources.xml, customView ps4Style - the featured image lower-left */
    featured: {
      pos: [[null, [0.15, 0.73]]],
      maxSize: [
        [null, [0.25, 0.3]],
        [{ 'aspect-ratio': '4-3' }, [0.275, 0.3]],
      ],
      origin: [[null, [0.5, 0.5]]],
      zIndex: [[null, 91]],
    },
    /* :235-242 */
    marquee: {
      pos: [[null, [0.91, 0.84]]],
      maxSize: [[null, [0.14, 0.14]]],
      origin: [[null, [0.5, 0.5]]],
      zIndex: [[null, 99]],
    },
    thumbnail: {
      pos: [[null, [0.91, 0.63]]],
      maxSize: [[null, [0.125, 0.26]]],
      origin: [[null, [0.5, 0.5]]],
      zIndex: [[null, 99]],
    },
    /* grid.xml positions, overridden by ps4-style.xml:360+ */
    gamedata: {
      pos: [[null, [0.3, 0.58]]],
      size: [[null, [0.5, 0.028]]],
      separator: [[null, 0.015]],
      fontSize: [[null, 0.023]],
      zIndex: [[null, 99]],
    },
    gamedata2: {
      pos: [[null, [0.3, 0.79]]],
      size: [[null, [0.5, 0.028]]],
      separator: [[null, 0.015]],
      fontSize: [[null, 0.023]],
      zIndex: [[null, 99]],
    },
    iconos: {
      pos: [[null, [0.3, 0.835]]],
      size: [[null, [0.7, 0.03]]],
      separator: [[null, 0.015]],
      zIndex: [[null, 99]],
    },
    gamedesc: {
      pos: [[null, [0.3, 0.621]]],
      size: [[null, [0.42, 0.156]]],
      fontSize: [[null, 0.029]],
      zIndex: [[null, 90]],
    },
    /* Character cutout, right-and-bottom anchored, full height. gamelist-overlay.xml */
    overlayArt: {
      pos: [[null, [1, 1]]],
      origin: [[null, [1, 1]]],
      size: [[null, [0, 1]]],
      zIndex: [[null, 70]],
    },
  },

  /* ==================================================================
   * system view. `_theme_views/front.xml` + `systemcarousels/carousel-ps{3,4,5}.xml`
   *              + `carousel-sizes/{big,medium,small}.xml`
   *
   * The carousel is a horizontal strip anchored off-screen left, same idea as the ps4Style
   * tile grid. Its pos/size/logoSize come from the carousel SIZE file, and the item art and
   * frame come from the carousel TYPE file - both live subsets, so both stay as variants.
   * ================================================================== */
  system: {
    /* carousel-sizes/{big,medium,small}.xml:15-22 for PS4/PS5; PS3 has its own block. */
    carousel: {
      pos: [
        [{ carousel: 'medium' }, [-0.595, 0.115]],
        [{ carousel: 'medium', 'aspect-ratio': '4-3' }, [-0.94, 0.115]],
        [{ carousel: 'medium', 'aspect-ratio': '3-2' }, [-0.75, 0.115]],
        [{ carousel: 'medium', 'aspect-ratio': '5-3' }, [-0.665, 0.115]],
        /* big - carousel-sizes/big.xml:16 is the second bare <pos>, which wins */
        [{ carousel: 'big' }, [-0.515, 0.111]],
        [{ carousel: 'big', 'aspect-ratio': '4-3' }, [-0.849, 0.109]],
        [{ carousel: 'big', 'aspect-ratio': '3-2' }, [-0.646, 0.111]],
        [{ carousel: 'big', 'aspect-ratio': '5-3' }, [-0.57, 0.111]],
        [{ carousel: 'small' }, [-0.545, 0.114]],
        /* PS3 uses one geometry across sizes - carousel-ps3.xml */
        [{ 'carousel-type': 'PS3' }, [-0.545, 0.15]],
      ],
      size: [
        [{ carousel: 'medium' }, [1.68, 1]],
        [{ carousel: 'medium', 'aspect-ratio': '4-3' }, [2.23, 1]],
        [{ carousel: 'medium', 'aspect-ratio': '3-2' }, [2.02, 1]],
        [{ carousel: 'medium', 'aspect-ratio': '5-3' }, [1.83, 1]],
        [{ carousel: 'big' }, [1.57, 1]],
        [{ carousel: 'small' }, [1.56, 1]],
        [{ 'carousel-type': 'PS3' }, [1.56, 1]],
      ],
      /* logoSize is the tile edge as a fraction of screen height; logoScale is the selected
       * item's zoom. carousel-ps4.xml / ps5 / ps3 differ sharply here. */
      logoSize: [
        [{ carousel: 'big' }, 0.249],
        [{ carousel: 'medium' }, 0.195],
        [{ carousel: 'small' }, 0.169],
        [{ 'carousel-type': 'PS5', carousel: 'big' }, 0.15],
        [{ 'carousel-type': 'PS5', carousel: 'medium' }, 0.13],
        [{ 'carousel-type': 'PS5', carousel: 'small' }, 0.1],
        [{ 'carousel-type': 'PS3', carousel: 'big' }, 0.11],
        [{ 'carousel-type': 'PS3', carousel: 'medium' }, 0.1],
        [{ 'carousel-type': 'PS3', carousel: 'small' }, 0.07],
      ],
      logoScale: [
        [null, 1.485],
        [{ carousel: 'big' }, 1.49],
        [{ carousel: 'small' }, 1.48],
        [{ 'carousel-type': 'PS5' }, 1.5],
        [{ 'carousel-type': 'PS3' }, 1.8],
        [{ 'carousel-type': 'PS3', carousel: 'small' }, 2],
      ],
      maxLogoCount: [
        [{ carousel: 'big' }, 11],
        [{ carousel: 'medium' }, 15],
        [{ carousel: 'small' }, 16],
        [{ 'carousel-type': 'PS5', carousel: 'big' }, 19],
        [{ 'carousel-type': 'PS5', carousel: 'medium' }, 22],
        [{ 'carousel-type': 'PS5', carousel: 'small' }, 28],
        [{ 'carousel-type': 'PS3', carousel: 'big' }, 18],
        [{ 'carousel-type': 'PS3', carousel: 'medium' }, 22],
        [{ 'carousel-type': 'PS3', carousel: 'small' }, 28],
      ],
      /* PS4/PS5 dim their neighbours, PS3 does not.
       * carousel-ps4.xml:26, carousel-ps5.xml:26, carousel-ps3.xml:28 */
      minLogoOpacity: [
        [null, 0.7],
        [{ 'carousel-type': 'PS3' }, 1],
      ],
      /* PS5 rounds its tiles; PS4 does not. carousel-ps5.xml */
      roundCorners: [
        [null, 0],
        [{ 'carousel-type': 'PS5' }, 0.15],
      ],
      zIndex: [[null, 97]],
    },
    /* The selection frame. PS4 uses marco-activo-iso.png; PS5 a rounded white rect. */
    marcoActivo: {
      pos: [
        [{ carousel: 'medium' }, [0.162, 0.132]],
        [{ carousel: 'big' }, [0.163, 0.131]],
        [{ carousel: 'small' }, [0.162, 0.132]],
        [{ 'carousel-type': 'PS5', carousel: 'medium' }, [0.109, 0.141]],
        [{ 'carousel-type': 'PS5', carousel: 'big' }, [0.146, 0.143]],
        [{ 'carousel-type': 'PS5', carousel: 'small' }, [0.122, 0.138]],
      ],
      maxSize: [
        [{ carousel: 'medium' }, 0.347],
        [{ carousel: 'big' }, 0.445],
        [{ carousel: 'small' }, 0.3],
        [{ 'carousel-type': 'PS5', carousel: 'medium' }, 0.199],
        [{ 'carousel-type': 'PS5', carousel: 'big' }, 0.228],
        [{ 'carousel-type': 'PS5', carousel: 'small' }, 0.153],
      ],
      origin: [[null, [0, 0]]],
      zIndex: [
        [null, 97],
        [{ 'carousel-type': 'PS5' }, 90],
      ],
    },
    /* "Start" pill. carousel-sizes/*.xml */
    start: {
      pos: [
        [{ carousel: 'medium' }, [0.165, 0.424]],
        [{ carousel: 'big' }, [0.166, 0.5]],
        [{ carousel: 'small' }, [0.165, 0.381]],
      ],
      size: [
        [{ carousel: 'medium' }, [0.16, 0.05]],
        [{ carousel: 'big' }, [0.207, 0.07]],
        [{ carousel: 'small' }, [0.138, 0.045]],
      ],
      fontSize: [
        [null, 0.03],
        [{ carousel: 'big' }, 0.032],
      ],
      zIndex: [[null, 97]],
    },
    /* The big system title. front.xml - SST Light 0.068, and PS3 moves it hard left (XMB). */
    systemName: {
      pos: [
        [{ carousel: 'medium' }, [0.335, 0.451]],
        [{ carousel: 'big' }, [0.385, 0.54]],
        [{ carousel: 'small' }, [0.312, 0.405]],
        [{ 'carousel-type': 'PS5', carousel: 'medium' }, [0.228, 0.3]],
        [{ 'carousel-type': 'PS5', carousel: 'big' }, [0.283, 0.33]],
        [{ 'carousel-type': 'PS5', carousel: 'small' }, [0.212, 0.265]],
        [{ 'carousel-type': 'PS3' }, [0.02, 0.45]],
      ],
      size: [
        [null, [0.6, 0.001]],
        [{ 'aspect-ratio': '3-2' }, [0.57, 0.001]],
        [{ 'carousel-type': 'PS3' }, [0.8, 0.001]],
      ],
      fontSize: [
        [null, 0.068],
        [{ 'aspect-ratio': '4-3' }, 0.055],
        [{ 'aspect-ratio': '3-2' }, 0.06],
        [{ 'carousel-type': 'PS5' }, 0.042],
        [{ 'carousel-type': 'PS5', carousel: 'small' }, 0.038],
        [{ tinyScreen: 'true', 'aspect-ratio': '4-3' }, 0.076],
      ],
      zIndex: [[null, 99]],
    },
    /* System metadata and description. `_theme_options/systemvideo/video-bg.xml` positions. */
    systemData: {
      pos: [
        [{ carousel: 'medium' }, [0.163, 0.51]],
        [{ carousel: 'big' }, [0.163, 0.6]],
        [{ carousel: 'small' }, [0.163, 0.46]],
        [{ 'carousel-type': 'PS3' }, [0.02, 0.52]],
      ],
      size: [[null, [0.5, 0.028]]],
      fontSize: [[null, 0.023]],
      separator: [[null, 0.007]],
      zIndex: [[null, 99]],
    },
    systemDesc: {
      pos: [
        [{ carousel: 'medium' }, [0.163, 0.55]],
        [{ carousel: 'big' }, [0.163, 0.64]],
        [{ carousel: 'small' }, [0.163, 0.5]],
        [{ 'carousel-type': 'PS3' }, [0.02, 0.56]],
      ],
      size: [
        [null, [0.46, 0.139]],
        [{ 'aspect-ratio': '4-3' }, [0.55, 0.239]],
      ],
      fontSize: [[null, 0.028]],
      zIndex: [[null, 99]],
    },
    /* front.xml - console render and system marquee, bottom right */
    console: {
      pos: [[null, [0.825, 0.48]]],
      maxSize: [[null, [0.16, 0.25]]],
      origin: [[null, [0, 0]]],
      zIndex: [[null, 99]],
    },
    logo2: {
      pos: [[null, [0.825, 0.77]]],
      maxSize: [[null, [0.16, 0.12]]],
      origin: [[null, [0, 0]]],
      zIndex: [[null, 100]],
    },
    /* ROM folder chip, bottom left. front.xml */
    gamefolder: {
      pos: [[null, [0.012, 0.895]]],
      maxSize: [[null, [0.025, 0.025]]],
      zIndex: [[null, 99]],
    },
    systemFolder: {
      pos: [[null, [0.037, 0.891]]],
      fontSize: [[null, 0.025]],
      zIndex: [[null, 99]],
    },
    overlayArt: {
      pos: [[null, [1, 0.5]]],
      origin: [[null, [1, 0.5]]],
      size: [[null, [0, 1]]],
      zIndex: [[null, 98]],
    },
  },

  /* ==================================================================
   * detailed. `_theme_views/detailed.xml` - left textlist, right image, bottom-right
   * metadata and description.
   * ================================================================== */
  detailed: {
    gamelist: {
      pos: [[null, [0, 0.134]]],
      size: [[null, [0.52, 0.81]]],
      fontSize: [[null, 0.035]],
      zIndex: [[null, 52]],
    },
    image: {
      pos: [
        [null, [0.76, 0.405]],
        [{ 'aspect-ratio': '4-3' }, [0.76, 0.345]],
      ],
      maxSize: [
        [null, [0.42, 0.565]],
        [{ 'aspect-ratio': '4-3' }, [0.42, 0.425]],
      ],
      origin: [[null, [0.5, 0.5]]],
      zIndex: [[null, 91]],
    },
    gamedata: {
      pos: [
        [null, [0.55, 0.696]],
        [{ 'aspect-ratio': '4-3' }, [0.55, 0.565]],
      ],
      size: [[null, [0.5, 0.04]]],
      fontSize: [[null, 0.023]],
      separator: [[null, 0.015]],
      zIndex: [[null, 99]],
    },
    gamedata2: {
      pos: [
        [null, [0.55, 0.727]],
        [{ 'aspect-ratio': '4-3' }, [0.55, 0.595]],
      ],
      size: [[null, [0.5, 0.04]]],
      fontSize: [[null, 0.023]],
      separator: [[null, 0.015]],
      zIndex: [[null, 99]],
    },
    lineaInfos: {
      pos: [
        [null, [0.55, 0.768]],
        [{ 'aspect-ratio': '4-3' }, [0.55, 0.634]],
      ],
      size: [[null, [0.42, 0.0011]]],
      zIndex: [[null, 52]],
    },
    gamedesc: {
      pos: [
        [null, [0.55, 0.78]],
        [{ 'aspect-ratio': '4-3' }, [0.55, 0.65]],
      ],
      size: [
        [null, [0.43, 0.126]],
        [{ 'aspect-ratio': '4-3' }, [0.43, 0.246]],
      ],
      fontSize: [[null, 0.028]],
      zIndex: [[null, 52]],
    },
  },

  /* ==================================================================
   * grid - the base class every customView inherits. `_theme_views/grid.xml`
   * ================================================================== */
  grid: {
    gamegrid: {
      pos: [
        [null, [0.022, 0.48]],
        [{ 'aspect-ratio': '4-3' }, [0, 0.46]],
      ],
      size: [
        [null, [0.955, 0.45]],
        [{ 'aspect-ratio': '4-3' }, [1, 0.48]],
      ],
      autoLayout: [
        [null, [5, 2]],
        [{ 'aspect-ratio': '4-3' }, [4, 2]],
      ],
      margin: [[null, [0.005, 0.006]]],
      padding: [[null, [0.005, 0.005]]],
      zIndex: [[null, 99]],
    },
    image: {
      pos: [
        [null, [0.155, 0.3]],
        [{ 'aspect-ratio': '4-3' }, [0.145, 0.272]],
      ],
      maxSize: [
        [null, [0.25, 0.335]],
        [{ 'aspect-ratio': '4-3' }, [0.275, 0.335]],
      ],
      origin: [[null, [0.5, 0.5]]],
      zIndex: [[null, 91]],
    },
    gamename: {
      pos: [[null, [0.3, 0.145]]],
      size: [[null, [0.68, 0.06]]],
      separator: [[null, 0.005]],
      zIndex: [[null, 99]],
    },
    gameName: {
      fontSize: [
        [null, 0.05],
        [{ tinyScreen: 'true' }, 0.064],
      ],
      size: [[null, [0.71, 0.001]]],
    },
    gamedata: {
      pos: [[null, [0.3, 0.22]]],
      size: [[null, [0.5, 0.028]]],
      fontSize: [[null, 0.023]],
      separator: [[null, 0.015]],
      zIndex: [[null, 99]],
    },
    gamedata2: {
      pos: [[null, [0.3, 0.255]]],
      size: [[null, [0.5, 0.028]]],
      fontSize: [[null, 0.023]],
      separator: [[null, 0.015]],
      zIndex: [[null, 99]],
    },
    iconos: {
      pos: [[null, [0.3, 0.4]]],
      size: [[null, [0.7, 0.03]]],
      separator: [[null, 0.015]],
      zIndex: [[null, 99]],
    },
    gamedesc: {
      pos: [[null, [0.3, 0.287]]],
      size: [[null, [0.55, 0.09]]],
      fontSize: [[null, 0.029]],
      zIndex: [[null, 90]],
    },
  },

  /* ==================================================================
   * ps5Style. `_theme_views/ps5-style.xml` - metadata top-left, right-aligned title,
   * 5x2 grid below, console silhouette top-right.
   * ================================================================== */
  ps5Style: {
    gamegrid: {
      pos: [
        [null, [0.075, 0.34]],
        [{ 'aspect-ratio': '4-3' }, [0.075, 0.35]],
      ],
      size: [
        [null, [0.85, 0.6]],
        [{ 'aspect-ratio': '4-3' }, [0.85, 0.55]],
      ],
      autoLayout: [
        [null, [5, 2]],
        [{ 'aspect-ratio': '4-3|3-2' }, [4, 2]],
      ],
      margin: [[null, [0.01, 0.013]]],
      zIndex: [[null, 99]],
    },
    gamename: {
      pos: [[null, [0.915, 0.29]]],
      origin: [[null, [1, 0]]],
      size: [
        [null, [0.4, 0.08]],
        [{ 'aspect-ratio': '5-3' }, [0.62, 0.08]],
      ],
      fontSize: [[null, 0.032]],
      zIndex: [[null, 98]],
    },
    console: {
      pos: [[null, [0.92, 0.135]]],
      origin: [[null, [1, 0]]],
      maxSize: [[null, [0.125, 0.14]]],
      zIndex: [[null, 98]],
    },
    marquee: {
      pos: [[null, [0.13, 0.17]]],
      origin: [[null, [0.5, 0.5]]],
      maxSize: [[null, [0.1, 0.1]]],
      zIndex: [[null, 99]],
    },
    iconos: {
      pos: [[null, [0.082, 0.23]]],
      size: [[null, [0.7, 0.03]]],
      separator: [[null, 0.015]],
      zIndex: [[null, 98]],
    },
    gamedata2: {
      pos: [[null, [0.082, 0.265]]],
      size: [[null, [0.5, 0.028]]],
      fontSize: [[null, 0.023]],
      separator: [[null, 0.015]],
      zIndex: [[null, 98]],
    },
    gamedata: {
      pos: [[null, [0.082, 0.305]]],
      size: [[null, [0.5, 0.028]]],
      fontSize: [[null, 0.023]],
      separator: [[null, 0.015]],
      zIndex: [[null, 98]],
    },
  },

  /* ==================================================================
   * carousel - the reflective single row. `_theme_views/carousel.xml`
   * Also the defaultView on both tinyScreen devices (force-gridview.xml).
   * ================================================================== */
  carousel: {
    gamegrid: {
      pos: [
        [null, [0, 0.475]],
        [{ 'aspect-ratio': '4-3' }, [0, 0.46]],
        [{ tinyScreen: 'true', 'aspect-ratio': '3-2' }, [0, 0.48]],
      ],
      size: [
        [null, [1, 0.45]],
        [{ tinyScreen: 'true', 'aspect-ratio': '4-3' }, [1, 0.52]],
      ],
      autoLayout: [
        [null, [5, 1]],
        [{ tinyScreen: 'true', 'aspect-ratio': '4-3' }, [3, 1]],
      ],
      /* autoLayoutSelectedZoom 1.5 default; thumbnail/boxart/default/cartridge 1.35.
       * grid-origin is pinned to fanart, so 1.5 stands. carousel.xml:12-15 */
      scale: [[null, 1.5]],
      padding: [[null, [0.008, 0.05]]],
      margin: [[null, [0.005, 0.006]]],
      zIndex: [[null, 99]],
    },
    image: {
      pos: [[null, [0.155, 0.3]]],
      maxSize: [[null, [0.25, 0.335]]],
      origin: [[null, [0.5, 0.5]]],
      zIndex: [[null, 91]],
    },
  },

  /* ==================================================================
   * full-grid. `_theme_views/full-grid.xml` - left info column, 5x5 grid right.
   * ================================================================== */
  fullGrid: {
    gamegrid: {
      pos: [[null, [0.29, 0.128]]],
      size: [[null, [0.7, 0.8]]],
      autoLayout: [
        [null, [5, 5]],
        [{ tinyScreen: 'true' }, [3, 3]],
      ],
      margin: [
        [null, [0.005, 0.006]],
        [{ tinyScreen: 'true' }, [0.001, 0.001]],
      ],
      padding: [[null, [0.005, 0.005]]],
      zIndex: [[null, 199]],
    },
    image: {
      pos: [[null, [0.142, 0.34]]],
      maxSize: [[null, [0.25, 0.335]]],
      origin: [[null, [0.5, 0.5]]],
      zIndex: [[null, 91]],
    },
    gamename: {
      pos: [
        [null, [0.015, 0.52]],
        [{ 'aspect-ratio': '3-2' }, [0.015, 0.51]],
        [{ tinyScreen: 'true' }, [0.015, 0.5]],
      ],
      size: [[null, [0.27, 0.08]]],
      fontSize: [[null, 0.033]],
      zIndex: [[null, 99]],
    },
    gamedata: {
      pos: [[null, [0.015, 0.577]]],
      size: [[null, [0.27, 0.028]]],
      fontSize: [[null, 0.023]],
      separator: [[null, 0.012]],
      zIndex: [[null, 99]],
    },
    gamedata2: {
      pos: [[null, [0.015, 0.61]]],
      size: [[null, [0.27, 0.028]]],
      fontSize: [[null, 0.023]],
      separator: [[null, 0.012]],
      zIndex: [[null, 99]],
    },
    gamedesc: {
      pos: [[null, [0.015, 0.645]]],
      size: [[null, [0.255, 0.12]]],
      fontSize: [[null, 0.022]],
      zIndex: [[null, 90]],
    },
    iconos: {
      pos: [[null, [0.015, 0.785]]],
      size: [[null, [0.27, 0.03]]],
      separator: [[null, 0.012]],
      zIndex: [[null, 99]],
    },
    systemName: {
      pos: [[null, [0.015, 0.855]]],
      size: [[null, [0.15, 0.03]]],
      fontSize: [[null, 0.023]],
      zIndex: [[null, 99]],
    },
  },

  /* ==================================================================
   * single - game by game. `_theme_views/single.xml`
   * The grid is scaled down to a hidden 1x1 driver; everything is one big card.
   * ================================================================== */
  single: {
    marquee: {
      pos: [[null, [0.025, 0.14]]],
      origin: [[null, [0, 0]]],
      maxSize: [[null, [0.14, 0.14]]],
      zIndex: [[null, 99]],
    },
    start: {
      pos: [[null, [0.025, 0.31]]],
      size: [
        [null, [0.13, 0.055]],
        [{ 'aspect-ratio': '4-3' }, [0.15, 0.055]],
      ],
      fontSize: [[null, 0.03]],
      zIndex: [[null, 59]],
    },
    gamename: {
      pos: [[null, [0.025, 0.378]]],
      size: [[null, [0.9, 0.06]]],
      separator: [[null, 0.005]],
      zIndex: [[null, 99]],
    },
    gameName: {
      fontSize: [
        [null, 0.05],
        [{ tinyScreen: 'true' }, 0.064],
      ],
      size: [[null, [0.71, 0.001]]],
    },
    gamedata: {
      pos: [[null, [0.026, 0.445]]],
      size: [[null, [0.5, 0.028]]],
      fontSize: [[null, 0.023]],
      separator: [[null, 0.015]],
      zIndex: [[null, 99]],
    },
    gamedata2: {
      pos: [[null, [0.026, 0.48]]],
      size: [[null, [0.5, 0.028]]],
      fontSize: [[null, 0.023]],
      separator: [[null, 0.015]],
      zIndex: [[null, 99]],
    },
    iconos: {
      pos: [[null, [0.026, 0.525]]],
      size: [[null, [0.7, 0.03]]],
      separator: [[null, 0.015]],
      zIndex: [[null, 99]],
    },
    gamedesc: {
      pos: [[null, [0.3, 0.645]]],
      size: [[null, [0.42, 0.156]]],
      fontSize: [[null, 0.029]],
      zIndex: [[null, 90]],
    },
    image: {
      pos: [[null, [0.15, 0.76]]],
      maxSize: [[null, [0.25, 0.3]]],
      origin: [[null, [0.5, 0.5]]],
      zIndex: [[null, 91]],
    },
    thumbnail: {
      pos: [[null, [0.91, 0.78]]],
      maxSize: [[null, [0.125, 0.25]]],
      origin: [[null, [0.5, 0.5]]],
      zIndex: [[null, 99]],
    },
    /* The "more games" arrow: fades in, bobs forever, fades out at 2s. single.xml:52-63 */
    arrow: {
      pos: [[null, [0.99, 0.42]]],
      origin: [[null, [1, 0.5]]],
      size: [[null, [0.012, 0.045]]],
      zIndex: [[null, 999]],
    },
  },

  /* ==================================================================
   * media tester. `_theme_views/test-media.xml` - a diagnostic grid of every scraped asset,
   * each captioned with an XML-style closing tag.
   * ================================================================== */
  mediaTester: {
    gamelist: {
      pos: [[null, [0, 0.16]]],
      size: [[null, [0.2, 0.385]]],
      fontSize: [[null, 0.022]],
      zIndex: [[null, 52]],
    },
    gamename: {
      pos: [[null, [0.22, 0.5]]],
      size: [[null, [0.75, 0.05]]],
      fontSize: [[null, 0.04]],
      zIndex: [[null, 99]],
    },
    tag: { fontSize: [[null, 0.022]], zIndex: [[null, 100]] },
    slot: { maxSize: [[null, [0.19, 0.25]]], origin: [[null, [0.5, 0.5]]], zIndex: [[null, 91]] },
  },

  /* ==================================================================
   * splash. `splash.xml` - the boot screen. A separate theme root, not a view of theme.xml.
   * ================================================================== */
  splash: {
    logo: {
      pos: [[null, [0.03, 0.05]]],
      maxSize: [
        [null, [0.25, 0.25]],
        [{ 'aspect-ratio': '4-3' }, [0.1, 0.1]],
      ],
      zIndex: [[null, 5]],
    },
    welcome: {
      pos: [[null, [0.5, 0]]],
      origin: [[null, [0.5, 0]]],
      size: [[null, [0.5, 0.3]]],
      fontSize: [
        [null, 0.04],
        [{ 'aspect-ratio': '4-3' }, 0.038],
      ],
      zIndex: [[null, 60]],
    },
    avatarFrame: {
      pos: [[null, [0.5, 0.326]]],
      origin: [[null, [0.5, 0]]],
      maxSize: [[null, [0.255, 0.255]]],
      zIndex: [[null, 9]],
    },
    avatar: {
      pos: [[null, [0.498, 0.34]]],
      origin: [[null, [0.5, 0]]],
      maxSize: [[null, [0.222, 0.222]]],
      zIndex: [[null, 10]],
    },
    username: {
      pos: [[null, [0, 0.59]]],
      size: [[null, [1, 0.034]]],
      fontSize: [[null, 0.038]],
      zIndex: [[null, 99]],
    },
    label: {
      pos: [[null, [0, 0.703]]],
      size: [[null, [1, 0.04]]],
      fontSize: [[null, 0.03]],
      zIndex: [[null, 61]],
    },
    progressbar: {
      pos: [[null, [0.25, 0.703]]],
      size: [[null, [0.5, 0.04]]],
      zIndex: [[null, 60]],
    },
    region: {
      pos: [[null, [-0.02, 0.945]]],
      size: [[null, [1, 0.05]]],
      fontSize: [[null, 0.026]],
      zIndex: [[null, 60]],
    },
    version: {
      pos: [[null, [0.02, 0.951]]],
      size: [[null, [0.6, 0.04]]],
      fontSize: [[null, 0.022]],
      zIndex: [[null, 60]],
    },
    linea: {
      pos: [[null, [0, 0.935]]],
      size: [
        [null, [1, 0.002]],
        [{ tinyScreen: 'true' }, [1, 0.005]],
      ],
      zIndex: [[null, 59]],
    },
  },

  /* ==================================================================
   * gamesplash. `gamesplash.xml` - the "launching game" card.
   * ================================================================== */
  gamesplash: {
    marquee: {
      pos: [[null, [0.023, 0.17]]],
      origin: [[null, [0, 1]]],
      maxSize: [[null, [0.14, 0.14]]],
      zIndex: [[null, 5]],
    },
    gamename: {
      pos: [[null, [0.023, 0.17]]],
      size: [[null, [0.9, 0.08]]],
      fontSize: [[null, 0.06]],
      zIndex: [[null, 5]],
    },
    gamedata: {
      pos: [[null, [0.025, 0.26]]],
      size: [[null, [0.5, 0.032]]],
      fontSize: [[null, 0.028]],
      separator: [[null, 0.015]],
      zIndex: [[null, 5]],
    },
    gamedata2: {
      pos: [[null, [0.025, 0.3]]],
      size: [[null, [0.5, 0.032]]],
      fontSize: [[null, 0.028]],
      separator: [[null, 0.018]],
      zIndex: [[null, 5]],
    },
    iconos: {
      pos: [[null, [0.024, 0.35]]],
      size: [[null, [0.7, 0.03]]],
      separator: [[null, 0.015]],
      zIndex: [[null, 5]],
    },
    console: {
      pos: [[null, [0.89, 0.93]]],
      origin: [[null, [0.5, 1]]],
      maxSize: [[null, [0.165, 0.23]]],
      zIndex: [[null, 5]],
    },
    loading: {
      pos: [[null, [0.025, 0.94]]],
      size: [[null, [1, 0.05]]],
      fontSize: [[null, 0.032]],
      separator: [[null, 0.01]],
      zIndex: [[null, 5]],
    },
    romPath: { fontSize: [[null, 0.028]] },
  },
} as const satisfies Record<string, SpecNode>
