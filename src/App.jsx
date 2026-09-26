import { useState, useEffect, useMemo, useCallback } from 'react'
import { SEED_RECIPES, PLACEHOLDER_IMAGE, ingredientCategory, ingredientName, SHOPPING_CATEGORIES, cuisineName, mealTypeName, dietaryTagName } from './data.js'
import {
  loadUserRecipes, saveUserRecipes, loadMealPlan, saveMealPlan, loadPantry, savePantry,
  loadWeekStart, saveWeekStart, newId,
} from './storage.js'
import { Chips, formatTime } from './components.jsx'
import RecipeForm, { toISO } from './RecipeForm.jsx'

const VIEWS = ['Catalog', 'Planner', 'Shopping']
const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function mondayOf(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  return d
}
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r }

export default function App() {
  const [allRecipes, setAllRecipes] = useState([])
  const [view, setView] = useState('Catalog')
  const [selectedRecipeId, setSelectedRecipeId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState(null)
  const [mealPlan, setMealPlan] = useState({})
  const [pantry, setPantry] = useState([])
  const [weekStart, setWeekStart] = useState(null)
  const [search, setSearch] = useState('')
  const [searchIng, setSearchIng] = useState('')

  useEffect(() => {
    const existingIds = new Set(loadUserRecipes().map((r) => r.id))
    setAllRecipes([
      ...loadUserRecipes(),
      ...SEED_RECIPES.filter((r) => !existingIds.has(r.id)),
    ])
    setMealPlan(loadMealPlan())
    setPantry(loadPantry())
    const ws = loadWeekStart() || toISO(mondayOf(new Date()))
    setWeekStart(ws)
  }, [])

  useEffect(() => {
    const userRecipes = allRecipes.filter((r) => !r.isSeed)
    saveUserRecipes(userRecipes)
  }, [allRecipes])

  useEffect(() => { saveMealPlan(mealPlan) }, [mealPlan])
  useEffect(() => { savePantry(pantry) }, [pantry])
  useEffect(() => { if (weekStart) saveWeekStart(weekStart) }, [weekStart])

  const todayISO = useMemo(() => toISO(new Date()), [])

  const addRecipe = useCallback((recipe, planPatch) => {
    const newRecipe = { ...recipe, id: recipe.id || newId('U'), isSeed: false }
    setAllRecipes((prev) => {
      const exists = prev.some((r) => r.id === newRecipe.id)
      return exists ? prev.map((r) => (r.id === newRecipe.id ? newRecipe : r)) : [newRecipe, ...prev]
    })
    if (planPatch) {
      setMealPlan((plan) => {
        const key = `${planPatch.day}|${planPatch.slot}`
        const next = { ...plan, [key]: { recipeId: newRecipe.id, time: planPatch.time || '' } }
        return next
      })
    }
    setSelectedRecipeId(newRecipe.id)
    setShowForm(false)
    setEditingRecipe(null)
    setView('Catalog')
  }, [])

  const deleteRecipe = useCallback((id) => {
    setAllRecipes((prev) => prev.filter((r) => r.id !== id))
    setMealPlan((plan) => {
      const next = {}
      Object.entries(plan).forEach(([k, v]) => { if (v.recipeId !== id) next[k] = v })
      return next
    })
  }, [])

  const recipeById = useCallback((id) => allRecipes.find((r) => r.id === id), [allRecipes])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allRecipes
    return allRecipes.filter((r) =>
      r.title.toLowerCase().includes(q) ||
      (r.cuisineId && cuisineName(r.cuisineId).toLowerCase().includes(q)) ||
      (r.mealTypeId && mealTypeName(r.mealTypeId).toLowerCase().includes(q)))
  }, [allRecipes, search])

  const planChange = useCallback((day, slot, recipeId, time) => {
    const key = `${day}|${slot}`
    setMealPlan((plan) => {
      const next = { ...plan }
      if (recipeId == null) delete next[key]
      else next[key] = { recipeId, time: time || '' }
      return next
    })
  }, [])

  return (
    <div className="app">
      <TopBar view={view} setView={setView} onNew={() => { setEditingRecipe(null); setShowForm(true); setView('Catalog'); setSelectedRecipeId(null); }} />
      {showForm ? (
        <RecipeForm
          initial={editingRecipe}
          onSave={addRecipe}
          onCancel={() => { setShowForm(false); setEditingRecipe(null); }}
          weekStart={weekStart}
          todayISO={todayISO}
        />
      ) : view === 'Catalog' ? (
        selectedRecipeId ? (
          <RecipeDetail
            recipe={recipeById(selectedRecipeId)}
            onBack={() => setSelectedRecipeId(null)}
            onEdit={() => { setEditingRecipe(recipeById(selectedRecipeId)); setShowForm(true); }}
            onDelete={deleteRecipe}
            planChange={planChange}
            weekStart={weekStart}
            todayISO={todayISO}
            mealPlan={mealPlan}
            goPlanner={() => setView('Planner')}
          />
        ) : (
          <FireMap
            recipes={filtered}
            search={search}
            setSearch={setSearch}
            onSelect={setSelectedRecipeId}
            onNew={() => { setEditingRecipe(null); setShowForm(true); }}
          />
        )
      ) : view === 'Planner' ? (
        <Planner
          mealPlan={mealPlan}
          recipes={allRecipes}
          weekStart={weekStart}
          setWeekStart={setWeekStart}
          planChange={planChange}
          todayISO={todayISO}
          onSelect={setSelectedRecipeId}
          goCatalog={() => setView('Catalog')}
        />
      ) : (
        <ShoppingList
          mealPlan={mealPlan}
          recipes={allRecipes}
          weekStart={weekStart}
          pantry={pantry}
          setPantry={setPantry}
        />
      )}
    </div>
  )
}

function TopBar({ view, setView, onNew }) {
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <div className="brand">Meal<span>Planner</span></div>
        <div className="tabs">
          {VIEWS.map((v) => (
            <button key={v} className={'tab' + (view === v ? ' active' : '')} onClick={() => setView(v)}>{v}</button>
          ))}
        </div>
        <div className="spacer" />
        <button className="pill-btn" onClick={onNew}>+ New recipe</button>
      </div>
    </div>
  )
}

function FireMap({ recipes, search, setSearch, onSelect, onNew }) {
  return (
    <div>
      <h2 className="h2">Recipes</h2>
      <p className="sub">{recipes.length} recipes</p>
      <div className="toolbar">
        <input className="input search" placeholder="Search recipes..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn primary" onClick={onNew}>+ New recipe</button>
      </div>
      {recipes.length === 0 ? (
        <div className="empty-state">No recipes found.</div>
      ) : (
        <div className="grid">
          {recipes.map((r) => <RecipeCard key={r.id} recipe={r} onSelect={onSelect} />)}
        </div>
      )}
    </div>
  )
}

function RecipeCard({ recipe, onSelect }) {
  return (
    <div className="card" onClick={() => onSelect(recipe.id)}>
      <div className="card-accent" style={{ background: recipe.accentColor || '#D97757' }} />
      <img className="card-thumb" src={recipe.coverImageUrl || PLACEHOLDER_IMAGE} alt={recipe.title} loading="lazy"
        onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE }} />
      <div className="card-body">
        <h3 className="card-title">{recipe.title}</h3>
        <p className="card-desc">{recipe.shortDescription || `${recipe.servings} servings · ${formatTime(recipe.prepTime + recipe.cookTime)}`}</p>
        <Chips recipe={recipe} />
        <div className="card-foot">
          <span>{formatTime(recipe.prepTime + recipe.cookTime)}</span>
          <span>·</span>
          <span>{recipe.servings} servings</span>
        </div>
      </div>
    </div>
  )
}

function RecipeDetail({ recipe, onBack, onEdit, onDelete, planChange, weekStart, todayISO, mealPlan, goPlanner }) {
  if (!recipe) return <div className="empty-state">Recipe not found.</div>
  const total = recipe.prepTime + recipe.cookTime
  const showNutrition = recipe.options?.showNutrition !== false
  return (
    <div>
      <button className="back-link" onClick={onBack}>← Back to recipes</button>
      <div className="detail-hero">
        <div>
          <img className="detail-img" src={recipe.coverImageUrl || PLACEHOLDER_IMAGE} alt={recipe.title}
            onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE }} style={{ borderTop: `6px solid ${recipe.accentColor || '#D97757'}` }} />
        </div>
        <div className="panel">
          <h2 className="h2" style={{ fontSize: 22 }}>{recipe.title}</h2>
          <Chips recipe={recipe} />
          {recipe.sourceUrl && <p style={{ fontSize: 13 }}><a href={recipe.sourceUrl} target="_blank" rel="noreferrer">Source link ↗</a></p>}
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>{recipe.shortDescription}</p>
          <ul className="meta-list">
            <li><strong>Servings</strong>{recipe.servings}</li>
            <li><strong>Prep</strong>{formatTime(recipe.prepTime)}</li>
            <li><strong>Cook</strong>{formatTime(recipe.cookTime)}</li>
            <li><strong>Total</strong>{formatTime(total)}</li>
            <li><strong>Spice</strong>{spiceLabel(recipe.spiceLevel)}</li>
            <li><strong>Measurements</strong>{recipe.options?.measurement || 'US'}</li>
          </ul>
          <div className="detail-actions">
            <AddToPlanMenu recipe={recipe} weekStart={weekStart} todayISO={todayISO} planChange={planChange} mealPlan={mealPlan} onAdded={goPlanner} />
            {!recipe.isSeed && (
              <>
                <button className="btn" onClick={onEdit}>Edit</button>
                <button className="btn" style={{ color: '#c0392b' }} onClick={() => { if (confirm('Delete this recipe?')) onDelete(recipe.id) }}>Delete</button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="panel mt">
        <h3 className="section-title">Ingredients</h3>
        {(recipe.ingredientSections || []).map((sec, i) => (
          <div className="ing-section" key={i}>
            <h4>{sec.name}</h4>
            <ul className="ing-list">
              {sec.items.map((it, j) => (
                <li key={j}>
                  <span className="ing-qty">{(it.quantity ?? '') + (it.unit ? ' ' + it.unit : '')}</span>
                  <span style={{ flex: 1 }}>{it.ingredientName || it.ingredientId}{it.notes ? <span style={{ color: 'var(--muted)' }}> ({it.notes})</span> : ''}</span>
                  {it.optional && <span className="opt-tag">optional</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="panel mt">
        <h3 className="section-title">Method</h3>
        <ol className="steps">
          {(recipe.steps || []).map((s, i) => (
            <li key={i}>
              <span className="step-num">{i + 1}</span>
              <span style={{ flex: 1 }}>{s.instruction}
                {s.timerMinutes > 0 && <span className="step-timer"> ⏱ {s.timerMinutes}m</span>}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {showNutrition && (
        <div className="panel mt">
          <h3 className="section-title">Nutrition</h3>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Nutrition information shown per your recipe options.</p>
        </div>
      )}
    </div>
  )
}

function spiceLabel(level) {
  const l = Number(level) || 0
  if (l <= 0) return 'Mild'
  if (l === 1) return 'Medium'
  if (l === 2) return 'Spicy'
  if (l === 3) return 'Hot'
  return 'Very spicy'
}

function AddToPlanMenu({ recipe, weekStart, todayISO, planChange, mealPlan, onAdded }) {
  const [open, setOpen] = useState(false)
  const [day, setDay] = useState(todayISO)
  const [slot, setSlot] = useState(suggestSlot(recipe))
  const [time, setTime] = useState('')
  const days = buildDays(weekStart)

  function add() {
    const d = day || todayISO
    planChange(d, slot, recipe.id, time)
    setOpen(false)
    onAdded()
  }
  return (
    <div style={{ position: 'relative' }}>
      <button className="btn primary" onClick={() => setOpen((o) => !o)}>+ Add to meal plan</button>
      {open && (
        <div className="panel" style={{ position: 'absolute', top: 40, left: 0, zIndex: 10, width: 260, boxShadow: '0 8px 30px rgba(0,0,0,.18)' }}>
          <div className="field">
            <label>Day</label>
            <select className="select" value={day} onChange={(e) => setDay(e.target.value)}>
              {days.map((d) => <option key={d.iso} value={d.iso}>{d.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Slot</label>
            <select className="select" value={slot} onChange={(e) => setSlot(e.target.value)}>
              {MEAL_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Time (optional)</label>
            <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <button className="btn primary" style={{ width: '100%' }} onClick={add}>Add to plan</button>
        </div>
      )}
    </div>
  )
}

function suggestSlot(recipe) {
  const m = mealTypeName(recipe.mealTypeId)
  if (m === 'Breakfast') return 'Breakfast'
  if (m === 'Lunch') return 'Lunch'
  if (m === 'Snack' || m === 'Dessert') return 'Snack'
  return 'Dinner'
}

function buildDays(weekStart) {
  if (!weekStart) return []
  const base = new Date(weekStart + 'T00:00:00')
  const out = []
  for (let i = 0; i < 7; i++) {
    const d = addDays(base, i)
    out.push({ iso: toISO(d), name: DAY_NAMES[i], cal: `${d.getDate()}/${d.getMonth() + 1}`, label: `${DAY_NAMES[i]} ${d.getDate()}/${d.getMonth() + 1}` })
  }
  return out
}

function Planner({ mealPlan, recipes, weekStart, setWeekStart, planChange, todayISO, onSelect, goCatalog }) {
  const days = buildDays(weekStart)
  const [picking, setPicking] = useState(null)
  const [query, setQuery] = useState('')

  function nav(dir) {
    const base = new Date(weekStart + 'T00:00:00')
    setWeekStart(toISO(addDays(base, dir * 7)))
  }

  const suggestible = recipes.filter((r) => r.includeInMealSuggestions !== false)
  const q = query.trim().toLowerCase()
  const candidates = q ? suggestible.filter((r) => r.title.toLowerCase().includes(q)) : suggestible

  return (
    <div>
      <h2 className="h2">Weekly meal planner</h2>
      <div className="planner-nav">
        <button className="btn" onClick={() => nav(-1)}>← Week</button>
        <span className="week-label">{days[0]?.cal || ''} – {days[6]?.cal || ''}</span>
        <button className="btn" onClick={() => nav(1)}>Week →</button>
        <div className="spacer" />
        {isCurrentWeek(weekStart) && <span style={{ color: 'var(--muted)', fontSize: 12 }}>This week</span>}
      </div>

      <div className="planner-grid">
        {days.map((d) => (
          <div className="day-col" key={d.iso}>
            <div className="day-head">
              <div>{d.name}</div>
              <div className="date">{d.cal}</div>
            </div>
            {MEAL_SLOTS.map((slot) => {
              const key = `${d.iso}|${slot}`
              const entry = mealPlan[key]
              const recipe = entry ? recipes.find((r) => r.id === entry.recipeId) : null
              return (
                <div className="slot" key={slot}>
                  <div className="slot-label">{slot}</div>
                  {recipe ? (
                    <div className="slot-recipe">
                      <span style={{ cursor: 'pointer' }} onClick={() => onSelect(recipe.id)}>{recipe.title}</span>
                      {entry.time && <div style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 11 }}>🕒 {entry.time}</div>}
                      <div style={{ marginTop: 2 }}>
                        <button className="btn small" onClick={() => setPicking({ day: d.iso, slot })}>Replace</button>
                        <button className="btn small" style={{ marginLeft: 4, color: '#c0392b' }} onClick={() => planChange(d.iso, slot, null)}>Remove</button>
                      </div>
                    </div>
                  ) : (
                    <div className="slot-empty" onClick={() => setPicking({ day: d.iso, slot })}>+ Add</div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {picking && (
        <PickerModal
          picking={picking}
          setPicking={setPicking}
          candidates={candidates}
          query={query}
          setQuery={setQuery}
          planChange={planChange}
        />
      )}
    </div>
  )

  function isCurrentWeek(ws) {
    return toISO(mondayOf(new Date())) === ws
  }
}

function PickerModal({ picking, setPicking, candidates, query, setQuery, planChange }) {
  const [time, setTime] = useState('')
  const [confirming, setConfirming] = useState(null)
  if (confirming) {
    const r = candidates.find((c) => c.id === confirming)
    return (
      <div className="panel" style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', zIndex: 50, width: 360, boxShadow: '0 12px 40px rgba(0,0,0,.25)' }}>
        <h3 className="section-title">{r ? r.title : 'Confirm'}</h3>
        <div className="field"><label>Serving time (optional)</label><input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
        <div className="row">
          <button className="btn primary" style={{ flex: 1 }} onClick={() => { planChange(picking.day, picking.slot, confirming, time); setPicking(null) }}>Assign</button>
          <button className="btn" onClick={() => setConfirming(null)}>Back</button>
        </div>
      </div>
    )
  }
  return (
    <div className="panel" style={{ position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)', zIndex: 50, width: 420, maxHeight: '70vh', overflow: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,.25)' }}>
      <div className="row split mb">
        <h3 className="section-title" style={{ margin: 0 }}>Choose a recipe</h3>
        <button className="icon-btn danger" onClick={() => setPicking(null)}>✕</button>
      </div>
      <input className="input mb" placeholder="Search recipes..." value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
      {candidates.length === 0 ? (
        <div className="empty-state">No matching recipes.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {candidates.map((r) => (
            <li key={r.id} className="shop-item" style={{ cursor: 'pointer' }} onClick={() => setConfirming(r.id)}>
              <img src={r.coverImageUrl || PLACEHOLDER_IMAGE} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }}
                onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE }} />
              <span className="label">{r.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ShoppingList({ mealPlan, recipes, weekStart, pantry, setPantry }) {
  const [checked, setChecked] = useState({})
  const [excludePantry, setExcludePantry] = useState(false)
  const [showOptional, setShowOptional] = useState(true)

  const planKeys = Object.entries(mealPlan)
  const inWeek = weekStart ? planKeys.filter(([k]) => isInWeekKey(k, weekStart)) : planKeys

  const aggregated = useMemo(() => {
    const map = new Map()
    inWeek.forEach(([key, entry]) => {
      const recipe = recipes.find((r) => r.id === entry.recipeId)
      if (!recipe) return
      if (recipe.options?.includeInShopping === false) return
      recipe.ingredientSections?.forEach((sec) => {
        sec.items.forEach((it) => {
          if (!it.ingredientName) return
          if (it.optional && !showOptional) return
          const cat = it.ingredientId ? ingredientCategory(it.ingredientId) : 'Other'
          const ckey = `${cat}|${it.ingredientName}|${it.unit}`
          if (!map.has(ckey)) map.set(ckey, { name: it.ingredientName, unit: it.unit || '', cat, qty: 0, sources: new Set() })
          const entry2 = map.get(ckey)
          entry2.qty += Number(it.quantity) || 0
          entry2.sources.add(recipe.title)
        })
      })
    })
    return Array.from(map.values()).map((e) => ({ ...e, sources: Array.from(e.sources) }))
  }, [inWeek, recipes, showOptional])

  const grouped = useMemo(() => {
    const g = {}
    SHOPPING_CATEGORIES.forEach((c) => { g[c] = [] })
    aggregated.forEach((item) => {
      const cat = SHOPPING_CATEGORIES.includes(item.cat) ? item.cat : 'Other'
      if (!g[cat]) g[cat] = []
      g[cat].push(item)
    })
    g['Other'] = g['Other'] || []
    return g
  }, [aggregated])

  function toggleItem(name) {
    setChecked((c) => ({ ...c, [name]: !c[name] }))
  }

  function isInWeekKey(key, ws) {
    const day = key.split('|')[0]
    const days = buildDays(ws).map((d) => d.iso)
    return days.includes(day)
  }

  return (
    <div>
      <h2 className="h2">Shopping list</h2>
      <p className="sub">{inWeek.length} planned meal{inWeek.length === 1 ? '' : 's'} this week</p>

      <div className="pantry-bar">
        <label className="row" style={{ gap: 8, fontWeight: 600, cursor: 'pointer' }}>
          <input type="checkbox" checked={excludePantry} onChange={(e) => setExcludePantry(e.target.checked)} />
          Exclude pantry items
        </label>
        <label className="row" style={{ gap: 8, fontWeight: 600, cursor: 'pointer' }}>
          <input type="checkbox" checked={showOptional} onChange={(e) => setShowOptional(e.target.checked)} />
          Include optional ingredients
        </label>
      </div>

      {pantry.length > 0 && (
        <div className="pantry-bar">
          {pantry.map((p) => <span className="pantry-tag" key={p}>{p} <button className="icon-btn" style={{ width: 20, height: 20, fontSize: 12 }} onClick={() => setPantry(pantry.filter((x) => x !== p))}>✕</button></span>)}
        </div>
      )}

      <div className="two-col">
        <div className="col">
          {SHOPPING_CATEGORIES.map((cat) => {
            const items = grouped[cat].filter((it) => !(excludePantry && pantry.includes(it.name)))
            return <ShopCategory key={cat} cat={cat} items={items} checked={checked} toggleItem={toggleItem} />
          })}
        </div>
        <div className="col">
          {grouped['Other'] && grouped['Other'].length > 0 && (
            <ShopCategory cat="Other" items={grouped['Other'].filter((it) => !(excludePantry && pantry.includes(it.name)))} checked={checked} toggleItem={toggleItem} />
          )}
          <div className="panel">
            <h3 className="section-title">Pantry</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 10 }}>Mark ingredients you already have to exclude them from the list.</p>
            <PantryAdder pantry={pantry} setPantry={setPantry} options={aggregated.map((a) => a.name)} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ShopCategory({ cat, items, checked, toggleItem }) {
  const list = items.filter((it) => true)
  return (
    <div className="shop-cat">
      <h4>{cat}</h4>
      {list.length === 0 ? (
        <ul><li style={{ color: 'var(--muted)', fontSize: 13, listStyle: 'none' }}>—</li></ul>
      ) : (
        <ul>
          {list.map((it) => {
            const isChecked = !!checked && checked[it.name]
            return (
              <li key={it.name} className={'shop-item' + (isChecked ? ' checked' : '')}>
                <input className="cb" type="checkbox" checked={isChecked} onChange={() => toggleItem(it.name)} />
                <span className="label"><strong>{formatQtyHelper(it.qty, it.unit)}</strong> {it.name}</span>
                <span className="src">{it.sources.join(', ')}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function formatQtyHelper(q, unit) {
  const n = Math.round(q * 100) / 100
  return `${n}${unit ? ' ' + unit : ''}`
}

function PantryAdder({ pantry, setPantry, options }) {
  const [val, setVal] = useState('')
  const filtered = val ? options.filter((o) => o.toLowerCase().includes(val.toLowerCase()) && !pantry.includes(o)) : []
  return (
    <div>
      <div className="row">
        <input className="input" list="pantry-options" value={val} onChange={(e) => setVal(e.target.value)} placeholder="Add an ingredient you have..." style={{ flex: 1 }} />
        <button className="btn" onClick={() => { if (val.trim() && !pantry.includes(val.trim())) { setPantry([...pantry, val.trim()]); setVal('') } }}>Add</button>
      </div>
      <datalist id="pantry-options">
        {options.map((o) => <option key={o} value={o} />)}
      </datalist>
      {filtered.slice(0, 6).map((o) => (
        <div key={o} className="shop-item" style={{ cursor: 'pointer' }} onClick={() => { setPantry([...pantry, o]); setVal('') }}>
          <span className="label">{o}</span>
        </div>
      ))}
    </div>
  )
}