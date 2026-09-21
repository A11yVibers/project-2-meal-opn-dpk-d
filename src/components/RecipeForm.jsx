import { useState, useMemo, useRef } from 'react'
import {
  cuisineOptions,
  dietaryOptions,
  mealTypeOptions,
  categoryOptions,
  unitOptions,
  ingredientOptions,
  emptyIngredient,
  emptyStep,
  genId,
  colorPalette,
} from '../lib/domain'
import { startOfWeek, weekDates, slotKeyFor } from '../lib/useAppState'
import { RecipeImage } from './Shared'

export default function RecipeForm({ state, initialRecipe, onCancel, onSave }) {
  const [recipe, setRecipe] = useState(() => structuredClone(initialRecipe || emptyRecipeState()))
  const fileInput = useRef(null)

  const planWeekOptions = useMemo(() => {
    const thisWeek = state.weekStart
    const today = startOfWeek(new Date())
    const opts = [{ key: 'this', label: 'This week', iso: weekDates(today)[6] }]
    ;[-1, -2, 1, 2].forEach((offset) => {
      const d = new Date(today)
      d.setDate(d.getDate() + offset * 7)
      const label = offset < 0 ? `${Math.abs(offset)} week(s) ago` : `+${offset} week(s)`
      opts.push({ key: String(offset), label, iso: weekDates(d.getTime())[0] })
    })
    void thisWeek
    return opts
  }, [state.weekStart])

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0)

  const set = (key, value) => setRecipe((r) => ({ ...r, [key]: value }))
  const setOption = (key, value) =>
    setRecipe((r) => ({ ...r, options: { ...r.options, [key]: value } }))

  const toggleArray = (key, id) =>
    setRecipe((r) => {
      const list = r[key] || []
      return { ...r, [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] }
    })

  // Ingredients
  const upsertSection = (secId, patch) =>
    setRecipe((r) => ({
      ...r,
      sections: r.sections.map((s) => (s.id === secId ? { ...s, ...patch } : s)),
    }))

  const addSection = () =>
    setRecipe((r) => ({
      ...r,
      sections: [
        ...r.sections,
        { id: genId('sec'), name: `Section ${r.sections.length + 1}`, ingredients: [] },
      ],
    }))

  const removeSection = (secId) =>
    setRecipe((r) => ({
      ...r,
      sections: r.sections.filter((s) => s.id !== secId),
    }))

  const moveSection = (secId, dir) =>
    setRecipe((r) => {
      const list = [...r.sections]
      const idx = list.findIndex((s) => s.id === secId)
      const swap = idx + dir
      if (swap < 0 || swap >= list.length) return r
      ;[list[idx], list[swap]] = [list[swap], list[idx]]
      return { ...r, sections: list }
    })

  const addIngredient = (secId) =>
    setRecipe((r) => ({
      ...r,
      sections: r.sections.map((s) =>
        s.id === secId ? { ...s, ingredients: [...s.ingredients, emptyIngredient()] } : s
      ),
    }))

  const removeIngredient = (secId, ingId) =>
    setRecipe((r) => ({
      ...r,
      sections: r.sections.map((s) =>
        s.id === secId ? { ...s, ingredients: s.ingredients.filter((i) => i.id !== ingId) } : s
      ),
    }))

  const moveIngredient = (secId, ingId, dir) =>
    setRecipe((r) => ({
      ...r,
      sections: r.sections.map((s) => {
        if (s.id !== secId) return s
        const list = [...s.ingredients]
        const idx = list.findIndex((i) => i.id === ingId)
        const swap = idx + dir
        if (swap < 0 || swap >= list.length) return s
        ;[list[idx], list[swap]] = [list[swap], list[idx]]
        return { ...s, ingredients: list }
      }),
    }))

  const updateIngredient = (secId, ingId, patch) =>
    setRecipe((r) => ({
      ...r,
      sections: r.sections.map((s) =>
        s.id === secId
          ? {
              ...s,
              ingredients: s.ingredients.map((i) =>
                i.id === ingId ? { ...i, ...patch } : i
              ),
            }
          : s
      ),
    }))

  // Steps
  const addStep = () => setRecipe((r) => ({ ...r, steps: [...r.steps, emptyStep()] }))
  const removeStep = (stepId) =>
    setRecipe((r) => ({ ...r, steps: r.steps.filter((s) => s.id !== stepId) }))
  const moveStep = (stepId, dir) =>
    setRecipe((r) => {
      const list = [...r.steps]
      const idx = list.findIndex((s) => s.id === stepId)
      const swap = idx + dir
      if (swap < 0 || swap >= list.length) return r
      ;[list[idx], list[swap]] = [list[swap], list[idx]]
      return { ...r, steps: list }
    })
  const updateStep = (stepId, patch) =>
    setRecipe((r) => ({
      ...r,
      steps: r.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
    }))

  const handleImageUpload = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set('coverImageUrl', reader.result)
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    if (!recipe.title.trim()) {
      window.alert('Please enter a recipe title.')
      return
    }
    const final = { ...recipe, totalTime }
    onSave(final)

    if (recipe.mealPlanAction === 'immediate' && recipe.planSlot && recipe.planDateIso) {
      state.assignSlot(slotKeyFor(recipe.planDateIso, recipe.planSlot), final.id)
    }
  }

  return (
    <div className="form">
      <h1>{initialRecipe && initialRecipe.id ? 'Edit Recipe' : 'New Recipe'}</h1>

      {/* Section: Recipe details */}
      <section className="form-section">
        <h2>Recipe details</h2>
        <div className="form-grid">
          <label className="field full">
            <span>Recipe title *</span>
            <input
              type="text"
              value={recipe.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Honey Garlic Salmon Bowls"
            />
          </label>
          <label className="field full">
            <span>Source link</span>
            <input
              type="url"
              value={recipe.sourceUrl}
              onChange={(e) => set('sourceUrl', e.target.value)}
              placeholder="https://…"
            />
          </label>
          <label className="field full">
            <span>Short description</span>
            <textarea
              value={recipe.description}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
            />
          </label>
          <label className="field">
            <span>Cuisine</span>
            <select
              value={recipe.cuisine}
              onChange={(e) => set('cuisine', e.target.value)}
            >
              <option value="">— select —</option>
              {cuisineOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Primary meal type</span>
            <select
              value={recipe.mealType}
              onChange={(e) => set('mealType', e.target.value)}
            >
              <option value="">— select —</option>
              {mealTypeOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <div className="field full">
            <span>Dietary suitability</span>
            <CheckGroup
              options={dietaryOptions}
              selected={recipe.dietaryTags}
              onToggle={(id) => toggleArray('dietaryTags', id)}
              labelOf={(o) => o.name}
            />
          </div>
          <div className="field full">
            <span>Recipe categories</span>
            <CheckGroup
              options={categoryOptions}
              selected={recipe.categories}
              onToggle={(id) => toggleArray('categories', id)}
              labelOf={(o) => o.name}
            />
          </div>
        </div>
      </section>

      {/* Section: Timing and yield */}
      <section className="form-section">
        <h2>Timing and yield</h2>
        <div className="form-grid">
          <label className="field">
            <span>Servings</span>
            <input
              type="number"
              min={1}
              value={recipe.servings}
              onChange={(e) => set('servings', Number(e.target.value))}
            />
          </label>
          <label className="field">
            <span>Prep time (min)</span>
            <input
              type="number"
              min={0}
              value={recipe.prepTime}
              onChange={(e) => set('prepTime', Number(e.target.value))}
            />
          </label>
          <label className="field">
            <span>Cook time (min)</span>
            <input
              type="number"
              min={0}
              value={recipe.cookTime}
              onChange={(e) => set('cookTime', Number(e.target.value))}
            />
          </label>
          <div className="field">
            <span>Total time</span>
            <div className="total-time">{totalTime} min</div>
          </div>
          <div className="field full">
            <span>Spice level</span>
            <div className="spice-control">
              <input
                type="range"
                min={0}
                max={5}
                value={recipe.spiceLevel}
                onChange={(e) => set('spiceLevel', Number(e.target.value))}
              />
              <span className="spice-label">{spiceWord(recipe.spiceLevel)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Image and appearance */}
      <section className="form-section">
        <h2>Image and appearance</h2>
        <div className="form-grid">
          <div className="field full image-field">
            <span>Cover image</span>
            <div className="image-upload-row">
              <div className="cover-preview" style={{ '--accent': recipe.accentColor }}>
                <RecipeImage recipe={recipe} />
              </div>
              <div className="image-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => fileInput.current && fileInput.current.click()}
                >
                  Upload image
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
                <input
                  type="url"
                  className="image-url-input"
                  value={recipe.coverImageUrl && recipe.coverImageUrl.startsWith('data:') ? '' : recipe.coverImageUrl}
                  onChange={(e) => set('coverImageUrl', e.target.value)}
                  placeholder="or paste image URL"
                />
                {recipe.coverImageUrl && (
                  <button type="button" className="btn btn-ghost" onClick={() => set('coverImageUrl', '')}>
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="field full">
            <span>Card accent color</span>
            <div className="color-picker">
              {colorPalette().map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${recipe.accentColor === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => set('accentColor', c)}
                  aria-label={`color ${c}`}
                />
              ))}
              <label className="color-custom">
                <input
                  type="color"
                  value={recipe.accentColor}
                  onChange={(e) => set('accentColor', e.target.value)}
                />
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Ingredients */}
      <section className="form-section">
        <h2>Ingredients</h2>
        <button type="button" className="btn" onClick={addSection}>
          + Add ingredient section
        </button>
        {recipe.sections.map((sec, secIdx) => (
          <div key={sec.id} className="ingredient-section-editor">
            <div className="section-header">
              <input
                type="text"
                className="section-name"
                value={sec.name}
                onChange={(e) => upsertSection(sec.id, { name: e.target.value })}
              />
              <div className="section-controls">
                <button type="button" className="icon-btn" onClick={() => moveSection(sec.id, -1)} title="Move up">
                  ↑
                </button>
                <button type="button" className="icon-btn" onClick={() => moveSection(sec.id, 1)} title="Move down">
                  ↓
                </button>
                {recipe.sections.length > 1 && (
                  <button type="button" className="icon-btn danger" onClick={() => removeSection(sec.id)} title="Remove section">
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="ingredient-rows">
              <div className="ingredient-row header-row">
                <span>Ingredient</span>
                <span>Qty</span>
                <span>Unit</span>
                <span>Notes</span>
                <span>Opt.</span>
                <span />
              </div>
              {sec.ingredients.map((ing) => (
                <IngredientRow
                  key={ing.id}
                  ing={ing}
                  onChange={(patch) => updateIngredient(sec.id, ing.id, patch)}
                  onRemove={() => removeIngredient(sec.id, ing.id)}
                  onMove={(dir) => moveIngredient(sec.id, ing.id, dir)}
                />
              ))}
              <button type="button" className="btn btn-ghost" onClick={() => addIngredient(sec.id)}>
                + Add ingredient
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* Section: Method */}
      <section className="form-section">
        <h2>Method</h2>
        <div className="steps-editor">
          {recipe.steps.map((step, i) => (
            <div key={step.id} className="step-row">
              <span className="step-index">{i + 1}.</span>
              <textarea
                className="step-instruction"
                rows={2}
                value={step.instruction}
                placeholder="Describe this step…"
                onChange={(e) => updateStep(step.id, { instruction: e.target.value })}
              />
              <label className="step-timer-field">
                Timer (min)
                <input
                  type="number"
                  min={0}
                  value={step.timer}
                  onChange={(e) => updateStep(step.id, { timer: Number(e.target.value) })}
                />
              </label>
              <div className="step-controls">
                <button type="button" className="icon-btn" onClick={() => moveStep(step.id, -1)} title="Move up">
                  ↑
                </button>
                <button type="button" className="icon-btn" onClick={() => moveStep(step.id, 1)} title="Move down">
                  ↓
                </button>
                <button type="button" className="icon-btn danger" onClick={() => removeStep(step.id)} title="Remove">
                  ✕
                </button>
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-ghost" onClick={addStep}>
            + Add step
          </button>
        </div>
      </section>

      {/* Section: Meal planning options */}
      <section className="form-section">
        <h2>Meal planning options</h2>
        <div className="form-grid">
          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={recipe.includeInMealSuggestions}
              onChange={(e) => set('includeInMealSuggestions', e.target.checked)}
            />
            Make available in meal-plan suggestions
          </label>

          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={recipe.mealPlanAction === 'immediate'}
              onChange={(e) =>
                set('mealPlanAction', e.target.checked ? 'immediate' : 'none')
              }
            />
            Immediately add to the meal plan
          </label>

          <div className="field">
            <span>Meal-planning week</span>
            <select
              value={recipe.planWeekKey || ''}
              onChange={(e) => {
                const key = e.target.value
                set('planWeekKey', key)
                if (key) {
                  const entry = planWeekOptions.find((p) => p.key === key)
                  setRecipe((r) => ({ ...r, planDateIso: entry ? entry.iso : r.planDateIso }))
                }
              }}
            >
              <option value="">This week</option>
              {planWeekOptions.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <span>Planned cooking date</span>
            <input
              type="date"
              value={recipe.planDateIso || ''}
              onChange={(e) => set('planDateIso', e.target.value)}
            />
          </div>

          <div className="field">
            <span>Planned serving time</span>
            <select
              value={recipe.planSlot || ''}
              onChange={(e) => set('planSlot', e.target.value)}
            >
              <option value="">— select —</option>
              {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Section: Recipe options menu */}
      <section className="form-section">
        <h2>Recipe options</h2>
        <OptionMenu
          options={recipe.options}
          onToggle={(key) => setOption(key, !recipe.options[key])}
          onMeasurement={(m) => setOption('measurement', m)}
        />
      </section>

      <div className="form-actions">
        <button className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleSave}>
          {initialRecipe && initialRecipe.id ? 'Save changes' : 'Add recipe'}
        </button>
      </div>
    </div>
  )
}

function emptyRecipeState() {
  return {
    id: genId('R'),
    title: '',
    description: '',
    sourceUrl: '',
    servings: 4,
    prepTime: 0,
    cookTime: 0,
    cuisine: '',
    mealType: '',
    dietaryTags: [],
    categories: [],
    difficulty: 1,
    spiceLevel: 0,
    accentColor: '#D97757',
    coverImageUrl: '',
    includeInMealSuggestions: true,
    mealPlanAction: 'none',
    planWeekKey: '',
    planDateIso: '',
    planSlot: '',
    sections: [{ id: genId('sec'), name: 'Main', ingredients: [] }],
    steps: [],
    options: {
      includeInShoppingList: true,
      showNutrition: false,
      allowSubstitutions: false,
      measurement: 'us',
    },
    isSeed: false,
  }
}

function spiceWord(level) {
  return ['Mild', 'Mild+', 'Medium', 'Medium+', 'Spicy', 'Very Spicy'][level] || 'Mild'
}

function CheckGroup({ options, selected, onToggle, labelOf }) {
  return (
    <div className="check-group">
      {options.map((o) => {
        const checked = selected.includes(o.id)
        return (
          <label key={o.id} className={`chip ${checked ? 'selected' : ''}`}>
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(o.id)}
            />
            {labelOf(o)}
          </label>
        )
      })}
    </div>
  )
}

function IngredientRow({ ing, onChange, onRemove, onMove }) {
  const [query, setQuery] = useState(ing.name || '')
  const [showSuggest, setShowSuggest] = useState(false)

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return ingredientOptions
      .filter((i) => i.name.toLowerCase().includes(q))
      .slice(0, 8)
  }, [query])

  const selectIngredient = (opt) => {
    onChange({ ingredientId: opt.id, name: opt.name, category: opt.category })
    setQuery(opt.name)
    setShowSuggest(false)
  }

  return (
    <div className="ingredient-row">
      <div className="ingredient-name-field">
        <input
          type="text"
          value={query}
          placeholder="Search ingredient…"
          onFocus={() => setShowSuggest(true)}
          onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
          onChange={(e) => {
            setQuery(e.target.value)
            onChange({ name: e.target.value })
            setShowSuggest(true)
          }}
        />
        {showSuggest && suggestions.length > 0 && (
          <div className="suggest-menu">
            {suggestions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onMouseDown={() => selectIngredient(opt)}
              >
                {opt.name} <span className="suggest-cat">{opt.category}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <input
        type="text"
        className="qty-input"
        value={ing.quantity}
        placeholder="Qty"
        onChange={(e) => onChange({ quantity: e.target.value })}
      />
      <select value={ing.unit} onChange={(e) => onChange({ unit: e.target.value })}>
        <option value="">unit</option>
        {unitOptions.map((u) => (
          <option key={u.id} value={u.name}>
            {u.name}
          </option>
        ))}
      </select>
      <input
        type="text"
        className="notes-input"
        value={ing.notes}
        placeholder="notes"
        onChange={(e) => onChange({ notes: e.target.value })}
      />
      <input
        type="checkbox"
        className="optional-check"
        checked={ing.optional}
        onChange={(e) => onChange({ optional: e.target.checked })}
        title="Optional"
      />
      <div className="ing-controls">
        <button type="button" className="icon-btn" onClick={() => onMove(-1)} title="Move up">
          ↑
        </button>
        <button type="button" className="icon-btn" onClick={() => onMove(1)} title="Move down">
          ↓
        </button>
        <button type="button" className="icon-btn danger" onClick={onRemove} title="Remove">
          ✕
        </button>
      </div>
    </div>
  )
}

function OptionMenu({ options, onToggle, onMeasurement }) {
  return (
    <div className="option-menu">
      <div className="option-group">
        <span className="option-group-label">Toggles</span>
        <ToggleRow
          label="Include ingredients in shopping lists"
          checked={options.includeInShoppingList}
          onChange={() => onToggle('includeInShoppingList')}
        />
        <ToggleRow
          label="Show nutrition information"
          checked={options.showNutrition}
          onChange={() => onToggle('showNutrition')}
        />
        <ToggleRow
          label="Allow ingredient substitutions"
          checked={options.allowSubstitutions}
          onChange={() => onToggle('allowSubstitutions')}
        />
      </div>
      <div className="option-group">
        <span className="option-group-label">Measurement system</span>
        <SegmentedControl
          value={options.measurement}
          options={[
            { value: 'us', label: 'US customary' },
            { value: 'metric', label: 'Metric' },
          ]}
          onChange={onMeasurement}
        />
      </div>
    </div>
  )
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <button
        type="button"
        className={`toggle ${checked ? 'on' : ''}`}
        onClick={onChange}
        role="switch"
        aria-checked={checked}
      >
        <span className="toggle-knob" />
      </button>
    </label>
  )
}

function SegmentedControl({ value, options, onChange }) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`segment ${value === o.value ? 'selected' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}