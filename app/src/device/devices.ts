/**
 * The device registry.
 *
 * Every screen renders at the exact panel resolution listed here. `docs/devices.md` carries the
 * same table in prose, and `devices.test.ts` asserts the two agree, so the document cannot
 * drift from the code that implements it.
 */

export type DeviceSlug =
  | 'rg35xx'
  | 'rg40xx'
  | 'miyoo-mini'
  | 'rg28xx'
  | 'trimui-smart-pro'
  | 'n64'
  | 'rg-sp'
  | 'rg-cubexx'
  | 'rg34xx'
  | 'rg351m'
  | 'rg552'
  | 'trimui-brick'
  | 'rg-ds'

/** The four first-class panel classes. `other` covers the odd sizes. */
export type ResolutionClass = '640x480' | '1280x720' | '720x720' | 'other'

/**
 * The shell drawn around a panel.
 *
 * **Stylised, not a technical drawing.** These are silhouettes chosen so the devices are
 * distinguishable at a glance - a square chunky body reads as a CubeXX, a wide slab with sticks
 * reads as an RG552 - not measurements of real hardware. Where a slug covers a family, the
 * profile follows the base model the slug is named for.
 *
 * It is mockup chrome and sits outside the portable widget vocabulary: real hardware has a real
 * bezel and real buttons, so none of this translates to a firmware renderer. The portable
 * boundary is the contents of `.screen`, and nothing here may reach inside it.
 */
interface ShellCommon {
  /** Bezel around the panel, in CSS pixels. Asymmetric where the silhouette calls for it. */
  readonly bezel: { readonly top: number; readonly side: number; readonly bottom: number }
  /**
   * Body corner radius: one value, or four in CSS order (top-left, top-right, bottom-right,
   * bottom-left). Four exists because at least one of these devices sweeps a single corner away
   * far harder than the other three, and that asymmetry is most of its silhouette.
   */
  readonly radius: number | readonly [number, number, number, number]
  /** Analog sticks. */
  readonly sticks: 0 | 2
  /** A collar around each stick, which some devices make a feature of. */
  readonly stickRing?: 'rgb' | 'light' | undefined
  /** Body gradient, dark to darker. */
  readonly body: readonly [string, string]
  /**
   * Colour for the names printed on the body.
   *
   * Stated rather than fixed, because three of these shells are pale plastic and the default
   * grey is close to invisible on them.
   */
  readonly ink?: string | undefined
}

/** CSS `border-radius` for a shell, whether it carries one radius or four. */
export function radiusCss(shell: DeviceShell): string {
  const r = shell.radius
  return typeof r === 'number' ? `${r}px` : r.map((n) => `${n}px`).join(' ')
}

/**
 * The two body layouts.
 *
 * `chin` is the upright Game Boy arrangement: panel on top, controls in a strip below it.
 * `flanking` is the landscape controller arrangement: the panel in the middle with a grip either
 * side, controls stacked down each grip.
 *
 * These are genuinely different bodies rather than one body with different spacing, which is why
 * they are a discriminated union - a `gripWidth` means nothing to a chin and a `controlScale`
 * means nothing to a grip, and an open shape invites both being set and one being ignored.
 */
export type ShellLayout = 'chin' | 'flanking' | 'console' | 'clamshell'

/**
 * What occupies a grip's small-button slot.
 *
 * `pair` is Select and Start side by side on one moulded pad; `select` and `start` are one round
 * button each, split across the two grips; `function` is a lone system button.
 *
 * `round-pair` is Select and Start as two separate round buttons on one grip, and `menu-pair` is
 * the system button beside a second round key the input map has no button for - the RG DS puts
 * one of each at the foot of its grips. The second key is moulding, not a control: it is drawn so
 * the grip reads right, and it cannot be pressed because there is nothing for it to press.
 */
export type AuxKind =
  | 'none'
  | 'pair'
  | 'select'
  | 'start'
  | 'function'
  | 'round-pair'
  | 'menu-pair'

/**
 * A console's video output rather than a handheld.
 *
 * The N64 flashcart menu draws to a TV, so there is no body and no cluster - the buttons it names
 * in its hint pills belong to a controller sitting somewhere else entirely. Inventing a shell for
 * it would be inventing hardware, so this layout is the bezel and nothing else.
 */
export interface ConsoleShell extends ShellCommon {
  readonly layout: 'console'
}

export interface ChinShell extends ShellCommon {
  readonly layout: 'chin'
  /**
   * Control size relative to the reference handheld.
   *
   * Buttons are physical objects and roughly a thumb wide on every device, so they do *not*
   * scale with the panel - but they are drawn in CSS pixels beside a panel that does. On a
   * 1920x1152 body, controls at RG35XX size look like they came off a keyring.
   */
  readonly controlScale: number
  /**
   * Extra body below the cluster, in CSS pixels.
   *
   * Some lower bodies are much taller than the controls on them need, and the empty plastic is
   * part of the silhouette - it is where a speaker grille or a model name goes. Deriving the
   * chin purely from the cluster would crop that away.
   */
  readonly chinExtra?: number | undefined
  /** A round Menu button in the middle of the strip. */
  readonly menuButton?: boolean | undefined
  /** A speaker grille in the bottom-right corner. */
  readonly speakerGrille?: boolean | undefined
}

export interface FlankingShell extends ShellCommon {
  readonly layout: 'flanking'
  /**
   * Width of each grip as a fraction of the panel width.
   *
   * A fraction rather than pixels, because the grip has to stay in proportion to the panel it
   * sits beside - the controls on it are sized from this in turn, so one number sets the lot.
   */
  readonly gripWidth: number
  /**
   * The small buttons on each grip.
   *
   * Every landscape body puts them somewhere different, and there is no default that is right
   * more than half the time: one splits Select and Start across the two grips at the top,
   * another stacks both on the left, another pairs them on the right opposite a system button.
   * `position` reorders the whole grip - small buttons at the top push the pad to the middle and
   * the stick to the bottom.
   */
  readonly aux: {
    readonly position: 'top' | 'bottom'
    readonly left: AuxKind
    readonly right: AuxKind
  }
}

/**
 * A two-panel clamshell: a lid carrying one panel above a hinge, and a base carrying the other
 * between two grips.
 *
 * The only body with two panels, and the reason a device can have more than one. Both panels are
 * the device's `w` x `h`; `hinge` is the distance between them, which is lid bezel, hinge barrel
 * and base bezel together. It is measured in device pixels because the two panels share one
 * `.screen`, and the gap is part of that element - left see-through so the body shows in it.
 *
 * The base is a flanking body in everything but height: the grips run the height of the base
 * only, never up beside the lid.
 */
export interface ClamshellShell extends ShellCommon {
  readonly layout: 'clamshell'
  readonly gripWidth: number
  readonly aux: FlankingShell['aux']
  readonly hinge: number
}

export type DeviceShell = ChinShell | FlankingShell | ConsoleShell | ClamshellShell

/** How many panels a shell carries. Two only for a clamshell. */
export function panelCount(shell: DeviceShell): 1 | 2 {
  return shell.layout === 'clamshell' ? 2 : 1
}

/** The distance between two panels, in device pixels. Zero for a single-panel body. */
export function panelGap(shell: DeviceShell): number {
  return shell.layout === 'clamshell' ? shell.hinge : 0
}

/**
 * How tall the chin cluster is before scaling.
 *
 * Derived rather than stored beside `controlScale`, because a chin that disagrees with the
 * controls in it either crops them or leaves a gap, and two numbers that must agree eventually
 * will not.
 */
export function clusterHeight(shell: ChinShell): number {
  // Measured from the rendered cluster rather than guessed; `DeviceFrame.test.tsx` re-checks it.
  const base = 134
  return base + (shell.sticks ? 58 : 0)
}

/** The chin the body reserves. Zero on any body without one - flanking, or a bare console. */
export function chinHeight(shell: DeviceShell): number {
  if (shell.layout !== 'chin') return 0
  return Math.round(clusterHeight(shell) * shell.controlScale) + (shell.chinExtra ?? 0)
}

/** Grip width in pixels, for a body with grips. Zero for anything else. */
export function gripWidth(shell: DeviceShell, panelWidth: number): number {
  if (shell.layout !== 'flanking' && shell.layout !== 'clamshell') return 0
  return Math.round(shell.gripWidth * panelWidth)
}

export interface Device {
  readonly slug: DeviceSlug
  readonly label: string
  readonly w: number
  readonly h: number
  readonly aspect: string
  readonly resolutionClass: ResolutionClass
  /**
   * How far the bezel is scaled up for comfortable desktop viewing. A viewing preference, not
   * a device property - the same panel appears at two different scales in two different mockup
   * sets, because each set chose what read best. Nothing inside the screen ever sees it.
   */
  readonly viewScale: number
  readonly shell: DeviceShell
  readonly note?: string
}

/** The body tones the shells are drawn from, so ten devices are not ten arbitrary greys. */
const BODY = {
  graphite: ['#2b2d31', '#1b1c1f'],
  slate: ['#343740', '#20222a'],
  charcoal: ['#26282c', '#141517'],
  ivory: ['#d9d6cf', '#b3afa6'],
  /** The warm light grey Anbernic call "grey", which is the colourway the reference shot uses. */
  stone: ['#cfc9bd', '#aaa49a'],
  /** Miyoo's "gray", which is a warm khaki rather than a grey. */
  khaki: ['#b9b199', '#948c78'],
  /** The Game Boy Advance indigo the RG34XX is a homage to. */
  indigo: ['#6b62aa', '#4c4483'],
  /** The RG DS turquoise, sampled from its reference photograph. */
  turquoise: ['#64d2dd', '#57c8d4'],
} as const satisfies Record<string, readonly [string, string]>

/** Printed-name colours. Pale bodies need dark ink; the default grey vanishes on them. */
const INK = { light: '#8b8d93', dark: '#4a463d', teal: '#1f6f7c' } as const

/**
 * The reference handheld: even bezel, generously rounded, no sticks.
 *
 * The starting point for a new device. Change only what makes it recognisable; a device with no
 * distinguishing features should use this outright rather than a near-copy of it.
 */
export const HANDHELD: ChinShell = {
  layout: 'chin',
  bezel: { top: 26, side: 26, bottom: 26 },
  radius: 44,
  sticks: 0,
  controlScale: 1,
  body: BODY.graphite,
}

export const DEVICES: Record<DeviceSlug, Device> = {
  n64: {
    slug: 'n64',
    label: 'Nintendo 64 (video output)',
    w: 640,
    h: 480,
    aspect: '4:3',
    resolutionClass: '640x480',
    viewScale: 1.3,
    /*
     * Not a handheld. The flashcart menu renders to a television, so this is a CRT-ish surround
     * and nothing else - no body, no cluster, no grips. The menu's own hint pills name A, B, R
     * and START, and those buttons are on a controller that is not part of this picture.
     *
     * The panel is 640x480 with a 32x24 overscan margin the menu never draws into, which is why
     * the theme's own visible area is 576x432 inset from the corner.
     */
    shell: {
      layout: 'console',
      sticks: 0,
      bezel: { top: 26, side: 26, bottom: 26 },
      radius: [18, 18, 18, 18],
      body: BODY.slate,
      ink: INK.light,
    },
  },
  rg35xx: {
    slug: 'rg35xx',
    label: 'Anbernic RG35XX / Plus / H',
    w: 640,
    h: 480,
    aspect: '4:3',
    resolutionClass: '640x480',
    viewScale: 1.3,
    /*
     * Matched to the reference photograph of the grey colourway.
     *
     * An upright body, and the one thing that stops it reading as a generic rectangle is the
     * bottom-right corner, which sweeps away far harder than the other three. The speaker
     * grille sits in that corner and the Menu button above Select and Start.
     */
    shell: {
      layout: 'chin',
      bezel: { top: 24, side: 24, bottom: 20 },
      radius: [30, 30, 150, 30],
      sticks: 0,
      // Large controls on a lower body taller than they need, which is most of its character.
      controlScale: 1.8,
      chinExtra: 130,
      menuButton: true,
      speakerGrille: true,
      body: BODY.stone,
      ink: INK.dark,
    },
  },
  rg40xx: {
    slug: 'rg40xx',
    label: 'Anbernic RG40XX H / V',
    w: 640,
    h: 480,
    aspect: '4:3',
    resolutionClass: '640x480',
    viewScale: 0.78,
    /*
     * Matched to a reference photograph of the horizontal model.
     *
     * Nearly the CubeXX's body with a 4:3 panel in it: rounded grips, ring-lit sticks, a system
     * button low on the left and Select and Start paired low on the right.
     *
     * This slug covers the H and the V, and the V is an upright body - the shell follows the H,
     * which is the one there is a reference for.
     */
    shell: {
      layout: 'flanking',
      bezel: { top: 50, side: 8, bottom: 50 },
      radius: 130,
      sticks: 2,
      stickRing: 'rgb',
      gripWidth: 0.37,
      aux: { position: 'bottom', left: 'function', right: 'pair' },
      body: BODY.charcoal,
    },
  },
  'miyoo-mini': {
    slug: 'miyoo-mini',
    label: 'Miyoo Mini / Mini Plus',
    w: 640,
    h: 480,
    aspect: '4:3',
    resolutionClass: '640x480',
    viewScale: 1.15,
    /*
     * Matched to a reference photograph of the grey colourway, which is a warm khaki.
     *
     * The panel runs edge to edge across the top with no side bezel at all, and the lower body
     * carries the same furniture as the RG35XX: Menu above Select and Start, faces right,
     * speaker grille in a swept bottom-right corner.
     */
    shell: {
      layout: 'chin',
      bezel: { top: 27, side: 0, bottom: 0 },
      radius: [26, 26, 120, 26],
      sticks: 0,
      controlScale: 1.35,
      chinExtra: 120,
      menuButton: true,
      speakerGrille: true,
      body: BODY.khaki,
      ink: INK.dark,
    },
  },
  rg28xx: {
    slug: 'rg28xx',
    label: 'Anbernic RG28XX',
    w: 640,
    h: 480,
    aspect: '4:3',
    resolutionClass: '640x480',
    viewScale: 0.86,
    /*
     * Matched to a reference photograph, which corrected the panel as well as the shell: this
     * was recorded as a 640x480 panel rotated into a 480x640 portrait, and it is neither. The
     * device is landscape with the panel the right way up.
     *
     * Wide grips, no sticks, and both small buttons stacked on the left below the pad.
     */
    shell: {
      layout: 'flanking',
      bezel: { top: 45, side: 10, bottom: 34 },
      radius: 90,
      sticks: 0,
      gripWidth: 0.52,
      aux: { position: 'bottom', left: 'pair', right: 'none' },
      body: BODY.ivory,
      ink: INK.dark,
    },
  },
  'trimui-smart-pro': {
    slug: 'trimui-smart-pro',
    label: 'Trimui Smart Pro',
    w: 1280,
    h: 720,
    aspect: '16:9',
    resolutionClass: '1280x720',
    viewScale: 0.62,
    /*
     * Matched to Trimui's product photograph.
     *
     * A wide landscape body with pronounced grips. Pad and faces sit high, the ring-lit sticks
     * below them, and the small buttons at the bottom - Menu on the left, Select and Start on
     * the right. The collars are plain light rather than lit colour.
     */
    shell: {
      layout: 'flanking',
      bezel: { top: 62, side: 16, bottom: 74 },
      radius: 120,
      sticks: 2,
      stickRing: 'light',
      gripWidth: 0.243,
      aux: { position: 'bottom', left: 'function', right: 'pair' },
      body: BODY.charcoal,
    },
  },
  'rg-cubexx': {
    slug: 'rg-cubexx',
    label: 'Anbernic RG CubeXX',
    w: 720,
    h: 720,
    aspect: '1:1',
    resolutionClass: '720x720',
    viewScale: 0.68,
    /*
     * Matched to Anbernic's product photograph rather than inferred.
     *
     * The name is about the panel, not the body: this is a landscape controller with a square
     * screen in the middle and a rounded grip either side, not an upright handheld. Each grip
     * carries a shoulder at the top, then a circular D-pad or the face diamond, then a
     * ring-lit stick, then a small button at the bottom - the function button on the left, and
     * Select and Start as a pair of pills on the right.
     */
    shell: {
      layout: 'flanking',
      bezel: { top: 53, side: 14, bottom: 69 },
      radius: 160,
      sticks: 2,
      stickRing: 'rgb',
      gripWidth: 0.45,
      aux: { position: 'bottom', left: 'function', right: 'pair' },
      body: BODY.charcoal,
    },
  },
  'rg-sp': {
    slug: 'rg-sp',
    label: 'Anbernic RG SP',
    w: 720,
    h: 480,
    aspect: '3:2',
    resolutionClass: 'other',
    viewScale: 0.72,
    /*
     * A vertical clamshell, in the Game Boy Advance SP's shape rather than the RG34XX's
     * landscape one - so the controls sit under the panel rather than beside it, which is a
     * chin body here even though the real hardware folds in half.
     *
     * The hinge is not drawn. A shell that folded would need a second body above the panel and
     * a fold state to go with it, and nothing inside `.screen` depends on either.
     */
    shell: {
      layout: 'chin',
      bezel: { top: 22, side: 18, bottom: 14 },
      radius: [26, 26, 40, 40],
      sticks: 0,
      controlScale: 0.92,
      chinExtra: 18,
      menuButton: true,
      speakerGrille: true,
      body: BODY.indigo,
    },
  },
  rg34xx: {
    slug: 'rg34xx',
    label: 'Anbernic RG34XX',
    w: 720,
    h: 480,
    aspect: '3:2',
    resolutionClass: 'other',
    viewScale: 0.72,
    /*
     * Matched to Anbernic's product photograph, which is an explicit Game Boy Advance homage
     * down to the indigo shell. A landscape body with the panel offset toward the left, no
     * sticks, and Select and Start stacked on the left grip below the pad.
     */
    shell: {
      layout: 'flanking',
      bezel: { top: 66, side: 10, bottom: 66 },
      radius: 110,
      sticks: 0,
      gripWidth: 0.41,
      aux: { position: 'bottom', left: 'pair', right: 'none' },
      body: BODY.indigo,
    },
  },
  rg351m: {
    slug: 'rg351m',
    label: 'Anbernic RG351M / RG351MP',
    w: 480,
    h: 320,
    aspect: '3:2',
    resolutionClass: 'other',
    viewScale: 1.1,
    /*
     * Matched to Anbernic's product photograph.
     *
     * A slim landscape slab with rounded ends rather than bulging grips. Select and Start are
     * small round buttons at the *top* of each grip, which pushes the pad to the middle and the
     * sticks to the bottom - the opposite order to the CubeXX.
     */
    shell: {
      layout: 'flanking',
      bezel: { top: 47, side: 8, bottom: 47 },
      radius: 56,
      sticks: 2,
      gripWidth: 0.32,
      aux: { position: 'top', left: 'select', right: 'start' },
      body: BODY.charcoal,
    },
  },
  rg552: {
    slug: 'rg552',
    label: 'Anbernic RG552',
    w: 1920,
    h: 1152,
    aspect: '5:3',
    resolutionClass: 'other',
    viewScale: 0.36,
    /*
     * Matched to Anbernic's product photograph.
     *
     * The largest body in the registry and the widest silhouette: a landscape slab whose panel
     * takes nearly the whole face. Same arrangement as the RG351M - Select and Start at the top
     * of each grip, pad in the middle, sticks at the bottom.
     */
    shell: {
      layout: 'flanking',
      bezel: { top: 118, side: 20, bottom: 70 },
      radius: 120,
      sticks: 2,
      gripWidth: 0.35,
      aux: { position: 'top', left: 'select', right: 'start' },
      body: BODY.charcoal,
    },
  },
  'trimui-brick': {
    slug: 'trimui-brick',
    label: 'Trimui Brick',
    w: 1024,
    h: 768,
    aspect: '4:3',
    resolutionClass: 'other',
    viewScale: 0.8,
    /*
     * Matched to a reference photograph.
     *
     * Named for its silhouette, so the corners stay tight, and the lower body is deep - roughly
     * as tall as the panel. Select and Start sit above the pad row on the real device rather
     * than between the pad and the faces; the port keeps them in the centre column, which is
     * the one arrangement detail here not taken from the photograph.
     */
    shell: {
      layout: 'chin',
      bezel: { top: 23, side: 40, bottom: 0 },
      radius: 26,
      sticks: 0,
      controlScale: 1.7,
      chinExtra: 210,
      menuButton: true,
      speakerGrille: true,
      body: BODY.charcoal,
    },
  },
  'rg-ds': {
    slug: 'rg-ds',
    label: 'Anbernic RG DS',
    w: 640,
    h: 480,
    aspect: '4:3',
    resolutionClass: '640x480',
    viewScale: 0.63,
    /*
     * Matched to a reference photograph of the turquoise model
     * (`docs/themes/simpleos/reference/rg-ds.png`), which is also the body the SimpleOS trailer
     * renders its screens into.
     *
     * Two 640x480 panels, one in the lid and one in the base - SimpleOS's own splash bitmaps are
     * 640x480 each, one per panel, which settles the resolution. Measured at the panel's scale the
     * body is nearly square. The base carries the pad over a stick on the left and the faces over
     * a stick on the right, and two small round buttons at the foot of each grip; the lid carries
     * nothing but the panel and two speaker grilles. The base runs out barely below its panel.
     */
    shell: {
      layout: 'clamshell',
      bezel: { top: 79, side: 30, bottom: 23 },
      radius: 30,
      sticks: 2,
      gripWidth: 0.43,
      aux: { position: 'bottom', left: 'menu-pair', right: 'round-pair' },
      hinge: 190,
      body: BODY.turquoise,
      ink: INK.teal,
    },
  },
}

export const DEVICE_SLUGS = Object.keys(DEVICES) as DeviceSlug[]

export function getDevice(slug: DeviceSlug): Device {
  return DEVICES[slug]
}

export function isDeviceSlug(value: string): value is DeviceSlug {
  return Object.hasOwn(DEVICES, value)
}
