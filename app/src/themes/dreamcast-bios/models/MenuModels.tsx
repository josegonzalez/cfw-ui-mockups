import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useScreen } from '../../../device/ScreenContext'
import { useWebEffects } from '../../../render/RenderModeProvider'
import { bakeStillGl, stillGlCanvas } from '../../../render/stillGl'
import { bios } from '../assets'
import { abs } from '../views/parts'
import { createSceneGl } from './gl'
import { drawSceneCpu, texels, type Texels } from './raster'
import { MAIN_ALPHA, MAIN_VIEW, SCREEN, poseAt, reflected, textureOf, type Item, type ModelData } from './scene'

const files = import.meta.glob<ModelData>('../assets/models/**/*.json', { eager: true, import: 'default' })

/** A model decoded from the ROM, by the name `extract-assets.py` gives it. */
export function model(name: string): ModelData {
  const m = files[`../assets/models/${name}.json`]
  if (!m) throw new Error(`Dreamcast BIOS model missing: ${name}`)
  return m
}

/** The main menu's models, in its items' order: Play, File, Music, Settings. */
export const MAIN_MODELS: readonly ModelData[] = ['controller', 'vmu', 'note', 'clock'].map(model)

/**
 * A screen's models, drawn from the BIOS's own geometry into one canvas over the whole screen.
 * `items` gives what to draw `t` seconds in, or at rest when `t` is null; the caller memoises it.
 *
 * The shader is the web-only capability: in fallback mode, or where WebGL does not come up, the same
 * items are rasterised on the CPU (`raster.ts`), motion and all. Like the sky, this is a render loop
 * rather than a storyboard, so what stands in for settling is the clock - a still draws one frame,
 * at rest. A scene with nothing moving draws once.
 *
 * The textures the models' parts name are ROM textures from `assets/bios/`. Each is put in the page
 * as a hidden image too, so whatever waits for a page's images to load waits for these, and the scene
 * is drawn once they have.
 */
export function ModelScene({ items: drawn, moving, reflect = false }: { items: (t: number | null) => readonly Item[]; moving: boolean; reflect?: boolean }) {
  // In the hidden 3D mode the water reflects every model, drawn first so the models stand over it.
  const items = useCallback((t: number | null) => {
    const list = drawn(t)
    return reflect ? [...list.map(reflected), ...list] : list
  }, [drawn, reflect])
  const { animate } = useScreen()
  const webEffects = useWebEffects()
  const glCanvas = useRef<HTMLCanvasElement>(null)
  const cpuCanvas = useRef<HTMLCanvasElement>(null)
  const images = useRef(new Map<string, HTMLImageElement>())
  const [glReady, setGlReady] = useState(false)
  // A still shows the CPU canvas whichever drew it: its GL frame is copied there (`stillGl.ts`).
  const useGl = webEffects && glReady && animate
  const names = useMemo(
    () => [...new Set(items(null).flatMap((i) => i.model.parts.flatMap((p) => {
      const n = textureOf(i, p.texture)
      return n ? [n] : []
    })))].sort(),
    [items],
  )
  const [loaded, setLoaded] = useState<ReadonlySet<string>>(() => new Set())
  const ready = names.every((n) => loaded.has(n))

  useEffect(() => {
    if (!ready) return
    const cpu = cpuCanvas.current?.getContext('2d')
    const models = [...new Set(items(null).map((i) => i.model))]
    const imgs = new Map(names.map((n) => [n, images.current.get(n)!]))
    const height = reflect ? SCREEN.reflecting : SCREEN.h
    const glTarget = animate ? glCanvas.current : stillGlCanvas(SCREEN.w, height)
    const scene = webEffects && glTarget ? createSceneGl(glTarget, models, imgs) : null
    setGlReady(scene !== null)
    const cpuTextures = new Map<string, Texels>()
    if (!scene) for (const [n, img] of imgs) {
      const px = texels(img)
      if (px) cpuTextures.set(n, px)
    }
    const draw = (t: number | null) => {
      const list = items(t)
      if (scene) scene.draw(list)
      else if (cpu) drawSceneCpu(cpu, list, cpuTextures)
    }
    draw(null)
    if (!animate) {
      if (scene && glTarget && cpu) bakeStillGl(glTarget, cpu)
      return () => scene?.dispose()
    }
    if (!moving) return () => scene?.dispose()
    let raf = 0
    let start: number | null = null
    const tick = (ts: number) => {
      start ??= ts
      draw((ts - start) / 1000)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      scene?.dispose()
    }
  }, [webEffects, items, moving, animate, ready, names, reflect])

  const height = reflect ? SCREEN.reflecting : SCREEN.h
  const box = abs({ x: 0, y: 0, w: SCREEN.w, h: height })
  return (
    <>
      {names.map((n) => (
        <img
          key={n}
          alt=""
          src={bios(n)}
          style={{ display: 'none' }}
          ref={(el) => {
            if (el) images.current.set(n, el)
          }}
          onLoad={() => setLoaded((s) => new Set(s).add(n))}
        />
      ))}
      <canvas ref={glCanvas} width={SCREEN.w} height={height} data-models="gl" style={{ ...box, display: useGl ? 'block' : 'none' }} />
      <canvas ref={cpuCanvas} width={SCREEN.w} height={height} data-models="cpu" style={{ ...box, display: useGl ? 'none' : 'block' }} />
    </>
  )
}

/**
 * The main menu's four models, each where its own transform in the ROM puts it. The focused one plays
 * the BIOS's own focus motion for it, round and round; the others rest.
 */
export function MenuModels({ focus, realMode }: { focus: number; realMode: boolean }) {
  const items = useCallback(
    (t: number | null): Item[] =>
      MAIN_MODELS.map((m, i) => ({
        model: m,
        pose: poseAt(m, i === focus ? t : null),
        view: MAIN_VIEW,
        // The 3D mode draws its models solid (`frames/main-3d.png`).
        alpha: realMode ? 1 : MAIN_ALPHA,
      })),
    [focus, realMode],
  )
  return <ModelScene items={items} moving reflect={realMode} />
}
