import { useEffect, useMemo, useRef, useState } from 'react'
import { marked } from 'marked'
import { swatchFor } from './colors'
import './notes.css'

export const NOTES_PREFIX = 'notes/'

/** Extract the document path from a `notes/…` hash route. */
export function notesPathFromHash(hash: string): string | null {
  if (!hash.startsWith(NOTES_PREFIX)) return null

  const path = decodeURIComponent(hash.slice(NOTES_PREFIX.length))
  // Only repo documentation, and no climbing out of it.
  if (!path.startsWith('docs/') || path.includes('..')) return null
  return path
}

/**
 * State carries the path it belongs to.
 *
 * Without it, switching documents needs a `setState({ status: 'loading' })` at the top of the
 * effect - a synchronous state write during an effect, which cascades an extra render. Comparing
 * the path instead makes "a different document than the one loaded" a derived value.
 */
type State =
  | { status: 'loading'; path: string }
  | { status: 'ready'; path: string; html: string }
  | { status: 'error'; path: string; message: string }

/**
 * Rewrite the links inside a rendered document so they still work from the viewer.
 *
 * The markdown is written to be read in the repo, where its links are relative to the file's own
 * directory. Rendered at `#notes/…` they would otherwise resolve against the app's URL and go
 * nowhere - the same class of dead link this viewer exists to fix, one level down.
 */
function resolveLinks(root: HTMLElement, docPath: string) {
  const dir = docPath.slice(0, docPath.lastIndexOf('/') + 1)

  for (const anchor of root.querySelectorAll('a')) {
    const href = anchor.getAttribute('href')
    if (!href || /^(https?:|mailto:|#)/.test(href)) continue

    const resolved = new URL(href, `file:///${dir}`).pathname.replace(/^\//, '')

    if (resolved.endsWith('.md')) {
      // Another document: stay in the viewer.
      anchor.setAttribute('href', `#${NOTES_PREFIX}${resolved}`)
    } else {
      anchor.setAttribute('href', `/${resolved}`)
    }
  }
}

/**
 * What counts as a colour in these documents.
 *
 * Either hash-prefixed, or a bare six or eight hex digits - the source themes store their
 * palettes both ways. The six-or-eight rule is what keeps the seven-character commit hashes
 * these documents also cite from being painted as colours.
 */
const COLOR_TEXT = /^(#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})|[0-9a-f]{6}|[0-9a-f]{8})$/i

/**
 * Paint every hex colour in the document as itself.
 *
 * A palette table is a list of colours written as text, which is the one thing a reader cannot
 * evaluate without looking them up. The ink is chosen by contrast so the value stays readable
 * on its own colour - which matters most for the mid-tones, where guessing gets it wrong.
 */
function paintColorSwatches(root: HTMLElement) {
  for (const code of root.querySelectorAll('code')) {
    const text = code.textContent?.trim() ?? ''
    if (!COLOR_TEXT.test(text)) continue

    const swatch = swatchFor(text)
    if (!swatch) continue

    code.classList.add('notes__swatch')
    code.style.background = swatch.background
    code.style.color = swatch.ink
    code.title = `${text} - contrast ${swatch.contrast.toFixed(1)}:1 against this text`
  }
}

export interface NotesViewerProps {
  readonly path: string
}

/**
 * Renders a repo document as a page.
 *
 * The notes used to link straight at the `.md` file. That leaned on the server sending a content
 * type the browser would display rather than download, which is not something to bet a link on -
 * and even when it worked, the result was an unstyled wall of text.
 *
 * The markdown is first-party content from this repository, so it is rendered without a
 * sanitiser. That assumption is only safe while the documents come from the repo itself.
 */
export function NotesViewer({ path }: NotesViewerProps) {
  const [loaded, setLoaded] = useState<State>({ status: 'loading', path })
  const bodyRef = useRef<HTMLDivElement>(null)

  // Anything loaded for a different document is stale, so it reads as loading. Memoised so the
  // effect below is not re-run by a fresh object on every render.
  const state = useMemo<State>(
    () => (loaded.path === path ? loaded : { status: 'loading', path }),
    [loaded, path],
  )

  useEffect(() => {
    let cancelled = false

    fetch(`/${path}`)
      .then((response) => {
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
        return response.text()
      })
      .then(async (text) => {
        const html = await marked.parse(text, { gfm: true, breaks: false })
        if (!cancelled) setLoaded({ status: 'ready', path, html })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoaded({
            status: 'error',
            path,
            message: error instanceof Error ? error.message : 'Failed',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [path])

  useEffect(() => {
    if (state.status !== 'ready' || !bodyRef.current) return
    resolveLinks(bodyRef.current, path)
    paintColorSwatches(bodyRef.current)
  }, [state, path])

  return (
    <main className="notes">
      <div className="notes__bar">
        <a className="gal-btn" href="#">
          All screens
        </a>
        <span className="notes__path">{path}</span>
        <a className="gal-btn notes__raw" href={`/${path}`}>
          View raw
        </a>
      </div>

      {state.status === 'loading' ? <p className="notes__status">Loading…</p> : null}

      {state.status === 'error' ? (
        <p className="notes__status notes__status--error">
          Could not load <code>{path}</code> - {state.message}
        </p>
      ) : null}

      {state.status === 'ready' ? (
        <article
          className="notes__body"
          ref={bodyRef}
          // First-party repository documentation; see the note on the component.
          dangerouslySetInnerHTML={{ __html: state.html }}
        />
      ) : null}
    </main>
  )
}
