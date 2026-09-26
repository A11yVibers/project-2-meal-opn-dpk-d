import { cuisineName, mealTypeName, dietaryTagName, categoryName } from './data.js'

export function Chips({ recipe }) {
  const items = []
  if (recipe.cuisineId) items.push(cuisineName(recipe.cuisineId))
  if (recipe.mealTypeId) items.push(mealTypeName(recipe.mealTypeId))
  recipe.dietaryTagIds?.forEach((id) => items.push(dietaryTagName(id)))
  return (
    <div className="card-meta">
      {items.filter(Boolean).map((t) => <span className="chip" key={t}>{t}</span>)}
      {recipe.categoryIds?.slice(0, 2).map((id) => (
        <span className="chip" key={id} style={{ background: '#e7efe3', color: 'var(--green)' }}>{categoryName(id)}</span>
      ))}
    </div>
  )
}

export function SpiceDots({ value, onChange, disabled }) {
  const colors = ['var(--spice-0)', 'var(--spice-1)', 'var(--spice-2)', 'var(--spice-3)', 'var(--spice-4)']
  return (
    <div>
      <div className="spice-track">
        {colors.map((c, i) => (
          <button
            type="button"
            key={i}
            className={'spice-dot' + (value === i ? ' active' : '')}
            style={{ background: c }}
            disabled={disabled}
            onClick={() => onChange(i)}
            aria-label={`spice level ${i}`}
          />
        ))}
      </div>
      <div className="spice-labels"><span>Mild</span><span>Very spicy</span></div>
    </div>
  )
}

export const ACCENT_COLORS = ['#D97757', '#8A9A5B', '#5B8AA8', '#A85B8A', '#B8995B', '#5B6E9E', '#7A5BA8', '#3E8A7C', '#C9443E', '#8A6E4D']

export function ColorSwatches({ value, onChange }) {
  return (
    <div className="color-swatches">
      {ACCENT_COLORS.map((c) => (
        <button
          type="button"
          key={c}
          className={'color-swatch' + (value === c ? ' active' : '')}
          style={{ background: c }}
          onClick={() => onChange(c)}
          aria-label={`accent ${c}`}
        />
      ))}
    </div>
  )
}

export function Toggle({ active, onClick, children }) {
  return (
    <button type="button" className={'toggle' + (active ? ' active' : '')} onClick={() => onClick(!active)}>
      {children}
    </button>
  )
}

export function formatTime(totalMin) {
  if (!totalMin) return '—'
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}