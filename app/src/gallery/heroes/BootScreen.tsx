import type { CSSProperties } from 'react'
import { bootLines } from './content'

/**
 * The boot log, drawn at device resolution inside the panel.
 *
 * This is page decoration rather than a theme screen, which is why it lives here and is not
 * registered in the widget catalogue - no firmware in the repo actually ships it. It is styled
 * to look like the console these devices print before their launcher takes over.
 *
 * Sizes are device pixels: this renders inside `.screen`, which lays out at the panel's real
 * resolution, so 14px here is 14px on a 640x480 panel.
 */
export function BootScreen({ durationMs }: { durationMs: number }) {
  const lines = bootLines()
  const step = durationMs / (lines.length + 1)

  return (
    <div className="bootscreen">
      <div className="bootscreen__head">
        <span className="bootscreen__dot" />
        cfw-mockups
        <span className="bootscreen__ver">v0.1.0</span>
      </div>

      <div className="bootscreen__log">
        {lines.map((line, index) => (
          <div
            className="bootscreen__line"
            key={line.label}
            style={{ '--delay': `${index * step}ms` } as CSSProperties}
          >
            <span className="bootscreen__prompt">&gt;</span>
            <span className="bootscreen__label">{line.label}</span>
            <span className="bootscreen__dots" aria-hidden="true" />
            <span className={line.ok ? 'bootscreen__ok' : 'bootscreen__val'}>{line.value}</span>
          </div>
        ))}

        <div
          className="bootscreen__line"
          style={{ '--delay': `${lines.length * step}ms` } as CSSProperties}
        >
          <span className="bootscreen__prompt">&gt;</span>
          <span className="bootscreen__label">ready</span>
          <span className="bootscreen__caret" aria-hidden="true" />
        </div>
      </div>

      <div className="bootscreen__progress" aria-hidden="true">
        <span
          className="bootscreen__fill"
          style={{ '--fill-ms': `${durationMs}ms` } as CSSProperties}
        />
      </div>
    </div>
  )
}
