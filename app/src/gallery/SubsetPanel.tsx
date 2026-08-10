export interface SubsetOption {
  readonly value: string
  readonly label: string
}

export interface SubsetGroup {
  readonly title: string
  /** The mockup-only keys that cycle this group, shown beside the title. */
  readonly keys?: string
  readonly current: string
  readonly options: readonly SubsetOption[]
  readonly onSelect: (value: string) => void
}

export interface SubsetPanelProps {
  readonly groups: readonly SubsetGroup[]
}

/**
 * The subset strip below an interactive screen.
 *
 * Mockup chrome, not part of any theme. A firmware's own settings screen is a screen; this is
 * the harness that lets one page stand in for the fourteen colour schemes and eight views a
 * theme ships, without the reader having to memorise which punctuation key does what.
 *
 * Buttons rather than a `<select>`, because seeing every option at once is the point - the
 * range is the thing being demonstrated.
 */
export function SubsetPanel({ groups }: SubsetPanelProps) {
  return (
    <div className="gal-subsets">
      {groups.map((group) => (
        <section key={group.title} className="gal-subsets__group">
          <h3 className="gal-subsets__title">
            {group.title}
            {group.keys ? <span className="gal-subsets__keys">{group.keys}</span> : null}
          </h3>
          <div className="gal-subsets__row" role="group" aria-label={group.title}>
            {group.options.map((option) => {
              const on = option.value === group.current
              return (
                <button
                  key={option.value}
                  type="button"
                  className={on ? 'gal-subsets__opt gal-subsets__opt--on' : 'gal-subsets__opt'}
                  aria-pressed={on}
                  onClick={() => group.onSelect(option.value)}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
