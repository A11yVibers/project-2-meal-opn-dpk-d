import { useApp } from '../App.jsx'
import { APPROVED_IMAGES } from '../approved-images.js'
import {
  cuisineName,
  mealTypeName,
  dietaryTagNames,
  categoryNames,
} from '../store.js'

export default function RecipeDetail({ recipeId }) {
  const { store, navigate, editRecipe } = useApp()
  const recipe = store.recipes.find((r) => r.id === recipeId)

  if (!recipe) {
    return (
      <div className="detail-empty">
        <p>Recipe not found.</p>
        <button className="btn btn-primary" onClick={() => navigate('catalog')}>
          Back to recipes
        </button>
      </div>
    )
  }

  const ingredientSections = groupSections(recipe.ingredients)

  return (
    <div className="detail">
      <button className="btn btn-ghost back" onClick={() => navigate('catalog')}>
        ← Back to recipes
      </button>

      <div className="detail-hero" style={{ '--accent': recipe.accentColor || '#D97757' }}>
        <div className="detail-img">
          <img
            src={recipe.coverImageUrl || APPROVED_IMAGES.placeholder}
            alt={recipe.title}
            onError={(e) => {
              e.currentTarget.src = APPROVED_IMAGES.placeholder
            }}
          />
        </div>
        <div className="detail-head">
          <h1>{recipe.title}</h1>
          <p className="detail-desc">{recipe.shortDescription}</p>

          <div className="detail-tags">
            <span className="chip">{cuisineName(recipe.cuisineId)}</span>
            {mealTypeName(recipe.mealTypeId) && (
              <span className="chip">{mealTypeName(recipe.mealTypeId)}</span>
            )}
            {categoryNames(recipe.categoryIds).map((c) => (
              <span key={c} className="chip">
                {c}
              </span>
            ))}
          </div>
          <div className="chips chips-muted">
            {dietaryTagNames(recipe.dietaryTagIds).map((d) => (
              <span key={d} className="chip">
                {d}
              </span>
            ))}
          </div>

          <div className="detail-facts">
            <Fact label="Servings" value={recipe.servings} />
            <Fact label="Prep" value={`${recipe.prepTime} min`} />
            <Fact label="Cook" value={`${recipe.cookTime} min`} />
            <Fact label="Total" value={`${recipe.totalTime} min`} />
            <Fact
              label="Spice"
              value={
                recipe.spiceLevel === 0
                  ? 'None'
                  : '🌶'.repeat(Math.min(recipe.spiceLevel, 5))
              }
            />
          </div>

          {recipe.sourceUrl && (
            <a className="source-link" href={recipe.sourceUrl} target="_blank" rel="noreferrer">
              Source: {recipe.sourceName || recipe.sourceUrl}
            </a>
          )}

          {!recipe.isSeed && (
            <button className="btn btn-ghost" onClick={() => editRecipe(recipe.id)}>
              ✎ Edit recipe
            </button>
          )}
        </div>
      </div>

      <section className="detail-section">
        <h2>Ingredients</h2>
        {ingredientSections.map(({ section, items }) => (
          <div key={section} className="ingredient-section">
            {section && section !== 'Main' && <h3>{section}</h3>}
            <ul className="ingredient-list">
              {items.map((ing) => (
                <li key={ing.id} className={ing.optional ? 'optional' : ''}>
                  <span className="ing-qty">
                    {formatIngredientQty(ing)}
                  </span>
                  <span className="ing-name">{ing.ingredientName}</span>
                  {ing.notes && <span className="ing-notes">({ing.notes})</span>}
                  {ing.optional && <span className="ing-optional">optional</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {recipe.ingredients.length === 0 && <p className="muted">No ingredients listed.</p>}
      </section>

      <section className="detail-section">
        <h2>Method</h2>
        <ol className="step-list">
          {recipe.steps.map((step, i) => (
            <li key={step.id}>
              <span className="step-num">{i + 1}</span>
              <span className="step-text">{step.instruction}</span>
              {step.timerMinutes > 0 && (
                <span className="step-timer">⏱ {step.timerMinutes} min</span>
              )}
            </li>
          ))}
        </ol>
        {recipe.steps.length === 0 && <p className="muted">No steps yet.</p>}
      </section>
    </div>
  )
}

function Fact({ label, value }) {
  return (
    <div className="fact">
      <span className="fact-label">{label}</span>
      <span className="fact-value">{value}</span>
    </div>
  )
}

function groupSections(ingredients) {
  const map = new Map()
  for (const ing of ingredients) {
    if (!map.has(ing.section)) map.set(ing.section, [])
    map.get(ing.section).push(ing)
  }
  return [...map.entries()].map(([section, items]) => ({ section, items }))
}

function formatIngredientQty(ing) {
  const q = ing.quantity
  const unit = ing.unit
  if (!q && !unit) return '—'
  if (!q) return unit
  if (!unit) return q
  return `${q} ${unit}`
}