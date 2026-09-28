import { createContext, use, useMemo, type ReactNode } from 'react'
import { Animated } from '../../../anim/Animated'
import type { StoryboardMap } from '../../../anim/types'
import { channelImg } from '../assets'
import type { ChannelId } from '../library'
import { LOOPS } from '../motion'
import { PALETTE } from '../palette'
import { abs, Img, loop, Text, type Box, type Breakpoint } from './parts'

/**
 * PORTING NOTES
 * CFW: Wii Menu (System Menu 4.3U)   Devices: rg35xx
 * Source: closed; each channel's own banner and icon are separate titles on the console. Built from
 *         WM4K's redrawn pieces of each (`Channels/<name>/`), compared with the previews in
 *         `docs/themes/wii-menu/reference/frames/preview-*.png`.
 * Mode: reproduce
 *
 * Layout:        An icon fills a 120x90 slot; a banner fills the preview panel above its grey band,
 *                585x332.
 * Focus & selection: none here - the grid and preview draw focus around these.
 * Buttons:       none.
 * Transitions:   Each stock icon loops as `v43` shows it on the grid: the disc turns edge-on every
 *                6s; the Mii faces cross-fade with the Mii logo; the Photo Channel's photos slide
 *                back in over bare cork; the Wii Shop's tiles and bag fade out and back; the
 *                Internet Channel's name gives way to "i" and "internet" wiping in; Everybody Votes
 *                and Check Mii Out alternate their logo with the WiiConnect24 icon; the Forecast
 *                Channel alternates with the weathernews logo. Nintendo and News are still. Each
 *                loop starts on the picture the stills show. Banners are still; their content
 *                fades up over their background as a preview opens or steps.
 * Notes:         Every banner is a stand-in assembled from the channel's own textures and its
 *                real title and text, not the channel's banner file; the ones that show live data
 *                (Forecast, News) show the text they show before the first download. Each icon
 *                loop is rebuilt from the same pieces with the measured timings; WM4K has no
 *                WiiConnect24 icon, so it is drawn, and the Internet Channel's letter wipe is
 *                letters fading in one by one.
 */

const fill = (b: Box): Box => ({ x: 0, y: 0, w: b.w, h: b.h })

/**
 * How a banner's content comes up: after `delay`, over `duration`. The banner's background is there
 * from the start - it is what `v43` shows at once when stepping between channels - so only what is
 * drawn over it waits. Icons have none.
 */
export interface Reveal {
  readonly delay: number
  readonly duration: number
}
const RevealContext = createContext<Reveal | null>(null)

function Frame({ box, background, children }: { box: Box; background: string; children: ReactNode }) {
  const reveal = use(RevealContext)
  const sb = useMemo<StoryboardMap | null>(
    () =>
      reveal
        ? { open: { animations: [{ property: 'opacity', from: 0, begin: reveal.delay, duration: reveal.duration, mode: 'linear' }] } }
        : null,
    [reveal],
  )
  return (
    <div style={{ ...abs(box), background, overflow: 'hidden' }}>
      {sb ? (
        <Animated storyboard={sb} event="open" style={abs(fill(box))}>
          {children}
        </Animated>
      ) : (
        children
      )}
    </div>
  )
}

/** The Mii faces, in a fixed order so every capture of the crowd is the same crowd. */
const FACES = [3, 7, 1, 12, 5, 9, 14, 2, 10, 6, 15, 4, 8, 13, 11]
const face = (i: number) => channelImg(`mii-face-${FACES[i % FACES.length]}`)

/** The small "Nintendo" badge in a banner's top-right corner. */
function NintendoBadge({ x, y, dark = false }: { x: number; y: number; dark?: boolean }) {
  const ink = dark ? '#ffffff' : '#444444'
  return (
    <div style={{ ...abs({ x, y, w: 92, h: 22 }), border: `2px solid ${ink}`, borderRadius: 11, boxSizing: 'border-box' }}>
      <Text box={{ x: 0, y: 0, w: 88, h: 18 }} size={13} weight={700} color={ink}>
        Nintendo
      </Text>
    </div>
  )
}

/* ---- icons: what a grid slot shows ---- */

/*
 * Each stock icon loops, as `v43` shows them on the grid (`LOOPS` in `motion.ts` has the timings).
 * A loop is a set of layers, each driven by its own looping storyboard over the same period so they
 * stay in step; every one starts on the picture the stills show.
 */

const on = (t: number, v: number, mode?: Breakpoint[2]): Breakpoint => (mode ? [t, v, mode] : [t, v])

/** The disc turns edge-on and round again, face-on the rest of the time. */
const DISC_LOOP = (() => {
  const { period, turn } = LOOPS.disc
  const q = turn / 4
  // A turn about the vertical axis reads as cos: slow to leave face-on, quick through edge-on.
  return loop(period, {
    scaleX: [on(0, 1), on(period - turn, 1, 'easeIn'), on(period - turn + q, 0.04, 'easeOut'), on(period - turn + 2 * q, -1, 'easeIn'), on(period - turn + 3 * q, 0.04, 'easeOut'), on(period, 1)],
  })
})()

/**
 * Two layers cross-fading: `a` holds `aHold`, fades to `b` over `ab`, `b` holds `bHold`, and fades
 * back over what is left of `period`.
 */
function swap(period: number, aHold: number, ab: number, bHold: number) {
  const a: Breakpoint[] = [on(0, 1), on(aHold, 1), on(aHold + ab, 0), on(aHold + ab + bHold, 0), on(period, 1)]
  const b: Breakpoint[] = [on(0, 0), on(aHold, 0), on(aHold + ab, 1), on(aHold + ab + bHold, 1), on(period, 0)]
  return { a: loop(period, { opacity: a }), b: loop(period, { opacity: b }) }
}

const MII = swap(LOOPS.mii.period, LOOPS.mii.faces, LOOPS.mii.toLogo, LOOPS.mii.logo)
const FORECAST = swap(LOOPS.forecast.period, LOOPS.forecast.name, LOOPS.forecast.cross, LOOPS.forecast.logo)

/** Everybody Votes and Check Mii Out: the logo, a blank, the WiiConnect24 icon, a blank, the logo. */
function wc24(offset: number) {
  const w = LOOPS.wc24
  const logoOut = w.logo
  const blankFrom = logoOut + w.out
  const iconIn = blankFrom + w.blank
  const iconFull = iconIn + w.iconIn
  const iconOut = iconFull + w.icon
  const iconGone = iconOut + w.iconOut
  const logoIn = iconGone + w.gap
  return {
    logo: loop(w.period, { opacity: [on(0, 1), on(logoOut, 1), on(blankFrom, 0), on(logoIn, 0), on(w.period, 1)] }, offset),
    icon: loop(w.period, { opacity: [on(0, 0), on(iconIn, 0), on(iconFull, 1), on(iconOut, 1), on(iconGone, 0), on(w.period, 0)] }, offset),
  }
}
// Both loops start partway into the logo's hold, so a still shows each logo; Check Mii Out lags.
const VOTES = wc24(1000)
const CMOC = wc24(1000 - LOOPS.cmocLag)

/** The Photo Channel: cards and label, the icon fading to cork, the photos sliding back in, the label. */
const PHOTO = (() => {
  const p = LOOPS.photo
  const gone = p.hold + p.out
  const firstIn = gone + p.cork
  const cards = [0, 1, 2].map((i) => {
    const at = firstIn + i * p.apart
    return loop(p.period, {
      opacity: [on(0, 1), on(p.hold, 1), on(gone, 0), on(at, 0), on(at + p.slide / 2, 1), on(p.period, 1)],
      // Invisible until its slide, the card jumps to 30px left of its place and slides in from there.
      offsetX: [on(0, 0), on(at, 0), on(at, -30 / 640, 'easeOut'), on(at + p.slide, 0), on(p.period, 0)],
    })
  })
  const labelAt = firstIn + 2 * p.apart + p.slide + p.labelAfter
  const label = loop(p.period, { opacity: [on(0, 1), on(p.hold, 1), on(gone, 0), on(labelAt, 0), on(labelAt + p.label, 1), on(p.period, 1)] })
  return { cards, label }
})()

/** The Wii Shop Channel: bag and tiles, fading away, blank, the tiles one by one, then the bag. */
const SHOP = (() => {
  const p = LOOPS.shop
  const gone = p.hold + p.out
  const tilesFrom = gone + p.blank
  const tiles = [0, 1, 2, 3, 4, 5].map((i) => {
    const at = tilesFrom + (i * (p.tiles - 400)) / 5
    return loop(p.period, { opacity: [on(0, 1), on(p.hold, 1), on(gone, 0), on(at, 0), on(at + 400, 1), on(p.period, 1)] })
  })
  const bagAt = p.period - p.bag
  const bag = loop(p.period, { opacity: [on(0, 1), on(p.hold, 1), on(gone, 0), on(bagAt, 0), on(p.period, 1)] })
  return { tiles, bag }
})()

/** The Internet Channel: its name, "i" alone, "internet" letter by letter, then the name again. */
const INTERNET = (() => {
  const p = LOOPS.internet
  const out = p.name + p.out
  const wipeFrom = out + p.dot
  const crossFrom = p.period - p.cross
  const name = loop(p.period, { opacity: [on(0, 1), on(p.name, 1), on(out, 0), on(crossFrom, 0), on(p.period, 1)] })
  const letters = [...'internet'].map((_, i) => {
    const at = i === 0 ? out : wipeFrom + ((i - 1) * p.wipe) / 7
    return loop(p.period, { opacity: [on(0, 0), on(at, 0), on(at + 100, 1), on(crossFrom, 1), on(p.period, 0)] })
  })
  return { name, letters }
})()

/** Nintendo's pictogram for WiiConnect24 news: a blue rounded card of white dots. Drawn - WM4K has none. */
function Wc24Icon({ w, h }: { w: number; h: number }) {
  const card = { x: (w - 56) / 2, y: (h - 44) / 2, w: 56, h: 44 }
  return (
    <div style={{ ...abs(card), borderRadius: 10, background: 'linear-gradient(#35b4f0, #1586d8)', boxShadow: '0 1px 2px rgba(0,0,0,0.25)' }}>
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} style={{ ...abs({ x: 9 + (i % 4) * 10, y: 9 + Math.floor(i / 4) * 10, w: 6, h: 6 }), background: '#ffffff', borderRadius: 1 }} />
      ))}
    </div>
  )
}

/** A layer filling the icon, driven by one loop. */
function Layer({ sb, box, children }: { sb: StoryboardMap; box: Box; children: ReactNode }) {
  return (
    <Animated storyboard={sb} event="_" style={abs(box)}>
      {children}
    </Animated>
  )
}

export function ChannelIcon({ id, box }: { id: ChannelId; box: Box }) {
  const { w, h } = box
  const all: Box = fill(box)
  switch (id) {
    case 'disc':
      return (
        <Frame box={box} background="#ffffff">
          <Layer sb={DISC_LOOP} box={{ x: (w - 66) / 2, y: (h - 66) / 2, w: 66, h: 66 }}>
            <Img src={channelImg('disc-icon')} box={{ x: 0, y: 0, w: 66, h: 66 }} style={{ opacity: 0.8 }} />
          </Layer>
        </Frame>
      )
    case 'mii':
      return (
        <Frame box={box} background="#f3ede4">
          <Layer sb={MII.a} box={all}>
            {Array.from({ length: 12 }, (_, i) => (
              <Img key={i} src={face(i)} box={{ x: (i % 4) * 30 - 2 + (Math.floor(i / 4) % 2) * 8, y: Math.floor(i / 4) * 30 - 4, w: 34, h: 40 }} />
            ))}
          </Layer>
          <Layer sb={MII.b} box={all}>
            <div style={{ ...abs(all), background: '#ffffff' }} />
            <Img src={channelImg('mii-logo')} box={{ x: (w - 84) / 2, y: (h - 50) / 2, w: 84, h: 50 }} />
          </Layer>
        </Frame>
      )
    case 'photo':
      return (
        <Frame box={box} background="#b98b5b">
          <Img src={channelImg('photo-cork')} box={all} style={{ objectFit: 'cover' }} />
          <Layer sb={PHOTO.cards[0]!} box={all}>
            <Img src={channelImg('photo-card-2')} box={{ x: 4, y: 34, w: 44, h: 34 }} style={{ transform: 'rotate(-10deg)' }} />
          </Layer>
          <Layer sb={PHOTO.cards[1]!} box={all}>
            <Img src={channelImg('photo-card-1')} box={{ x: 30, y: 28, w: 50, h: 36 }} style={{ transform: 'rotate(-6deg)' }} />
          </Layer>
          <Layer sb={PHOTO.cards[2]!} box={all}>
            <Img src={channelImg('photo-card-3')} box={{ x: 64, y: 26, w: 52, h: 40 }} style={{ transform: 'rotate(6deg)' }} />
          </Layer>
          <Layer sb={PHOTO.label} box={all}>
            <Text box={{ x: 0, y: 2, w, h: 18 }} size={12} weight={500} color="#ffffff">
              Photo Channel
            </Text>
          </Layer>
        </Frame>
      )
    case 'shop':
      return (
        <Frame box={box} background="#ffffff">
          {SHOP.tiles.map((sb, i) => (
            <Layer key={i} sb={sb} box={all}>
              <Img
                src={channelImg('shop-card')}
                box={{ x: 6 + (i % 3) * 38, y: 6 + Math.floor(i / 3) * 40, w: 30, h: 30 }}
                style={{ opacity: 0.15 }}
              />
            </Layer>
          ))}
          <Layer sb={SHOP.bag} box={all}>
            <Img src={channelImg('shop-bag')} box={{ x: (w - 64) / 2, y: 8, w: 64, h: 48 }} />
            <Img src={channelImg('shop-label')} box={{ x: (w - 96) / 2, y: 60, w: 96, h: 24 }} />
          </Layer>
        </Frame>
      )
    case 'forecast':
      return (
        <Frame box={box} background="#ffffff">
          <Layer sb={FORECAST.a} box={all}>
            <div style={{ ...abs(all), background: 'linear-gradient(#0d44c4, #1f78dc 70%, #0b3aa8)' }} />
            <Text box={{ x: 6, y: 3, w: w - 12, h: 16 }} size={11} weight={500} color="#ffffff" align="left">
              Forecast Channel
            </Text>
          </Layer>
          <Layer sb={FORECAST.b} box={all}>
            <Img src={channelImg('forecast-logo')} box={{ x: (w - 106) / 2, y: (h - 40) / 2, w: 106, h: 40 }} />
          </Layer>
        </Frame>
      )
    case 'news':
      return (
        <Frame box={box} background="linear-gradient(#1f7a1f, #0f5a12)">
          <Img src={channelImg('news-label')} box={{ x: 4, y: 4, w: 100, h: 16 }} />
        </Frame>
      )
    case 'internet':
      return (
        <Frame box={box} background="linear-gradient(#ffffff 55%, #d8f3fb)">
          <Layer sb={INTERNET.name} box={all}>
            <Text box={{ x: 0, y: 20, w, h: 50 }} size={17} weight={500} color="#1f76c8" wrap lineHeight={22}>
              Internet Channel
            </Text>
          </Layer>
          {[...'internet'].map((ch, i) => (
            <Layer key={i} sb={INTERNET.letters[i]!} box={{ x: 14 + i * 12.5, y: 30, w: 14, h: 28 }}>
              <Text box={{ x: 0, y: 0, w: 14, h: 28 }} size={22} weight={700} color="#6cc6ef">
                {ch}
              </Text>
            </Layer>
          ))}
        </Frame>
      )
    case 'votes':
      return (
        <Frame box={box} background="#ffffff">
          <Layer sb={VOTES.logo} box={all}>
            <div style={{ ...abs(all), background: 'linear-gradient(#7fe3e3, #3ec7c9)' }} />
            <Img src={channelImg('votes-label')} box={{ x: (w - 96) / 2, y: (h - 60) / 2, w: 96, h: 60 }} />
          </Layer>
          <Layer sb={VOTES.icon} box={all}>
            <Wc24Icon w={w} h={h} />
          </Layer>
        </Frame>
      )
    case 'cmoc':
      return (
        <Frame box={box} background="#ffffff">
          <Layer sb={CMOC.logo} box={all}>
            <Img src={channelImg('cmoc-label')} box={{ x: (w - 104) / 2, y: (h - 60) / 2, w: 104, h: 60 }} />
          </Layer>
          <Layer sb={CMOC.icon} box={all}>
            <Wc24Icon w={w} h={h} />
          </Layer>
        </Frame>
      )
    case 'nintendo':
      return (
        <Frame box={box} background="#ffffff">
          <Img src={channelImg('nintendo-label')} box={{ x: 0, y: (h - 30) / 2, w, h: 30 }} />
        </Frame>
      )
  }
}

/* ---- banners: the preview panel above its buttons ---- */

export const BANNER = { w: 585, h: 332 } as const


/** A channel's banner; `reveal` fades its content up over its background, as the preview opens or steps. */
export function ChannelBanner({ id, reveal = null }: { id: ChannelId; reveal?: Reveal | null }) {
  return (
    <RevealContext value={reveal}>
      <BannerArt id={id} />
    </RevealContext>
  )
}

function BannerArt({ id }: { id: ChannelId }) {
  const box: Box = { x: 0, y: 0, ...BANNER }
  const { w } = BANNER
  switch (id) {
    case 'disc':
      return (
        <Frame box={box} background="#ffffff">
          <div style={{ ...abs({ x: 0, y: 0, w, h: 22 }), background: 'linear-gradient(#7fd6f4, #3dbbe8)' }} />
          <div
            style={{
              ...abs({ x: 350, y: 0, w: w - 350, h: 60 }),
              background: 'linear-gradient(#7fd6f4, #3dbbe8)',
              borderBottomLeftRadius: 60,
            }}
          />
          <Text box={{ x: 360, y: 31, w: 210, h: 20 }} size={16} weight={500} color="#ffffff" align="right">
            Disc Channel
          </Text>
          <Img src={channelImg('disc-wii')} box={{ x: 144, y: 60, w: 164, h: 164 }} />
          <Img src={channelImg('disc-gamecube')} box={{ x: 332, y: 115, w: 106, h: 106 }} />
          <Text box={{ x: 0, y: 266, w, h: 34 }} size={26} weight={500} color={PALETTE.inkSoft}>
            Please insert a disc.
          </Text>
        </Frame>
      )
    case 'mii':
      return (
        <Frame box={box} background="#ffffff">
          <NintendoBadge x={474} y={42} />
          <div className="wii-text wii-outline" style={{ ...abs({ x: 0, y: 84, w, h: 90 }), fontSize: 76, fontWeight: 700, lineHeight: '90px', textAlign: 'center', color: '#eef8f9' }}>
            Mii Channel
          </div>
          {Array.from({ length: 48 }, (_, i) => {
            const row = Math.floor(i / 12)
            return <Img key={i} src={face(i * 7 + row)} box={{ x: (i % 12) * 50 - 14 + (row % 2) * 25, y: 170 + row * 42, w: 56, h: 66 }} />
          })}
        </Frame>
      )
    case 'photo':
      return (
        <Frame box={box} background="#8a5a2e">
          <Img src={channelImg('photo-cork')} box={fill(box)} style={{ objectFit: 'cover' }} />
          <div style={{ ...abs({ x: 0, y: 0, w, h: 46 }), background: 'linear-gradient(#2a62c4, #183f8c)' }} />
          <Text box={{ x: 24, y: 18, w: 260, h: 28 }} size={22} weight={700} color="#ffffff" align="left">
            Photo Channel
          </Text>
          <NintendoBadge x={474} y={22} dark />
          <Img src={channelImg('photo-2')} box={{ x: 44, y: 78, w: 184, h: 124 }} style={{ transform: 'rotate(-5deg)', border: '6px solid #fff', boxSizing: 'content-box' }} />
          <Img src={channelImg('photo-3')} box={{ x: 206, y: 112, w: 184, h: 124 }} style={{ transform: 'rotate(3deg)', border: '6px solid #fff', boxSizing: 'content-box' }} />
          <Img src={channelImg('photo-4')} box={{ x: 360, y: 72, w: 184, h: 124 }} style={{ transform: 'rotate(-2deg)', border: '6px solid #fff', boxSizing: 'content-box' }} />
          <Text box={{ x: 0, y: 290, w, h: 30 }} size={20} weight={500} color="#ffffff">
            Turn your digital photos into works of art.
          </Text>
        </Frame>
      )
    case 'shop':
      return (
        <Frame box={box} background="#ffffff">
          <Img src={channelImg('shop-card')} box={{ x: 40, y: 190, w: 66, h: 64 }} style={{ opacity: 0.35, transform: 'rotate(-12deg)' }} />
          <Img src={channelImg('shop-card')} box={{ x: 450, y: 60, w: 70, h: 68 }} style={{ opacity: 0.3, transform: 'rotate(10deg)' }} />
          <Img src={channelImg('shop-card')} box={{ x: 470, y: 230, w: 56, h: 54 }} style={{ opacity: 0.25 }} />
          <Img src={channelImg('shop-bag')} box={{ x: (w - 192) / 2, y: 60, w: 192, h: 144 }} />
          <Img src={channelImg('shop-label')} box={{ x: (w - 320) / 2, y: 214, w: 320, h: 80 }} />
        </Frame>
      )
    case 'forecast':
      return (
        <Frame box={box} background="linear-gradient(#1e62d8, #0c3aa6 60%, #06288a)">
          <div style={{ ...abs({ x: 0, y: 0, w, h: 34 }), background: 'linear-gradient(#ffffff, #dfe8f6)' }} />
          <Img src={channelImg('forecast-logo')} box={{ x: 12, y: 2, w: 78, h: 30 }} />
          <div style={{ ...abs({ x: 300, y: 0, w: w - 300, h: 34 }), background: 'linear-gradient(#2d6fe0, #1447b8)', borderBottomLeftRadius: 20 }} />
          <Text box={{ x: 300, y: 4, w: w - 316, h: 28 }} size={21} weight={700} color="#ffffff" align="right">
            Forecast Channel
          </Text>
          <div style={{ ...abs({ x: 82, y: 96, w: 420, h: 138 }), background: 'rgba(0, 20, 80, 0.45)', borderRadius: 10 }} />
          <Text box={{ x: 102, y: 108, w: 380, h: 84 }} size={19} weight={500} color="#ffffff" wrap lineHeight={26}>
            The Forecast Channel offers instant access to local and international weather forecasts.
          </Text>
          <Text box={{ x: 102, y: 196, w: 380, h: 28 }} size={19} weight={500} color="#ffffff">
            Choose Start
          </Text>
        </Frame>
      )
    case 'news':
      return (
        <Frame box={box} background="repeating-linear-gradient(#f2f3f1 0 4px, #e6e8e4 4px 8px)">
          <Img src={channelImg('news-map')} box={{ x: 150, y: 70, w: 290, h: 316 }} style={{ opacity: 0.25 }} />
          <div style={{ ...abs({ x: 0, y: 18, w, h: 76 }), background: 'rgba(255,255,255,0.8)' }} />
          <Img src={channelImg('news-title')} box={{ x: (w - 432) / 2, y: 22, w: 432, h: 56 }} />
          <Text box={{ x: 0, y: 76, w, h: 16 }} size={12} weight={500} color="#3b7a3b">
            WiiConnect24
          </Text>
          <div style={{ ...abs({ x: 82, y: 136, w: 420, h: 124 }), background: 'rgba(70, 80, 70, 0.72)', borderRadius: 8 }} />
          <Text box={{ x: 100, y: 146, w: 384, h: 80 }} size={19} weight={500} color="#ffffff" wrap lineHeight={26}>
            You must access the News Channel regularly for news to be displayed on this screen.
          </Text>
          <Text box={{ x: 100, y: 224, w: 384, h: 28 }} size={19} weight={500} color="#ffffff">
            Choose Start
          </Text>
        </Frame>
      )
    case 'internet':
      return (
        <Frame box={box} background="linear-gradient(#ffffff 45%, #dff5fc 75%, #bfeaf8)">
          <NintendoBadge x={20} y={20} />
          <Text box={{ x: 0, y: 118, w, h: 44 }} size={30} weight={500} color="#1fa3dc">
            Internet Channel
          </Text>
          <Text box={{ x: 0, y: 166, w, h: 44 }} size={30} weight={500} color="#1fa3dc">
            <span style={{ display: 'inline-block', transform: 'scaleY(-1)', opacity: 0.18 }}>Internet Channel</span>
          </Text>
          <Img src={channelImg('internet-opera')} box={{ x: 494, y: 270, w: 72, h: 40 }} />
        </Frame>
      )
    case 'votes':
      return (
        <Frame box={box} background="linear-gradient(#8ae6e6, #48cfd0)">
          {Array.from({ length: 10 }, (_, i) => (
            <Img key={i} src={channelImg('votes-hand')} box={{ x: (i % 5) * 124 - 10, y: Math.floor(i / 5) * 190 - 20, w: 96, h: 96 }} style={{ opacity: 0.35 }} />
          ))}
          <Img src={channelImg('votes-label')} box={{ x: (w - 312) / 2, y: 70, w: 312, h: 192 }} />
        </Frame>
      )
    case 'cmoc':
      return (
        <Frame box={box} background="#ffffff">
          <div style={{ ...abs(fill(box)), backgroundImage: `url(${channelImg('cmoc-tiles')})`, backgroundSize: '64px 64px', opacity: 0.8 }} />
          <NintendoBadge x={474} y={16} />
          <Img src={channelImg('cmoc-label')} box={{ x: (w - 336) / 2, y: 46, w: 336, h: 195 }} />
          {Array.from({ length: 7 }, (_, i) => (
            <Img key={i} src={channelImg(['cmoc-walk', 'cmoc-cheer', 'cmoc-pair'][i % 3]!)} box={{ x: 40 + i * 74, y: 250, w: 46, h: 62 }} />
          ))}
        </Frame>
      )
    case 'nintendo':
      return (
        <Frame box={box} background="linear-gradient(#ffffff 60%, #eef9fd)">
          <NintendoBadge x={20} y={20} />
          <Img src={channelImg('nintendo-ring')} box={{ x: 60, y: 200, w: 80, h: 80 }} style={{ opacity: 0.2 }} />
          <Img src={channelImg('nintendo-ring')} box={{ x: 440, y: 60, w: 110, h: 110 }} style={{ opacity: 0.15 }} />
          <Text box={{ x: 0, y: 136, w, h: 50 }} size={38} weight={500} color="#1fa3dc">
            Nintendo Channel
          </Text>
        </Frame>
      )
  }
}
