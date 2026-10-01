import { useState } from 'react'
import { fileToDataUrl } from './utils.js'

const SPICE_LEVELS = ['Mild', 'Very mild', 'Medium', 'Spicy', 'Hot', 'Very spicy']

let uid = 0
const nextId = (p) => `${p}${Date.now().toString(36)}${(uid++).toString(36)}`

function emptyIngredient() {
  return { id: nextId('i'), ingredientId: '', name: '', quantity: '', unit: '', notes: '', optional: false }
}
function emptySection() {
  return { id: nextId('s'), name: '', ingredients: [emptyIngredient()] }
}
function emptyStep() {
  return { id: nextId('st'), instruction: '', timerMinutes: '' }
}

const A_ID = 'available'

export default function RecipeForm({ lookup, recipe, onSave, onCancel, defaults }) {
  const editing = !!recipe
  const [form, setForm] = useState(() => {
    if (recipe) {
      return {
        title: recipe.title || '',
        sourceUrl: recipe.sourceUrl || '',
        cuisine: recipe.cuisine || '',
        mealType: recipe.mealType || '',
        dietaryTags: [...(recipe.dietaryTags || [])],
        categories: [...(recipe.categories || [])],
        servings: recipe.servings || 1,
        prepTimeMinutes: recipe.prepTimeMinutes || 0,
        cookTimeMinutes: recipe.cookTimeMinutes || 0,
        spiceLevel: recipe.spiceLevel || 0,
        accentColor: recipe.accentColor || '#D97757',
        coverPreview: recipe.coverImageUrl || '',
        coverIsDataUrl: false,
        sections: recipe.sections && recipe.sections.length ? JSON.parse(JSON.stringify(recipe.sections)) : [emptySection()],
        steps: recipe.steps && recipe.steps.length ? JSON.parse(JSON.stringify(recipe.steps)) : [emptyStep()],
        includeInMealSuggestions: !!recipe.includeInMealSuggestions,
        addToMealPlan: false,
        mealPlanWeek: defaults.weekKey || '',
        plannedDate: defaults.plannedDate || '',
        plannedMealType: '',
        plannedServingTime: '',
        plannedDateTime: '',
        includeInShoppingList: recipe.includeInShoppingList !== false,
        showNutrition: !!recipe.showNutrition,
        allowSubstitutions: !!recipe.allowSubstitutions,
        measurementSystem: recipe.measurementSystem || 'us',
      }
    }
    return {
      title: '', sourceUrl: '', cuisine: '', mealType: '', dietaryTags: [], categories: [],
      servings: 4, prepTimeMinutes: 0, cookTimeMinutes: 0, spiceLevel: 0, accentColor: '#D97757',
      coverPreview: '', coverIsDataUrl: false, sections: [emptySection()], steps: [emptyStep()],
      includeInMealSuggestions: true, addToMealPlan: false, mealPlanWeek: defaults.weekKey || '',
      plannedDate: defaults.plannedDate || '', plannedMealType: '', plannedServingTime: '', plannedDateTime: '',
      includeInShoppingList: true, showNutrition: false, allowSubstitutions: false, measurementSystem: 'us',
    }
  })

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))
  const totalTime = (Number(form.prepTimeMinutes) || 0) + (Number(form.cookTimeMinutes) || 0)

  function toggleMulti(key, value) {
    setForm((f) => {
      const arr = f[key]
      return { ...f, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] }
    })
  }

  async function handleCover(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    setForm((f) => ({ ...f, coverPreview: dataUrl, coverIsDataUrl: true }))
  }

  function setSectionField(sectionId, field, value) {
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s) => (s.id === sectionId ? { ...s, [field]: value } : s)),
    }))
  }
  function setIngredientField(sectionId, ingId, field, value) {
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s) =>
        s.id === sectionId
          ? { ...s, ingredients: s.ingredients.map((ig) => (ig.id === ingId ? { ...ig, [field]: value } : ig)) }
          : s
      ),
    }))
  }
  function setStepField(stepId, field, value) {
    setForm((f) => ({ ...f, steps: f.steps.map((st) => (st.id === stepId ? { ...st, [field]: value } : st)) }))
  }

  function addIngredient(sectionId) {
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s) => (s.id === sectionId ? { ...s, ingredients: [...s.ingredients, emptyIngredient()] } : s)),
    }))
  }
  function removeIngredient(sectionId, ingId) {
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s) =>
        s.id === sectionId ? { ...s, ingredients: s.ingredients.filter((ig) => ig.id !== ingId) } : s
      ),
    }))
  }
  function moveIngredient(sectionId, index, dir) {
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s) => {
        if (s.id !== sectionId) return s
        const arr = [...s.ingredients]
        const j = index + dir
        if (j < 0 || j >= arr.length) return s
        ;[arr[index], arr[j]] = [arr[j], arr[index]]
        return { ...s, ingredients: arr }
      }),
    }))
  }
  function addSection() {
    setForm((f) => ({ ...f, sections: [...f.sections, emptySection()] }))
  }
  function removeSection(sectionId) {
    setForm((f) => ({ ...f, sections: f.sections.filter((s) => s.id !== sectionId) }))
  }
  function moveSection(index, dir) {
    setForm((f) => {
      const arr = [...f.sections]
      const j = index + dir
      if (j < 0 || j >= arr.length) return f
      ;[arr[index], arr[j]] = [arr[j], arr[index]]
      return { ...f, sections: arr }
    })
  }
  function addStep() {
    setForm((f) => ({ ...f, steps: [...f.steps, emptyStep()] }))
  }
  function removeStep(stepId) {
    setForm((f) => ({ ...f, steps: f.steps.filter((st) => st.id !== stepId) }))
  }
  function moveStep(index, dir) {
    setForm((f) => {
      const arr = [...f.steps]
      const j = index + dir
      if (j < 0 || j >= arr.length) return f
      ;[arr[index], arr[j]] = [arr[j], arr[index]]
      return { ...f, steps: arr }
    })
  }

  function onSelectIngredient(sectionId, ingId, value) {
    const ing = lookup.ingredients.find((i) => i.ingredient_name.toLowerCase() === value.toLowerCase().trim())
    setIngredientField(sectionId, ingId, 'name', value)
    if (ing) {
      setIngredientField(sectionId, ingId, 'ingredientId', ing.ingredient_id)
      setIngredientField(sectionId, ingId, 'shoppingCategory', ing.shopping_category || 'Other')
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const total = totalTime
    const payload = {
      ...form,
      totalTimeMinutes: total,
      coverImageUrl: form.coverIsDataUrl ? form.coverPreview : form.coverPreview,
    }
    onSave(payload)
  }

  return (
    <form className="recipe-form" onSubmit={handleSubmit}>
      <header className="form-header">
        <h2>{editing ? 'Edit Recipe' : 'New Recipe'}</h2>
        <div className="form-actions">
          <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn primary">Save Recipe</button>
        </div>
      </header>

      <section className="form-section">
        <h3>Recipe details</h3>
        <div className="grid-2">
          <label className="field span-2">
            <span>Recipe title</span>
            <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="e.g. Honey Garlic Salmon Bowls" />
          </label>
          <label className="field span-2">
            <span>Source link</span>
            <input type="url" value={form.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} placeholder="https://..." />
          </label>
          <label className="field">
            <span>Cuisine</span>
            <select value={form.cuisine} onChange={(e) => set('cuisine', e.target.value)}>
              <option value="">Select cuisine</option>
              {lookup.cuisines.map((c) => <option key={c.cuisine_id} value={c.cuisine_name}>{c.cuisine_name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Primary meal type</span>
            <select value={form.mealType} onChange={(e) => set('mealType', e.target.value)}>
              <option value="">Select meal type</option>
              {lookup.mealTypes.map((m) => <option key={m.meal_type_id} value={m.meal_type_name}>{m.meal_type_name}</option>)}
            </select>
          </label>
        </div>
        <div className="field">
          <span>Dietary suitability</span>
          <div className="chip-group">
            {lookup.dietaryTags.map((d) => (
              <button key={d.dietary_tag_id} type="button" className={'chip' + (form.dietaryTags.includes(d.dietary_tag_name) ? ' active' : '')}
                onClick={() => toggleMulti('dietaryTags', d.dietary_tag_name)}>{d.dietary_tag_name}</button>
            ))}
          </div>
        </div>
        <div className="field">
          <span>Recipe categories</span>
          <div className="chip-group">
            {lookup.recipeCategories.map((c) => (
              <button key={c.category_id} type="button" className={'chip' + (form.categories.includes(c.category_name) ? ' active' : '')}
                onClick={() => toggleMulti('categories', c.category_name)}>{c.category_name}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="form-section">
        <h3>Timing and yield</h3>
        <div className="grid-4">
          <label className="field">
            <span>Servings</span>
            <input type="number" min="1" value={form.servings} onChange={(e) => set('servings', Number(e.target.value))} />
          </label>
          <label className="field">
            <span>Prep time (min)</span>
            <input type="number" min="0" value={form.prepTimeMinutes} onChange={(e) => set('prepTimeMinutes', Number(e.target.value))} />
          </label>
          <label className="field">
            <span>Cook time (min)</span>
            <input type="number" min="0" value={form.cookTimeMinutes} onChange={(e) => set('cookTimeMinutes', Number(e.target.value))} />
          </label>
          <label className="field">
            <span>Total time (auto)</span>
            <input type="text" value={`${totalTime} min`} readOnly />
          </label>
        </div>
        <div className="field">
          <span>Spice level — {SPICE_LEVELS[form.spiceLevel] || 'Mild'}</span>
          <input type="range" min="0" max="5" step="1" value={form.spiceLevel} onChange={(e) => set('spiceLevel', Number(e.target.value))} />
          <div className="spice-scale"><span>Mild</span><span>Very spicy</span></div>
        </div>
      </section>

      <section className="form-section">
        <h3>Image and appearance</h3>
        <div className="appearance-row">
          <div className="cover-upload">
            {form.coverPreview ? (
              <img src={form.coverPreview} alt="cover preview" className="cover-preview" />
            ) : (
              <div className="cover-placeholder">No cover image</div>
            )}
            <input type="file" accept="image/*" onChange={handleCover} id="cover-file" />
            <label htmlFor="cover-file" className="btn ghost">Upload cover image</label>
          </div>
          <label className="field">
            <span>Card accent color</span>
            <div className="color-row">
              <input type="color" value={form.accentColor} onChange={(e) => set('accentColor', e.target.value)} />
              {['#D97757', '#8A9A5B', '#4A7BA6', '#9B6FB0', '#C04A4A', '#4A9B8A'].map((c) => (
                <button key={c} type="button" className="color-swatch" style={{ background: c }}
                  onClick={() => set('accentColor', c)} />
              ))}
            </div>
          </label>
        </div>
      </section>

      <section className="form-section">
        <h3>Ingredients</h3>
        {form.sections.map((section, sIdx) => (
          <div className="ingredient-section" key={section.id}>
            <div className="ingredient-section-head">
              <input className="section-name" placeholder="Section name (e.g. Main, Sauce)" value={section.name}
                onChange={(e) => setSectionField(section.id, 'name', e.target.value)} />
              <div className="section-controls">
                <button type="button" className="icon-btn" title="Move section up" disabled={sIdx === 0} onClick={() => moveSection(sIdx, -1)}>↑</button>
                <button type="button" className="icon-btn" title="Move section down" disabled={sIdx === form.sections.length - 1} onClick={() => moveSection(sIdx, 1)}>↓</button>
                <button type="button" className="icon-btn danger" title="Remove section" onClick={() => removeSection(section.id)}>✕</button>
              </div>
            </div>
            <div className="ingredient-head">
              <span className="i-name">Ingredient</span>
              <span className="i-qty">Qty</span>
              <span className="i-unit">Unit</span>
              <span className="i-optional">Opt.</span>
              <span></span>
            </div>
            {section.ingredients.map((ing, iIdx) => (
              <div className="ingredient-row" key={ing.id}>
                <div className="i-name">
                  <input type="text" list={A_ID + '-' + section.id} placeholder="Search ingredient" value={ing.name}
                    onChange={(e) => onSelectIngredient(section.id, ing.id, e.target.value)} />
                  <datalist id={A_ID + '-' + section.id}>
                    {lookup.ingredients.map((ig) => <option key={ig.ingredient_id} value={ig.ingredient_name} />)}
                  </datalist>
                </div>
                <div className="i-qty">
                  <input type="text" placeholder="0" value={ing.quantity} onChange={(e) => setIngredientField(section.id, ing.id, 'quantity', e.target.value)} />
                </div>
                <div className="i-unit">
                  <select value={ing.unit} onChange={(e) => setIngredientField(section.id, ing.id, 'unit', e.target.value)}>
                    <option value=""></option>
                    {lookup.units.map((u) => <option key={u.unit_id} value={u.unit_name}>{u.unit_name}</option>)}
                  </select>
                </div>
                <div className="i-optional">
                  <input type="checkbox" checked={ing.optional} onChange={(e) => setIngredientField(section.id, ing.id, 'optional', e.target.checked)} />
                </div>
                <div className="i-controls">
                  <button type="button" className="icon-btn" title="Move up" disabled={iIdx === 0} onClick={() => moveIngredient(section.id, iIdx, -1)}>↑</button>
                  <button type="button" className="icon-btn" title="Move down" disabled={iIdx === section.ingredients.length - 1} onClick={() => moveIngredient(section.id, iIdx, 1)}>↓</button>
                  <button type="button" className="icon-btn danger" title="Remove" onClick={() => removeIngredient(section.id, ing.id)}>✕</button>
                </div>
              </div>
            ))}
            <button type="button" className="btn ghost small" onClick={() => addIngredient(section.id)}>+ Add ingredient</button>
          </div>
        ))}
        <button type="button" className="btn ghost" onClick={addSection}>+ Add ingredient section</button>
      </section>

      <section className="form-section">
        <h3>Method</h3>
        {form.steps.map((step, sIdx) => (
          <div className="step-row" key={step.id}>
            <span className="step-num">{sIdx + 1}</span>
            <textarea className="step-instruction" placeholder="Instruction text" value={step.instruction}
              onChange={(e) => setStepField(step.id, 'instruction', e.target.value)} />
            <div className="step-timer">
              <input type="number" min="0" placeholder="min" value={step.timerMinutes}
                onChange={(e) => setStepField(step.id, 'timerMinutes', e.target.value)} />
              <span>min</span>
            </div>
            <div className="step-controls">
              <button type="button" className="icon-btn" title="Move up" disabled={sIdx === 0} onClick={() => moveStep(sIdx, -1)}>↑</button>
              <button type="button" className="icon-btn" title="Move down" disabled={sIdx === form.steps.length - 1} onClick={() => moveStep(sIdx, 1)}>↓</button>
              <button type="button" className="icon-btn danger" title="Remove" onClick={() => removeStep(step.id)}>✕</button>
            </div>
          </div>
        ))}
        <button type="button" className="btn ghost small" onClick={addStep}>+ Add step</button>
      </section>

      <section className="form-section">
        <h3>Meal planning options</h3>
        <label className="check-field">
          <input type="checkbox" checked={form.includeInMealSuggestions} onChange={(e) => set('includeInMealSuggestions', e.target.checked)} />
          <span>Make this recipe available in meal-plan suggestions</span>
        </label>
        <label className="check-field">
          <input type="checkbox" checked={form.addToMealPlan} onChange={(e) => set('addToMealPlan', e.target.checked)} />
          <span>Add this recipe to the meal plan</span>
        </label>
        {form.addToMealPlan && (
          <div className="grid-2 mealplan-options">
            <label className="field">
              <span>Meal-planning week</span>
              <input type="week" value={form.mealPlanWeek} onChange={(e) => set('mealPlanWeek', e.target.value)} />
            </label>
            <label className="field">
              <span>Planned meal type</span>
              <select value={form.plannedMealType} onChange={(e) => set('plannedMealType', e.target.value)}>
                <option value="">Select</option>
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snack">Snack</option>
              </select>
            </label>
            <label className="field">
              <span>Planned cooking date</span>
              <input type="date" value={form.plannedDate} onChange={(e) => set('plannedDate', e.target.value)} />
            </label>
            <label className="field">
              <span>Planned serving time</span>
              <input type="time" value={form.plannedServingTime} onChange={(e) => set('plannedServingTime', e.target.value)} />
            </label>
            <label className="field span-2">
              <span>Specific date &amp; time</span>
              <input type="datetime-local" value={form.plannedDateTime} onChange={(e) => set('plannedDateTime', e.target.value)} />
            </label>
          </div>
        )}
      </section>

      <section className="form-section">
        <h3>Recipe options menu</h3>
        <div className="options-menu">
          <label className="check-field">
            <input type="checkbox" checked={form.includeInShoppingList} onChange={(e) => set('includeInShoppingList', e.target.checked)} />
            <span>Include ingredients in generated shopping lists</span>
          </label>
          <label className="check-field">
            <input type="checkbox" checked={form.showNutrition} onChange={(e) => set('showNutrition', e.target.checked)} />
            <span>Show nutrition information</span>
          </label>
          <label className="check-field">
            <input type="checkbox" checked={form.allowSubstitutions} onChange={(e) => set('allowSubstitutions', e.target.checked)} />
            <span>Allow ingredient substitutions</span>
          </label>
          <div className="measurement">
            <span>Measurements</span>
            <div className="measurement-options">
              <button type="button" className={'seg' + (form.measurementSystem === 'us' ? ' active' : '')} onClick={() => set('measurementSystem', 'us')}>US customary</button>
              <button type="button" className={'seg' + (form.measurementSystem === 'metric' ? ' active' : '')} onClick={() => set('measurementSystem', 'metric')}>Metric</button>
            </div>
          </div>
        </div>
      </section>
    </form>
  )
}