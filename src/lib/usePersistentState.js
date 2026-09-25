import { useEffect, useState } from 'react'

export function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored != null) return JSON.parse(stored)
    } catch (e) {
      /* ignore */
    }
    return initialValue
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      /* ignore */
    }
  }, [key, value])

  return [value, setValue]
}