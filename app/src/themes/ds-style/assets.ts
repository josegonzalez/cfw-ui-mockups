/**
 * DS Style's own images, resolved through `import.meta.glob` so a wrong name is a thrown error
 * rather than an empty box. Prepared from the source's `assets/` by
 * `docs/themes/ds-style/reference/extract-assets.py`, with the launcher's hard alpha edge and black
 * colour key already applied - see `assets/SOURCE.md`.
 */
const urls = import.meta.glob<string>('./assets/{bg,bg/dark,ui,ui/dark,themes/*,icons,art}/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
})

function asset(path: string): string {
  const url = urls[`./assets/${path}`]
  if (!url) throw new Error(`DS Style asset missing: ${path}`)
  return url
}

export type Background = 'START' | 'SD_LIST' | 'SD_HORIZONTAL' | 'SD_VERTICAL' | 'SET'

/** `ui_background`: the dark copy when dark mode is on (`source/ui.h:28`). */
export const background = (name: Background, dark: boolean) => asset(`bg/${dark ? 'dark/' : ''}${name}.png`)

/** RESET and POWER, recoloured for dark mode (`ui.h:31-39`). */
export const powerIcon = (name: 'RESET' | 'POWER', dark: boolean) => asset(`ui/${dark ? 'dark/' : ''}${name}.png`)

export const splash = () => asset('ui/SPLASH.png')

/** A theme's title bar, and its folder and GBA icons (`ui.h:73-80`). */
export const themeBar = (id: string) => asset(`themes/${id}/bar.png`)
export const themeIcon = (id: string, which: 'folder' | 'gba') => asset(`themes/${id}/icon_${which}.png`)

/** `assets/icons/icon_<name>.png` - a system, a file type or Apps (`ui.h:41-42`). */
export const platformIcon = (name: string) => asset(`icons/icon_${name}.png`)

/**
 * A picture at the exact size a slot shows it, sampled the launcher's way - see
 * `extract-assets.py`. `name` is a system folder or `NOTFOUND`.
 */
export function art(name: string, w: number, h: number, gba: boolean): string {
  return asset(`art/${name}-${w}x${h}${gba ? '-gba' : ''}.png`)
}

/** Whether a picture exists for a system, so a folder without one draws its icon instead. */
export const hasArt = (name: string) => `./assets/art/${name}-120x80.png` in urls
