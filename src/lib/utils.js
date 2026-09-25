import { APPROVED_IMAGES } from '../approved-images.js'

export const PLACEHOLDER_IMAGE = APPROVED_IMAGES.placeholder

export const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export const STORAGE_KEYS = {
  userRecipes: 'mealplan.userRecipes',
  mealPlan: 'mealplan.mealPlan',
  pantry: 'mealplan.pantry',
}

export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} hr`
  return `${h} hr ${m} min`
}

// Returns the date (YYYY-MM-DD) of a given weekday index (0 = Mon) within a week anchored to an anchor Monday.
export function dateKeyForWeek(weekMonday, dayIndex) {
  const date = new Date(weekMonday)
  date.setDate(date.getDate() + dayIndex)
  return date.toISOString().slice(0, 10)
}

export function mondayOfWeek(date) {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7 // Monday = 0
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

export function todayMonday() {
  return mondayOfWeek(new Date())
}

export function shiftWeek(weekMondayISO, delta) {
  const d = new Date(weekMondayISO + 'T00:00:00')
  d.setDate(d.getDate() + delta * 7)
  return d.toISOString().slice(0, 10)
}

export function formatWeekRange(weekMondayISO) {
  const start = new Date(weekMondayISO + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

export function formatShortDate(isoDate) {
  if (!isoDate) return ''
  const d = new Date(isoDate + 'T00:00:00')
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}