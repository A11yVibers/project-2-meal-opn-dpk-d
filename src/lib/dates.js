export function pad2(n) {
  return String(n).padStart(2, '0')
}

export function toKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

// Week starts on Monday.
export function startOfWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = (d.getDay() + 6) % 7 // Monday = 0
  return addDays(d, -day)
}

export function weekKeyFor(date) {
  return toKey(startOfWeek(date))
}

export function dayKeysForWeek(weekKey) {
  const monday = parseKey(weekKey)
  return Array.from({ length: 7 }, (_, i) => toKey(addDays(monday, i)))
}

export function todayKey() {
  return toKey(new Date())
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function formatDay(key) {
  const d = parseKey(key)
  return `${DAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export function formatShortDay(key) {
  const d = parseKey(key)
  return `${DAYS[d.getDay()].slice(0, 3)} ${d.getDate()}`
}

export function formatWeekLabel(weekKey) {
  const mon = parseKey(weekKey)
  const sun = addDays(mon, 6)
  return `${MONTHS[mon.getMonth()]} ${mon.getDate()} – ${MONTHS[sun.getMonth()]} ${sun.getDate()}, ${sun.getFullYear()}`
}