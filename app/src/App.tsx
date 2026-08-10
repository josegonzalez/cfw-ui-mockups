import { useEffect, useState } from 'react'
import { Landing } from './gallery/Landing'
import { NotesViewer, notesPathFromHash } from './gallery/NotesViewer'
import { ViewerBar } from './gallery/ViewerBar'
import { ROUTES } from './themes/registry'
import { findRoute } from './routes'
import './gallery/gallery.css'

/**
 * Read the current route from the URL fragment.
 *
 * Hash routing rather than history routing, because a screen has to stay addressable when the
 * built app is served from an arbitrary subpath and by the screenshot suite, neither of which
 * can rely on a server rewriting unknown paths.
 */
function useHashRoute(): string {
  const [hash, setHash] = useState(() => globalThis.location?.hash.slice(1) ?? '')

  useEffect(() => {
    const onChange = () => setHash(globalThis.location.hash.slice(1))
    globalThis.addEventListener('hashchange', onChange)
    return () => globalThis.removeEventListener('hashchange', onChange)
  }, [])

  return hash
}

export function App() {
  const hash = useHashRoute()

  const notes = notesPathFromHash(hash)
  if (notes) return <NotesViewer path={notes} />

  const route = findRoute(ROUTES, hash)
  if (!route) return <Landing />

  return (
    <main className="gal-viewer">
      <ViewerBar route={route} />
      {route.render()}
    </main>
  )
}
