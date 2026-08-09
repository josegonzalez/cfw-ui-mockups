/**
 * PORTING NOTES
 * CFW: Example OS (fictional launcher, used as the scaffold reference)
 * Devices: every device in the registry - the layout resolves from fractions
 * Source: n/a - this is a template, not a reproduction of a real firmware
 * Mode: design-new
 *
 * Layout:
 *   - Header: back chevron and system name left, game count right, accent rule beneath.
 *   - Body: a game list on the left, a detail column on the panel colour to the right.
 *   - Footer: button hint strip.
 * Colors:
 *   - background, panel, accent, text, muted from `palette.ts`.
 * Focus & selection:
 *   - The selected row fills with the accent colour. The detail column follows the selection.
 *   - Vertical wrap. Default focus on the first row.
 * Buttons:
 *   - A: launch the focused game (no-op here). B: back to the main menu.
 *     D-pad up/down: move selection.
 * Transitions:
 *   - Selection is instant, and the detail column swaps with it.
 * Notes:
 *   - Cover art is generated from each game's authored colour pair, so no artwork ships.
 */
import { GeneratedArt, gradientArt } from '../../../widgets/GeneratedArt'
import { HeaderBar } from '../../../widgets/HeaderBar'
import { HelpBar } from '../../../widgets/HelpBar'
import { TextList } from '../../../widgets/TextList'
import { place } from '../../../layout/box'
import { GAMES, SYSTEM_NAME } from '../data'
import { PALETTE } from '../palette'
import type { ExampleLayout } from '../layout'

export interface GameListProps {
  readonly layout: ExampleLayout
  readonly selectedIndex: number
  readonly firstVisible?: number | undefined
}

export function GameList({ layout, selectedIndex, firstVisible }: GameListProps) {
  const { gameList } = layout
  const game = GAMES[Math.min(selectedIndex, GAMES.length - 1)]!

  return (
    <>
      <HeaderBar
        box={layout.header}
        title={SYSTEM_NAME}
        leading="‹"
        titleFont={layout.titleFont}
        color={PALETTE.text}
        accentColor={PALETTE.accent}
        paddingX={layout.paddingX}
        ruleHeight={layout.rule.height}
        ruleColor={PALETTE.accent}
        ruleInsetX={layout.paddingX}
        right={
          <span style={{ color: PALETTE.muted, fontSize: `${layout.countFont}px` }}>
            {GAMES.length} games
          </span>
        }
      />

      {/* The detail column sits on the panel colour, behind its contents. */}
      <div style={{ ...place(gameList.detail), background: PALETTE.panel }} />

      <TextList
        box={gameList.list}
        items={GAMES.map((g) => ({ key: g.key, label: g.title, sublabel: g.lastPlayed }))}
        selectedIndex={selectedIndex}
        firstVisible={firstVisible}
        rowHeight={gameList.rowHeight}
        gap={gameList.gap}
        labelFont={gameList.titleFont}
        sublabelFont={gameList.subFont}
        rowPaddingX={gameList.rowPaddingX}
        rowRadius={gameList.rowRadius}
        colors={{
          fg: PALETTE.text,
          sublabelFg: PALETTE.muted,
          selectedFg: PALETTE.onAccent,
          selectedBg: PALETTE.accent,
          selectedSublabelFg: PALETTE.onAccentMuted,
        }}
      />

      <GeneratedArt
        box={gameList.art}
        src={gradientArt({
          width: Math.round(gameList.art.width),
          height: Math.round(gameList.art.height),
          from: game.art[0],
          to: game.art[1],
        })}
        alt={`${game.title} cover`}
        radius={gameList.art.height * 0.05}
        shadow="0 8px 24px rgba(0,0,0,0.5)"
      />

      <div
        style={{
          ...place({ ...gameList.detailTitle, font: layout.gameList.detailTitle.height / 1.4 }),
          color: PALETTE.text,
          fontWeight: 700,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {game.title}
      </div>

      <div
        style={{
          ...place({ ...gameList.detailMeta, font: gameList.detailMeta.height / 1.6 }),
          color: PALETTE.muted,
          textAlign: 'center',
        }}
      >
        {SYSTEM_NAME} &middot; {game.year}
      </div>

      <div style={{ ...place(layout.footer), background: PALETTE.panel }} />
      <HelpBar
        box={{
          left: layout.footerPaddingX,
          top: layout.footer.top,
          width: layout.footer.width - layout.footerPaddingX * 2,
          height: layout.footer.height,
        }}
        items={[
          { glyph: 'a', label: 'Launch' },
          { glyph: 'b', label: 'Back' },
        ]}
        colors={{ fg: PALETTE.muted, badgeBg: PALETTE.accent }}
        font={layout.footerFont}
        badge="plain"
        gap={layout.footerFont * 1.6}
        bold
      />
    </>
  )
}
