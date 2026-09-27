/**
 * PORTING NOTES
 * CFW: NeoStation            Devices: odin2-mini, rg40xx
 * Source: misobadev/neostation-frontend d9bece5 - lib/widgets/setup_wizard.dart,
 *         lib/widgets/splash_status_layout.dart, lib/widgets/shimmering_logo.dart,
 *         lib/screens/systems_screen/system_content.dart
 * Mode: reproduce
 *
 * Layout:        The wizard's landscape frame: 16.r padding, a flex-2 card (logo, welcome, a
 *                vertical step indicator scaled down to fit) beside a flex-3 card (the step,
 *                centred in at most 400.w, then the button row). Six steps on Android, five on
 *                Linux. The scan splash centres the logo at 55% of the width or 40% of the height,
 *                whichever is smaller, and hangs a 220.r bar and the status line below it.
 * Focus & selection: No cursor in either. The wizard's buttons are the A and B pills.
 * Buttons:       Wizard: A runs the step's action - Next, Grant Access, Select Folder, Import from
 *                ES-DE, Finish; B skips the optional steps (Permissions, ROM folder, ES-DE, art).
 *                There is no going back. The scan splash takes none; the header over it still does.
 * Transitions:   Steps swap instantly. The splash's glint follows scan progress (250ms easeOut) and
 *                rests at the posed progress in a still; the splash cross-fades to the systems
 *                over 400ms.
 * Notes:         The mockup has no folder picker, ES-DE folder or network. Select Folder picks the
 *                folder at once, Grant Access grants at once, the ES-DE import reports the sample
 *                library, and the art pack catalogue is the offline one - empty, so the step says
 *                it could not be reached and its button reads Finish.
 */
import type { CSSProperties, ReactNode } from 'react'
import { brand } from '../assets'
import { GAMES } from '../library'
import { alpha } from '../palette'
import type { SymbolName } from '../symbols'
import { textWidth } from '../text'
import { userDataPath, wizardSteps, type WizardState } from '../wizard'
import type { State } from '../machine'
import { GamepadControl, LINE, Sym, Txt, controlHeight, controlWidth, motion, useNeo } from './parts'

const GREEN = '#4caf50'
/** `Colors.green[700]`. */
const GREEN_700 = '#388e3c'

/** The real systems the sample library has games for - what a scan of it finds. */
const FOUND = new Set(GAMES.map((g) => g.system)).size

export function SetupWizard({ state, w, press }: { state: State; w: WizardState; press?: ((b: 'a' | 'b') => void) | undefined }) {
  const neo = useNeo()
  const { u, p } = neo
  const steps = wizardSteps(state.platform)
  const step = steps[w.step]!
  const pad = u.r(16)
  const inner = u.W - pad * 2 - u.r(16)
  const leftW = (inner * 2) / 5
  const cardH = u.H - pad * 2

  // The vertical indicator is `FittedBox(scaleDown)` in what the card has left (`:516-521`).
  const titleSize = u.t(14)
  const titleLines = textWidth('Welcome to NeoStation!', titleSize) > leftW - u.r(24) * 2 ? 2 : 1
  const above = u.r(64) + u.r(12) + titleSize * LINE * titleLines + u.r(8) + u.t(10) * LINE + u.r(16)
  const indicatorH = steps.length * u.r(24) + (steps.length - 1) * u.r(18)
  const fit = Math.min(1, (cardH - u.r(24) * 2 - above) / indicatorH)

  return (
    <div data-part="wizard" style={{ position: 'absolute', inset: 0, background: p.background, padding: pad, display: 'flex', gap: u.r(16) }}>
      <div
        style={{
          width: leftW,
          flexShrink: 0,
          boxSizing: 'border-box',
          padding: u.r(24),
          background: alpha(p.surface, 0.1),
          borderRadius: u.r(24),
          border: `${u.r(1)}px solid ${alpha(p.primary, 0.1)}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <img alt="" src={brand('logo_transparent.png')} style={{ width: u.r(64), height: u.r(64), objectFit: 'contain' }} />
        <Para size={titleSize} color={p.onSurface} weight={700} style={{ marginTop: u.r(12) }}>
          Welcome to NeoStation!
        </Para>
        <Txt size={u.t(10)} color={alpha(p.onSurface, 0.7)} style={{ marginTop: u.r(8) }}>
          {"Let's get you set up"}
        </Txt>
        <div style={{ marginTop: u.r(16), height: indicatorH * fit, display: 'flex', justifyContent: 'center' }}>
          <div style={{ transform: `scale(${fit})`, transformOrigin: 'top center' }}>
            {steps.map((_, i) => {
              const done = i < w.step
              const on = done || i === w.step
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    style={{
                      width: u.r(24),
                      height: u.r(24),
                      boxSizing: 'border-box',
                      borderRadius: '50%',
                      background: on ? p.primary : 'transparent',
                      border: `${u.r(2)}px solid ${on ? p.primary : alpha(p.primary, 0.3)}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {done ? (
                      <Sym name="check_rounded" size={u.r(14)} color="#ffffff" />
                    ) : (
                      <Txt size={u.t(10)} color={i === w.step ? '#ffffff' : alpha(p.primary, 0.5)} weight={700}>
                        {String(i + 1)}
                      </Txt>
                    )}
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{ width: u.r(2), height: u.r(18), background: done ? p.primary : alpha(p.primary, 0.2) }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div
        style={{
          flex: 1,
          boxSizing: 'border-box',
          padding: u.r(16),
          background: alpha(p.surface, 0.05),
          borderRadius: u.r(24),
          border: `${u.r(1)}px solid ${alpha(p.primary, 0.05)}`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
          <div style={{ width: '100%', maxWidth: u.w(400), textAlign: 'center' }}>
            {step === 'userData' && <UserDataStep platform={state.platform} />}
            {step === 'permissions' && <PermissionsStep granted={w.storage} />}
            {step === 'rom' && <RomStep />}
            {step === 'scan' && <ScanStep w={w} />}
            {step === 'esde' && <EsdeStep done={w.esde} />}
            {step === 'art' && <ArtStep />}
          </div>
        </div>
        <WizardButtons state={state} w={w} press={press} />
      </div>
    </div>
  )
}

/** Wrapping text: the step bodies are paragraphs, laid out by the browser inside their column. */
function Para({
  size,
  color,
  weight = 400,
  height = LINE,
  mono,
  style,
  children,
}: {
  size: number
  color: string
  weight?: number
  height?: number
  mono?: boolean
  style?: CSSProperties
  children: ReactNode
}) {
  return (
    <p
      style={{
        margin: 0,
        fontFamily: mono ? 'monospace' : "'NeoStation Anta'",
        fontSize: size,
        fontWeight: weight,
        fontSynthesis: 'weight',
        lineHeight: height,
        color,
        whiteSpace: 'pre-line',
        ...style,
      }}
    >
      {children}
    </p>
  )
}

/** The icon, bold title and description every step opens with. */
function StepHead({
  icon,
  iconColor,
  title,
  titleSize,
  body,
  bodySize,
  iconSize = 48,
  gap = 16,
}: {
  icon: SymbolName
  iconColor: string
  title: string
  titleSize: number
  body?: string
  bodySize: number
  iconSize?: number
  gap?: number
}) {
  const { u, p } = useNeo()
  return (
    <>
      <Sym name={icon} size={u.r(iconSize)} color={iconColor} style={{ margin: '0 auto' }} />
      <Para size={u.t(titleSize)} color={p.onSurface} weight={700} style={{ marginTop: u.r(gap) }}>
        {title}
      </Para>
      {body !== undefined && (
        <Para size={u.t(bodySize)} color={alpha(p.onSurface, 0.7)} height={1.3} style={{ marginTop: u.r(8) }}>
          {body}
        </Para>
      )}
    </>
  )
}

/** Step 1 (`setup_wizard.dart:712-804`): where user data lives, and the pill that changes it. */
function UserDataStep({ platform }: { platform: State['platform'] }) {
  const { u, p } = useNeo()
  return (
    <>
      <StepHead
        icon="folder_special_rounded"
        iconColor={p.primary}
        title="User Data Location"
        titleSize={14}
        body="Choose where scraped media, system art packs, and app data are stored"
        bodySize={10}
      />
      <div
        style={{
          marginTop: u.r(8),
          padding: u.r(10),
          background: alpha(p.primary, 0.08),
          borderRadius: u.r(8),
          border: `${u.px(1)}px solid ${alpha(p.primary, 0.2)}`,
          display: 'flex',
          alignItems: 'center',
          gap: u.r(8),
          textAlign: 'left',
        }}
      >
        <Sym name="folder_rounded" size={u.r(16)} color={p.primary} style={{ flexShrink: 0 }} />
        {/* The line breaker takes a break after a slash before splitting a word. */}
        <Para size={u.t(11)} color={p.onSurface} mono style={{ overflowWrap: 'anywhere' }}>
          {userDataPath(platform).replaceAll('/', '/\u200b')}
        </Para>
      </div>
      <div style={{ marginTop: u.r(12), display: 'flex', justifyContent: 'center' }}>
        <Pill icon="folder_rounded" label="Select User Data Folder" />
      </div>
    </>
  )
}

/** A `GamepadControl` with an icon for a glyph, in flow: the default fill, the label in `primary`. */
function Pill({ icon, label }: { icon: SymbolName; label: string }) {
  const neo = useNeo()
  const { u, p } = neo
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: u.r(4),
        padding: `${u.r(4)}px ${u.r(6)}px`,
        border: `${u.r(1)}px solid transparent`,
        background: alpha(p.onSurface, 0.1),
        borderRadius: neo.radius.internal,
      }}
    >
      <Sym name={icon} size={u.r(18)} color={p.primary} />
      <Txt size={u.t(12)} color={p.primary} weight={600} letterSpacing={u.r(0.2)} style={{ paddingRight: u.r(4) }}>
        {label}
      </Txt>
    </div>
  )
}

/** Step 2, Android only (`:940-1061`): All Files Access. No second screen, so no accessibility row. */
function PermissionsStep({ granted }: { granted: boolean }) {
  const { u, p } = useNeo()
  return (
    <div
      style={{
        padding: u.r(12),
        background: alpha(p.onSurface, 0.04),
        borderRadius: u.r(16),
        border: `${u.px(1)}px solid ${granted ? alpha(GREEN, 0.5) : alpha(p.onSurface, 0.1)}`,
        display: 'flex',
        alignItems: 'center',
        gap: u.r(12),
        textAlign: 'left',
      }}
    >
      <Sym name="security_rounded" size={u.r(28)} color={granted ? GREEN : p.primary} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <Para size={u.t(13)} color={p.onSurface} weight={700}>
          Storage Permission
        </Para>
        <Para size={u.t(9)} color={granted ? GREEN : alpha(p.onSurface, 0.7)} height={1.3} style={{ marginTop: u.r(4) }}>
          {granted
            ? 'Enabled'
            : 'NeoStation needs "All Files Access" to manage your RetroArch configurations and sync your game saves correctly.\n\nPlease grant this permission in the next screen.'}
        </Para>
      </div>
      <Sym
        name={granted ? 'check_circle_rounded' : 'radio_button_unchecked_rounded'}
        size={u.r(20)}
        color={granted ? GREEN : alpha(p.onSurface, 0.3)}
        style={{ flexShrink: 0, marginLeft: u.r(8) - u.r(12) }}
      />
    </div>
  )
}

/** The ROM folder step (`:1063-1107`). Picking moves straight on, so it is only seen unpicked. */
function RomStep() {
  const { p } = useNeo()
  return (
    <StepHead
      icon="folder_open_rounded"
      iconColor={p.primary}
      title="Select ROM Folder"
      titleSize={14}
      body={'Choose the folder where your ROM files are stored.\n\nNeoStation will scan this folder for games.'}
      bodySize={10}
    />
  )
}

/** A bar: `LinearProgressIndicator` in a rounded clip. */
function Bar({ value, width, height, radius, track }: { value: number; width?: number; height: number; radius: number; track: string }) {
  const { p } = useNeo()
  return (
    <div style={{ width: width ?? '100%', height, margin: '0 auto', borderRadius: radius, background: track, overflow: 'hidden' }}>
      <div style={{ width: `${value * 100}%`, height: '100%', background: p.primary }} />
    </div>
  )
}

/** The green box a finished scan or import reports in. */
function DoneBox({ text }: { text: string }) {
  const { u } = useNeo()
  return (
    <div
      style={{
        marginTop: u.r(4),
        padding: u.r(12),
        background: alpha(GREEN, 0.1),
        borderRadius: u.r(12),
        border: `${u.r(1)}px solid ${alpha(GREEN, 0.3)}`,
        display: 'flex',
        alignItems: 'center',
        gap: u.r(12),
        textAlign: 'left',
      }}
    >
      <Sym name="check_circle_rounded" size={u.r(20)} color={GREEN} style={{ flexShrink: 0 }} />
      <Para size={u.t(12)} color={GREEN_700}>
        {text}
      </Para>
    </div>
  )
}

/** Scanning (`:1109-1263`): a spinner, then the count; Next only once it is done. */
function ScanStep({ w }: { w: WizardState }) {
  const { u, p } = useNeo()
  const done = w.scan >= 1
  return (
    <>
      <div
        style={{
          width: u.r(48),
          height: u.r(48),
          margin: '0 auto',
          borderRadius: '50%',
          background: alpha(p.primary, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {done ? <Sym name="check_circle_rounded" size={u.r(24)} color={GREEN} /> : <Spinner size={u.r(24)} stroke={u.r(3)} color={p.primary} />}
      </div>
      <Para size={u.t(16)} color={p.onSurface} weight={700} style={{ marginTop: u.r(4) }}>
        {done ? 'Scan complete' : 'Scanning ROMs'}
      </Para>
      {done ? (
        <DoneBox text={`Found ${FOUND} systems with games!\nTap Next to continue`} />
      ) : (
        <>
          <Para size={u.t(12)} color={alpha(p.onSurface, 0.7)} style={{ marginTop: u.r(4) }}>
            Scanning systems and ROMs...
          </Para>
          <div style={{ marginTop: u.r(4) }}>
            <Bar value={w.scan} height={u.r(8)} radius={u.r(8)} track={alpha(p.primary, 0.1)} />
          </div>
          <div style={{ marginTop: u.r(8), display: 'flex', justifyContent: 'space-between' }}>
            <Txt size={u.t(10)} color={alpha(p.onSurface, 0.6)}>
              {`${Math.round(w.scan * FOUND)} of ${FOUND} systems`}
            </Txt>
            <Txt size={u.t(10)} color={p.primary} weight={700}>
              {`${Math.round(w.scan * 100)}%`}
            </Txt>
          </div>
        </>
      )}
    </>
  )
}

/** A Material `CircularProgressIndicator`, at rest: a quarter-open ring. */
function Spinner({ size, stroke, color }: { size: number; stroke: number; color: string }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        boxSizing: 'border-box',
        borderRadius: '50%',
        border: `${stroke}px solid ${color}`,
        borderRightColor: 'transparent',
      }}
    />
  )
}

/** ES-DE import (`:1269-1385`), optional. */
function EsdeStep({ done }: { done: boolean }) {
  const { p } = useNeo()
  return (
    <>
      <StepHead
        icon={done ? 'check_circle_rounded' : 'download_for_offline_rounded'}
        iconColor={done ? GREEN : p.primary}
        title="Import from ES-DE"
        titleSize={16}
        body={
          'Already using ES-DE? Import your game metadata and artwork. Select the main ES-DE folder containing your "gamelists" and "downloaded_media" folders. Optional; you can run it later from Settings.'
        }
        bodySize={12}
      />
      {done && <DoneBox text={`ES-DE import complete\n${GAMES.length} games, ${FOUND} systems`} />}
    </>
  )
}

/** The System Art Pack step (`:1391-1511`), with no catalogue to offer. */
function ArtStep() {
  const { p } = useNeo()
  return (
    <StepHead
      icon="palette_rounded"
      iconColor={p.primary}
      iconSize={48 * 0.7}
      gap={10}
      title="Get a System Art Pack"
      titleSize={16}
      body="The System Art Pack couldn't be reached right now. You can install it later from Settings once you're online."
      bodySize={12}
    />
  )
}

/** The button row (`:1724-1807`): Skip on the optional steps, the step's action on the right. */
function WizardButtons({ state, w, press }: { state: State; w: WizardState; press?: ((b: 'a' | 'b') => void) | undefined }) {
  const neo = useNeo()
  const { u, p } = neo
  const step = wizardSteps(state.platform)[w.step]!
  const label =
    step === 'permissions'
      ? w.storage
        ? 'Next'
        : 'Grant Access'
      : step === 'rom'
        ? 'Select Folder'
        : step === 'esde'
          ? w.esde
            ? 'Next'
            : 'Import from ES-DE'
          : step === 'art'
            ? 'Finish'
            : 'Next'
  // Android draws Skip on Permissions and the ROM folder too; everywhere draws it on the last two.
  const skip = step === 'esde' || step === 'art' || (state.platform === 'android' && (step === 'permissions' || step === 'rom'))
  const h = controlHeight(neo)
  return (
    <div style={{ position: 'relative', height: h, marginTop: u.r(8), flexShrink: 0 }}>
      {skip && <GamepadControl glyph="Xbox_B_button" label="Skip for now" bg={alpha(p.onSurface, 0.1)} fg={alpha(p.onSurface, 0.6)} left={0} top={0} onTap={press && (() => press('b'))} />}
      <div style={{ position: 'absolute', right: 0, top: 0, width: controlWidth(neo, label), height: h }}>
        <GamepadControl glyph="Xbox_A_button" label={label} bg={p.primary} fg={p.onPrimary} left={0} top={0} onTap={press && (() => press('a'))} />
      </div>
    </div>
  )
}

/**
 * The scan splash (`system_content.dart:110-240`, `splash_status_layout.dart`): the shimmering logo
 * centred, the progress bar and status hung below it. The header floats over it as over any tab.
 */
export function ScanSplash({ progress }: { progress: number }) {
  const neo = useNeo()
  const { u, p } = neo
  // `SplashStatusLayout` sizes in logical px times its own scale, which is 1 on both devices.
  const scale = Math.max(1, Math.min(u.lw / 640, Math.max(u.lh, 700) / 480))
  const logoW = Math.min(u.px(280 * scale), u.W * 0.55, u.H * 0.4 * (772 / 510))
  const logoH = logoW * (510 / 772)
  const top = u.H / 2 + logoH / 2 + u.px(16 * scale)
  const logo = brand('logo_transparent.png')
  // The glint crosses as progress rises: translated by width * (progress * 3.2 - 1.6).
  const shift = logoW * (progress * 3.2 - 1.6)
  return (
    <div data-part="scan-splash" style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', left: (u.W - logoW) / 2, top: (u.H - logoH) / 2, width: logoW, height: logoH }}>
        <img alt="" src={logo} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
        {neo.web && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              maskImage: `url("${logo}")`,
              WebkitMaskImage: `url("${logo}")`,
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskPosition: 'center',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transform: `translateX(${shift}px)`,
                transition: motion(neo, [{ property: 'transform', duration: 250, easing: 'easeOut' }]),
                // `Alignment(-1,-0.4)` to `(1,0.4)`: a shallow diagonal band, white at 0.55 at its centre.
                background: `linear-gradient(${90 + (Math.atan2(0.4 * logoH, logoW) * 180) / Math.PI}deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 62%, rgba(255,255,255,0) 100%)`,
              }}
            />
          </div>
        )}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Bar value={progress} width={u.r(220)} height={u.r(3)} radius={u.r(2)} track={alpha(p.onSurface, 0.12)} />
        <Txt size={u.px(17 * Math.sqrt(Math.max(1, scale / 1.4))) * u.textScale} color={alpha(p.onSurface, 0.6)} style={{ marginTop: u.r(16) }}>
          Scanning systems and ROMs...
        </Txt>
      </div>
    </div>
  )
}


