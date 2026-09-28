import { useMemo, useState } from 'react'
import { useApp } from '../App.jsx'
import { buildShoppingList, formatQuantity, itemKey } from '../shopping.js'
import { ingredientById } from '../store.js'

export default function ShoppingList() {
  const { store, navigate, commit } = useApp()
  const [showPantry, setShowPantry] = useState(false)
  const [pantryInput, setPantryInput] = useState('')

  const list = useMemo(() => buildShoppingList(store), [store.recipes, store.mealPlan, store.pantry, store.shoppingChecks])

  function toggleItem(key) {
    store.shoppingChecks = {
      ...store.shoppingChecks,
      [key]: !store.shoppingChecks[key],
    }
    commit()
  }

  function addToPantry() {
    const name = pantryInput.trim()
    if (!name) return
    if (!store.pantry.some((p) => (typeof p === 'string' ? p : p.name).toLowerCase() === name.toLowerCase())) {
      store.pantry = [...store.pantry, name]
    }
    setPantryInput('')
    commit()
  }

  function removeFromPantry(name) {
    store.pantry = store.pantry.filter(
      (p) => (typeof p === 'string' ? p : p.name).toLowerCase() !== name.toLowerCase()
    )
    commit()
  }

  return (
    <div className="shopping">
      <div className="shopping-head">
        <h1>Shopping List</h1>
        <div className="shopping-progress">
          {list.checkedCount}/{list.totalCount} items
        </div>
      </div>

      <div className="pantry-toolbar">
        <button className="btn" onClick={() => setShowPantry((v) => !v)}>
          🧺 Pantry ({store.pantry.length})
        </button>
      </div>

      {showPantry && (
        <div className="pantry-panel">
          <h3>Items you already have</h3>
          <p className="muted">
            Ingredients in your pantry are excluded from the shopping list.
          </p>
          <div className="pantry-add">
            <input
              value={pantryInput}
              onChange={(e) => setPantryInput(e.target.value)}
              placeholder="e.g. Olive oil"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToPantry())}
            />
            <button className="btn" onClick={addToPantry}>
              Add
            </button>
          </div>
          {store.pantry.length > 0 && (
            <div className="chips">
              {store.pantry.map((p) => {
                const name = typeof p === 'string' ? p : p.name
                return (
                  <span key={name} className="chip">
                    {name}
                    <button className="chip-x" onClick={() => removeFromPantry(name)}>
                      ✕
                    </button>
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )}

      {list.totalCount === 0 ? (
        <div className="shopping-empty">
          <p>Your shopping list is empty.</p>
          <p className="muted">Add recipes to your meal plan to see ingredients appear here.</p>
          <button className="btn btn-primary" onClick={() => navigate('planner')}>
            Go to meal plan
          </button>
        </div>
      ) : (
        list.categories.map((cat) => (
          <section key={cat.name} className="shopping-category">
            <h2>{cat.name}</h2>
            <ul className="shopping-items">
              {cat.items.map((item) => {
                const key = itemKey(item)
                const checked = !!store.shoppingChecks[key]
                return (
                  <li key={key} className={checked ? 'shopping-item checked' : 'shopping-item'}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleItem(key)}
                      aria-label={`Check off ${item.name}`}
                    />
                    <span className="shopping-name">{item.name}</span>
                    <span className="shopping-qty">{formatQuantity(item)}</span>
                    {item.notes.length > 0 && (
                      <span className="shopping-notes">({[...new Set(item.notes)].join(', ')})</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}