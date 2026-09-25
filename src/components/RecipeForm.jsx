import { useMemo, useState } from 'react'
import { PLACEHOLDER_IMAGE, DAYS, uid, todayMonday } from '../lib/utils.js'

const EMPTY_INGREDIENT = () => ({ key: uid('ing'), ingredientId: '', name: '', quantity: '', unit: '', notes: '', optional: false })
const EMPTY_STEP = () => ({ key: uid('step'), instruction: '', timer: '' })
const EMPTY_SECTION = () => ({ key: uid('sec'), name: '', ingredients: [EMPTY_INGREDIENT()] })

function buildSections(sections) {
  return (sections || []).map((s) => ({
    key: uid('sec'),
    name: s.name || '',
    ingredients: (s.ingredients || []).map((ing) => ({
      key: uid('ing'),
      ingredientId: ing.ingredientId || '',
      name: ing.name || '',
      quantity: ing.quantity ?? '',
      unit: ing.unit || '',
      notes: ing.notes || '',
      optional: !!ing.optional,
    })),
  }))
}

function buildSteps(steps) {
  return (steps || []).map((s) => ({ key: uid('step'), instruction: s.instruction || '', timer: s.timer ?? '' }))
}

export default function RecipeForm({ lookup, recipe, onCancel, onSave }) {
  const initial = useMemo(() => {
    if (recipe) {
      return {
        title: recipe.title || '',
        sourceUrl: recipe.sourceUrl || '',
        cuisineId: recipe.cuisineId || '',
        mealTypeId: recipe.mealTypeId || '',
        dietaryTagIds: recipe.dietaryTagIds || [],
        categoryIds: recipe.categoryIds || [],
        servings: recipe.servings || 4,
        prepTime: recipe.prepTime || '',
        cookTime: recipe.cookTime || '',
        spiceLevel: recipe.spiceLevel ?? 0,
        accentColor: recipe.accentColor || '#D97757',
        coverImageUrl: recipe.coverImageUrl || '',
        shortDescription: recipe.shortDescription || '',
        sections: buildSections(recipe.sections),
        steps: buildSteps(recipe.steps),
        includeInMealSuggestions: recipe.includeInMealSuggestions !== false,
        addToPlan: false,
        planWeekMonday: todayMonday(),
        planDayIndex: 0,
        planServingTime: '18:00',
        planSpecificDate: false,
        planDate: '',
        includeInShoppingList: true,
        showNutrition: true,
        allowSubstitutions: false,
        measurementSystem: 'us',
      }
    }
    return {
      title: '',
      sourceUrl: '',
      cuisineId: '',
      mealTypeId: '',
      dietaryTagIds: [],
      categoryIds: [],
      servings: 4,
      prepTime: '',
      cookTime: '',
      spiceLevel: 0,
      accentColor: '#D97757',
      coverImageUrl: '',
      shortDescription: '',
      sections: [EMPTY_SECTION()],
      steps: [EMPTY_STEP()],
      includeInMealSuggestions: true,
      addToPlan: false,
      planWeekMonday: todayMonday(),
      planDayIndex: 0,
      planServingTime: '18:00',
      planSpecificDate: false,
      planDate: '',
      includeInShoppingList: true,
      showNutrition: true,
      allowSubstitutions: false,
      measurementSystem: 'us',
    }
  }, [recipe])

  const [form, setForm] = useState(initial)
  const [ingredientQuery, setIngredientQuery] = useState('')

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function toggleInList(key, value) {
    setForm((f) => {
      const list = f[key] || []
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
      return { ...f, [key]: next }
    })
  }

  const totalTime = useMemo(() => {
    const p = Number(form.prepTime) || 0
    const c = Number(form.cookTime) || 0
    return p + c
  }, [form.prepTime, form.cookTime])

  const ingredientsFlat = lookup.ingredients
  const filteredIngredients = useMemo(() => {
    if (!ingredientQuery.trim()) return ingredientsFlat
    const q = ingredientQuery.trim().toLowerCase()
    return ingredientsFlat.filter((i) => i.name.toLowerCase().includes(q))
  }, [ingredientsFlat, ingredientQuery])

  const previewImage = form.coverImageUrl || PLACEHOLDER_IMAGE

  function updateSection(sectionKey, patch) {
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s) => (s.key === sectionKey ? { ...s, ...patch } : s)),
    }))
  }

  function updateIngredient(sectionKey, ingKey, patch) {
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s) =>
        s.key === sectionKey
          ? { ...s, ingredients: s.ingredients.map((i) => (i.key === ingKey ? { ...i, ...patch } : i)) }
          : s,
      ),
    }))
  }

  function addIngredient(sectionKey) {
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s) => (s.key === sectionKey ? { ...s, ingredients: [...s.ingredients, EMPTY_INGREDIENT()] } : s)),
    }))
  }

  function removeIngredient(sectionKey, ingKey) {
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s) =>
        s.key === sectionKey ? { ...s, ingredients: s.ingredients.filter((i) => i.key !== ingKey) } : s,
      ),
    }))
  }

  function moveIngredient(sectionKey, ingKey, dir) {
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s) => {
        if (s.key !== sectionKey) return s
        const idx = s.ingredients.findIndex((i) => i.key === ingKey)
        const target = idx + dir
        if (target < 0 || target >= s.ingredients.length) return s
        const arr = [...s.ingredients]
        const [item] = arr.splice(idx, 1)
        arr.splice(target, 0, item)
        return { ...s, ingredients: arr }
      }),
    }))
  }

  function addSection() {
    setForm((f) => ({ ...f, sections: [...f.sections, EMPTY_SECTION()] }))
  }

  function removeSection(sectionKey) {
    setForm((f) => ({ ...f, sections: f.sections.filter((s) => s.key !== sectionKey) }))
  }

  function moveSection(sectionKey, dir) {
    setForm((f) => {
      const idx = f.sections.findIndex((s) => s.key === sectionKey)
      const target = idx + dir
      if (target < 0 || target >= f.sections.length) return f
      const arr = [...f.sections]
      const [item] = arr.splice(idx, 1)
      arr.splice(target, 0, item)
      return { ...f, sections: arr }
    })
  }

  function updateStep(stepKey, patch) {
    setForm((f) => ({ ...f, steps: f.steps.map((s) => (s.key === stepKey ? { ...s, ...patch } : s)) }))
  }

  function addStep() {
    setForm((f) => ({ ...f, steps: [...f.steps, EMPTY_STEP()] }))
  }

  function removeStep(stepKey) {
    setForm((f) => ({ ...f, steps: f.steps.filter((s) => s.key !== stepKey) }))
  }

  function moveStep(stepKey, dir) {
    setForm((f) => {
      const idx = f.steps.findIndex((s) => s.key === stepKey)
      const target = idx + dir
      if (target < 0 || target >= f.steps.length) return f
      const arr = [...f.steps]
      const [item] = arr.splice(idx, 1)
      arr.splice(target, 0, item)
      return { ...f, steps: arr }
    })
  }

  function handleIngredientSelect(sectionKey, ingKey, ingredient) {
    updateIngredient(sectionKey, ingKey, {
      ingredientId: ingredient.id,
      name: ingredient.name,
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) {
      window.alert('Please enter a recipe title.')
      return
    }
    const cleanedSections = form.sections
      .map((s) => ({
        name: s.name.trim() || 'Ingredients',
        ingredients: s.ingredients
          .filter((i) => (i.name || '').trim() || i.ingredientId)
          .map((i) => ({
            ingredientId: i.ingredientId,
            name: i.name,
            quantity: Number(i.quantity) || 0,
            unit: i.unit,
            notes: i.notes,
            optional: !!i.optional,
          })),
      }))
      .filter((s) => s.ingredients.length > 0)

    const cleanedSteps = form.steps
      .filter((s) => (s.instruction || '').trim())
      .map((s) => ({ instruction: s.instruction.trim(), timer: Number(s.timer) || 0 }))

    const nextId = recipe ? recipe.id : uid('R')

    const saved = {
      id: nextId,
      title: form.title.trim(),
      shortDescription: form.shortDescription.trim(),
      sourceName: recipe?.sourceName || '',
      sourceUrl: form.sourceUrl.trim(),
      servings: Number(form.servings) || 1,
      prepTime: Number(form.prepTime) || 0,
      cookTime: Number(form.cookTime) || 0,
      totalTime: totalTime,
      cuisineId: form.cuisineId,
      mealTypeId: form.mealTypeId,
      dietaryTagIds: form.dietaryTagIds,
      categoryIds: form.categoryIds,
      difficulty: 1,
      spiceLevel: Number(form.spiceLevel) || 0,
      accentColor: form.accentColor,
      coverImageUrl: form.coverImageUrl.trim(),
      includeInMealSuggestions: form.includeInMealSuggestions,
      includeInShoppingList: form.includeInShoppingList,
      showNutrition: form.showNutrition,
      allowSubstitutions: form.allowSubstitutions,
      measurementSystem: form.measurementSystem,
      sections: cleanedSections,
      steps: cleanedSteps,
      _addToPlan: form.addToPlan,
      _planWeekMonday: form.planWeekMonday,
      _planDayIndex: form.planDayIndex,
    }
    onSave(saved)
  }

  const planSpecificDateVal = form.planSpecificDate && form.planDate ? form.planDate : form.planSpecificDate

  return (
    <section className="form-page">
      <div className="form-head">
        <button className="btn btn-ghost" onClick={onCancel}>
          ← Cancel
        </button>
        <h1>{recipe ? 'Edit Recipe' : 'New Recipe'}</h1>
        <div style={{ width: 80 }} />
      </div>

      <form onSubmit={handleSubmit}>
        {/* Recipe details */}
        <fieldset className="panel form-section">
          <legend>Recipe details</legend>
          <div className="form-grid">
            <label className="field field-full">
              <span>Recipe title</span>
              <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Honey Garlic Salmon Bowls" required />
            </label>
            <label className="field field-full">
              <span>Source link</span>
              <input type="url" value={form.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} placeholder="https://…" />
            </label>
            <label className="field field-full">
              <span>Short description</span>
              <input type="text" value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} placeholder="A brief summary shown on the card" />
            </label>
            <label className="field">
              <span>Cuisine</span>
              <select value={form.cuisineId} onChange={(e) => set('cuisineId', e.target.value)}>
                <option value="">Select cuisine</option>
                {lookup.cuisines.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Primary meal type</span>
              <select value={form.mealTypeId} onChange={(e) => set('mealTypeId', e.target.value)}>
                <option value="">Select meal type</option>
                {lookup.mealTypes.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="checkbox-group">
            <span className="group-label">Dietary suitability</span>
            <div className="chips-select">
              {lookup.dietaryTags.map((d) => (
                <ToggleChip key={d.id} active={form.dietaryTagIds.includes(d.id)} onClick={() => toggleInList('dietaryTagIds', d.id)}>
                  {d.name}
                </ToggleChip>
              ))}
            </div>
          </div>

          <div className="checkbox-group">
            <span className="group-label">Recipe categories</span>
            <div className="chips-select">
              {lookup.categories.map((c) => (
                <ToggleChip key={c.id} active={form.categoryIds.includes(c.id)} onClick={() => toggleInList('categoryIds', c.id)}>
                  {c.name}
                </ToggleChip>
              ))}
            </div>
          </div>
        </fieldset>

        {/* Timing and yield */}
        <fieldset className="panel form-section">
          <legend>Timing & yield</legend>
          <div className="form-grid">
            <label className="field">
              <span>Servings</span>
              <NumberStepper value={form.servings} onChange={(v) => set('servings', v)} min={1} />
            </label>
            <label className="field">
              <span>Prep time (minutes)</span>
              <input type="number" min="0" value={form.prepTime} onChange={(e) => set('prepTime', e.target.value)} placeholder="0" />
            </label>
            <label className="field">
              <span>Cook time (minutes)</span>
              <input type="number" min="0" value={form.cookTime} onChange={(e) => set('cookTime', e.target.value)} placeholder="0" />
            </label>
            <label className="field">
              <span>Total time</span>
              <input type="text" value={totalTime ? `${totalTime} min` : ''} readOnly className="readonly" />
            </label>
          </div>

          <div className="spice-control">
            <span className="group-label">Spice level</span>
            <div className="spice-row">
              <input
                type="range"
                min="0"
                max="5"
                value={form.spiceLevel}
                onChange={(e) => set('spiceLevel', Number(e.target.value))}
              />
              <span className="spice-value">{spiceLabel(form.spiceLevel)}</span>
            </div>
            <div className="spice-scale">
              <span>Mild</span>
              <span>Very spicy</span>
            </div>
          </div>
        </fieldset>

        {/* Image and appearance */}
        <fieldset className="panel form-section">
          <legend>Image & appearance</legend>
          <div className="form-grid">
            <label className="field field-full">
              <span>Cover image URL</span>
              <input type="url" value={form.coverImageUrl} onChange={(e) => set('coverImageUrl', e.target.value)} placeholder="https://… (leave blank for placeholder)" />
            </label>
            <div className="preview-wrap">
              <img className="cover-preview" src={previewImage} alt="Cover preview" onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMAGE)} />
              {!form.coverImageUrl && <span className="preview-note">Placeholder image</span>}
            </div>
            <label className="field">
              <span>Card accent color</span>
              <div className="color-row">
                <input type="color" value={form.accentColor} onChange={(e) => set('accentColor', e.target.value)} />
                <ColorSwatches value={form.accentColor} onChange={(v) => set('accentColor', v)} />
              </div>
            </label>
          </div>
        </fieldset>

        {/* Ingredients */}
        <fieldset className="panel form-section">
          <legend>Ingredients</legend>
          <p className="hint">Group ingredients into sections (Main, Sauce, Garnish…) and search to select from the ingredient list.</p>

          <div className="search-wrap ingredient-search">
            <input
              type="search"
              placeholder="Search ingredients to add…"
              value={ingredientQuery}
              onChange={(e) => setIngredientQuery(e.target.value)}
            />
          </div>

          {form.sections.map((section, si) => (
            <div key={section.key} className="section-editor">
              <div className="section-editor-head">
                <input
                  type="text"
                  className="section-name-input"
                  value={section.name}
                  onChange={(e) => updateSection(section.key, { name: e.target.value })}
                  placeholder="Section name (e.g. Main)"
                />
                <div className="section-tools">
                  <button type="button" className="icon-btn" title="Move up" disabled={si === 0} onClick={() => moveSection(section.key, -1)}>
                    ↑
                  </button>
                  <button type="button" className="icon-btn" title="Move down" disabled={si === form.sections.length - 1} onClick={() => moveSection(section.key, 1)}>
                    ↓
                  </button>
                  <button type="button" className="icon-btn danger" title="Remove section" onClick={() => removeSection(section.key)}>
                    ✕
                  </button>
                </div>
              </div>

              {section.ingredients.length === 0 && <p className="hint">No ingredients in this section.</p>}

              {section.ingredients.map((ing, ii) => (
                <div key={ing.key} className="ingredient-row">
                  <IngredientSearch
                    value={ing}
                    ingredients={filteredIngredients}
                    onChange={(patch) => updateIngredient(section.key, ing.key, patch)}
                    onSelect={(ingredient) => handleIngredientSelect(section.key, ing.key, ingredient)}
                  />
                  <div className="ing-quantity">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="Qty"
                      value={ing.quantity}
                      onChange={(e) => updateIngredient(section.key, ing.key, { quantity: e.target.value })}
                    />
                  </div>
                  <div className="ing-unit">
                    <select value={ing.unit} onChange={(e) => updateIngredient(section.key, ing.key, { unit: e.target.value })}>
                      <option value="">unit</option>
                      {lookup.units.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="ing-notes-input">
                    <input
                      type="text"
                      placeholder="Notes"
                      value={ing.notes}
                      onChange={(e) => updateIngredient(section.key, ing.key, { notes: e.target.value })}
                    />
                  </div>
                  <label className="optional-toggle" title="Mark optional">
                    <input
                      type="checkbox"
                      checked={ing.optional}
                      onChange={(e) => updateIngredient(section.key, ing.key, { optional: e.target.checked })}
                    />
                    <span>Optional</span>
                  </label>
                  <div className="ing-tools">
                    <button type="button" className="icon-btn" title="Move up" disabled={ii === 0} onClick={() => moveIngredient(section.key, ing.key, -1)}>
                      ↑
                    </button>
                    <button type="button" className="icon-btn" title="Move down" disabled={ii === section.ingredients.length - 1} onClick={() => moveIngredient(section.key, ing.key, 1)}>
                      ↓
                    </button>
                    <button type="button" className="icon-btn danger" title="Remove" onClick={() => removeIngredient(section.key, ing.key)}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}

              <button type="button" className="btn btn-ghost btn-sm" onClick={() => addIngredient(section.key)}>
                + Add ingredient
              </button>
            </div>
          ))}

          <button type="button" className="btn btn-ghost" onClick={addSection}>
            + Add ingredient section
          </button>
        </fieldset>

        {/* Method */}
        <fieldset className="panel form-section">
          <legend>Method</legend>
          <p className="hint">Add numbered steps in order. Optionally add a timer for each step.</p>

          {form.steps.map((step, i) => (
            <div key={step.key} className="step-editor-row">
              <span className="step-editor-num">{i + 1}</span>
              <input
                type="text"
                className="step-input"
                placeholder="Describe this step…"
                value={step.instruction}
                onChange={(e) => updateStep(step.key, { instruction: e.target.value })}
              />
              <label className="step-timer-input">
                <span>Timer (min)</span>
                <input
                  type="number"
                  min="0"
                  value={step.timer}
                  onChange={(e) => updateStep(step.key, { timer: e.target.value })}
                  placeholder="0"
                />
              </label>
              <div className="ing-tools">
                <button type="button" className="icon-btn" title="Move up" disabled={i === 0} onClick={() => moveStep(step.key, -1)}>
                  ↑
                </button>
                <button type="button" className="icon-btn" title="Move down" disabled={i === form.steps.length - 1} onClick={() => moveStep(step.key, 1)}>
                  ↓
                </button>
                <button type="button" className="icon-btn danger" title="Remove" onClick={() => removeStep(step.key)}>
                  ✕
                </button>
              </div>
            </div>
          ))}

          <button type="button" className="btn btn-ghost" onClick={addStep}>
            + Add step
          </button>
        </fieldset>

        {/* Meal planning options */}
        <fieldset className="panel form-section">
          <legend>Meal-planning options</legend>
          <label className="checkbox-line">
            <input type="checkbox" checked={form.includeInMealSuggestions} onChange={(e) => set('includeInMealSuggestions', e.target.checked)} />
            Make this recipe available in meal-plan suggestions
          </label>
          <label className="checkbox-line">
            <input type="checkbox" checked={form.addToPlan} onChange={(e) => set('addToPlan', e.target.checked)} />
            Immediately add this recipe to the meal plan
          </label>

          {form.addToPlan && (
            <div className="plan-options form-grid">
              <label className="field">
                <span>Meal-planning week</span>
                <input
                  type="week"
                  value={weekInputValue(form.planWeekMonday)}
                  onChange={(e) => {
                    const week = e.target.value
                    if (week) {
                      const monday = mondayFromWeekInput(week)
                      set('planWeekMonday', monday)
                    }
                  }}
                />
              </label>
              <label className="field">
                <span>Planned cooking day</span>
                <select value={form.planDayIndex} onChange={(e) => set('planDayIndex', Number(e.target.value))}>
                  {DAYS.map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Planned serving time</span>
                <input type="time" value={form.planServingTime} onChange={(e) => set('planServingTime', e.target.value)} />
              </label>
              <label className="checkbox-line">
                <input type="checkbox" checked={form.planSpecificDate} onChange={(e) => set('planSpecificDate', e.target.checked)} />
                Use specific date & time
              </label>
              {planSpecificDateVal && (
                <label className="field">
                  <span>Specific date</span>
                  <input type="date" value={form.planDate} onChange={(e) => set('planDate', e.target.value)} />
                </label>
              )}
            </div>
          )}
        </fieldset>

        {/* Recipe options menu */}
        <fieldset className="panel form-section">
          <legend>Recipe options</legend>
          <div className="options-menu">
            <div className="options-toggle-group">
              <label className="checkbox-line">
                <input type="checkbox" checked={form.includeInShoppingList} onChange={(e) => set('includeInShoppingList', e.target.checked)} />
                Include ingredients in generated shopping lists
              </label>
              <label className="checkbox-line">
                <input type="checkbox" checked={form.showNutrition} onChange={(e) => set('showNutrition', e.target.checked)} />
                Show nutrition information
              </label>
              <label className="checkbox-line">
                <input type="checkbox" checked={form.allowSubstitutions} onChange={(e) => set('allowSubstitutions', e.target.checked)} />
                Allow ingredient substitutions
              </label>
            </div>

            <div className="measurement-group">
              <span className="group-label">Measurements</span>
              <div className="segmented">
                <button
                  type="button"
                  className={`seg-btn ${form.measurementSystem === 'us' ? 'active' : ''}`}
                  onClick={() => set('measurementSystem', 'us')}
                >
                  US customary
                </button>
                <button
                  type="button"
                  className={`seg-btn ${form.measurementSystem === 'metric' ? 'active' : ''}`}
                  onClick={() => set('measurementSystem', 'metric')}
                >
                  Metric
                </button>
              </div>
            </div>
          </div>
        </fieldset>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {recipe ? 'Save changes' : 'Add recipe'}
          </button>
        </div>
      </form>
    </section>
  )
}

function ToggleChip({ active, onClick, children }) {
  return (
    <button type="button" className={`chip-toggle ${active ? 'active' : ''}`} onClick={onClick}>
      {children}
    </button>
  )
}

function NumberStepper({ value, onChange, min = 0 }) {
  return (
    <div className="stepper">
      <button type="button" onClick={() => onChange(Math.max(min, (value || 0) - 1))}>
        −
      </button>
      <span className="stepper-value">{value}</span>
      <button type="button" onClick={() => onChange((value || 0) + 1)}>
        +
      </button>
    </div>
  )
}

function ColorSwatches({ value, onChange }) {
  const swatches = ['#D97757', '#8A9A5B', '#5B8A9A', '#9A5B8A', '#C99A3B', '#4A6B5D', '#A0522D', '#6B5B9A']
  return (
    <div className="swatches">
      {swatches.map((c) => (
        <button
          key={c}
          type="button"
          className={`swatch ${value === c ? 'active' : ''}`}
          style={{ background: c }}
          onClick={() => onChange(c)}
        />
      ))}
    </div>
  )
}

function IngredientSearch({ value, ingredients, onChange, onSelect }) {
  const [open, setOpen] = useState(false)
  const [localQuery, setLocalQuery] = useState('')

  const results = ingredients.filter((i) => i.name.toLowerCase().includes(localQuery.trim().toLowerCase())).slice(0, 30)

  return (
    <div className="ing-search">
      <input
        type="text"
        placeholder="Search / type ingredient"
        value={localQuery || value.name}
        onChange={(e) => {
          setLocalQuery(e.target.value)
          onChange({ name: e.target.value, ingredientId: '' })
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && (
        <div className="ing-dropdown">
          {results.map((i) => (
            <button
              key={i.id}
              type="button"
              className="ing-option"
              onMouseDown={(e) => {
                e.preventDefault()
                onSelect(i)
                setLocalQuery('')
                setOpen(false)
              }}
            >
              {i.name} <span className="ing-cat">{i.category}</span>
            </button>
          ))}
          {results.length === 0 && <span className="ing-none">No matches</span>}
        </div>
      )}
    </div>
  )
}

function spiceLabel(level) {
  const n = Number(level) || 0
  return ['Mild', 'Mild +', 'Mild-medium', 'Medium', 'Spicy', 'Very spicy'][n] || 'Mild'
}

function weekInputValue(mondayISO) {
  const d = new Date(mondayISO + 'T00:00:00')
  const year = d.getFullYear()
  const oneJan = new Date(year, 0, 1)
  const days = Math.floor((d - oneJan) / (24 * 60 * 60 * 1000))
  const week = Math.ceil((days + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

function mondayFromWeekInput(weekStr) {
  // weekStr like "2026-W39"
  const [year, weekPart] = weekStr.split('-W')
  const week = Number(weekPart)
  const jan1 = new Date(Number(year), 0, 1)
  const day = jan1.getDay() || 7
  const monday = new Date(jan1)
  monday.setDate(jan1.getDate() - day + 1 + (week - 1) * 7)
  return monday.toISOString().slice(0, 10)
}