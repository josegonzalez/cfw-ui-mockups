import { useEffect, useState } from 'react'
import { ROUTES } from './themes/registry'
import { findRoute, routeId } from './routes'

/**
 * Read the current route from the URL fragment.
 *
 * Hash routing rather than history routing, because a screen has to be addressable when the
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

/**
 * The gallery.
 *
 * A placeholder listing until phase 9 gives it a real design. It already enumerates from the
 * route registry rather than from hand-written links, which is the part that matters.
 */
export function App() {
  const hash = useHashRoute()
  const route = findRoute(ROUTES, hash)

  if (route) {
    return (
      <main className="min-h-screen grid place-items-center p-10">
        <div>
          <a
            href="#"
            className="mb-6 inline-block text-sm text-cyan-300 hover:underline"
          >
            &lsaquo; All screens
          </a>
          {route.render()}
        </div>
      </main>
    )
  }

  const themes = [...new Set(ROUTES.map((r) => r.theme))]

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-slate-100">
      <h1 className="text-2xl font-semibold">CFW UI Mockups</h1>
      <p className="mt-3 text-slate-400">
        Mockups of the on-screen UI of SBC gaming handheld custom firmware and launchers.
      </p>

      {themes.map((theme) => (
        <section key={theme} className="mt-10">
          <h2 className="text-lg font-semibold text-cyan-300">{theme}</h2>
          <ul className="mt-3 space-y-2">
            {ROUTES.filter((r) => r.theme === theme).map((r) => (
              <li key={routeId(r)}>
                <a
                  href={`#${routeId(r)}`}
                  className="block rounded-md bg-slate-900 px-4 py-3 hover:bg-slate-800"
                >
                  <span className="font-medium">{r.title}</span>
                  <span className="text-sm text-slate-500"> - {r.device}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  )
}
