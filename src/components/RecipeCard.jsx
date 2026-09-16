import { APPROVED_IMAGES } from '../approved-images.js'
import { cuisineName, mealTypeName, SPICE_LABELS, DIETARY_TAGS, RECIPE_CATEGORIES } from '../lib/data.js'

function formatMinutes(min) {
  if (!min) return null
  if (min >= 60) {
    const h = Math.floor(min / 60)
    const m = min % 60
    return m ? `${h}h ${m}m` : `${h}h`
  }
  return `${min}m`
}

export default function RecipeCard({ recipe, onOpen }) {
  const imageUrl = recipe.coverImageUrl || APPROVED_IMAGES.placeholder
  const cuisine = cuisineName(recipe.cuisineId)
  const mealType = mealTypeName(recipe.mealTypeId)

  const dietary = (recipe.dietaryTagIds || [])
    .map((id) => DIETARY_TAGS.find((t) => t.id === id))
    .filter(Boolean)

  const categories = (recipe.categoryIds || [])
    .map((id) => RECIPE_CATEGORIES.find((c) => c.id === id))
    .filter(Boolean)

  return (
    <article
      className="recipe-card"
      style={{ '--accent': recipe.accentColor || '#D97757' }}
      onClick={() => onOpen(recipe.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpen(recipe.id)
      }}
    >
      <div className="recipe-card-img">
        <img src={imageUrl} alt={recipe.title} loading="lazy" />
        <span className="recipe-card-accent" />
      </div>
      <div className="recipe-card-body">
        <h3 className="recipe-card-title">{recipe.title}</h3>
        {recipe.shortDescription && (
          <p className="recipe-card-desc">{recipe.shortDescription}</p>
        )}
        <div className="recipe-card-meta">
          {mealType && <span className="chip">{mealType}</span>}
          {cuisine && <span className="chip chip-muted">{cuisine}</span>}
          {(recipe.totalTimeMinutes || recipe.prepTimeMinutes || recipe.cookTimeMinutes) ? (
            <span className="chip chip-muted">
              {formatMinutes(recipe.totalTimeMinutes || recipe.prepTimeMinutes + recipe.cookTimeMinutes)}
            </span>
          ) : null}
          {recipe.spiceLevel > 0 && (
            <span className="chip chip-muted" title={`Spice: ${SPICE_LABELS[recipe.spiceLevel]}`}>
              {'🌶'.repeat(Math.min(recipe.spiceLevel, 5))}
            </span>
          )}
        </div>
        {(dietary.length > 0 || categories.length > 0) && (
          <div className="recipe-card-tags">
            {categories.slice(0, 2).map((c) => (
              <span key={c.id} className="tag">{c.name}</span>
            ))}
            {dietary.slice(0, 2).map((t) => (
              <span key={t.id} className="tag tag-diet">{t.name}</span>
            ))}
            {recipe.isUser && <span className="tag tag-user">Yours</span>}
          </div>
        )}
      </div>
    </article>
  )
}