import { useState, useMemo } from 'react'
import { APPROVED_IMAGES } from '../approved-images'
import { cuisines, mealTypes, dietaryTags, categories, ingredients, units, categoryForIngredient } from '../data/seed'
import { newId, weekKeyForDate, toDateKey } from '../dateUtils'

function emptyIngredient() {
  return { ingredientId: null, name: '', quantity: '', unit: '', notes: '', optional: false }
}

function emptySection(name = 'Main') {
  return { name, items: [emptyIngredient()] }
}

export default function RecipeForm({ app, recipe, onSaved, onCancel }) {
  const editing = Boolean(recipe)

  const [title, setTitle] = useState(recipe?.title || '')
  const [sourceUrl, setSourceUrl] = useState(recipe?.sourceUrl || '')
  const [cuisineId, setCuisineId] = useState(recipe?.cuisineId || '')
  const [mealTypeId, setMealTypeId] = useState(recipe?.mealTypeId || '')
  const [dietaryIds, setDietaryIds] = useState(recipe?.dietaryTagIds || [])
  const [categoryIds, setCategoryIds] = useState(recipe?.categoryIds || [])

  const [servings, setServings] = useState(recipe?.servings || 4)
  const [prepTime, setPrepTime] = useState(recipe?.prepTimeMinutes || 0)
  const [cookTime, setCookTime] = useState(recipe?.cookTimeMinutes || 0)
  const [spiceLevel, setSpiceLevel] = useState(recipe?.spiceLevel || 0)

  const [coverUrl, setCoverUrl] = useState(recipe?.coverImageUrl || '')
  const [accentColor, setAccentColor] = useState(recipe?.accentColor || '#D97757')

  const [sections, setSections] = useState(recipe?.sections?.map((s) => ({
    name: s.name,
    items: s.items.map((i) => ({ ...i })),
  })) || [emptySection()])

  const [steps, setSteps] = useState(recipe?.steps?.map((s) => ({ ...s })) || [{ instruction: '', timerMinutes: '' }])
  const [shortDescription, setShortDescription] = useState(recipe?.shortDescription || '')

  // Meal planning options
  const [includeInSuggestions, setIncludeInSuggestions] = useState(recipe?.includeInMealSuggestions ?? true)
  const [addToPlanNow, setAddToPlanNow] = useState(false)
  const [planWeek, setPlanWeek] = useState(toDateKey(new Date()))
  const [planDay, setPlanDay] = useState('')
  const [planMeal, setPlanMeal] = useState('Dinner')

  // Options menu
  const [optIncludeShopping, setOptIncludeShopping] = useState(recipe?.options?.includeInShoppingList ?? true)
  const [optShowNutrition, setOptShowNutrition] = useState(recipe?.options?.showNutrition ?? false)
  const [optAllowSubs, setOptAllowSubs] = useState(recipe?.options?.allowSubstitutions ?? false)
  const [measurement, setMeasurement] = useState(recipe?.options?.measurementSystem ?? 'US')

  const totalTime = (Number(prepTime) || 0) + (Number(cookTime) || 0)

  const ingredientOptions = useMemo(() => ingredients.map((i) => i.name).sort(), [])

  // ---- Ingredient section/entry handlers ----
  const setSectionName = (si, name) => {
    setSections((prev) => prev.map((s, i) => (i === si ? { ...s, name } : s)))
  }
  const addSection = () => setSections((prev) => [...prev, emptySection('Section ' + (prev.length + 1))])
  const removeSection = (si) => {
    setSections((prev) => {
      if (prev.length <= 1) return [emptySection()]
      return prev.filter((_, i) => i !== si)
    })
  }
  const moveSection = (si, dir) => {
    setSections((prev) => {
      const next = [...prev]
      const target = si + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[si], next[target]] = [next[target], next[si]]
      return next
    })
  }
  const updateItem = (si, ii, patch) => {
    setSections((prev) => prev.map((s, i) => {
      if (i !== si) return s
      return { ...s, items: s.items.map((it, j) => (j === ii ? { ...it, ...patch } : it)) }
    }))
  }
  const addItem = (si) => {
    setSections((prev) => prev.map((s, i) => (i === si ? { ...s, items: [...s.items, emptyIngredient()] } : s)))
  }
  const removeItem = (si, ii) => {
    setSections((prev) => prev.map((s, i) => {
      if (i !== si) return s
      const items = s.items.filter((_, j) => j !== ii)
      return { ...s, items: items.length ? items : [emptyIngredient()] }
    }))
  }
  const moveItem = (si, ii, dir) => {
    setSections((prev) => prev.map((s, i) => {
      if (i !== si) return s
      const items = [...s.items]
      const target = ii + dir
      if (target < 0 || target >= items.length) return s
      ;[items[ii], items[target]] = [items[target], items[ii]]
      return { ...s, items }
    }))
  }
  const setIngredientName = (si, ii, name) => {
    const match = ingredients.find((i) => i.name.toLowerCase() === name.toLowerCase())
    updateItem(si, ii, match ? { name: match.name, ingredientId: match.id } : { name, ingredientId: null })
  }

  // ---- Step handlers ----
  const updateStep = (idx, patch) => setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)))
  const addStep = () => setSteps((prev) => [...prev, { instruction: '', timerMinutes: '' }])
  const removeStep = (idx) => {
    setSteps((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      return next.length ? next : [{ instruction: '', timerMinutes: '' }]
    })
  }
  const moveStep = (idx, dir) => {
    setSteps((prev) => {
      const next = [...prev]
      const target = idx + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }

  const toggleDietary = (id) =>
    setDietaryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const toggleCategory = (id) =>
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const handleSubmit = (e) => {
    e.preventDefault()

    const cuisineName = cuisines.find((c) => c.id === cuisineId)?.name || ''
    const mealTypeName = mealTypes.find((m) => m.id === mealTypeId)?.name || ''

    const cleanSections = sections
      .map((s) => ({
        name: s.name.trim() || 'Main',
        items: s.items
          .filter((it) => it.name || it.quantity)
          .map((it) => ({
            ingredientId: it.ingredientId || null,
            name: it.name,
            quantity: it.quantity,
            unit: it.unit,
            notes: it.notes || '',
            optional: Boolean(it.optional),
          })),
      }))
      .filter((s) => s.items.length > 0)

    const cleanSteps = steps
      .map((s) => ({ instruction: s.instruction, timerMinutes: Number(s.timerMinutes) || 0 }))
      .filter((s) => s.instruction.trim() !== '')

    const recipeObj = {
      id: recipe?.id || newId('USER'),
      seed: false,
      title: title.trim() || 'Untitled recipe',
      shortDescription,
      sourceName: '',
      sourceUrl,
      servings: Number(servings) || 1,
      prepTimeMinutes: Number(prepTime) || 0,
      cookTimeMinutes: Number(cookTime) || 0,
      totalTimeMinutes: totalTime,
      cuisineId,
      cuisineName,
      mealTypeId,
      mealTypeName,
      dietaryTagIds: dietaryIds,
      categoryIds,
      difficulty: 1,
      spiceLevel: Number(spiceLevel) || 0,
      accentColor,
      coverImageUrl: coverUrl || '',
      includeInMealSuggestions: includeInSuggestions,
      sections: cleanSections,
      steps: cleanSteps,
      options: {
        includeInShoppingList: optIncludeShopping,
        showNutrition: optShowNutrition,
        allowSubstitutions: optAllowSubs,
        measurementSystem: measurement,
      },
    }

    if (editing) {
      app.updateRecipe(recipeObj)
    } else {
      app.addRecipe(recipeObj)
    }

    if (addToPlanNow && planDay) {
      const wk = weekKeyForDate(new Date(planWeek + 'T00:00:00'))
      app.setMealSlot(wk, planDay, planMeal, recipeObj.id)
    }

    onSaved()
  }

  return (
    <section className="recipe-form" style={{ '--accent': accentColor }}>
      <button className="back" onClick={onCancel}>← Cancel</button>
      <h1>{editing ? 'Edit Recipe' : 'Add Recipe'}</h1>

      <form onSubmit={handleSubmit}>
        {/* Recipe details */}
        <fieldset className="panel form-section">
          <legend>Recipe details</legend>
          <div className="form-grid">
            <label>Recipe title<input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Honey Garlic Salmon" /></label>
            <label>Source link<input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." /></label>
            <label>Cuisine
              <select value={cuisineId} onChange={(e) => setCuisineId(e.target.value)}>
                <option value="">Select cuisine...</option>
                {cuisines.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label>Primary meal type
              <select value={mealTypeId} onChange={(e) => setMealTypeId(e.target.value)}>
                <option value="">Select meal type...</option>
                {mealTypes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </label>
          </div>

          <label className="short-desc">Short description
            <textarea value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} rows={2} placeholder="A short summary shown on the recipe card" />
          </label>

          <div className="opt-block">
            <span className="opt-label">Dietary suitability</span>
            <div className="chips-wrap">
              {dietaryTags.map((d) => (
                <button type="button" key={d.id} className={'chip toggle' + (dietaryIds.includes(d.id) ? ' on' : '')} onClick={() => toggleDietary(d.id)}>{d.name}</button>
              ))}
            </div>
          </div>
          <div className="opt-block">
            <span className="opt-label">Recipe categories</span>
            <div className="chips-wrap">
              {categories.map((c) => (
                <button type="button" key={c.id} className={'chip toggle' + (categoryIds.includes(c.id) ? ' on' : '')} onClick={() => toggleCategory(c.id)}>{c.name}</button>
              ))}
            </div>
          </div>
        </fieldset>

        {/* Timing and yield */}
        <fieldset className="panel form-section">
          <legend>Timing and yield</legend>
          <div className="form-grid cols-4">
            <label>Servings
              <div className="stepper">
                <button type="button" onClick={() => setServings((s) => Math.max(1, s - 1))}>−</button>
                <input type="number" min="1" value={servings} onChange={(e) => setServings(Number(e.target.value) || 1)} />
                <button type="button" onClick={() => setServings((s) => s + 1)}>+</button>
              </div>
            </label>
            <label>Prep time (min)<input type="number" min="0" value={prepTime} onChange={(e) => setPrepTime(Number(e.target.value) || 0)} /></label>
            <label>Cook time (min)<input type="number" min="0" value={cookTime} onChange={(e) => setCookTime(Number(e.target.value) || 0)} /></label>
            <label>Total time (min)<input type="number" value={totalTime} readOnly /></label>
          </div>
          <div className="opt-block">
            <span className="opt-label">Spice level</span>
            <div className="spice-control">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} className={'spice-dot' + (n <= spiceLevel ? ' lit' : '')} onClick={() => setSpiceLevel(n)} title={n} />
              ))}
              <span className="muted">{['Mild', 'Mild-Medium', 'Medium', 'Medium-Hot', 'Hot', 'Very Spicy'][spiceLevel]}</span>
            </div>
          </div>
        </fieldset>

        {/* Image and appearance */}
        <fieldset className="panel form-section">
          <legend>Image and appearance</legend>
          <div className="appearance-row">
            <div className="cover-preview">
              <img src={coverUrl || APPROVED_IMAGES.placeholder} alt="cover" />
            </div>
            <div className="appearance-fields">
              <label>Cover image URL
                <input type="url" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://... (remote image URL)" />
              </label>
              <label>Card accent color
                <div className="color-row">
                  <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
                  <span className="muted">{accentColor}</span>
                </div>
              </label>
            </div>
          </div>
        </fieldset>

        {/* Ingredients */}
        <fieldset className="panel form-section">
          <legend>Ingredients</legend>
          {sections.map((section, si) => (
            <div className="ingredient-section-edit" key={si}>
              <div className="section-head">
                <input className="section-name" value={section.name} onChange={(e) => setSectionName(si, e.target.value)} placeholder="Section name" />
                <div className="section-actions">
                  <button type="button" onClick={() => moveSection(si, -1)} disabled={si === 0}>↑</button>
                  <button type="button" onClick={() => moveSection(si, 1)} disabled={si === sections.length - 1}>↓</button>
                  <button type="button" className="danger" onClick={() => removeSection(si)}>Remove section</button>
                </div>
              </div>
              {section.items.map((item, ii) => (
                <div className="ingredient-row" key={ii}>
                  <input
                    className="ing-name"
                    list="ingredient-list"
                    value={item.name}
                    onChange={(e) => setIngredientName(si, ii, e.target.value)}
                    placeholder="Search ingredient..."
                  />
                  <input className="ing-qty" type="text" value={item.quantity} onChange={(e) => updateItem(si, ii, { quantity: e.target.value })} placeholder="Qty" />
                  <select className="ing-unit" value={item.unit} onChange={(e) => updateItem(si, ii, { unit: e.target.value })}>
                    <option value="">unit</option>
                    {units.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
                  </select>
                  <input className="ing-notes" type="text" value={item.notes} onChange={(e) => updateItem(si, ii, { notes: e.target.value })} placeholder="notes" />
                  <label className="ing-opt"><input type="checkbox" checked={item.optional} onChange={(e) => updateItem(si, ii, { optional: e.target.checked })} /> optional</label>
                  <div className="row-actions">
                    <button type="button" onClick={() => moveItem(si, ii, -1)} disabled={ii === 0}>↑</button>
                    <button type="button" onClick={() => moveItem(si, ii, 1)} disabled={ii === section.items.length - 1}>↓</button>
                    <button type="button" className="danger" onClick={() => removeItem(si, ii)}>✕</button>
                  </div>
                </div>
              ))}
              <button type="button" className="btn small" onClick={() => addItem(si)}>+ Add ingredient</button>
            </div>
          ))}
          <datalist id="ingredient-list">
            {ingredientOptions.map((n) => <option key={n} value={n} />)}
          </datalist>
          <button type="button" className="btn" onClick={addSection}>+ Add ingredient section</button>
        </fieldset>

        {/* Method */}
        <fieldset className="panel form-section">
          <legend>Method</legend>
          {steps.map((step, idx) => (
            <div className="step-row" key={idx}>
              <span className="step-num">{idx + 1}</span>
              <textarea className="step-text" value={step.instruction} onChange={(e) => updateStep(idx, { instruction: e.target.value })} placeholder="Instruction..." rows={2} />
              <input className="step-timer" type="number" min="0" value={step.timerMinutes} onChange={(e) => updateStep(idx, { timerMinutes: e.target.value })} placeholder="min" />
              <div className="row-actions">
                <button type="button" onClick={() => moveStep(idx, -1)} disabled={idx === 0}>↑</button>
                <button type="button" onClick={() => moveStep(idx, 1)} disabled={idx === steps.length - 1}>↓</button>
                <button type="button" className="danger" onClick={() => removeStep(idx)}>✕</button>
              </div>
            </div>
          ))}
          <button type="button" className="btn" onClick={addStep}>+ Add step</button>
        </fieldset>

        {/* Meal-planning options */}
        <fieldset className="panel form-section">
          <legend>Meal-planning options</legend>
          <label className="check-row"><input type="checkbox" checked={includeInSuggestions} onChange={(e) => setIncludeInSuggestions(e.target.checked)} /> Make available in meal-plan suggestions</label>
          <label className="check-row"><input type="checkbox" checked={addToPlanNow} onChange={(e) => setAddToPlanNow(e.target.checked)} /> Add to meal plan immediately</label>
          {addToPlanNow && (
            <div className="form-grid cols-3">
              <label>Planning week<input type="date" value={planWeek} onChange={(e) => setPlanWeek(e.target.value)} /></label>
              <label>Planned day
                <select value={planDay} onChange={(e) => setPlanDay(e.target.value)}>
                  <option value="">Choose day...</option>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
              <label>Planned meal
                <select value={planMeal} onChange={(e) => setPlanMeal(e.target.value)}>
                  {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
            </div>
          )}
        </fieldset>

        {/* Recipe options menu */}
        <fieldset className="panel form-section">
          <legend>Recipe options</legend>
          <div className="options-menu">
            <label className={'option-toggle' + (optIncludeShopping ? ' on' : '')}>
              <input type="checkbox" checked={optIncludeShopping} onChange={(e) => setOptIncludeShopping(e.target.checked)} />
              Include in shopping lists
            </label>
            <label className={'option-toggle' + (optShowNutrition ? ' on' : '')}>
              <input type="checkbox" checked={optShowNutrition} onChange={(e) => setOptShowNutrition(e.target.checked)} />
              Show nutrition information
            </label>
            <label className={'option-toggle' + (optAllowSubs ? ' on' : '')}>
              <input type="checkbox" checked={optAllowSubs} onChange={(e) => setOptAllowSubs(e.target.checked)} />
              Allow ingredient substitutions
            </label>
          </div>
          <div className="opt-block">
            <span className="opt-label">Measurements</span>
            <div className="segmented">
              <button type="button" className={measurement === 'US' ? 'on' : ''} onClick={() => setMeasurement('US')}>US customary</button>
              <button type="button" className={measurement === 'Metric' ? 'on' : ''} onClick={() => setMeasurement('Metric')}>Metric</button>
            </div>
          </div>
        </fieldset>

        <div className="form-actions">
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn primary">{editing ? 'Save changes' : 'Add recipe'}</button>
        </div>
      </form>
    </section>
  )
}