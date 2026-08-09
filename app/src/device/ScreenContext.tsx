import { createContext, use, useMemo, type ReactNode } from 'react'
import { getDevice, type Device, type DeviceSlug } from './devices'

/**
 * What every screen knows about itself: which device it is drawn for, and whether motion runs.
 *
 * `animate: false` is the entire static-snapshot mechanism, inherited from all three original
 * themes. A static screen is not a different build - it is the live one with every animation
 * settled to its resting value instead of played. Keeping it a single flag through one shared
 * context is what makes the two provably agree rather than merely look similar.
 */
export interface ScreenInfo {
  readonly device: Device
  /** Device panel width in pixels. */
  readonly w: number
  /** Device panel height in pixels. */
  readonly h: number
  readonly animate: boolean
}

const ScreenContext = createContext<ScreenInfo | null>(null)

export interface ScreenProviderProps {
  readonly device: DeviceSlug
  readonly animate?: boolean
  readonly children: ReactNode
}

export function ScreenProvider({ device, animate = true, children }: ScreenProviderProps) {
  const value = useMemo<ScreenInfo>(() => {
    const d = getDevice(device)
    return { device: d, w: d.w, h: d.h, animate }
  }, [device, animate])

  return <ScreenContext value={value}>{children}</ScreenContext>
}

export function useScreen(): ScreenInfo {
  const value = use(ScreenContext)
  if (!value) throw new Error('useScreen must be used inside a ScreenProvider')
  return value
}

/**
 * The screen context if there is one, otherwise null.
 *
 * Storybook renders widgets in isolation, where a device is often irrelevant. Widgets that only
 * need the device for animation geometry use this and fall back to inert defaults.
 */
export function useOptionalScreen(): ScreenInfo | null {
  return use(ScreenContext)
}
