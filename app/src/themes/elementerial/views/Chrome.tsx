import { Clock } from '../../../widgets/Clock'
import { HelpBar, type HelpItem } from '../../../widgets/HelpBar'
import { Scrim } from '../../../widgets/Scrim'
import { StatusIndicators } from '../../../widgets/StatusIndicators'
import { place } from '../../../layout/box'
import { borderOverlay, osdOverlay, statusIcon } from '../assets'
import type { ElementerialLayout } from '../layout'

/**
 * The help hints.
 *
 * These strings come from EmulationStation itself rather than from the theme, and are
 * transcribed from the reference screenshots.
 */
export const HELP: Record<'system' | 'gamelist', readonly HelpItem[]> = {
  system: [
    { glyph: 'start', label: 'MENU' },
    { glyph: 'a', label: 'NAVIGATION BAR' },
    { glyph: 'y', label: 'SEARCH/RANDOM' },
    { glyph: 'x', label: 'NETPLAY' },
  ],
  gamelist: [
    { glyph: 'select', label: 'OPTIONS' },
    { glyph: 'start', label: 'MENU' },
    { glyph: 'a', label: 'BACK' },
    { glyph: 'y', label: 'SEARCH/RANDOM' },
  ],
}

export interface ChromeProps {
  readonly layout: ElementerialLayout
  /** `none` draws no hints at all, which is what the engine does behind the menu. */
  readonly which: 'system' | 'gamelist' | 'none'
}

/**
 * What sits on top of every view: the hint bar, the clock, the status glyphs, the controller
 * activity dots, and the two overlays that shape the panel.
 *
 * The overlays are resolved wherever the artwork exists. The original's stylesheet had no rule
 * for the 5:3 aspect, so on that device neither the rounded-corner border nor the on-screen
 * display background ever drew, despite both files shipping. See `docs/porting/elementerial.md`.
 */
export function Chrome({ layout, which }: ChromeProps) {
  const border = borderOverlay(layout.ratio)
  const osd = osdOverlay(layout.osdRatio)
  const full = { left: 0, top: 0, width: layout.w, height: layout.h }

  return (
    <>
      {/*
        The resolved `top` is the bar's centre line, because the source anchors it at origin
        [0, 0.5]. Centring by adjusting the box keeps the geometry in numbers rather than
        relying on a CSS transform a non-DOM renderer could not apply.
      */}
      {which === 'none' ? null : (
        <HelpBar
          box={{
            left: layout.screen.help.left,
            top: layout.screen.help.top - layout.screen.help.font,
            width: layout.w - layout.screen.help.left,
            height: layout.screen.help.font * 2,
            // Above the video view's diagonal scrim at 4, which would wash the bar out.
            z: 20,
          }}
          items={HELP[which]}
          colors={{
            fg: 'var(--fgColor)',
            badgeBg: 'var(--sectColor)',
            badgeFg: 'var(--bgColor)',
          }}
          font={layout.screen.help.font}
          gap={layout.screen.help.font * 0.85}
          fontFamily="'RobotoCondensed', 'Roboto Condensed', system-ui, sans-serif"
          uppercase
        />
      )}

      <div
        className="el-activity"
        style={{
          ...place({
            left: layout.screen.activity.left,
            top: layout.screen.activity.top,
            width: layout.screen.activity.size * 2 + layout.screen.activity.itemSpacing,
            height: layout.screen.activity.size,
          }),
          gap: `${layout.screen.activity.itemSpacing}px`,
          zIndex: 101,
        }}
        aria-hidden="true"
      >
        <span style={{ width: layout.screen.activity.size, height: layout.screen.activity.size }} />
        <span style={{ width: layout.screen.activity.size, height: layout.screen.activity.size }} />
      </div>

      <Clock
        box={{
          left: layout.screen.clock.left,
          top: layout.screen.clock.top - layout.screen.clock.font,
          width: layout.screen.clock.width,
          height: layout.screen.clock.font * 2,
          // The status bar reads over the OSD scrim at 100, not under it.
          z: 101,
        }}
        font={layout.screen.clock.font}
        color="#ffffff"
        align="right"
      />

      <StatusIndicators
        box={{
          left: layout.screen.battery.left,
          top: layout.screen.battery.top,
          width: layout.w - layout.screen.battery.left,
          height: layout.screen.battery.size,
          z: 101,
        }}
        size={layout.screen.battery.size}
        gap={layout.screen.battery.itemSpacing}
        align="left"
        items={[
          {
            kind: 'icon',
            key: 'wifi',
            src: statusIcon(layout.screen.battery.icons, 'wifi=on'),
            alt: 'wifi',
          },
          {
            kind: 'icon',
            key: 'battery',
            src: statusIcon(layout.screen.battery.icons, 'battery=full'),
            alt: 'battery full',
          },
        ]}
      />

      {osd ? <Scrim box={full} mode="image" src={osd} z={100} /> : null}
      {border ? <Scrim box={full} mode="image" src={border} z={100} /> : null}
    </>
  )
}
