import { PLACEHOLDER_IMAGE, cuisineMap, mealTypeMap } from '../lib/domain'

export function RecipeImage({ recipe, className = '' }) {
  const src = recipe.coverImageUrl || PLACEHOLDER_IMAGE
  return (
    <img
      className={`recipe-image ${className}`}
      src={src}
      alt={recipe.title}
      loading="lazy"
      onError={(e) => {
        if (e.target.src !== PLACEHOLDER_IMAGE) e.target.src = PLACEHOLDER_IMAGE
      }}
    />
  )
}

export function timeLabel(mins) {
  if (!mins) return '0m'
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export function cuisineName(id) {
  return cuisineMap[id] ? cuisineMap[id].cuisine_name : ''
}

export function mealTypeName(id) {
  return mealTypeMap[id] ? mealTypeMap[id].meal_type_name : ''
}

export function spiceLabel(level) {
  const labels = ['Mild', 'Mild+', 'Medium', 'Medium+', 'Spicy', 'Very Spicy']
  return labels[Math.max(0, Math.min(5, level))] || 'Mild'
}