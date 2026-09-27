import type { ReactNode } from 'react'
import { useInput } from '../input/InputProvider'
import type { AuxKind, ChinShell, ClamshellShell, FlankingShell } from './devices'
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
function Stick({ ring }: { ring?: 'rgb' | 'light' | undefined }) {
  return (
    <div className={ring ? `stick stick--ring-${ring}` : 'stick'} aria-hidden="true">
      <div className="stick__cap" />
    </div>
  )
}

/** A control with its name printed on the body beneath it. */
function Labelled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="labelled">
      {children}
      <span className="labelled__text" aria-hidden="true">
        {label}
      </span>
    </span>
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

/** One grip's small buttons. Each landscape body arranges these differently. */
function Aux({ kind }: { kind: AuxKind }) {
  switch (kind) {
    case 'none':
      return null
    case 'function':
      return <ClusterButton button="menu" className="fn-button" label="Menu" />
    case 'select':
    case 'start':
      return <ClusterButton button={kind} className="aux-button" label={kind} />
    case 'pair':
      return (
        <div className="device__meta">
          <ClusterButton button="select" className="pill pill--grip" label="Select" />
          <ClusterButton button="start" className="pill pill--grip" label="Start" />
        </div>
      )
    case 'round-pair':
      return (
        <div className="aux-duo">
          <ClusterButton button="select" className="aux-button" label="select" />
          <ClusterButton button="start" className="aux-button" label="start" />
        </div>
      )
    case 'menu-pair':
      return (
        <div className="aux-duo">
          <ClusterButton button="menu" className="aux-button" label="menu" />
          {/* Moulding only: the input map has no button for this key. */}
          <span className="aux-button aux-button--inert" aria-hidden="true" />
        </div>
      )
  }
}

/**
 * One side of a landscape body.
 *
 * Controls are stacked down the grip and sized from its width, so the whole side stays in
 * proportion on any panel - which is what the chin layout needs `controlScale` for. A grip has
 * its own width to measure against; a chin only has the panel's.
 */
export function Grip({
  side,
  shell,
}: {
  side: 'left' | 'right'
  shell: FlankingShell | ClamshellShell
}) {
  const left = side === 'left'
  const auxTop = shell.aux.position === 'top'
  const kind = left ? shell.aux.left : shell.aux.right

  return (
    <div className={`grip grip--${side}`} data-aux={shell.aux.position}>
      <ClusterButton
        button={left ? 'l' : 'r'}
        className="shoulder shoulder--grip"
        label={left ? 'L' : 'R'}
      />

      {/* The pad is seated in a round plate only on the bodies whose photographs show one. */}
      <div className="grip__primary">{left ? <Dpad disc={!auxTop} /> : <Faces />}</div>

      {shell.sticks === 2 ? (
        <div className="grip__stick">
          <Stick ring={shell.stickRing} />
        </div>
      ) : null}

      {kind === 'none' ? null : (
        <div className="grip__aux" data-kind={kind}>
          <Aux kind={kind} />
        </div>
      )}
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
        <div className="device__shoulders">
          <ClusterButton button="l" className="shoulder" label="L" />
          <ClusterButton button="r" className="shoulder" label="R" />
        </div>

        <Dpad />

        {/*
          Labels are printed on the body beneath each button rather than set inside it, which is
          what the hardware does - and what keeps the cluster narrow enough to fit the body once
          the controls are scaled up. Text inside the pills is what pushed the face buttons off
          the edge of the RG35XX.
        */}
        <div className="device__centre">
          {shell.menuButton ? (
            <Labelled label="MENU">
              <ClusterButton button="menu" className="menu-button" label="Menu" />
            </Labelled>
          ) : null}
          <div className="device__meta">
            <Labelled label="SELECT">
              <ClusterButton button="select" className="pill" label="Select" />
            </Labelled>
            <Labelled label="START">
              <ClusterButton button="start" className="pill" label="Start" />
            </Labelled>
          </div>
        </div>

        <Faces />

        {shell.sticks === 2 ? (
          <div className="device__sticks">
            <Stick ring={shell.stickRing} />
            <Stick ring={shell.stickRing} />
          </div>
        ) : null}
      </div>

      {/*
        Moulded into the body rather than a control, so it takes no button - and a sibling of
        the cluster rather than a child, because it belongs to the empty plastic below it.
      */}
      {shell.speakerGrille ? <div className="speaker" aria-hidden="true" /> : null}
    </div>
  )
}
