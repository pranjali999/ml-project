import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const KEY = 'agrimind-prediction-history'

const HistoryContext = createContext(null)

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function HistoryProvider({ children }) {
  const [items, setItems] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items))
    } catch {
      /* ignore */
    }
  }, [items])

  const addEntry = useCallback((entry) => {
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now())
    const record = {
      id,
      createdAt: new Date().toISOString(),
      ...entry,
    }
    setItems((prev) => [record, ...prev].slice(0, 50))
    return id
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo(() => ({ items, addEntry, clear }), [items, addEntry, clear])

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>
}

export function useHistory() {
  const ctx = useContext(HistoryContext)
  if (!ctx) throw new Error('useHistory must be used within HistoryProvider')
  return ctx
}
