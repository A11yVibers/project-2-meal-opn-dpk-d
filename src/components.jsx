import { resolveImage, placeholderImage } from './data.js'

const SPICE_LABELS = ['Mild', 'Very mild', 'Medium', 'Spicy', 'Hot', 'Very spicy']

export function SpiceLabel({ level }) {
  const idx = Math.max(0, Math.min(5, Number(level) || 0))
  return <span className="spice-label">{SPICE_LABELS[idx]}</span>
}

export function RecipeCard({ recipe, onOpen }) {
  const tags = [
    recipe.mealType,
    ...(recipe.dietaryTags || []),
  ].filter(Boolean)
  return (
    <article className="recipe-card" style={{ '--accent': recipe.accentColor || '#999' }} onClick={() => onOpen(recipe.id)}>
      <div className="recipe-card-img">
        <img src={resolveImage(recipe.coverImageUrl)} alt={recipe.title} loading="lazy" />
      </div>
      <div className="recipe-card-body">
        <h3 className="recipe-card-title">{recipe.title}</h3>
        {recipe.shortDescription && <p className="recipe-card-desc">{recipe.shortDescription}</p>}
        <div className="recipe-card-tags">
          {tags.slice(0, 4).map((t, i) => <span key={i} className="tag">{t}</span>)}
        </div>
        <div className="recipe-card-meta">
          <span>{recipe.servings} serv.</span>
          <span>{recipe.totalTimeMinutes || (recipe.prepTimeMinutes + recipe.cookTimeMinutes)} min</span>
          <SpiceLevelDots level={recipe.spiceLevel} />
        </div>
      </div>
    </article>
  )
}

function SpiceLevelDots({ level }) {
  const lvl = Math.max(0, Math.min(5, Number(level) || 0))
  return (
    <span className="spice-dots" title={`Spice: ${lvl}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= lvl ? 'dot filled' : 'dot'} />
      ))}
    </span>
  )
}