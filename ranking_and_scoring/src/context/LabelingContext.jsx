import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const LabelingContext = createContext(null)

export function LabelingProvider({ children }) {
  const [state, setState] = useState(() => ({
    selections: {},
    startedAt: new Date().toISOString(),
  }))

  const updateSelection = useCallback((templateId, payload) => {
    setState((prev) => {
      const existing = prev.selections[templateId]
      const timestamp = new Date().toISOString()

      return {
        ...prev,
        selections: {
          ...prev.selections,
          [templateId]: {
            createdAt: existing?.createdAt ?? timestamp,
            updatedAt: timestamp,
            payload,
          },
        },
      }
    })
  }, [])

  const resetSelection = useCallback((templateId) => {
    setState((prev) => {
      if (!prev.selections[templateId]) {
        return prev
      }

      const { [templateId]: _removed, ...rest } = prev.selections
      return {
        ...prev,
        selections: rest,
      }
    })
  }, [])

  const clearAll = useCallback(() => {
    setState(() => ({
      selections: {},
      startedAt: new Date().toISOString(),
    }))
  }, [])

  const value = useMemo(
    () => ({
      selections: state.selections,
      startedAt: state.startedAt,
      updateSelection,
      resetSelection,
      clearAll,
    }),
    [state, updateSelection, resetSelection, clearAll],
  )

  return <LabelingContext.Provider value={value}>{children}</LabelingContext.Provider>
}

export function useLabelingContext() {
  const context = useContext(LabelingContext)
  if (!context) {
    throw new Error('useLabelingContext must be used within a LabelingProvider')
  }

  return context
}
