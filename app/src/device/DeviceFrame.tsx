import type { CSSProperties, ReactNode } from 'react'
import { InputProvider } from '../input/InputProvider'
import { RenderModeProvider, type RenderMode } from '../render/RenderModeProvider'
import { ButtonCluster, Grip } from './ButtonCluster'
import { ScreenProvider } from './ScreenContext'
import { useViewOverrides } from './ViewOverrides'
import {
  chinHeight,
  getDevice,
  gripWidth,
  panelCount,
  panelGap,
  radiusCss,
  type DeviceSlug,
} from './devices'
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
 * The moulded parts of a clamshell that are not controls: the lid, the hinge barrel, the base,
 * the recessed well each panel sits in, and the lid's two speaker grilles.
 *
 * Drawn behind the panels and the grips rather than as the body's own background, because a
 * clamshell is two bodies joined by a hinge and one gradient reads as a single slab. Every piece
 * is placed from the same custom properties the frame sizes itself with, so nothing here is a
 * number of its own.
 */
function ClamshellBody() {
  return (
    <div className="clam" aria-hidden="true">
      <div className="clam__lid" />
      <div className="clam__base" />
      <div className="clam__hinge" />
      <div className="clam__well clam__well--top" />
      <div className="clam__well clam__well--bottom" />
      <div className="clam__speaker clam__speaker--left" />
      <div className="clam__speaker clam__speaker--right" />
    </div>
  )
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
  /*
   * Two panels share one `.screen`, stacked with the hinge between them. One element rather than
   * two is what keeps every consumer of `.screen` - the baselines, the compositing guard, the
   * settle comparison - working unchanged on a device that has two.
   */
  const screenH = info.h * panelCount(shell) + panelGap(shell)

  // The shell is data, not a per-device stylesheet: ten devices would otherwise be ten blocks
  // of nearly identical CSS, and adding an eleventh would mean writing another one.
  const viewportStyle = {
    '--screen-w': info.w,
    '--screen-h': screenH,
    '--panel-h': `${info.h}px`,
    '--hinge': `${panelGap(shell)}px`,
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
                ) : shell.layout === 'chin' ? (
                  <>
                    {screen}
                    <ButtonCluster shell={shell} />
                  </>
                ) : shell.layout === 'clamshell' ? (
                  <>
                    <ClamshellBody />
                    <Grip side="left" shell={shell} />
                    {screen}
                    <Grip side="right" shell={shell} />
                  </>
                ) : (
                  /*
                   * A console draws its output to a television, so there is nothing to attach a
                   * cluster to. The buttons its hint pills name are on a controller somewhere off
                   * screen, and drawing one here would be inventing hardware.
                   */
                  screen
                )}
              </div>
            </div>
          )}
        </InputProvider>
      </ScreenProvider>
    </RenderModeProvider>
  )
}
