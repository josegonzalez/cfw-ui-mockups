/**
 * The port's images, resolved through `import.meta.glob` so a wrong name is a thrown error rather
 * than an empty box. `bios/` is decoded from the boot ROM by
 * `docs/themes/dreamcast-bios/reference/extract-assets.py`; `drawn/` is redrawn for what the ROM
 * holds as geometry rather than texture; `sounds/` is decoded and rendered from the ROM.
 * `assets/SOURCE.md` has the provenance of each.
 */
const urls = import.meta.glob<string>('./assets/**/*.{png,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
})

export function asset(path: string): string {
  const url = urls[`./assets/${path}`]
  if (!url) throw new Error(`Dreamcast BIOS asset missing: ${path}`)
  return url
}

export const bios = (name: string) => asset(`bios/${name}.png`)
export const drawn = (name: string) => asset(`drawn/${name}.svg`)

const sounds = import.meta.glob<string>('./assets/sounds/*.wav', {
  eager: true,
  query: '?url',
  import: 'default',
})

/** A sound decoded or rendered from the ROM, by the name `extract-assets.py` gives it. */
export function sound(name: string): string {
  const url = sounds[`./assets/sounds/${name}.wav`]
  if (!url) throw new Error(`Dreamcast BIOS sound missing: ${name}`)
  return url
}
