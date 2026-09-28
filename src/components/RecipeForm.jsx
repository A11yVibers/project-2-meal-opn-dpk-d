import { useState } from 'react'
import { useApp } from '../App.jsx'
import { APPROVED_IMAGES } from '../approved-images.js'
import { LOOKUP, uid, weekKey, daysOfWeek, dateToKey } from '../store.js'

const defaultColors = [
  '#D97757',
  '#8A9A5B',
  '#C94C4C',
  '#4A7FA5',
  '#8E6BBE',
  '#D4A335',
  '#4E9B8E',
  '#A55B78',
]

const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

function today() {
  return new Date()
}
function weekDays(weekKeyStr) {
  return daysOfWeek(weekKeyStr)
}

export default function RecipeForm() {
  const { store, navigate, upsertRecipe, getEditingRecipe } = useApp()
  const editing = getEditingRecipe()

  const [title, setTitle] = useState(editing?.title || '')
  const [sourceUrl, setSourceUrl] = useState(editing?.sourceUrl || '')
  const [sourceName, setSourceName] = useState(editing?.sourceName || '')
  const [shortDescription, setShortDescription] = useState(editing?.shortDescription || '')
  const [cuisineId, setCuisineId] = useState(editing?.cuisineId || '')
  const [mealTypeId, setMealTypeId] = useState(editing?.mealTypeId || '')
  const [dietaryTagIds, setDietaryTagIds] = useState(editing?.dietaryTagIds || [])
  const [categoryIds, setCategoryIds] = useState(editing?.categoryIds || [])

  const [servings, setServings] = useState(editing?.servings || 4)
  const [prepTime, setPrepTime] = useState(editing?.prepTime || 0)
  const [cookTime, setCookTime] = useState(editing?.cookTime || 0)
  const [spiceLevel, setSpiceLevel] = useState(editing?.spiceLevel || 0)
  const [difficulty, setDifficulty] = useState(editing?.difficulty || 1)

  const [coverImageUrl, setCoverImageUrl] = useState(editing?.coverImageUrl || '')
  const [accentColor, setAccentColor] = useState(editing?.accentColor || '#D97757')

  const [ingredients, setIngredients] = useState(() => {
    if (editing?.ingredients?.length) {
      return editing.ingredients.map((i) => ({ ...i }))
    }
    return [newIngredient('Main')]
  })

  const [steps, setSteps] = useState(() => {
    if (editing?.steps?.length) {
      return editing.steps.map((s, i) => ({ ...s, id: uid('step') }))
    }
    return [newStep()]
  })

  // Meal planning options
  const [includeInMealSuggestions, setIncludeInMealSuggestions] = useState(
    editing?.includeInMealSuggestions ?? true
  )
  const [addToPlan, setAddToPlan] = useState(false)
  const [planWeek, setPlanWeek] = useState(weekKey(new Date()))
  const [planSlot, setPlanSlot] = useState('Dinner')
  const [planDay, setPlanDay] = useState(today())

  // Recipe options menu
  const [includeInShoppingList, setIncludeInShoppingList] = useState(
    editing?.includeInShoppingList ?? true
  )
  const [showNutrition, setShowNutrition] = useState(editing?.showNutrition ?? false)
  const [allowSubstitutions, setAllowSubstitutions] = useState(
    editing?.allowSubstitutions ?? false
  )
  const [measurementUnit, setMeasurementUnit] = useState(editing?.measurementUnit ?? 'us')

  const [error, setError] = useState('')

  const totalTime = (parseInt(prepTime, 10) || 0) + (parseInt(cookTime, 10) || 0)

  function newIngredient(section = 'Main') {
    return { id: uid('ing'), section, ingredientId: '', ingredientName: '', quantity: '', unit: '', notes: '', optional: false }
  }

  function newStep() {
    return { id: uid('step'), instruction: '', timerMinutes: '' }
  }

  function handleIngredientChange(id, field, value) {
    setIngredients((list) =>
      list.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    )
  }

  function handleIngredientSelect(id, ingredientId) {
    const info = LOOKUP.ingredients.find((i) => i.ingredient_id === ingredientId)
    setIngredients((list) =>
      list.map((i) =>
        i.id === id
          ? {
              ...i,
              ingredientId,
              ingredientName: info ? info.ingredient_name : i.ingredientName,
            }
          : i
      )
    )
  }

  function moveIngredient(index, dir) {
    setIngredients((list) => {
      const next = [...list]
      const target = index + dir
      if (target < 0 || target >= next.length) return list
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function moveStep(index, dir) {
    setSteps((list) => {
      const next = [...list]
      const target = index + dir
      if (target < 0 || target >= next.length) return list
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Please give your recipe a title.')
      return
    }

    const recipe = {
      id: editing?.id || uid('rcp'),
      isSeed: false,
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      sourceName: sourceName.trim(),
      sourceUrl: sourceUrl.trim(),
      servings: parseInt(servings, 10) || 1,
      prepTime: parseInt(prepTime, 10) || 0,
      cookTime: parseInt(cookTime, 10) || 0,
      totalTime,
      cuisineId,
      mealTypeId,
      dietaryTagIds,
      categoryIds,
      difficulty: difficulty || 1,
      spiceLevel: spiceLevel || 0,
      accentColor,
      coverImageUrl: coverImageUrl.trim(),
      includeInMealSuggestions,
      includeInShoppingList,
      showNutrition,
      allowSubstitutions,
      measurementUnit,
      ingredients: ingredients.map((i) => ({
        id: i.id,
        section: i.section,
        ingredientId: i.ingredientId,
        ingredientName: i.ingredientName,
        quantity: i.quantity,
        unit: i.unit,
        notes: i.notes,
        optional: !!i.optional,
      })),
      steps: steps.map((s, idx) => ({
        id: s.id,
        instruction: s.instruction,
        timerMinutes: parseInt(s.timerMinutes, 10) || 0,
      })),
    }

    upsertRecipe(recipe)

    // Immediately add to meal plan if requested.
    if (addToPlan) {
      const dayKey = dateToKey(planDay)
      const slotKey = `${dayKey}|${planSlot}`
      store.mealPlan = { ...store.mealPlan, [slotKey]: recipe.id }
    }

    navigate('catalog')
  }

  return (
    <form className="recipe-form" onSubmit={handleSubmit}>
      <div className="form-head">
        <h1>{editing ? 'Edit Recipe' : 'New Recipe'}</h1>
        {error && <p className="form-error">{error}</p>}
      </div>

      {/* ---- Recipe details ---- */}
      <Section title="Recipe details">
        <Field label="Recipe title" required>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Honey Garlic Salmon Bowls"
          />
        </Field>
        <Field label="Short description">
          <textarea
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            rows={2}
            placeholder="A one-line summary shown on the recipe card"
          />
        </Field>
        <div className="form-row">
          <Field label="Source link">
            <input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
            />
          </Field>
          <Field label="Source name">
            <input
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder="e.g. My Kitchen"
            />
          </Field>
        </div>
        <div className="form-row">
          <Field label="Cuisine">
            <select value={cuisineId} onChange={(e) => setCuisineId(e.target.value)}>
              <option value="">Select cuisine</option>
              {LOOKUP.cuisines.map((c) => (
                <option key={c.cuisine_id} value={c.cuisine_id}>
                  {c.cuisine_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Primary meal type">
            <select value={mealTypeId} onChange={(e) => setMealTypeId(e.target.value)}>
              <option value="">Select meal type</option>
              {LOOKUP.mealTypes.map((m) => (
                <option key={m.meal_type_id} value={m.meal_type_id}>
                  {m.meal_type_name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Dietary suitability">
          <CheckGroup
            options={LOOKUP.dietaryTags.map((t) => ({ value: t.dietary_tag_id, label: t.dietary_tag_name }))}
            selected={dietaryTagIds}
            onChange={setDietaryTagIds}
          />
        </Field>

        <Field label="Recipe categories">
          <CheckGroup
            options={LOOKUP.categories.map((c) => ({ value: c.category_id, label: c.category_name }))}
            selected={categoryIds}
            onChange={setCategoryIds}
          />
        </Field>
      </Section>

      {/* ---- Timing and yield ---- */}
      <Section title="Timing and yield">
        <div className="form-row">
          <Field label="Servings">
            <NumberStepper value={servings} onChange={setServings} min={1} />
          </Field>
          <Field label="Prep time (min)">
            <input
              type="number"
              min="0"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
            />
          </Field>
          <Field label="Cook time (min)">
            <input
              type="number"
              min="0"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
            />
          </Field>
          <Field label="Total time">
            <input value={`${totalTime} min`} disabled />
          </Field>
        </div>

        <div className="form-row">
          <Field label="Difficulty (1–5)">
            <input
              type="range"
              min="1"
              max="5"
              value={difficulty}
              onChange={(e) => setDifficulty(parseInt(e.target.value, 10))}
            />
            <span className="range-value">{difficulty}</span>
          </Field>
          <Field label="Spice level">
            <div className="spice-control">
              <span className="spice-label">Mild</span>
              <input
                type="range"
                min="0"
                max="5"
                value={spiceLevel}
                onChange={(e) => setSpiceLevel(parseInt(e.target.value, 10))}
              />
              <span className="spice-label">Very spicy</span>
              <span className="range-value">{'🌶'.repeat(spiceLevel) || 'None'}</span>
            </div>
          </Field>
        </div>
      </Section>

      {/* ---- Image and appearance ---- */}
      <Section title="Image and appearance">
        <Field label="Cover image URL">
          <input
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="Paste an image URL (optional)"
          />
        </Field>
        <div className="cover-preview">
          <img
            src={coverImageUrl || APPROVED_IMAGES.placeholder}
            alt="Cover preview"
            onError={(e) => {
              e.currentTarget.src = APPROVED_IMAGES.placeholder
            }}
          />
        </div>
        <Field label="Card accent color">
          <div className="color-picker">
            {defaultColors.map((c) => (
              <button
                type="button"
                key={c}
                className={accentColor === c ? 'color-swatch active' : 'color-swatch'}
                style={{ background: c }}
                onClick={() => setAccentColor(c)}
                aria-label={`Color ${c}`}
              />
            ))}
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="color-input"
              aria-label="Custom color"
            />
          </div>
        </Field>
      </Section>

      {/* ---- Ingredients ---- */}
      <Section title="Ingredients">
        <IngredientEditor
          ingredients={ingredients}
          onChange={handleIngredientChange}
          onSelect={handleIngredientSelect}
          onMove={moveIngredient}
          onRemove={(id) => setIngredients((l) => l.filter((i) => i.id !== id))}
          onAdd={() => setIngredients((l) => [...l, newIngredient('Main')])}
          onAddSection={() => {
            const section = window.prompt('New section name')?.trim()
            if (section) setIngredients((l) => [...l, newIngredient(section)])
          }}
        />
      </Section>

      {/* ---- Method ---- */}
      <Section title="Method">
        {steps.map((step, i) => (
          <div key={step.id} className="step-editor">
            <span className="step-editor-num">{i + 1}</span>
            <textarea
              value={step.instruction}
              onChange={(e) =>
                setSteps((l) =>
                  l.map((s) => (s.id === step.id ? { ...s, instruction: e.target.value } : s))
                )
              }
              placeholder="Describe this cooking step"
              rows={2}
            />
            <input
              type="number"
              className="timer-input"
              min="0"
              value={step.timerMinutes}
              onChange={(e) =>
                setSteps((l) =>
                  l.map((s) => (s.id === step.id ? { ...s, timerMinutes: e.target.value } : s))
                )
              }
              placeholder="Timer (min)"
            />
            <div className="btn-group">
              <button
                type="button"
                className="btn-icon"
                onClick={() => moveStep(i, -1)}
                disabled={i === 0}
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                className="btn-icon"
                onClick={() => moveStep(i, 1)}
                disabled={i === steps.length - 1}
                title="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                className="btn-icon danger"
                onClick={() => setSteps((l) => l.filter((s) => s.id !== step.id))}
                title="Remove"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="btn" onClick={() => setSteps((l) => [...l, newStep()])}>
          + Add step
        </button>
      </Section>

      {/* ---- Meal-planning options ---- */}
      <Section title="Meal-planning options">
        <Toggle
          label="Make this recipe available in meal-plan suggestions"
          checked={includeInMealSuggestions}
          onChange={setIncludeInMealSuggestions}
        />
        <Toggle label="Add this recipe to the meal plan now" checked={addToPlan} onChange={setAddToPlan} />

        {addToPlan && (
          <div className="plan-options">
            <div className="form-row">
              <Field label="Week starting">
                <input
                  type="date"
                  value={planWeek}
                  onChange={(e) => setPlanWeek(e.target.value)}
                />
              </Field>
              <Field label="Day">
                <select
                  value={dateToKey(planDay)}
                  onChange={(e) => setPlanDay(new Date(e.target.value + 'T00:00'))}
                >
                  {weekDays(planWeek).map((d) => (
                    <option key={dateToKey(d)} value={dateToKey(d)}>
                      {d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Meal slot">
                <select value={planSlot} onChange={(e) => setPlanSlot(e.target.value)}>
                  {MEAL_SLOTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        )}
      </Section>

      {/* ---- Recipe options menu ---- */}
      <Section title="Recipe options">
        <Toggle
          label="Include ingredients in generated shopping lists"
          checked={includeInShoppingList}
          onChange={setIncludeInShoppingList}
        />
        <Toggle
          label="Show nutrition information"
          checked={showNutrition}
          onChange={setShowNutrition}
        />
        <Toggle
          label="Allow ingredient substitutions"
          checked={allowSubstitutions}
          onChange={setAllowSubstitutions}
        />
        <Field label="Measurement system">
          <div className="segmented">
            <button
              type="button"
              className={measurementUnit === 'us' ? 'seg active' : 'seg'}
              onClick={() => setMeasurementUnit('us')}
            >
              US customary
            </button>
            <button
              type="button"
              className={measurementUnit === 'metric' ? 'seg active' : 'seg'}
              onClick={() => setMeasurementUnit('metric')}
            >
              Metric
            </button>
          </div>
        </Field>
      </Section>

      <div className="form-actions">
        <button type="button" className="btn" onClick={() => navigate('catalog')}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {editing ? 'Save changes' : 'Add recipe'}
        </button>
      </div>
    </form>
  )
}

// ---- Sub components ----

function Section({ title, children }) {
  return (
    <section className="form-section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {required && <span className="req">*</span>}
      </span>
      {children}
    </label>
  )
}

function CheckGroup({ options, selected, onChange }) {
  function toggle(value) {
    if (selected.includes(value)) onChange(selected.filter((v) => v !== value))
    else onChange([...selected, value])
  }
  return (
    <div className="check-group">
      {options.map((o) => (
        <label key={o.value} className={selected.includes(o.value) ? 'check active' : 'check'}>
          <input
            type="checkbox"
            checked={selected.includes(o.value)}
            onChange={() => toggle(o.value)}
          />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  )
}

function NumberStepper({ value, onChange, min = 1 }) {
  return (
    <div className="stepper">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))}>
        −
      </button>
      <span>{value}</span>
      <button type="button" onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <button
        type="button"
        className={checked ? 'switch on' : 'switch'}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
      >
        <span className="knob" />
      </button>
    </label>
  )
}

function IngredientEditor({ ingredients, onChange, onSelect, onAdd, onAddSection, onRemove, onMove }) {
  return (
    <div className="ingredient-editor">
      {ingredients.map((ing, idx) => (
        <IngredientRow
          key={ing.id}
          ing={ing}
          idx={idx}
          isLast={idx === ingredients.length - 1}
          isFirst={idx === 0}
          onChange={onChange}
          onSelect={onSelect}
          onRemove={onRemove}
          onMove={onMove}
        />
      ))}
      <div className="btn-row">
        <button type="button" className="btn" onClick={onAdd}>
          + Add ingredient
        </button>
        <button type="button" className="btn" onClick={onAddSection}>
          + Add section
        </button>
      </div>
    </div>
  )
}

function IngredientRow({ ing, idx, isFirst, isLast, onChange, onSelect, onRemove, onMove }) {
  return (
    <div className="ingredient-row">
      <div className="ingredient-section-input">
        <input
          value={ing.section}
          onChange={(e) => onChange(ing.id, 'section', e.target.value)}
          placeholder="Section"
          className="section-input"
        />
      </div>
      <select
        value={ing.ingredientId}
        onChange={(e) => onSelect(ing.id, e.target.value)}
        className="ingredient-select"
      >
        <option value="">Select ingredient</option>
        {LOOKUP.ingredients.map((i) => (
          <option key={i.ingredient_id} value={i.ingredient_id}>
            {i.ingredient_name}
          </option>
        ))}
      </select>
      <input
        value={ing.quantity}
        onChange={(e) => onChange(ing.id, 'quantity', e.target.value)}
        placeholder="Qty"
        className="qty-input"
      />
      <select
        value={ing.unit}
        onChange={(e) => onChange(ing.id, 'unit', e.target.value)}
        className="unit-input"
      >
        <option value="">unit</option>
        {LOOKUP.units.map((u) => (
          <option key={u.unit_id} value={u.unit_name}>
            {u.unit_name}
          </option>
        ))}
      </select>
      <input
        value={ing.notes}
        onChange={(e) => onChange(ing.id, 'notes', e.target.value)}
        placeholder="Notes"
        className="notes-input"
      />
      <label className="optional-toggle">
        <input
          type="checkbox"
          checked={!!ing.optional}
          onChange={(e) => onChange(ing.id, 'optional', e.target.checked)}
        />
        optional
      </label>
      <div className="btn-group">
        <button
          type="button"
          className="btn-icon"
          onClick={() => onMove(idx, -1)}
          disabled={isFirst}
          title="Move up"
        >
          ↑
        </button>
        <button
          type="button"
          className="btn-icon"
          onClick={() => onMove(idx, 1)}
          disabled={isLast}
          title="Move down"
        >
          ↓
        </button>
        <button
          type="button"
          className="btn-icon danger"
          onClick={() => onRemove(ing.id)}
          title="Remove"
        >
          ✕
        </button>
      </div>
    </div>
  )
}