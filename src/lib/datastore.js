import cuisinesRaw from '../../project-assets/cuisines.csv?raw'
import dietaryTagsRaw from '../../project-assets/dietary_tags.csv?raw'
import ingredientsRaw from '../../project-assets/ingredients.csv?raw'
import mealTypesRaw from '../../project-assets/meal_types.csv?raw'
import recipeCategoriesRaw from '../../project-assets/recipe_categories.csv?raw'
import recipeIngredientsRaw from '../../project-assets/recipe_ingredients.csv?raw'
import recipeStepsRaw from '../../project-assets/recipe_steps.csv?raw'
import recipesRaw from '../../project-assets/recipes.csv?raw'
import unitsRaw from '../../project-assets/units.csv?raw'

function parseCsv(raw) {
  const lines = raw.replace(/\r/g, '').split('\n').filter((l) => l.trim() !== '')
  if (lines.length === 0) return []
  const headers = lines[0].split(',')
  return lines.slice(1).map((line) => {
    const cells = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (ch === ',' && !inQuotes) {
        cells.push(current)
        current = ''
      } else {
        current += ch
      }
    }
    cells.push(current)
    const row = {}
    headers.forEach((h, i) => {
      row[h.trim()] = (cells[i] ?? '').trim()
    })
    return row
  })
}

export const cuisines = parseCsv(cuisinesRaw)
export const dietaryTags = parseCsv(dietaryTagsRaw)
export const seedIngredients = parseCsv(ingredientsRaw)
export const mealTypes = parseCsv(mealTypesRaw)
export const recipeCategories = parseCsv(recipeCategoriesRaw)
export const recipeIngredientsSeed = parseCsv(recipeIngredientsRaw)
export const recipeStepsSeed = parseCsv(recipeStepsRaw)
export const recipesSeed = parseCsv(recipesRaw)
export const units = parseCsv(unitsRaw)