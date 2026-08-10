/**
 * PORTING NOTES
 * CFW: Elementerial, an EmulationStation theme by mluizvitor
 * Devices: rg35xx, rg-cubexx, rg351m, rg552
 * Source: settings/display/view-general.xml
 * Mode: reproduce
 *
 * The three list views share a header and a backdrop and differ in what sits beside the list:
 *   - basic     full-width list, no metadata
 *   - detailed  narrow list, cover art, wordmark, star rating, and a description on 1:1 only
 *   - video     cover-filled art behind a diagonal scrim, wordmark left, shorter list below
 *
 * Focus & selection:
 *   - Selected row fills with the accent colour. No scroll animation - the engine's list snaps.
 * Buttons:
 *   - Up/Down: move. A: back to the system list. Select: options. Start: menu.
 */
import { AnchoredImage } from '../../../widgets/AnchoredImage'
import { Scrim } from '../../../widgets/Scrim'
import { StarRating } from '../../../widgets/StarRating'
import { place } from '../../../layout/box'
import { scrimMask, systemBackdrop } from '../assets'
import { marquee, screenshot, STAR_EMPTY, STAR_FILLED } from '../art'
import { describe, type ElementerialGame, type ElementerialSystem } from '../library'
import { GameRows } from './GameRows'
import type { ElementerialLayout } from '../layout'

export interface ListViewProps {
  readonly layout: ElementerialLayout
  readonly system: ElementerialSystem
  readonly games: readonly ElementerialGame[]
  readonly selectedIndex: number
  /** The scheme's accent pair, used to tint the generated artwork. */
  readonly art: { accent: string; sect: string }
}

/**
 * The system backdrop and its scrim.
 *
 * Every gamelist view draws the backdrop. The list and grid views scrim it so text reads over
 * it; the video and elementflix views pass `null` and scrim the top-right window instead, at a
 * positive z, so the backdrop shows through unaltered wherever the game art does not reach.
 */
export function Backdrop({ layout, system, kind }: { layout: ElementerialLayout; system: ElementerialSystem; kind: 'basic' | null }) {
  const mask = kind ? scrimMask(layout.ratio, kind) : null

  return (
    <>
      <img
        className="el-cover-list"
        src={systemBackdrop(system.theme)}
        alt=""
        style={{ ...place(layout.gamelist.coverList), zIndex: -5 }}
      />
      {kind ? (
        <Scrim
          box={{ left: 0, top: 0, width: layout.w, height: layout.h }}
          mode={mask ? 'mask' : 'wash'}
          color="var(--bgColor)"
          src={mask ?? undefined}
          z={-4}
        />
      ) : null}
    </>
  )
}

function ScreenTitle({ layout, text, box }: { layout: ElementerialLayout; text: string; box: { left: number; top: number; width: number; font: number } }) {
  return (
    <div
      className="el-logo-text"
      style={{
        // The resolved top is the centre line; the source anchors this at origin [0, 0.5].
        ...place({
          left: box.left,
          top: box.top - box.font * 0.6,
          width: box.width,
          height: box.font * 1.2,
          font: box.font,
        }),
        zIndex: 5,
      }}
      data-screen-w={layout.w}
    >
      {text}
    </div>
  )
}

export function BasicView({ layout, system, games, selectedIndex }: ListViewProps) {
  return (
    <>
      <Backdrop layout={layout} system={system} kind="basic" />
      <ScreenTitle layout={layout} text={system.fullName} box={layout.gamelist.logoText} />
      <GameRows box={layout.basic.list} games={games} selectedIndex={selectedIndex} font={layout.font.body} />
    </>
  )
}

export function DetailedView({ layout, system, games, selectedIndex, art }: ListViewProps) {
  const game = games[Math.min(selectedIndex, games.length - 1)]!
  const withSystem = { ...game, system: system.theme }
  const description = layout.detailed.md_description

  return (
    <>
      <Backdrop layout={layout} system={system} kind="basic" />
      <ScreenTitle layout={layout} text={system.fullName} box={layout.gamelist.logoText} />
      <GameRows box={layout.detailed.list} games={games} selectedIndex={selectedIndex} font={layout.font.body} />

      <AnchoredImage
        className="el-md-image"
        box={{
          posX: layout.detailed.md_image.posX,
          posY: layout.detailed.md_image.posY,
          originX: layout.detailed.md_image.originX,
          originY: layout.detailed.md_image.originY,
          maxWidth: layout.detailed.md_image.width,
          maxHeight: layout.detailed.md_image.height,
          radius: layout.detailed.md_image.radius,
          z: 5,
        }}
        src={screenshot(withSystem, art.accent, art.sect)}
        alt=""
      />

      <AnchoredImage
        className="el-md-marquee"
        box={{
          posX: layout.detailed.md_marquee.posX,
          posY: layout.detailed.md_marquee.posY,
          originX: layout.detailed.md_marquee.originX,
          originY: layout.detailed.md_marquee.originY,
          maxWidth: layout.detailed.md_marquee.width,
          maxHeight: layout.detailed.md_marquee.height,
          z: 6,
        }}
        src={marquee(withSystem)}
        alt={game.name}
      />

      <StarRating
        box={{ left: layout.detailed.md_rating.left, top: layout.detailed.md_rating.top }}
        rating={game.rating}
        size={layout.detailed.md_rating.size}
        color="var(--sectColor)"
        filledSvg={STAR_FILLED}
        emptySvg={STAR_EMPTY}
        z={5}
      />

      {/* Only the 1:1 aspect turns the description on; the others resolve it to null. */}
      {description ? (
        <div
          className="el-md-description"
          style={{
            ...place({ ...description, font: description.font }),
            lineHeight: 1.25,
            zIndex: 5,
          }}
        >
          {describe(game)}
        </div>
      ) : null}
    </>
  )
}

export function VideoView({ layout, system, games, selectedIndex, art }: ListViewProps) {
  const game = games[Math.min(selectedIndex, games.length - 1)]!
  const withSystem = { ...game, system: system.theme }
  const mask = scrimMask(layout.ratio, 'video')

  return (
    <>
      {/*
        The system backdrop is still there underneath, unscrimmed - it shows wherever the game
        art does not reach. The video view fills its art rather than banding it, and the diagonal
        scrim sits above the art but below the list, which is why the art carries its own
        negative z rather than sitting at the backdrop's.
      */}
      <Backdrop layout={layout} system={system} kind={null} />

      <img
        className="el-md-image"
        src={screenshot(withSystem, art.accent, art.sect)}
        alt=""
        style={{ ...place(layout.video.md_image), objectFit: 'cover', zIndex: -1 }}
      />

      <Scrim
        box={{ left: 0, top: 0, width: layout.w, height: layout.h }}
        mode={mask ? 'mask' : 'wash'}
        color="var(--bgColor)"
        src={mask ?? undefined}
        z={4}
      />

      <AnchoredImage
        className="el-md-marquee"
        box={{
          posX: layout.video.md_marquee.posX,
          posY: layout.video.md_marquee.posY,
          originX: layout.video.md_marquee.originX,
          originY: layout.video.md_marquee.originY,
          maxWidth: layout.video.md_marquee.width,
          maxHeight: layout.video.md_marquee.height,
          z: 5,
        }}
        src={marquee(withSystem)}
        alt={game.name}
      />

      <ScreenTitle layout={layout} text={system.fullName} box={layout.video.logoText} />
      <GameRows box={layout.video.list} games={games} selectedIndex={selectedIndex} font={layout.font.body} />
    </>
  )
}
