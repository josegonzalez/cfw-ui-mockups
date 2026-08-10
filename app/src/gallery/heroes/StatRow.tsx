import { heroStats } from './content'

/**
 * The stat row, shared by every hero.
 *
 * Values use the font's proportional figures rather than tabular ones: these are standalone
 * numbers, not a column that has to align, and tabular digits read loose at display sizes.
 */
export function StatRow({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'gal__stats gal__stats--compact' : 'gal__stats'}>
      {heroStats().map((stat) => (
        <div className="gal__stat" key={stat.label}>
          <div className="gal__stat-value">{stat.value}</div>
          <div className="gal__stat-label">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}
