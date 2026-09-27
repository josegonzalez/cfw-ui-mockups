/**
 * Every duration the port animates, in milliseconds, with where it was measured. `9iT7IgLAgPc` is
 * a 60fps recording of System Menu 4.3 (`v43` in the source notes) and the primary reference;
 * earlier recordings are cited only for what it does not show. A measurement is good to one frame
 * of its recording.
 */
export const MOTION = {
  /** The grid's page turn: 20 frames at 60fps, decelerating to rest (`9iT7IgLAgPc` 137.57s). */
  pageTurn: 333,
  /**
   * Grid to preview: the panel grows out of its slot while the grid behind swells towards it and
   * darkens - 25 frames at 60fps, easing in and out (`9iT7IgLAgPc` 36.13-36.55s).
   */
  zoomIn: 417,
  /** The grid swelling and darkening behind the growing panel - 24 frames (`9iT7IgLAgPc` 36.10-36.50s). */
  zoomGrid: 400,
  /** How far the grid swells about the slot as it darkens (`9iT7IgLAgPc` 36.35s). */
  zoomSwell: 1.5,
  /**
   * The banner fading up once the panel has landed - 20 frames (`9iT7IgLAgPc` 36.58-36.92s). The
   * band and its buttons are there throughout.
   */
  zoomContent: 333,
  /** Preview to grid: the panel shrinks into its slot, banner and all - 20 frames (`9iT7IgLAgPc` 85.85-86.18s). */
  zoomOut: 333,
  /**
   * The grid coming back as the panel shrinks: it starts 10 frames in and unswells and brightens
   * over 18 (`9iT7IgLAgPc` 86.00-86.30s). The whole return is 28 frames.
   */
  zoomGridOut: { delay: 167, duration: 300, total: 467 },
  /**
   * Stepping to the next channel in a preview: the new banner's background is there at once, and
   * its content fades up after 20 frames, over 12 (`9iT7IgLAgPc` 52.97-53.50s).
   */
  step: { delay: 333, duration: 200 },
  /** The HOME Menu's bars sliding in and the dimming behind them - 13 frames at 59.94fps (`6u1VB2rT2os` 115.4s). */
  home: 217,
  /** A Settings page fading up from black, accelerating - 15 frames (`9iT7IgLAgPc` 313.20-313.45s). */
  settings: 250,
  /**
   * A Settings page turn: the page slides in 14 frames, easing in and out, while the arriving page
   * brightens from dim over 20 (`9iT7IgLAgPc` 366.70-367.05s).
   */
  settingsTurn: { slide: 233, brighten: 333 },
  /**
   * Wii Options to a screen of its own: the other tile darkens (10 frames), the chosen one shrinks
   * away into the title tab (12) - `9iT7IgLAgPc` 287.0-287.4s. Wii Settings then fades to black
   * (20 frames, 308.3-308.65s); Data Management keeps the ground, grows its tab's name (8 frames)
   * and fades its tiles up in place (10 frames, after 10 empty) - 287.4-287.9s.
   */
  tileOut: { other: 167, fly: 200, black: 333 },
  tileIn: { tab: 133, delay: 300, duration: 167 },
  /**
   * The Wii Menu fading to black when it opens Wii Options or the SD Card Menu - 20 frames
   * (`9iT7IgLAgPc` 281.40-281.75s, 234.85-235.17s).
   */
  menuOut: 333,
  /**
   * Wii Options coming up from black: 12 frames black, the ground fading up over 30, the tiles over
   * 15 more (`9iT7IgLAgPc` 281.75-282.70s).
   */
  optionsIn: { black: 200, ground: 500, tiles: 250 },
  /** Health & Safety fading to black - 24 frames at 60fps, near linear (`9iT7IgLAgPc` 6.78-7.17s). */
  healthOut: 400,
  /** Black while the menu loads, before it fades up (`9iT7IgLAgPc` 7.17-9.58s). */
  bootBlack: 2417,
  /** The menu fading up from black - 18 frames at 60fps, linear (`9iT7IgLAgPc` 9.58-9.88s). */
  boot: 300,
  /**
   * "Wii Menu" stands in the clock's place after boot, then cross-fades to the clock
   * (`9iT7IgLAgPc` 9.58-13.25s, and 12 frames of fade).
   */
  bootLabel: { hold: 3667, fade: 200 },
  /** The clock's colon, on a second and off a second, switching over 4 frames (`9iT7IgLAgPc` 15.0-19.0s). */
  colon: { half: 1000, fade: 67 },
  /**
   * The SD Card Menu: the Wii Menu fades to black (20 frames), stays black (17), and the SD Card
   * Menu fades up (17), its "Loading from the SD Card..." box showing for 81 frames before the
   * slots (`9iT7IgLAgPc` 234.85-237.50s).
   */
  sd: { out: 333, black: 283, in: 283, loading: 1350 },
  /**
   * A dialog sliding up from the bottom edge and decelerating into place, the page dimming behind -
   * 14 frames, its top 335, 293, 253 ... 66, 65, 64 (`9iT7IgLAgPc` 407.62-407.85s).
   */
  dialog: 233,
  /** Every other screen change - the Message Board - not measured in `v43`. */
  screen: 283,
  /** One frame of an empty slot's static. */
  staticFrame: 67,
  /**
   * The Health & Safety prompt: it first appears 116 frames after the warning (`9iT7IgLAgPc`
   * 1.93s), then every 60 frames rises for 24, holds 8, falls for 20 and stays off 8 (2.0-7.0s).
   */
  prompt: { first: 1933, rise: 400, hold: 133, fall: 333, period: 1000 },
  /** The highlight's outline easing in under the pointer (`EOZxJue_N6s` 21.8s; `v43` agrees). */
  highlight: 100,
  /** A button growing under the pointer - 3 frames (`9iT7IgLAgPc` 85.48-85.55s). */
  hover: 50,
  /** How much a pointed-at button grows: the preview's Wii Menu, 250 to 270 of the Wii's pixels (`9iT7IgLAgPc` 85.55s). */
  hoverScale: 1.08,
  /** The name bubble appearing after the pointer settles: 20-24 frames at 60fps (`9iT7IgLAgPc` 280.9s). */
  bubbleDelay: 367,
  /** The page arrows bobbing inward and back, 2 of the Wii's pixels, one way (`EOZxJue_N6s` 19.6-21.1s; `v43` agrees). */
  arrowBob: 450,
} as const

/**
 * The stock channels' icon loops, from the grid in `9iT7IgLAgPc` (10.5-33s for page 1's icons,
 * 138-146s and 219-230s for page 2's). Each is a cycle in milliseconds and the moments inside it
 * at which a layer fades or moves. Every loop starts on the picture the port's stills show.
 */
export const LOOPS = {
  /** The disc turns about its vertical axis once every 6s, the turn taking 1.1s (`9iT7IgLAgPc` 15.53s, 21.53s, 27.52s). */
  disc: { period: 6000, turn: 1100 },
  /** Mii faces 5.85s, 0.8s cross-fade to the "Mii" logo, the logo 5.95s, 0.75s back - 13.35s (`9iT7IgLAgPc` 15.2-28.55s). */
  mii: { period: 13350, faces: 5850, toLogo: 800, logo: 5950, toFaces: 750 },
  /**
   * The Photo Channel's cards and label hold 7.84s, the whole icon fades to bare cork (0.5s), the
   * cork holds 0.6s, three photos slide in 0.83s apart (0.2s each), and the label fades up (0.5s)
   * 1.37s after the last - 12.67s (`9iT7IgLAgPc` 22.17-34.84s).
   */
  photo: { period: 12670, hold: 7840, out: 500, cork: 600, slide: 200, apart: 830, labelAfter: 1370, label: 500 },
  /**
   * The Wii Shop tiles fade up one by one over 2.8s, the bag over the last 0.67s of that, all hold
   * 3.72s, fade 1.5s, and it stays blank 2.3s - 10.33s (`9iT7IgLAgPc` 12.35-22.68s). The loop starts
   * on the hold, which is what the port's still shows.
   */
  shop: { period: 10330, hold: 3720, out: 1500, blank: 2310, tiles: 2800, bag: 670 },
  /**
   * "Internet Channel" holds 8.93s, fades 0.25s, "i" alone 1.8s, "internet" wipes in over 0.97s
   * letter by letter, holds 4.73s, and cross-fades to "Internet Channel" over 0.87s - 16.68s
   * (`9iT7IgLAgPc` 15.70-32.38s).
   */
  internet: { period: 16680, name: 8060, cross: 870, out: 250, dot: 1800, wipe: 970, word: 4730 },
  /**
   * Everybody Votes: the logo 3.5s, fades 0.25s, blank 0.75s, the WiiConnect24 icon fades up 0.25s
   * and holds 2.5s, fades 0.25s, blank 0.2s, the logo fades up 0.3s - 8s. Check Mii Out runs the
   * same cycle 0.65s behind it.
   */
  wc24: { period: 8000, logo: 3500, out: 250, blank: 750, iconIn: 250, icon: 2500, iconOut: 250, gap: 200, logoIn: 300 },
  cmocLag: 650,
  /** Forecast: "Forecast Channel" 2.5s, 0.33s cross-fade, the weathernews logo 3.4s, 0.33s back - 6.57s. */
  forecast: { period: 6567, name: 2500, cross: 333, logo: 3400 },
} as const
