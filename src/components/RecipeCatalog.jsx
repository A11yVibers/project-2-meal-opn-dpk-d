import { useMemo, useState } from 'react'
import { PLACEHOLDER_IMAGE, formatDuration } from '../lib/utils.js'

export default function RecipeCatalog({ recipes, lookup, onOpen, onNew }) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ cuisine: '', mealType: '', dietary: '', category: '' })

  const filtered = useMemo(() => {
    let list = recipes
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((r) => r.title.toLowerCase().includes(q) || (r.shortDescription || '').toLowerCase().includes(q))
    }
    if (filters.cuisine) list = list.filter((r) => r.cuisineId === filters.cuisine)
    if (filters.mealType) list = list.filter((r) => r.mealTypeId === filters.mealType)
    if (filters.dietary) list = list.filter((r) => (r.dietaryTagIds || []).includes(filters.dietary))
    if (filters.category) list = list.filter((r) => (r.categoryIds || []).includes(filters.category))
    return list
  }, [recipes, query, filters])

  const hasFilters = query || filters.cuisine || filters.mealType || filters.dietary || filters.category

  return (
    <section className="catalog">
      <div className="catalog-head">
        <div>
          <h1>Recipes</h1>
          <p className="muted">{recipes.length} recipes in your library</p>
        </div>
        <button className="btn btn-primary" onClick={onNew}>
          + New Recipe
        </button>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <input
            type="search"
            placeholder="Search recipes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <select value={filters.cuisine} onChange={(e) => setFilters((f) => ({ ...f, cuisine: e.target.value }))}>
          <option value="">All cuisines</option>
          {lookup.cuisines.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={filters.mealType} onChange={(e) => setFilters((f) => ({ ...f, mealType: e.target.value }))}>
          <option value="">All meal types</option>
          {lookup.mealTypes.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <select value={filters.dietary} onChange={(e) => setFilters((f) => ({ ...f, dietary: e.target.value }))}>
          <option value="">All dietary</option>
          {lookup.dietaryTags.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
          <option value="">All categories</option>
          {lookup.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {hasFilters && (
          <button
            className="btn btn-ghost"
            onClick={() => {
              setQuery('')
              setFilters({ cuisine: '', mealType: '', dietary: '', category: '' })
            }}
          >
            Clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>No recipes match your search.</p>
        </div>
      ) : (
        <div className="recipe-grid">
          {filtered.map((r) => (
            <RecipeCard key={r.id} recipe={r} lookup={lookup} onOpen={() => onOpen(r.id)} />
          ))}
        </div>
      )}
    </section>
  )
}

function RecipeCard({ recipe, lookup, onOpen }) {
  const cuisine = lookup.cuisines.find((c) => c.id === recipe.cuisineId)
  const mealType = lookup.mealTypes.find((m) => m.id === recipe.mealTypeId)
  const tags = (recipe.dietaryTagIds || [])
    .map((id) => lookup.dietaryTags.find((d) => d.id === id))
    .filter(Boolean)
  const image = recipe.coverImageUrl || PLACEHOLDER_IMAGE

  return (
    <button className="recipe-card" onClick={onOpen} style={{ '--accent': recipe.accentColor }}>
      <div className="card-thumb">
        <img src={image} alt={recipe.title} loading="lazy" onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMAGE)} />
      </div>
      <div className="card-body">
        <div className="card-meta">
          {mealType && <span className="chip">{mealType.name}</span>}
          {cuisine && <span className="chip chip-muted">{cuisine.name}</span>}
        </div>
        <h3 className="card-title">{recipe.title}</h3>
        {recipe.shortDescription && <p className="card-desc">{recipe.shortDescription}</p>}
        <div className="card-footer">
          <span className="card-time">{formatDuration(recipe.totalTime || recipe.prepTime + recipe.cookTime)}</span>
          <span className="card-servings">{recipe.servings} servings</span>
        </div>
        {tags.length > 0 && (
          <div className="tag-list">
            {tags.slice(0, 3).map((t) => (
              <span key={t.id} className="tag">
                {t.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}