/**
 * PORTING NOTES
 * CFW: Example OS (fictional launcher, used as the scaffold reference)
 * Devices: every device in the registry - the layout resolves from fractions
 * Source: n/a - this is a template, not a reproduction of a real firmware
 * Mode: design-new
 *
 * Layout:
 *   - Header: title left, clock and battery right, accent rule beneath.
 *   - Body: a single vertical menu list.
 *   - Footer: button hint strip on the panel colour.
 * Colors:
 *   - background, panel, accent, text, muted from `palette.ts`.
 * Typography:
 *   - System sans placeholder. A real theme embeds the firmware font with @font-face
 *     from its own asset directory and matches the source's sizes.
 * Focus & selection:
 *   - The selected row fills with the accent colour and shifts right; its icon tile inverts.
 *   - Vertical wrap. Default focus on the first row.
 * Buttons:
 *   - A: open the focused item. B: no-op on the root menu. D-pad up/down: move selection.
 * Transitions:
 *   - Selection is instant. The row itself carries a 50ms nudge.
 * Notes:
 *   - Only "Games" leads anywhere; the other rows are inert placeholders, as in the original.
 */
import { Clock } from '../../../widgets/Clock'
import { HeaderBar } from '../../../widgets/HeaderBar'
import { HelpBar } from '../../../widgets/HelpBar'
import { StatusIndicators } from '../../../widgets/StatusIndicators'
import { TextList } from '../../../widgets/TextList'
import { place } from '../../../layout/box'
import { MENU } from '../data'
import { PALETTE } from '../palette'
import type { ExampleLayout } from '../layout'

export interface MainMenuProps {
  readonly layout: ExampleLayout
  readonly selectedIndex: number
}

export function MainMenu({ layout, selectedIndex }: MainMenuProps) {
  return (
    <>
      <HeaderBar
        box={layout.header}
        title="Example"
        titleAccent="OS"
        titleFont={layout.titleFont}
        color={PALETTE.text}
        accentColor={PALETTE.accent}
        paddingX={layout.paddingX}
        ruleHeight={layout.rule.height}
        ruleColor={PALETTE.accent}
        ruleInsetX={layout.paddingX}
      />

      <Clock
        box={layout.headerClock}
        font={layout.statusFont}
        color={PALETTE.muted}
        format="24h"
      />
      <StatusIndicators
        box={layout.headerStatus}
        size={layout.statusFont}
        gap={layout.statusFont * 0.85}
        font={layout.statusFont}
        color={PALETTE.accent}
        items={[{ kind: 'text', key: 'battery', text: '85%' }]}
      />

      <TextList
        box={layout.menu.box}
        items={MENU.map((entry) => ({
          key: entry.key,
          label: entry.label,
          sublabel: entry.sublabel,
          icon: entry.icon,
        }))}
        selectedIndex={selectedIndex}
        rowHeight={layout.menu.rowHeight}
        gap={layout.menu.gap}
        labelFont={layout.menu.labelFont}
        sublabelFont={layout.menu.sublabelFont}
        iconSize={layout.menu.iconSize}
        rowPaddingX={layout.menu.rowPaddingX}
        rowRadius={layout.menu.rowRadius}
        selectedShiftX={layout.menu.selectedShiftX}
        rowTransition={[{ property: 'transform', duration: 50, easing: 'ease' }]}
        colors={{
          fg: PALETTE.text,
          sublabelFg: PALETTE.muted,
          selectedFg: PALETTE.onAccent,
          selectedBg: PALETTE.accent,
          selectedSublabelFg: PALETTE.onAccentMuted,
          iconBg: PALETTE.tile,
          iconFg: PALETTE.tileText,
          selectedIconBg: PALETTE.onAccent,
          selectedIconFg: PALETTE.accent,
        }}
      />

      <div style={{ ...place(layout.footer), background: PALETTE.panel }} />
      <HelpBar
        box={{
          left: layout.footerPaddingX,
          top: layout.footer.top,
          width: layout.footer.width - layout.footerPaddingX * 2,
          height: layout.footer.height,
        }}
        items={[
          { glyph: 'a', label: 'Open' },
          { glyph: 'b', label: 'Back' },
          { glyph: 'start', label: 'Menu' },
        ]}
        colors={{ fg: PALETTE.muted, badgeBg: PALETTE.accent }}
        font={layout.footerFont}
        badge="plain"
        gap={layout.footerHintGap}
      />
    </>
  )
}
