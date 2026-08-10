/**
 * PORTING NOTES
 * CFW: PlayStation X, a Batocera EmulationStation theme by pajarorrojo
 * Devices: trimui-smart-pro, rg35xx, rg34xx, rg552
 * Source: _theme_views/front.xml, systemcarousels/carousel-ps{3,4,5}.xml,
 *         carousel-sizes/{big,medium,small}.xml
 * Mode: reproduce
 *
 * The system chooser: a horizontal strip of square covers with a selection frame that never
 * moves, the system's name and description, and its console render bottom-right.
 *
 * Layout:
 *   - Three carousel types and three sizes, which between them change tile size, zoom,
 *     neighbour dimming, corner rounding and the position of every text block. PS3 alone moves
 *     the title hard left, which is its XMB heritage.
 * Focus & selection:
 *   - The selected tile scales by `logoScale` (1.48 to 2.0) and its neighbours dim to
 *     `minLogoOpacity` - 0.7 on PS4 and PS5, 1.0 on PS3, which does not dim at all.
 * Buttons:
 *   - Left/Right change system. A enters the game list, which is what fires the launch flourish.
 * Transitions:
 *   - The strip slides over 600ms; the tiles rise from half a screen below on entry; the name,
 *     description and console each have their own entrance.
 */
import { useStoryboard } from '../../../anim/useStoryboard'
import { place } from '../../../layout/box'
import { boxOf, textLine } from './Chrome'
import { MarcoActivo, StartPill } from './parts'
import { caratula, consoleArt, systemLogo } from '../assets'
import { SYSTEMS } from '../library'
import { STORYBOARDS } from '../storyboards'
import type { ColorSet } from '../palette'
import type { PsxSystem } from '../library'
import type { PsxLayout } from '../layout'

export interface SystemViewProps {
  readonly layout: PsxLayout
  readonly system: PsxSystem
  readonly selectedIndex: number
  readonly colorset: ColorSet
  readonly carouselType: string
}

export function SystemView({
  layout,
  system,
  selectedIndex,
  colorset,
  carouselType,
}: SystemViewProps) {
  const L = layout.system
  const C = L.carousel

  const {
    attach: stripRef,
    style: stripStyle,
    className: stripClass,
  } = useStoryboard(STORYBOARDS.systemcarousel, '_')
  const {
    attach: nameRef,
    style: nameStyle,
    className: nameClass,
  } = useStoryboard(STORYBOARDS.system_name, '_')
  const {
    attach: descRef,
    style: descStyle,
    className: descClass,
  } = useStoryboard(STORYBOARDS.system_description, '_')
  const {
    attach: conRef,
    style: conStyle,
    className: conClass,
  } = useStoryboard(STORYBOARDS['system-console'], '_')

  /* Tile pitch: the tile edge plus the gap the scaled selection needs. */
  const pitch = C.tile * 1.08

  /*
   * Scroll so the selected tile lands under the frame. The strip's own left is the carousel's
   * authored (negative) x and the frame sits at marcoActivo's authored x, so the shift is the
   * gap between them less the tile's offset in the strip - then centred, because the frame is
   * the scaled footprint and the tile is not.
   */
  const shift = L.marcoActivo.left - C.left - selectedIndex * pitch + (L.marcoActivo.w - C.tile) / 2

  const consoleSrc = system.hasConsole ? consoleArt(system.theme) : null
  const logoSrc = system.hasLogo ? systemLogo(system.theme, !!system.isCollection) : null

  return (
    <>
      {/*
        Two elements. The storyboard drives the outer one through the transform channels, and
        the scroll is a plain translate on the inner one - an inline `transform` on the animated
        element would replace the recomposed transform outright and the entry rise would never
        be seen. The source splits it the same way.
      */}
      <div
        ref={stripRef}
        className={stripClass}
        style={{
          ...stripStyle,
          position: 'absolute',
          left: `${C.left}px`,
          top: `${C.top}px`,
          height: `${C.h}px`,
          zIndex: C.z,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translateX(${shift}px)`,
            transition: 'transform 600ms cubic-bezier(0,0,0.58,1)',
          }}
        >
          {SYSTEMS.map((s, i) => {
            const selected = i === selectedIndex
            const cover = caratula(s.theme, colorset)

            return (
              <div
                key={s.theme}
                className="psx-systile"
                data-selected={selected || undefined}
                style={{
                  left: `${i * pitch}px`,
                  width: `${C.tile}px`,
                  height: `${C.tile}px`,
                  ...(C.roundCorners ? { borderRadius: `${C.roundCorners * 100}%` } : {}),
                  transform: `scale(${selected ? C.scale : 1})`,
                  opacity: selected ? 1 : C.minLogoOpacity,
                  zIndex: selected ? 3 : 1,
                  transition:
                    'transform 600ms cubic-bezier(0,0,0.58,1), opacity 600ms cubic-bezier(0,0,0.58,1)',
                }}
              >
                {cover ? (
                  <img
                    src={cover}
                    alt={s.fullName}
                    /*
                     * PS3 ships a desaturated icon set - `<saturation>0</saturation>`. The 351-file
                     * set is not copied, so the filter approximates it.
                     */
                    style={carouselType === 'PS3' ? { filter: 'saturate(0)' } : undefined}
                  />
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      <MarcoActivo node={L.marcoActivo} ps5={carouselType === 'PS5'} event="_" />
      <StartPill view={L} />

      <div
        ref={nameRef}
        className={`psx-el psx-glow ${nameClass}`}
        /*
          `system_name` is authored `size 0.6 0.001`, so it has no box to centre in and the line
          is centred on its y instead. Placed as a literal box it is half a pixel tall.
        */
        style={{
          ...textLine(L.systemName),
          ...nameStyle,
          fontFamily: "'SST Light', 'SST', sans-serif",
          fontWeight: 300,
        }}
      >
        {system.fullName}
      </div>

      <div
        className="psx-row"
        style={{
          ...place({ ...boxOf(L.systemData), font: L.systemData.font }),
          gap: `${(L.systemData.separator ?? 0.007) * layout.w}px`,
          zIndex: L.systemData.z,
        }}
      >
        <span>{String(system.hardwareType).toUpperCase()}</span>
        {system.releaseYear ? (
          <>
            <span>•</span>
            <span>{system.releaseYear}</span>
          </>
        ) : null}
        <span>•</span>
        <span>{String(system.manufacturer).toUpperCase()}</span>
      </div>

      <div
        ref={descRef}
        className={`psx-desc psx-glow ${descClass}`}
        style={{
          ...place({ ...boxOf(L.systemDesc), font: L.systemDesc.font }),
          ...descStyle,
          zIndex: L.systemDesc.z,
        }}
      >
        {system.description}
      </div>

      {consoleSrc ? (
        <img
          ref={conRef}
          className={`psx-img ${conClass}`}
          style={{
            ...place(boxOf(L.console)),
            ...conStyle,
            zIndex: L.console.z,
            objectPosition: 'bottom',
          }}
          src={consoleSrc}
          alt=""
        />
      ) : null}

      {logoSrc ? (
        <img
          className="psx-img"
          style={{ ...place(boxOf(L.logo2)), zIndex: L.logo2.z }}
          src={logoSrc}
          alt=""
        />
      ) : null}
    </>
  )
}
