import { ingredientById } from './store.js'

export const SHOPPING_CATEGORIES = [
  'Produce',
  'Meat & seafood',
  'Dairy & eggs',
  'Grains & pantry',
  'Oils & condiments',
  'Canned & jarred',
  'Spices',
  'Other',
]

// Build a consolidated shopping list from the recipes currently scheduled in
// the meal plan and their ingredient data.
export function buildShoppingList(state) {
  // Gather scheduled recipes with their substitutes consideration.
  const schedules = Object.entries(state.mealPlan)
  const grouped = new Map() // key -> { name, unit, category, items }

  for (const [, recipeId] of schedules) {
    const recipe = state.recipes.find((r) => r.id === recipeId)
    if (!recipe) continue
    if (recipe.includeInShoppingList === false) continue

    for (const ing of recipe.ingredients) {
      if (ing.optional) continue
      const info = ingredientById(ing.ingredientId)
      const name = info ? info.ingredient_name : ing.ingredientName
      const category = info ? info.shopping_category : 'Other'
      if (!name) continue

      const key = `${name}|${ing.unit}`
      if (!grouped.has(key)) {
        grouped.set(key, {
          name,
          unit: ing.unit,
          category,
          quantity: 0,
          numeric: true,
          notes: [],
        })
      }
      const entry = grouped.get(key)
      const num = parseFloat(ing.quantity)
      if (Number.isFinite(num)) {
        entry.quantity += num
      } else {
        entry.numeric = false
      }
      if (ing.notes) entry.notes.push(ing.notes)
    }
  }

  // Skip items the user marked as already in pantry.
  const pantryNames = new Set(
    state.pantry.map((p) => (typeof p === 'string' ? p.toLowerCase() : p.name?.toLowerCase())).filter(Boolean)
  )

  const items = []
  for (const entry of grouped.values()) {
    if (pantryNames.has(entry.name.toLowerCase())) continue
    items.push(entry)
  }

  // Organize into categories.
  const categories = SHOPPING_CATEGORIES.map((cat) => ({
    name: cat,
    items: items
      .filter((i) => i.category === cat)
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((c) => c.items.length > 0)

  const totalCount = items.length
  const checkedCount = items.filter((i) => state.shoppingChecks[itemKey(i)]).length

  return { categories, totalCount, checkedCount }
}

export function itemKey(item) {
  return `${item.name}|${item.unit}`
}

export function formatQuantity(item) {
  const q = item.quantity
  if (!item.numeric) return q ? `${q} ${item.unit}`.trim() : 'to taste'
  const rounded = Math.round(q * 100) / 100
  const qStr = Number.isInteger(rounded) ? String(rounded) : String(rounded)
  return `${qStr} ${item.unit}`.trim()
}