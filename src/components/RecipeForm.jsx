import { useMemo, useState } from 'react'
import { APPROVED_IMAGES } from '../approved-images.js'
import {
  CUISINES,
  DIETARY_TAGS,
  MEAL_TYPES,
  RECIPE_CATEGORIES,
  UNITS,
  INGREDIENTS,
  MEAL_SLOTS,
  SPICE_LABELS,
  ACCENT_PRESETS,
  MEASUREMENT_SYSTEMS,
  emptyIngredient,
  emptyStep,
} from '../lib/data.js'
import { todayKey, startOfWeek, addDays, toKey } from '../lib/dates.js'

export default function RecipeForm({ initialDraft, onCancel, onSubmit }) {
  const [draft, setDraft] = useState(initialDraft)

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const setOptions = (patch) =>
    setDraft((d) => ({ ...d, options: { ...d.options, ...patch } }))
  const setMealPlan = (patch) =>
    setDraft((d) => ({ ...d, mealPlan: { ...d.mealPlan, ...patch } }))

  const totalTime = (Number(draft.prepTimeMinutes) || 0) + (Number(draft.cookTimeMinutes) || 0)

  const toggleArray = (list, value) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value]

  // ---------- ingredients ----------
  const updateSection = (si, patch) =>
    setDraft((d) => {
      const sections = d.ingredientSections.map((s, i) => (i === si ? { ...s, ...patch } : s))
      return { ...d, ingredientSections: sections }
    })

  const updateIngredient = (si, ii, patch) =>
    setDraft((d) => {
      const sections = d.ingredientSections.map((s, i) => {
        if (i !== si) return s
        const ingredients = s.ingredients.map((ing, j) => (j === ii ? { ...ing, ...patch } : ing))
        return { ...s, ingredients }
      })
      return { ...d, ingredientSections: sections }
    })

  const addIngredient = (si) =>
    setDraft((d) => {
      const sections = d.ingredientSections.map((s, i) =>
        i === si ? { ...s, ingredients: [...s.ingredients, emptyIngredient()] } : s
      )
      return { ...d, ingredientSections: sections }
    })

  const removeIngredient = (si, ii) =>
    setDraft((d) => {
      const sections = d.ingredientSections.map((s, i) => {
        if (i !== si) return s
        const ingredients = s.ingredients.filter((_, j) => j !== ii)
        return { ...s, ingredients: ingredients.length ? ingredients : [emptyIngredient()] }
      })
      return { ...d, ingredientSections: sections }
    })

  const moveIngredient = (si, ii, dir) =>
    setDraft((d) => {
      const sections = d.ingredientSections.map((s, i) => {
        if (i !== si) return s
        const ingredients = [...s.ingredients]
        const to = ii + dir
        if (to < 0 || to >= ingredients.length) return s
        ;[ingredients[ii], ingredients[to]] = [ingredients[to], ingredients[ii]]
        return { ...s, ingredients }
      })
      return { ...d, ingredientSections: sections }
    })

  const addSection = () =>
    setDraft((d) => ({
      ...d,
      ingredientSections: [
        ...d.ingredientSections,
        { name: `Section ${d.ingredientSections.length + 1}`, ingredients: [emptyIngredient()] },
      ],
    }))

  const removeSection = (si) =>
    setDraft((d) => {
      if (d.ingredientSections.length <= 1) return d
      return {
        ...d,
        ingredientSections: d.ingredientSections.filter((_, i) => i !== si),
      }
    })

  // ---------- steps ----------
  const updateStep = (i, patch) =>
    setDraft((d) => ({ ...d, steps: d.steps.map((s, j) => (i === j ? { ...s, ...patch } : s)) }))
  const addStep = () => setDraft((d) => ({ ...d, steps: [...d.steps, emptyStep()] }))
  const removeStep = (i) =>
    setDraft((d) => ({
      ...d,
      steps: d.steps.filter((_, j) => j !== i).length
        ? d.steps.filter((_, j) => j !== i)
        : [emptyStep()],
    }))
  const moveStep = (i, dir) =>
    setDraft((d) => {
      const steps = [...d.steps]
      const to = i + dir
      if (to < 0 || to >= steps.length) return d
      ;[steps[i], steps[to]] = [steps[to], steps[i]]
      return { ...d, steps }
    })

  // ---------- image ----------
  const onImageUpload = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set({ coverImageUrl: reader.result })
    reader.readAsDataURL(file)
  }

  // ---------- meal-plan week handling ----------
  const onWeekChange = (week) => {
    setMealPlan({ week })
    if (week === 'this') setMealPlan({ week, cookingDate: todayKey() })
    else if (week === 'next')
      setMealPlan({ week, cookingDate: toKey(addDays(startOfWeek(new Date()), 7)) })
  }

  const canSubmit = draft.title.trim().length > 0

  const submit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit(draft)
  }

  return (
    <form className="view recipe-form" onSubmit={submit}>
      <div className="view-header">
        <div>
          <h1>{initialDraft.title ? 'Edit recipe' : 'New recipe'}</h1>
          <p className="muted">Fill in the sections below, then save.</p>
        </div>
        <div className="form-actions">
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={!canSubmit}>Save recipe</button>
        </div>
      </div>

      <Section title="Recipe details">
        <div className="field-grid two">
          <label className="field">
            <span>Recipe title *</span>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="e.g. Honey Garlic Salmon Bowls"
            />
          </label>
          <label className="field">
            <span>Source name</span>
            <input
              type="text"
              value={draft.sourceName}
              onChange={(e) => set({ sourceName: e.target.value })}
              placeholder="e.g. My Cookbook"
            />
          </label>
        </div>
        <label className="field">
          <span>Source link</span>
          <input
            type="url"
            value={draft.sourceUrl}
            onChange={(e) => set({ sourceUrl: e.target.value })}
            placeholder="https://…"
          />
        </label>
        <div className="field-grid two">
          <label className="field">
            <span>Cuisine</span>
            <select value={draft.cuisineId} onChange={(e) => set({ cuisineId: e.target.value })}>
              <option value="">— select —</option>
              {CUISINES.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Primary meal type</span>
            <select value={draft.mealTypeId} onChange={(e) => set({ mealTypeId: e.target.value })}>
              <option value="">— select —</option>
              {MEAL_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
        </div>
        <MultiSelect
          label="Dietary suitability"
          options={DIETARY_TAGS}
          values={draft.dietaryTagIds}
          onChange={(vals) => set({ dietaryTagIds: vals })}
        />
        <MultiSelect
          label="Recipe categories"
          options={RECIPE_CATEGORIES}
          values={draft.categoryIds}
          onChange={(vals) => set({ categoryIds: vals })}
        />
      </Section>

      <Section title="Timing & yield">
        <div className="field-grid two">
          <Stepper
            label="Servings"
            value={draft.servings}
            min={1}
            onChange={(v) => set({ servings: v })}
          />
          <label className="field">
            <span>Prep time (minutes)</span>
            <input
              type="number"
              min="0"
              value={draft.prepTimeMinutes}
              onChange={(e) => set({ prepTimeMinutes: Number(e.target.value) || 0 })}
            />
          </label>
        </div>
        <div className="field-grid two">
          <label className="field">
            <span>Cook time (minutes)</span>
            <input
              type="number"
              min="0"
              value={draft.cookTimeMinutes}
              onChange={(e) => set({ cookTimeMinutes: Number(e.target.value) || 0 })}
            />
          </label>
          <label className="field">
            <span>Total time (auto)</span>
            <input type="text" value={`${totalTime} min`} readOnly />
          </label>
        </div>
        <div className="field">
          <span className="field-label-row">
            <span>Spice level</span>
            <strong>{SPICE_LABELS[draft.spiceLevel]}</strong>
          </span>
          <input
            className="slider"
            type="range"
            min="0"
            max="5"
            step="1"
            value={draft.spiceLevel}
            onChange={(e) => set({ spiceLevel: Number(e.target.value) })}
          />
          <div className="spice-scale">
            <span>None</span>
            <span>Mild</span>
            <span>Very spicy</span>
          </div>
        </div>
      </Section>

      <Section title="Image & appearance">
        <div className="image-field">
          <div className="image-preview" style={{ '--accent': draft.accentColor }}>
            <img src={draft.coverImageUrl || APPROVED_IMAGES.placeholder} alt="Preview" />
          </div>
          <div className="image-controls">
            <label className="btn btn-file">
              Upload cover image
              <input type="file" accept="image/*" onChange={onImageUpload} />
            </label>
            <label className="field">
              <span>…or paste an image URL</span>
              <input
                type="url"
                value={
                  draft.coverImageUrl && draft.coverImageUrl.startsWith('data:')
                    ? ''
                    : draft.coverImageUrl
                }
                onChange={(e) => set({ coverImageUrl: e.target.value })}
                placeholder="https://…"
              />
            </label>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => set({ coverImageUrl: '' })}
            >
              Use placeholder
            </button>
            <p className="muted small">No image? The placeholder is used automatically.</p>
          </div>
        </div>
        <div className="field">
          <span>Accent color</span>
          <div className="accent-row">
            <input
              type="color"
              value={draft.accentColor}
              onChange={(e) => set({ accentColor: e.target.value })}
              aria-label="Accent color"
            />
            {ACCENT_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                className={`color-swatch ${draft.accentColor === c ? 'selected' : ''}`}
                style={{ background: c }}
                onClick={() => set({ accentColor: c })}
                aria-label={`Set accent color ${c}`}
              />
            ))}
          </div>
        </div>
      </Section>

      <Section title="Ingredients">
        {draft.ingredientSections.map((section, si) => (
          <div key={si} className="ingredient-section-form">
            <div className="section-head">
              <input
                className="section-name-input"
                type="text"
                value={section.name}
                onChange={(e) => updateSection(si, { name: e.target.value })}
              />
              <button
                type="button"
                className="btn-icon"
                title="Remove section"
                onClick={() => removeSection(si)}
                disabled={draft.ingredientSections.length <= 1}
              >
                ✕
              </button>
            </div>
            {section.ingredients.map((ing, ii) => (
              <div key={ii} className="ingredient-row">
                <IngredientCombobox
                  value={ing.name}
                  onChange={(name) => updateIngredient(si, ii, { name })}
                />
                <input
                  type="text"
                  inputMode="decimal"
                  className="qty-input"
                  placeholder="Qty"
                  value={ing.quantity}
                  onChange={(e) => updateIngredient(si, ii, { quantity: e.target.value })}
                />
                <select
                  className="unit-input"
                  value={ing.unit}
                  onChange={(e) => updateIngredient(si, ii, { unit: e.target.value })}
                >
                  <option value="">unit</option>
                  {UNITS.map((u) => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
                <label className="check-optional" title="Optional">
                  <input
                    type="checkbox"
                    checked={ing.optional}
                    onChange={(e) => updateIngredient(si, ii, { optional: e.target.checked })}
                  />
                  Optional
                </label>
                <div className="row-actions">
                  <button
                    type="button"
                    className="btn-icon"
                    title="Move up"
                    onClick={() => moveIngredient(si, ii, -1)}
                    disabled={ii === 0}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    title="Move down"
                    onClick={() => moveIngredient(si, ii, 1)}
                    disabled={ii === section.ingredients.length - 1}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn-icon danger"
                    title="Remove ingredient"
                    onClick={() => removeIngredient(si, ii)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-small" onClick={() => addIngredient(si)}>
              + Add ingredient
            </button>
          </div>
        ))}
        <button type="button" className="btn" onClick={addSection}>
          + Add ingredient section
        </button>
      </Section>

      <Section title="Method">
        <ol className="step-form-list">
          {draft.steps.map((step, i) => (
            <li key={i} className="step-form-row">
              <span className="step-number">{i + 1}</span>
              <textarea
                rows={2}
                placeholder="Describe this step…"
                value={step.instruction}
                onChange={(e) => updateStep(i, { instruction: e.target.value })}
              />
              <label className="timer-input">
                <span>Timer (min)</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={step.timerMinutes}
                  onChange={(e) => updateStep(i, { timerMinutes: e.target.value })}
                />
              </label>
              <div className="row-actions">
                <button
                  type="button"
                  className="btn-icon"
                  title="Move up"
                  onClick={() => moveStep(i, -1)}
                  disabled={i === 0}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  title="Move down"
                  onClick={() => moveStep(i, 1)}
                  disabled={i === draft.steps.length - 1}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="btn-icon danger"
                  title="Remove step"
                  onClick={() => removeStep(i)}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ol>
        <button type="button" className="btn" onClick={addStep}>+ Add step</button>
      </Section>

      <Section title="Meal-planning options">
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={draft.includeInMealSuggestions}
            onChange={(e) => set({ includeInMealSuggestions: e.target.checked })}
          />
          <span>Make this recipe available in meal-plan suggestions</span>
        </label>

        <label className="toggle-row">
          <input
            type="checkbox"
            checked={draft.mealPlan.addToMealPlan}
            onChange={(e) => {
              const next = { addToMealPlan: e.target.checked }
              if (e.target.checked && !draft.mealPlan.cookingDate) next.cookingDate = todayKey()
              setMealPlan(next)
            }}
          />
          <span>Add this recipe to the meal plan now</span>
        </label>

        {draft.mealPlan.addToMealPlan && (
          <div className="mealplan-fields">
            <div className="field-grid two">
              <label className="field">
                <span>Planning week</span>
                <select
                  value={draft.mealPlan.week}
                  onChange={(e) => onWeekChange(e.target.value)}
                >
                  <option value="this">This week</option>
                  <option value="next">Next week</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
              <label className="field">
                <span>Meal slot</span>
                <select
                  value={draft.mealPlan.mealSlot}
                  onChange={(e) => setMealPlan({ mealSlot: e.target.value })}
                >
                  {MEAL_SLOTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="field-grid two">
              <label className="field">
                <span>Planned cooking date</span>
                <input
                  type="date"
                  value={draft.mealPlan.cookingDate}
                  onChange={(e) => setMealPlan({ cookingDate: e.target.value, week: 'custom' })}
                />
              </label>
              <label className="field">
                <span>Planned serving time</span>
                <input
                  type="time"
                  value={draft.mealPlan.servingTime}
                  onChange={(e) => setMealPlan({ servingTime: e.target.value })}
                />
              </label>
            </div>
          </div>
        )}
      </Section>

      <Section title="Recipe options" compact>
        <div className="options-menu">
          <OptionToggle
            label="Include ingredients in generated shopping lists"
            checked={draft.options.includeInShoppingList}
            onChange={(v) => setOptions({ includeInShoppingList: v })}
          />
          <OptionToggle
            label="Show nutrition information"
            checked={draft.options.showNutrition}
            onChange={(v) => setOptions({ showNutrition: v })}
          />
          <OptionToggle
            label="Allow ingredient substitutions"
            checked={draft.options.allowSubstitutions}
            onChange={(v) => setOptions({ allowSubstitutions: v })}
          />
          <div className="measurement-group">
            <span className="measurement-label">Measurements</span>
            {MEASUREMENT_SYSTEMS.map((m) => (
              <label
                key={m.id}
                className={`measure-choice ${draft.options.measurementSystem === m.id ? 'active' : ''}`}
              >
                <input
                  type="radio"
                  name="measurement"
                  checked={draft.options.measurementSystem === m.id}
                  onChange={() => setOptions({ measurementSystem: m.id })}
                />
                <span>{m.name}</span>
              </label>
            ))}
          </div>
        </div>
      </Section>

      <div className="form-actions sticky">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={!canSubmit}>Save recipe</button>
      </div>
    </form>
  )
}

function Section({ title, compact, children }) {
  return (
    <section className={`form-section ${compact ? 'compact' : ''}`}>
      <h2>{title}</h2>
      <div className="section-body">{children}</div>
    </section>
  )
}

function MultiSelect({ label, options, values, onChange }) {
  const toggle = (id) =>
    onChange(values.includes(id) ? values.filter((v) => v !== id) : [...values, id])
  return (
    <div className="field">
      <span>{label}</span>
      <div className="chip-select">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            className={`chip-select-btn ${values.includes(o.id) ? 'selected' : ''}`}
            onClick={() => toggle(o.id)}
          >
            {o.name}
          </button>
        ))}
      </div>
    </div>
  )
}

function Stepper({ label, value, min, onChange }) {
  return (
    <div className="field">
      <span>{label}</span>
      <div className="stepper">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))}>−</button>
        <span>{value}</span>
        <button type="button" onClick={() => onChange(value + 1)}>+</button>
      </div>
    </div>
  )
}

function OptionToggle({ label, checked, onChange }) {
  return (
    <label className="option-toggle">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={`switch ${checked ? 'on' : ''}`} aria-hidden="true" />
    </label>
  )
}

function IngredientCombobox({ value, onChange }) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return INGREDIENTS.slice(0, 12)
    return INGREDIENTS.filter((i) => i.name.toLowerCase().includes(q)).slice(0, 12)
  }, [query])

  return (
    <div className="combobox">
      <input
        type="text"
        placeholder="Search ingredient…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && matches.length > 0 && (
        <div className="combobox-list">
          {matches.map((i) => (
            <button
              key={i.id}
              type="button"
              className="combobox-item"
              onMouseDown={(e) => {
                e.preventDefault()
                setQuery(i.name)
                onChange(i.name)
                setOpen(false)
              }}
            >
              <span>{i.name}</span>
              <span className="muted small">{i.category}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}