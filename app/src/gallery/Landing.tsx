import { THEMES } from '../themes/catalogue'
import { Browse } from './Browse'
import { Hero } from './hero/Hero'
import { NOTES_PREFIX } from './NotesViewer'
import './gallery.css'
import './hero/hero.css'

/** "Elementerial by mluizvitor, PlayStation X by pajarorrojo, ..." - every set with an author. */
function credits(): string {
  return THEMES.filter((t) => t.author)
    .map((t) => `${t.name} by ${t.author}`)
    .join(', ')
}

export function Landing() {
  return (
    <div className="gal">
      <div className="gal__inner">
        <Hero />

        <Browse />

        <section className="gal__section" aria-labelledby="about-heading">
          <div className="gal__section-head">
            <h2 className="gal__section-title" id="about-heading">
              What this is
            </h2>
          </div>

          <div className="gal__notes">
            <div className="gal__note">
              <h3>Specs, not firmware</h3>
              <p>
                Nothing here ships to a device. Each screen is a visual and interaction reference,
                built by reading the firmware's own source - its theme format, its layout
                definitions, its animation timings - rather than by eyeballing a screenshot.
              </p>
            </div>
            <div className="gal__note">
              <h3>Native resolution, then scaled</h3>
              <p>
                A screen lays out at the device's real pixel size and only the bezel is scaled for
                viewing. A 480x320 panel and a 1920x1152 one sit side by side on a desktop with
                every internal dimension still exact.
              </p>
            </div>
            <div className="gal__note">
              <h3>Motion is part of the spec</h3>
              <p>
                Transitions are reproduced rather than described: carousel easing, selection
                growth, boot fades and hold-to-power-off, at the durations read out of the source.
              </p>
            </div>
            <div className="gal__note">
              <h3>Built to be ported again</h3>
              <p>
                The screens are assembled from a shared widget vocabulary written to survive a
                renderer with no CSS and no DOM, so this can become a firmware UI toolkit rather
                than stopping at a web page.
              </p>
            </div>
          </div>
        </section>

        <footer className="gal__footer">
          Every set reproduces someone else's work: {credits()}. Documentation lives in{' '}
          <a href={`#${NOTES_PREFIX}docs/README.md`}>docs/</a>.
        </footer>
      </div>
    </div>
  )
}
