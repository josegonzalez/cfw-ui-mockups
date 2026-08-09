import { useInput } from '../input/InputProvider'
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

export function ButtonCluster() {
  return (
    <div className="device__controls">
      <div className="device__shoulders">
        <ClusterButton button="l" className="shoulder" label="L" />
        <ClusterButton button="r" className="shoulder" label="R" />
      </div>

      <div className="dpad">
        <ClusterButton button="up" className="dpad__btn" />
        <ClusterButton button="down" className="dpad__btn" />
        <ClusterButton button="left" className="dpad__btn" />
        <ClusterButton button="right" className="dpad__btn" />
        <div className="dpad__center" />
      </div>

      <div className="device__meta">
        <ClusterButton button="select" className="pill" label="SELECT" />
        <ClusterButton button="start" className="pill" label="START" />
      </div>

      <div className="faces">
        <ClusterButton button="x" className="face" label="X" />
        <ClusterButton button="y" className="face" label="Y" />
        <ClusterButton button="a" className="face" label="A" />
        <ClusterButton button="b" className="face" label="B" />
      </div>
    </div>
  )
}
