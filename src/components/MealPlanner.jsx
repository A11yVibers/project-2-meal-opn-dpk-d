import { useState } from 'react'
import {
  DAYS,
  MEAL_SLOTS,
  PLACEHOLDER_IMAGE,
  formatShortDate,
  formatWeekRange,
  shiftWeek,
  todayMonday,
  dateKeyForWeek,
} from '../lib/utils.js'

export default function MealPlanner({ recipes, lookup, mealPlan, onAssign, onRemove, onOpen, suggestions }) {
  const [weekMonday, setWeekMonday] = useState(todayMonday())
  const [pickerSlot, setPickerSlot] = useState(null)
  const [pickerQuery, setPickerQuery] = useState('')

  function slotKey(dayIndex, slotName) {
    const dateKey = dateKeyForWeek(weekMonday, dayIndex)
    return `${dateKey}|${slotName}`
  }

  function openPicker(dayIndex, slotName) {
    setPickerSlot({ dayIndex, slotName })
    setPickerQuery('')
  }

  function choose(recipeId) {
    if (!pickerSlot) return
    onAssign(slotKey(pickerSlot.dayIndex, pickerSlot.slotName), recipeId)
    setPickerSlot(null)
  }

  function clearSlot(dayIndex, slotName) {
    onRemove(slotKey(dayIndex, slotName))
  }

  const todayISO = new Date().toISOString().slice(0, 10)
  const pickerOptions = suggestions.filter(
    (r) => !pickerQuery.trim() || r.title.toLowerCase().includes(pickerQuery.trim().toLowerCase()),
  )

  return (
    <section className="planner">
      <div className="planner-head">
        <h1>Weekly Meal Planner</h1>
        <div className="week-nav">
          <button className="btn btn-ghost" onClick={() => setWeekMonday((w) => shiftWeek(w, -1))}>
            ← Prev
          </button>
          <button className="btn btn-ghost today-btn" onClick={() => setWeekMonday(todayMonday())}>
            Today
          </button>
          <button className="btn btn-ghost" onClick={() => setWeekMonday((w) => shiftWeek(w, 1))}>
            Next →
          </button>
          <span className="week-range">{formatWeekRange(weekMonday)}</span>
        </div>
      </div>

      <div className="planner-grid">
        {DAYS.map((day, dayIndex) => {
          const dateKey = dateKeyForWeek(weekMonday, dayIndex)
          const isToday = dateKey === todayISO
          return (
            <div key={day} className={`day-column ${isToday ? 'today' : ''}`}>
              <div className="day-header">
                <span className="day-name">{day}</span>
                <span className="day-date">{formatShortDate(dateKey)}</span>
              </div>
              {MEAL_SLOTS.map((slot) => {
                const key = slotKey(dayIndex, slot)
                const recipeId = mealPlan[key]
                const recipe = recipeId ? recipes[recipeId] : null
                return (
                  <div key={slot} className={`meal-slot ${recipe ? 'filled' : 'empty'}`}>
                    <div className="slot-label">{slot}</div>
                    {recipe ? (
                      <button className="slot-recipe" onClick={() => onOpen(recipe.id)}>
                        <img src={recipe.coverImageUrl || PLACEHOLDER_IMAGE} alt="" onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMAGE)} />
                        <span className="slot-recipe-title">{recipe.title}</span>
                      </button>
                    ) : (
                      <button className="slot-add" onClick={() => openPicker(dayIndex, slot)}>
                        + Add recipe
                      </button>
                    )}
                    {recipe && (
                      <div className="slot-actions">
                        <button className="chip-btn" onClick={() => openPicker(dayIndex, slot)}>
                          Replace
                        </button>
                        <button className="chip-btn danger" onClick={() => clearSlot(dayIndex, slot)}>
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {pickerSlot && (
        <div className="modal-backdrop" onClick={() => setPickerSlot(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>
                Add recipe to {pickerSlot.slotName} — {DAYS[pickerSlot.dayIndex]}
              </h2>
              <button className="icon-btn" onClick={() => setPickerSlot(null)}>
                ✕
              </button>
            </div>
            <div className="search-wrap">
              <input
                type="search"
                placeholder="Search recipes…"
                value={pickerQuery}
                onChange={(e) => setPickerQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-list">
              {pickerOptions.length === 0 && <p className="hint">No matching recipes.</p>}
              {pickerOptions.map((r) => (
                <button key={r.id} className="modal-recipe" onClick={() => choose(r.id)}>
                  <img src={r.coverImageUrl || PLACEHOLDER_IMAGE} alt="" onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMAGE)} />
                  <span className="modal-recipe-info">
                    <span className="modal-recipe-title">{r.title}</span>
                    <span className="modal-recipe-meta">
                      {mealTypeName(r, lookup)} · {r.servings} servings
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function mealTypeName(recipe, lookup) {
  const m = lookup.mealTypes.find((m) => m.id === recipe.mealTypeId)
  return m ? m.name : ''
}