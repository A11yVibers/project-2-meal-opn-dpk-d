import { useMemo } from 'react'

const CATEGORY_ORDER = [
  'Produce',
  'Meat & seafood',
  'Dairy & eggs',
  'Grains & pantry',
  'Oils & condiments',
  'Canned & jarred',
  'Spices',
]

function parseQty(q) {
  if (q === '' || q == null) return null
  const n = parseFloat(String(q).replace(/[^\d.]/g, ''))
  return isNaN(n) ? null : n
}

export default function ShoppingList({ plan, recipes, weekKey, pantry, setPantry, checked, setChecked }) {
  const items = useMemo(() => {
    const agg = new Map()
    const prefix = weekKey + '|'
    const plannedEntries = Object.entries(plan || {}).filter(([slot]) => slot.startsWith(prefix))
    for (const [slot, recipeId] of plannedEntries) {
      const recipe = recipes.find((r) => r.id === recipeId)
      if (!recipe || recipe.includeInShoppingList === false) continue

      const [, dayIdx] = slot.split('|')
      const sourceLabel = recipe.title

      for (const section of recipe.sections || []) {
        for (const ing of section.ingredients || []) {
          const unit = ing.unit || ''
          const name = ing.name || ing.ingredientId || 'Unknown'
          const key = `${name.toLowerCase().trim()}|${unit.toLowerCase().trim()}`
          if (!agg.has(key)) {
            agg.set(key, {
              name,
              nameKey: name.toLowerCase().trim(),
              unit,
              shoppingCategory: ing.shoppingCategory || 'Other',
              quantity: parseQty(ing.quantity),
              optional: !!ing.optional,
              sources: new Set(),
            })
          }
          const entry = agg.get(key)
          const q = parseQty(ing.quantity)
          if (q != null && entry.quantity != null) entry.quantity += q
          entry.sources.add(sourceLabel)
          if (entry.optional && !ing.optional) entry.optional = false
        }
      }
    }

    const list = [...agg.values()].map((e) => ({ ...e, sources: [...e.sources] }))
    list.sort((a, b) => {
      const ci = CATEGORY_ORDER.indexOf(a.shoppingCategory) - CATEGORY_ORDER.indexOf(b.shoppingCategory)
      if (ci !== 0) return ci
      return a.nameKey.localeCompare(b.nameKey)
    })
    return list
  }, [plan, recipes, weekKey])

  const pantryItems = pantry || []
  const activeItems = items.filter((it) => !pantryItems.includes(it.name))

  const grouped = new Map()
  for (const it of items) {
    const cat = CATEGORY_ORDER.includes(it.shoppingCategory) ? it.shoppingCategory : 'Other'
    if (!grouped.has(cat)) grouped.set(cat, [])
    grouped.get(cat).push(it)
  }

  function togglePantry(name) {
    setPantry((p) => (p.includes(name) ? p.filter((n) => n !== name) : [...p, name]))
  }
  function toggleChecked(name, unit) {
    const key = name + '|' + unit
    setChecked((c) => (c.includes(key) ? c.filter((k) => k !== key) : [...c, key]))
  }

  return (
    <div className="shopping-list">
      <header className="shopping-header">
        <h2>Shopping list</h2>
        <p className="shopping-sub">Based on recipes planned for the current week.</p>
      </header>

      {items.length === 0 && (
        <div className="empty-state">
          <p>Your shopping list is empty.</p>
          <p>Add recipes to your weekly meal plan to generate ingredients here.</p>
        </div>
      )}

      {CATEGORY_ORDER.map((cat) => {
        const rows = grouped.get(cat)
        if (!rows || rows.length === 0) return null
        return (
          <section className="shop-category" key={cat}>
            <h3>{cat}</h3>
            <ul>
              {rows.map((it) => {
                const inPantry = pantryItems.includes(it.name)
                const isChecked = (checked || []).includes(it.name + '|' + it.unit)
                const done = inPantry || isChecked
                return (
                  <li key={it.name + it.unit} className={done ? 'shop-item done' : 'shop-item'}>
                    <label className="shop-check">
                      <input type="checkbox" checked={isChecked} disabled={inPantry}
                        onChange={() => toggleChecked(it.name, it.unit)} />
                    </label>
                    <span className="shop-qty">
                      {it.quantity != null && !isNaN(it.quantity) ? `${trimNum(it.quantity)}` : ''}
                      {it.unit && <span className="shop-unit"> {it.unit}</span>}
                    </span>
                    <span className="shop-name">{it.name}</span>
                    {it.optional && <span className="shop-optional">optional</span>}
                    <button className="mini-btn pantry-btn" title="I already have this"
                      onClick={() => togglePantry(it.name)}>
                      {inPantry ? 'In pantry' : 'Have it'}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}

      {items.length > 0 && (
        <div className="shop-summary">
          <span>{activeItems.filter((i) => !(checked || []).includes(i.name + '|' + i.unit)).length} items remaining</span>
        </div>
      )}
    </div>
  )
}

function trimNum(n) {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100)
}