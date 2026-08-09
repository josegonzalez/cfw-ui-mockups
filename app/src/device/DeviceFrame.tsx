import type { CSSProperties, ReactNode } from 'react'
import { InputProvider } from '../input/InputProvider'
import { RenderModeProvider, type RenderMode } from '../render/RenderModeProvider'
import { ButtonCluster } from './ButtonCluster'
import { ScreenProvider } from './ScreenContext'
import { getDevice, type DeviceSlug } from './devices'
import './device-frame.css'
import '../anim/anim.css'

export interface DeviceFrameProps {
  readonly device: DeviceSlug
  /**
   * Whether motion plays. `false` renders the same screen with every animation settled to its
   * resting value, which is how a static snapshot is produced - not a separate build.
   */
  readonly animate?: boolean
  /** Whether the keyboard and on-screen buttons are live. */
  readonly interactive?: boolean
  readonly renderMode?: RenderMode
  /** Overrides the device's default viewing zoom. Never visible inside the screen. */
  readonly scale?: number
  /** Hides the bezel and controls, leaving a bare screen. Used by the screenshot specs. */
  readonly bare?: boolean
  readonly children: ReactNode
}

/**
 * The device shell: bezel, screen, and controller.
 *
 * Also the composition root for a screen. Device dimensions, motion, input and render mode all
 * enter here, which is what lets a screen be rendered live, static, or in fallback mode without
 * any of its own code changing.
 */
export function DeviceFrame({
  device,
  animate = true,
  interactive = true,
  renderMode = 'web',
  scale,
  bare = false,
  children,
}: DeviceFrameProps) {
  const info = getDevice(device)

  const viewportStyle = {
    '--screen-w': info.w,
    '--screen-h': info.h,
    '--scale': scale ?? info.viewScale,
  } as CSSProperties

  const screen = (
    <div className="device__screen">
      <div className="screen" data-screen={device}>
        {children}
      </div>
    </div>
  )

  return (
    <RenderModeProvider mode={renderMode}>
      <ScreenProvider device={device} animate={animate}>
        <InputProvider enabled={interactive}>
          {bare ? (
            screen
          ) : (
            <div className="device-viewport" style={viewportStyle}>
              <div className="device">
                {screen}
                <ButtonCluster />
              </div>
            </div>
          )}
        </InputProvider>
      </ScreenProvider>
    </RenderModeProvider>
  )
}
