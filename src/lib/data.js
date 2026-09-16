import { parseCsvObjects } from './csv.js'

import recipesRaw from '../../project-assets/recipes.csv?raw'
import recipeIngredientsRaw from '../../project-assets/recipe_ingredients.csv?raw'
import recipeStepsRaw from '../../project-assets/recipe_steps.csv?raw'
import ingredientsRaw from '../../project-assets/ingredients.csv?raw'
import unitsRaw from '../../project-assets/units.csv?raw'
import cuisinesRaw from '../../project-assets/cuisines.csv?raw'
import dietaryTagsRaw from '../../project-assets/dietary_tags.csv?raw'
import mealTypesRaw from '../../project-assets/meal_types.csv?raw'
import categoriesRaw from '../../project-assets/recipe_categories.csv?raw'

const recipeRows = parseCsvObjects(recipesRaw)
const recipeIngredientRows = parseCsvObjects(recipeIngredientsRaw)
const recipeStepRows = parseCsvObjects(recipeStepsRaw)
const ingredientRows = parseCsvObjects(ingredientsRaw)

export const CUISINES = parseCsvObjects(cuisinesRaw).map((r) => ({ id: r.cuisine_id, name: r.cuisine_name }))
export const DIETARY_TAGS = parseCsvObjects(dietaryTagsRaw).map((r) => ({ id: r.dietary_tag_id, name: r.dietary_tag_name }))
export const MEAL_TYPES = parseCsvObjects(mealTypesRaw).map((r) => ({ id: r.meal_type_id, name: r.meal_type_name }))
export const RECIPE_CATEGORIES = parseCsvObjects(categoriesRaw).map((r) => ({ id: r.category_id, name: r.category_name }))
export const UNITS = parseCsvObjects(unitsRaw).map((r) => ({ id: r.unit_id, name: r.unit_name }))

export const INGREDIENTS = ingredientRows
  .map((r) => ({ id: r.ingredient_id, name: r.ingredient_name, category: r.shopping_category }))
  .sort((a, b) => a.name.localeCompare(b.name))

export const SHOPPING_CATEGORIES = [
  'Produce',
  'Meat & seafood',
  'Dairy & eggs',
  'Grains & pantry',
  'Oils & condiments',
  'Canned & jarred',
  'Spices',
]

export const SPICE_LABELS = ['None', 'Mild', 'Medium', 'Spicy', 'Hot', 'Very spicy']

export const ACCENT_PRESETS = [
  '#D97757',
  '#8A9A5B',
  '#4E8098',
  '#B36A5E',
  '#7D6B91',
  '#C6878F',
  '#3E8E7E',
  '#C9973B',
]

export const MEASUREMENT_SYSTEMS = [
  { id: 'imperial', name: 'US customary' },
  { id: 'metric', name: 'Metric' },
]

export const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

function parseList(value) {
  if (!value) return []
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function toBool(value) {
  if (typeof value === 'boolean') return value
  return String(value).toLowerCase() === 'true'
}

const DEFAULT_OPTIONS = {
  includeInShoppingList: true,
  showNutrition: false,
  allowSubstitutions: true,
  measurementSystem: 'imperial',
}

function buildSeedRecipe(row) {
  const id = row.recipe_id
  const ingredients = recipeIngredientRows
    .filter((r) => r.recipe_id === id)
    .sort((a, b) => Number(a.display_order) - Number(b.display_order))
    .map((r) => ({
      section: r.section_name || 'Main',
      name: (r.ingredient_name || '').trim(),
      quantity: r.quantity || '',
      unit: (r.unit || '').trim(),
      optional: toBool(r.optional),
      notes: (r.notes || '').trim(),
    }))

  const steps = recipeStepRows
    .filter((r) => r.recipe_id === id)
    .sort((a, b) => Number(a.step_number) - Number(b.step_number))
    .map((r) => ({
      stepNumber: Number(r.step_number),
      instruction: (r.instruction || '').trim(),
      timerMinutes: r.timer_minutes ? Number(r.timer_minutes) : 0,
    }))

  return {
    id,
    isUser: false,
    title: row.title,
    shortDescription: row.short_description || '',
    sourceName: row.source_name || '',
    sourceUrl: row.source_url || '',
    servings: Number(row.servings) || 1,
    prepTimeMinutes: Number(row.prep_time_minutes) || 0,
    cookTimeMinutes: Number(row.cook_time_minutes) || 0,
    totalTimeMinutes: Number(row.total_time_minutes) || 0,
    cuisineId: row.cuisine_id || '',
    mealTypeId: row.meal_type_id || '',
    dietaryTagIds: parseList(row.dietary_tag_ids),
    categoryIds: parseList(row.category_ids),
    difficulty: row.difficulty_1_to_5 ? Number(row.difficulty_1_to_5) : null,
    spiceLevel: row.spice_level_0_to_5 ? Number(row.spice_level_0_to_5) : 0,
    accentColor: row.accent_color || '#D97757',
    coverImageUrl: row.cover_image_url || '',
    includeInMealSuggestions: toBool(row.include_in_meal_suggestions),
    ingredients,
    steps,
    options: { ...DEFAULT_OPTIONS },
  }
}

export const SEED_RECIPES = recipeRows.map(buildSeedRecipe)

let idCounter = 0

export function newRecipeId() {
  idCounter += 1
  return `U${Date.now().toString(36)}${idCounter.toString(36)}`.toUpperCase()
}

export function emptyIngredient() {
  return { name: '', quantity: '', unit: '', optional: false, notes: '' }
}

export function emptyStep() {
  return { instruction: '', timerMinutes: '' }
}

export function createEmptyDraft() {
  return {
    title: '',
    sourceName: '',
    sourceUrl: '',
    cuisineId: '',
    mealTypeId: '',
    dietaryTagIds: [],
    categoryIds: [],
    servings: 4,
    prepTimeMinutes: 0,
    cookTimeMinutes: 0,
    spiceLevel: 0,
    accentColor: '#D97757',
    coverImageUrl: '',
    ingredientSections: [{ name: 'Main', ingredients: [emptyIngredient()] }],
    steps: [emptyStep()],
    options: { ...DEFAULT_OPTIONS },
    includeInMealSuggestions: true,
    mealPlan: {
      addToMealPlan: false,
      mealSlot: 'Dinner',
      week: 'this',
      cookingDate: todayLocalIso(),
      servingTime: '',
    },
  }
}

export function draftFromRecipe(recipe) {
  return {
    title: recipe.title,
    sourceName: recipe.sourceName || '',
    sourceUrl: recipe.sourceUrl || '',
    cuisineId: recipe.cuisineId || '',
    mealTypeId: recipe.mealTypeId || '',
    dietaryTagIds: [...(recipe.dietaryTagIds || [])],
    categoryIds: [...(recipe.categoryIds || [])],
    servings: recipe.servings || 1,
    prepTimeMinutes: recipe.prepTimeMinutes || 0,
    cookTimeMinutes: recipe.cookTimeMinutes || 0,
    spiceLevel: recipe.spiceLevel ?? 0,
    accentColor: recipe.accentColor || '#D97757',
    coverImageUrl: recipe.coverImageUrl || '',
    ingredientSections: groupIngredientsIntoDraft(recipe.ingredients || []),
    steps: (recipe.steps || []).map((s) => ({
      instruction: s.instruction,
      timerMinutes: s.timerMinutes || '',
    })),
    options: { ...DEFAULT_OPTIONS, ...(recipe.options || {}) },
    includeInMealSuggestions: recipe.includeInMealSuggestions !== false,
    mealPlan: {
      addToMealPlan: false,
      mealSlot: 'Dinner',
      week: 'this',
      cookingDate: todayLocalIso(),
      servingTime: '',
    },
  }
}

function todayLocalIso() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function groupIngredientsIntoDraft(ingredients) {
  const sections = []
  const bySection = new Map()
  ingredients.forEach((ing) => {
    const name = ing.section || 'Main'
    if (!bySection.has(name)) {
      bySection.set(name, [])
      sections.push({ name, ingredients: bySection.get(name) })
    }
    bySection.get(name).push({
      name: ing.name,
      quantity: ing.quantity != null ? String(ing.quantity) : '',
      unit: ing.unit || '',
      optional: !!ing.optional,
      notes: ing.notes || '',
    })
  })
  if (sections.length === 0) sections.push({ name: 'Main', ingredients: [emptyIngredient()] })
  return sections
}

export function buildRecipeFromDraft(draft, id) {
  const ingredients = []
  draft.ingredientSections.forEach((section) => {
    section.ingredients.forEach((ing) => {
      if ((ing.name || '').trim() === '') return
      ingredients.push({
        section: section.name || 'Main',
        name: ing.name.trim(),
        quantity: ing.quantity != null ? String(ing.quantity).trim() : '',
        unit: (ing.unit || '').trim(),
        optional: !!ing.optional,
        notes: (ing.notes || '').trim(),
      })
    })
  })

  const steps = draft.steps
    .filter((s) => (s.instruction || '').trim() !== '')
    .map((s, i) => ({
      stepNumber: i + 1,
      instruction: s.instruction.trim(),
      timerMinutes: s.timerMinutes === '' || s.timerMinutes == null ? 0 : Number(s.timerMinutes),
    }))

  const prep = Number(draft.prepTimeMinutes) || 0
  const cook = Number(draft.cookTimeMinutes) || 0

  return {
    id,
    isUser: true,
    title: draft.title.trim(),
    shortDescription: '',
    sourceName: (draft.sourceName || '').trim(),
    sourceUrl: (draft.sourceUrl || '').trim(),
    servings: Number(draft.servings) || 1,
    prepTimeMinutes: prep,
    cookTimeMinutes: cook,
    totalTimeMinutes: prep + cook,
    cuisineId: draft.cuisineId || '',
    mealTypeId: draft.mealTypeId || '',
    dietaryTagIds: [...draft.dietaryTagIds],
    categoryIds: [...draft.categoryIds],
    difficulty: null,
    spiceLevel: Number(draft.spiceLevel) || 0,
    accentColor: draft.accentColor || '#D97757',
    coverImageUrl: (draft.coverImageUrl || '').trim(),
    includeInMealSuggestions: !!draft.includeInMealSuggestions,
    ingredients,
    steps,
    options: { ...draft.options },
  }
}

export function lookupName(list, id) {
  const item = list.find((x) => x.id === id)
  return item ? item.name : ''
}

export function cuisineName(id) {
  return lookupName(CUISINES, id)
}

export function mealTypeName(id) {
  return lookupName(MEAL_TYPES, id)
}

export function ingredientCategory(name) {
  const match = INGREDIENTS.find(
    (i) => i.name.toLowerCase() === String(name).trim().toLowerCase()
  )
  return match ? match.category : 'Other'
}