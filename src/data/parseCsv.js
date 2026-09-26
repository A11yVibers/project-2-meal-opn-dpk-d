export function parseCsv(text) {
  const rows = []
  let record = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else {
      if (c === '"') {
        inQuotes = true
      } else if (c === ',') {
        record.push(field)
        field = ''
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++
        record.push(field)
        field = ''
        rows.push(record)
        record = []
      } else {
        field += c
      }
    }
  }
  if (field !== '' || record.length > 0) {
    record.push(field)
    rows.push(record)
  }

  if (rows.length === 0) return []
  const header = rows[0].map((h) => h.replace(/^\uFEFF/, '').trim())
  return rows.slice(1).map((row) => {
    const obj = {}
    header.forEach((key, idx) => {
      obj[key] = row[idx] == null ? '' : row[idx]
    })
    return obj
  }).filter((r) => Object.values(r).some((v) => v !== ''))
}