import { useState } from 'react'
import {
  CUISINES, DIETARY_TAGS, MEAL_TYPES, RECIPE_CATEGORIES, INGREDIENTS, UNITS,
  ingredientName,
} from './data.js'
import { SpiceDots, ColorSwatches, Toggle, ACCENT_COLORS } from './components.jsx'

const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

function emptyIngredient() {
  return { ingredientId: '', quantity: '', unit: '', optional: false, notes: '' }
}
function emptySection() {
  return { name: 'Main', items: [emptyIngredient()] }
}
function emptyStep() {
  return { instruction: '', timerMinutes: '' }
}

export default function RecipeForm({ initial, onSave, onCancel, weekStart, todayISO }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [sourceUrl, setSourceUrl] = useState(initial?.sourceUrl || '')
  const [cuisineId, setCuisineId] = useState(initial?.cuisineId || '')
  const [mealTypeId, setMealTypeId] = useState(initial?.mealTypeId || '')
  const [dietaryTags, setDietaryTags] = useState(initial?.dietaryTagIds || [])
  const [categories, setCategories] = useState(initial?.categoryIds || [])
  const [servings, setServings] = useState(initial?.servings || 4)
  const [prep, setPrep] = useState(initial?.prepTime || '')
  const [cook, setCook] = useState(initial?.cookTime || '')
  const [spice, setSpice] = useState(initial?.spiceLevel ?? 0)
  const [coverUrl, setCoverUrl] = useState(initial?.coverImageUrl || '')
  const [accent, setAccent] = useState(initial?.accentColor || ACCENT_COLORS[0])
  const [sections, setSections] = useState(initial?.ingredientSections?.length
    ? initial.ingredientSections.map((s) => ({
        name: s.name,
        items: s.items.map((it) => ({
          ingredientId: it.ingredientId || '', quantity: it.quantity ?? '', unit: it.unit || '', optional: !!it.optional, notes: it.notes || '',
        })),
      }))
    : [emptySection()])
  const [steps, setSteps] = useState(initial?.steps?.length
    ? initial.steps.map((s) => ({ instruction: s.instruction, timerMinutes: s.timerMinutes || '' }))
    : [emptyStep()])

  const [includeInSuggestions, setIncludeInSuggestions] = useState(initial?.includeInMealSuggestions ?? true)
  const [addNow, setAddNow] = useState(false)
  const [addSlot, setAddSlot] = useState('Dinner')
  const [addDay, setAddDay] = useState('')
  const [addTime, setAddTime] = useState('18:00')

  const [includeShopping, setIncludeShopping] = useState(initial?.options?.includeInShopping ?? true)
  const [showNutrition, setShowNutrition] = useState(initial?.options?.showNutrition ?? true)
  const [allowSubstitutions, setAllowSubstitutions] = useState(initial?.options?.allowSubstitutions ?? false)
  const [measurement, setMeasurement] = useState(initial?.options?.measurement || 'US')

  const totalTime = (Number(prep) || 0) + (Number(cook) || 0)

  const toggleTag = (list, set, id) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

  function updateSection(si, patch) {
    setSections((prev) => prev.map((s, i) => (i === si ? { ...s, ...patch } : s)))
  }
  function updateIngredient(si, ii, patch) {
    setSections((prev) => prev.map((s, i) => i === si
      ? { ...s, items: s.items.map((it, j) => (j === ii ? { ...it, ...patch } : it)) }
      : s))
  }

  function addIngredient(si) {
    setSections((prev) => prev.map((s, i) => i === si ? { ...s, items: [...s.items, emptyIngredient()] } : s))
  }
  function removeIngredient(si, ii) {
    setSections((prev) => prev.map((s, i) => i === si ? { ...s, items: s.items.filter((_, j) => j !== ii) } : s))
  }
  function addSection() {
    setSections((prev) => [...prev, { name: 'Section', items: [emptyIngredient()] }])
  }
  function removeSection(si) { setSections((prev) => prev.filter((_, i) => i !== si)) }
  function moveSection(si, dir) {
    setSections((prev) => {
      const next = [...prev]
      const t = si + dir
      if (t < 0 || t >= next.length) return prev
      ;[next[si], next[t]] = [next[t], next[si]]
      return next
    })
  }
  function moveIngredient(si, ii, dir) {
    setSections((prev) => prev.map((s, i) => {
      if (i !== si) return s
      const items = [...s.items]
      const t = ii + dir
      if (t < 0 || t >= items.length) return s
      ;[items[ii], items[t]] = [items[t], items[ii]]
      return { ...s, items }
    }))
  }

  function addStep() { setSteps((prev) => [...prev, emptyStep()]) }
  function removeStep(i) { setSteps((prev) => prev.filter((_, j) => j !== i)) }
  function moveStep(i, dir) {
    setSteps((prev) => {
      const next = [...prev]
      const t = i + dir
      if (t < 0 || t >= next.length) return prev
      ;[next[i], next[t]] = [next[t], next[i]]
      return next
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) { alert('Please add a recipe title.'); return }

    let ingredientSections = sections
      .map((s) => ({
        name: s.name.trim() || 'Main',
        items: s.items
          .filter((it) => it.ingredientId || it.quantity)
          .map((it) => {
            const name = it.ingredientId ? ingredientName(it.ingredientId) : ''
            return {
              ingredientId: it.ingredientId,
              ingredientName: name,
              quantity: it.quantity,
              unit: it.unit,
              notes: it.notes,
              optional: !!it.optional,
            }
          }),
      }))
      .filter((s) => s.items.length)

    const cleanedSteps = steps
      .map((s) => ({ instruction: s.instruction.trim(), timerMinutes: Number(s.timerMinutes) || 0 }))
      .filter((s) => s.instruction)

    const recipe = {
      id: initial?.id,
      title: title.trim(),
      shortDescription: '',
      sourceName: '',
      sourceUrl,
      servings: Number(servings) || 1,
      prepTime: Number(prep) || 0,
      cookTime: Number(cook) || 0,
      cuisineId,
      mealTypeId,
      dietaryTagIds: dietaryTags,
      categoryIds: categories,
      difficulty: 1,
      spiceLevel: spice,
      accentColor: accent,
      coverImageUrl: coverUrl,
      includeInMealSuggestions: includeInSuggestions,
      ingredientSections,
      steps: cleanedSteps,
      options: {
        includeInShopping,
        showNutrition,
        allowSubstitutions,
        measurement,
      },
    }

    const planPatch = addNow
      ? (() => {
          const day = addDay || todayISO
          if (!day) return null
          return { day, slot: addSlot, recipe: recipe, time: addTime }
        })()
      : null

    onSave(recipe, planPatch)
  }

  const today = todayISO

  return (
    <form onSubmit={handleSubmit}>
      <div className="row split mb">
        <button type="button" className="back-link" onClick={onCancel}>← Cancel</button>
        <button className="btn primary" type="submit">Save recipe</button>
      </div>

      {/* Recipe details */}
      <div className="panel mb">
        <h3 className="section-title" style={{ marginTop: 0, borderTop: 'none', paddingTop: 0 }}>Recipe details</h3>
        <div className="field">
          <label>Recipe title *</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Honey Garlic Salmon Bowls" />
        </div>
        <div className="field">
          <label>Source link</label>
          <input className="input" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div className="two-col">
          <div className="field">
            <label>Cuisine</label>
            <select className="select" value={cuisineId} onChange={(e) => setCuisineId(e.target.value)}>
              <option value="">Select cuisine</option>
              {CUISINES.map((c) => <option key={c.cuisine_id} value={c.cuisine_id}>{c.cuisine_name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Primary meal type</label>
            <select className="select" value={mealTypeId} onChange={(e) => setMealTypeId(e.target.value)}>
              <option value="">Select meal type</option>
              {MEAL_TYPES.map((m) => <option key={m.meal_type_id} value={m.meal_type_id}>{m.meal_type_name}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Dietary suitability</label>
          <div className="toggle-list">
            {DIETARY_TAGS.map((d) => (
              <Toggle key={d.dietary_tag_id} active={dietaryTags.includes(d.dietary_tag_id)} onClick={() => toggleTag(dietaryTags, setDietaryTags, d.dietary_tag_id)}>
                {d.dietary_tag_name}
              </Toggle>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Recipe categories</label>
          <div className="toggle-list">
            {RECIPE_CATEGORIES.map((c) => (
              <Toggle key={c.category_id} active={categories.includes(c.category_id)} onClick={() => toggleTag(categories, setCategories, c.category_id)}>
                {c.category_name}
              </Toggle>
            ))}
          </div>
        </div>
      </div>

      {/* Timing and yield */}
      <div className="panel mb">
        <h3 className="section-title">Timing and yield</h3>
        <div className="three-col">
          <div className="field">
            <label>Servings</label>
            <div className="row">
              <button type="button" className="icon-btn" onClick={() => setServings((s) => Math.max(1, s - 1))}>−</button>
              <input className="input" type="number" min="1" style={{ width: 70, textAlign: 'center' }} value={servings} onChange={(e) => setServings(Math.max(1, Number(e.target.value) || 1))} />
              <button type="button" className="icon-btn" onClick={() => setServings((s) => s + 1)}>+</button>
            </div>
          </div>
          <div className="field">
            <label>Prep time (min)</label>
            <input className="input" type="number" min="0" value={prep} onChange={(e) => setPrep(e.target.value)} />
          </div>
          <div className="field">
            <label>Cook time (min)</label>
            <input className="input" type="number" min="0" value={cook} onChange={(e) => setCook(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Total time (auto)</label>
          <input className="input" value={`${totalTime} min`} disabled />
        </div>
        <div className="field">
          <label>Spice level</label>
          <SpiceDots value={spice} onChange={setSpice} />
        </div>
      </div>

      {/* Image and appearance */}
      <div className="panel mb">
        <h3 className="section-title">Image and appearance</h3>
        <div className="field">
          <label>Cover image URL</label>
          <input className="input" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://... (leave empty for placeholder)" />
        </div>
        <div className="field">
          <label>Card accent colour</label>
          <ColorSwatches value={accent} onChange={setAccent} />
        </div>
      </div>

      {/* Ingredients */}
      <div className="panel mb">
        <h3 className="section-title">Ingredients</h3>
        {sections.map((section, si) => (
          <div key={si} className="ing-section">
            <div className="section-band">
              <input className="input" style={{ width: 180, fontWeight: 700 }} value={section.name} onChange={(e) => updateSection(si, { name: e.target.value })} />
              <button type="button" className="icon-btn" onClick={() => moveSection(si, -1)}>↑</button>
              <button type="button" className="icon-btn" onClick={() => moveSection(si, 1)}>↓</button>
              {sections.length > 1 && <button type="button" className="icon-btn danger" onClick={() => removeSection(si)}>✕</button>}
            </div>
            {section.items.map((it, ii) => (
              <div className="ing-row" key={ii}>
                <select className="select" value={it.ingredientId} onChange={(e) => updateIngredient(si, ii, { ingredientId: e.target.value })}>
                  <option value="">Select ingredient</option>
                  {INGREDIENTS.map((ing) => <option key={ing.ingredient_id} value={ing.ingredient_id}>{ing.ingredient_name}</option>)}
                </select>
                <input className="input" placeholder="Qty" value={it.quantity} onChange={(e) => updateIngredient(si, ii, { quantity: e.target.value })} />
                <select className="select" value={it.unit} onChange={(e) => updateIngredient(si, ii, { unit: e.target.value })}>
                  <option value="">Unit</option>
                  {UNITS.map((u) => <option key={u.unit_id} value={u.unit_name}>{u.unit_name}</option>)}
                </select>
                <label className="optional"><input type="checkbox" checked={it.optional} onChange={(e) => updateIngredient(si, ii, { optional: e.target.checked })} /> optional</label>
                <div className="row" style={{ gap: 4 }}>
                  <button type="button" className="icon-btn" onClick={() => moveIngredient(si, ii, -1)}>↑</button>
                  <button type="button" className="icon-btn" onClick={() => moveIngredient(si, ii, 1)}>↓</button>
                  <button type="button" className="icon-btn danger" onClick={() => removeIngredient(si, ii)}>✕</button>
                </div>
              </div>
            ))}
            <button type="button" className="btn small" onClick={() => addIngredient(si)}>+ Add ingredient</button>
          </div>
        ))}
        <button type="button" className="btn" onClick={addSection}>+ Add ingredient section</button>
      </div>

      {/* Method */}
      <div className="panel mb">
        <h3 className="section-title">Method</h3>
        {steps.map((st, i) => (
          <div className="step-edit" key={i}>
            <div className="step-head">
              <span>Step {i + 1}</span>
              <span className="grow" />
              <button type="button" className="icon-btn" onClick={() => moveStep(i, -1)}>↑</button>
              <button type="button" className="icon-btn" onClick={() => moveStep(i, 1)}>↓</button>
              <button type="button" className="icon-btn danger" onClick={() => removeStep(i)}>✕</button>
            </div>
            <div className="field">
              <textarea className="textarea" rows={2} placeholder="Describe this step..." value={st.instruction} onChange={(e) => setSteps((prev) => prev.map((x, j) => j === i ? { ...x, instruction: e.target.value } : x))} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Timer / duration (minutes, optional)</label>
              <input className="input" type="number" min="0" style={{ width: 140 }} value={st.timerMinutes} onChange={(e) => setSteps((prev) => prev.map((x, j) => j === i ? { ...x, timerMinutes: e.target.value } : x))} />
            </div>
          </div>
        ))}
        <button type="button" className="btn" onClick={addStep}>+ Add step</button>
      </div>

      {/* Meal planning options */}
      <div className="panel mb">
        <h3 className="section-title">Meal-planning options</h3>
        <div className="field">
          <label className="row" style={{ gap: 8, fontWeight: 600 }}>
            <input type="checkbox" checked={includeInSuggestions} onChange={(e) => setIncludeInSuggestions(e.target.checked)} />
            Make this recipe available in meal-plan suggestions
          </label>
        </div>
        <div className="field">
          <label className="row" style={{ gap: 8, fontWeight: 600 }}>
            <input type="checkbox" checked={addNow} onChange={(e) => setAddNow(e.target.checked)} />
            Immediately add this recipe to the meal plan
          </label>
        </div>
        {addNow && (
          <div className="three-col" style={{ paddingLeft: 24 }}>
            <div className="field">
              <label>Day (within current week)</label>
              <select className="select" value={addDay} onChange={(e) => setAddDay(e.target.value)}>
                <option value={today}>Today</option>
                {buildWeekOptions(weekStart).map((d) => <option key={d.iso} value={d.iso}>{d.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Serving time / slot</label>
              <select className="select" value={addSlot} onChange={(e) => setAddSlot(e.target.value)}>
                {MEAL_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Planned serving time</label>
              <input className="input" type="time" value={addTime} onChange={(e) => setAddTime(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* Recipe options */}
      <div className="panel mb">
        <h3 className="section-title">Recipe options</h3>
        <div className="field">
          <label>Independent options</label>
          <div className="toggle-list">
            <Toggle active={includeShopping} onClick={setIncludeShopping}>Include in shopping lists</Toggle>
            <Toggle active={showNutrition} onClick={setShowNutrition}>Show nutrition info</Toggle>
            <Toggle active={allowSubstitutions} onClick={setAllowSubstitutions}>Allow ingredient substitutions</Toggle>
          </div>
        </div>
        <div className="field">
          <label>Measurement system</label>
          <div className="toggle-list">
            <Toggle active={measurement === 'US'} onClick={() => setMeasurement('US')}>US customary</Toggle>
            <Toggle active={measurement === 'Metric'} onClick={() => setMeasurement('Metric')}>Metric</Toggle>
          </div>
        </div>
      </div>

      <div className="row">
        <button className="btn primary" type="submit">Save recipe</button>
        <button className="btn" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

function buildWeekOptions(weekStart) {
  if (!weekStart) return []
  const out = []
  const base = new Date(weekStart + 'T00:00:00')
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  for (let i = 0; i < 7; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    const iso = toISO(d)
    out.push({ iso, label: `${names[i]} ${d.getDate()}/${d.getMonth() + 1}` })
  }
  return out
}

export function toISO(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}