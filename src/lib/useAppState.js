import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { seedRecipes, genId } from './domain'

const RECIPES_KEY = 'mealplanner.recipes.v1'
const PLAN_KEY = 'mealplanner.plan.v1'
const SHOPPING_KEY = 'mealplanner.shopping.v1'
const PANTRY_KEY = 'mealplanner.pantry.v1'
const WEEK_KEY = 'mealplanner.week.v1'

export function useAppState() {
  const [recipes, setRecipes, recipesReady] = useLocalStorage(RECIPES_KEY, seedRecipes)
  const [plan, setPlan] = useLocalStorage(PLAN_KEY, {})
  const [shoppingChecked, setShoppingChecked] = useLocalStorage(SHOPPING_KEY, {})
  const [pantry, setPantry] = useLocalStorage(PANTRY_KEY, {})
  const [weekStart, setWeekStart] = useLocalStorage(WEEK_KEY, startOfWeek(new Date()))

  const addRecipe = useCallback(
    (recipe) => {
      setRecipes((prev) => [recipe, ...prev])
    },
    [setRecipes]
  )

  const updateRecipe = useCallback(
    (id, patch) => {
      setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    },
    [setRecipes]
  )

  const deleteRecipe = useCallback(
    (id) => {
      setRecipes((prev) => prev.filter((r) => r.id !== id))
    },
    [setRecipes]
  )

  const getRecipe = (id) => recipes.find((r) => r.id === id) || null

  const assignSlot = useCallback(
    (slotKey, recipeId, overrides = {}) => {
      setPlan((prev) => ({
        ...prev,
        [slotKey]: { recipeId, ...overrides },
      }))
    },
    [setPlan]
  )

  const removeSlot = useCallback(
    (slotKey) => {
      setPlan((prev) => {
        const next = { ...prev }
        delete next[slotKey]
        return next
      })
    },
    [setPlan]
  )

  const toggleShoppingChecked = useCallback(
    (key) => {
      setShoppingChecked((prev) => ({ ...prev, [key]: !prev[key] }))
    },
    [setShoppingChecked]
  )

  const resetShoppingChecked = useCallback(() => setShoppingChecked({}), [setShoppingChecked])

  const togglePantry = useCallback(
    (key) => {
      setPantry((prev) => ({ ...prev, [key]: !prev[key] }))
    },
    [setPantry]
  )

  return {
    recipes,
    recipesReady,
    plan,
    shoppingChecked,
    pantry,
    weekStart,
    setWeekStart,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    getRecipe,
    assignSlot,
    removeSlot,
    toggleShoppingChecked,
    resetShoppingChecked,
    togglePantry,
  }
}

export function useWeekNavigation(weekStart, setWeekStart) {
  const prevWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d.getTime())
  }
  const nextWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d.getTime())
  }
  return { prevWeek, nextWeek }
}

export function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - day)
  return d.getTime()
}

export function slotKeyFor(dateIso, slot) {
  return `${dateIso}|${slot}`
}

export function dateToIso(date) {
  return formatIso(new Date(date))
}

export function formatIso(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function weekDates(startMs) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startMs)
    d.setDate(d.getDate() + i)
    return formatIso(d)
  })
}

export { genId }