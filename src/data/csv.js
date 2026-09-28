// Raw CSV strings are imported so the lookup data lives in the source CSVs,
// not duplicated into application code.
import cuisinesCsv from './cuisines.csv?raw'
import dietaryTagsCsv from './dietary_tags.csv?raw'
import ingredientsCsv from './ingredients.csv?raw'
import mealTypesCsv from './meal_types.csv?raw'
import recipeCategoriesCsv from './recipe_categories.csv?raw'
import recipeIngredientsCsv from './recipe_ingredients.csv?raw'
import recipeStepsCsv from './recipe_steps.csv?raw'
import recipesCsv from './recipes.csv?raw'
import unitsCsv from './units.csv?raw'

export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.some((c) => c !== '')) rows.push(row)
      row = []
    } else {
      field += ch
    }
  }
  row.push(field)
  if (row.some((c) => c !== '')) rows.push(row)

  const [header, ...body] = rows
  return body.map((r) => {
    const obj = {}
    header.forEach((h, idx) => {
      obj[h.trim()] = (r[idx] ?? '').trim()
    })
    return obj
  })
}

function cleanList(value) {
  if (!value) return []
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export const LOOKUP = {
  cuisines: parseCsv(cuisinesCsv),
  dietaryTags: parseCsv(dietaryTagsCsv),
  ingredients: parseCsv(ingredientsCsv),
  mealTypes: parseCsv(mealTypesCsv),
  categories: parseCsv(recipeCategoriesCsv),
  units: parseCsv(unitsCsv),
}

// Build the initial seed recipes from the CSV files.
export function buildSeedRecipes() {
  const recipeRows = parseCsv(recipesCsv)
  const ingredientRows = parseCsv(recipeIngredientsCsv)
  const stepRows = parseCsv(recipeStepsCsv)

  return recipeRows.map((r) => {
    const ingredients = ingredientRows
      .filter((i) => i.recipe_id === r.recipe_id)
      .map((i) => ({
        id: `${r.recipe_id}-${i.display_order}`,
        section: i.section_name,
        ingredientId: i.ingredient_id,
        ingredientName: i.ingredient_name,
        quantity: i.quantity,
        unit: i.unit,
        notes: i.notes,
        optional: i.optional === 'True',
      }))

    const steps = stepRows
      .filter((s) => s.recipe_id === r.recipe_id)
      .map((s) => ({
        id: `${r.recipe_id}-${s.step_number}`,
        instruction: s.instruction,
        timerMinutes: parseFloat(s.timer_minutes) || 0,
      }))

    return {
      id: r.recipe_id,
      isSeed: true,
      title: r.title,
      shortDescription: r.short_description,
      sourceName: r.source_name,
      sourceUrl: r.source_url,
      servings: parseInt(r.servings, 10) || 1,
      prepTime: parseInt(r.prep_time_minutes, 10) || 0,
      cookTime: parseInt(r.cook_time_minutes, 10) || 0,
      totalTime: parseInt(r.total_time_minutes, 10) || 0,
      cuisineId: r.cuisine_id,
      mealTypeId: r.meal_type_id,
      dietaryTagIds: cleanList(r.dietary_tag_ids).filter((id) =>
        LOOKUP.dietaryTags.some((t) => t.dietary_tag_id === id)
      ),
      categoryIds: cleanList(r.category_ids).filter((id) =>
        LOOKUP.categories.some((c) => c.category_id === id)
      ),
      difficulty: parseInt(r.difficulty_1_to_5, 10) || 1,
      spiceLevel: parseInt(r.spice_level_0_to_5, 10) || 0,
      accentColor: r.accent_color || '#D97757',
      coverImageUrl: r.cover_image_url || '',
      includeInMealSuggestions: r.include_in_meal_suggestions === 'true',
      includeInShoppingList: true,
      showNutrition: false,
      allowSubstitutions: false,
      measurementUnit: 'us',
      ingredients,
      steps,
    }
  })
}