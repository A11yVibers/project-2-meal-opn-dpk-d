import { useState, useMemo } from 'react'
import { RecipeImage, timeLabel, cuisineName, mealTypeName, spiceLabel } from './Shared'
import { dietaryTagMap, categoryMap } from '../lib/domain'

export default function RecipeCatalog({ state, onOpen, onNew }) {
  const [search, setSearch] = useState('')
  const [filterMeal, setFilterMeal] = useState('')
  const [filterCuisine, setFilterCuisine] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return state.recipes.filter((r) => {
      if (q) {
        const hay = `${r.title} ${r.description} `.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (filterMeal && r.mealType !== filterMeal) return false
      if (filterCuisine && r.cuisine !== filterCuisine) return false
      if (filterCategory && !(r.categories || []).includes(filterCategory)) return false
      return true
    })
  }, [state.recipes, search, filterMeal, filterCuisine, filterCategory])

  const mealTypes = useMemo(() => {
    const s = new Set()
    state.recipes.forEach((r) => r.mealType && s.add(r.mealType))
    return s
  }, [state.recipes])

  const cuisines = useMemo(() => {
    const s = new Set()
    state.recipes.forEach((r) => r.cuisine && s.add(r.cuisine))
    return s
  }, [state.recipes])

  return (
    <div className="catalog">
      <div className="catalog-toolbar">
        <input
          className="search-input"
          type="search"
          placeholder="Search recipes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={filterMeal} onChange={(e) => setFilterMeal(e.target.value)}>
          <option value="">All meals</option>
          {[...mealTypes].map((m) => (
            <option key={m} value={m}>
              {mealTypeName(m)}
            </option>
          ))}
        </select>
        <select value={filterCuisine} onChange={(e) => setFilterCuisine(e.target.value)}>
          <option value="">All cuisines</option>
          {[...cuisines].map((c) => (
            <option key={c} value={c}>
              {cuisineName(c)}
            </option>
          ))}
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All categories</option>
          {[...new Set(state.recipes.flatMap((r) => r.categories || []))].map((c) => (
            <option key={c} value={c}>
              {categoryMap[c] ? categoryMap[c].category_name : c}
            </option>
          ))}
        </select>
      </div>

      <div className="catalog-grid">
        {filtered.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} onOpen={onOpen} />
        ))}
        {filtered.length === 0 && (
          <div className="empty-state">
            <p>No recipes match your search.</p>
            <button className="btn btn-primary" onClick={onNew}>
              + Add a recipe
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function RecipeCard({ recipe, onOpen }) {
  return (
    <article
      className="recipe-card"
      style={{ '--accent': recipe.accentColor || '#D97757' }}
      onClick={() => onOpen(recipe.id)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen(recipe.id)
      }}
    >
      <div className="recipe-card-image">
        <RecipeImage recipe={recipe} />
        {typeof recipe.spiceLevel === 'number' && (
          <span className="spice-badge">🌶️ {spiceLabel(recipe.spiceLevel)}</span>
        )}
      </div>
      <div className="recipe-card-body">
        <h3 className="recipe-card-title">{recipe.title}</h3>
        <div className="recipe-card-meta">
          {recipe.mealType && <span className="pill">{mealTypeName(recipe.mealType)}</span>}
          {recipe.cuisine && <span className="pill">{cuisineName(recipe.cuisine)}</span>}
        </div>
        <div className="recipe-card-sub">
          <span>⏱ {timeLabel(recipe.totalTime)}</span>
          <span>🍽 {recipe.servings} serv</span>
        </div>
        {(recipe.dietaryTags || []).length > 0 && (
          <div className="recipe-card-tags">
            {recipe.dietaryTags.slice(0, 3).map((t) => (
              <span key={t} className="tag">
                {dietaryTagMap[t] ? dietaryTagMap[t].dietary_tag_name : t}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}