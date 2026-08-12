import type { CSSProperties, ReactNode } from 'react'
import { InputProvider } from '../input/InputProvider'
import { RenderModeProvider, type RenderMode } from '../render/RenderModeProvider'
import { ButtonCluster, Grip } from './ButtonCluster'
import { ScreenProvider } from './ScreenContext'
import { useViewOverrides } from './ViewOverrides'
import { chinHeight, getDevice, gripWidth, radiusCss, type DeviceSlug } from './devices'
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
  animate,
  interactive = true,
  renderMode,
  scale,
  bare = false,
  children,
}: DeviceFrameProps) {
  /*
   * A prop wins over a URL override, which wins over the default. That ordering is what lets the
   * settle invariant work: a static route sets `animate={false}` itself and ignores the override,
   * while an interactive route sets nothing and takes it.
   */
  const overrides = useViewOverrides()
  const motion = animate ?? overrides.animate ?? true
  const mode = renderMode ?? overrides.renderMode ?? 'web'

  const info = getDevice(device)
  const shell = info.shell

  // The shell is data, not a per-device stylesheet: ten devices would otherwise be ten blocks
  // of nearly identical CSS, and adding an eleventh would mean writing another one.
  const viewportStyle = {
    '--screen-w': info.w,
    '--screen-h': info.h,
    '--scale': scale ?? info.viewScale,
    '--bezel-top': `${shell.bezel.top}px`,
    '--bezel-side': `${shell.bezel.side}px`,
    '--bezel-bottom': `${shell.bezel.bottom}px`,
    '--controls-h': `${chinHeight(shell)}px`,
    '--control-scale': shell.layout === 'chin' ? shell.controlScale : 1,
    '--grip-w': `${gripWidth(shell, info.w)}px`,
    '--body-radius': radiusCss(shell),
    '--body-a': shell.body[0],
    '--body-b': shell.body[1],
    '--body-ink': shell.ink ?? '#8b8d93',
  } as CSSProperties

  const screen = (
    <div className="device__screen">
      <div className="screen" data-screen={device}>
        {children}
      </div>
    </div>
  )

  return (
    <RenderModeProvider mode={mode}>
      <ScreenProvider device={device} animate={motion}>
        <InputProvider enabled={interactive}>
          {bare ? (
            screen
          ) : (
            <div className="device-viewport" style={viewportStyle} data-device={device}>
              <div className="device" data-layout={shell.layout}>
                {shell.layout === 'flanking' ? (
                  <>
                    <Grip side="left" shell={shell} />
                    {screen}
                    <Grip side="right" shell={shell} />
                  </>
                ) : (
                  <>
                    {screen}
                    <ButtonCluster shell={shell} />
                  </>
                )}
              </div>
            </div>
          )}
        </InputProvider>
      </ScreenProvider>
    </RenderModeProvider>
  )
}
