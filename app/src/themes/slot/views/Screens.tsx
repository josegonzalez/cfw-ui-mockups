/**
 * PORTING NOTES
 * CFW: slot (a GBA-only frontend for the Anbernic RG SP)
 * Devices: rg-sp (720x480)
 * Source: crates/slot-ui/src/{shelf,slot_chrome,hud,polaroids,clock}.rs, slot/src/app.rs
 * Mode: reproduce
 *
 * slot's seven phases, which are also its seven screens.
 *
 * Layout:
 *   - Shelf: carts at a 240 pitch, the selection centred, neighbours at 0.78 scale and 0.55
 *     alpha, all of them standing on a row at y = (480 + 135) / 2.
 *   - Insert: one `seat` progress drives the cart's y, the neighbours parting, the veil, the
 *     panel rising and the alert fading.
 *   - Playing: the panel with the lcd3x mask, and the HUD plate over it when a control moved.
 *   - Polaroids: 240x160 thumbnails, a dot per slot, and a three-key legend.
 * Focus & selection:
 *   - Only the shelf has a cursor, and selection is position rather than highlight.
 * Buttons:
 *   - Shelf: L/R browse, A plays (tap resumes, hold starts clean). In game the map is a set
 *     of chords - see `docs/themes/slot/reference/source-notes.md`.
 * Transitions:
 *   - The shelf spring and the cart travel, both in `motion.ts`, neither a timeline.
 */
import { cartFace, cartShadow, thumbnail } from '../art'
import {
  ALERT_PX,
  BAND_Y,
  CART,
  CART_X,
  CENTER,
  CLOCK,
  FOOTER_MARGIN,
  FOOTER_Y,
  HINT,
  HUD,
  HUD_BAR_Y,
  INK,
  LABEL_MAX_W,
  OUT,
  PHOTO,
  PLATE_PX,
  REST_Y,
  SCRIM,
  SHELF,
  SWITCHER,
  SWITCHER_LEGEND,
  BRAND,
} from '../layout'
import { CARTS, STATES, cleanLabel, hudIcon, type HudKind } from '../library'
import { cartY, TIMING } from '../motion'
import { Icon } from './Icon'
import { EmptySlot, Hint, SlotBack, SlotFront, Text, hintWidth } from './parts'

export interface ScreenProps {
  readonly phase: string
  /** Shelf scroll in cart units. Integral when settled; fractional while the spring runs. */
  readonly scroll: number
  readonly selected: number
  /** Insert/eject progress, 0 at the shelf and 1 seated. */
  readonly seat: number
  readonly hud: HudKind | null
  readonly hudValue: number
  readonly switcherSlot: number
  readonly clockField: number
  readonly wallpaper: boolean
  /** Refusal shake, in pixels, applied to the whole screen as the compositor does it. */
  readonly shake: number
}

/* ---- the shelf ---------------------------------------------------------- */

/**
 * One cart on the row.
 *
 * Scale and alpha come from the distance to the selection, and the transform origin is the foot
 * so a shrinking cart stays standing on the row rather than floating up off it.
 */
function ShelfCart({ index, scroll, part }: { index: number; scroll: number; part: number }) {
  const cart = CARTS[index]
  if (!cart) return null

  const offset = index - scroll
  const distance = Math.abs(offset)
  if (distance > SHELF.slots) return null

  const t = Math.min(1, distance)
  const scale = 1 + (SHELF.sideScale - 1) * t
  const alpha = 1 + (SHELF.sideAlpha - 1) * t

  /* The neighbours are pushed aside as the chosen cart goes in, away from the centre. */
  const pushed = offset === 0 ? 0 : Math.sign(offset) * part
  const x = CENTER.x + offset * SHELF.pitch + pushed - CART.w / 2

  const box = {
    left: x,
    top: SHELF.footY - CART.h,
    width: CART.w,
    height: CART.h,
    transform: `scale(${scale.toFixed(4)})`,
  }

  return (
    <>
      {/* The shadow is opaque and only the face above it dims, so a side cart reads as a cart in
          shadow rather than one you can see through - over a wallpaper a translucent face is a
          ghost. Dimming both would let the ground come through the pair of them. */}
      {distance > 0 ? (
        <img className="slot-cart__shadow" style={box} src={cartShadow()} alt="" />
      ) : null}
      <img className="slot-cart" style={{ ...box, opacity: alpha }} src={cartFace(cart)} alt="" />
    </>
  )
}

function Shelf({
  scroll,
  part,
  skip,
}: {
  scroll: number
  part: number
  /* The inserting cart is drawn by the chrome, between the two halves of the slot, so the shelf
     must not draw it a second time on the row it came from. */
  skip?: number | undefined
}) {
  const first = Math.floor(scroll) - SHELF.slots
  const last = Math.ceil(scroll) + SHELF.slots
  const indices: number[] = []
  for (let i = first; i <= last; i++) {
    if (i >= 0 && i < CARTS.length && i !== skip) indices.push(i)
  }

  return (
    <>
      {indices.map((i) => (
        <ShelfCart key={i} index={i} scroll={scroll} part={part} />
      ))}
    </>
  )
}

/* ---- the footer --------------------------------------------------------- */

/** The brand on the left of the mouth band, the one hint on the right. */
function Footer({ hint }: { hint?: readonly [string, string] | undefined }) {
  return (
    <>
      <Text x={FOOTER_MARGIN} y={FOOTER_Y} h={HINT.h} px={PLATE_PX.title} colour={INK.text}>
        {BRAND}
      </Text>
      {hint ? (
        <Hint
          x={OUT.w - FOOTER_MARGIN - hintWidth(hint[1])}
          y={FOOTER_Y}
          keyName={hint[0]}
          label={hint[1]}
        />
      ) : null}
    </>
  )
}

/* ---- the panel ---------------------------------------------------------- */

/**
 * The game layer.
 *
 * `Draw::Game` carries no geometry in the source because the pass owns its own rect: the power-on
 * squeezes the picture in from nothing rather than fading it, so the height is the animated value
 * and the width follows. The lcd3x mask and the blue-light grade ride on top of it.
 */
function Panel({ power, blueLight }: { power: number; blueLight: number }) {
  if (power <= 0) return null

  const h = Math.round(OUT.h * power)
  const y = Math.round((OUT.h - h) / 2)

  return (
    <div className="slot-panel" style={{ left: 0, top: y, width: OUT.w, height: h }}>
      <img className="slot-panel__picture" src={thumbnail('Pokemon Emerald', 0)} alt="" />
      <div className="slot-panel__mask" />
      {blueLight > 0 ? (
        <div className="slot-panel__grade" style={{ opacity: blueLight * 0.6 }} />
      ) : null}
    </div>
  )
}

/* ---- the HUD ------------------------------------------------------------ */

function Hud({ kind, value }: { kind: HudKind; value: number }) {
  const w = HUD.barW + HUD.iconPx + HUD.iconGap + HUD.badgeMargin * 2
  const x = CENTER.x - w / 2
  const y = OUT.h - HUD.plateH - 40

  return (
    <>
      <div className="slot-plate" style={{ left: x, top: y, width: w, height: HUD.plateH }} />
      <Icon
        name={hudIcon(kind, value)}
        x={x + HUD.badgeMargin}
        y={y + (HUD.plateH - HUD.iconPx) / 2}
        size={HUD.iconPx}
        colour={HUD.ink}
      />
      <div
        className="slot-bar"
        style={{
          left: x + HUD.badgeMargin + HUD.iconPx + HUD.iconGap,
          top: y + HUD_BAR_Y,
          width: HUD.barW,
          height: HUD.barH,
        }}
      >
        <div className="slot-bar__fill" style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
    </>
  )
}

/* ---- the switcher ------------------------------------------------------- */

function Polaroids({ slot }: { slot: number }) {
  const total = STATES.length
  const spread = PHOTO.w + SWITCHER.margin
  const legendW = SWITCHER_LEGEND.reduce((sum, [, label]) => sum + hintWidth(label) + 24, 0)

  return (
    <>
      {STATES.map((state, i) => {
        const offset = i - slot
        if (Math.abs(offset) > 1) return null
        const x = CENTER.x + offset * spread - PHOTO.w / 2
        const y = CENTER.y - PHOTO.h / 2 - 20
        const dim = offset === 0 ? 1 : 0.5

        return state ? (
          <img
            key={i}
            className="slot-photo"
            style={{ left: x, top: y, width: PHOTO.w, height: PHOTO.h, opacity: dim }}
            src={thumbnail('Pokemon Emerald', i)}
            alt=""
          />
        ) : (
          <div
            key={i}
            className="slot-photo slot-photo--blank"
            style={{ left: x, top: y, width: PHOTO.w, height: PHOTO.h, opacity: dim }}
          />
        )
      })}

      {/* One dot per slot, the current one lit. */}
      {STATES.map((_, i) => (
        <div
          key={i}
          className="slot-dot"
          style={{
            left:
              CENTER.x -
              ((total - 1) * (SWITCHER.dot + SWITCHER.dotGap)) / 2 +
              i * (SWITCHER.dot + SWITCHER.dotGap) -
              SWITCHER.dot / 2,
            top: CENTER.y + PHOTO.h / 2 + 6,
            width: SWITCHER.dot,
            height: SWITCHER.dot,
            opacity: i === slot ? 1 : SWITCHER.dotDim,
          }}
        />
      ))}

      {
        SWITCHER_LEGEND.reduce<{ nodes: React.ReactNode[]; x: number }>(
          (acc, [key, label]) => {
            acc.nodes.push(
              <Hint key={key} x={acc.x} y={FOOTER_Y} keyName={key} label={label} halo />,
            )
            return { nodes: acc.nodes, x: acc.x + hintWidth(label) + 24 }
          },
          { nodes: [], x: CENTER.x - legendW / 2 },
        ).nodes
      }
    </>
  )
}

/* ---- the clock ---------------------------------------------------------- */

function ClockPicker({ field }: { field: number }) {
  const values = ['2026', '08', '12', '15', '42']
  const total = CLOCK.cells.reduce((sum, c) => sum + c, 0)
  let x = CENTER.x - total / 2
  const y = CENTER.y - CLOCK.h / 2
  const nodes: React.ReactNode[] = []

  CLOCK.cells.forEach((cell, i) => {
    const fieldIndex = (CLOCK.fieldCell as readonly number[]).indexOf(i)
    const isField = fieldIndex >= 0
    const text = isField ? (values[fieldIndex] ?? '') : i === 1 ? '-' : i === 3 ? '-' : ':'

    nodes.push(
      <Text key={i} x={x} y={y} w={cell} h={CLOCK.h} px={CLOCK.px} colour={INK.text} align="center">
        {text}
      </Text>,
    )
    if (isField && fieldIndex === field) {
      nodes.push(
        <div
          key={`caret-${i}`}
          className="slot-caret"
          style={{
            left: x + 4,
            top: y + CLOCK.h + CLOCK.caretGap,
            width: cell - 8,
            height: CLOCK.caretH,
          }}
        />,
      )
    }
    x += cell
  })

  return <>{nodes}</>
}

/* ---- the screen --------------------------------------------------------- */

export function Screen(props: ScreenProps) {
  const { phase, scroll, seat, hud, hudValue, switcherSlot, clockField, wallpaper } = props

  /* One progress drives all of it, which is why these are derived rather than stored. */
  const inserting = phase === 'inserting' || phase === 'ejecting'
  const part = inserting ? SHELF.part * seat : 0
  const dim = inserting ? seat : phase === 'playing' ? 1 : 0
  const power =
    phase === 'playing' ? 1 : phase === 'inserting' ? Math.max(0, (seat - 0.62) / 0.38) : 0

  return (
    <>
      {wallpaper ? (
        <>
          <img className="slot-wallpaper" src={thumbnail('wallpaper', 7)} alt="" />
          <div className="slot-scrim" style={{ opacity: SCRIM }} />
        </>
      ) : null}

      {phase === 'doze' ? null : phase === 'set-clock' ? (
        <>
          <EmptySlot />
          <ClockPicker field={clockField} />
          <Footer hint={['A', 'set the clock']} />
        </>
      ) : phase === 'polaroids' ? (
        <>
          <Panel power={1} blueLight={0} />
          <div className="slot-dim" style={{ opacity: 0.72 }} />
          <Polaroids slot={switcherSlot} />
        </>
      ) : phase === 'playing' ? (
        <>
          <Panel power={power} blueLight={0} />
          {hud ? <Hud kind={hud} value={hudValue} /> : null}
        </>
      ) : inserting ? (
        <>
          <Shelf scroll={scroll} part={part} skip={props.selected} />
          {dim > 0 ? <div className="slot-dim" style={{ opacity: dim * 0.85 }} /> : null}
          <SlotBack />
          <img
            className="slot-cart"
            style={{
              left: CART_X,
              top: cartY(seat),
              width: CART.w,
              height: CART.h,
            }}
            src={cartFace(CARTS[props.selected] ?? CARTS[0]!)}
            alt=""
          />
          <Panel power={power} blueLight={0} />
          <SlotFront />
        </>
      ) : (
        <>
          <Shelf scroll={scroll} part={0} />
          <EmptySlot />
          <Footer hint={['A', 'play']} />
        </>
      )}
    </>
  )
}

/** The title of the selected cart, for the viewer bar and the tests. */
export function selectedTitle(index: number): string {
  const cart = CARTS[Math.min(index, CARTS.length - 1)]
  return cart ? cleanLabel(cart.file) : ''
}

export { ALERT_PX, BAND_Y, REST_Y, TIMING, LABEL_MAX_W }
