import { APPROVED_IMAGES } from './approved-images.js'

const csvModules = import.meta.glob('../project-assets/*.csv', { eager: true, query: '?raw', import: 'default' })

const FILE_BASENAMES = {
  cuisines: 'cuisines.csv',
  dietaryTags: 'dietary_tags.csv',
  ingredients: 'ingredients.csv',
  mealTypes: 'meal_types.csv',
  recipeCategories: 'recipe_categories.csv',
  recipeIngredients: 'recipe_ingredients.csv',
  recipeSteps: 'recipe_steps.csv',
  recipes: 'recipes.csv',
  units: 'units.csv',
}

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
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
      rows.push(row)
      row = []
    } else {
      field += c
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function csvToObjects(text) {
  const rows = parseCsv(String(text).replace(/^\uFEFF/, '').trim())
  if (rows.length === 0) return []
  const headers = rows[0].map((h) => h.trim())
  return rows.slice(1).filter((r) => r.length > 1 && r.some((c) => c !== '')).map((row) => {
    const obj = {}
    headers.forEach((h, idx) => {
      obj[h] = row[idx] !== undefined ? row[idx].trim() : ''
    })
    return obj
  })
}

export function loadData() {
  const results = {}
  for (const [key, basename] of Object.entries(FILE_BASENAMES)) {
    const entry = Object.entries(csvModules).find(([path]) => path.endsWith('/' + basename))
    if (entry) {
      results[key] = csvToObjects(entry[1])
    } else {
      results[key] = []
    }
  }
  return Promise.resolve(results)
}

export function parseBool(value) {
  if (typeof value === 'boolean') return value
  if (value == null) return false
  return String(value).toLowerCase() === 'true'
}

export function buildSeedRecipes(raw) {
  const recipes = []
  for (const r of raw.recipes) {
    const meta = {
      cuisine: raw.cuisines.find((c) => c.cuisine_id === r.cuisine_id),
      mealType: raw.mealTypes.find((m) => m.meal_type_id === r.meal_type_id),
      dietaryTags: (r.dietary_tag_ids || '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
        .map((id) => raw.dietaryTags.find((d) => d.dietary_tag_id === id))
        .filter(Boolean),
      categories: (r.category_ids || '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
        .map((id) => raw.recipeCategories.find((c) => c.category_id === id))
        .filter(Boolean),
    }

    const ingredientRows = raw.recipeIngredients.filter((ri) => ri.recipe_id === r.recipe_id)
      .sort((a, b) => Number(a.display_order) - Number(b.display_order))

    const sections = []
    const sectionIndex = {}
    for (const ri of ingredientRows) {
      if (!(ri.section_name in sectionIndex)) {
        sectionIndex[ri.section_name] = sections.length
        sections.push({ id: `seed-s${sections.length}`, name: ri.section_name, ingredients: [] })
      }
      const section = sections[sectionIndex[ri.section_name]]
      section.ingredients.push({
        id: `seed-i${section.id}-${section.ingredients.length}`,
        ingredientId: ri.ingredient_id,
        name: ri.ingredient_name,
        quantity: ri.quantity,
        unit: ri.unit,
        notes: ri.notes,
        optional: parseBool(ri.optional),
        shoppingCategory: (raw.ingredients.find((ig) => ig.ingredient_id === ri.ingredient_id) || {}).shopping_category || 'Other',
      })
    }

    const steps = raw.recipeSteps.filter((rs) => rs.recipe_id === r.recipe_id)
      .sort((a, b) => Number(a.step_number) - Number(b.step_number))
      .map((rs) => ({
        id: `seed-st${rs.step_number}`,
        instruction: rs.instruction,
        timerMinutes: Number(rs.timer_minutes) || 0,
      }))

    recipes.push({
      id: r.recipe_id,
      seed: true,
      title: r.title,
      shortDescription: r.short_description,
      sourceName: r.source_name,
      sourceUrl: r.source_url,
      servings: Number(r.servings) || 1,
      prepTimeMinutes: Number(r.prep_time_minutes) || 0,
      cookTimeMinutes: Number(r.cook_time_minutes) || 0,
      totalTimeMinutes: Number(r.total_time_minutes) || 0,
      cuisine: meta.cuisine ? meta.cuisine.cuisine_name : '',
      mealType: meta.mealType ? meta.mealType.meal_type_name : '',
      dietaryTags: meta.dietaryTags.map((d) => d.dietary_tag_name),
      categories: meta.categories.map((c) => c.category_name),
      difficulty: Number(r.difficulty_1_to_5) || 1,
      spiceLevel: Number(r.spice_level_0_to_5) || 0,
      accentColor: r.accent_color || '#888888',
      coverImageUrl: r.cover_image_url || '',
      includeInMealSuggestions: parseBool(r.include_in_meal_suggestions),
      sections,
      steps,
      includeInShoppingList: true,
      showNutrition: false,
      allowSubstitutions: false,
      measurementSystem: 'us',
    })
  }
  return recipes
}

export function placeholderImage() {
  return APPROVED_IMAGES.placeholder
}

export function resolveImage(url) {
  return url && url.trim() ? url.trim() : placeholderImage()
}