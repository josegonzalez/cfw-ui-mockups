/**
 * Every duration the port animates, in milliseconds, with where it was measured. The captures are
 * 29.97fps (capture card) and 59.94fps (Dolphin, the setup tour), so a measurement is good to a
 * frame of those.
 */
export const MOTION = {
  /** The grid's page turn: 10 frames at 29.97fps, decelerating to rest (`_tv8xik0484` 14.5-15.0s). */
  pageTurn: 334,
  /**
   * Grid to preview and back: the panel grows out of its slot, or shrinks into it, while the grid
   * behind fades - 28 frames at 60fps, in both directions (`EOZxJue_N6s` 18.83s, 21.12s, 22.47s,
   * 124.72s). The capture card's 15 frames at 29.97fps (500ms) agree to within its frame.
   */
  zoom: 467,
  /** The banner and buttons fading up over the last 8 frames of the zoom in (`EOZxJue_N6s` 19.2-19.3s). */
  zoomContent: 133,
  /** The HOME Menu's bars sliding in and the dimming behind them - 13 frames at 59.94fps (`6u1VB2rT2os` 115.4s). */
  home: 217,
  /** A Settings page opening over the last - 17 frames at 59.94fps (`KzORmt_gWDA` 351.2s). */
  settings: 283,
  /**
   * A Settings page turn: 16 frames to land and 24 to rest at 60fps, the incoming page brightening
   * from dim as it arrives (`EOZxJue_N6s` 155.73s).
   */
  settingsTurn: 400,
  /**
   * Wii Options to a screen of its own: the other tile fades (100ms), the chosen one shrinks away
   * towards the title tab (200ms), then the screen fades to black (333ms) - `EOZxJue_N6s` 147.7s,
   * 60fps.
   */
  tileOut: { other: 100, fly: 200, black: 333, total: 600 },
  /** A tile screen's tiles growing out of its title tab, one after the other (`EOZxJue_N6s` 144.95s, 146.5s). */
  tileIn: { duration: 267, stagger: 67 },
  /** Health & Safety fading to black - 28 frames at 60fps, near linear (`EOZxJue_N6s` 4.70-5.17s). */
  healthOut: 467,
  /** Black while the menu loads, before it fades up (`EOZxJue_N6s` 5.17-6.07s). */
  bootBlack: 900,
  /** The menu fading up from black - 19 frames at 60fps, linear (`EOZxJue_N6s` 6.07-6.40s). */
  boot: 317,
  /** Every other screen change - SD Card Menu, Message Board - not measured; the Settings cross-fade. */
  screen: 283,
  /** One frame of an empty slot's static. */
  staticFrame: 67,
  /** The Health & Safety prompt fading out or back in: a full cycle is 57 frames at 60fps (`EOZxJue_N6s` 0.5-4.7s). */
  prompt: 475,
  /** The highlight's outline easing in under the pointer (`EOZxJue_N6s` 21.8s). */
  highlight: 100,
  /** The name bubble appearing after the pointer settles: 24-28 frames at 60fps (`EOZxJue_N6s` 21.8-22.2s). */
  bubbleDelay: 400,
  /** The page arrows bobbing inward and back, 2 of the Wii's pixels, one way (`EOZxJue_N6s` 19.6-21.1s, 23-26s). */
  arrowBob: 450,
} as const
