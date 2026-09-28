import { useApp } from '../App.jsx'
import { APPROVED_IMAGES } from '../approved-images.js'
import { cuisineName, mealTypeName, dietaryTagNames, categoryNames } from '../store.js'

export default function RecipeCatalog() {
  const { store, openRecipe, startNewRecipe } = useApp()

  return (
    <div className="catalog">
      <div className="catalog-head">
        <h1>Recipes</h1>
        <button className="btn btn-primary" onClick={startNewRecipe}>
          + Add Recipe
        </button>
      </div>

      <div className="recipe-grid">
        {store.recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} onOpen={() => openRecipe(recipe.id)} />
        ))}
      </div>

      {store.recipes.length === 0 && (
        <p className="empty">No recipes yet. Add your first recipe to get started.</p>
      )}
    </div>
  )
}

function RecipeCard({ recipe, onOpen }) {
  const cuisine = cuisineName(recipe.cuisineId)
  const categories = categoryNames(recipe.categoryIds).slice(0, 2)
  const dietary = dietaryTagNames(recipe.dietaryTagIds).slice(0, 3)

  return (
    <article
      className="recipe-card"
      onClick={onOpen}
      style={{ '--accent': recipe.accentColor || '#D97757' }}
    >
      <div className="recipe-card-img">
        <img
          src={recipe.coverImageUrl || APPROVED_IMAGES.placeholder}
          alt={recipe.title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = APPROVED_IMAGES.placeholder
          }}
        />
      </div>
      <div className="recipe-card-body">
        <div className="recipe-card-top">
          <h3>{recipe.title}</h3>
          <span className="recipe-card-cuisine">{cuisine}</span>
        </div>
        <p className="recipe-card-desc">{recipe.shortDescription}</p>
        <div className="recipe-card-meta">
          <span>
            {recipe.totalTime} min · {recipe.servings} servings
          </span>
          {recipe.spiceLevel > 0 && (
            <span className="spice-dots" title="Spice level">
              {'🌶'.repeat(Math.min(recipe.spiceLevel, 5))}
            </span>
          )}
        </div>
        {categories.length > 0 && (
          <div className="chips">
            {categories.map((c) => (
              <span key={c} className="chip">
                {c}
              </span>
            ))}
          </div>
        )}
        {dietary.length > 0 && (
          <div className="chips chips-muted">
            {dietary.map((d) => (
              <span key={d} className="chip">
                {d}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}