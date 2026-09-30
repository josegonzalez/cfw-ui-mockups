/**
 * The SPRUCE theme's images, resolved through `import.meta.glob` so a wrong name is a thrown error
 * rather than an empty box. Copied per panel from the theme's `skin*` and `icons*` folders by
 * `docs/themes/spruceos/reference/extract-assets.py` - see `assets/SOURCE.md`.
 */
import type { PanelRes } from './panel'

const urls = import.meta.glob<string>('./assets/{*/skin,*/icons,*/icons/sel,*/icons/app,art/*,switcher}/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
})

function asset(path: string): string {
  const url = urls[`./assets/${path}`]
  if (!url) throw new Error(`spruceOS asset missing: ${path}`)
  return url
}

/** `Theme._get_asset_folder`'s `skin` image, for one panel (`themes/theme.py:147-155`). */
export const skin = (res: PanelRes, name: string) => asset(`${res}/skin/${name}.png`)

/** A system's icon, greyscale, or its colour copy under `sel/` (`theme.py:469-490`). */
export const systemIcon = (res: PanelRes, system: string, selected: boolean) =>
  asset(`${res}/icons/${selected ? 'sel/' : ''}${system.toLowerCase()}.png`)

/** An app's icon, the theme's copy of it (`menus/app/app_utils.py`). */
export const appIcon = (res: PanelRes, file: string) => asset(`${res}/icons/app/${file}`)

/** A game's box art, `Roms/<system>/Imgs/<name>.png`: the fixture's generated picture. */
export const boxArt = (system: string, name: string) => asset(`art/${system}/${name}.png`)

/** The Game Switcher's save-state screenshot for a game: the fixture's generated frame. */
export const switcherShot = (name: string) => asset(`switcher/${name}.png`)

/** Whether a game has a switcher screenshot, so one without falls back to its box art. */
export const hasSwitcherShot = (name: string) => `./assets/switcher/${name}.png` in urls
