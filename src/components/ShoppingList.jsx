import { useState, useMemo } from 'react'
import { buildShoppingList } from '../shopping'
import { startOfWeek, weekKeyForDate, toDateKey, formatDateKey } from '../dateUtils'

export default function ShoppingList({ app }) {
  const [cursor, setCursor] = useState(() => startOfWeek(new Date()))
  const [scope, setScope] = useState('week') // 'week' | 'all'

  const weekKey = weekKeyForDate(cursor)
  const weekLabel = `${formatDateKey(toDateKey(cursor))} – ${formatDateKey(toDateKey(new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 6)))}`

  const grouped = useMemo(() => {
    return buildShoppingList(app.recipeById, app.mealPlan, scope === 'week' ? weekKey : null)
  }, [app.recipeById, app.mealPlan, scope, weekKey])

  const activeItems = useMemo(() => {
    return grouped.filter((g) => g.items.some((it) => !isPantry(it))).map((g) => ({
      ...g,
      items: g.items.filter((it) => !isPantry(it)),
    })).filter((g) => g.items.length > 0)
  }, [grouped, app.pantry])

  function isPantry(item) {
    return app.pantry.some((p) => p.toLowerCase() === item.name.toLowerCase())
  }

  const checkedCount = useMemo(() => {
    let n = 0
    for (const g of activeItems) for (const it of g.items) if (app.shoppingChecked[it.key]) n++
    return n
  }, [activeItems, app.shoppingChecked])

  const totalCount = useMemo(() => activeItems.reduce((a, g) => a + g.items.length, 0), [activeItems])

  const shift = (delta) => {
    const d = new Date(cursor)
    d.setDate(d.getDate() + delta * 7)
    setCursor(startOfWeek(d))
  }

  const toggle = (key) => app.setShoppingChecked(key, !app.shoppingChecked[key])

  return (
    <section className="shopping">
      <div className="shopping-head">
        <h1>Shopping List</h1>
        <div className="shopping-controls">
          {scope === 'week' ? (
            <div className="week-nav">
              <button className="btn" onClick={() => shift(-1)}>←</button>
              <span className="week-label">{weekLabel}</span>
              <button className="btn" onClick={() => shift(1)}>→</button>
            </div>
          ) : (
            <span className="muted">All planned recipes</span>
          )}
          <div className="segmented">
            <button className={scope === 'week' ? 'on' : ''} onClick={() => setScope('week')}>This week</button>
            <button className={scope === 'all' ? 'on' : ''} onClick={() => setScope('all')}>All weeks</button>
          </div>
        </div>
        <p className="muted progress">{checkedCount} of {totalCount} items checked</p>
      </div>

      {activeItems.length === 0 ? (
        <div className="empty"><p>No items — add recipes to your meal plan to generate a shopping list.</p></div>
      ) : (
        <div className="shop-groups">
          {activeItems.map((g) => (
            <div className="shop-group" key={g.category}>
              <h2 className="shop-cat">{g.category}</h2>
              <ul className="shop-items">
                {g.items.map((it) => {
                  const isChecked = Boolean(app.shoppingChecked[it.key])
                  const inPantry = isPantry(it)
                  return (
                    <li key={it.key} className={isChecked ? 'checked' : ''}>
                      <label className="shop-item">
                        <input type="checkbox" checked={isChecked} onChange={() => toggle(it.key)} />
                        <span className="shop-name">{it.name}</span>
                        <span className="shop-qty">{it.quantity}{it.unit ? ' ' + it.unit : ''}{it.count > 1 && !it.quantity ? ` (${it.count})` : ''}</span>
                      </label>
                      <button className="pantry-toggle" onClick={() => app.togglePantry(it.name)} title="Mark as already in pantry">
                        {inPantry ? 'In pantry' : 'Have it'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}