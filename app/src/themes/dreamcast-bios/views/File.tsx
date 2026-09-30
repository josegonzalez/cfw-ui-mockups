/**
 * PORTING NOTES
 * CFW: Sega Dreamcast BIOS menu   Devices: dreamcast
 * Source: closed; strings from boot ROM v1.01d; layout from recording c69qVhS_WOU (104-141s)
 * Mode: reproduce
 *
 * Layout:        Two screens. The card picker (`frames/file-cards.png`): a slate header with the
 *                prompt, a tab per controller port A-D, the port's two expansion sockets under it,
 *                and a box for the focused socket's card. The file list (`frames/file-list.png`):
 *                the prompt, the card and its box on the left, and a green-rimmed panel holding an
 *                8x3 grid of saves over a strip describing the focused one.
 * Focus & selection: A socket or save is focused; the focused save has a yellow frame, and saves
 *                picked with X or Y blink yellow. ALL sits above-left of the grid and BACK below.
 * Buttons:       Picker: D-pad, A opens the card, B back. List: D-pad, A opens Copy/Delete/Cancel
 *                (or Copy all/Delete all/Cancel on ALL), X and Y pick saves of one game, B back.
 * Transitions:   Picker and list fade like screens; the menus and the Yes/No box open over the list.
 * Notes:         Only A-1 holds a card. A save's icon is the game's own art, which the port does not
 *                carry: each is a placeholder in two fixed colours. How the picker marks a focused
 *                empty socket is not in the recording, which only focuses A-1; the port brightens it.
 *                Copy stops at the destination picker - there is no second card to copy to.
 */
import { drawn } from '../assets'
import { BACK, CARDS, CELL, FILES } from '../layout'
import { CARD_BLOCKS, PORTS, type VmuFile } from '../library'
import { Animated } from '../../../anim/Animated'
import { BLINK } from '../motion'
import { PALETTE } from '../palette'
import { S, asLatin1 } from '../strings'
import { ADVANCE, BackButton, DialogBox, Img, Lines, Option, Text, VmuIcon, abs } from './parts'

/** The card box: the socket's name, the used and free bar, and the free blocks. */
function CardBox({ box, label, free }: { box: { x: number; y: number; w: number; h: number }; label: string; free: number | null }) {
  const bar = { x: box.x + 16, y: box.y + 34, w: box.w - 32, h: 8 }
  const usedW = free === null ? 0 : Math.round((bar.w * (CARD_BLOCKS - free)) / CARD_BLOCKS)
  return (
    <>
      <div style={{ ...abs(box), background: PALETTE.card, borderRadius: 6 }} />
      <Text box={{ x: box.x, y: box.y + 6, w: box.w, h: CELL.h }} align="center">
        {label}
      </Text>
      {free === null ? null : (
        <>
          <div style={{ ...abs({ ...bar, w: usedW }), background: PALETTE.used }} />
          <div style={{ ...abs({ ...bar, x: bar.x + usedW, w: bar.w - usedW }), background: PALETTE.free }} />
          <Text box={{ x: box.x + 14, y: box.y + 48, w: box.w, h: CELL.h }}>{String(free)}</Text>
          <Text box={{ x: box.x, y: box.y + 74, w: box.w - 8, h: CELL.h }} align="right">
            {S.free.trim()}
          </Text>
        </>
      )}
    </>
  )
}

/** A card, as the picker and the list draw it: the VMU, showing a save - the focused one in the list - on its screen. */
function Card({ box, first }: { box: { x: number; y: number; w: number; h: number }; first: VmuFile | undefined }) {
  const sx = box.w / 84
  const sy = box.h / 114
  return (
    <div style={abs(box)}>
      <Img src={drawn('vmu')} box={{ x: 0, y: 0, w: box.w, h: box.h }} />
      {first ? <VmuIcon file={first} box={{ x: 12 * sx, y: 16 * sy, w: 60 * sx, h: 46 * sy }} blocks={false} /> : null}
    </div>
  )
}

export function CardPicker({ focus, purpose, files }: { focus: number | 'back'; purpose: 'browse' | 'copy'; files: readonly VmuFile[] }) {
  const free = CARD_BLOCKS - files.reduce((n, f) => n + f.blocks, 0)
  const port = focus === 'back' ? 0 : Math.floor(focus / 2)
  const socket = focus === 'back' ? 0 : focus % 2
  const lines = purpose === 'browse' ? [S.selectCard] : [S.selectDest, S.selectDest2]
  const { header, band, column, tab, slot, number, info } = CARDS
  return (
    <>
      <div style={{ ...abs(header), background: PALETTE.header, borderRadius: '8px 8px 0 0' }} />
      <div style={{ ...abs(band), background: PALETTE.band }} />
      <Lines x={96} cy={lines.length === 1 ? 67 : 58} w={480} pitch={26} lines={lines} align="left" />
      <Img src={drawn('controller')} box={{ x: column.x - 2, y: 104, w: 74, h: 66 }} />
      {PORTS.map((p, i) => (
        <div key={p}>
          <div style={{ ...abs({ x: column.x + i * column.pitch, y: tab.y, w: column.w, h: tab.h }), background: PALETTE.band, borderRadius: '0 0 8px 8px' }} />
          <Text box={{ x: column.x + i * column.pitch, y: tab.y + 3, w: column.w, h: CELL.h }} align="center" fill={PALETTE.port}>
            {p}
          </Text>
          {slot.map((s, k) => {
            const box = { x: column.x + i * column.pitch - 4, y: s.y, w: column.w + 8, h: s.h }
            const focused = focus === i * 2 + k
            const holdsCard = i === 0 && k === 0
            return (
              <div key={k} data-socket={`${p}-${k + 1}`} data-focused={focused || undefined}>
                {holdsCard ? (
                  <Card box={box} first={files[0]} />
                ) : (
                  <div style={{ ...abs(box), background: PALETTE.ghost, borderRadius: 14, opacity: focused ? 1 : 0.6 }} />
                )}
              </div>
            )
          })}
        </div>
      ))}
      {number.cy.map((cy, k) => (
        <div key={k}>
          <div style={{ ...abs({ x: number.cx - 22, y: cy - 16, w: 44, h: 32 }), background: PALETTE.port, borderRadius: '50%' }} />
          <Text box={{ x: number.cx - 22, y: cy - CELL.h / 2, w: 44, h: CELL.h }} align="center">
            {String(k + 1)}
          </Text>
        </div>
      ))}
      {/* With BACK focused there is no socket to describe, and the box stands empty (`cards-back.png`). */}
      <CardBox box={info} label={focus === 'back' ? '' : `${PORTS[port]}-${socket + 1}`} free={focus !== 'back' && port === 0 && socket === 0 ? free : null} />
      <BackButton {...BACK.file} focused={focus === 'back'} />
    </>
  )
}

/** The three lines under the grid for a save, or the total for ALL. */
function detailLines(file: VmuFile | undefined, used: number, count: number): [string, string, string, string] {
  if (count === 0) return [S.noFiles, '', '', '']
  if (!file) return ['', '', `${S.total}     ${used}  ${S.blocks}`, '']
  const desc = file.sjis?.desc ? asLatin1(file.sjis.desc) : file.desc
  const comment = file.sjis?.comment ? asLatin1(file.sjis.comment) : file.comment
  return [desc, `${file.name}  ${comment}`, `${file.date}   ${String(file.blocks).padStart(2)}  ${S.blocks}`, 'DATA']
}

export function FileList({
  focus,
  files,
  marked,
  confirm,
}: {
  focus: number | 'all' | 'back'
  files: readonly VmuFile[]
  marked: readonly string[]
  /** The header's question while the Yes/No box is open: one save, a group, or the whole card. */
  confirm: 'one' | 'group' | 'all' | null
}) {
  const used = files.reduce((n, f) => n + f.blocks, 0)
  const { headerBox, header, vmu, info, all, panel, grid, arrows, detail } = FILES
  const focused = typeof focus === 'number' ? files[focus] : undefined
  const [l1, l2, l3, kind] = detailLines(focused, used, files.length)
  const prompt =
    confirm === 'all'
      ? [S.deleteAll, S.deleteAll2]
      : confirm === 'group'
        ? [S.together, S.proceed]
        : confirm === 'one'
          ? [S.willDelete, S.proceed]
          : [S.selectFiles, S.selectFiles2]
  // The question is centred in the header; the prompt is set left, as its leading spaces expect.
  const centred = confirm !== null
  return (
    <>
      <div style={{ ...abs(headerBox), background: PALETTE.header, borderRadius: 8 }} />
      {centred ? (
        <Lines x={headerBox.x} cy={header.lines[0]} w={headerBox.w} pitch={header.lines[1] - header.lines[0]} lines={prompt} />
      ) : (
        prompt.map((line, i) => <Lines key={i} x={header.x[i]!} cy={header.lines[i]!} w={headerBox.w} pitch={0} lines={[line]} align="left" />)
      )}
      <Card box={vmu} first={focused ?? files[0]} />
      <CardBox box={info} label="A-1" free={CARD_BLOCKS - used} />
      <BackButton {...BACK.file} focused={focus === 'back'} />

      <div style={{ ...abs(panel), background: PALETTE.gridFill, border: `${panel.rim}px solid ${PALETTE.gridRim}`, borderRadius: 12, boxSizing: 'border-box' }} />
      <div style={{ ...abs({ x: panel.x, y: panel.y + panel.split - panel.rim, w: panel.w, h: panel.rim }), background: PALETTE.gridRim }} />
      <div
        style={{
          ...abs({ x: panel.x + panel.rim, y: panel.y + panel.split, w: panel.w - 2 * panel.rim, h: panel.h - panel.split - panel.rim }),
          background: PALETTE.info,
          borderRadius: '0 0 6px 6px',
        }}
      />
      {Array.from({ length: grid.cols * grid.rows }, (_, i) => {
        const box = { x: grid.x + (i % grid.cols) * grid.pitchX, y: grid.y + Math.floor(i / grid.cols) * grid.pitchY, w: grid.w, h: grid.h }
        const file = files[i]
        if (!file) return <div key={i} style={{ ...abs(box), background: PALETTE.cell }} />
        // ALL focused frames every save, as the whole card is what A will act on (`file-all-menu.png`).
        const isFocused = focus === i || focus === 'all'
        const isMarked = marked.includes(file.id)
        const frame = { x: box.x - 3, y: box.y - 3, w: box.w + 6, h: box.h + 6 }
        return (
          <div key={i} data-file={file.id} data-focused={isFocused || undefined} data-marked={isMarked || undefined}>
            {isFocused ? <div style={{ ...abs(frame), background: PALETTE.cellFocus }} /> : null}
            {isMarked && !isFocused ? <Animated storyboard={BLINK} event="_" style={{ ...abs(frame), background: PALETTE.cellFocus }} /> : null}
            <VmuIcon file={file} box={box} />
          </div>
        )
      })}
      {[arrows.up, arrows.down].map((cy, i) => (
        <svg key={i} width={24} height={20} style={{ position: 'absolute', left: arrows.cx - 12, top: cy - 10 }}>
          <polygon points={i === 0 ? '12,0 24,20 0,20' : '0,0 24,0 12,20'} fill={PALETTE.ghost} />
        </svg>
      ))}

      <div data-focused={focus === 'all' || undefined}>
        <div
          style={{
            ...abs({ x: all.cx - all.r, y: all.cy - all.r, w: all.r * 2, h: all.r * 2 }),
            background: PALETTE.allFill,
            border: `4px solid ${focus === 'all' ? PALETTE.cellFocus : PALETTE.allRim}`,
            borderRadius: '50%',
            boxSizing: 'border-box',
          }}
        />
        <Text box={{ x: all.cx - all.r, y: all.cy - CELL.h / 2, w: all.r * 2, h: CELL.h }} align="center" fill={PALETTE.textHot} advance={9}>
          ALL
        </Text>
      </div>

      {[l1, l2, l3].map((line, i) => (
        <Text key={i} box={{ x: detail.x, y: detail.lines[i]! - CELL.h / 2, w: detail.right - detail.x, h: CELL.h }} advance={ADVANCE.dialogDate}>
          {line}
        </Text>
      ))}
      {kind ? (
        <Text box={{ x: detail.x, y: detail.lines[0]! - CELL.h / 2, w: detail.right - detail.x, h: CELL.h }} align="right" advance={ADVANCE.dialogDate}>
          {kind}
        </Text>
      ) : null}
    </>
  )
}

/** Copy, Delete, Cancel for a save; Copy all, Delete all, Cancel for ALL. */
export function FileMenu({ focus, all }: { focus: number; all: boolean }) {
  const m = all ? FILES.allMenu : FILES.menu
  const labels = all ? [S.copyAll, S.deleteAllItem, S.cancel] : [S.copy, S.delete, S.cancel]
  return (
    <DialogBox box={m.box} rim={PALETTE.rimFile}>
      <div style={{ position: 'absolute', left: -m.box.x, top: -m.box.y }}>
        {labels.map((label, i) => (
          <Option key={i} x={m.blobX} cy={m.first + i * m.pitch} label={label} focused={i === focus} />
        ))}
      </div>
    </DialogBox>
  )
}

/** Yes and No; the header above asks the question. */
export function DeleteBox({ focus }: { focus: number }) {
  const m = FILES.confirm
  return (
    <DialogBox box={m.box} rim={PALETTE.rimFile}>
      <div style={{ position: 'absolute', left: -m.box.x, top: -m.box.y }}>
        {[S.yes, S.no].map((label, i) => (
          <Option key={i} x={m.blobX} cy={m.first + i * m.pitch} label={label} focused={i === focus} />
        ))}
      </div>
    </DialogBox>
  )
}
