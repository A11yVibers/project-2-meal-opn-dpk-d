import { parseCsv } from './parseCsv'

import cuisineCsv from '../../project-assets/cuisines.csv?raw'
import dietaryCsv from '../../project-assets/dietary_tags.csv?raw'
import ingredientCsv from '../../project-assets/ingredients.csv?raw'
import mealTypeCsv from '../../project-assets/meal_types.csv?raw'
import categoryCsv from '../../project-assets/recipe_categories.csv?raw'
import recipeCsv from '../../project-assets/recipes.csv?raw'
import recipeIngredientsCsv from '../../project-assets/recipe_ingredients.csv?raw'
import recipeStepsCsv from '../../project-assets/recipe_steps.csv?raw'
import unitCsv from '../../project-assets/units.csv?raw'

export const cuisines = parseCsv(cuisineCsv).map((r) => ({ id: r.cuisine_id, name: r.cuisine_name }))
export const dietaryTags = parseCsv(dietaryCsv).map((r) => ({ id: r.dietary_tag_id, name: r.dietary_tag_name }))
export const ingredients = parseCsv(ingredientCsv).map((r) => ({ id: r.ingredient_id, name: r.ingredient_name, category: r.shopping_category }))
export const mealTypes = parseCsv(mealTypeCsv).map((r) => ({ id: r.meal_type_id, name: r.meal_type_name }))
export const categories = parseCsv(categoryCsv).map((r) => ({ id: r.category_id, name: r.category_name }))
export const units = parseCsv(unitCsv).map((r) => ({ id: r.unit_id, name: r.unit_name }))

function toBool(v) {
  if (v === true) return true
  if (v === false) return false
  return String(v).toLowerCase() === 'true'
}

function splitIds(v) {
  if (!v) return []
  return String(v).split(',').map((s) => s.trim()).filter(Boolean)
}

const recipeRows = parseCsv(recipeCsv)
const recipeIngredientRows = parseCsv(recipeIngredientsCsv)
const recipeStepRows = parseCsv(recipeStepsCsv)

const ingredientNameById = new Map(ingredients.map((i) => [i.id, i.name]))
const ingredientCategoryById = new Map(ingredients.map((i) => [i.id, i.category]))

const mealTypeNameById = new Map(mealTypes.map((m) => [m.id, m.name]))
const cuisineNameById = new Map(cuisines.map((c) => [c.id, c.name]))
const categoryNameById = new Map(categories.map((c) => [c.id, c.name]))
const dietaryNameById = new Map(dietaryTags.map((d) => [d.id, d.name]))

export function isBuiltInIngredient(name) {
  return ingredients.some((i) => i.name.toLowerCase() === name.toLowerCase())
}

function resolveIngredient(name, id) {
  if (id && ingredientNameById.has(id)) {
    return { id, name: ingredientNameById.get(id) }
  }
  if (name) {
    const match = ingredients.find((i) => i.name.toLowerCase() === name.toLowerCase())
    if (match) return { id: match.id, name: match.name }
  }
  return { id: id || null, name: name || '' }
}

export const seedRecipes = recipeRows.map((row) => {
  const myIngredientRows = recipeIngredientRows.filter((r) => r.recipe_id === row.recipe_id)
  const sections = []
  for (const ir of myIngredientRows) {
    let section = sections.find((s) => s.name === ir.section_name)
    if (!section) {
      section = { name: ir.section_name, items: [] }
      sections.push(section)
    }
    const resolved = resolveIngredient(ir.ingredient_name, ir.ingredient_id)
    section.items.push({
      ingredientId: resolved.id,
      name: resolved.name,
      quantity: ir.quantity,
      unit: ir.unit,
      notes: ir.notes || '',
      optional: toBool(ir.optional),
    })
  }
  const mySteps = recipeStepRows
    .filter((r) => r.recipe_id === row.recipe_id)
    .map((r) => ({ instruction: r.instruction, timerMinutes: Number(r.timer_minutes) || 0 }))

  return {
    id: row.recipe_id,
    seed: true,
    title: row.title,
    shortDescription: row.short_description,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    servings: Number(row.servings) || 1,
    prepTimeMinutes: Number(row.prep_time_minutes) || 0,
    cookTimeMinutes: Number(row.cook_time_minutes) || 0,
    totalTimeMinutes: Number(row.total_time_minutes) || 0,
    cuisineId: row.cuisine_id,
    cuisineName: cuisineNameById.get(row.cuisine_id) || '',
    mealTypeId: row.meal_type_id,
    mealTypeName: mealTypeNameById.get(row.meal_type_id) || '',
    dietaryTagIds: splitIds(row.dietary_tag_ids).map((id) => dietaryNameById.get(id)).filter(Boolean),
    categoryIds: splitIds(row.category_ids).map((id) => categoryNameById.get(id)).filter(Boolean),
    difficulty: Number(row.difficulty_1_to_5) || 1,
    spiceLevel: Number(row.spice_level_0_to_5) || 0,
    accentColor: row.accent_color || '#D97757',
    coverImageUrl: row.cover_image_url || '',
    includeInMealSuggestions: toBool(row.include_in_meal_suggestions),
    sections,
    steps: mySteps,
    options: {
      includeInShoppingList: true,
      showNutrition: false,
      allowSubstitutions: false,
      measurementSystem: 'US',
    },
  }
})

export const shoppingCategories = [
  'Produce',
  'Meat & seafood',
  'Dairy & eggs',
  'Grains & pantry',
  'Oils & condiments',
  'Canned & jarred',
  'Spices',
  'Other',
]

export function categoryForIngredient(name, id) {
  if (id && ingredientCategoryById.has(id)) return ingredientCategoryById.get(id)
  const match = ingredients.find((i) => i.name.toLowerCase() === name.toLowerCase())
  return match ? match.category : 'Other'
}