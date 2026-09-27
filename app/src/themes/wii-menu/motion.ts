/**
 * Every duration the port animates, in milliseconds, with where it was measured. The captures are
 * 29.97fps (capture card) and 59.94fps (Dolphin, the setup tour), so a measurement is good to a
 * frame of those.
 */
export const MOTION = {
  /** The grid's page turn: 10 frames at 29.97fps, decelerating to rest (`_tv8xik0484` 14.5-15.0s). */
  pageTurn: 334,
  /** Grid to preview: the slot grows into the panel while the grid behind it darkens - 15 frames at 29.97fps (22.6-23.1s). */
  zoom: 500,
  /** The banner and buttons fading up once the panel is in place - 8 frames at 29.97fps (23.1-23.4s). */
  zoomContent: 267,
  /** The HOME Menu's bars sliding in and the dimming behind them - 13 frames at 59.94fps (`6u1VB2rT2os` 115.4s). */
  home: 217,
  /** A Settings page turn, and a Settings page opening over the last - 17 frames at 59.94fps (`KzORmt_gWDA` 356.8s, 351.2s). */
  settings: 283,
  /** Every other screen change - Wii Options, SD Card Menu, Message Board - not measured; the Settings cross-fade. */
  screen: 283,
  /** Health & Safety to the menu - not measured. */
  boot: 500,
  /** One frame of an empty slot's static. */
  staticFrame: 67,
  /** The Health & Safety prompt's pulse, one way. */
  prompt: 900,
} as const
