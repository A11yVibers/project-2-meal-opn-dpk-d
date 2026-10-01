import { useState } from 'react'
import { resolveImage } from './data.js'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function weekKeyToDate(weekKey) {
  // <input type="week"> gives "2026-W40"
  if (!weekKey) return null
  const m = weekKey.match(/^(\d{4})-W(\d{1,2})$/)
  if (!m) return null
  const year = Number(m[1])
  const week = Number(m[2])
  const jan1 = new Date(year, 0, 1)
  const day = jan1.getDay() || 7
  const monday = new Date(jan1)
  monday.setDate(jan1.getDate() - day + 1 + (week - 1) * 7)
  return monday
}

export function currentWeekKey() {
  const now = new Date()
  const day = now.getDay() || 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + 1)
  const year = monday.getFullYear()
  const jan1 = new Date(year, 0, 1)
  const janDay = jan1.getDay() || 7
  const week = Math.ceil(((monday - jan1) / 86400000 + janDay - 1) / 7) || 1
  return `${year}-W${String(week).padStart(2, '0')}`
}

function shiftWeek(weekKey, dir) {
  const start = weekKeyToDate(weekKey) || new Date()
  start.setDate(start.getDate() + dir * 7)
  const year = start.getFullYear()
  const jan1 = new Date(year, 0, 1)
  const janDay = jan1.getDay() || 7
  const week = Math.ceil(((start - jan1) / 86400000 + janDay - 1) / 7) || 1
  return `${year}-W${String(week).padStart(2, '0')}`
}

export function dateKeyForWeekDay(weekKey, dayIndex) {
  const start = weekKeyToDate(weekKey)
  if (!start) return ''
  const d = new Date(start)
  d.setDate(start.getDate() + dayIndex)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function slotId(weekKey, dayIndex, mealType) {
  return `${weekKey}|${dayIndex}|${mealType}`
}

export default function MealPlanner({ plan, setPlan, recipes, weekKey, setWeekKey, onOpenRecipe }) {
  const [pickerFor, setPickerFor] = useState(null)

  const suggestable = recipes.filter((r) => r.includeInMealSuggestions !== false)

  function assignRecipe(slot, recipeId) {
    setPlan((p) => ({ ...p, [slot]: recipeId }))
    setPickerFor(null)
  }
  function removeRecipe(slot) {
    setPlan((p) => {
      const next = { ...p }
      delete next[slot]
      return next
    })
    setPickerFor(null)
  }

  const weekStart = weekKeyToDate(weekKey)
  const weekLabel = weekStart
    ? weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : weekKey

  return (
    <div className="planner">
      <header className="planner-header">
        <div className="planner-nav">
          <button className="btn ghost" onClick={() => setWeekKey(shiftWeek(weekKey, -1))}>← Prev week</button>
          <input type="week" value={weekKey} onChange={(e) => setWeekKey(e.target.value)} />
          <button className="btn ghost" onClick={() => setWeekKey(shiftWeek(weekKey, 1))}>Next week →</button>
        </div>
        {weekStart && <button className="btn ghost" onClick={() => setWeekKey(currentWeekKey())}>This week</button>}
      </header>

      <div className="planner-title-row">
        <h2>Week of {weekLabel}</h2>
      </div>

      <div className="planner-grid">
        <div className="planner-row planner-head">
          <div className="day-col">&nbsp;</div>
          {MEAL_TYPES.map((m) => <div className="meal-col" key={m}>{m}</div>)}
        </div>
        {DAY_NAMES.map((day, di) => (
          <div className="planner-row" key={day}>
            <div className="day-col">
              <span className="day-name">{day}</span>
              <span className="day-date">{dateKeyForWeekDay(weekKey, di)}</span>
            </div>
            {MEAL_TYPES.map((meal) => {
              const slot = slotId(weekKey, di, meal)
              const recipeId = plan[slot]
              const recipe = recipes.find((r) => r.id === recipeId)
              return (
                <div className="meal-col" key={meal}>
                  {recipe ? (
                    <div className="slot filled" style={{ '--accent': recipe.accentColor || '#999' }}>
                      <button className="slot-open" onClick={() => onOpenRecipe(recipe.id)}>
                        <img src={resolveImage(recipe.coverImageUrl)} alt="" />
                        <span className="slot-title">{recipe.title}</span>
                      </button>
                      <div className="slot-actions">
                        <button className="mini-btn" onClick={() => setPickerFor(slot)}>Replace</button>
                        <button className="mini-btn danger" onClick={() => removeRecipe(slot)}>Remove</button>
                      </div>
                    </div>
                  ) : (
                    <button className="slot empty" onClick={() => setPickerFor(slot)}>
                      <span>+ Add</span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {pickerFor && (
        <div className="modal-backdrop" onClick={() => setPickerFor(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h3>Choose a recipe</h3>
              <button className="icon-btn" onClick={() => setPickerFor(null)}>✕</button>
            </header>
            <div className="modal-body">
              {suggestable.length === 0 && <p>No recipes are available for meal-plan suggestions.</p>}
              {suggestable.map((r) => (
                <button className="suggestion-row" key={r.id} onClick={() => assignRecipe(pickerFor, r.id)}>
                  <img src={resolveImage(r.coverImageUrl)} alt="" />
                  <span className="suggestion-meta">
                    <span className="suggestion-title">{r.title}</span>
                    <span className="suggestion-sub">{r.mealType}{r.cuisine ? ' · ' + r.cuisine : ''} · {r.totalTimeMinutes || (r.prepTimeMinutes + r.cookTimeMinutes)} min</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}