/**
 * PORTING NOTES
 * CFW: Elementerial, an EmulationStation theme by mluizvitor
 * Devices: rg35xx, rg-cubexx, rg351m, rg552
 * Source: settings/display/view-system.xml
 * Mode: reproduce
 *
 * Layout:
 *   - Full-bleed system backdrop behind a masked scrim.
 *   - A horizontal logo carousel, wider than the screen so it bleeds off both edges.
 *   - System name in H1 bold uppercase, game count beneath it.
 * Focus & selection:
 *   - The strip slides; the selected cell stays put. The selected logo grows 1.4x and
 *     brightens from the 0.5 resting opacity.
 * Buttons:
 *   - Left/Right: change system. A: open its game list. Start: menu.
 * Transitions:
 *   - Strip slides 500ms on easeOutQuint. The incoming backdrop fades in over 1000ms easeOut
 *     while the outgoing one fades out over 500ms on top of it. The game count runs its own
 *     three-part fade: out 150ms, swap, in 300ms.
 */
import { useEffect, useState } from 'react'
import { Carousel } from '../../../widgets/Carousel'
import { Scrim } from '../../../widgets/Scrim'
import { place } from '../../../layout/box'
import { scrimMask, systemBackdrop, systemLogo } from '../assets'
import { SYSTEMS } from '../library'
import type { ElementerialLayout } from '../layout'

/** The engine's own three-part info animation, in milliseconds. */
export const INFO_TIMING = { out: 150, delay: 300, in: 300 } as const

type InfoPhase = 'in' | 'leaving' | 'pending'

/**
 * The game count's fade cycle.
 *
 * It is not one of the cross-fading extras: the engine fades it out, swaps the text while it is
 * invisible, waits, then fades it back in. Returns the text to show and the state class for it.
 *
 * The two waits get an effect each rather than sharing one. A single effect covering both would
 * have to depend on the phase, and the first timer firing changes the phase - which tears the
 * effect down and cancels the second timer, stranding the line invisible forever.
 */
function useInfoCycle(text: string, animate: boolean) {
  const [state, setState] = useState({ shown: text, target: text, phase: 'in' as InfoPhase })

  // Adjusted during render rather than in an effect: the new text is available now, and a
  // cascading render just to notice it would show one frame of the old value at full opacity.
  if (animate && text !== state.target) {
    setState({ shown: state.shown, target: text, phase: 'leaving' })
  }

  useEffect(() => {
    if (state.phase !== 'leaving') return
    const id = setTimeout(
      () => setState((prev) => ({ ...prev, shown: prev.target, phase: 'pending' })),
      INFO_TIMING.out,
    )
    return () => clearTimeout(id)
  }, [state.phase])

  useEffect(() => {
    if (state.phase !== 'pending') return
    const id = setTimeout(
      () => setState((prev) => ({ ...prev, phase: 'in' })),
      INFO_TIMING.delay,
    )
    return () => clearTimeout(id)
  }, [state.phase])

  if (!animate) return { text, className: 'el-system-info' }
  return {
    text: state.shown,
    className: state.phase === 'in' ? 'el-system-info' : `el-system-info is-${state.phase}`,
  }
}

export interface SystemViewProps {
  readonly layout: ElementerialLayout
  readonly index: number
  /** The system being faded out, if a change is in flight. */
  readonly outgoing?: number | undefined
  readonly animate: boolean
}

export function SystemView({ layout, index, outgoing, animate }: SystemViewProps) {
  const system = SYSTEMS[index]!
  const previous = outgoing != null ? SYSTEMS[outgoing] : undefined
  const cover = layout.system.cover
  const mask = scrimMask(layout.ratio, 'carousel')
  const info = useInfoCycle(`${system.count} GAMES`, animate)

  return (
    <>
      {previous ? (
        <img
          className="el-cover el-cover--out is-fading"
          src={systemBackdrop(previous.theme)}
          alt=""
          style={{ ...place(cover), zIndex: -9 }}
        />
      ) : null}

      <img
        // Keyed on the system so a change remounts it and replays the fade, which is what the
        // engine does when it restarts the storyboard.
        key={animate ? system.theme : 'static'}
        className={animate ? 'el-cover is-animated' : 'el-cover'}
        src={systemBackdrop(system.theme)}
        alt=""
        style={{ ...place(cover), zIndex: -9 }}
      />

      <Scrim
        box={{ left: 0, top: 0, width: layout.w, height: layout.h }}
        mode={mask ? 'mask' : 'wash'}
        color="var(--bgColor)"
        src={mask ?? undefined}
        z={-7}
      />

      <Carousel
        className="el-carousel"
        itemClassName="el-logo"
        box={layout.system.carousel}
        items={SYSTEMS.map((s) => ({ key: s.theme, src: systemLogo(s.theme), alt: s.fullName }))}
        selectedIndex={index}
        pitch={layout.system.carousel.pitch}
        itemWidth={layout.system.carousel.logoW}
        itemHeight={layout.system.carousel.logoH}
        selectedLeft={layout.system.carousel.selTopLeft[0]}
        selectedTop={layout.system.carousel.selTopLeft[1]}
        selectedScale={layout.system.carousel.scale}
        restOpacity={0.5}
        transitionMs={animate ? 500 : 0}
        easing="easeOutQuint"
        z={10}
      />

      {previous ? (
        <div
          className="el-system-name el-system-name--out is-fading"
          style={{
            ...place({
              left: layout.system.systemName.left,
              top: layout.system.systemName.top,
              width: layout.system.systemName.width,
              height: layout.system.systemName.font * 1.2,
              font: layout.system.systemName.font,
            }),
            zIndex: 15,
          }}
        >
          {previous.fullName}
        </div>
      ) : null}

      <div
        className="el-system-name"
        style={{
          ...place({
            left: layout.system.systemName.left,
            top: layout.system.systemName.top,
            width: layout.system.systemName.width,
            height: layout.system.systemName.font * 1.2,
            font: layout.system.systemName.font,
          }),
          zIndex: 15,
        }}
      >
        {system.fullName}
      </div>

      <div
        className={info.className}
        style={{
          ...place({
            left: layout.system.systemInfo.left,
            top: layout.system.systemInfo.top,
            width: layout.system.systemInfo.width,
            height: layout.system.systemInfo.font * 1.2,
            font: layout.system.systemInfo.font,
          }),
          zIndex: 15,
        }}
      >
        {info.text}
      </div>
    </>
  )
}
