import { categoryForIngredient } from './data/seed'

// Build a shopping list from the recipes placed in the given meal plan week (or all weeks).
export function buildShoppingList(recipeById, mealPlan, weekKey = null) {
  const aggregates = new Map() // key: ingredient name (case-folded) -> item
  const keyFor = (name) => name.toLowerCase()

  const weekKeys = weekKey ? [weekKey] : Object.keys(mealPlan)

  for (const wk of weekKeys) {
    const week = mealPlan[wk] || {}
    for (const slotKey of Object.keys(week)) {
      const recipeId = week[slotKey]
      if (!recipeId) continue
      const recipe = recipeById.get(recipeId)
      if (!recipe) continue
      if (recipe.options && recipe.options.includeInShoppingList === false) continue
      for (const section of recipe.sections || []) {
        for (const item of section.items || []) {
          if (item.optional) continue
          const name = item.name
          if (!name) continue
          const key = keyFor(name)
          const category = categoryForIngredient(name, item.ingredientId)
          if (!aggregates.has(key)) {
            aggregates.set(key, {
              name,
              category,
              quantity: null,
              unit: item.unit || '',
              pieces: [],
            })
          }
          const agg = aggregates.get(key)
          agg.pieces.push({ quantity: item.quantity, unit: item.unit })
        }
      }
    }
  }

  const items = [...aggregates.values()].map((agg) => {
    // Attempt to combine quantities if all share the same unit and are numeric.
    const numeric = agg.pieces.map((p) => {
      const n = Number(p.quantity)
      return Number.isFinite(n) ? n : null
    })
    const sameUnit = agg.pieces.every((p) => p.unit === agg.unit) && agg.unit
    let combined = null
    if (sameUnit && numeric.every((n) => n !== null)) {
      const total = numeric.reduce((a, b) => a + b, 0)
      const rounded = Math.round(total * 100) / 100
      combined = `${rounded}${rounded % 1 === 0 && total >= 1 ? '' : ''}`
    } else if (sameUnit && agg.pieces.length > 1) {
      combined = `${agg.pieces.length} ×`
    }

    return {
      key: keyFor(agg.name),
      name: agg.name,
      category: agg.category,
      quantity: combined != null ? `${combined}` : agg.pieces[0].quantity || '',
      unit: sameUnit ? agg.unit : '',
      count: agg.pieces.length,
    }
  })

  // Sort by category order then name.
  const catOrder = [
    'Produce',
    'Meat & seafood',
    'Dairy & eggs',
    'Grains & pantry',
    'Oils & condiments',
    'Canned & jarred',
    'Spices',
    'Other',
  ]
  items.sort((a, b) => {
    const ca = catOrder.indexOf(a.category)
    const cb = catOrder.indexOf(b.category)
    if (ca !== cb) return ca - cb
    return a.name.localeCompare(b.name)
  })

  const grouped = []
  for (const item of items) {
    let group = grouped.find((g) => g.category === item.category)
    if (!group) {
      group = { category: item.category, items: [] }
      grouped.push(group)
    }
    group.items.push(item)
  }
  return grouped
}