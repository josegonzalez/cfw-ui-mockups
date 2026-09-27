import type { ReactNode } from 'react'
import { mailImg } from '../assets'
import { H, W } from '../layout'
import { CALENDAR, DATE, WII_NUMBER } from '../library'
import { dayLabel, type BoardFocus } from '../machine'
import { PALETTE } from '../palette'
import { abs, Img, PageArrow, Pill, Text, type Box } from './parts'

/**
 * PORTING NOTES
 * CFW: Wii Menu (System Menu 4.3U)   Devices: rg35xx
 * Source: closed. The WM4K showcase and the 2025 setup tour (`KzORmt_gWDA`), both 16:9 -
 *         `docs/themes/wii-menu/reference/frames/widescreen/board-*.png`; WM4K's `Mail/` textures.
 * Mode: reproduce
 *
 * Layout:        A pale grey board with the day's posts on it, arrows either side for the day
 *                before and after, and a bar along the bottom: the calendar and new-message
 *                buttons at the left, the date in the middle, the Wii button at the right. The
 *                new-message screen sets a memo, a letter and the address book side by side.
 * Focus & selection: A bar button; opens on the Wii button. On the new-message screen, one of the
 *                three, then Back.
 * Buttons:       Left / Right along the bar. L / SELECT and R / START are the arrows, a day back
 *                or forward, no further than today. A presses; B goes back. Posting a memo pins
 *                it to the day being shown.
 * Transitions:   Fades in over the Wii Menu (283ms, not measured).
 * Notes:         Arranged from 16:9 captures onto the 608x456 frame. The memo cannot be written
 *                in - there is no keyboard in this port - so a posted memo is blank. Register in
 *                the address book opens nothing. The Wii Number is made up.
 */

const Ground = () => (
  <div
    style={{
      ...abs({ x: 0, y: 0, w: W, h: H }),
      background: 'repeating-linear-gradient(#e6e7e8 0 3px, #dcdddf 3px 5px)',
    }}
  />
)

function RoundIcon({ cx, cy, d, src, focused }: { cx: number; cy: number; d: number; src: string; focused: boolean }) {
  const size = focused ? d + 6 : d
  return (
    <div
      data-focused={focused || undefined}
      style={{
        ...abs({ x: cx - size / 2, y: cy - size / 2, w: size, h: size }),
        borderRadius: '50%',
        boxShadow: focused ? `0 0 0 3px ${PALETTE.cyan}, 0 0 10px ${PALETTE.cyanSoft}` : '0 2px 3px rgba(0,0,0,0.2)',
      }}
    >
      <Img src={src} box={{ x: 0, y: 0, w: size, h: size }} />
    </div>
  )
}

function BoardBar({ day, focus }: { day: number; focus: BoardFocus | null }) {
  return (
    <>
      <div style={{ ...abs({ x: 0, y: 352, w: W, h: H - 352 }), background: 'linear-gradient(#e2e4e6, #c9cdd1)', borderTop: '2px solid #f4f5f6' }} />
      <RoundIcon cx={52} cy={400} d={52} src={mailImg('calendar-button')} focused={focus === 'calendar'} />
      <RoundIcon cx={112} cy={400} d={52} src={mailImg('create-button')} focused={focus === 'create'} />
      <Text box={{ x: 0, y: 382, w: W, h: 36 }} size={28} weight={700} color={PALETTE.clock}>
        {dayLabel(day)}
      </Text>
      <RoundIcon cx={552} cy={400} d={60} src={mailImg('wii-button')} focused={focus === 'wii'} />
    </>
  )
}

export function Board({ day, focus, memos }: { day: number; focus: BoardFocus; memos: number }) {
  return (
    <div className="wii-board" style={{ ...abs({ x: 0, y: 0, w: W, h: H }) }}>
      <Ground />
      {Array.from({ length: memos }, (_, i) => (
        <div key={i} className="wii-memo-card" style={{ ...abs({ x: 170 + (i % 3) * 30, y: 110 + (i % 3) * 22, w: 144, h: 96 }) }}>
          <Img src={mailImg('memo-card')} box={{ x: 0, y: 0, w: 144, h: 96 }} />
          <Text box={{ x: 0, y: 2, w: 144, h: 14 }} size={10} weight={500} color="#ffffff">
            Memo
          </Text>
        </div>
      ))}
      {day > -(DATE.day - 1) ? <PageArrow side="left" /> : null}
      {day < 0 ? <PageArrow side="right" /> : null}
      <BoardBar day={day} focus={focus} />
    </div>
  )
}

function Lift({ box, focused, children }: { box: Box; focused: boolean; children: ReactNode }) {
  return (
    <div
      data-focused={focused || undefined}
      style={{
        ...abs({ ...box, y: box.y - (focused ? 8 : 0) }),
        borderRadius: 6,
        boxShadow: focused ? `0 0 0 3px ${PALETTE.cyan}, 0 0 10px ${PALETTE.cyanSoft}` : 'none',
      }}
    >
      {children}
    </div>
  )
}

export function BoardCreate({ focus }: { focus: 0 | 1 | 2 | 'back' }) {
  return (
    <div className="wii-board-create" style={{ ...abs({ x: 0, y: 0, w: W, h: H }) }}>
      <Ground />
      <Lift box={{ x: 64, y: 120, w: 106, h: 98 }} focused={focus === 0}>
        <Img src={mailImg('memo')} box={{ x: 0, y: 0, w: 106, h: 98 }} />
        <Text box={{ x: 0, y: 2, w: 106, h: 14 }} size={10} weight={500} color="#ffffff">
          Memo
        </Text>
      </Lift>
      <Lift box={{ x: 250, y: 106, w: 108, h: 112 }} focused={focus === 1}>
        <Img src={mailImg('envelope-back')} box={{ x: 0, y: 0, w: 108, h: 112 }} />
        <Img src={mailImg('envelope-flap')} box={{ x: 0, y: 0, w: 108, h: 112 }} />
      </Lift>
      <Lift box={{ x: 444, y: 100, w: 94, h: 118 }} focused={focus === 2}>
        <Img src={mailImg('address-book')} box={{ x: 0, y: 0, w: 94, h: 118 }} />
        <Img src={mailImg('smiley')} box={{ x: 25, y: 30, w: 44, h: 19 }} />
        <Text box={{ x: 0, y: 52, w: 94, h: 14 }} size={10} weight={500} color="#29a9e0">
          Address Book
        </Text>
      </Lift>
      <Pill box={{ x: 24, y: 370, w: 130, h: 50 }} label="Back" focused={focus === 'back'} size={22} />
      <Text box={{ x: 0, y: 382, w: W, h: 36 }} size={28} weight={700} color={PALETTE.tileEdge}>
        {dayLabel(0)}
      </Text>
    </div>
  )
}

export function Memo({ focus }: { focus: 'back' | 'post' }) {
  const pad: Box = { x: 124, y: 16, w: 360, h: 330 }
  return (
    <div className="wii-memo" style={{ ...abs({ x: 0, y: 0, w: W, h: H }) }}>
      <Ground />
      <Img src={mailImg('memo')} box={pad} />
      <Text box={{ x: pad.x, y: pad.y + 6, w: pad.w, h: 24 }} size={17} weight={500} color="#ffffff">
        Memo
      </Text>
      <div style={{ ...abs({ x: pad.x + 22, y: pad.y + 48, w: 44, h: 44 }), border: '2px solid #c9cdd0', borderRadius: 6, background: '#f4f5f6' }} />
      <Text box={{ x: pad.x + 76, y: pad.y + 58, w: 200, h: 24 }} size={17} weight={400} color="#8a8f93" align="left">
        ←Add a Mii
      </Text>
      <Text box={{ x: pad.x, y: pad.y + 128, w: pad.w, h: 26 }} size={18} weight={400} color="#b6babd">
        Write a memo
      </Text>
      <Pill box={{ x: 24, y: 370, w: 130, h: 50 }} label="Back" focused={focus === 'back'} size={22} />
      <Pill box={{ x: 454, y: 370, w: 130, h: 50 }} label="Post" focused={focus === 'post'} size={22} />
    </div>
  )
}

export function AddressBook({ focus }: { focus: 'back' | 'register' }) {
  const card: Box = { x: 194, y: 18, w: 220, h: 275 }
  return (
    <div className="wii-address" style={{ ...abs({ x: 0, y: 0, w: W, h: H }) }}>
      <Ground />
      <Img src={mailImg('address-book')} box={card} />
      <Img src={mailImg('smiley')} box={{ x: card.x + 54, y: card.y + 48, w: 112, h: 48 }} />
      <Text box={{ x: card.x, y: card.y + 104, w: card.w, h: 30 }} size={22} weight={500} color="#29a9e0">
        Address Book
      </Text>
      <Text box={{ x: card.x, y: card.y + 162, w: card.w, h: 22 }} size={14} weight={500} color="#9a9ea1">
        {"This console's Wii Number"}
      </Text>
      <Text box={{ x: card.x, y: card.y + 188, w: card.w, h: 28 }} size={19} weight={500} color="#4a4e52">
        {WII_NUMBER}
      </Text>
      <Pill box={{ x: 24, y: 370, w: 130, h: 50 }} label="Back" focused={focus === 'back'} size={22} />
      <Pill box={{ x: 434, y: 370, w: 150, h: 50 }} label="Register" focused={focus === 'register'} size={22} />
    </div>
  )
}

export function NoMiis() {
  const panel: Box = { x: 144, y: 110, w: 320, h: 220 }
  return (
    <>
      <div style={{ ...abs({ x: 0, y: 0, w: W, h: H }), background: 'rgba(0,0,0,0.55)' }} />
      <div className="wii-dialog" style={{ ...abs(panel), background: 'linear-gradient(#f7f7f7, #e8e9ea)', borderRadius: 8, border: '2px solid #c8cbcd', boxSizing: 'border-box' }}>
        <Text box={{ x: 24, y: 26, w: panel.w - 48, h: 110 }} size={18} weight={500} color={PALETTE.ink} wrap lineHeight={30}>
          No Miis have been registered. Please use the Mii Channel to create a Mii.
        </Text>
        <Pill box={{ x: 90, y: 150, w: 136, h: 48 }} label="OK" focused size={21} />
      </div>
    </>
  )
}

const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function BoardCalendar() {
  const cell = { w: 50, h: 38 }
  const left = 128
  const top = 40
  return (
    <div className="wii-board-calendar" style={{ ...abs({ x: 0, y: 0, w: W, h: H }) }}>
      <Ground />
      <div style={{ ...abs({ x: left - 10, y: top - 10, w: cell.w * 7 + 20, h: cell.h * 6 + 20 + 26 }), background: '#ffffff', borderRadius: 4, boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }} />
      {WEEK.map((d, i) => (
        <Text key={d} box={{ x: left + i * cell.w, y: top, w: cell.w, h: 22 }} size={14} weight={500} color={i === 0 ? '#d8454a' : i === 6 ? '#2e7fd6' : PALETTE.inkSoft}>
          {d}
        </Text>
      ))}
      {Array.from({ length: CALENDAR.days }, (_, i) => {
        const at = CALENDAR.firstWeekday + i
        const col = at % 7
        const row = Math.floor(at / 7)
        const today = i + 1 === DATE.day
        const box = { x: left + col * cell.w, y: top + 26 + row * cell.h, w: cell.w, h: cell.h }
        return (
          <div key={i} style={{ ...abs(box), background: today ? '#f7ea5a' : 'transparent', boxShadow: 'inset 0 0 0 1px #e1e3e5' }}>
            <Text box={{ x: 0, y: 0, w: cell.w, h: cell.h }} size={20} weight={500} color={col === 0 ? '#d8454a' : col === 6 ? '#2e7fd6' : PALETTE.ink}>
              {String(i + 1)}
            </Text>
          </div>
        )
      })}
      <Pill box={{ x: 24, y: 370, w: 130, h: 50 }} label="Back" focused size={22} />
      <Text box={{ x: 330, y: 376, w: 254, h: 40 }} size={30} weight={500} color={PALETTE.inkSoft} align="right">
        {`${MONTHS[CALENDAR.month - 1]} ${CALENDAR.year}`}
      </Text>
    </div>
  )
}
