import { useState, useCallback } from 'react'
import { useAppState } from './state'
import { APPROVED_IMAGES } from './approved-images'
import { cuisines, mealTypes, dietaryTags, categories } from './data/seed'
import Catalog from './components/Catalog'
import RecipeView from './components/RecipeView'
import RecipeForm from './components/RecipeForm'
import Planner from './components/Planner'
import ShoppingList from './components/ShoppingList'

export default function App() {
  const app = useAppState()
  const [view, setView] = useState({ name: 'catalog' })
  const [placeholderRecipeId, setPlaceholderRecipeId] = useState(null)

  const openRecipe = useCallback((id) => setView({ name: 'recipe', id }), [])
  const openCatalog = useCallback(() => setView({ name: 'catalog' }), [])
  const openPlanner = useCallback(() => setView({ name: 'planner' }), [])
  const openShopping = useCallback(() => setView({ name: 'shopping' }), [])
  const openNewRecipe = useCallback(() => {
    setPlaceholderRecipeId(null)
    setView({ name: 'form' })
  }, [])
  const openEditRecipe = useCallback((id) => {
    setPlaceholderRecipeId(id)
    setView({ name: 'form' })
  }, [])

  const lookup = {
    cuisines,
    mealTypes,
    dietaryTags,
    categories,
  }

  const handleRecipeSaved = useCallback(() => {
    setView({ name: 'catalog' })
  }, [])

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={openCatalog}>Meal Planner</button>
        <nav className="tabs">
          <button className={view.name === 'catalog' ? 'active' : ''} onClick={openCatalog}>Recipes</button>
          <button className={view.name === 'planner' ? 'active' : ''} onClick={openPlanner}>Meal Plan</button>
          <button className={view.name === 'shopping' ? 'active' : ''} onClick={openShopping}>Shopping List</button>
        </nav>
        <button className="btn primary" onClick={openNewRecipe}>+ Add Recipe</button>
      </header>

      <main className="content">
        {view.name === 'catalog' && (
          <Catalog
            recipes={app.allRecipes}
            onOpen={openRecipe}
            onNew={openNewRecipe}
          />
        )}
        {view.name === 'recipe' && view.id && app.recipeById.has(view.id) && (
          <RecipeView
            recipe={app.recipeById.get(view.id)}
            app={app}
            onBack={openCatalog}
            onEdit={() => openEditRecipe(view.id)}
          />
        )}
        {view.name === 'form' && (
          <RecipeForm
            app={app}
            recipe={placeholderRecipeId ? app.recipeById.get(placeholderRecipeId) : null}
            onSaved={handleRecipeSaved}
            onCancel={() => setView({ name: 'catalog' })}
          />
        )}
        {view.name === 'planner' && <Planner app={app} onOpenRecipe={openRecipe} />}
        {view.name === 'shopping' && <ShoppingList app={app} />}
      </main>
    </div>
  )
}