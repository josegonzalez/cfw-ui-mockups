import { useInput } from '../input/InputProvider'
import type { ChinShell, FlankingShell } from './devices'
import type { Button } from '../input/keymap'

/**
 * The on-screen controller.
 *
 * Every button dispatches through the same input layer the keyboard uses, so a screen is fully
 * usable without a keyboard and both routes exercise identical code.
 *
 * `data-btn` is structural here, not decorative - the stylesheet positions the D-pad arms by
 * attribute selector. This is chrome rather than a widget, so that is allowed.
 */
function ClusterButton({
  button,
  className,
  label,
}: {
  button: Button
  className: string
  label?: string
}) {
  const input = useInput()
  const pressed = input.flashing.has(button) || input.pressed.has(button)

  return (
    <div
      data-btn={button}
      className={pressed ? `${className} is-pressed` : className}
      onPointerDown={() => input.press(button)}
      onPointerUp={() => input.release(button)}
      onPointerLeave={() => input.release(button)}
      role="button"
      tabIndex={-1}
      aria-label={label ?? button}
    >
      {label}
    </div>
  )
}

/**
 * An analog stick.
 *
 * Decorative: the input layer has no axis events, and no mockup set reads one. It is here
 * because sticks and their absence are the clearest way to tell these devices apart - an RG552
 * drawn without them looks like an RG35XX.
 *
 * `ring` draws the lit collar some devices make a feature of, and it is the single most
 * recognisable thing on the CubeXX's face.
 */
function Stick({ ring }: { ring?: 'rgb' | undefined }) {
  return (
    <div className={ring ? `stick stick--ring-${ring}` : 'stick'} aria-hidden="true">
      <div className="stick__cap" />
    </div>
  )
}

/** The four-way pad. `disc` seats the cross in a round plate, which is how the CubeXX draws it. */
function Dpad({ disc = false }: { disc?: boolean }) {
  return (
    <div className={disc ? 'dpad dpad--disc' : 'dpad'}>
      <ClusterButton button="up" className="dpad__btn" />
      <ClusterButton button="down" className="dpad__btn" />
      <ClusterButton button="left" className="dpad__btn" />
      <ClusterButton button="right" className="dpad__btn" />
      <div className="dpad__center" />
    </div>
  )
}

/** The face diamond: X top, Y left, A right, B bottom. */
function Faces() {
  return (
    <div className="faces">
      <ClusterButton button="x" className="face" label="X" />
      <ClusterButton button="y" className="face" label="Y" />
      <ClusterButton button="a" className="face" label="A" />
      <ClusterButton button="b" className="face" label="B" />
    </div>
  )
}

/**
 * One side of a landscape body.
 *
 * Controls are stacked down the grip and sized from its width, so the whole side stays in
 * proportion on any panel - which is what the chin layout needs `controlScale` for. A grip has
 * its own width to measure against; a chin only has the panel's.
 */
export function Grip({ side, shell }: { side: 'left' | 'right'; shell: FlankingShell }) {
  const left = side === 'left'

  return (
    <div className={`grip grip--${side}`}>
      <ClusterButton
        button={left ? 'l' : 'r'}
        className="shoulder shoulder--grip"
        label={left ? 'L' : 'R'}
      />

      <div className="grip__primary">{left ? <Dpad disc /> : <Faces />}</div>

      {shell.sticks === 2 ? (
        <div className="grip__stick">
          <Stick ring={shell.stickRing} />
        </div>
      ) : null}

      <div className="grip__aux">
        {left ? (
          shell.functionButton ? (
            <ClusterButton button="menu" className="fn-button" label="" />
          ) : null
        ) : (
          <div className="device__meta">
            <ClusterButton button="select" className="pill pill--grip" label="" />
            <ClusterButton button="start" className="pill pill--grip" label="" />
          </div>
        )}
      </div>
    </div>
  )
}

export function ButtonCluster({ shell }: { shell: ChinShell }) {
  return (
    /*
     * Two elements, for the same reason the device frame itself needs two: `transform` does not
     * change layout, so the chin reserves the scaled height and the cluster draws inside it.
     * Without the split, a cluster scaled below 1 lays out taller than its chin and squeezes the
     * screen above it, and one scaled above 1 spills out of the body.
     */
    <div className="device__chin">
      <div className="device__controls" data-sticks={shell.sticks || undefined}>
        {shell.triggers ? (
          <div className="device__shoulders device__shoulders--upper">
            <ClusterButton button="l" className="shoulder shoulder--trigger" label="L2" />
            <ClusterButton button="r" className="shoulder shoulder--trigger" label="R2" />
          </div>
        ) : null}

        <div className="device__shoulders">
          <ClusterButton button="l" className="shoulder" label="L" />
          <ClusterButton button="r" className="shoulder" label="R" />
        </div>

        <Dpad />

        <div className="device__meta">
          <ClusterButton button="select" className="pill" label="SELECT" />
          <ClusterButton button="start" className="pill" label="START" />
        </div>

        <Faces />

        {shell.sticks === 2 ? (
          <div className="device__sticks">
            <Stick ring={shell.stickRing} />
            <Stick ring={shell.stickRing} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
