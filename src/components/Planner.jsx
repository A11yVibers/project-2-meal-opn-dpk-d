import { useState, useMemo } from 'react'
import { APPROVED_IMAGES } from '../approved-images'
import { DAYS, MEAL_SLOTS, startOfWeek, toDateKey, weekKeyForDate, formatDateKey } from '../dateUtils'

export default function Planner({ app, onOpenRecipe }) {
  const [cursor, setCursor] = useState(() => startOfWeek(new Date()))
  const [chooser, setChooser] = useState(null)

  const weekKey = weekKeyForDate(cursor)

  const days = useMemo(() => {
    return DAYS.map((_, i) => {
      const d = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + i)
      return { name: DAYS[i], key: toDateKey(d), date: d }
    })
  }, [cursor])

  const suggestions = useMemo(() => app.allRecipes.filter((r) => r.includeInMealSuggestions !== false), [app.allRecipes])

  const recipeAt = (day, meal) => {
    const recipeId = (app.mealPlan[weekKey] || {})[`${day}|${meal}`]
    return recipeId ? app.recipeById.get(recipeId) : null
  }

  const shift = (delta) => {
    const d = new Date(cursor)
    d.setDate(d.getDate() + delta * 7)
    setCursor(startOfWeek(d))
  }

  const pick = (recipeId) => {
    if (chooser) {
      app.setMealSlot(weekKey, chooser.day, chooser.meal, recipeId)
      setChooser(null)
    }
  }

  const removeFromSlot = (day, meal) => {
    app.setMealSlot(weekKey, day, meal, null)
  }

  const weekLabel = `${formatDateKey(toDateKey(cursor))} – ${formatDateKey(toDateKey(new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 6)))}`

  return (
    <section className="planner">
      <div className="planner-head">
        <h1>Weekly Meal Plan</h1>
        <div className="week-nav">
          <button className="btn" onClick={() => shift(-1)}>←</button>
          <span className="week-label">{weekLabel}</span>
          <button className="btn" onClick={() => shift(1)}>→</button>
          <button className="btn light" onClick={() => setCursor(startOfWeek(new Date()))}>Today</button>
        </div>
      </div>

      <div className="plan-table">
        <div className="plan-header">
          <div className="corner" />
          {days.map((d) => <div className="plan-day-head" key={d.name}>{d.name.substring(0, 3)}</div>)}
        </div>
        {MEAL_SLOTS.map((meal) => (
          <div className="plan-row" key={meal}>
            <div className="plan-meal">{meal}</div>
            {days.map((day) => {
              const rec = recipeAt(day.name, meal)
              return (
                <div className="plan-cell" key={day.name}>
                  {rec ? (
                    <div className="planned" style={{ '--accent': rec.accentColor || '#D97757' }}>
                      <button className="planned-open" onClick={() => onOpenRecipe(rec.id)}>
                        <img src={rec.coverImageUrl || APPROVED_IMAGES.placeholder} alt={rec.title} />
                        <span className="planned-title">{rec.title}</span>
                      </button>
                      <div className="planned-actions">
                        <button className="planned-remove" title="Replace" onClick={() => setChooser({ day: day.name, meal })}>↻</button>
                        <button className="planned-remove" title="Remove" onClick={() => removeFromSlot(day.name, meal)}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <button className="empty-slot" onClick={() => setChooser({ day: day.name, meal })}>+</button>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {chooser && (
        <div className="chooser-modal" onClick={() => setChooser(null)}>
          <div className="chooser-panel" onClick={(e) => e.stopPropagation()}>
            <h3>Choose a recipe for {chooser.day} {chooser.meal}</h3>
            <ChooserList suggestions={suggestions} onPick={pick} />
            <button className="btn" onClick={() => setChooser(null)}>Cancel</button>
          </div>
        </div>
      )}
    </section>
  )
}

function ChooserList({ suggestions, onPick }) {
  const [q, setQ] = useState('')
  const filtered = suggestions.filter((r) => {
    const ql = q.toLowerCase()
    if (!ql) return true
    return `${r.title} ${r.mealTypeName} ${r.cuisineName}`.toLowerCase().includes(ql)
  })
  return (
    <>
      <input className="search" placeholder="Search recipes..." value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      <div className="chooser-list">
        {filtered.map((r) => (
          <button className="chooser-item" key={r.id} onClick={() => onPick(r.id)}>
            <img src={r.coverImageUrl || APPROVED_IMAGES.placeholder} alt={r.title} />
            <div>
              <strong>{r.title}</strong>
              <span className="muted">{r.mealTypeName}{r.cuisineName ? ' · ' + r.cuisineName : ''}</span>
            </div>
          </button>
        ))}
        {filtered.length === 0 && <p className="muted">No recipes match.</p>}
      </div>
    </>
  )
}