import { useMemo } from 'react'
import { buildShoppingList, formatQuantity } from '../lib/shopping'
import { SHOPPING_CATEGORIES } from '../lib/domain'

export default function ShoppingList({ state, onOpen }) {
  const hidePantry = !!state.shoppingChecked.__hidePantry

  const { groups, items } = useMemo(
    () => buildShoppingList(state.recipes, state.plan, state.pantry, hidePantry),
    [state.recipes, state.plan, state.pantry, hidePantry]
  )

  const hasAny = items.length > 0
  const allCategories = [...SHOPPING_CATEGORIES].filter((c) => groups[c]?.length)

  const toggleHidePantry = () => state.toggleShoppingChecked('__hidePantry')

  const anyPantryItems = items.some((i) => i.inPantry)

  return (
    <div className="shopping">
      <div className="shopping-head">
        <h2>Shopping List</h2>
        <div className="shopping-head-actions">
          <label className="checkbox-line">
            <input type="checkbox" checked={hidePantry} onChange={toggleHidePantry} />
            Exclude ingredients I already have in my pantry
          </label>
          <button
            className="btn btn-ghost"
            onClick={state.resetShoppingChecked}
            disabled={Object.keys(state.shoppingChecked).length === 0}
          >
            Clear checks
          </button>
        </div>
      </div>

      {!hasAny ? (
        <div className="empty-state">
          <p>Your shopping list is empty.</p>
          <p className="muted">Add recipes to the meal planner to generate a list.</p>
        </div>
      ) : (
        allCategories.map((cat) => {
          const catItems = groups[cat]
          const allHidden = catItems.every((item) => item.__hidden)
          if (allHidden) return null
          return (
            <section key={cat} className="shopping-category">
              <h3>{cat}</h3>
              <ul>
                {catItems.map((item) => {
                  const checked = item.__hidden || !!state.shoppingChecked[item.key]
                  return (
                    <li
                      key={item.key}
                      className={`shopping-item ${checked ? 'checked' : ''}`}
                    >
                      <div className="shopping-row">
                        <label className="shopping-check">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={item.__hidden}
                            onChange={() => state.toggleShoppingChecked(item.key)}
                          />
                          <span className="shopping-name">{item.name}</span>
                        </label>
                        <span className="shopping-meta">
                          {item.quantity !== null && (
                            <span className="shopping-qty">
                              {formatQuantity(item.quantity)} {item.unit}
                            </span>
                          )}
                          {item.notes.length > 0 && (
                            <span className="shopping-notes">({item.notes.join(', ')})</span>
                          )}
                        </span>
                        <button
                          className={`mini-btn pantry-btn ${item.inPantry ? 'active' : ''}`}
                          title={
                            item.inPantry
                              ? 'In pantry (click to remove)'
                              : 'Mark as already in pantry'
                          }
                          onClick={() => state.togglePantry(item.pantryKey)}
                        >
                          {item.inPantry ? '🏠 ✓' : '🏠'}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })
      )}
    </div>
  )
}