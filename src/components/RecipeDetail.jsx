import { useState } from 'react'
import { APPROVED_IMAGES } from '../approved-images.js'
import {
  CUISINES,
  DIETARY_TAGS,
  RECIPE_CATEGORIES,
  MEAL_TYPES,
  MEAL_SLOTS,
  SPICE_LABELS,
  MEASUREMENT_SYSTEMS,
} from '../lib/data.js'
import { todayKey, addDays, toKey } from '../lib/dates.js'

const timerIcon = '⏱'

function formatMinutes(min) {
  if (!min) return null
  if (min >= 60) {
    const h = Math.floor(min / 60)
    const m = min % 60
    return m ? `${h}h ${m}m` : `${h}h`
  }
  return `${min}m`
}

function nameFor(list, id) {
  const item = list.find((x) => x.id === id)
  return item ? item.name : ''
}

export default function RecipeDetail({ recipe, onBack, onEdit, onDelete, onAddToPlan }) {
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [planDay, setPlanDay] = useState(todayKey())
  const [planSlot, setPlanSlot] = useState('Dinner')

  if (!recipe) return null

  const imageUrl = recipe.coverImageUrl || APPROVED_IMAGES.placeholder
  const groupedIngredients = groupSections(recipe.ingredients)
  const measurementName =
    MEASUREMENT_SYSTEMS.find((m) => m.id === recipe.options?.measurementSystem)?.name ||
    'US customary'

  const initSlot = () => {
    const mt = nameFor(MEAL_TYPES, recipe.mealTypeId)
    return MEAL_SLOTS.includes(mt) ? mt : 'Dinner'
  }

  const openPlanDialog = () => {
    setPlanSlot(initSlot())
    setPlanDay(todayKey())
    setShowPlanDialog(true)
  }

  return (
    <section className="view recipe-detail" style={{ '--accent': recipe.accentColor || '#D97757' }}>
      <div className="detail-topbar">
        <button className="btn btn-ghost" onClick={onBack}>← Recipes</button>
        <div className="detail-actions">
          {recipe.isUser && (
            <>
              <button className="btn" onClick={() => onEdit(recipe.id)}>Edit</button>
              <button className="btn btn-danger" onClick={() => onDelete(recipe.id)}>Delete</button>
            </>
          )}
          <button className="btn btn-primary" onClick={openPlanDialog}>+ Add to meal plan</button>
        </div>
      </div>

      <div className="detail-hero">
        <img src={imageUrl} alt={recipe.title} className="detail-img" />
        <div className="detail-intro">
          <h1>{recipe.title}</h1>
          {recipe.shortDescription && <p className="detail-desc">{recipe.shortDescription}</p>}
          {recipe.sourceUrl && (
            <a className="source-link" href={recipe.sourceUrl} target="_blank" rel="noreferrer">
              {recipe.sourceName || 'Source link'} ↗
            </a>
          )}
          <div className="detail-tags">
            {nameFor(MEAL_TYPES, recipe.mealTypeId) && (
              <span className="chip">{nameFor(MEAL_TYPES, recipe.mealTypeId)}</span>
            )}
            {nameFor(CUISINES, recipe.cuisineId) && (
              <span className="chip chip-muted">{nameFor(CUISINES, recipe.cuisineId)}</span>
            )}
            {(recipe.dietaryTagIds || []).map((id) => (
              <span key={id} className="chip chip-diet">{nameFor(DIETARY_TAGS, id)}</span>
            ))}
            {(recipe.categoryIds || []).map((id) => (
              <span key={id} className="chip chip-muted">{nameFor(RECIPE_CATEGORIES, id)}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="detail-meta-grid">
        <MetaStat label="Servings" value={recipe.servings} />
        <MetaStat label="Prep" value={formatMinutes(recipe.prepTimeMinutes) || '—'} />
        <MetaStat label="Cook" value={formatMinutes(recipe.cookTimeMinutes) || '—'} />
        <MetaStat label="Total" value={formatMinutes(recipe.totalTimeMinutes) || '—'} />
        <MetaStat
          label="Spice"
          value={
            recipe.spiceLevel > 0
              ? `${SPICE_LABELS[recipe.spiceLevel]} ${'🌶'.repeat(Math.min(recipe.spiceLevel, 5))}`
              : 'None'
          }
        />
        {recipe.difficulty != null && (
          <MetaStat label="Difficulty" value={`${recipe.difficulty}/5`} />
        )}
      </div>

      <div className="detail-sections">
        <section className="detail-block">
          <h2>Ingredients</h2>
          {groupedIngredients.length === 0 ? (
            <p className="muted">No ingredients listed.</p>
          ) : (
            groupedIngredients.map((section) => (
              <div key={section.name} className="ingredient-section">
                <h3>{section.name}</h3>
                <ul className="ingredient-list">
                  {section.ingredients.map((ing, i) => (
                    <li key={i} className={ing.optional ? 'ingredient-optional' : ''}>
                      <span className="ingredient-qty">
                        {ing.quantity} {ing.unit}
                      </span>
                      <span className="ingredient-name">
                        {ing.name}
                        {ing.notes ? ` (${ing.notes})` : ''}
                        {ing.optional ? ' — optional' : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>

        <section className="detail-block">
          <h2>Method</h2>
          {recipe.steps.length === 0 ? (
            <p className="muted">No steps listed.</p>
          ) : (
            <ol className="step-list">
              {recipe.steps.map((step) => (
                <li key={step.stepNumber}>
                  <span className="step-number">{step.stepNumber}</span>
                  <span className="step-text">{step.instruction}</span>
                  {step.timerMinutes > 0 && (
                    <span className="step-timer">
                      {timerIcon} {formatMinutes(step.timerMinutes)}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>

        {recipe.options?.showNutrition && (
          <section className="detail-block">
            <h2>Nutrition</h2>
            <div className="nutrition-box">
              <div className="nutrition-row"><span>Per serving</span><span>—</span></div>
              <div className="nutrition-row"><span>Calories</span><span>—</span></div>
              <div className="nutrition-row"><span>Protein</span><span>—</span></div>
              <div className="nutrition-row"><span>Carbs</span><span>—</span></div>
              <div className="nutrition-row"><span>Fat</span><span>—</span></div>
              <p className="muted small">Nutrition data is not available for this recipe.</p>
            </div>
          </section>
        )}

        <section className="detail-block detail-options">
          <h2>Recipe options</h2>
          <ul className="options-list">
            <li>
              <ToggleBadge on={recipe.options?.includeInShoppingList !== false} />
              Include ingredients in generated shopping lists
            </li>
            <li>
              <ToggleBadge on={!!recipe.options?.showNutrition} />
              Show nutrition information
            </li>
            <li>
              <ToggleBadge on={recipe.options?.allowSubstitutions !== false} />
              Allow ingredient substitutions
            </li>
            <li className="options-measurement">
              Measurements:
              <span className={recipe.options?.measurementSystem === 'imperial' ? 'measure-choice active' : 'measure-choice'}>
                {recipe.options?.measurementSystem === 'imperial' ? 'US customary' : 'Metric'}
              </span>
              <span className="muted small">({measurementName})</span>
            </li>
          </ul>
        </section>
      </div>

      {showPlanDialog && (
        <PlanDialog
          day={planDay}
          slot={planSlot}
          onDayChange={setPlanDay}
          onSlotChange={setPlanSlot}
          onCancel={() => setShowPlanDialog(false)}
          onConfirm={() => {
            onAddToPlan(recipe.id, planDay, planSlot)
            setShowPlanDialog(false)
          }}
        />
      )}
    </section>
  )
}

function MetaStat({ label, value }) {
  return (
    <div className="meta-stat">
      <span className="meta-label">{label}</span>
      <span className="meta-value">{value}</span>
    </div>
  )
}

function ToggleBadge({ on }) {
  return <span className={`toggle-badge ${on ? 'on' : 'off'}`}>{on ? 'On' : 'Off'}</span>
}

function groupSections(ingredients) {
  const sections = []
  const map = new Map()
  ;(ingredients || []).forEach((ing) => {
    const name = ing.section || 'Main'
    if (!map.has(name)) {
      const entry = { name, ingredients: [] }
      map.set(name, entry)
      sections.push(entry)
    }
    map.get(name).ingredients.push(ing)
  })
  return sections
}

function PlanDialog({ day, slot, onDayChange, onSlotChange, onCancel, onConfirm }) {
  const options = []
  for (let i = 0; i < 14; i++) {
    const d = addDays(new Date(), i)
    options.push(toKey(d))
  }
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add to meal plan</h3>
        <label className="field">
          <span>Day</span>
          <select value={day} onChange={(e) => onDayChange(e.target.value)}>
            {options.map((d) => (
              <option key={d} value={d}>{d}{d === todayKey() ? ' (today)' : ''}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Meal slot</span>
          <select value={slot} onChange={(e) => onSlotChange(e.target.value)}>
            {MEAL_SLOTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <div className="modal-actions">
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={onConfirm}>Add to plan</button>
        </div>
      </div>
    </div>
  )
}