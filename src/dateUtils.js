export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

export function toDateKey(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function startOfWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  return d
}

export function weekKeyForDate(date) {
  return toDateKey(startOfWeek(date))
}

export function formatDateKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function formatDateKeyLong(key) {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export function todayKey() {
  return toDateKey(new Date())
}

let idCounter = 0
export function newId(prefix = 'R') {
  idCounter += 1
  return `${prefix}${Date.now().toString(36)}${idCounter}`
}