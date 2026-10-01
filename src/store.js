import { useEffect, useState } from 'react'

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function usePersistedState(key, fallback) {
  const [state, setState] = useState(() => read(key, fallback))
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      /* ignore quota errors */
    }
  }, [key, state])
  return [state, setState]
}

export { usePersistedState, read }