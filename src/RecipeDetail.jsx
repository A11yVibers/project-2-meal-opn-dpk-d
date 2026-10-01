import { resolveImage } from './data.js'
import { formatMinutes } from './utils.js'
import { SpiceLabel } from './components.jsx'

export default function RecipeDetail({ recipe, onBack, onEdit }) {
  if (!recipe) return null
  const totalTime = recipe.totalTimeMinutes || (recipe.prepTimeMinutes + recipe.cookTimeMinutes)
  return (
    <div className="recipe-detail">
      <header className="detail-header" style={{ '--accent': recipe.accentColor || '#999' }}>
        <button className="btn ghost" onClick={onBack}>← Back</button>
        <div className="detail-header-actions">
          {!recipe.seed && <button className="btn ghost" onClick={() => onEdit(recipe)}>Edit</button>}
        </div>
      </header>
      <div className="detail-cover">
        <img src={resolveImage(recipe.coverImageUrl)} alt={recipe.title} />
      </div>
      <div className="detail-body">
        <h1 className="detail-title">{recipe.title}</h1>
        {recipe.shortDescription && <p className="detail-desc">{recipe.shortDescription}</p>}
        <div className="detail-tags">
          {recipe.cuisine && <span className="tag">{recipe.cuisine}</span>}
          {recipe.mealType && <span className="tag">{recipe.mealType}</span>}
          {(recipe.dietaryTags || []).map((t, i) => <span key={i} className="tag">{t}</span>)}
          {(recipe.categories || []).map((t, i) => <span key={i} className="tag subtle">{t}</span>)}
        </div>
        <div className="detail-meta">
          <span><strong>{recipe.servings}</strong> servings</span>
          <span><strong>{formatMinutes(recipe.prepTimeMinutes)}</strong> prep</span>
          <span><strong>{formatMinutes(recipe.cookTimeMinutes)}</strong> cook</span>
          <span><strong>{formatMinutes(totalTime)}</strong> total</span>
          <span><SpiceLabel level={recipe.spiceLevel} /></span>
        </div>
        {recipe.sourceUrl && (
          <a className="detail-source" href={recipe.sourceUrl} target="_blank" rel="noreferrer">View source ↗</a>
        )}

        <section className="detail-section">
          <h2>Ingredients</h2>
          {(recipe.sections || []).map((section) => (
            <div key={section.id} className="detail-ing-section">
              {section.name && <h3 className="detail-ing-title">{section.name}</h3>}
              <ul className="detail-ing-list">
                {section.ingredients.map((ing) => (
                  <li key={ing.id}>
                    <span className="ing-qty">{ing.quantity} {ing.unit}</span>
                    <span className="ing-name">{ing.name}</span>
                    {ing.notes && <span className="ing-notes">({ing.notes})</span>}
                    {ing.optional && <span className="ing-optional">optional</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="detail-section">
          <h2>Method</h2>
          <ol className="detail-steps">
            {(recipe.steps || []).map((step, i) => (
              <li key={step.id}>
                <span className="detail-step-text">{step.instruction}</span>
                {step.timerMinutes > 0 && <span className="detail-step-timer">⏱ {step.timerMinutes} min</span>}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  )
}