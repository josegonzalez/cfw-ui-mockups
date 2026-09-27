/**
 * Widget metadata.
 *
 * Every widget declares itself here. The registry is what makes the vocabulary *bounded*
 * rather than merely large: a widget that is not registered has no documentation page and no
 * story, and `registry.test.ts` fails. That check exists because a catalogue nobody verifies
 * drifts from the code within a release or two.
 */

/** The mockup sets a widget can belong to. */
export type ThemeSlug =
  | 'example-cfw'
  | 'elementerial'
  | 'playstation-x'
  | 'vitrolauncher'
  | 'nextui'
  | 'slot'
  | 'simpleos'
  | 'tortos'
  | 'neostation'
  | 'ds-style'

/**
 * A capability a simple renderer may not have.
 *
 * Naming these individually rather than using one "web-only" flag means the eventual second
 * renderer gets a checklist rather than a warning.
 */
export type WebOnlyCapability =
  | 'backdropBlur'
  | 'shader'
  | 'maskImage'
  | 'boxReflect'
  | 'cssEllipsis'
  | 'cssFilter'
  | 'transform3d'

export interface WidgetMeta {
  readonly name: string
  /** One line. What it is, not how it is built. */
  readonly summary: string
  readonly usedBy: readonly ThemeSlug[]
  /**
   * Capabilities this widget uses that a simple renderer lacks. Any widget declaring one must
   * also describe its degraded variant in `fallback`.
   */
  readonly webOnly?: readonly WebOnlyCapability[]
  /** What the widget renders instead when web-only effects are unavailable. */
  readonly fallback?: string
}
