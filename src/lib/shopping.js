import { SHOPPING_CATEGORIES } from './domain'

function normalizeUnit(unit) {
  return (unit || '').trim().toLowerCase()
}

export function buildShoppingList(recipes, plan, pantry = {}, hidePantry = false) {
  const planned = {}
  Object.values(plan || {}).forEach((entry) => {
    if (entry && entry.recipeId) planned[entry.recipeId] = true
  })

  const items = []
  const byKey = {}

  recipes.forEach((recipe) => {
    if (!planned[recipe.id]) return
    if (recipe.options && recipe.options.includeInShoppingList === false) return

    ;(recipe.sections || []).forEach((section) => {
      ;(section.ingredients || []).forEach((ing) => {
        if (!ing.name) return
        if (ing.optional) return

        const category = ing.category || 'Produce'
        const name = ing.name
        const unit = ing.unit || ''
        const quantityNum = parseFloat(ing.quantity)
        const hasQuantity = Number.isFinite(quantityNum)

        const baseKey = `${category}||${name.toLowerCase()}`
        const pantryKey = baseKey
        const key = `${baseKey}||${normalizeUnit(unit)}`

        if (byKey[key]) {
          const existing = byKey[key]
          if (hasQuantity && Number.isFinite(existing.quantity)) {
            existing.quantity += quantityNum
          } else {
            existing.quantity = null
          }
          if (ing.notes && !existing.notes.includes(ing.notes)) {
            existing.notes.push(ing.notes)
          }
        } else {
          const entry = {
            key,
            pantryKey,
            name,
            category,
            unit,
            quantity: hasQuantity ? quantityNum : null,
            notes: ing.notes ? [ing.notes] : [],
            inPantry: !!pantry[pantryKey],
          }
          byKey[key] = entry
          items.push(entry)
        }
      })
    })
  })

  items.forEach((item) => {
    item.__hidden = hidePantry && item.inPantry
  })

  const grouped = {}
  SHOPPING_CATEGORIES.forEach((c) => (grouped[c] = []))
  const uncategorized = []

  items.forEach((item) => {
    if (SHOPPING_CATEGORIES.includes(item.category)) {
      grouped[item.category].push(item)
    } else {
      uncategorized.push(item)
    }
  })

  return { groups: grouped, items }
}

export function formatQuantity(quantity) {
  if (quantity === null || quantity === undefined) return ''
  const rounded = Math.round(quantity * 100) / 100
  return String(rounded)
}