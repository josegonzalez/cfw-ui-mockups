/**
 * PORTING NOTES
 * CFW: TortOS            Devices: trimui-brick
 * Source: ericreinsmidt/TortOS - src/main.c draw_paused_frame (6562), game_menu (8384),
 *         gm_backdrop, slot_draw (6617), slot_strip (6706); src/game_menu.c gm_rows
 * Mode: reproduce
 *
 * Layout:        The in-game menu is the ordinary panel with no heading, over the paused game
 *                dimmed at 120, sized across every Display Mode label so cycling it never
 *                resizes the panel. The save carousel is one slot at a time: "Save to" / "Load
 *                from" at y=39, the slot's picture fitted to the game's aspect inside 700x451
 *                from y=129 with a 12px frame in the system's colour, the slot's name and
 *                timestamp under it, and seven dots, 36px apart.
 * Focus & selection: The in-game menu is a list with the plate; the carousel's current slot is
 *                the dot in the system's colour, and slots that cannot be chosen - Auto when
 *                saving, an empty slot when loading - are skipped and drawn faint.
 * Buttons:       Game: MENU pauses into the menu; Diatom owns every other button. Menu: A
 *                chooses, Left/Right cycle Display, B and MENU continue, SELECT opens Muse.
 *                Carousel: Left/Right cycle, A chooses and resumes, B back to the menu.
 * Transitions:   None; the source presents black twice and resumes.
 * Notes:         The running game and its paused frame are the emulator's, not the launcher's,
 *                so the mockup stands a placeholder in for them: the game's own generated card on
 *                black, where the emulator's picture would be. Save slots have no pictures of
 *                their own for the same reason and show the same placeholder.
 */
import { CONSOLES, titleOf } from '../library'
import { type State } from '../machine'
import { UI, hex } from '../palette'
import { CARD, CF, FONT, SCREEN, SLOTS, focusRect } from '../spec'
import { GeneratedCard, Glow, Text, px } from './parts'

/**
 * The emulator's paused frame: a placeholder, the game's card where its picture would be. The
 * black around it is the theme root's fill while a game is up, not a layer of its own.
 */
export function PausedFrame({ state }: { state: State }) {
  const g = state.running
  const owner = CONSOLES.find((c) => c.tag === g?.tag)
  const box = focusRect(CF.games)
  const w = Math.round((box.height * CARD.w) / CARD.h)
  return (
    <div style={{ position: 'absolute', inset: 0 }} data-part="paused-frame">
      {g && owner && (
        <div style={{ position: 'absolute', left: `${(SCREEN.w - w) / 2}px`, top: `${(SCREEN.h - box.height) / 2}px`, width: `${w}px`, height: `${box.height}px` }}>
          <GeneratedCard title={titleOf(g.name)} rgb={owner.accent} width={w} height={box.height} />
        </div>
      )}
    </div>
  )
}

/** The save carousel over the paused game. */
export function Slots({ state, tint }: { state: State; tint: number }) {
  const saving = state.slotSaving
  const sel = state.slot
  const area = SLOTS.area
  // Every slot of one game holds the same machine's frame; 4:3 until a picture says otherwise.
  const aspect = 4 / 3
  const img =
    area.width / aspect <= area.height
      ? { width: area.width, height: Math.round(area.width / aspect) }
      : { width: Math.round(area.height * aspect), height: area.height }
  const box = { left: area.left + Math.trunc((area.width - img.width) / 2), top: area.top + Math.trunc((area.height - img.height) / 2), ...img }
  const bw = SLOTS.border
  const frame = { left: box.left - bw, top: box.top - bw, width: box.width + bw * 2, height: box.height + bw * 2 }
  const have = state.slotsHave[sel] ?? false
  const owner = CONSOLES.find((c) => c.tag === state.running?.tag)
  const when = SAMPLE_WHEN[sel] ?? ''
  const x0 = Math.trunc((SCREEN.w - SLOTS.dots * SLOTS.dotPitch) / 2) + SLOTS.dotPitch / 2
  const dotY = box.top + box.height + 62 + FONT.menu + FONT.meta

  return (
    <div style={{ position: 'absolute', inset: 0 }} data-part="slots">
      <Text text={saving ? 'Save to' : 'Load from'} x={SCREEN.w / 2} y={SLOTS.headingY} size={FONT.label} color={UI.dim} anchor={0} />
      <Glow box={box} rgb={tint} alpha={85} spread={1.35} />
      <div style={{ position: 'absolute', ...px(frame), borderRadius: `${bw}px`, background: hex(tint) }} />
      {have && owner && state.running ? (
        <div style={{ position: 'absolute', ...px(box), background: '#000', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: `${(box.width - box.height * (CARD.w / CARD.h)) / 2}px`, top: 0, width: `${box.height * (CARD.w / CARD.h)}px`, height: `${box.height}px` }}>
            <GeneratedCard title={titleOf(state.running.name)} rgb={owner.accent} width={box.height * (CARD.w / CARD.h)} height={box.height} />
          </div>
        </div>
      ) : (
        <>
          <div style={{ position: 'absolute', ...px(box), background: 'rgba(12,13,18,0.933)' }} />
          <Text text="Empty" x={box.left + box.width / 2} y={box.top + Math.trunc((box.height - FONT.menu) / 2)} size={FONT.menu} color={UI.dim} anchor={0} />
        </>
      )}
      <Text text={sel === 0 ? 'Auto' : `Slot ${sel}`} x={SCREEN.w / 2} y={box.top + box.height + 36} size={FONT.menu} color={UI.text} anchor={0} />
      <Text text={have ? when : saving ? '—' : ''} x={SCREEN.w / 2} y={box.top + box.height + 42 + FONT.menu} size={FONT.meta} color={UI.dim} anchor={0} />
      {Array.from({ length: SLOTS.dots }, (_, i) => {
        const can = saving ? i >= 1 : state.slotsHave[i]
        const r = SLOTS.dotR
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x0 + i * SLOTS.dotPitch - r}px`,
              top: `${dotY - r}px`,
              width: `${r * 2}px`,
              height: `${r * 2}px`,
              borderRadius: `${r / 2}px`,
              background: i === sel ? hex(tint) : `rgba(90,94,110,${can ? 1 : +(90 / 255).toFixed(4)})`,
            }}
          />
        )
      })}
    </div>
  )
}

/**
 * The sample saves' timestamps, in the format `slot_strip` writes them. The first is the
 * example the source's own comment gives (`src/main.c:6736`); the others follow it.
 */
const SAMPLE_WHEN = ['Aug 23 9:21:05 AM', 'Aug 22 8:47:12 PM', 'Aug 20 7:03:40 PM']
