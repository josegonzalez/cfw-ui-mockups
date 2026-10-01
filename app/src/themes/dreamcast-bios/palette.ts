/**
 * The BIOS menu's colours, sampled from the reference frames (`docs/themes/dreamcast-bios/reference/frames/`),
 * each a 5x5 average at the point named. The frames are a capture of real hardware over composite
 * or S-Video, so a sampled value is the nearest plausible flat colour rather than a byte-exact one.
 * Where a panel is translucent over the sky, the colour here is the panel's own, with its alpha
 * chosen so it composites to the sampled value over the sky behind it.
 */
export const PALETTE = {
  /** The top bar (`main.png` at 300,20). */
  bar: '#c2bec2',
  /** The date and time in the bar. */
  barInk: '#3a383c',
  /** The power-on screen's grey (`boot-logo.png` at 60,60). */
  boot: '#cdcdcd',

  /** The sky: pale cyan at the top, deep blue at the bottom (`main.png` at 320,80 and 320,470). */
  skyTop: '#bcdbe8',
  skyMid: '#87a6d6',
  skyLow: '#5070c9',

  /** Text: white inside, a dark edge round it (`frames/zoom-text.png`). */
  text: '#f2f2f2',
  textEdge: '#3b3f4c',
  /** The yellow the string table switches to for a button's name (`\x16`...`\x17`). */
  textHot: '#ecd631',

  /** The main menu's four label pills, fill and rim. */
  pill: {
    play: { fill: '#a98a7a', rim: '#c9a894' },
    file: { fill: '#4f9a88', rim: '#6cc4a4' },
    music: { fill: '#3f90c8', rim: '#6cb8e2' },
    settings: { fill: '#ae70b8', rim: '#cb92dc' },
  },

  /** Settings: the slate row behind each item, its lilac value field, and the focused field's tan. */
  row: 'rgba(78, 84, 128, 0.72)',
  value: 'rgba(160, 110, 176, 0.86)',
  valueFocus: 'rgba(206, 164, 134, 0.92)',

  /** A dialog: near-black, a little see-through, with a coloured rim. */
  dialog: 'rgba(34, 36, 45, 0.9)',
  rimSettings: '#a8155e',
  rimPlay: '#d0701e',
  rimFile: '#3cc070',
  /** An option's blob: green at rest, yellow while focused and blinking. */
  blob: '#2a6a2e',
  blobFocus: '#b3ab22',
  /** The clock editor's arrows over the field being changed. */
  arrow: '#3f9f6c',

  /** File: the slate header, the green panel round the file grid, and its teal info strip. */
  header: 'rgba(72, 84, 112, 0.82)',
  band: 'rgba(96, 108, 140, 0.7)',
  gridRim: '#3cc070',
  gridFill: 'rgba(88, 120, 176, 0.55)',
  cell: 'rgba(130, 150, 196, 0.45)',
  cellFocus: '#e8d830',
  info: 'rgba(60, 110, 120, 0.82)',
  /** The memory card box: violet, with a red used and teal free bar. */
  card: '#5d5fc1',
  used: '#b81851',
  free: '#6fc4b4',
  /** The ALL badge: a blue disc in an olive ring. */
  allFill: '#4a56b8',
  allRim: '#b4b24a',
  /** Port letters and slot numbers. */
  port: '#48c05f',
  ghost: 'rgba(150, 170, 214, 0.38)',

  /** BACK's frame, idle and focused (`frames/cards-back.png`). */
  backRim: '#3f4552',
  backRimFocus: '#e4e02c',
  backFill: 'rgba(214, 228, 248, 0.55)',
} as const
