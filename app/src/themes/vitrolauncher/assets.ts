/**
 * Asset paths, resolved by the bundler.
 *
 * The original built these as strings at runtime, so a typo produced a silently empty image.
 * Resolving through `import.meta.glob` turns the same typo into a missing key, which the
 * callers below surface as `null` rather than a broken request.
 */
const IMAGES = import.meta.glob('./assets/images/**/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

function look(path: string): string | null {
  return IMAGES[`./assets/images/${path}`] ?? null
}

export function image(name: string): string | null {
  return look(name)
}

export function button(name: string): string | null {
  return look(`buttons/${name}.png`)
}

export function navIcon(name: string): string | null {
  return look(`icons/${name}.png`)
}

/** The A/B or X/O pair, depending on the Button Style setting. */
export function buttonPair(style: 'retro' | 'modern'): [string | null, string | null] {
  return style === 'modern'
    ? [button('button_Cross'), button('button_Circle')]
    : [button('button_A'), button('button_B')]
}

/** The glyph All Titles shows for "skip page" and for "bookmark". */
export function skipGlyph(style: 'retro' | 'modern'): string | null {
  return button(style === 'modern' ? 'button_Square' : 'button_X')
}
export function bookmarkGlyph(style: 'retro' | 'modern'): string | null {
  return button(style === 'modern' ? 'button_Triangle' : 'button_Y')
}
