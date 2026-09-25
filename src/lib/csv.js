import recipesCsv from '../../project-assets/recipes.csv?raw'
import ingredientsCsv from '../../project-assets/ingredients.csv?raw'
import unitsCsv from '../../project-assets/units.csv?raw'
import cuisinesCsv from '../../project-assets/cuisines.csv?raw'
import mealTypesCsv from '../../project-assets/meal_types.csv?raw'
import dietaryTagsCsv from '../../project-assets/dietary_tags.csv?raw'
import categoriesCsv from '../../project-assets/recipe_categories.csv?raw'
import recipeIngredientsCsv from '../../project-assets/recipe_ingredients.csv?raw'
import recipeStepsCsv from '../../project-assets/recipe_steps.csv?raw'

export function parseCsv(text) {
  const rows = []
  let field = ''
  let row = []
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.some((v) => v !== '')) rows.push(row)
      row = []
    } else {
      field += c
    }
  }
  row.push(field)
  if (row.some((v) => v !== '')) rows.push(row)
  if (rows.length === 0) return []
  const headers = rows[0]
  return rows.slice(1).map((r) => {
    const obj = {}
    headers.forEach((h, idx) => {
      obj[h] = r[idx] ?? ''
    })
    return obj
  })
}

function num(v) {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

function csvList(v) {
  if (!v || v.trim() === '') return []
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function loadData() {
  const recipes = parseCsv(recipesCsv)
  const ingredients = parseCsv(ingredientsCsv)
  const units = parseCsv(unitsCsv)
  const cuisines = parseCsv(cuisinesCsv)
  const mealTypes = parseCsv(mealTypesCsv)
  const dietaryTags = parseCsv(dietaryTagsCsv)
  const categories = parseCsv(categoriesCsv)
  const recipeIngredients = parseCsv(recipeIngredientsCsv)
  const recipeSteps = parseCsv(recipeStepsCsv)

  const recipesById = {}
  recipes.forEach((r) => {
    recipesById[r.recipe_id] = {
      id: r.recipe_id,
      title: r.title,
      shortDescription: r.short_description,
      sourceName: r.source_name,
      sourceUrl: r.source_url,
      servings: num(r.servings),
      prepTime: num(r.prep_time_minutes),
      cookTime: num(r.cook_time_minutes),
      totalTime: num(r.total_time_minutes),
      cuisineId: r.cuisine_id,
      mealTypeId: r.meal_type_id,
      dietaryTagIds: csvList(r.dietary_tag_ids),
      categoryIds: csvList(r.category_ids),
      difficulty: num(r.difficulty_1_to_5),
      spiceLevel: num(r.spice_level_0_to_5),
      accentColor: r.accent_color || '#D97757',
      coverImageUrl: r.cover_image_url || '',
      includeInMealSuggestions: r.include_in_meal_suggestions === 'true' || r.include_in_meal_suggestions === 'True',
      includeInShoppingList: true,
      showNutrition: true,
      allowSubstitutions: false,
      measurementSystem: 'us',
      sections: [],
      steps: [],
    }
  })

  recipeIngredients.forEach((ri) => {
    const recipe = recipesById[ri.recipe_id]
    if (!recipe) return
    let section = recipe.sections.find((s) => s.name === ri.section_name)
    if (!section) {
      section = { name: ri.section_name, ingredients: [] }
      recipe.sections.push(section)
    }
    section.ingredients.push({
      ingredientId: ri.ingredient_id || '',
      name: ri.ingredient_name || '',
      quantity: num(ri.quantity),
      unit: ri.unit || '',
      notes: ri.notes || '',
      optional: ri.optional === 'True' || ri.optional === 'true',
    })
  })

  recipeSteps.forEach((rs) => {
    const recipe = recipesById[rs.recipe_id]
    if (!recipe) return
    recipe.steps.push({
      stepNumber: num(rs.step_number),
      instruction: rs.instruction || '',
      timer: num(rs.timer_minutes),
    })
  })

  Object.values(recipesById).forEach((recipe) => {
    const numbered = recipe.steps.filter((s) => s.stepNumber > 0).sort((a, b) => a.stepNumber - b.stepNumber)
    const unnumbered = recipe.steps.filter((s) => !(s.stepNumber > 0))
    recipe.steps = [...numbered, ...unnumbered].map(({ stepNumber, ...rest }) => rest)
  })

  return {
    recipes: Object.values(recipesById),
    ingredients: ingredients.map((i) => ({ id: i.ingredient_id, name: i.ingredient_name, category: i.shopping_category })),
    units: units.map((u) => ({ id: u.unit_id, name: u.unit_name })),
    cuisines: cuisines.map((c) => ({ id: c.cuisine_id, name: c.cuisine_name })),
    mealTypes: mealTypes.map((m) => ({ id: m.meal_type_id, name: m.meal_type_name })),
    dietaryTags: dietaryTags.map((d) => ({ id: d.dietary_tag_id, name: d.dietary_tag_name })),
    categories: categories.map((c) => ({ id: c.category_id, name: c.category_name })),
  }
}