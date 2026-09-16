import { useEffect, useState } from 'react'

const PREFIX = 'mp:'

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // storage may be unavailable (private mode / quota); ignore
  }
}

export function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => load(key, initialValue))

  useEffect(() => {
    save(key, value)
  }, [key, value])

  return [value, setValue]
}