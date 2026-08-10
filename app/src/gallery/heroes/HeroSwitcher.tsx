import { HERO_LABEL, HERO_NOTE, HERO_VARIANTS, type HeroVariant } from './types'

export interface HeroSwitcherProps {
  readonly variant: HeroVariant
  readonly onChange: (next: HeroVariant) => void
}

/**
 * The hero-treatment switcher.
 *
 * A preview control, not a product feature, so it sits out of the way and says so. It is a
 * radiogroup rather than a row of buttons because it is a single choice among four, and a
 * screen reader should hear it that way.
 */
export function HeroSwitcher({ variant, onChange }: HeroSwitcherProps) {
  return (
    <aside className="hero-switch" aria-label="Hero style preview">
      <div className="hero-switch__head">
        <span className="hero-switch__title">Hero style</span>
        <kbd className="hero-switch__kbd">H</kbd>
      </div>

      <div className="hero-switch__opts" role="radiogroup" aria-label="Hero style">
        {HERO_VARIANTS.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={option === variant}
            className={
              option === variant ? 'hero-switch__opt hero-switch__opt--on' : 'hero-switch__opt'
            }
            onClick={() => onChange(option)}
          >
            {HERO_LABEL[option]}
          </button>
        ))}
      </div>

      <p className="hero-switch__note">{HERO_NOTE[variant]}</p>
    </aside>
  )
}
