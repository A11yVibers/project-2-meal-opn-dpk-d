import { useMemo, useState } from 'react'
import { loadData } from './lib/csv.js'
import { usePersistentState } from './lib/usePersistentState.js'
import { STORAGE_KEYS } from './lib/utils.js'
import RecipeCatalog from './components/RecipeCatalog.jsx'
import RecipeDetail from './components/RecipeDetail.jsx'
import RecipeForm from './components/RecipeForm.jsx'
import MealPlanner from './components/MealPlanner.jsx'
import ShoppingList from './components/ShoppingList.jsx'

function mealTypeToSlot(lookup, mealTypeId) {
  const m = lookup.mealTypes.find((m) => m.id === mealTypeId)
  if (!m) return null
  if (['Breakfast', 'Lunch', 'Dinner', 'Snack'].includes(m.name)) return m.name
  if (m.name === 'Dessert') return 'Snack'
  if (m.name === 'Side dish') return 'Dinner'
  return null
}

export default function App() {
  const [lookup] = useState(() => loadData())

  const [userRecipes, setUserRecipes] = usePersistentState(STORAGE_KEYS.userRecipes, [])
  const [mealPlan, setMealPlan] = usePersistentState(STORAGE_KEYS.mealPlan, {})
  const [pantry, setPantry] = usePersistentState(STORAGE_KEYS.pantry, [])

  const [view, setView] = useState({ name: 'catalog' })

  const allRecipes = useMemo(() => {
    if (!lookup) return []
    return [...lookup.recipes, ...userRecipes]
  }, [lookup, userRecipes])

  const byId = useMemo(() => {
    const map = {}
    allRecipes.forEach((r) => (map[r.id] = r))
    return map
  }, [allRecipes])

  function addRecipe(recipe) {
    setUserRecipes((prev) => [...prev, recipe])
    return recipe
  }

  function updateUserRecipe(recipe) {
    setUserRecipes((prev) => prev.map((r) => (r.id === recipe.id ? recipe : r)))
  }

  function deleteUserRecipe(id) {
    setUserRecipes((prev) => prev.filter((r) => r.id !== id))
    setMealPlan((prev) => {
      const next = {}
      Object.entries(prev).forEach(([slotKey, recipeId]) => {
        if (recipeId !== id) next[slotKey] = recipeId
      })
      return next
    })
  }

  function assignToSlot(slotKey, recipeId) {
    setMealPlan((prev) => ({ ...prev, [slotKey]: recipeId }))
  }

  function removeFromSlot(slotKey) {
    setMealPlan((prev) => {
      const next = { ...prev }
      delete next[slotKey]
      return next
    })
  }

  function navigate(name, params = {}) {
    setView({ name, ...params })
  }

  const nav = [
    { name: 'catalog', label: 'Recipes' },
    { name: 'planner', label: 'Meal Planner' },
    { name: 'shopping', label: 'Shopping List' },
  ]

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <button className="brand" onClick={() => navigate('catalog')}>
            <span className="brand-mark">🍽</span> Meal Planner
          </button>
          <nav className="topnav">
            {nav.map((n) => (
              <button
                key={n.name}
                className={`nav-link ${view.name === n.name ? 'active' : ''}`}
                onClick={() => navigate(n.name)}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="app-main">
        {view.name === 'catalog' && (
          <RecipeCatalog
            recipes={allRecipes}
            lookup={lookup}
            onOpen={(id) => navigate('detail', { id })}
            onNew={() => navigate('new')}
          />
        )}

        {view.name === 'detail' && (
          <RecipeDetail
            recipe={byId[view.id]}
            lookup={lookup}
            onBack={() => navigate('catalog')}
            onEdit={() => navigate('edit', { id: view.id })}
            onDelete={deleteUserRecipe}
            isUserRecipe={userRecipes.some((r) => r.id === view.id)}
          />
        )}

        {(view.name === 'new' || view.name === 'edit') && (
          <RecipeForm
            lookup={lookup}
            recipe={view.name === 'edit' ? byId[view.id] : null}
            onCancel={() => navigate(view.name === 'edit' ? 'detail' : 'catalog', view.name === 'edit' ? { id: view.id } : {})}
            onSave={(saved) => {
              if (view.name === 'edit') {
                updateUserRecipe(saved)
                navigate('detail', { id: saved.id })
              } else {
                addRecipe(saved)
                if (saved._addToPlan) {
                  const date = new Date(saved._planWeekMonday + 'T00:00:00')
                  date.setDate(date.getDate() + saved._planDayIndex)
                  const slot = mealTypeToSlot(lookup, saved.mealTypeId)
                  if (slot) {
                    assignToSlot(`${date.toISOString().slice(0, 10)}|${slot}`, saved.id)
                  }
                }
                navigate('detail', { id: saved.id })
              }
            }}
          />
        )}

        {view.name === 'planner' && (
          <MealPlanner
            recipes={byId}
            lookup={lookup}
            mealPlan={mealPlan}
            onAssign={assignToSlot}
            onRemove={removeFromSlot}
            onOpen={(id) => navigate('detail', { id })}
            suggestions={allRecipes.filter((r) => r.includeInMealSuggestions)}
          />
        )}

        {view.name === 'shopping' && (
          <ShoppingList
            recipes={byId}
            mealPlan={mealPlan}
            pantry={pantry}
            setPantry={setPantry}
            ingredients={lookup.ingredients}
            onOpen={(id) => navigate('detail', { id })}
          />
        )}
      </main>
    </div>
  )
}