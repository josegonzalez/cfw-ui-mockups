import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_HERO, HERO_VARIANTS, isHeroVariant, type HeroVariant } from './types'

const STORAGE_KEY = 'cfw:hero'
const PARAM = 'hero'

/**
 * The document's storage, or null where there is none.
 *
 * Deliberately `window.localStorage` rather than `globalThis.localStorage`: recent Node versions
 * ship an experimental `localStorage` global that is inert unless the runtime was started with
 * a backing file, and it shadows the document's. Reading it through `window` gets the real one
 * in a browser and in jsdom, and nothing anywhere else.
 */
function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    // Blocked in a private or sandboxed context.
    return null
  }
}

function readInitial(): HeroVariant {
  if (typeof globalThis.location === 'undefined') return DEFAULT_HERO

  // The URL wins over the stored preference, so a shared link shows what the sender saw.
  const fromUrl = new URLSearchParams(globalThis.location.search).get(PARAM)
  if (isHeroVariant(fromUrl)) return fromUrl

  const stored = storage()?.getItem(STORAGE_KEY) ?? null
  return isHeroVariant(stored) ? stored : DEFAULT_HERO
}

/**
 * Which hero treatment to show, remembered across reloads and shareable by URL.
 *
 * A preview control rather than a product feature: it exists so the four treatments can be
 * compared in place, on real content, instead of side by side in a mockup.
 */
export function useHeroVariant(): {
  variant: HeroVariant
  setVariant: (next: HeroVariant) => void
  cycle: () => void
} {
  const [variant, setVariantState] = useState<HeroVariant>(readInitial)

  const setVariant = useCallback((next: HeroVariant) => {
    setVariantState(next)

    try {
      storage()?.setItem(STORAGE_KEY, next)
    } catch {
      // Not being able to remember the choice is not worth failing over.
    }

    // `replaceState` rather than `pushState`: cycling treatments should not fill the back
    // button with steps the reader has to walk out of.
    const url = new URL(globalThis.location.href)
    url.searchParams.set(PARAM, next)
    globalThis.history.replaceState(null, '', url)
  }, [])

  const cycle = useCallback(() => {
    const index = HERO_VARIANTS.indexOf(variant)
    setVariant(HERO_VARIANTS[(index + 1) % HERO_VARIANTS.length]!)
  }, [variant, setVariant])

  // `H` cycles, so the treatments can be flipped through without reaching for the mouse.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'h' && event.key !== 'H') return
      if (event.metaKey || event.ctrlKey || event.altKey) return

      const target = event.target as HTMLElement | null
      if (target?.isContentEditable) return
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return

      cycle()
    }

    globalThis.addEventListener('keydown', onKey)
    return () => globalThis.removeEventListener('keydown', onKey)
  }, [cycle])

  return { variant, setVariant, cycle }
}
