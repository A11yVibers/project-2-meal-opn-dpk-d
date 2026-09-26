import recipesRaw from '../project-assets/recipes.csv?raw'
import cuisinesRaw from '../project-assets/cuisines.csv?raw'
import dietaryTagsRaw from '../project-assets/dietary_tags.csv?raw'
import mealTypesRaw from '../project-assets/meal_types.csv?raw'
import recipeCategoriesRaw from '../project-assets/recipe_categories.csv?raw'
import recipeIngredientsRaw from '../project-assets/recipe_ingredients.csv?raw'
import recipeStepsRaw from '../project-assets/recipe_steps.csv?raw'
import ingredientsRaw from '../project-assets/ingredients.csv?raw'
import unitsRaw from '../project-assets/units.csv?raw'
import { APPROVED_IMAGES } from './approved-images.js'

function parseCSV(text) {
  const rows = []
  let field = ''
  let row = []
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += c
    } else {
      if (c === '"') inQuotes = true
      else if (c === ',') { row.push(field); field = '' }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++
        row.push(field); field = ''
        if (row.length > 1 || row[0] !== '') rows.push(row)
        row = []
      } else field += c
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows
}

function toObjects(raw) {
  const [header, ...body] = raw.filter((r) => r.length)
  return body.map((row) => {
    const obj = {}
    header.forEach((h, i) => { obj[h] = row[i] ?? '' })
    return obj
  })
}

function splitIds(str) {
  if (!str) return []
  return str.split(',').map((s) => s.trim()).filter(Boolean)
}

export const PLACEHOLDER_IMAGE = APPROVED_IMAGES.placeholder

const cuisines = toObjects(parseCSV(cuisinesRaw))
const dietaryTags = toObjects(parseCSV(dietaryTagsRaw))
const mealTypes = toObjects(parseCSV(mealTypesRaw))
const recipeCategories = toObjects(parseCSV(recipeCategoriesRaw))
const ingredients = toObjects(parseCSV(ingredientsRaw))
const units = toObjects(parseCSV(unitsRaw))
const recipeIngredients = toObjects(parseCSV(recipeIngredientsRaw))
const recipeSteps = toObjects(parseCSV(recipeStepsRaw))

export const CUISINES = cuisines
export const DIETARY_TAGS = dietaryTags
export const MEAL_TYPES = mealTypes
export const RECIPE_CATEGORIES = recipeCategories
export const INGREDIENTS = ingredients
export const UNITS = units

export const cuisineName = (id) => (cuisines.find((c) => c.cuisine_id === id) || {}).cuisine_name || ''
export const mealTypeName = (id) => (mealTypes.find((m) => m.meal_type_id === id) || {}).meal_type_name || ''
export const dietaryTagName = (id) => (dietaryTags.find((d) => d.dietary_tag_id === id) || {}).dietary_tag_name || ''
export const categoryName = (id) => (recipeCategories.find((c) => c.category_id === id) || {}).category_name || ''
export const ingredientName = (id) => (ingredients.find((i) => i.ingredient_id === id) || {}).ingredient_name || ''
export const ingredientCategory = (id) => (ingredients.find((i) => i.ingredient_id === id) || {}).shopping_category || 'Other'
export const unitName = (id) => (units.find((u) => u.unit_id === id) || {}).unit_name || ''

export const SHOPPING_CATEGORIES = [
  'Produce',
  'Meat & seafood',
  'Dairy & eggs',
  'Grains & pantry',
  'Oils & condiments',
  'Canned & jarred',
  'Spices',
]

function isTrue(v) { return v === true || v === 'true' || v === 'True' || v === 'TRUE' }

function buildSeedRecipes() {
  const seedRecipeRows = toObjects(parseCSV(recipesRaw))
  return seedRecipeRows.map((r) => {
    const ingRows = recipeIngredients
      .filter((i) => i.recipe_id === r.recipe_id)
      .sort((a, b) => Number(a.display_order) - Number(b.display_order))

    const stepRows = recipeSteps
      .filter((s) => s.recipe_id === r.recipe_id)
      .sort((a, b) => Number(a.step_number) - Number(b.step_number))

    return {
      id: r.recipe_id,
      isSeed: true,
      title: r.title,
      shortDescription: r.short_description,
      sourceName: r.source_name,
      sourceUrl: r.source_url,
      servings: Number(r.servings) || 1,
      prepTime: Number(r.prep_time_minutes) || 0,
      cookTime: Number(r.cook_time_minutes) || 0,
      cuisineId: r.cuisine_id,
      mealTypeId: r.meal_type_id,
      dietaryTagIds: splitIds(r.dietary_tag_ids),
      categoryIds: splitIds(r.category_ids),
      difficulty: Number(r.difficulty_1_to_5) || 1,
      spiceLevel: Number(r.spice_level_0_to_5) || 0,
      accentColor: r.accent_color || '#D97757',
      coverImageUrl: r.cover_image_url || '',
      includeInMealSuggestions: isTrue(r.include_in_meal_suggestions),
      ingredientSections: groupSections(ingRows.map((i) => ({
        ingredientId: i.ingredient_id,
        ingredientName: i.ingredient_name,
        quantity: i.quantity,
        unit: i.unit,
        notes: i.notes,
        optional: isTrue(i.optional),
      })), ingRows),
      steps: stepRows.map((s) => ({
        instruction: s.instruction,
        timerMinutes: Number(s.timer_minutes) || 0,
      })),
      options: {
        includeInShopping: true,
        showNutrition: true,
        allowSubstitutions: false,
        measurement: 'US',
      },
    }
  })
}

function groupSections(items, rows) {
  const sectionsMap = new Map()
  rows.forEach((row, idx) => {
    const key = row.section_name
    if (!sectionsMap.has(key)) sectionsMap.set(key, [])
    sectionsMap.get(key).push(items[idx])
  })
  return Array.from(sectionsMap.entries()).map(([name, items]) => ({ name, items }))
}

export const SEED_RECIPES = buildSeedRecipes()