import { useEffect, useState, useCallback, useMemo } from 'react'
import { seedRecipes } from './data/seed'

const STORAGE_KEY = 'meal-planner-state-v1'

const DEFAULT_STATE = {
  recipes: [], // user-created recipes only (seed recipes are merged in)
  mealPlan: {}, // { weekKey: { '2026-09-25|Breakfast': recipeId, ... } }
  pantry: [], // ingredient names the user already has
  shoppingChecked: {}, // { key: true }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw)
    return {
      recipes: Array.isArray(parsed.recipes) ? parsed.recipes : [],
      mealPlan: parsed.mealPlan && typeof parsed.mealPlan === 'object' ? parsed.mealPlan : {},
      pantry: Array.isArray(parsed.pantry) ? parsed.pantry : [],
      shoppingChecked: parsed.shoppingChecked && typeof parsed.shoppingChecked === 'object' ? parsed.shoppingChecked : {},
    }
  } catch {
    return DEFAULT_STATE
  }
}

export function useAppState() {
  const [state, setState] = useState(loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // storage full or unavailable; ignore
    }
  }, [state])

  // All recipes: user + seed, deduped by id
  const allRecipes = useMemo(() => {
    const userIds = new Set(state.recipes.map((r) => r.id))
    return [...state.recipes, ...seedRecipes.filter((s) => !userIds.has(s.id))]
  }, [state.recipes])

  const recipeById = useMemo(() => {
    const map = new Map()
    for (const r of allRecipes) map.set(r.id, r)
    return map
  }, [allRecipes])

  const addRecipe = useCallback((recipe) => {
    setState((s) => ({ ...s, recipes: [...s.recipes, recipe] }))
  }, [])

  const updateRecipe = useCallback((recipe) => {
    setState((s) => ({ ...s, recipes: s.recipes.map((r) => (r.id === recipe.id ? recipe : r)) }))
  }, [])

  const deleteRecipe = useCallback((id) => {
    setState((s) => {
      const newPlan = { ...s.mealPlan }
      for (const wk of Object.keys(newPlan)) {
        for (const slot of Object.keys(newPlan[wk])) {
          if (newPlan[wk][slot] === id) delete newPlan[wk][slot]
        }
      }
      return { ...s, recipes: s.recipes.filter((r) => r.id !== id), mealPlan: newPlan }
    })
  }, [])

  const setMealSlot = useCallback((weekKey, day, mealType, recipeId) => {
    setState((s) => {
      const plan = { ...s.mealPlan }
      const week = { ...(plan[weekKey] || {}) }
      const key = `${day}|${mealType}`
      if (recipeId == null) {
        delete week[key]
      } else {
        week[key] = recipeId
      }
      plan[weekKey] = week
      return { ...s, mealPlan: plan }
    })
  }, [])

  const togglePantry = useCallback((name) => {
    setState((s) => {
      const lower = name.toLowerCase()
      const exists = s.pantry.some((p) => p.toLowerCase() === lower)
      return {
        ...s,
        pantry: exists ? s.pantry.filter((p) => p.toLowerCase() !== lower) : [...s.pantry, name],
      }
    })
  }, [])

  const setShoppingChecked = useCallback((key, value) => {
    setState((s) => {
      const next = { ...s.shoppingChecked }
      if (value) next[key] = true
      else delete next[key]
      return { ...s, shoppingChecked: next }
    })
  }, [])

  return {
    userRecipes: state.recipes,
    allRecipes,
    recipeById,
    mealPlan: state.mealPlan,
    pantry: state.pantry,
    shoppingChecked: state.shoppingChecked,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    setMealSlot,
    togglePantry,
    setShoppingChecked,
  }
}