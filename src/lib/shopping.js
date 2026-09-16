import { SHOPPING_CATEGORIES, ingredientCategory } from './data.js'

function roundQty(value) {
  if (!isFinite(value)) return ''
  if (Number.isInteger(value)) return String(value)
  return String(Math.round(value * 100) / 100)
}

export function buildShoppingList(recipes, mealPlan) {
  const recipeById = new Map(recipes.map((r) => [r.id, r]))

  // Aggregate by ingredient name.
  const agg = new Map()

  Object.values(mealPlan).forEach((week) => {
    Object.values(week).forEach((day) => {
      Object.values(day).forEach((assignment) => {
        if (!assignment || !assignment.recipeId) return
        const recipe = recipeById.get(assignment.recipeId)
        if (!recipe) return
        if (recipe.options && recipe.options.includeInShoppingList === false) return

        recipe.ingredients.forEach((ing) => {
          const name = (ing.name || '').trim()
          if (!name) return
          const key = name.toLowerCase()
          const unit = (ing.unit || '').trim()
          const optional = !!ing.optional

          if (!agg.has(key)) {
            agg.set(key, {
              name,
              displayName: name,
              category: ingredientCategory(name),
              recipeTitles: new Set(),
              units: new Map(),
              optionalOnly: true,
            })
          }
          const item = agg.get(key)
          item.recipeTitles.add(recipe.title)
          if (!optional) item.optionalOnly = false

          const qtyNum = parseFloat(ing.quantity)
          const isNumeric =
            ing.quantity != null && ing.quantity !== '' && isFinite(qtyNum)

          if (!item.units.has(unit)) {
            item.units.set(unit, { sum: 0, optional })
          }
          const line = item.units.get(unit)
          if (isNumeric) line.sum += qtyNum
          if (!optional) line.optional = false
        })
      })
    })
  })

  const grouped = new Map()
  SHOPPING_CATEGORIES.forEach((cat) => grouped.set(cat, []))
  grouped.set('Other', [])

  agg.forEach((item) => {
    const lines = Array.from(item.units.entries()).map(([unit, line]) => ({
      quantity: line.sum > 0 ? roundQty(line.sum) : '',
      unit,
      optional: line.optional,
      numeric: line.sum > 0,
    }))

    const category = SHOPPING_CATEGORIES.includes(item.category)
      ? item.category
      : 'Other'

    const entry = {
      key: item.name.toLowerCase(),
      name: item.name,
      lines,
      recipeTitles: Array.from(item.recipeTitles).sort(),
      optionalOnly: item.optionalOnly,
      category,
    }

    grouped.get(category).push(entry)
  })

  const categories = Array.from(grouped.entries())
    .filter(([, items]) => items.length > 0)
    .map(([name, items]) => ({
      name,
      items: items.sort((a, b) => a.name.localeCompare(b.name)),
    }))

  return { categories }
}

export function formatLine(line) {
  const parts = []
  if (line.quantity) parts.push(line.quantity)
  if (line.unit) parts.push(line.unit)
  if (line.optional) parts.push('(optional)')
  return parts.join(' ').trim() || 'as needed'
}