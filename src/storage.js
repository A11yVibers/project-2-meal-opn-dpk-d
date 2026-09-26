function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore quota/parse errors
  }
}

const USER_RECIPES_KEY = 'mealapp:userRecipes'
const MEAL_PLAN_KEY = 'mealapp:mealPlan'
const PANTRY_KEY = 'mealapp:pantry'
const WEEK_KEY = 'mealapp:weekStart'

export function loadUserRecipes() { return read(USER_RECIPES_KEY, []) }
export function saveUserRecipes(recipes) { write(USER_RECIPES_KEY, recipes) }

export function loadMealPlan() { return read(MEAL_PLAN_KEY, {}) }
export function saveMealPlan(plan) { write(MEAL_PLAN_KEY, plan) }

export function loadPantry() { return read(PANTRY_KEY, []) }
export function savePantry(pantry) { write(PANTRY_KEY, pantry) }

export function loadWeekStart() { return read(WEEK_KEY, null) }
export function saveWeekStart(iso) { write(WEEK_KEY, iso) }

export function newId(prefix) {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}