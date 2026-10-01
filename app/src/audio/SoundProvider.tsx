import { createContext, use, useMemo, type ReactNode } from 'react'

/**
 * Sound, as the one place a screen's audio leaves the theme.
 *
 * A theme never touches audio itself. It decides *which* sound a moment calls for - as data, a cue
 * its reducer derives from the press that caused it - and asks this provider to play the file for
 * that cue. That keeps sound on the same footing as motion: a descriptor the theme produces and a
 * renderer consumes, so a second renderer implements `play` and nothing else.
 *
 * Sound belongs to a live build only. A still has no provider behind it, so it is silent by
 * construction rather than by each theme remembering to check - the same rule that makes a still
 * inert to input. `?sound=off` mutes a live build too, for a reader who wants the screens quiet.
 */
export interface SoundApi {
  /** Whether sound will actually play here: a live build that has not been muted. */
  readonly enabled: boolean
  /** Play a sound file from the start. Overlapping calls overlap, as the hardware's voices do. */
  readonly play: (url: string) => void
}

const SILENT: SoundApi = { enabled: false, play: () => {} }

const SoundContext = createContext<SoundApi>(SILENT)

function playUrl(url: string) {
  const audio = new Audio(url)
  /*
   * A browser refuses to start audio before the page has had a gesture, and says so by rejecting
   * the promise. That is not a fault in the screen - the next press is a gesture and plays - so the
   * refusal is dropped rather than surfacing as an unhandled rejection in the console.
   */
  audio.play().catch(() => {})
}

export function SoundProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const value = useMemo<SoundApi>(() => (enabled ? { enabled: true, play: playUrl } : SILENT), [enabled])
  return <SoundContext value={value}>{children}</SoundContext>
}

export function useSound(): SoundApi {
  return use(SoundContext)
}
