import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { createStore, loadState, saveState } from './store.js'
import RecipeCatalog from './components/RecipeCatalog.jsx'
import RecipeDetail from './components/RecipeDetail.jsx'
import RecipeForm from './components/RecipeForm.jsx'
import MealPlanner from './components/MealPlanner.jsx'
import ShoppingList from './components/ShoppingList.jsx'

const AppContext = createContext(null)

export function useApp() {
  return useContext(AppContext)
}

export default function App() {
  const [store] = useState(() => {
    const { state, seedRecipes } = createStore()
    const saved = loadState()
    if (saved) {
      state.recipes = [...seedRecipes, ...(saved.recipes || [])]
      state.mealPlan = saved.mealPlan || {}
      state.pantry = saved.pantry || []
      state.shoppingChecks = saved.shoppingChecks || {}
    }
    return state
  })

  const [view, setView] = useState('catalog')
  const [selectedRecipeId, setSelectedRecipeId] = useState(null)
  const [editingRecipe, setEditingRecipe] = useState(null)
  const [, setVersion] = useState(0)

  // Any mutation goes through commit(), which triggers a re-render and persists.
  const commit = () => {
    setVersion((v) => v + 1)
  }

  useEffect(() => {
    saveState(store)
  })

  const navigate = (nextView) => {
    setView(nextView)
    window.scrollTo(0, 0)
  }

  const api = useMemo(
    () => ({
      store,
      view,
      navigate,
      commit,
      openRecipe: (id) => {
        setSelectedRecipeId(id)
        setView('detail')
        window.scrollTo(0, 0)
      },
      closeRecipe: () => setSelectedRecipeId(null),
      startNewRecipe: () => {
        setEditingRecipe(null)
        setView('form')
        window.scrollTo(0, 0)
      },
      editRecipe: (id) => {
        setEditingRecipe(id)
        setView('form')
        window.scrollTo(0, 0)
      },
      getEditingRecipe: () =>
        editingRecipe ? store.recipes.find((r) => r.id === editingRecipe) : null,
      upsertRecipe: (recipe) => {
        const idx = store.recipes.findIndex((r) => r.id === recipe.id)
        if (idx >= 0) {
          store.recipes = [...store.recipes.slice(0, idx), recipe, ...store.recipes.slice(idx + 1)]
        } else {
          store.recipes = [...store.recipes, recipe]
        }
        setSelectedRecipeId(recipe.id)
        commit()
      },
    }),
    [store, view, editingRecipe]
  )

  return (
    <AppContext.Provider value={api}>
      <div className="app">
        <header className="app-header">
          <div className="brand" onClick={() => navigate('catalog')}>
            <span className="brand-mark">🍽</span>
            <span className="brand-name">Meal Planner</span>
          </div>
          <nav className="nav">
            <button
              className={view === 'catalog' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => navigate('catalog')}
            >
              Recipes
            </button>
            <button
              className={view === 'planner' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => navigate('planner')}
            >
              Meal Plan
            </button>
            <button
              className={view === 'shopping' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => navigate('shopping')}
            >
              Shopping List
            </button>
          </nav>
        </header>

        <main className="app-main">
          {view === 'catalog' && <RecipeCatalog />}
          {view === 'detail' && <RecipeDetail recipeId={selectedRecipeId} />}
          {view === 'form' && <RecipeForm />}
          {view === 'planner' && <MealPlanner />}
          {view === 'shopping' && <ShoppingList />}
        </main>
      </div>
    </AppContext.Provider>
  )
}