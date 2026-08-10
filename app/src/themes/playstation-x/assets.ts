/**
 * Asset resolution.
 *
 * Everything goes through Vite's glob import, so a missing or misspelled file is a build error
 * rather than a broken image somebody notices later. The original built these paths as strings
 * at runtime, which turned a typo into a silently empty box.
 *
 * Lookups are by name because the theme picks assets from data - a system's background, a
 * colorset's cover variant, a game's character cutout - so a static import per file is not an
 * option.
 */

const urls = import.meta.glob<string>('./assets/**/*.{png,jpg,jpeg,svg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

export function asset(path: string): string {
  const url = urls[`./assets/${path}`]
  if (!url) throw new Error(`PlayStation X asset not found: ${path}`)
  return url
}

export function hasAsset(path: string): boolean {
  return `./assets/${path}` in urls
}

/** Optional assets resolve to null rather than throwing, for the slots that legitimately vary. */
function optional(path: string): string | null {
  return hasAsset(path) ? asset(path) : null
}

/** The full-bleed photograph behind a system and its games. */
export function background(theme: string): string | null {
  return optional(`background/${theme}.jpg`)
}

/**
 * The scrim over the background. Each view names its own.
 *
 * `front.xml` uses overlay-systemview and a PS3 variant; ps4Style and single use overlay-single;
 * grid and carousel use overlay-carousel; detailed, full-grid and the media tester use
 * overlay-full-grid.
 */
export function overlay(name: string): string | null {
  return optional(`overlays/${name}.png`)
}

/** A system's console render, and its wordmark. */
export function consoleArt(theme: string): string | null {
  return optional(`consoles/${theme}.png`)
}

/** A Collection ships a PNG where a real system ships an SVG. */
export function systemLogo(theme: string, isCollection: boolean): string | null {
  return optional(`logos/${theme}.${isCollection ? 'png' : 'svg'}`)
}

/**
 * The character cutout.
 *
 * Per-system in the system view, and matched to the game by name in a gamelist - which is what
 * `gamelist-overlay.xml` does with `contains(lower(name), ...)`.
 */
export function overlayArt(name: string): string | null {
  return optional(`overlay-arts/${name}.png`)
}

export function systemOverlayArt(theme: string): string | null {
  return optional(`overlay-arts/systems/${theme}.png`)
}

/**
 * A system's cover art.
 *
 * The black colorset ships its own `-b` variants for some systems; the rest fall back, which is
 * what the source does rather than shipping a duplicate of every cover.
 */
export function caratula(theme: string, colorset: string): string | null {
  if (colorset === 'black') {
    const dark = optional(`caratulas/${theme}-b.png`)
    if (dark) return dark
  }
  return optional(`caratulas/${theme}.png`)
}

export function colorsetBackground(colorset: string): string | null {
  return optional(`colorsets/${colorset === 'black' ? 'black' : 'blue'}-background.jpg`)
}

export function image(name: string): string | null {
  return optional(`images/${name}`)
}

export function badge(name: string): string | null {
  return optional(`badges/${name}.png`)
}

export function flag(code: string): string | null {
  return optional(`flags/${code}.png`)
}

export function frontend(name: string): string | null {
  return optional(`frontend/${name}`)
}

export function avatar(): string | null {
  return optional('avatars/custom-avatar.png')
}
