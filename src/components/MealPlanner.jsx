import { useState, useMemo, useRef, useEffect } from 'react'
import { DAYS, MEAL_SLOTS } from '../lib/domain'
import { weekDates, slotKeyFor, useWeekNavigation } from '../lib/useAppState'
import { RecipeImage } from './Shared'

export default function MealPlanner({ state, onOpen }) {
  const { prevWeek, nextWeek } = useWeekNavigation(state.weekStart, state.setWeekStart)
  const dates = useMemo(() => weekDates(state.weekStart), [state.weekStart])

  const [picking, setPicking] = useState(null) // { slot, slotKey }
  const [search, setSearch] = useState('')
  const pickerRef = useRef(null)

  useEffect(() => {
    if (!picking) return
    const onKey = (e) => {
      if (e.key === 'Escape') setPicking(null)
    }
    const onClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPicking(null)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onClick)
    }
  }, [picking])

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase()
    return state.recipes.filter((r) => {
      if (!r.includeInMealSuggestions && !q) return false
      if (q && !`${r.title} ${r.description}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [state.recipes, search])

  const startLabel = new Date(state.weekStart).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
  const endDate = new Date(state.weekStart)
  endDate.setDate(endDate.getDate() + 6)
  const endLabel = endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  return (
    <div className="planner">
      <div className="planner-head">
        <h2>Weekly Meal Planner</h2>
        <div className="week-nav">
          <button className="btn" onClick={prevWeek}>
            ← Prev
          </button>
          <span className="week-label">
            {startLabel} – {endLabel}
          </span>
          <button className="btn" onClick={nextWeek}>
            Next →
          </button>
          <button className="btn btn-ghost" onClick={() => state.setWeekStart(startOfToday())}>
            This week
          </button>
        </div>
      </div>

      <div className="planner-grid">
        <div className="planner-corner" />
        {DAYS.map((day) => (
          <div key={day} className="planner-day-head">
            <span className="day-name">{day}</span>
            <span className="day-date">{shortDate(dates[DAYS.indexOf(day)])}</span>
          </div>
        ))}

        {MEAL_SLOTS.map((slot) => (
          <div key={slot} className="planner-slot-row">
            <div className="slot-label">{slot}</div>
            {DAYS.map((day) => {
              const iso = dates[DAYS.indexOf(day)]
              const key = slotKeyFor(iso, slot)
              const entry = state.plan[key]
              const recipe = entry ? state.getRecipe(entry.recipeId) : null
              return (
                <div
                  key={key}
                  className={`slot-cell ${recipe ? 'filled' : 'empty'}`}
                  onClick={() => {
                    if (recipe) return
                    setPicking({ slot, key })
                    setSearch('')
                  }}
                >
                  {recipe ? (
                    <PlannedCard
                      recipe={recipe}
                      onOpen={() => onOpen(recipe.id)}
                      onRemove={() => state.removeSlot(key)}
                      onReplace={() => {
                        setPicking({ slot, key })
                        setSearch('')
                      }}
                    />
                  ) : (
                    <button className="slot-add">+ Add recipe</button>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {picking && (
        <div className="picker-overlay">
          <div className="picker" ref={pickerRef}>
            <div className="picker-head">
              <h3>Choose a recipe for {picking.slot}</h3>
              <button className="icon-btn" onClick={() => setPicking(null)}>
                ✕
              </button>
            </div>
            <input
              className="search-input"
              autoFocus
              type="search"
              placeholder="Search recipes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="picker-list">
              {suggestions.map((r) => (
                <button
                  key={r.id}
                  className="picker-item"
                  onClick={() => {
                    state.assignSlot(picking.key, r.id)
                    setPicking(null)
                  }}
                >
                  <RecipeImage recipe={r} className="picker-img" />
                  <span className="picker-title">{r.title}</span>
                </button>
              ))}
              {suggestions.length === 0 && <p className="picker-empty">No recipes found.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PlannedCard({ recipe, onOpen, onRemove, onReplace }) {
  return (
    <div className="planned-card">
      <div className="planned-img">
        <RecipeImage recipe={recipe} />
      </div>
      <button className="planned-title" onClick={onOpen}>
        {recipe.title}
      </button>
      <div className="planned-actions">
        <button className="mini-btn" onClick={onReplace} title="Replace">
          ⇄
        </button>
        <button className="mini-btn danger" onClick={onRemove} title="Remove">
          ✕
        </button>
      </div>
    </div>
  )
}

function shortDate(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d.getTime()
}