import { useEffect, useRef, useState } from 'react'
import { useScreen } from '../../../device/ScreenContext'
import { useWebEffects } from '../../../render/RenderModeProvider'
import { W, H } from '../layout'
import { abs } from '../views/parts'
import { createSceneGl } from './gl'
import { drawSceneCpu } from './raster'
import { poseAt, type ModelData } from './scene'

const files = import.meta.glob<ModelData>('../assets/models/*.json', { eager: true, import: 'default' })

/** A model decoded from the ROM, by the name `extract-assets.py` gives it. */
export function model(name: string): ModelData {
  const m = files[`../assets/models/${name}.json`]
  if (!m) throw new Error(`Dreamcast BIOS model missing: ${name}`)
  return m
}

/** The main menu's models, in its items' order: Play, File, Music, Settings. */
export const MAIN_MODELS: readonly ModelData[] = ['controller', 'vmu', 'note', 'clock'].map(model)

/**
 * The main menu's four models, drawn from the BIOS's own geometry, each where the BIOS puts it. The
 * focused one plays the BIOS's own focus motion for it, round and round; the others rest.
 *
 * The shader is the web-only capability: in fallback mode, or where WebGL does not come up, the
 * same scene is rasterised on the CPU (`raster.ts`), motion and all. Like the sky, this is a render
 * loop rather than a storyboard, so what stands in for settling is the clock - a still draws one
 * frame, every model at rest.
 */
export function MenuModels({ focus }: { focus: number }) {
  const { animate } = useScreen()
  const webEffects = useWebEffects()
  const glCanvas = useRef<HTMLCanvasElement>(null)
  const cpuCanvas = useRef<HTMLCanvasElement>(null)
  const [glReady, setGlReady] = useState(false)
  const useGl = webEffects && glReady

  useEffect(() => {
    const cpu = cpuCanvas.current?.getContext('2d')
    const scene = webEffects && glCanvas.current ? createSceneGl(glCanvas.current, MAIN_MODELS) : null
    setGlReady(scene !== null)
    const draw = (t: number | null) => {
      const poses = MAIN_MODELS.map((m, i) => poseAt(m, i === focus ? t : null))
      if (scene) scene.draw(poses)
      else if (cpu) drawSceneCpu(cpu, MAIN_MODELS, poses)
    }
    draw(null)
    if (!animate) return () => scene?.dispose()
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
  }, [webEffects, focus, animate])

  const box = abs({ x: 0, y: 0, w: W, h: H })
  return (
    <>
      <canvas ref={glCanvas} width={W} height={H} data-models="gl" style={{ ...box, display: useGl ? 'block' : 'none' }} />
      <canvas ref={cpuCanvas} width={W} height={H} data-models="cpu" style={{ ...box, display: useGl ? 'none' : 'block' }} />
    </>
  )
}
