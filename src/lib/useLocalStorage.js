import { useState, useEffect, useRef, useCallback } from 'react'

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored !== null) return JSON.parse(stored)
    } catch (e) {
      // ignore
    }
    return typeof initialValue === 'function' ? initialValue() : initialValue
  })

  const readyRef = useRef(false)

  useEffect(() => {
    readyRef.current = true
  }, [])

  useEffect(() => {
    if (!readyRef.current) {
      return
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      // ignore quota errors
    }
  }, [key, value])

  const setter = useCallback(
    (next) => {
      setValue((prev) => (typeof next === 'function' ? next(prev) : next))
    },
    []
  )

  return [value, setter, readyRef.current]
}