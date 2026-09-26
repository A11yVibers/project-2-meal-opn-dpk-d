import { useState } from 'react'
import { APPROVED_IMAGES } from '../approved-images'
import { weekKeyForDate, toDateKey } from '../dateUtils'

const SPICE_LABELS = ['Mild', 'Mild-Medium', 'Medium', 'Medium-Hot', 'Hot', 'Very Spicy']

export default function RecipeView({ recipe, app, onBack, onEdit }) {
  const [addToPlanOpen, setAddToPlanOpen] = useState(false)
  const [weekDate, setWeekDate] = useState(() => toDateKey(new Date()))
  const [day, setDay] = useState('')
  const [mealType, setMealType] = useState(recipe.mealTypeName || 'Dinner')

  const img = recipe.coverImageUrl || APPROVED_IMAGES.placeholder

  const handleAdd = () => {
    if (!day) return
    const weekKey = weekKeyForDate(new Date(weekDate + 'T00:00:00'))
    app.setMealSlot(weekKey, day, mealType, recipe.id)
    setAddToPlanOpen(false)
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return (
    <section className="recipe-detail" style={{ '--accent': recipe.accentColor || '#D97757' }}>
      <button className="back" onClick={onBack}>← Back to catalog</button>

      <div className="detail-hero">
        <img className="hero-img" src={img} alt={recipe.title} />
        <div className="hero-body">
          <div className="chips">
            {recipe.cuisineName && <span className="chip cuisine">{recipe.cuisineName}</span>}
            {recipe.mealTypeName && <span className="chip">{recipe.mealTypeName}</span>}
          </div>
          <h1>{recipe.title}</h1>
          {recipe.shortDescription && <p className="muted">{recipe.shortDescription}</p>}
          {(recipe.dietaryTagIds || []).length > 0 && (
            <div className="tags">
              {recipe.dietaryTagIds.map((d) => <span key={d} className="tag diet">{d}</span>)}
            </div>
          )}
          {(recipe.categoryIds || []).length > 0 && (
            <div className="tags">
              {recipe.categoryIds.map((c) => <span key={c} className="tag light">{c}</span>)}
            </div>
          )}
          {recipe.sourceUrl && (
            <a className="source-link" href={recipe.sourceUrl} target="_blank" rel="noreferrer">
              {recipe.sourceName || 'Source'} ↗
            </a>
          )}
          <div className="actions">
            <button className="btn primary" onClick={() => setAddToPlanOpen(!addToPlanOpen)}>+ Add to meal plan</button>
            {!recipe.seed && <button className="btn" onClick={onEdit}>Edit</button>}
          </div>
        </div>
      </div>

      {addToPlanOpen && (
        <div className="panel add-to-plan">
          <h3>Add to meal plan</h3>
          <div className="form-row">
            <label>Week starting</label>
            <input type="date" value={weekDate} onChange={(e) => setWeekDate(e.target.value)} />
            <label>Day</label>
            <select value={day} onChange={(e) => setDay(e.target.value)}>
              <option value="">Choose day...</option>
              {days.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <label>Meal</label>
            <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
              {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <button className="btn primary" onClick={handleAdd} disabled={!day}>Add</button>
          </div>
        </div>
      )}

      <div className="detail-grid">
        <div className="detail-col">
          <div className="stat-card">
            <div className="stat"><span className="stat-num">{recipe.servings}</span><span>Servings</span></div>
            <div className="stat"><span className="stat-num">{recipe.prepTimeMinutes}</span><span>Prep min</span></div>
            <div className="stat"><span className="stat-num">{recipe.cookTimeMinutes}</span><span>Cook min</span></div>
            <div className="stat"><span className="stat-num">{recipe.totalTimeMinutes}</span><span>Total min</span></div>
          </div>
          <div className="stat-card">
            <div className="spice">
              <span>Spice level</span>
              <div className="flames">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < recipe.spiceLevel ? 'lit' : ''}>🌶</span>
                ))}
              </div>
              <span className="muted">{SPICE_LABELS[recipe.spiceLevel]}</span>
            </div>
            {recipe.difficulty > 0 && (
              <div className="difficulty">
                <span>Difficulty</span>
                <span>{recipe.difficulty}/5</span>
              </div>
            )}
          </div>

          <div className="panel">
            <h3>Ingredients</h3>
            {(recipe.sections || []).map((section) => (
              <div key={section.name} className="ingredient-section">
                <h4>{section.name}</h4>
                <ul>
                  {section.items.map((item, i) => (
                    <li key={i}>
                      <span className="qty">{item.quantity} {item.unit}</span>
                      {item.name}
                      {item.notes && <span className="muted"> ({item.notes})</span>}
                      {item.optional && <span className="opt"> optional</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {(recipe.sections || []).length === 0 && <p className="muted">No ingredients.</p>}
          </div>
        </div>

        <div className="detail-col">
          <div className="panel">
            <h3>Method</h3>
            <ol className="steps">
              {(recipe.steps || []).map((step, i) => (
                <li key={i}>
                  <span className="step-num">{i + 1}</span>
                  <div className="step-text">
                    {step.instruction}
                    {step.timerMinutes > 0 && <span className="timer">⏱ {step.timerMinutes} min</span>}
                  </div>
                </li>
              ))}
            </ol>
            {(recipe.steps || []).length === 0 && <p className="muted">No steps.</p>}
          </div>
        </div>
      </div>
    </section>
  )
}