import { useMemo, useState } from 'react'
import { formatLine } from '../lib/shopping.js'

export default function ShoppingList({ list, shoppingState, onToggleChecked, onTogglePantry }) {
  const [hidePantry, setHidePantry] = useState(true)

  const state = shoppingState || { checked: {}, pantry: {} }

  const { buyCategories, pantryItems, buyCount, totalCount } = useMemo(() => {
    const buyCategories = []
    const pantryItems = []
    let buy = 0
    let total = 0

    list.categories.forEach((cat) => {
      const buyItems = []
      cat.items.forEach((item) => {
        total += 1
        if (state.pantry[item.key]) pantryItems.push(item)
        else {
          buy += 1
          buyItems.push(item)
        }
      })
      if (buyItems.length) buyCategories.push({ name: cat.name, items: buyItems })
    })

    return { buyCategories, pantryItems, buyCount: buy, totalCount: total }
  }, [list, state])

  if (totalCount === 0) {
    return (
      <section className="view">
        <div className="view-header">
          <div>
            <h1>Shopping list</h1>
            <p className="muted">Generated from recipes in your meal plan.</p>
          </div>
        </div>
        <div className="empty-state">
          <p>Nothing to buy yet. Add recipes to your weekly meal plan and they will show up here.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="view">
      <div className="view-header">
        <div>
          <h1>Shopping list</h1>
          <p className="muted">
            {buyCount} item{buyCount === 1 ? '' : 's'} to buy{buyCount < totalCount ? ` · ${pantryItems.length} already in pantry` : ''}
          </p>
        </div>
        {pantryItems.length > 0 && (
          <label className="checkbox-inline">
            <input
              type="checkbox"
              checked={hidePantry}
              onChange={(e) => setHidePantry(e.target.checked)}
            />
            Exclude pantry items
          </label>
        )}
      </div>

      {buyCategories.map((cat) => (
        <div key={cat.name} className="shopping-category">
          <h2>{cat.name}</h2>
          <ul className="shopping-list">
            {cat.items.map((item) => (
              <ShoppingItem
                key={item.key}
                item={item}
                checked={!!state.checked[item.key]}
                inPantry={!!state.pantry[item.key]}
                onToggleChecked={() => onToggleChecked(item.key)}
                onTogglePantry={() => onTogglePantry(item.key)}
              />
            ))}
          </ul>
        </div>
      ))}

      {pantryItems.length > 0 && !hidePantry && (
        <div className="shopping-category pantry">
          <h2>Already in pantry</h2>
          <ul className="shopping-list">
            {pantryItems.map((item) => (
              <ShoppingItem
                key={item.key}
                item={item}
                checked={!!state.checked[item.key]}
                inPantry
                onToggleChecked={() => onToggleChecked(item.key)}
                onTogglePantry={() => onTogglePantry(item.key)}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function ShoppingItem({ item, checked, inPantry, onToggleChecked, onTogglePantry }) {
  return (
    <li className={`shopping-item ${checked ? 'checked' : ''} ${inPantry ? 'pantry' : ''}`}>
      <label className="shopping-check">
        <input type="checkbox" checked={checked} onChange={onToggleChecked} />
        <span className="checkmark" />
      </label>
      <div className="shopping-info">
        <span className="shopping-name">
          {item.name}
          {item.optionalOnly && <span className="tag">optional</span>}
        </span>
        <span className="shopping-qty">{item.lines.map(formatLine).join(' · ')}</span>
        <span className="shopping-source muted small">
          {item.recipeTitles.length > 2
            ? `${item.recipeTitles.slice(0, 2).join(', ')} +${item.recipeTitles.length - 2}`
            : item.recipeTitles.join(', ')}
        </span>
      </div>
      <button
        className={`btn btn-small ${inPantry ? 'btn-pantry-on' : 'btn-ghost'}`}
        onClick={onTogglePantry}
        title={inPantry ? 'Remove from pantry' : 'Mark as already in pantry'}
      >
        {inPantry ? 'Have ✓' : 'I have this'}
      </button>
    </li>
  )
}