import type { ReactNode } from 'react'
import { channelImg } from '../assets'
import type { ChannelId } from '../library'
import { PALETTE } from '../palette'
import { abs, Img, Text, type Box } from './parts'

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
 * Transitions:   The real icons and banners are animated; these are their opening frames.
 * Notes:         Every banner is a stand-in assembled from the channel's own textures and its
 *                real title and text, not the channel's banner file; the ones that show live data
 *                (Forecast, News) show the text they show before the first download.
 */

const fill = (b: Box): Box => ({ x: 0, y: 0, w: b.w, h: b.h })

function Frame({ box, background, children }: { box: Box; background: string; children: ReactNode }) {
  return <div style={{ ...abs(box), background, overflow: 'hidden' }}>{children}</div>
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

export function ChannelIcon({ id, box }: { id: ChannelId; box: Box }) {
  const { w, h } = box
  switch (id) {
    case 'disc':
      return (
        <Frame box={box} background="#ffffff">
          <Img src={channelImg('disc-icon')} box={{ x: (w - 66) / 2, y: (h - 66) / 2, w: 66, h: 66 }} style={{ opacity: 0.8 }} />
        </Frame>
      )
    case 'mii':
      return (
        <Frame box={box} background="#f3ede4">
          {Array.from({ length: 12 }, (_, i) => (
            <Img key={i} src={face(i)} box={{ x: (i % 4) * 30 - 2 + (Math.floor(i / 4) % 2) * 8, y: Math.floor(i / 4) * 30 - 4, w: 34, h: 40 }} />
          ))}
        </Frame>
      )
    case 'photo':
      return (
        <Frame box={box} background="#b98b5b">
          <Img src={channelImg('photo-cork')} box={fill(box)} style={{ objectFit: 'cover' }} />
          <Img src={channelImg('photo-card-1')} box={{ x: 10, y: 30, w: 50, h: 36 }} style={{ transform: 'rotate(-8deg)' }} />
          <Img src={channelImg('photo-card-3')} box={{ x: 58, y: 26, w: 52, h: 40 }} style={{ transform: 'rotate(6deg)' }} />
          <Text box={{ x: 0, y: 2, w, h: 18 }} size={12} weight={500} color="#ffffff">
            Photo Channel
          </Text>
        </Frame>
      )
    case 'shop':
      return (
        <Frame box={box} background="#ffffff">
          <Img src={channelImg('shop-bag')} box={{ x: (w - 64) / 2, y: 8, w: 64, h: 48 }} />
          <Img src={channelImg('shop-label')} box={{ x: (w - 96) / 2, y: 60, w: 96, h: 24 }} />
        </Frame>
      )
    case 'forecast':
      return (
        <Frame box={box} background="linear-gradient(#0d44c4, #1f78dc 70%, #0b3aa8)">
          <Text box={{ x: 6, y: 3, w: w - 12, h: 16 }} size={11} weight={500} color="#ffffff" align="left">
            Forecast Channel
          </Text>
          <Img src={channelImg('forecast-moon')} box={{ x: (w - 30) / 2, y: 44, w: 30, h: 30 }} />
        </Frame>
      )
    case 'news':
      return (
        <Frame box={box} background="linear-gradient(#1f7a1f, #0f5a12)">
          <Img src={channelImg('news-label')} box={{ x: 4, y: 4, w: 100, h: 16 }} />
          <Text box={{ x: 6, y: 26, w: w - 10, h: 60 }} size={11} weight={500} color="#ffffff" align="left" wrap lineHeight={15}>
            You must access the News Channel regularly.
          </Text>
        </Frame>
      )
    case 'internet':
      return (
        <Frame box={box} background="linear-gradient(#ffffff 55%, #d8f3fb)">
          <Text box={{ x: 0, y: 20, w, h: 50 }} size={17} weight={500} color="#29a9e0" wrap lineHeight={22}>
            Internet Channel
          </Text>
        </Frame>
      )
    case 'votes':
      return (
        <Frame box={box} background="linear-gradient(#7fe3e3, #3ec7c9)">
          <Img src={channelImg('votes-label')} box={{ x: (w - 96) / 2, y: (h - 60) / 2, w: 96, h: 60 }} />
        </Frame>
      )
    case 'cmoc':
      return (
        <Frame box={box} background="#ffffff">
          <Img src={channelImg('cmoc-label')} box={{ x: (w - 104) / 2, y: (h - 60) / 2, w: 104, h: 60 }} />
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


export function ChannelBanner({ id }: { id: ChannelId }) {
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
