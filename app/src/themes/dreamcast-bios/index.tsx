import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated } from '../../anim/Animated'
import { transitionsToCss } from '../../anim/waapi'
import { useSound } from '../../audio/SoundProvider'
import { useScreen } from '../../device/ScreenContext'
import { useButtonPress, useInteractive } from '../../input/InputProvider'
import type { Button } from '../../input/keymap'
import { sound } from './assets'
import { Sky } from './background'
import { H, W } from './layout'
import { formatClock } from './library'
import {
  arrivalCue,
  cueOf,
  filesOf,
  finishBoot,
  finishPending,
  initialState,
  isDialog,
  reduce,
  screenKey,
  screenOf,
  tickPlayer,
  top,
  type Seed,
  type State,
  type View,
} from './machine'
import { FADE_IN, MOTION } from './motion'
import { Boot } from './views/Boot'
import { CardPicker, DeleteBox, FileList, FileMenu } from './views/File'
import { MainMenu } from './views/Main'
import { Music } from './views/Music'
import { CardsSet, Deleted, NoDisc } from './views/NoDisc'
import { AutoStartBox, CardClockBox, ClockBox, LanguageBox, SettingsList, SoundBox } from './views/Settings'
import { abs } from './views/parts'
import './dreamcast-bios.css'

export type DreamcastBiosProps = Seed

/** What the header asks while the Yes/No box is open over the file list. */
function confirmOf(s: State): 'one' | 'group' | 'all' | null {
  const v = top(s)
  if (v.kind !== 'delete') return null
  return v.all ? 'all' : s.marked.length > 1 ? 'group' : 'one'
}

function Screen({ s, v }: { s: State; v: View }) {
  switch (v.kind) {
    case 'boot':
      return <Boot />
    case 'boot-clock':
      return <ClockBox focus={v.focus} draft={v.draft} boot />
    case 'main':
      return <MainMenu focus={s.main} clock={formatClock(s.clock)} />
    case 'no-disc':
      return <NoDisc />
    case 'settings':
      return <SettingsList focus={v.focus} prefs={s.prefs} clock={s.clock} />
    case 'cards':
      return <CardPicker focus={v.focus} purpose={v.purpose} files={filesOf(s)} />
    case 'files':
      return <FileList focus={v.focus} files={filesOf(s)} marked={s.marked} confirm={confirmOf(s)} />
    case 'music':
      return <Music focus={v.focus} repeat={s.repeat} player={s.player} />
    default:
      return null
  }
}

function Dialog({ s, v }: { s: State; v: View }) {
  switch (v.kind) {
    case 'language':
      return <LanguageBox focus={v.focus} />
    case 'clock':
      return <ClockBox focus={v.focus} draft={v.draft} boot={false} />
    case 'sound':
      return <SoundBox focus={v.focus} />
    case 'auto':
      return <AutoStartBox focus={v.focus} />
    case 'card-clock':
      return <CardClockBox focus={v.focus} clock={s.clock} />
    case 'card-clock-done':
      return <CardsSet />
    case 'file-menu':
      return <FileMenu focus={v.focus} all={v.all} />
    case 'delete':
      return <DeleteBox focus={v.focus} />
    case 'deleted':
      return <Deleted />
    default:
      return null
  }
}

/**
 * The Dreamcast BIOS menu, boot ROM v1.01d, on the console's 640x480 video output.
 *
 * Every behaviour is `machine.ts`. This root holds the state, keeps the sky running behind
 * everything, and on a change of screen fades the old one out and, once the fade and the pause
 * after it have run on its clock, shows the new one fading up. It plays the sound each press and
 * each arrival calls for; which sound that is, is the machine's to say.
 */
export function DreamcastBios(seed: DreamcastBiosProps) {
  const [state, setState] = useState<State>(() => initialState(seed))
  const { animate } = useScreen()
  const live = useInteractive()
  const { play } = useSound()

  /*
   * A press's sound depends on the state it leaves as well as the one it makes, so the handler
   * reduces against the latest state itself rather than inside a `setState` updater - an updater
   * must stay pure, and React may run it twice.
   */
  const latest = useRef(state)
  useEffect(() => {
    latest.current = state
  }, [state])
  useButtonPress(
    useCallback(
      (button: Button) => {
        const prev = latest.current
        const next = reduce(prev, button)
        if (next === prev) return
        latest.current = next
        setState(next)
        const cue = cueOf(prev, next, button)
        if (cue) play(sound(cue))
      },
      [play],
    ),
  )

  // Power-on: the logo holds, then the screen after it fades up. A still posed on it stays. The
  // boot sound starts a moment in, as the recording's does.
  const booting = top(state).kind === 'boot'
  useEffect(() => {
    if (!live || !booting) return
    const chime = setTimeout(() => play(sound('boot')), animate ? MOTION.boot.sound : 0)
    const id = setTimeout(() => setState(finishBoot), animate ? MOTION.boot.hold : 0)
    return () => {
      clearTimeout(chime)
      clearTimeout(id)
    }
  }, [live, animate, booting, play])

  // The CD playing: a second at a time, on the live build's clock. A still holds its time.
  const playing = state.player.state === 'playing'
  useEffect(() => {
    if (!live || !playing) return
    const id = setInterval(() => setState(tickPlayer), 1000)
    return () => clearInterval(id)
  }, [live, playing])

  const pending = state.pending
  useEffect(() => {
    if (!live || pending === null) return
    const id = setTimeout(
      () => {
        setState(finishPending)
        const cue = arrivalCue(pending[pending.length - 1]!)
        if (cue) play(sound(cue))
      },
      animate ? MOTION.screenOut + MOTION.gap : 0,
    )
    return () => clearTimeout(id)
  }, [live, animate, pending, play])

  const v = top(state)
  const screen = screenOf(state.stack)
  const leaving = state.pending !== null
  return (
    <div className="dreamcast-bios" data-theme="dreamcast-bios" data-view={v.kind}>
      {/* Power-on is grey with no sky; the sky comes in as the screen after it starts to fade up. */}
      {booting && state.pending === null ? null : <Sky />}
      {/* The fade out only: the new screen comes back at once and its own storyboard fades it up. */}
      <div
        style={{
          ...abs({ x: 0, y: 0, w: W, h: H }),
          opacity: leaving ? 0 : 1,
          transition: transitionsToCss(animate && leaving ? [{ property: 'opacity', duration: MOTION.screenOut, easing: 'linear' }] : []),
        }}
      >
        <Animated key={screenKey(state.stack)} storyboard={FADE_IN} event="open" style={abs({ x: 0, y: 0, w: W, h: H })}>
          <Screen s={state} v={screen} />
          {/* Every box open over the screen, oldest first: one box can open over another. */}
          {state.stack.filter(isDialog).map((d, i) => (
            <Dialog key={`${i}:${d.kind}`} s={state} v={d} />
          ))}
        </Animated>
      </div>
    </div>
  )
}
