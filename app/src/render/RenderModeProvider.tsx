import { createContext, use, type ReactNode } from 'react'

/**
 * Which set of visual capabilities a screen may use.
 *
 * - `web`      - everything the browser can do: backdrop blur, shaders, arbitrary masks.
 * - `fallback` - only what a simple renderer can do.
 *
 * The point of shipping both is that the degraded look gets designed now, with the original in
 * front of us, rather than being discovered later by whoever writes the second renderer. Every
 * screen is screenshotted in both modes, so a fallback that quietly looks wrong is a test
 * failure rather than a surprise.
 */
export type RenderMode = 'web' | 'fallback'

const RenderModeContext = createContext<RenderMode>('web')

export interface RenderModeProviderProps {
  readonly mode: RenderMode
  readonly children: ReactNode
}

export function RenderModeProvider({ mode, children }: RenderModeProviderProps) {
  return <RenderModeContext value={mode}>{children}</RenderModeContext>
}

export function useRenderMode(): RenderMode {
  return use(RenderModeContext)
}

/**
 * True when the richer web-only path may be used.
 *
 * Read this rather than comparing strings, so a future third mode does not need every widget
 * edited to keep behaving.
 */
export function useWebEffects(): boolean {
  return use(RenderModeContext) === 'web'
}
