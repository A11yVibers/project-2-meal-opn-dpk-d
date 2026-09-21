import { useState, useCallback } from 'react'
import { useAppState } from './lib/useAppState'
import { genId, emptyRecipe } from './lib/domain'
import RecipeCatalog from './components/RecipeCatalog'
import RecipeDetail from './components/RecipeDetail'
import RecipeForm from './components/RecipeForm'
import MealPlanner from './components/MealPlanner'
import ShoppingList from './components/ShoppingList'

const VIEWS = {
  catalog: 'catalog',
  detail: 'detail',
  form: 'form',
  planner: 'planner',
  shopping: 'shopping',
}

export default function App() {
  const state = useAppState()
  const [view, setView] = useState(VIEWS.catalog)
  const [currentRecipeId, setCurrentRecipeId] = useState(null)
  const [editingRecipe, setEditingRecipe] = useState(null)

  const openDetail = useCallback((id) => {
    setCurrentRecipeId(id)
    setView(VIEWS.detail)
  }, [])

  const openNewRecipe = useCallback(() => {
    setEditingRecipe(emptyRecipe())
    setView(VIEWS.form)
  }, [])

  const openEditRecipe = useCallback((recipe) => {
    setEditingRecipe(recipe)
    setView(VIEWS.form)
  }, [])

  const handleFormSaved = useCallback(
    (recipe) => {
      const exists = state.recipes.some((r) => r.id === recipe.id)
      if (exists) {
        state.updateRecipe(recipe.id, recipe)
      } else {
        state.addRecipe({ ...recipe, id: recipe.id || genId('R') })
      }
      setEditingRecipe(null)
      setView(VIEWS.catalog)
      setCurrentRecipeId(recipe.id)
    },
    [state]
  )

  const nav = (v) => () => setView(v)

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand" onClick={nav(VIEWS.catalog)}>
          <span className="brand-mark">🍽️</span>
          <span className="brand-name">Meal Planner</span>
        </div>
        <nav className="main-nav">
          <button
            className={`nav-btn ${view === VIEWS.catalog ? 'active' : ''}`}
            onClick={nav(VIEWS.catalog)}
          >
            Recipes
          </button>
          <button
            className={`nav-btn ${view === VIEWS.planner ? 'active' : ''}`}
            onClick={nav(VIEWS.planner)}
          >
            Planner
          </button>
          <button
            className={`nav-btn ${view === VIEWS.shopping ? 'active' : ''}`}
            onClick={nav(VIEWS.shopping)}
          >
            Shopping
          </button>
        </nav>
        <button className="btn btn-primary header-add" onClick={openNewRecipe}>
          + New Recipe
        </button>
      </header>

      <main className="app-main">
        {view === VIEWS.catalog && (
          <RecipeCatalog
            state={state}
            onOpen={openDetail}
            onNew={openNewRecipe}
          />
        )}
        {view === VIEWS.detail && (
          <RecipeDetail
            state={state}
            recipeId={currentRecipeId}
            onBack={nav(VIEWS.catalog)}
            onEdit={openEditRecipe}
            onDelete={(id) => {
              state.deleteRecipe(id)
              setView(VIEWS.catalog)
            }}
          />
        )}
        {view === VIEWS.form && (
          <RecipeForm
            state={state}
            initialRecipe={editingRecipe}
            onCancel={() => {
              setEditingRecipe(null)
              setView(VIEWS.catalog)
            }}
            onSave={handleFormSaved}
          />
        )}
        {view === VIEWS.planner && (
          <MealPlanner state={state} onOpen={openDetail} />
        )}
        {view === VIEWS.shopping && (
          <ShoppingList state={state} onOpen={openDetail} />
        )}
      </main>
    </div>
  )
}