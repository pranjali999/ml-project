import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const defaultForm = {
  state: '',
  crop: '',
  season: '',
  soil: 'unknown',
  rainfall: 850,
  area: 12,
  temperature: 28,
}

const PredictionContext = createContext(null)

export function PredictionProvider({ children }) {
  const [form, setForm] = useState({ ...defaultForm })

  const updateField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const setFormValues = useCallback((partial) => {
    setForm((prev) => ({ ...prev, ...partial }))
  }, [])

  const resetForm = useCallback(() => {
    setForm({ ...defaultForm })
  }, [])

  const value = useMemo(
    () => ({ form, setForm, updateField, setFormValues, resetForm }),
    [form, updateField, setFormValues, resetForm],
  )

  return (
    <PredictionContext.Provider value={value}>
      {children}
    </PredictionContext.Provider>
  )
}

export function usePredictionForm() {
  const ctx = useContext(PredictionContext)
  if (!ctx) throw new Error('usePredictionForm must be used within PredictionProvider')
  return ctx
}
