import { useMemo, useState } from 'react'
import RecipeCard from './RecipeCard.jsx'
import { MEAL_TYPES, DIETARY_TAGS, RECIPE_CATEGORIES, CUISINES } from '../lib/data.js'

export default function RecipeCatalog({ recipes, onOpen, onNew }) {
  const [search, setSearch] = useState('')
  const [mealTypeFilter, setMealTypeFilter] = useState('')
  const [cuisineFilter, setCuisineFilter] = useState('')
  const [dietaryFilter, setDietaryFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [ownFilter, setOwnFilter] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return recipes.filter((r) => {
      if (q) {
        const haystack = `${r.title} ${r.shortDescription}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      if (mealTypeFilter && r.mealTypeId !== mealTypeFilter) return false
      if (cuisineFilter && r.cuisineId !== cuisineFilter) return false
      if (dietaryFilter && !(r.dietaryTagIds || []).includes(dietaryFilter)) return false
      if (categoryFilter && !(r.categoryIds || []).includes(categoryFilter)) return false
      if (ownFilter && !r.isUser) return false
      return true
    })
  }, [recipes, search, mealTypeFilter, cuisineFilter, dietaryFilter, categoryFilter, ownFilter])

  return (
    <section className="view">
      <div className="view-header">
        <div>
          <h1>Recipes</h1>
          <p className="muted">{filtered.length} of {recipes.length} recipes</p>
        </div>
        <button className="btn btn-primary" onClick={onNew}>+ New recipe</button>
      </div>

      <div className="filters">
        <input
          className="search-input"
          type="search"
          placeholder="Search recipes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={mealTypeFilter} onChange={(e) => setMealTypeFilter(e.target.value)}>
          <option value="">All meal types</option>
          {MEAL_TYPES.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select value={cuisineFilter} onChange={(e) => setCuisineFilter(e.target.value)}>
          <option value="">All cuisines</option>
          {CUISINES.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={dietaryFilter} onChange={(e) => setDietaryFilter(e.target.value)}>
          <option value="">All dietary</option>
          {DIETARY_TAGS.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {RECIPE_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <label className="checkbox-inline">
          <input
            type="checkbox"
            checked={ownFilter}
            onChange={(e) => setOwnFilter(e.target.checked)}
          />
          My recipes only
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>No recipes match your filters.</p>
        </div>
      ) : (
        <div className="recipe-grid">
          {filtered.map((r) => (
            <RecipeCard key={r.id} recipe={r} onOpen={onOpen} />
          ))}
        </div>
      )}
    </section>
  )
}