import { useEffect, useMemo, useState } from 'react'
import { loadData, buildSeedRecipes } from './data.js'
import { usePersistedState } from './store.js'
import { RecipeCard } from './components.jsx'
import RecipeForm from './RecipeForm.jsx'
import RecipeDetail from './RecipeDetail.jsx'
import MealPlanner, { currentWeekKey, dateKeyForWeekDay, weekKeyToDate } from './MealPlanner.jsx'
import ShoppingList from './ShoppingList.jsx'

const VIEWS = {
  BROWSE: 'browse',
  DETAIL: 'detail',
  FORM: 'form',
  PLANNER: 'planner',
  SHOPPING: 'shopping',
}

let localId = 0
const newLocalId = () => `USER-${Date.now().toString(36)}-${(localId++).toString(36)}`

export default function App() {
  const [lookup, setLookup] = useState(null)
  const [seedRecipes, setSeedRecipes] = useState([])
  const [userRecipes, setUserRecipes] = usePersistedState('meal-planner:user-recipes', [])
  const [plan, setPlan] = usePersistedState('meal-planner:plan', {})
  const [planWeek, setPlanWeek] = usePersistedState('meal-planner:week', currentWeekKey())
  const [pantry, setPantry] = usePersistedState('meal-planner:pantry', [])
  const [checked, setChecked] = usePersistedState('meal-planner:checked', [])

  const [view, setView] = useState(VIEWS.BROWSE)
  const [selectedRecipeId, setSelectedRecipeId] = useState(null)
  const [editingRecipe, setEditingRecipe] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCuisine, setFilterCuisine] = useState('')
  const [filterMealType, setFilterMealType] = useState('')

  useEffect(() => {
    loadData().then((raw) => {
      setLookup(raw)
      setSeedRecipes(buildSeedRecipes(raw))
    })
  }, [])

  const recipes = useMemo(() => [...userRecipes, ...seedRecipes], [userRecipes, seedRecipes])

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId) || null

  const filtered = useMemo(() => {
    return recipes.filter((r) => {
      if (search) {
        const q = search.toLowerCase()
        const hay = [r.title, r.shortDescription, r.cuisine, r.mealType, ...(r.dietaryTags || []), ...(r.categories || [])].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (filterCuisine && r.cuisine !== filterCuisine) return false
      if (filterMealType && r.mealType !== filterMealType) return false
      return true
    })
  }, [recipes, search, filterCuisine, filterMealType])

  function openRecipe(id) {
    setSelectedRecipeId(id)
    setView(VIEWS.DETAIL)
  }
  function goBrowse() {
    setView(VIEWS.BROWSE)
  }
  function openNewForm() {
    setEditingRecipe(null)
    setView(VIEWS.FORM)
  }
  function openEdit(recipe) {
    setEditingRecipe(recipe)
    setView(VIEWS.FORM)
  }

  function handleSave(payload) {
    const saved = {
      id: editingRecipe ? editingRecipe.id : newLocalId(),
      seed: false,
      title: payload.title,
      shortDescription: payload.shortDescription || '',
      sourceName: payload.sourceName || '',
      sourceUrl: payload.sourceUrl,
      servings: Number(payload.servings) || 1,
      prepTimeMinutes: Number(payload.prepTimeMinutes) || 0,
      cookTimeMinutes: Number(payload.cookTimeMinutes) || 0,
      totalTimeMinutes: Number(payload.totalTimeMinutes) || 0,
      cuisine: payload.cuisine,
      mealType: payload.mealType,
      dietaryTags: payload.dietaryTags || [],
      categories: payload.categories || [],
      spiceLevel: Number(payload.spiceLevel) || 0,
      accentColor: payload.accentColor || '#888888',
      coverImageUrl: payload.coverImageUrl || '',
      includeInMealSuggestions: payload.includeInMealSuggestions !== false,
      sections: (payload.sections || []).filter((s) => s.name || s.ingredients.some((i) => i.name || i.quantity)),
      steps: (payload.steps || []).filter((s) => s.instruction),
      includeInShoppingList: payload.includeInShoppingList !== false,
      showNutrition: !!payload.showNutrition,
      allowSubstitutions: !!payload.allowSubstitutions,
      measurementSystem: payload.measurementSystem || 'us',
    }

    setUserRecipes((prev) => {
      const exists = prev.some((r) => r.id === saved.id)
      if (exists) return prev.map((r) => (r.id === saved.id ? saved : r))
      return [...prev, saved]
    })

    if (payload.addToMealPlan) {
      const week = payload.mealPlanWeek || planWeek
      const mealType = payload.plannedMealType
      const dateStr = payload.plannedDate || (payload.plannedDateTime ? payload.plannedDateTime.slice(0, 10) : '')
      let dayIndex = null
      if (dateStr) {
        const [y, m, d] = dateStr.split('-').map(Number)
        const date = new Date(y, m - 1, d)
        const start = weekKeyToDate(week)
        if (start) {
          const diff = Math.round((date - start) / 86400000)
          dayIndex = diff >= 0 && diff <= 6 ? diff : null
        }
      }
      if (mealType && dayIndex != null) {
        const slot = `${week}|${dayIndex}|${mealType}`
        setPlan((p) => ({ ...p, [slot]: saved.id }))
      }
    }

    setSelectedRecipeId(saved.id)
    setEditingRecipe(null)
    setView(VIEWS.DETAIL)
  }

  if (!lookup) {
    return <div className="loading">Loading recipes…</div>
  }

  return (
    <div className="app">
      <nav className="topnav">
        <button className="brand" onClick={goBrowse}>🍽 Meal Planner</button>
        <div className="nav-links">
          <button className={'nav-btn' + (view === VIEWS.BROWSE ? ' active' : '')} onClick={goBrowse}>Recipes</button>
          <button className={'nav-btn' + (view === VIEWS.PLANNER ? ' active' : '')} onClick={() => setView(VIEWS.PLANNER)}>Meal Plan</button>
          <button className={'nav-btn' + (view === VIEWS.SHOPPING ? ' active' : '')} onClick={() => setView(VIEWS.SHOPPING)}>Shopping List</button>
          <button className="btn primary nav-add" onClick={openNewForm}>+ New Recipe</button>
        </div>
      </nav>

      <main className="main">
        {view === VIEWS.BROWSE && (
          <div className="browse">
            <header className="browse-header">
              <h1>Recipe catalog</h1>
              <div className="filters">
                <input className="search" type="search" placeholder="Search recipes…" value={search}
                  onChange={(e) => setSearch(e.target.value)} />
                <select value={filterCuisine} onChange={(e) => setFilterCuisine(e.target.value)}>
                  <option value="">All cuisines</option>
                  {lookup.cuisines.map((c) => <option key={c.cuisine_id} value={c.cuisine_name}>{c.cuisine_name}</option>)}
                </select>
                <select value={filterMealType} onChange={(e) => setFilterMealType(e.target.value)}>
                  <option value="">All meal types</option>
                  {lookup.mealTypes.map((m) => <option key={m.meal_type_id} value={m.meal_type_name}>{m.meal_type_name}</option>)}
                </select>
              </div>
            </header>
            {filtered.length === 0 ? (
              <div className="empty-state"><p>No recipes found.</p></div>
            ) : (
              <div className="catalog-grid">
                {filtered.map((r) => <RecipeCard key={r.id} recipe={r} onOpen={openRecipe} />)}
              </div>
            )}
          </div>
        )}

        {view === VIEWS.DETAIL && selectedRecipe && (
          <RecipeDetail recipe={selectedRecipe} onBack={goBrowse} onEdit={openEdit} />
        )}

        {view === VIEWS.FORM && (
          <div className="form-page">
            <RecipeForm
              lookup={lookup}
              recipe={editingRecipe}
              onSave={handleSave}
              onCancel={() => (editingRecipe ? openRecipe(editingRecipe.id) : goBrowse())}
              defaults={{ weekKey: planWeek, plannedDate: dateKeyForWeekDay(planWeek, 0) }}
            />
          </div>
        )}

        {view === VIEWS.PLANNER && (
          <MealPlanner
            plan={plan}
            setPlan={setPlan}
            recipes={recipes}
            weekKey={planWeek}
            setWeekKey={setPlanWeek}
            onOpenRecipe={openRecipe}
          />
        )}

        {view === VIEWS.SHOPPING && (
          <ShoppingList
            plan={plan}
            recipes={recipes}
            weekKey={planWeek}
            pantry={pantry}
            setPantry={setPantry}
            checked={checked}
            setChecked={setChecked}
          />
        )}
      </main>
    </div>
  )
}