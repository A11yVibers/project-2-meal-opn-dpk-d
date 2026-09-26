import { useState, useMemo } from 'react'
import { APPROVED_IMAGES } from '../approved-images'

function recipeImage(recipe) {
  return recipe.coverImageUrl || APPROVED_IMAGES.placeholder
}

export default function Catalog({ recipes, onOpen, onNew }) {
  const [query, setQuery] = useState('')
  const [mealFilter, setMealFilter] = useState('')
  const [cuisineFilter, setCuisineFilter] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return recipes.filter((r) => {
      if (mealFilter && r.mealTypeName !== mealFilter) return false
      if (cuisineFilter && r.cuisineName !== cuisineFilter) return false
      if (q) {
        const hay = `${r.title} ${r.shortDescription} ${r.cuisineName} ${(r.dietaryTagIds || []).join(' ')} ${(r.categoryIds || []).join(' ')}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [recipes, query, mealFilter, cuisineFilter])

  const mealOptions = [...new Set(recipes.map((r) => r.mealTypeName).filter(Boolean))].sort()
  const cuisineOptions = [...new Set(recipes.map((r) => r.cuisineName).filter(Boolean))].sort()

  return (
    <section className="catalog">
      <div className="catalog-head">
        <h1>Recipe Catalog</h1>
        <p className="muted">{recipes.length} recipes</p>
      </div>

      <div className="filters">
        <input
          className="search"
          type="text"
          placeholder="Search recipes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={mealFilter} onChange={(e) => setMealFilter(e.target.value)}>
          <option value="">All meal types</option>
          {mealOptions.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={cuisineFilter} onChange={(e) => setCuisineFilter(e.target.value)}>
          <option value="">All cuisines</option>
          {cuisineOptions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <p>No recipes match your filters.</p>
          <button className="btn primary" onClick={onNew}>Add a recipe</button>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map((r) => (
            <button className="recipe-card" key={r.id} onClick={() => onOpen(r.id)}>
              <div className="thumb" style={{ '--accent': r.accentColor || '#D97757' }}>
                <img src={recipeImage(r)} alt={r.title} loading="lazy" />
                {r.cuisineName && <span className="chip cuisine">{r.cuisineName}</span>}
              </div>
              <div className="card-body">
                <h3>{r.title}</h3>
                {r.shortDescription && <p className="muted clamp">{r.shortDescription}</p>}
                <div className="meta">
                  {r.mealTypeName && <span className="tag">{r.mealTypeName}</span>}
                  <span className="tag light">{r.servings} serv</span>
                  <span className="tag light">{r.totalTimeMinutes} min</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}