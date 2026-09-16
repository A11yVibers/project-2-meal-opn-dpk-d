import { useMemo, useState } from 'react'
import { SEED_RECIPES, createEmptyDraft, draftFromRecipe, buildRecipeFromDraft, newRecipeId } from './lib/data.js'
import { usePersistentState } from './lib/storage.js'
import { buildShoppingList } from './lib/shopping.js'
import { weekKeyFor, parseKey, todayKey } from './lib/dates.js'
import RecipeCatalog from './components/RecipeCatalog.jsx'
import RecipeDetail from './components/RecipeDetail.jsx'
import RecipeForm from './components/RecipeForm.jsx'
import Planner from './components/Planner.jsx'
import ShoppingList from './components/ShoppingList.jsx'

export default function App() {
  const [userRecipes, setUserRecipes] = usePersistentState('userRecipes', [])
  const [mealPlan, setMealPlan] = usePersistentState('mealPlan', {})
  const [shoppingState, setShoppingState] = usePersistentState('shoppingState', {
    checked: {},
    pantry: {},
  })

  const [view, setView] = useState('recipes') // recipes | planner | shopping | detail | form
  const [detailId, setDetailId] = useState(null)
  const [formState, setFormState] = useState(null) // { mode, recipeId } | null
  const [plannerWeek, setPlannerWeek] = useState(() => weekKeyFor(new Date()))

  const recipes = useMemo(() => [...userRecipes, ...SEED_RECIPES], [userRecipes])

  const shoppingList = useMemo(() => buildShoppingList(recipes, mealPlan), [recipes, mealPlan])

  const nav = (v) => {
    setView(v)
    setDetailId(null)
    setFormState(null)
  }

  const openRecipe = (id) => {
    setDetailId(id)
    setView('detail')
  }

  const backFromDetail = () => nav('recipes')

  const openNew = () => {
    setFormState({ mode: 'new', recipeId: null })
    setView('form')
  }

  const openEdit = (id) => {
    setFormState({ mode: 'edit', recipeId: id })
    setView('form')
  }

  const assignToPlan = (recipeId, dayKey, slot, time) => {
    if (!dayKey) return
    const weekKey = weekKeyFor(parseKey(dayKey))
    setMealPlan((prev) => {
      const week = { ...(prev[weekKey] || {}) }
      const day = { ...(week[dayKey] || {}) }
      day[slot] = { recipeId, time: time || '' }
      week[dayKey] = day
      return { ...prev, [weekKey]: week }
    })
  }

  const removeFromPlan = (dayKey, slot) => {
    const weekKey = weekKeyFor(parseKey(dayKey))
    setMealPlan((prev) => {
      const week = { ...(prev[weekKey] || {}) }
      const day = { ...(week[dayKey] || {}) }
      delete day[slot]
      const next = { ...prev }
      if (Object.keys(day).length === 0) delete week[dayKey]
      else week[dayKey] = day
      if (Object.keys(week).length === 0) delete next[weekKey]
      else next[weekKey] = week
      return next
    })
  }

  const handleSave = (draft) => {
    if (formState && formState.mode === 'edit') {
      const id = formState.recipeId
      const recipe = buildRecipeFromDraft(draft, id)
      setUserRecipes((prev) => prev.map((r) => (r.id === id ? recipe : r)))
    } else {
      const recipe = buildRecipeFromDraft(draft, newRecipeId())
      setUserRecipes((prev) => [recipe, ...prev])
      if (draft.mealPlan.addToMealPlan && draft.mealPlan.cookingDate) {
        assignToPlan(recipe.id, draft.mealPlan.cookingDate, draft.mealPlan.mealSlot, draft.mealPlan.servingTime)
      }
    }
    setFormState(null)
    setView('recipes')
  }

  const handleDelete = (id) => {
    if (!window.confirm('Delete this recipe? This cannot be undone.')) return
    setUserRecipes((prev) => prev.filter((r) => r.id !== id))
    setMealPlan((prev) => {
      const next = {}
      Object.entries(prev).forEach(([wk, week]) => {
        const newWeek = {}
        Object.entries(week).forEach(([day, slots]) => {
          const newDay = {}
          Object.entries(slots).forEach(([slot, a]) => {
            if (a && a.recipeId !== id) newDay[slot] = a
          })
          if (Object.keys(newDay).length) newWeek[day] = newDay
        })
        if (Object.keys(newWeek).length) next[wk] = newWeek
      })
      return next
    })
    setView('recipes')
    setDetailId(null)
  }

  const toggleChecked = (key) =>
    setShoppingState((prev) => ({
      ...prev,
      checked: { ...prev.checked, [key]: !prev.checked[key] },
    }))

  const togglePantry = (key) =>
    setShoppingState((prev) => ({
      ...prev,
      pantry: { ...prev.pantry, [key]: !prev.pantry[key] },
    }))

  const activeRecipe = detailId ? recipes.find((r) => r.id === detailId) : null

  const editDraft = formState && formState.mode === 'edit'
    ? (() => {
        const r = recipes.find((x) => x.id === formState.recipeId)
        return r ? draftFromRecipe(r) : createEmptyDraft()
      })()
    : createEmptyDraft()

  return (
    <div className="app">
      <header className="app-header">
        <button className="brand" onClick={() => nav('recipes')}>
          <span className="brand-mark">🍽</span>
          <span>Meal Planner</span>
        </button>
        <nav className="app-nav">
          <button
            className={view === 'recipes' || view === 'detail' || view === 'form' ? 'active' : ''}
            onClick={() => nav('recipes')}
          >
            Recipes
          </button>
          <button className={view === 'planner' ? 'active' : ''} onClick={() => nav('planner')}>
            Planner
          </button>
          <button className={view === 'shopping' ? 'active' : ''} onClick={() => nav('shopping')}>
            Shopping list
          </button>
        </nav>
      </header>

      <main className="app-main">
        {view === 'recipes' && (
          <RecipeCatalog recipes={recipes} onOpen={openRecipe} onNew={openNew} />
        )}

        {view === 'planner' && (
          <Planner
            recipes={recipes}
            mealPlan={mealPlan}
            weekKey={plannerWeek}
            onWeekChange={setPlannerWeek}
            onAssign={(dayKey, slot, recipeId) => assignToPlan(recipeId, dayKey, slot)}
            onRemove={removeFromPlan}
            onOpenRecipe={openRecipe}
            onToday={() => setPlannerWeek(weekKeyFor(new Date()))}
          />
        )}

        {view === 'shopping' && (
          <ShoppingList
            list={shoppingList}
            shoppingState={shoppingState}
            onToggleChecked={toggleChecked}
            onTogglePantry={togglePantry}
          />
        )}

        {view === 'detail' && (
          <RecipeDetail
            recipe={activeRecipe}
            onBack={backFromDetail}
            onEdit={openEdit}
            onDelete={handleDelete}
            onAddToPlan={assignToPlan}
          />
        )}

        {view === 'form' && (
          <RecipeForm
            initialDraft={editDraft}
            onCancel={() => {
              setFormState(null)
              setView('recipes')
            }}
            onSubmit={handleSave}
          />
        )}
      </main>

      <footer className="app-footer muted small">
        Recipes seed data from project-assets CSVs · your recipes, plans and list are saved in your browser.
      </footer>
    </div>
  )
}