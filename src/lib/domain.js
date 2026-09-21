import {
  cuisines,
  dietaryTags,
  seedIngredients,
  mealTypes,
  recipeCategories,
  recipeIngredientsSeed,
  recipeStepsSeed,
  recipesSeed,
  units,
} from './datastore'
import { APPROVED_IMAGES } from '../approved-images.js'

export const PLACEHOLDER_IMAGE = APPROVED_IMAGES.placeholder

export const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const SHOPPING_CATEGORIES = [
  'Produce',
  'Meat & seafood',
  'Dairy & eggs',
  'Grains & pantry',
  'Oils & condiments',
  'Canned & jarred',
  'Spices',
]

export function mapById(list) {
  const map = {}
  list.forEach((item) => {
    const id = item[Object.keys(item)[0]]
    map[id] = item
  })
  return map
}

export const cuisineMap = mapById(cuisines)
export const dietaryTagMap = mapById(dietaryTags)
export const mealTypeMap = mapById(mealTypes)
export const categoryMap = mapById(recipeCategories)
export const unitMap = mapById(units)
export const ingredientMap = mapById(seedIngredients)

export const cuisineOptions = cuisines.map((c) => ({ id: c.cuisine_id, name: c.cuisine_name }))
export const dietaryOptions = dietaryTags.map((d) => ({ id: d.dietary_tag_id, name: d.dietary_tag_name }))
export const mealTypeOptions = mealTypes.map((m) => ({ id: m.meal_type_id, name: m.meal_type_name }))
export const categoryOptions = recipeCategories.map((c) => ({ id: c.category_id, name: c.category_name }))
export const unitOptions = units.map((u) => ({ id: u.unit_id, name: u.unit_name }))
export const ingredientOptions = seedIngredients.map((i) => ({
  id: i.ingredient_id,
  name: i.ingredient_name,
  category: i.shopping_category,
}))

export function seedRecipes() {
  const recipes = recipesSeed.map((r) => {
    const ingredientRows = recipeIngredientsSeed.filter((ri) => ri.recipe_id === r.recipe_id)
    const stepRows = recipeStepsSeed
      .filter((rs) => rs.recipe_id === r.recipe_id)
      .sort((a, b) => Number(a.step_number) - Number(b.step_number))

    const sections = []
    const sectionOrder = []
    const sectionMap = {}
    ingredientRows.forEach((ri) => {
      const key = ri.section_name || 'Main'
      if (!sectionMap[key]) {
        sectionMap[key] = { name: key, ingredients: [] }
        sectionOrder.push(key)
      }
      sectionMap[key].ingredients.push({
        id: genId(),
        ingredientId: ri.ingredient_id,
        name: ri.ingredient_name,
        quantity: ri.quantity,
        unit: ri.unit || '',
        notes: ri.notes || '',
        optional: ri.optional === 'True' ? true : ri.optional === 'true',
        category: ingredientMap[ri.ingredient_id]
          ? ingredientMap[ri.ingredient_id].shopping_category
          : 'Produce',
      })
    })
    sectionOrder.forEach((key) => sections.push(sectionMap[key]))

    return {
      id: r.recipe_id,
      title: r.title,
      description: r.short_description,
      sourceName: r.source_name,
      sourceUrl: r.source_url,
      servings: Number(r.servings) || 1,
      prepTime: Number(r.prep_time_minutes) || 0,
      cookTime: Number(r.cook_time_minutes) || 0,
      totalTime: Number(r.total_time_minutes) || 0,
      cuisine: r.cuisine_id,
      mealType: r.meal_type_id,
      dietaryTags: r.dietary_tag_ids ? r.dietary_tag_ids.split(',').map((s) => s.trim()) : [],
      categories: r.category_ids ? r.category_ids.split(',').map((s) => s.trim()) : [],
      difficulty: Number(r.difficulty_1_to_5) || 1,
      spiceLevel: Number(r.spice_level_0_to_5) || 0,
      accentColor: r.accent_color || '#D97757',
      coverImageUrl: r.cover_image_url || '',
      includeInMealSuggestions: r.include_in_meal_suggestions === 'true',
      sections,
      steps: stepRows.map((s) => ({
        id: genId(),
        instruction: s.instruction,
        timer: Number(s.timer_minutes) || 0,
      })),
      options: {
        includeInShoppingList: true,
        showNutrition: false,
        allowSubstitutions: false,
        measurement: 'us',
      },
      isSeed: true,
      createdAt: Date.now(),
    }
  })
  return recipes
}

let counter = 0
export function genId(prefix = 'id') {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}_${counter}_${Math.random().toString(36).slice(2, 6)}`
}

export function emptyRecipe() {
  return {
    id: genId('R'),
    title: '',
    description: '',
    sourceName: '',
    sourceUrl: '',
    servings: 4,
    prepTime: 0,
    cookTime: 0,
    totalTime: 0,
    cuisine: '',
    mealType: '',
    dietaryTags: [],
    categories: [],
    difficulty: 1,
    spiceLevel: 0,
    accentColor: '#D97757',
    coverImageUrl: '',
    includeInMealSuggestions: true,
    sections: [{ id: genId('sec'), name: 'Main', ingredients: [] }],
    steps: [],
    options: {
      includeInShoppingList: true,
      showNutrition: false,
      allowSubstitutions: false,
      measurement: 'us',
    },
    isSeed: false,
    createdAt: Date.now(),
  }
}

export function emptyIngredient() {
  return {
    id: genId('ing'),
    ingredientId: '',
    name: '',
    quantity: '',
    unit: '',
    notes: '',
    optional: false,
  }
}

export function emptyStep() {
  return { id: genId('step'), instruction: '', timer: 0 }
}

export function colorPalette() {
  return ['#D97757', '#8A9A5B', '#4A90D9', '#9B59B6', '#E67E22', '#16A085', '#C0392B', '#2C3E50']
}