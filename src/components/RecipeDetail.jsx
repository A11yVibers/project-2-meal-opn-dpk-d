import { PLACEHOLDER_IMAGE, formatDuration } from '../lib/utils.js'

export default function RecipeDetail({ recipe, lookup, onBack, onEdit, onDelete, isUserRecipe }) {
  if (!recipe) {
    return (
      <section className="detail">
        <button className="btn btn-ghost" onClick={onBack}>
          ← Back
        </button>
        <div className="empty-state">
          <p>Recipe not found.</p>
        </div>
      </section>
    )
  }

  const cuisine = lookup.cuisines.find((c) => c.id === recipe.cuisineId)
  const mealType = lookup.mealTypes.find((m) => m.id === recipe.mealTypeId)
  const dietaryTags = (recipe.dietaryTagIds || [])
    .map((id) => lookup.dietaryTags.find((d) => d.id === id))
    .filter(Boolean)
  const categories = (recipe.categoryIds || []).map((id) => lookup.categories.find((c) => c.id === id)).filter(Boolean)
  const image = recipe.coverImageUrl || PLACEHOLDER_IMAGE

  return (
    <section className="detail">
      <div className="detail-topbar">
        <button className="btn btn-ghost" onClick={onBack}>
          ← Back
        </button>
        <div className="detail-actions">
          {isUserRecipe && (
            <>
              <button className="btn btn-ghost" onClick={() => onEdit(recipe.id)}>
                Edit
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  if (window.confirm(`Delete "${recipe.title}"? This cannot be undone.`)) onDelete(recipe.id)
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="detail-hero" style={{ '--accent': recipe.accentColor }}>
        <img src={image} alt={recipe.title} onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMAGE)} />
      </div>

      <h1 className="detail-title">{recipe.title}</h1>
      {recipe.shortDescription && <p className="detail-desc">{recipe.shortDescription}</p>}

      <div className="detail-meta-row">
        {mealType && <span className="chip">{mealType.name}</span>}
        {cuisine && <span className="chip chip-muted">{cuisine.name}</span>}
        {dietaryTags.map((t) => (
          <span key={t.id} className="tag">
            {t.name}
          </span>
        ))}
        {categories.map((c) => (
          <span key={c.id} className="tag tag-cat">
            {c.name}
          </span>
        ))}
      </div>

      {recipe.sourceUrl && (
        <a className="source-link" href={recipe.sourceUrl} target="_blank" rel="noreferrer">
          Source: {recipe.sourceName || 'Open recipe source'}
        </a>
      )}

      <div className="stat-grid">
        <Stat label="Servings" value={recipe.servings} />
        <Stat label="Prep time" value={formatDuration(recipe.prepTime)} />
        <Stat label="Cook time" value={formatDuration(recipe.cookTime)} />
        <Stat label="Total time" value={formatDuration(recipe.totalTime || recipe.prepTime + recipe.cookTime)} />
        <Stat label="Spice level" value={spiceLabel(recipe.spiceLevel)} />
        <Stat label="Difficulty" value={difficultyLabel(recipe.difficulty)} />
      </div>

      <RecipeSections sections={recipe.sections} />
      <RecipeSteps steps={recipe.steps} />
    </section>
  )
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value || '—'}</div>
    </div>
  )
}

function spiceLabel(level) {
  const n = Number(level) || 0
  if (n <= 0) return 'Not spicy'
  if (n === 1) return 'Mild'
  if (n === 2) return 'Mild-medium'
  if (n === 3) return 'Medium'
  if (n === 4) return 'Spicy'
  return 'Very spicy'
}

function difficultyLabel(n) {
  const v = Number(n) || 0
  return ['Easy', 'Easy', 'Moderate', 'Moderate', 'Advanced', 'Expert'][v] || 'Easy'
}

function RecipeSections({ sections }) {
  if (!sections || sections.length === 0) return null
  return (
    <div className="panel">
      <h2>Ingredients</h2>
      {sections.map((section, i) => (
        <div key={i} className="ingredient-section">
          <h3 className="section-name">{section.name}</h3>
          <ul className="ingredient-list">
            {section.ingredients.map((ing, j) => (
              <li key={j} className={ing.optional ? 'optional' : ''}>
                <span className="ing-text">
                  <span className="ing-qty">
                    {ing.quantity ? ing.quantity : ''}
                    {ing.unit ? ` ${ing.unit}` : ''}
                  </span>{' '}
                  {ing.name}
                  {ing.notes ? <span className="ing-notes"> ({ing.notes})</span> : null}
                </span>
                {ing.optional && <span className="optional-tag">optional</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function RecipeSteps({ steps }) {
  if (!steps || steps.length === 0) return null
  return (
    <div className="panel">
      <h2>Method</h2>
      <ol className="step-list">
        {steps.map((step, i) => (
          <li key={i} className="step-item">
            <span className="step-num">{i + 1}</span>
            <div className="step-body">
              <p className="step-text">{step.instruction}</p>
              {step.timer > 0 && <span className="step-timer">⏱ {step.timer} min</span>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}