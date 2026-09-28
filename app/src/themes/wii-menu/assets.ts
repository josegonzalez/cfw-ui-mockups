/**
 * The port's images, resolved through `import.meta.glob` so a wrong name is a thrown error rather
 * than an empty box. All of them are WM4K textures resampled to the size the System Menu loads -
 * see `docs/themes/wii-menu/reference/extract-assets.py` and `assets/SOURCE.md`.
 */
const urls = import.meta.glob<string>('./assets/**/*.{png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

export function asset(path: string): string {
  const url = urls[`./assets/${path}`]
  if (!url) throw new Error(`Wii Menu asset missing: ${path}`)
  return url
}

export const menuImg = (name: string) => asset(`menu/${name}.png`)
export const channelImg = (name: string) => asset(`channels/${name}.png`)
export const homeImg = (name: string) => asset(`home/${name}.png`)
export const optionsImg = (name: string) => asset(`options/${name}.png`)
export const sdImg = (name: string) => asset(`sd/${name}.png`)
export const mailImg = (name: string) => asset(`mail/${name}.png`)

/** A whole Settings frame: `section` is its directory, `state` the file name without extension. */
export const settingsFrame = (section: string, state: string) => asset(`settings/${section}/${state}.webp`)

/** Whether the pack has a frame for a state, for the tests that hold the machine to the frames. */
export const hasSettingsFrame = (section: string, state: string) =>
  `./assets/settings/${section}/${state}.webp` in urls
