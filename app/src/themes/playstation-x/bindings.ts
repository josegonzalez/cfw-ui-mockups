/**
 * Which storyboard drives which element.
 *
 * Kept as a table rather than scattered through the views, for one reason: three of the
 * theme's storyboards were transcribed into the original mockup and never attached to
 * anything, so their motion existed as data and never ran. A table can be checked against the
 * storyboard set - `storyboards.test.ts` asserts every entry is reachable - where twenty
 * `bind()` calls spread across a thousand lines cannot.
 *
 * The key is the element's role in the port; the value is the storyboard's own `name`
 * attribute in the source.
 */
import type { StoryboardName } from './storyboards'

export const BINDINGS = {
  /* chrome, on every view */
  frontendLogo: 'frontend-logo',
  caratulaTop: 'caratula-top',
  infoTextA: 'systemInfoEx',
  infoTextB: 'systemInfoEx2',
  cheevosIcon: 'cheevos-icon',
  badge: 'badge',

  /* system view */
  backgroundSystem: 'background-system',
  systemCarousel: 'systemcarousel',
  systemMarcoActivo: 'marco-activo',
  systemStart: 'start',
  systemName: 'system_name',
  systemDescription: 'system_description',
  systemConsole: 'system-console',

  /* gamelist views */
  backgroundGamelist: 'background-gamelist',
  overlayArt: 'overlay-arts',
  gameTitle: 'gamename',
  gameMarquee: 'marquee',
  gridMeta: 'grid-meta',
  detailedPanel: 'detailed-panel',
  gameGrid: 'gamegrid-enter',
  gamelistMarcoActivo: 'marco-activo',
  gamelistStart: 'start',

  /* single view */
  arrowRight: 'arrow-right',

  /**
   * The launch flourish, fired when the system view hands off to a gamelist.
   *
   * Never bound in the original, because nothing there navigated between the two - its input
   * handler only moved the cursor. The port makes A on the system view enter the gamelist,
   * which is the transition this storyboard was authored for.
   */
  caratulaOverlay: 'caratula-overlay',
} as const satisfies Record<string, StoryboardName>

export type BindingRole = keyof typeof BINDINGS
