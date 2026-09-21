import { useState } from 'react'
import { RecipeImage, timeLabel, cuisineName, mealTypeName, spiceLabel } from './Shared'
import { dietaryTagMap, categoryMap } from '../lib/domain'
import { slotKeyFor } from '../lib/useAppState'

export function SlotPicker({ onPick, placeholder = 'Choose a meal slot…', buttonClass = 'btn' }) {
  const [open, setOpen] = useState(false)
  const slots = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

  return (
    <div className="slot-picker">
      <button className={buttonClass} onClick={() => setOpen((v) => !v)}>
        {placeholder}
      </button>
      {open && (
        <div className="slot-picker-menu">
          {slots.map((s) => (
            <button
              key={s}
              onClick={() => {
                setOpen(false)
                onPick(s)
              }}
            >
              {s}
            </button>
          ))}
          <button
            className="cancel"
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

export function convertToMetric(quantity, unit) {
  const u = (unit || '').toLowerCase()
  const n = parseFloat(quantity)
  if (!Number.isFinite(n)) return { quantity, unit }
  const round = (v) => Math.round(v * 10) / 10
  switch (u) {
    case 'oz':
      return { quantity: round(n * 28.35), unit: 'g' }
    case 'lb':
      return { quantity: round(n * 0.4536), unit: 'kg' }
    case 'cup':
      return { quantity: round(n * 240), unit: 'ml' }
    case 'tbsp':
      return { quantity: round(n * 15), unit: 'ml' }
    case 'tsp':
      return { quantity: round(n * 5), unit: 'ml' }
    default:
      return { quantity, unit }
  }
}

export default function RecipeDetail({ state, recipeId, onBack, onEdit, onDelete }) {
  const recipe = state.getRecipe(recipeId)

  if (!recipe) {
    return (
      <div className="detail empty-state">
        <p>Recipe not found.</p>
        <button className="btn" onClick={onBack}>
          Back to recipes
        </button>
      </div>
    )
  }

  const useMetric = recipe.options && recipe.options.measurement === 'metric'

  const renderIngredient = (ing) => {
    let qty = ing.quantity
    let unit = ing.unit
    if (useMetric) {
      const conv = convertToMetric(qty, unit)
      qty = conv.quantity
      unit = conv.unit
    }
    return (
      <li key={ing.id} className={`ingredient-item ${ing.optional ? 'optional' : ''}`}>
        <span className="ingredient-qty">
          {qty} {unit}
        </span>
        <span className="ingredient-name">{ing.name}</span>
        {ing.notes && <span className="ingredient-notes">, {ing.notes}</span>}
        {ing.optional && <span className="optional-mark">(optional)</span>}
      </li>
    )
  }

  return (
    <div className="detail">
      <button className="btn back-btn" onClick={onBack}>
        ← Back
      </button>

      <div className="detail-hero">
        <div className="detail-image" style={{ '--accent': recipe.accentColor }}>
          <RecipeImage recipe={recipe} />
        </div>
        <div className="detail-header">
          <h1>{recipe.title}</h1>
          {recipe.description && <p className="detail-desc">{recipe.description}</p>}
          <div className="detail-meta-row">
            {recipe.mealType && <span className="pill">{mealTypeName(recipe.mealType)}</span>}
            {recipe.cuisine && <span className="pill">{cuisineName(recipe.cuisine)}</span>}
            <span className="pill">🌶️ {spiceLabel(recipe.spiceLevel)}</span>
          </div>
          {recipe.sourceUrl ? (
            <a className="detail-source" href={recipe.sourceUrl} target="_blank" rel="noreferrer">
              Source link ↗
            </a>
          ) : (
            recipe.sourceName && <span className="detail-source">{recipe.sourceName}</span>
          )}

          <div className="detail-stats">
            <div className="stat">
              <strong>{recipe.servings}</strong>
              <span>Servings</span>
            </div>
            <div className="stat">
              <strong>{timeLabel(recipe.prepTime)}</strong>
              <span>Prep</span>
            </div>
            <div className="stat">
              <strong>{timeLabel(recipe.cookTime)}</strong>
              <span>Cook</span>
            </div>
            <div className="stat">
              <strong>{timeLabel(recipe.totalTime)}</strong>
              <span>Total</span>
            </div>
          </div>

          {(recipe.dietaryTags || []).length > 0 && (
            <div className="detail-tag-row">
              {recipe.dietaryTags.map((t) => (
                <span key={t} className="tag">
                  {dietaryTagMap[t] ? dietaryTagMap[t].dietary_tag_name : t}
                </span>
              ))}
            </div>
          )}
          {(recipe.categories || []).length > 0 && (
            <div className="detail-tag-row">
              {recipe.categories.map((c) => (
                <span key={c} className="tag category">
                  {categoryMap[c] ? categoryMap[c].category_name : c}
                </span>
              ))}
            </div>
          )}

          <div className="detail-actions">
            <SlotPicker
              onPick={(slot) => {
                const iso = new Date().toISOString().slice(0, 10)
                state.assignSlot(slotKeyFor(iso, slot), recipe.id)
              }}
              placeholder="➕ Add to meal plan"
              buttonClass="btn btn-primary"
            />
            {!recipe.isSeed && (
              <>
                <button className="btn" onClick={() => onEdit(recipe)}>
                  ✏️ Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    if (window.confirm('Delete this recipe?')) onDelete(recipe.id)
                  }}
                >
                  🗑 Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="detail-sections">
        {recipe.sections && recipe.sections.length > 0 && (
          <section className="detail-ingredients">
            <h2>Ingredients</h2>
            {recipe.sections.map((sec) => (
              <div key={sec.id || sec.name} className="ingredient-section">
                <h3>{sec.name}</h3>
                <ul>{sec.ingredients.map(renderIngredient)}</ul>
              </div>
            ))}
          </section>
        )}

        {recipe.steps && recipe.steps.length > 0 && (
          <section className="detail-method">
            <h2>Method</h2>
            <ol>
              {recipe.steps.map((step, i) => (
                <li key={step.id}>
                  <span className="step-num">{i + 1}</span>
                  <span className="step-text">{step.instruction}</span>
                  {step.timer ? <span className="step-timer">⏱ {timeLabel(step.timer)}</span> : null}
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </div>
  )
}