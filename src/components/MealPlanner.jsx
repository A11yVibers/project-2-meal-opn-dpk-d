import { Fragment, useState } from 'react'
import { useApp } from '../App.jsx'
import { APPROVED_IMAGES } from '../approved-images.js'
import { addWeeks, daysOfWeek, dateToKey, formatDate, weekKey } from '../store.js'

const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

export default function MealPlanner() {
  const { store, openRecipe, commit } = useApp()
  const [week, setWeek] = useState(weekKey(new Date()))
  const [picker, setPicker] = useState(null) // { dayKey, slot }

  const days = daysOfWeek(week)
  const todayKey = dateToKey(new Date())

  function assignedRecipe(dayKey, slot) {
    const recipeId = store.mealPlan[`${dayKey}|${slot}`]
    return recipeId ? store.recipes.find((r) => r.id === recipeId) : null
  }

  function assign(dayKey, slot, recipeId) {
    store.mealPlan = { ...store.mealPlan, [`${dayKey}|${slot}`]: recipeId }
    setPicker(null)
    commit()
  }

  function remove(dayKey, slot) {
    const next = { ...store.mealPlan }
    delete next[`${dayKey}|${slot}`]
    store.mealPlan = next
    setPicker(null)
    commit()
  }

  function weekLabel(key) {
    const d = daysOfWeek(key)
    return `${formatDate(d[0])} – ${formatDate(d[6])}, ${d[0].getFullYear()}`
  }

  return (
    <div className="planner">
      <div className="planner-head">
        <h1>Weekly Meal Plan</h1>
        <div className="week-nav">
          <button className="btn" onClick={() => setWeek((w) => addWeeks(w, -1))}>
            ‹ Prev
          </button>
          <span className="week-label">{weekLabel(week)}</span>
          <button className="btn" onClick={() => setWeek((w) => addWeeks(w, 1))}>
            Next ›
          </button>
        </div>
      </div>

      <div className="planner-grid" style={{ '--cols': days.length + 1 }}>
        <div className="planner-corner">Meal</div>
        {days.map((d) => {
          const k = dateToKey(d)
          return (
            <div key={k} className={k === todayKey ? 'planner-day today' : 'planner-day'}>
              <span className="day-name">
                {d.toLocaleDateString(undefined, { weekday: 'short' })}
              </span>
              <span className="day-date">{formatDate(d)}</span>
            </div>
          )
        })}

        {MEAL_SLOTS.map((slot) => (
          <Fragment key={slot}>
            <div className="slot-label">{slot}</div>
            {days.map((d) => {
              const k = dateToKey(d)
              const recipe = assignedRecipe(k, slot)
              return (
                <div key={k} className="slot-cell">
                  {recipe ? (
                    <div
                      className="slot-card"
                      style={{ '--accent': recipe.accentColor || '#D97757' }}
                    >
                      <img src={recipe.coverImageUrl || APPROVED_IMAGES.placeholder} alt="" onError={(e) => (e.currentTarget.src = APPROVED_IMAGES.placeholder)} />
                      <button className="slot-title" onClick={() => openRecipe(recipe.id)}>
                        {recipe.title}
                      </button>
                      <button className="slot-change" onClick={() => setPicker({ dayKey: k, slot })}>
                        replace ✕
                      </button>
                    </div>
                  ) : (
                    <button className="slot-empty" onClick={() => setPicker({ dayKey: k, slot })}>
                      + Add
                    </button>
                  )}
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>

      <div className="planner-hint">
        Click an empty slot to assign a recipe, or click a planned meal to replace or remove
        it.
      </div>

      {picker && (
        <RecipePicker
          slot={picker.slot}
          currentRecipe={assignedRecipe(picker.dayKey, picker.slot)}
          onClose={() => setPicker(null)}
          onPick={(recipeId) => assign(picker.dayKey, picker.slot, recipeId)}
          onRemove={() => remove(picker.dayKey, picker.slot)}
        />
      )}
    </div>
  )
}

function RecipePicker({ slot, currentRecipe, onClose, onPick, onRemove }) {
  const { store, navigate, startNewRecipe } = useApp()
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const suggestions = store.recipes.filter((r) => {
    if (!r.includeInMealSuggestions) return false
    if (!q) return true
    return r.title.toLowerCase().includes(q)
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Assign {slot}</h2>
          <button className="btn-icon" onClick={onClose}>
            ✕
          </button>
        </div>

        {currentRecipe && (
          <div className="modal-current">
            Currently: <strong>{currentRecipe.title}</strong>
            <button className="btn btn-ghost" onClick={onRemove}>
              Remove from plan
            </button>
          </div>
        )}

        <input
          className="picker-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipes…"
        />

        <div className="picker-list">
          {suggestions.length === 0 && (
            <p className="muted">
              No matching recipes.{' '}
              <button className="btn-link" onClick={() => navigate('catalog')}>
                Browse catalog
              </button>{' '}
              or{' '}
              <button className="btn-link" onClick={startNewRecipe}>
                add a recipe
              </button>
            </p>
          )}
          {suggestions.map((r) => (
            <button key={r.id} className="picker-item" onClick={() => onPick(r.id)}>
              <img src={r.coverImageUrl || APPROVED_IMAGES.placeholder} alt="" onError={(e) => (e.currentTarget.src = APPROVED_IMAGES.placeholder)} />
              <span>
                <strong>{r.title}</strong>
                <small>
                  {r.totalTime} min · {r.servings} servings
                </small>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}