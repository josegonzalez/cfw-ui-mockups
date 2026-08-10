/**
 * PORTING NOTES
 * CFW: Elementerial, an EmulationStation theme by mluizvitor
 * Devices: rg35xx, rg-cubexx, rg351m, rg552
 * Source: settings/display/view-menu.xml - fonts, colours, panel artwork and icons only
 * Mode: reproduce, with approximated geometry
 *
 * The panel's position and size are an **approximation**. The source themes only the menu's
 * fonts, colours, artwork and icon set; the panel's own geometry belongs to EmulationStation's
 * menu component, so there is nothing in the theme to transcribe. The fractions are modelled on
 * the equivalent Batocera menu.
 *
 * Layout:
 *   - A sixty-percent black shade over the view beneath, then a centred panel.
 *   - Grouped rows with masked icons, values, toggles and one bordered button.
 * Focus & selection:
 *   - Group headings are not cursor stops. The selected row inverts, and its icon inverts with it.
 * Buttons:
 *   - Up/Down: move. A: activate. B: close.
 */
import { MenuPanel, type MenuEntry } from '../../../widgets/MenuPanel'
import { menuIcon, switchIcon } from '../assets'
import type { ElementerialLayout } from '../layout'

/**
 * The entries mirror Batocera's main menu; the icon names are the theme's own `menuIcons`
 * mapping from `view-menu.xml`.
 */
export const MENU_ENTRIES: readonly MenuEntry[] = [
  { kind: 'group', key: 'g-settings', label: 'Settings' },
  { kind: 'row', key: 'system', label: 'System settings', icon: 'cog' },
  { kind: 'row', key: 'games', label: 'Games settings', icon: 'gamepad-square' },
  { kind: 'row', key: 'ui', label: 'User interface settings', icon: 'brush', value: 'Elementerial' },
  { kind: 'row', key: 'sound', label: 'Sound settings', icon: 'volume-high', toggle: true, on: true },
  { kind: 'row', key: 'controllers', label: 'Controllers settings', icon: 'gamepad-round' },
  { kind: 'row', key: 'network', label: 'Network settings', icon: 'wifi-strength-3', value: 'Connected' },
  { kind: 'group', key: 'g-content', label: 'Content' },
  { kind: 'row', key: 'scraper', label: 'Scraper', icon: 'image' },
  { kind: 'row', key: 'achievements', label: 'Retroachievements', icon: 'trophy', toggle: true, on: false },
  { kind: 'row', key: 'kodi', label: 'Kodi media center', icon: 'kodi', button: true, value: 'Launch' },
  { kind: 'group', key: 'g-system', label: 'System' },
  { kind: 'row', key: 'updates', label: 'Updates and downloads', icon: 'update' },
  { kind: 'row', key: 'advanced', label: 'Advanced settings', icon: 'library-shelves' },
  { kind: 'row', key: 'restart', label: 'Restart system', icon: 'restart' },
  { kind: 'row', key: 'shutdown', label: 'Shutdown', icon: 'power' },
  { kind: 'row', key: 'quit', label: 'Quit', icon: 'exit-to-app' },
]

export interface MenuViewProps {
  readonly layout: ElementerialLayout
  readonly selectedIndex: number
}

export function MenuView({ layout, selectedIndex }: MenuViewProps) {
  const m = layout.menu

  return (
    <MenuPanel
      left={m.left}
      width={m.width}
      maxHeight={m.maxHeight}
      screenWidth={layout.w}
      screenHeight={layout.h}
      title="MAIN MENU"
      footer="ELEMENTERIAL"
      entries={MENU_ENTRIES}
      selectedIndex={selectedIndex}
      padding={m.padding}
      radius={m.radius}
      titleHeight={m.titleHeight}
      titleFont={m.titleFont}
      rowHeight={m.rowHeight}
      rowFont={m.rowFont}
      groupHeight={m.groupHeight}
      groupFont={m.groupFont}
      footerHeight={m.footerHeight}
      footerFont={m.footerFont}
      iconSize={m.icon}
      iconUrl={menuIcon}
      switchUrl={switchIcon}
      colors={{
        panel: 'var(--bgColor)',
        fg: 'var(--fgColor)',
        mutedFg: 'var(--fgColor-80)',
        valueFg: 'var(--sectColor)',
        selectedFg: 'var(--onMainColor)',
        selectedBg: 'var(--mainColor)',
        groupFg: 'var(--sectColor)',
        groupBg: 'var(--sectColor-10)',
        groupRule: 'var(--sectColor-60)',
        rowRule: 'var(--fgColor-5)',
        // The theme's shade artwork is a flat sixty-percent black over the whole screen.
        shade: 'rgba(0, 0, 0, 0.6)',
        // Scheme-independent in the source, like the boxes caption and the clock.
        buttonBorder: '#666666',
        buttonSelectedBg: '#ffffff',
        buttonSelectedFg: '#000000',
      }}
    />
  )
}
