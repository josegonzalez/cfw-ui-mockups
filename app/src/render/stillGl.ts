/**
 * WebGL for a still: one frame, then give the context back.
 *
 * A browser keeps only a handful of live WebGL contexts - Chrome sixteen - and when one more is
 * asked for, it drops the oldest and that canvas goes blank. A live build has one or two, so
 * this never came up until the views page put forty stills of the same set on one page: the
 * Dreamcast BIOS tiles near the top lost their sky while the ones further down still had it,
 * and every geometry check still passed.
 *
 * A still draws exactly one frame and never another, so it has no use for a context after that
 * frame. It draws on a canvas nobody sees, copies the pixels onto the 2D canvas that is shown,
 * and releases the context straight away.
 */

/** A canvas the size of the frame, never attached to the document. */
export function stillGlCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

/**
 * Copy what the GL canvas drew onto `target`, then release its context.
 *
 * Read before release: a lost context's drawing buffer is gone, so the order matters.
 */
export function bakeStillGl(source: HTMLCanvasElement, target: CanvasRenderingContext2D): void {
  target.clearRect(0, 0, target.canvas.width, target.canvas.height)
  target.drawImage(source, 0, 0, target.canvas.width, target.canvas.height)
  // `getContext` with the same id returns the context the frame was drawn with.
  const gl = source.getContext('webgl') as WebGLRenderingContext | null
  gl?.getExtension('WEBGL_lose_context')?.loseContext()
}
