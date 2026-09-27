import type { ReactNode } from 'react'
import { gamepad } from '../assets'
import { alpha } from '../palette'
import type { SymbolName } from '../symbols'
import { LINE, Sym, Tinted, Txt, shadow, useNeo, type Neo } from './parts'

/**
 * The signed-out pair every account tab draws the same way - RetroAchievements, NeoSync,
 * ScreenScraper and RomM: a login card beside an info box, 64.r below the top
 * (`ra_content.dart:406-430`, `auth_form.dart`, `scraper_login_screen.dart`,
 * `romm_connect_content.dart`). These are text-heavy panels that wrap, so they lay out in the
 * browser's flow inside their measured boxes rather than line by line.
 */

const glow = (neo: Neo, a: number, blur: number, spread: number) =>
  `0 0 ${2 * (0.57735 * neo.u.r(blur) + neo.u.px(0.5))}px ${neo.u.r(spread)}px ${alpha(neo.p.primary, a)}`

/** The row the two cards sit in: centred, or from the left padding as NeoSync's is. */
export function FormRow({ centre, children }: { centre: boolean; children: ReactNode }) {
  const neo = useNeo()
  const { u } = neo
  return (
    <div
      style={{
        position: 'absolute',
        left: u.r(12),
        right: u.r(12),
        top: u.r(64),
        display: 'flex',
        justifyContent: centre ? 'center' : 'flex-start',
        alignItems: 'flex-start',
        gap: u.r(16),
        padding: `0 ${u.r(16)}px`,
      }}
    >
      {children}
    </div>
  )
}

/** The login card: padding 16.r, the page colour at 0.25 (NeoSync's is solid), a `primary` 0.2 hairline. */
export function FormCard({ title, solid, children }: { title: string; solid?: boolean; children: ReactNode }) {
  const neo = useNeo()
  const { u, p } = neo
  return (
    <div
      style={{
        width: u.r(260),
        boxSizing: 'border-box',
        padding: u.r(16),
        background: solid ? p.background : alpha(p.background, 0.25),
        borderRadius: u.r(12),
        border: `${u.px(1)}px solid ${alpha(p.primary, 0.2)}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Txt size={u.t(14)} color={p.primary} weight={700} style={{ alignSelf: 'stretch', marginBottom: u.r(12) }}>
        {title}
      </Txt>
      {children}
    </div>
  )
}

/** A text field at rest: its label inside it, the selected one outlined and glowing. */
export function Field({ label, selected, gap = 6, eye }: { label: string; selected: boolean; gap?: number; eye?: boolean }) {
  const neo = useNeo()
  const { u, p } = neo
  return (
    <div
      style={{
        width: u.r(220),
        height: u.r(32),
        flexShrink: 0,
        boxSizing: 'border-box',
        marginBottom: u.r(gap),
        position: 'relative',
        background: alpha(p.onSurface, 0.05),
        borderRadius: u.r(8),
        border: selected ? `${u.r(2)}px solid ${p.primary}` : `${u.r(1)}px solid ${alpha(p.primary, 0.1)}`,
        boxShadow: selected ? glow(neo, 0.35, 6, 1) : undefined,
      }}
    >
      <Txt size={u.t(10)} color={alpha(p.onSurface, 0.7)} style={{ position: 'absolute', left: u.r(12), top: (u.r(32) - u.t(10) * LINE) / 2 - u.r(selected ? 2 : 1) }}>
        {label}
      </Txt>
      {eye && (
        <div style={{ position: 'absolute', right: u.r(8), top: (u.r(32) - u.r(18)) / 2 - u.r(selected ? 2 : 1) }}>
          <Sym name="visibility_rounded" size={u.r(18)} color={alpha(p.onSurface, 0.5)} />
        </div>
      )}
    </div>
  )
}

/** The full-width `primary` button at the foot of every form. */
export function SubmitButton({ label, selected }: { label: string; selected: boolean }) {
  const neo = useNeo()
  const { u, p } = neo
  return (
    <div
      style={{
        alignSelf: 'stretch',
        height: u.r(32),
        flexShrink: 0,
        background: p.primary,
        borderRadius: u.r(8),
        boxShadow: selected ? glow(neo, 0.5, 8, 2) : undefined,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Txt size={u.t(14)} color={p.onPrimary} weight={700}>
        {label}
      </Txt>
    </div>
  )
}

/** A small text link, outlined when it is the selected slot (`auth_form.dart:978-1016`). */
export function LinkRow({ label, selected }: { label: string; selected: boolean }) {
  const neo = useNeo()
  const { u, p } = neo
  return (
    <div
      style={{
        alignSelf: 'stretch',
        height: u.r(24),
        flexShrink: 0,
        marginTop: u.r(6),
        boxSizing: 'border-box',
        border: `${u.r(1)}px solid ${selected ? alpha(p.primary, 0.6) : 'transparent'}`,
        borderRadius: u.r(6),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Txt size={u.t(8)} color={alpha(p.secondary, 0.9)}>
        {label}
      </Txt>
    </div>
  )
}

/** The box beside every form: an icon, a title, a paragraph, three points and where to sign up. */
export function InfoBox({
  icon,
  iconNode,
  title,
  body,
  points,
  footer,
  link,
  after,
  solid,
}: {
  icon?: SymbolName
  iconNode?: ReactNode
  title: string
  body: string
  points: readonly (readonly [SymbolName, string])[]
  footer: string
  link: string
  after?: string
  solid?: boolean
}) {
  const neo = useNeo()
  const { u, p } = neo
  const para = { fontFamily: "'NeoStation Anta'", lineHeight: 1.25, margin: 0 }
  return (
    <div
      style={{
        width: u.r(300),
        flexShrink: 0,
        boxSizing: 'border-box',
        padding: u.r(16),
        background: solid ? p.background : alpha(p.background, 0.25),
        borderRadius: u.r(12),
        border: `${u.px(1)}px solid ${alpha(p.primary, 0.2)}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: u.r(12) }}>
        {iconNode ?? <Sym name={icon!} size={u.r(24)} color={p.primary} />}
        <Txt size={u.t(14)} color={p.primary} weight={700}>
          {title}
        </Txt>
      </div>
      <p style={{ ...para, marginTop: u.r(6), fontSize: u.t(8), color: alpha(p.onSurface, 0.9) }}>{body}</p>
      <div style={{ marginTop: u.r(6) }}>
        {points.map(([ic, text]) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: u.r(8), paddingBottom: u.r(8) }}>
            <Sym name={ic} size={u.r(12)} color={alpha(p.primary, 0.7)} />
            <span style={{ ...para, fontSize: u.t(8), color: alpha(p.onSurface, 0.8) }}>{text}</span>
          </div>
        ))}
      </div>
      <p style={{ ...para, marginTop: u.r(6), fontSize: u.t(8), fontStyle: 'italic', color: alpha(p.onSurface, 0.6) }}>
        {footer}
        <span style={{ color: p.primary, textDecoration: 'underline' }}>{link}</span>
        {after}
      </p>
    </div>
  )
}

/** A `ConfirmActionDialog` (`lib/widgets/confirm_action_dialog.dart`): icon and title in the accent, then Cancel and the action. */
export function ConfirmBox({
  title,
  body,
  confirm,
  icon,
  accent = 'error',
  cancel = 'Cancel',
  info = false,
}: {
  title: string
  body: string
  confirm: string
  icon: SymbolName
  accent?: 'error' | 'primary'
  cancel?: string
  /** An `InfoDialog`: one OK button, no Cancel. */
  info?: boolean
}) {
  const neo = useNeo()
  const { u, p } = neo
  const color = accent === 'error' ? p.error : p.primary
  const on = accent === 'error' ? p.onError : p.onPrimary
  const w = Math.min(u.r(320), u.W - u.r(40) * 2)
  const glyph = (name: string, c: string) => (
    <div style={{ position: 'relative', width: u.r(18), height: u.r(18) }}>
      <Tinted src={gamepad(name)} box={{ left: 0, top: 0, width: u.r(18), height: u.r(18) }} color={c} />
    </div>
  )
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.54)' }} />
      <div
        data-part="confirm"
        style={{
          position: 'absolute',
          left: (u.W - w) / 2,
          top: '50%',
          transform: 'translateY(-50%)',
          width: w,
          boxSizing: 'border-box',
          padding: u.r(24),
          background: p.background,
          borderRadius: u.r(12),
          border: `${u.px(1)}px solid ${alpha(color, 0.3)}`,
          boxShadow: shadow(neo, 'rgba(0,0,0,0.3)', u.r(6), 0, u.r(3)),
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: u.r(8) }}>
          <Sym name={icon} size={u.r(20)} color={color} />
          <Txt size={u.t(14)} color={color} weight={600}>
            {title}
          </Txt>
        </div>
        <p style={{ margin: `${u.r(16)}px 0 0`, fontFamily: "'NeoStation Anta'", fontSize: u.t(11), lineHeight: 1.4, color: alpha(p.onSurface, 0.7) }}>{body}</p>
        <div style={{ marginTop: u.r(24), display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: u.r(8) }}>
          {!info && (
            <div style={{ display: 'flex', alignItems: 'center', gap: u.r(4), padding: `0 ${u.r(8)}px` }}>
              {glyph('Xbox_B_button', alpha(p.onSurface, 0.6))}
              <Txt size={u.t(12)} color={alpha(p.onSurface, 0.6)}>
                {cancel}
              </Txt>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: u.r(4), padding: `${u.r(8)}px ${u.r(16)}px`, background: color, borderRadius: u.r(6) }}>
            {glyph('Xbox_A_button', on)}
            <Txt size={u.t(12)} color={on} weight={600}>
              {confirm}
            </Txt>
          </div>
        </div>
      </div>
    </>
  )
}
