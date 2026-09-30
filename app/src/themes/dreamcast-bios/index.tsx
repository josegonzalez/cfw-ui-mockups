import { useCallback, useEffect, useState } from 'react'
import { Animated } from '../../anim/Animated'
import { transitionsToCss } from '../../anim/waapi'
import { useScreen } from '../../device/ScreenContext'
import { useButtonPress, useInteractive } from '../../input/InputProvider'
import type { Button } from '../../input/keymap'
import { Sky } from './background'
import { H, W } from './layout'
import { formatClock } from './library'
import { filesOf, finishPending, initialState, isDialog, reduce, screenKey, screenOf, top, type Seed, type State, type View } from './machine'
import { FADE_IN, MOTION } from './motion'
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
      return <Music focus={v.focus} repeat={s.repeat} />
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
 * after it have run on its clock, shows the new one fading up.
 */
export function DreamcastBios(seed: DreamcastBiosProps) {
  const [state, setState] = useState<State>(() => initialState(seed))
  const { animate } = useScreen()
  const live = useInteractive()

  useButtonPress(
    useCallback((button: Button) => {
      setState((s) => reduce(s, button))
    }, []),
  )

  useEffect(() => {
    if (!live || state.pending === null) return
    const id = setTimeout(() => setState(finishPending), animate ? MOTION.screenOut + MOTION.gap : 0)
    return () => clearTimeout(id)
  }, [live, animate, state.pending])

  const v = top(state)
  const screen = screenOf(state.stack)
  const leaving = state.pending !== null
  return (
    <div className="dreamcast-bios" data-theme="dreamcast-bios" data-view={v.kind}>
      <Sky />
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
