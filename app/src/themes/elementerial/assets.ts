/**
 * Asset resolution for Elementerial.
 *
 * Everything is resolved through Vite's glob import, which means a missing or misspelled file is
 * a build error rather than a broken image someone notices later. The original built these paths
 * as strings at runtime, so a typo produced a silently empty box.
 *
 * The lookups are by name because the theme picks assets from data - a system's backdrop, a
 * scheme's placeholder tile, an aspect's overlay - so a static import per file is not an option.
 */

const urls = import.meta.glob<string>('./assets/**/*.{png,webp,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
})

/** Resolve an asset path relative to the theme's own asset directory. */
export function asset(path: string): string {
  const url = urls[`./assets/${path}`]
  if (!url) throw new Error(`Elementerial asset not found: ${path}`)
  return url
}

/** True when an asset exists, for the few slots that are legitimately optional. */
export function hasAsset(path: string): boolean {
  return `./assets/${path}` in urls
}

/** The full-bleed backdrop behind a system's carousel entry and its game lists. */
export function systemBackdrop(theme: string): string {
  return asset(`systems/${theme}.webp`)
}

/** A system's wordmark, drawn in the carousel. */
export function systemLogo(theme: string): string {
  return asset(`logos/${theme}.svg`)
}

/**
 * The scheme's no-artwork placeholder.
 *
 * Named rather than resolved through CSS, because a relative `url()` carried in a custom
 * property resolves against the stylesheet that consumes it rather than the document - which in
 * the original pointed it one directory too high.
 */
export function placeholderTile(schemeGrid: string, iconStyle: 'grid' | 'grid-steam'): string {
  return asset(`${iconStyle}/${schemeGrid}.png`)
}

export function folderTile(iconStyle: 'grid' | 'grid-steam'): string {
  return asset(`${iconStyle}/folder.png`)
}

export function favouriteIcon(): string {
  return asset('icons/favorite.png')
}

export function switchIcon(on: boolean): string {
  return asset(on ? 'switch-on.svg' : 'switch-off.svg')
}

/** Status glyphs ship at three sizes; the aspect picks which set to use. */
export function statusIcon(size: string, name: 'wifi=on' | 'battery=full'): string {
  return asset(`icons/screen/${size}/${name}.svg`)
}

/** A menu row's icon. */
export function menuIcon(name: string): string {
  return asset(`icons/${name}.svg`)
}

/**
 * The per-aspect overlays: the rounded-corner border and the on-screen-display background.
 *
 * The 5:3 set exists in the theme but the original's stylesheet had no rule for it, so on that
 * device neither overlay ever drew. Resolving them here means the assets are used wherever they
 * exist. See `docs/porting/elementerial.md`.
 */
export function borderOverlay(ratio: string): string | null {
  const path = `${ratio}/borders.png`
  return hasAsset(path) ? asset(path) : null
}

export function osdOverlay(ratio: string): string | null {
  const path = `${ratio}/osd-bg.png`
  return hasAsset(path) ? asset(path) : null
}

/** The edge fades Elementflix uses, in whichever direction the grid runs. */
export function fadeMask(assetName: string): string {
  return asset(assetName)
}

/**
 * The scrim masks, per aspect.
 *
 * These tint the screen with the scheme's background colour through a soft mask. The original
 * inlined them as base64 because Chrome blocks `mask-image` across `file://` origins; served
 * over HTTP the real files work, so they are resolved like everything else.
 */
export function scrimMask(ratio: string, kind: 'carousel' | 'basic' | 'video'): string | null {
  const path = `${ratio}/${kind === 'carousel' ? 'carousel-background' : kind === 'basic' ? 'gamelist-basic' : 'gamelist-video'}.png`
  return hasAsset(path) ? asset(path) : null
}
