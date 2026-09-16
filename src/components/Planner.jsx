import { useMemo, useState } from 'react'
import {
  MEAL_SLOTS,
  MEAL_TYPES,
  SPICE_LABELS,
} from '../lib/data.js'
import { dayKeysForWeek, formatDay, formatShortDay, parseKey } from '../lib/dates.js'
import { APPROVED_IMAGES } from '../approved-images.js'

export default function Planner({
  recipes,
  mealPlan,
  weekKey,
  onWeekChange,
  onAssign,
  onRemove,
  onOpenRecipe,
  onToday,
}) {
  const [picker, setPicker] = useState(null) // { dayKey, slot }

  const days = dayKeysForWeek(weekKey)
  const week = mealPlan[weekKey] || {}

  const changeWeek = (delta) => {
    const base = parseKey(weekKey)
    base.setDate(base.getDate() + delta * 7)
    onWeekChange(keyOf(base))
  }

  const openPicker = (dayKey, slot) => setPicker({ dayKey, slot })

  return (
    <section className="view">
      <div className="view-header">
        <div>
          <h1>Weekly meal planner</h1>
          <p className="muted">Tap a slot to plan a meal.</p>
        </div>
        <div className="week-nav">
          <button className="btn" onClick={() => changeWeek(-1)} title="Previous week">←</button>
          <button className="btn" onClick={onToday}>Today</button>
          <button className="btn" onClick={() => changeWeek(1)} title="Next week">→</button>
        </div>
      </div>

      <div className="planner-grid">
        <div className="planner-corner" />
        {days.map((d) => (
          <div key={d} className={`planner-day-head ${isToday(d) ? 'today' : ''}`}>
            <span className="day-name">{formatDay(d).split(' ')[0]}</span>
            <span className="day-date">{formatShortDay(d)}</span>
          </div>
        ))}
        {MEAL_SLOTS.map((slot) => (
          <div key={slot} className="planner-rows">
            <div className="planner-slot-label">{slot}</div>
            {days.map((d) => {
              const assignment = week[d] && week[d][slot]
              return (
                <PlannerCell
                  key={d + slot}
                  assignment={assignment}
                  recipe={assignment ? recipes.find((r) => r.id === assignment.recipeId) : null}
                  onAdd={() => openPicker(d, slot)}
                  onOpen={() => onOpenRecipe(assignment.recipeId)}
                  onRemove={() => onRemove(d, slot)}
                />
              )
            })}
          </div>
        ))}
      </div>

      {picker && (
        <PickerModal
          recipes={recipes}
          dayKey={picker.dayKey}
          slot={picker.slot}
          onClose={() => setPicker(null)}
          onPick={(recipeId) => {
            onAssign(picker.dayKey, picker.slot, recipeId)
            setPicker(null)
          }}
          onOpenRecipe={onOpenRecipe}
        />
      )}
    </section>
  )
}

function isToday(dayKey) {
  const now = new Date()
  return keyOf(now) === dayKey
}

function keyOf(date) {
  const p = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
}

function PlannerCell({ assignment, recipe, onAdd, onOpen, onRemove }) {
  if (!assignment || !recipe) {
    return (
      <button className="planner-cell empty" onClick={onAdd} title="Add recipe">
        <span className="plus">+</span>
        <span className="cell-hint">Add</span>
      </button>
    )
  }
  return (
    <div className="planner-cell filled" style={{ '--accent': recipe.accentColor || '#D97757' }}>
      <button className="planner-recipe" onClick={onOpen} title={recipe.title}>
        <img src={recipe.coverImageUrl || APPROVED_IMAGES.placeholder} alt="" />
        <div className="planner-recipe-info">
          <span className="planner-recipe-title">{recipe.title}</span>
          {assignment.time && <span className="planner-recipe-time">🕒 {assignment.time}</span>}
          {recipe.spiceLevel > 0 && (
            <span className="planner-recipe-spice">
              {SPICE_LABELS[recipe.spiceLevel]}
            </span>
          )}
        </div>
      </button>
      <button className="planner-remove" title="Remove" onClick={onRemove}>✕</button>
    </div>
  )
}

function PickerModal({ recipes, dayKey, slot, onClose, onPick, onOpenRecipe }) {
  const [query, setQuery] = useState('')
  const [mealFilter, setMealFilter] = useState('')
  const [suggestionsOnly, setSuggestionsOnly] = useState(true)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return recipes.filter((r) => {
      if (suggestionsOnly && r.includeInMealSuggestions === false) return false
      if (mealFilter && r.mealTypeId !== mealFilter) return false
      if (q && !`${r.title} ${r.shortDescription}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [recipes, query, mealFilter, suggestionsOnly])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <h3>Add to {formatDay(dayKey)} — {slot}</h3>
        <div className="picker-controls">
          <input
            className="search-input"
            type="search"
            placeholder="Search recipes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <select value={mealFilter} onChange={(e) => setMealFilter(e.target.value)}>
            <option value="">All meal types</option>
            {MEAL_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <label className="checkbox-inline">
            <input
              type="checkbox"
              checked={suggestionsOnly}
              onChange={(e) => setSuggestionsOnly(e.target.checked)}
            />
            Suggestions only
          </label>
        </div>
        <div className="picker-list">
          {filtered.length === 0 ? (
            <p className="muted">No matching recipes.</p>
          ) : (
            filtered.map((r) => (
              <div key={r.id} className="picker-item">
                <img src={r.coverImageUrl || APPROVED_IMAGES.placeholder} alt="" />
                <div className="picker-item-info">
                  <span className="picker-item-title">{r.title}</span>
                  <span className="muted small">
                    {r.ingredients.length} ingredients · {r.totalTimeMinutes || r.prepTimeMinutes + r.cookTimeMinutes} min
                  </span>
                </div>
                <div className="picker-item-actions">
                  <button className="btn btn-small" onClick={() => { onClose(); onOpenRecipe(r.id) }}>
                    View
                  </button>
                  <button className="btn btn-primary btn-small" onClick={() => onPick(r.id)}>
                    Add
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}