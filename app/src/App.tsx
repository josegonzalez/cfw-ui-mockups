import { useEffect, useState } from 'react'
import { Landing } from './gallery/Landing'
import { ROUTES } from './themes/registry'
import { findRoute } from './routes'
import { THEMES } from './themes/catalogue'
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
  const route = findRoute(ROUTES, hash)

  if (!route) return <Landing />

  const theme = THEMES.find((t) => t.slug === route.theme)

  return (
    <main className="gal-viewer">
      <div className="gal-viewer__bar">
        <a className="gal-btn" href="#">
          All screens
        </a>
        <span className="gal-viewer__title">
          {theme?.name ?? route.theme} · {route.title}
        </span>
        <span className="gal-viewer__hint">
          {route.device}
          {route.interactive
            ? ' · arrows to move, Z is A, X is B - or click the buttons'
            : ' · static snapshot'}
        </span>
      </div>
      {route.render()}
    </main>
  )
}
