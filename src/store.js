import { LOOKUP, buildSeedRecipes } from './data/csv.js'

export { LOOKUP }

const STORAGE_KEY = 'meal-app-v1'

export function createStore() {
  const seedRecipes = buildSeedRecipes()

  const state = {
    recipes: [...seedRecipes],
    mealPlan: {}, // key: "YYYY-MM-DD|slot" -> recipeId
    pantry: [], // ingredientId or free-text names the user already has
    shoppingChecks: {}, // itemKey -> true (checked off)
  }

  return { state, seedRecipes }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveState(state) {
  try {
    const persistable = {
      recipes: state.recipes.filter((r) => !r.isSeed),
      mealPlan: state.mealPlan,
      pantry: state.pantry,
      shoppingChecks: state.shoppingChecks,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable))
  } catch {
    // Ignore storage failures (e.g. private browsing).
  }
}

export function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

// ---- Lookup helpers -------------------------------------------------------

export function cuisineName(cuisineId) {
  return LOOKUP.cuisines.find((c) => c.cuisine_id === cuisineId)?.cuisine_name || 'Other'
}

export function mealTypeName(mealTypeId) {
  return (
    LOOKUP.mealTypes.find((m) => m.meal_type_id === mealTypeId)?.meal_type_name || ''
  )
}

export function dietaryTagNames(ids = []) {
  return ids
    .map((id) => LOOKUP.dietaryTags.find((t) => t.dietary_tag_id === id)?.dietary_tag_name)
    .filter(Boolean)
}

export function categoryNames(ids = []) {
  return ids
    .map((id) => LOOKUP.categories.find((c) => c.category_id === id)?.category_name)
    .filter(Boolean)
}

export function ingredientById(ingredientId) {
  return LOOKUP.ingredients.find((i) => i.ingredient_id === ingredientId) || null
}

// ---- Week / date helpers ----

export function weekKey(date) {
  // Returns ISO-like week key, Monday as first day.
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = (d.getDay() + 6) % 7 // 0 = Monday
  d.setDate(d.getDate() - day)
  const y = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${mm}-${dd}`
}

export function addWeeks(weekKeyStr, delta) {
  const [y, m, d] = weekKeyStr.split('-').map(Number)
  const base = new Date(y, m - 1, d)
  base.setDate(base.getDate() + delta * 7)
  return weekKey(base)
}

export function daysOfWeek(weekKeyStr) {
  const [y, m, d] = weekKeyStr.split('-').map(Number)
  const base = new Date(y, m - 1, d)
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    days.push(d)
  }
  return days
}

export function formatDate(date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function dateToKey(date) {
  return date.toISOString().slice(0, 10)
}