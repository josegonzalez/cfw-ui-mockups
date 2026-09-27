/**
 * NeoStation's own images, resolved through `import.meta.glob` so a wrong name is a thrown error
 * rather than an empty box. Copied unchanged from the source's `assets/images/` - see
 * `assets/SOURCE.md`.
 */
const urls = import.meta.glob<string>('./assets/{gamepad,icons,logos,brand,emulators}/*.{png,webp,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
})

function asset(path: string): string {
  const url = urls[`./assets/${path}`]
  if (!url) throw new Error(`NeoStation asset missing: ${path}`)
  return url
}

/** `assets/images/gamepad/<name>.png`. */
export const gamepad = (name: string) => asset(`gamepad/${name}.png`)

/** `assets/images/icons/<file>`, extension included - the source mixes png, webp and svg. */
export const icon = (file: string) => asset(`icons/${file}`)

/** `assets/images/logos/<id>.webp`, or null where the source has none and draws text instead. */
export function logo(id: string): string | null {
  return urls[`./assets/logos/${id}.webp`] ?? null
}

export const brand = (file: string) => asset(`brand/${file}`)

/** `assets/images/emulators/<file>`. */
export const emulator = (file: string) => asset(`emulators/${file}`)
