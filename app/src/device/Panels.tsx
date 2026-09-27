import type { CSSProperties, ReactNode } from 'react'
import { useScreen } from './ScreenContext'

export type PanelName = 'top' | 'bottom'

export interface PanelsProps {
  readonly top: ReactNode
  readonly bottom: ReactNode
}

/**
 * The two surfaces of a two-panel device.
 *
 * A two-panel device still has one `.screen`, and this is what divides it: each panel is its own
 * `w` x `h` positioning context, clipped to itself and isolated, so a theme lays out both in the
 * same device pixels it would use for one. The gap between them belongs to the hinge and is left
 * see-through; nothing a theme draws can reach it.
 *
 * One theme root renders both, rather than one root per panel. The panels are one application -
 * the cursor on the bottom decides what the top shows - and splitting the root would mean
 * inventing a channel between two halves of the same state.
 *
 * On a one-panel device there is nowhere to put the second surface, so this throws rather than
 * quietly dropping half a screen.
 */
export function Panels({ top, bottom }: PanelsProps) {
  const { w, h, panels, panelGap } = useScreen()
  if (panels !== 2) {
    throw new Error('Panels needs a two-panel device')
  }

  const panel = (y: number): CSSProperties => ({
    position: 'absolute',
    left: 0,
    top: `${y}px`,
    width: `${w}px`,
    height: `${h}px`,
    overflow: 'hidden',
    isolation: 'isolate',
    background: '#000',
    borderRadius: '4px',
  })

  return (
    <>
      <div style={panel(0)} data-panel="top">
        {top}
      </div>
      <div style={panel(h + panelGap)} data-panel="bottom">
        {bottom}
      </div>
    </>
  )
}
