import { useMemo, useState } from 'react'

const CATEGORY_ORDER = [
  'Produce',
  'Meat & seafood',
  'Dairy & eggs',
  'Grains & pantry',
  'Oils & condiments',
  'Canned & jarred',
  'Spices',
]

export default function ShoppingList({ recipes, mealPlan, pantry, setPantry, ingredients, onOpen }) {
  const [checked, setChecked] = useState({})
  const [showPantry, setShowPantry] = useState(false)

  const selectedIngredientIds = useMemo(() => {
    const ids = new Set()
    Object.values(mealPlan).forEach((recipeId) => {
      const recipe = recipes[recipeId]
      if (!recipe || recipe.includeInShoppingList === false) return
      recipe.sections.forEach((section) => {
        section.ingredients.forEach((ing) => {
          if (ing.ingredientId) ids.add(ing.ingredientId)
        })
      })
    })
    return ids
  }, [mealPlan, recipes])

  const baseIngredients = useMemo(() => {
    if (!ingredients) return {}
    return Object.fromEntries(ingredients.map((i) => [i.id, i]))
  }, [ingredients])

  const grouped = useMemo(() => {
    const groups = {}
    CATEGORY_ORDER.forEach((c) => (groups[c] = []))
    selectedIngredientIds.forEach((id) => {
      const info = baseIngredients[id]
      if (!info) return
      const cat = info.category || 'Spices'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push({ id, name: info.name, category: cat })
    })
    Object.keys(groups).forEach((cat) => groups[cat].sort((a, b) => a.name.localeCompare(b.name)))
    return groups
  }, [selectedIngredientIds, baseIngredients])

  const totalItems = selectedIngredientIds.size
  const pantrySet = new Set(pantry)

  const visibleGroups = Object.entries(grouped).filter(([cat, items]) => items.length > 0)

  const hasPantry = pantrySet.size > 0

  function toggleCheck(id) {
    setChecked((c) => ({ ...c, [id]: !c[id] }))
  }

  function togglePantry(id) {
    setPantry((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const rows = []
  let shown = 0
  let checkedCount = 0
  visibleGroups.forEach(([cat, items]) => {
    items.forEach((item) => {
      const inPantry = pantrySet.has(item.id)
      if (inPantry && !showPantry) return
      shown++
      if (checked[item.id]) checkedCount++
      rows.push({ cat, item, inPantry })
    })
  })

  const remaining = shown - checkedCount

  return (
    <section className="shopping">
      <div className="shopping-head">
        <div>
          <h1>Shopping List</h1>
          <p className="muted">Generated from {Object.keys(mealPlan).filter((k) => mealPlan[k]).length} planned meals</p>
        </div>
        <div className="shopping-tools">
          <label className="checkbox-line">
            <input type="checkbox" checked={showPantry} onChange={(e) => setShowPantry(e.target.checked)} />
            Show items already in my pantry
          </label>
        </div>
      </div>

      {totalItems === 0 ? (
        <div className="empty-state">
          <p>Your shopping list is empty. Add recipes to your meal plan to generate a list.</p>
        </div>
      ) : (
        <>
          <div className="progress-note">
            <span>{checkedCount} checked</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: shown ? `${(checkedCount / shown) * 100}%` : '0%' }} />
            </div>
            <span>{remaining} to buy</span>
          </div>

          {rows.length === 0 ? (
            <div className="empty-state">
              <p>Everything on your list is in your pantry. Nice!</p>
            </div>
          ) : (
            rows.map(({ cat, item, inPantry }, idx) => (
              <ItemRow
                key={item.id}
                cat={cat}
                item={item}
                inPantry={inPantry}
                checked={!!checked[item.id]}
                newCategory={idx === 0 || rows[idx - 1].cat !== cat}
                onCheck={() => toggleCheck(item.id)}
                onTogglePantry={() => togglePantry(item.id)}
              />
            ))
          )}
        </>
      )}

      {hasPantry && (
        <div className="pantry-panel">
          <h2>My pantry ({pantrySet.size})</h2>
          <p className="hint">Items marked as pantry staples are excluded from the list above unless you choose to show them.</p>
          <div className="pantry-tags">
            {pantry.map((id) => {
              const info = baseIngredients[id]
              return (
                <span key={id} className="tag pantry-tag">
                  {info ? info.name : id}
                  <button className="tag-x" onClick={() => togglePantry(id)}>
                    ✕
                  </button>
                </span>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

function ItemRow({ cat, item, inPantry, checked, newCategory, onCheck, onTogglePantry }) {
  return (
    <>
      {newCategory && (
        <h2 className="shopping-category">
          {cat} <span className="category-count">—</span>
        </h2>
      )}
      <div className={`shopping-item ${checked ? 'done' : ''} ${inPantry ? 'pantry' : ''}`}>
        <label className="shopping-check">
          <input type="checkbox" checked={checked} onChange={onCheck} />
          <span className="custom-check" />
        </label>
        <span className="shopping-name">{item.name}</span>
        {inPantry && <span className="pill pill-pantry">In pantry</span>}
        <button className={`chip-btn ${inPantry ? 'active' : ''}`} onClick={onTogglePantry}>
          {inPantry ? 'Remove from pantry' : 'Have it'}
        </button>
      </div>
    </>
  )
}